/**
 * scraper.js - High-Resiliency Scraping Engine
 */

const axios = require('axios');
const Parser = require('rss-parser');
const cheerio = require('cheerio');
const iconv = require('iconv-lite');

const parser = new Parser({
  customFields: {
    item: [
      ['content:encoded', 'contentEncoded'],
      ['dc:creator', 'creator']
    ]
  }
});

/**
 * Probes a website base URL to detect WordPress REST API support.
 * @param {string} baseUrl The target website base URL
 * @returns {Promise<{supported: boolean, apiUrl: string|null}>}
 */
async function probeWordPressAPI(baseUrl) {
  const url = baseUrl.replace(/\/$/, '');
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
    'Accept-Language': 'ar,en-US;q=0.7,en;q=0.3'
  };

  try {
    // Stage 1: Try a HEAD request to check HTTP Response Headers for rel="https://api.w.org/"
    const headResponse = await axios.head(url, { headers, timeout: 5000, validateStatus: () => true });
    const linkHeader = headResponse.headers['link'] || headResponse.headers['Link'];
    if (linkHeader && linkHeader.includes('https://api.w.org/')) {
      const match = linkHeader.match(/<([^>]+)>;\s*rel="https:\/\/api\.w\.org\/"/);
      if (match) return { supported: true, apiUrl: match[1] };
    }

    // Stage 2: Probe the standard posts REST route proactively
    const apiRoute = `${url}/wp-json/wp/v2/posts?per_page=3`;
    const response = await axios.get(apiRoute, { headers, timeout: 5000 });
    
    if (response.status === 200 && Array.isArray(response.data)) {
      // Validate schema items to confirm it is indeed a post array
      if (response.data.length === 0 || (response.data[0] && (response.data[0].id || response.data[0].title))) {
        return { supported: true, apiUrl: `${url}/wp-json/` };
      }
    }
  } catch (error) {
    // Fail silently and return false
  }

  return { supported: false, apiUrl: null };
}

/**
 * Helper to fetch a web page with browser-mimicking headers and character encoding conversion.
 */
async function fetchPageContent(url, encoding = 'utf-8') {
  const response = await axios.get(url, {
    responseType: 'arraybuffer',
    timeout: 8000,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Accept-Language': 'ar,en-US;q=0.7,en;q=0.3'
    }
  });

  return iconv.decode(Buffer.from(response.data), encoding);
}

/**
 * Fetches latest posts using the WordPress REST API.
 */
async function fetchWPAPI(source) {
  const url = source.url.replace(/\/$/, '');
  const apiEndpoint = `${url}/wp-json/wp/v2/posts?per_page=10&_embed=1`;
  const response = await axios.get(apiEndpoint, {
    timeout: 8000, // slightly more generous timeout
    headers: { 
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' 
    }
  });

  return response.data.map(post => {
    // Extract title safely
    let title = '';
    if (post.title) {
      if (typeof post.title === 'string') {
        title = post.title;
      } else if (typeof post.title === 'object' && post.title.rendered) {
        title = post.title.rendered;
      } else {
        title = String(post.title);
      }
    }

    // Extract content safely
    let content = '';
    if (post.content) {
      if (typeof post.content === 'string') {
        content = post.content;
      } else if (typeof post.content === 'object' && post.content.rendered) {
        content = post.content.rendered;
      } else {
        content = String(post.content);
      }
    }

    // Explicitly guarantee string type to prevent trim errors
    title = String(title || '');
    content = String(content || '');

    const publishedAt = post.date_gmt ? new Date(post.date_gmt).toISOString() : new Date(post.date).toISOString();

    return {
      title: title.trim(),
      content: content.trim(),
      url: post.link,
      source_name: source.name,
      published_at: publishedAt
    };
  });
}

/**
 * Fetches latest posts by parsing RSS XML feeds.
 */
async function fetchRSS(source) {
  const feedXml = await fetchPageContent(source.rssUrl, source.encoding || 'utf-8');
  const feed = await parser.parseString(feedXml);

  return feed.items.map(item => {
    const title = String(item.title || '');
    const content = String(item.contentEncoded || item.content || item.description || '');
    const url = String(item.link || item.guid || '');
    const publishedAt = item.isoDate || (item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString());

    return {
      title: title.trim(),
      content: content.trim(),
      url: url.trim(),
      source_name: source.name,
      published_at: publishedAt
    };
  });
}

