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
 * @param {string} url 
 * @param {string} encoding 
 * @param {number} timeoutMs - Override timeout (default 8000, detection uses 15000)
 */
async function fetchPageContent(url, encoding = 'utf-8', timeoutMs = 8000) {
  const response = await axios.get(url, {
    responseType: 'arraybuffer',
    timeout: timeoutMs,
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
 * @param {string|null} sinceDate Optional date string to filter older articles
 * @returns {Promise<Array<Object>>} Standardized Article list
 */
async function fetchArticles(sources, maxArticles = 3, sinceDate = null) {
  const allArticles = [];
  const filterDateMs = sinceDate ? new Date(sinceDate).getTime() : null;

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

      // Filter articles by sinceDate if provided
      if (filterDateMs) {
        articles = articles.filter(a => {
          if (!a.published_at) return true; // keep if no date
          const pDate = new Date(a.published_at).getTime();
          if (isNaN(pDate)) return true;
          return pDate >= filterDateMs;
        });
        console.log(`[Scraper] Filtered to ${articles.length} articles since ${sinceDate}`);
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
          throw new Error(`WP-API strategy failed (${err.message}) and RSS fallback failed (${rssErr.message})`);
        }
      } else {
        throw err;
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

  // Helper: extract site title from HTML
  function extractSiteTitle($, fallbackUrl) {
    let title = $('title').text().trim();
    if (title) {
      // Strip everything after common separators: " | ", " - ", " – ", " — "
      title = title.replace(/\s*[|–—\-]\s*.+$/, '').trim();
    }
    if (!title) {
      try { title = new URL(fallbackUrl).hostname.replace('www.', ''); } catch {}
    }
    return title || 'مصدر إخباري جديد';
  }

  // ===================================================================
  // PHASE 1: WordPress API — most reliable if available
  // ===================================================================
  try {
    const wpProbe = await probeWordPressAPI(url);
    if (wpProbe.supported) {
      console.log(`[Scraper Detect] ✓ WordPress API confirmed`);
      let siteTitle = 'موقع ووردبريس جديد';
      try {
        const wpInfo = await axios.get(`${url}/wp-json/`, {
          timeout: 4000,
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
        });
        if (wpInfo.data && wpInfo.data.name) siteTitle = wpInfo.data.name;
      } catch {}

      // Validate: actually fetch 1 post to confirm
      try {
        const testPosts = await axios.get(`${url}/wp-json/wp/v2/posts?per_page=1`, {
          timeout: 5000,
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
        });
        if (Array.isArray(testPosts.data) && testPosts.data.length > 0) {
          console.log(`[Scraper Detect] ✓ WP API validation passed (${testPosts.data.length} post found)`);
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
        console.log(`[Scraper Detect] WP API responded but 0 posts — trying other strategies`);
      } catch (e) {
        console.log(`[Scraper Detect] WP API validation fetch failed: ${e.message} — trying other strategies`);
      }
    }
  } catch (error) {
    console.error(`[Scraper Detect] WP API probe failed: ${error.message}`);
  }

  // ===================================================================
  // PHASE 2: Fetch the main page HTML for RSS discovery + DOM analysis
  // (use 15s timeout for detection — many Arabic news sites are slow)
  // ===================================================================
  let html = '';
  let $ = null;
  let siteTitle = '';
  try {
    html = await fetchPageContent(url, 'utf-8', 15000);
    $ = cheerio.load(html);
    siteTitle = extractSiteTitle($, url);
  } catch (error) {
    console.error(`[Scraper Detect] HTML fetch failed: ${error.message}`);
    // Can't analyze anything without HTML
    return {
      success: false,
      error: `تعذر الوصول إلى الموقع: ${error.message}`
    };
  }

  // ===================================================================
  // PHASE 3: RSS discovery (link tags + common path guesses)
  // ===================================================================
  let discoveredRssUrl = null;

  // 3a. Scan <link> tags for RSS/Atom feeds
  try {
    $('link[type="application/rss+xml"], link[type="application/atom+xml"], link[type="text/xml"]').each((i, el) => {
      const href = $(el).attr('href');
      if (href && !discoveredRssUrl) discoveredRssUrl = href;
    });
    if (discoveredRssUrl && !discoveredRssUrl.startsWith('http')) {
      const parsed = new URL(url);
      discoveredRssUrl = `${parsed.protocol}//${parsed.host}${discoveredRssUrl.startsWith('/') ? '' : '/'}${discoveredRssUrl}`;
    }
  } catch {}

  // 3b. Scan page body for RSS icon/links (e.g. <a href="/rss"> with RSS icon or text)
  if (!discoveredRssUrl) {
    try {
      $('a[href*="rss"], a[href*="feed"], a[href*="atom"], a[href$=".xml"]').each((i, el) => {
        const href = $(el).attr('href');
        if (href && !discoveredRssUrl && !href.includes('feedback') && !href.includes('feedb')) {
          if (href.startsWith('http')) {
            discoveredRssUrl = href;
          } else {
            const parsed = new URL(url);
            discoveredRssUrl = `${parsed.protocol}//${parsed.host}${href.startsWith('/') ? '' : '/'}${href}`;
          }
        }
      });
    } catch {}
  }

  // 3c. Common feed path guesses (expanded list)
  if (!discoveredRssUrl) {
    const feedPaths = [
      '/feed', '/rss', '/rss.xml', '/feed/', '/atom.xml',
      '/index.xml', '/feeds/posts/default', // Blogger
      '/?feed=rss2', '/?feed=atom',          // WordPress alt
      '/blog/feed', '/news/feed', '/ar/feed', '/en/feed',
      '/feed/rss', '/rss/feed.xml', '/feed.xml'
    ];
    for (const p of feedPaths) {
      try {
        const feedUrl = `${url}${p}`;
        const res = await axios.get(feedUrl, {
          timeout: 5000,
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
          maxRedirects: 3
        });
        const data = typeof res.data === 'string' ? res.data : '';
        if (res.status === 200 && (data.includes('<rss') || data.includes('<feed') || data.includes('<?xml'))) {
          discoveredRssUrl = feedUrl;
          console.log(`[Scraper Detect] ✓ Found feed at guessed path: ${p}`);
          break;
        }
      } catch {}
    }
  }

  // 3d. Validate RSS by actually parsing it AND checking item quality
  if (discoveredRssUrl) {
    try {
      console.log(`[Scraper Detect] Testing discovered RSS: ${discoveredRssUrl}`);
      const feedXml = await fetchPageContent(discoveredRssUrl, 'utf-8', 10000);
      const feed = await parser.parseString(feedXml);
      if (feed.items && feed.items.length > 0) {
        // Validate that items actually have title + link (not empty stubs)
        const validItems = feed.items.filter(item => {
          const hasTitle = item.title && item.title.trim().length > 3;
          const hasLink = item.link || item.guid;
          return hasTitle && hasLink;
        });

        if (validItems.length > 0) {
          // Check if items have content (content:encoded or description)
          const itemsWithContent = validItems.filter(item =>
            (item.contentEncoded && item.contentEncoded.trim().length > 50) ||
            (item.content && item.content.trim().length > 50) ||
            (item['content:encoded'] && item['content:encoded'].trim().length > 50) ||
            (item.description && item.description.trim().length > 50)
          );
          const contentNote = itemsWithContent.length > 0
            ? `${itemsWithContent.length}/${validItems.length} items have inline content`
            : 'items have no inline content — full article will be fetched from page';

          console.log(`[Scraper Detect] ✓ RSS validated — ${validItems.length} valid items (${contentNote})`);

          // Try to discover article-page selectors from the first item's link
          const articleSelectors = await discoverArticleSelectors(validItems[0].link || validItems[0].guid, url);

          return {
            success: true,
            strategy: 'rss',
            name: siteTitle,
            rssUrl: discoveredRssUrl,
            encoding: 'utf-8',
            selectors: articleSelectors,
            validationResult: {
              articlesFound: validItems.length,
              withContent: itemsWithContent.length,
              validated: true,
              sampleTitle: validItems[0].title
            }
          };
        }
        console.log(`[Scraper Detect] RSS has ${feed.items.length} items but none have valid title+link — continuing`);
      } else {
        console.log(`[Scraper Detect] RSS feed parsed but contains 0 items — continuing analysis`);
      }
    } catch (e) {
      console.log(`[Scraper Detect] RSS validation failed: ${e.message} — continuing analysis`);
    }
  }

  // ===================================================================
  // PHASE 4: Intelligent HTML DOM analysis — discover article patterns
  // ===================================================================
  console.log(`[Scraper Detect] Analyzing DOM structure for article patterns...`);

  const listSelectors = discoverListSelectors($, url);

  if (listSelectors) {
    console.log(`[Scraper Detect] ✓ Discovered list selectors: container="${listSelectors.container}", title="${listSelectors.title}", link="${listSelectors.link}" (${listSelectors.matchCount} articles found)`);

    // Try to get an article URL to discover detail selectors
    const firstLink = findFirstArticleLink($, listSelectors, url);
    const articleSelectors = firstLink
      ? await discoverArticleSelectors(firstLink, url)
      : { list: listSelectors, article: { title: 'h1', content: 'article, .content, .post-content, .entry-content, main', date: 'time' } };

    // Final validation: dry-run a mini scrape with the discovered config
    const validationResult = await validateDetectedConfig(url, { list: listSelectors, ...articleSelectors });

    return {
      success: true,
      strategy: 'html',
      name: siteTitle,
      rssUrl: discoveredRssUrl || null,
      encoding: 'utf-8',
      selectors: articleSelectors.list ? articleSelectors : { list: listSelectors, ...articleSelectors },
      validationResult
    };
  }

  // ===================================================================
  // PHASE 5: Last resort — return with best-guess selectors from DOM hints
  // ===================================================================
  console.log(`[Scraper Detect] Fallback: using broad heuristic selectors`);
  const fallbackSelectors = buildFallbackSelectors($);

  return {
    success: true,
    strategy: 'html',
    name: siteTitle,
    rssUrl: discoveredRssUrl || null,
    encoding: 'utf-8',
    selectors: fallbackSelectors,
    validationResult: { articlesFound: 0, note: 'لم يتم اكتشاف نمط مقالات واضح — قد تحتاج لضبط المحددات يدوياً' }
  };
}

// =======================================================================
// DOM ANALYSIS HELPERS
// =======================================================================

/**
 * Scans the page DOM for repeating link-rich elements that look like article lists.
 * Tries multiple candidate container selectors, scores each by how many article-like
 * child elements they have (contain <a> with href + text), picks the best.
 */
function discoverListSelectors($, baseUrl) {
  // Candidate container selectors, ordered from most specific to broadest
  const containerCandidates = [
    // Common news CMS patterns
    'article',
    '.post', '.article', '.news-item', '.story', '.entry',
    '.card', '.item', '.block',
    // Specific news site patterns
    '.news-block', '.post-item', '.article-item', '.story-item',
    '.latest-news > *', '.breaking-news > *',
    '.news-card', '.news-entry', '.feed-item',
    // Grid/list wrappers
    '.posts-list > *', '.articles-list > *', '.news-list > *',
    '.grid > *', '.row > .col',
    // Arabic CMS patterns
    '.مقال', '.خبر', '.عنصر', '.بطاقة',
    // WordPress theme patterns
    '.type-post', '.hentry', '.wp-block-post',
    // Broader patterns
    'li:has(a[href])',
    'div:has(> a[href]):has(h2, h3, h4)',
    'section:has(> a[href]):has(h2, h3, h4)',
  ];

  // Title selectors to try within each container
  const titleCandidates = [
    'h2 a', 'h3 a', 'h4 a',
    'h2 > a[href]', 'h3 > a[href]',
    'h2', 'h3', 'h4',
    '.title a', '.entry-title a', '.post-title a', '.card-title a',
    '.headline a', '.news-title a',
    'a.title', 'a[title]',
    'a'
  ];

  let bestResult = null;
  let bestScore = 0;

  const hostname = (() => { try { return new URL(baseUrl).hostname; } catch { return ''; } })();

  for (const containerSel of containerCandidates) {
    try {
      const containers = $(containerSel);
      if (containers.length < 2) continue; // Need at least 2 repeating elements

      // For each title candidate, count how many containers yield a valid article link
      for (const titleSel of titleCandidates) {
        let validArticles = 0;
        let linkSel = titleSel.includes('a') ? titleSel : `${titleSel} a`;
        // fallback for h2/h3/h4 without 'a' descendant
        const useFallbackLink = !titleSel.includes('a');

        containers.each((i, el) => {
          if (i >= 15) return; // Sample first 15
          const titleEl = $(el).find(titleSel);
          if (!titleEl.length) return;

          const title = titleEl.first().text().trim();
          if (!title || title.length < 3) return;

          let href = '';
          if (useFallbackLink) {
            // Try to find an <a> near the title
            const nearA = $(el).find('a[href]').first();
            if (nearA.length) href = nearA.attr('href') || '';
            linkSel = 'a';
          } else {
            const linkEl = $(el).find(linkSel).first();
            href = linkEl.attr('href') || '';
          }

          if (!href) return;
          // Filter out anchors, javascript:, and non-article links
          if (href === '#' || href.startsWith('javascript:') || href.startsWith('mailto:')) return;
          // Filter out links to external domains (likely ads)
          if (href.startsWith('http') && hostname) {
            try {
              const linkHost = new URL(href).hostname;
              if (!linkHost.includes(hostname.replace('www.', '')) && !hostname.includes(linkHost.replace('www.', ''))) return;
            } catch {}
          }

          validArticles++;
        });

        // Score: more articles is better; prefer more specific selectors
        const specificity = containerSel.includes('.') ? 1.2 : 1.0;
        // Bonus for containers that also have date/time elements (more article-like)
        let dateBonus = 1.0;
        try {
          const firstContainer = containers.first();
          if (firstContainer.find('time, .date, .post-date, .entry-date').length > 0) dateBonus = 1.15;
        } catch {}
        const score = validArticles * specificity * dateBonus;

        if (score > bestScore && validArticles >= 2) {
          bestScore = score;
          bestResult = {
            container: containerSel,
            title: titleSel,
            link: useFallbackLink ? 'a' : linkSel,
            matchCount: validArticles
          };
        }
      }
    } catch {}
  }

  return bestResult;
}

/**
 * Finds the first valid article link from the discovered list selectors.
 */
function findFirstArticleLink($, listSelectors, baseUrl) {
  try {
    const containers = $(listSelectors.container);
    for (let i = 0; i < Math.min(containers.length, 5); i++) {
      const el = containers.eq(i);
      const linkEl = el.find(listSelectors.link.includes('a') ? listSelectors.link : 'a').first();
      let href = linkEl.attr('href');
      if (href && href !== '#' && !href.startsWith('javascript:')) {
        if (!href.startsWith('http')) {
          const base = new URL(baseUrl);
          href = `${base.protocol}//${base.host}${href.startsWith('/') ? '' : '/'}${href}`;
        }
        return href;
      }
    }
  } catch {}
  return null;
}

/**
 * Fetches an article page and analyzes its DOM to discover content/title/date selectors.
 * Returns both list and article selectors.
 */
async function discoverArticleSelectors(articleUrl, siteBaseUrl) {
  const defaults = {
    list: { container: 'article', title: 'h2 a', link: 'a' },
    article: { title: 'h1', content: '.entry-content', date: 'time' }
  };

  if (!articleUrl) return defaults;

  try {
    const html = await fetchPageContent(articleUrl, 'utf-8');
    const $ = cheerio.load(html);

    // === Title: find the most prominent h1 ===
    let titleSelector = 'h1';
    const h1Candidates = [
      'h1.entry-title', 'h1.post-title', 'h1.article-title',
      'h1.page-title', 'h1.title', '.entry-title', '.post-title',
      'article h1', '.content h1', 'main h1',
      'h1'
    ];
    for (const sel of h1Candidates) {
      const el = $(sel);
      // Accept 1 or more matches (some pages have multiple h1); pick first with meaningful text
      if (el.length > 0 && el.first().text().trim().length > 5) {
        titleSelector = sel;
        break;
      }
    }

    // === Content: find the main text block ===
    let contentSelector = '.entry-content';
    const contentCandidates = [
      '.entry-content', '.post-content', '.article-content', '.content-body',
      '.article-body', '.post-body', '.story-body', '.news-content',
      '.td-post-content', '.single-content', '.article__body',
      'article .content', '.post .content', 'main .content',
      '.field--name-body', // Drupal
      '.node__content',    // Drupal
      'article', 'main'
    ];
    let bestContentLen = 0;
    for (const sel of contentCandidates) {
      const el = $(sel);
      if (el.length > 0) {
        // Remove noise
        const clone = el.clone();
        clone.find('script, style, iframe, nav, header, footer, .sidebar, .ads, .social-share, .related-posts').remove();
        const textLen = clone.text().trim().length;
        if (textLen > bestContentLen) {
          bestContentLen = textLen;
          contentSelector = sel;
          if (textLen > 500) break; // Good enough
        }
      }
    }

    // === Date: find date/time elements ===
    let dateSelector = 'time';
    const dateCandidates = [
      'time[datetime]', 'time', '.post-date', '.entry-date', '.published',
      '.article-date', '.date', 'span.date', '.created',
      'meta[property="article:published_time"]'
    ];
    for (const sel of dateCandidates) {
      if ($(sel).length > 0) {
        dateSelector = sel;
        break;
      }
    }

    console.log(`[Scraper Detect] Article page analysis — title: "${titleSelector}", content: "${contentSelector}" (${bestContentLen} chars), date: "${dateSelector}"`);

    return {
      list: defaults.list,
      article: { title: titleSelector, content: contentSelector, date: dateSelector }
    };
  } catch (e) {
    console.log(`[Scraper Detect] Could not analyze article page: ${e.message}`);
    return defaults;
  }
}

/**
 * Validates the detected configuration by doing a quick mini-scrape.
 */
async function validateDetectedConfig(url, selectors) {
  try {
    const html = await fetchPageContent(url, 'utf-8');
    const $ = cheerio.load(html);
    const listSel = selectors.list || selectors;
    const containers = $(listSel.container);
    let found = 0;

    containers.each((i, el) => {
      if (i >= 5) return;
      const titleEl = $(el).find(listSel.title);
      const linkEl = $(el).find(listSel.link || 'a');
      if (titleEl.text().trim().length > 2 && linkEl.attr('href')) found++;
    });

    console.log(`[Scraper Detect] Validation: ${found} articles matched with discovered selectors`);
    return { articlesFound: found, validated: found >= 1 };
  } catch {
    return { articlesFound: 0, validated: false };
  }
}

/**
 * Builds fallback selectors by scanning for any <a> tags with decent text inside
 * common wrapper elements.
 */
function buildFallbackSelectors($) {
  // Try to find ANY repeating pattern with links
  const wrappers = ['article', 'div.post', 'div.item', 'div.card', 'li', 'div'];
  for (const w of wrappers) {
    const els = $(w).filter((i, el) => {
      const a = $(el).find('a[href]');
      return a.length > 0 && a.first().text().trim().length > 5;
    });
    if (els.length >= 3) {
      return {
        list: { container: w, title: 'a', link: 'a' },
        article: { title: 'h1', content: 'article, .content, .post-content, .entry-content, main', date: 'time, .date, .published' }
      };
    }
  }
  // Absolute fallback
  return {
    list: { container: 'a[href]', title: '', link: '' },
    article: { title: 'h1', content: 'article, .content, main', date: 'time' }
  };
}

module.exports = {
  probeWordPressAPI,
  fetchPageContent,
  fetchArticles,
  extractFullArticleContent,
  autoDetectStrategy
};