/**
 * Fetches latest posts using a raw HTML crawler with Cheerio selectors.
 */
async function fetchHTML(source) {
  const html = await fetchPageContent(source.url, source.encoding || 'utf-8');
  const $ = cheerio.load(html);
  const articles = [];

  const containerSelector = source.selectors && source.selectors.list && source.selectors.list.container 
    ? source.selectors.list.container 
    : 'article';
  const titleSelector = source.selectors && source.selectors.list && source.selectors.list.title 
    ? source.selectors.list.title 
    : 'h2 a';
  const linkSelector = source.selectors && source.selectors.list && source.selectors.list.link 
    ? source.selectors.list.link 
    : 'a';

  $(containerSelector).each((i, element) => {
    if (i >= 10) return; // Limit to 10 newest items per run

    const titleElement = $(element).find(titleSelector);
    // If the title element is not found, fallback to finding 'a' or using the current element
    const title = titleElement.length > 0 ? titleElement.text().trim() : $(element).text().trim();
    
    // Find the link
    let linkElement = $(element).find(linkSelector);
    if (linkElement.length === 0 && $(element).is('a')) {
      linkElement = $(element);
    }
    
    let link = linkElement.attr('href');

    if (link && !link.startsWith('http')) {
      const base = new URL(source.url);
      link = `${base.protocol}//${base.host}${link.startsWith('/') ? '' : '/'}${link}`;
    }

    if (title && link) {
      articles.push({
        title: title,
        url: link,
        source_name: source.name,
        published_at: new Date().toISOString() // Fallback to current time during list scrape
      });
    }
  });

  return articles;
}

/**
 * Extract full article content from an individual post URL using page-specific selectors.
 */
async function extractFullArticleContent(url, sourceConfig) {
  try {
    const html = await fetchPageContent(url, sourceConfig.encoding || 'utf-8');
    const $ = cheerio.load(html);

    let title = '';
    if (sourceConfig.selectors && sourceConfig.selectors.article && sourceConfig.selectors.article.title) {
      title = $(sourceConfig.selectors.article.title).text().trim();
    }

    let content = '';
    if (sourceConfig.selectors && sourceConfig.selectors.article && sourceConfig.selectors.article.content) {
      const contentContainer = $(sourceConfig.selectors.article.content);
      // Strip ads, social shares, scripts, styles, iframes
      contentContainer.find('script, style, iframe, .ads, .social-share, .tags, header, footer').remove();
      content = contentContainer.html() ? contentContainer.html().trim() : contentContainer.text().trim();
    }

    let publishedAt = new Date().toISOString();
    if (sourceConfig.selectors && sourceConfig.selectors.article && sourceConfig.selectors.article.date) {
      const dateText = $(sourceConfig.selectors.article.date).text().trim();
      if (dateText) {
        const parsedDate = new Date(dateText);
        if (!isNaN(parsedDate.getTime())) {
          publishedAt = parsedDate.toISOString();
        }
      }
    }

    return { title, content, published_at: publishedAt };
  } catch (error) {
    console.error(`Failed to extract full content for ${url}:`, error.message);
    return null;
  }
}

/**
 * Core engine wrapper pipeline
 * @param {Array<Object>} sources Configuration of sources to fetch
 * @param {number} maxArticles Limit of articles to scrape per source (default 3)
 * @returns {Promise<Array<Object>>} Standardized Article list
 */
async function fetchArticles(sources, maxArticles = 3) {
  const allArticles = [];

  for (const source of sources) {
    console.log(`[Scraper] Processing source: ${source.name} using strategy: ${source.strategy}`);
    try {
      let articles = [];
      if (source.strategy === 'wp_api') {
        articles = await fetchWPAPI(source);
      } else if (source.strategy === 'rss') {
        articles = await fetchRSS(source);
      } else if (source.strategy === 'html') {
        articles = await fetchHTML(source);
      }

      // Sort articles by published_at date descending (newest first) before slicing
      articles.sort((a, b) => {
        const dateA = a.published_at ? new Date(a.published_at).getTime() : 0;
        const dateB = b.published_at ? new Date(b.published_at).getTime() : 0;
        const validA = isNaN(dateA) ? 0 : dateA;
        const validB = isNaN(dateB) ? 0 : dateB;
        return validB - validA;
      });

      // Apply per-source dynamic limit if defined, falling back to global maxArticles
      const sourceLimit = source.maxArticles !== undefined ? source.maxArticles : maxArticles;
      console.log(`[Scraper] Applying crawl limit: fetching top ${sourceLimit} articles for ${source.name}`);
      articles = articles.slice(0, sourceLimit);

      // Populate full article content for RSS or HTML list-only discoveries if needed
      for (let article of articles) {
        // If content is empty or acts as a short summary snippet, scrape the full post page
        if ((!article.content || article.content.length < 300) && source.selectors && source.selectors.article) {
          console.log(`[Scraper] Content too short (${article.content ? article.content.length : 0} chars). Fetching full content from: ${article.url}`);
          const fullInfo = await extractFullArticleContent(article.url, source);
          if (fullInfo) {
            if (fullInfo.content) {
              article.content = fullInfo.content;
            }
            if (fullInfo.published_at && fullInfo.published_at !== new Date().toISOString()) {
              article.published_at = fullInfo.published_at;
            }
          }
        }
        
        // Ensure some baseline content exists if it was totally missing
        if (!article.content) {
          article.content = `<p>${article.title}</p>`;
        }

        allArticles.push(article);
      }
    } catch (err) {
      console.error(`[Scraper Error] Failed fetching ${source.name}: ${err.message}`);
      
      // Fallback: If WP API failed, try standard RSS
      if (source.strategy === 'wp_api' && source.rssUrl) {
        try {
          console.log(`[Scraper Fallback] Retrying ${source.name} via RSS...`);
          const fallbackSource = { ...source, strategy: 'rss' };
          let articles = await fetchRSS(fallbackSource);
          
          // Sort fallback articles descending by published_at
          articles.sort((a, b) => {
            const dateA = a.published_at ? new Date(a.published_at).getTime() : 0;
            const dateB = b.published_at ? new Date(b.published_at).getTime() : 0;
            const validA = isNaN(dateA) ? 0 : dateA;
            const validB = isNaN(dateB) ? 0 : dateB;
            return validB - validA;
          });

          // Apply per-source dynamic limit if defined, falling back to global maxArticles
          const sourceLimit = source.maxArticles !== undefined ? source.maxArticles : maxArticles;
          console.log(`[Scraper Fallback] Applying crawl limit: fetching top ${sourceLimit} articles for ${source.name}`);
          articles = articles.slice(0, sourceLimit);
          
          for (let article of articles) {
            if ((!article.content || article.content.length < 300) && source.selectors && source.selectors.article) {
              console.log(`[Scraper Fallback] Content too short (${article.content ? article.content.length : 0} chars). Fetching full content from: ${article.url}`);
              const fullInfo = await extractFullArticleContent(article.url, source);
              if (fullInfo) {
                if (fullInfo.content) {
                  article.content = fullInfo.content;
                }
                if (fullInfo.published_at && fullInfo.published_at !== new Date().toISOString()) {
                  article.published_at = fullInfo.published_at;
                }
              }
            }
            if (!article.content) {
              article.content = `<p>${article.title}</p>`;
            }
            allArticles.push(article);
          }
        } catch (rssErr) {
          console.error(`[Scraper Fallback Error] ${source.name} RSS fallback failed: ${rssErr.message}`);
        }
      }
    }
  }

  return allArticles;
}

/**
 * Automatically probes a URL to discover the best scraping strategy.
 * @param {string} baseUrl Target website main URL
 * @returns {Promise<Object>} Detected strategy, suggested name, rssUrl, and selectors.
 */
async function autoDetectStrategy(baseUrl) {
  let url = baseUrl.trim();
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    url = 'https://' + url;
  }
  url = url.replace(/\/$/, '');

  console.log(`[Scraper Detect] Auto-detecting strategy for: ${url}`);
  
  // 1. Check if WordPress API is supported
  try {
    const wpProbe = await probeWordPressAPI(url);
    if (wpProbe.supported) {
      let siteTitle = 'موقع ووردبريس جديد';
      try {
        const wpInfo = await axios.get(`${url}/wp-json/`, { 
          timeout: 4000,
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
        });
        if (wpInfo.data && wpInfo.data.name) {
          siteTitle = wpInfo.data.name;
        }
      } catch (e) {}

      return {
        success: true,
        strategy: 'wp_api',
        name: siteTitle,
        rssUrl: `${url}/feed`,
        encoding: 'utf-8',
        selectors: {
          list: { container: 'article', title: 'h2.entry-title a', link: 'a' },
          article: { title: 'h1.entry-title', content: '.entry-content', date: 'time' }
        }
      };
    }
  } catch (error) {
    console.error(`[Scraper Detect] WP API probe failed: ${error.message}`);
  }

  // 2. Fetch page HTML to search for RSS feeds and site title
  let html = '';
  let siteTitle = '';
  try {
    html = await fetchPageContent(url, 'utf-8');
    const $ = cheerio.load(html);
    siteTitle = $('title').text().trim();
    if (siteTitle) {
      siteTitle = siteTitle.replace(/\s*[|\-–]\s*.*$/, '').trim();
    }
  } catch (error) {
    console.error(`[Scraper Detect] HTML fetch failed: ${error.message}`);
  }

  if (!siteTitle) {
    try {
      const parsedUrl = new URL(url);
      siteTitle = parsedUrl.hostname.replace('www.', '');
    } catch (e) {
      siteTitle = 'مصدر إخباري جديد';
    }
  }

  // 3. Scan HTML link alternate tags for RSS/Atom
  if (html) {
    try {
      const $ = cheerio.load(html);
      let discoveredRssUrl = null;
      
      $('link[type="application/rss+xml"], link[type="application/atom+xml"], link[type="text/xml"]').each((i, el) => {
        const href = $(el).attr('href');
        if (href) discoveredRssUrl = href;
      });

      if (discoveredRssUrl) {
        if (!discoveredRssUrl.startsWith('http')) {
          const parsed = new URL(url);
          discoveredRssUrl = `${parsed.protocol}//${parsed.host}${discoveredRssUrl.startsWith('/') ? '' : '/'}${discoveredRssUrl}`;
        }
        
        console.log(`[Scraper Detect] Found RSS URL in HTML link tags: ${discoveredRssUrl}`);
        return {
          success: true,
          strategy: 'rss',
          name: siteTitle,
          rssUrl: discoveredRssUrl,
          encoding: 'utf-8',
          selectors: {
            list: { container: 'article', title: 'h2 a', link: 'a' },
            article: { title: 'h1', content: '.content', date: 'time' }
          }
        };
      }
    } catch (err) {
      console.error(`[Scraper Detect] Scanning link tags failed: ${err.message}`);
    }
  }

  // 4. Try common RSS feed path guesses
  const commonFeedPaths = ['/feed', '/rss', '/rss.xml', '/feed/'];
  for (const pathGuess of commonFeedPaths) {
    try {
      const feedUrl = `${url}${pathGuess}`;
      const res = await axios.get(feedUrl, { 
        timeout: 3000, 
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } 
      });
      if (res.status === 200 && typeof res.data === 'string' && (res.data.includes('<rss') || res.data.includes('<feed') || res.data.includes('<?xml'))) {
        console.log(`[Scraper Detect] Guessed valid RSS URL: ${feedUrl}`);
        return {
          success: true,
          strategy: 'rss',
          name: siteTitle,
          rssUrl: feedUrl,
          encoding: 'utf-8',
          selectors: {
            list: { container: 'article', title: 'h2 a', link: 'a' },
            article: { title: 'h1', content: '.content', date: 'time' }
          }
        };
      }
    } catch (e) {
      // silent fail
    }
  }

  // 5. Fallback to raw Cheerio HTML Crawl
  console.log(`[Scraper Detect] Fallback to HTML crawl strategy`);
  return {
    success: true,
    strategy: 'html',
    name: siteTitle,
    rssUrl: null,
    encoding: 'utf-8',
    selectors: {
      list: { container: 'article', title: 'h2 a', link: 'a' },
      article: { title: 'h1', content: '.content', date: 'time' }
    }
  };
}

module.exports = {
  probeWordPressAPI,
  fetchPageContent,
  fetchArticles,
  extractFullArticleContent,
  autoDetectStrategy
};
