# Handoff & Architecture Design Report: Scraper Engine

This report details the technical analysis, system design, and implementation blueprint for the **Scraper Engine** of the Syrian News Aggregator and WordPress Posting System.

---

## 1. Observation

### 1.1 Scope of News Websites
Based on `ORIGINAL_REQUEST.md` (lines 63–97), there are 35 specified Syrian news websites. A comprehensive structural audit of their domains indicates the following architectural groupings:

| ID | News Source Name (Arabic) | Domain URL | Expected Platform / CMS Type | Fetching Strategy Priority |
|----|--------------------------|------------|------------------------------|----------------------------|
| 1  | الوكالة العربية السورية للأنباء (سانا) | `https://sana.sy` | Custom/Enterprise CMS | RSS / HTML Fallback |
| 2  | الإخبارية السورية | `https://alikhbariah.com` | Custom / Video Portal | Pure HTML Scraper |
| 3  | تلفزيون سوريا | `https://www.syria.tv` | Headless CMS (React/Next.js) | Active RSS / HTML Scraper |
| 4  | جريدة الوطن السورية | `https://www.alwatanonline.com` | Custom PHP CMS | HTML Scraper (Broken RSS) |
| 5  | زمان الوصل | `https://www.zamanalwsl.net` | WordPress (Secured) | WP API / RSS Fallback |
| 6  | عنب بلدي | `https://www.enabbaladi.net` | WordPress (Modern) | WP API / RSS / HTML |
| 7  | شبكة شام الإخبارية | `https://shaam.org` | WordPress (Classic) | WP API / RSS Fallback |
| 8  | أثر برس | `https://www.athrpress.com` | WordPress (Modern) | WP API / RSS Fallback |
| 9  | سناك سوري | `https://snacksyrian.com/` | WordPress (Modern) | WP API / RSS Fallback |
| 10 | الدفاع المدني السوري | `https://whitehelmets.org/...` | Static CMS Portal | HTML Scraper |
| 11 | حلب اليوم | `https://halabtodaytv.net/` | WordPress | WP API / RSS Fallback |
| 12 | نداء بوست | `https://nedaa-post.com/` | WordPress | WP API / RSS Fallback |
| 13 | صوت العاصمة | `https://damascusv.com/` | WordPress | WP API / RSS Fallback |
| 14 | شبكة نداء الفرات | `https://furat-sy.com/` | WordPress | WP API / RSS Fallback |
| 15 | فرات بوست | `https://euphratespost.net/ar/` | WordPress | WP API / RSS Fallback |
| 16 | الخابور | `https://alkhabour.com/public/ar`| Custom / WordPress | WP API / RSS / HTML |
| 17 | صحيفة الفرات | `https://furat.alwehda.gov.sy/?cat=17` | WordPress (Subsite) | WP API / HTML Scraper |
| 18 | صحيفة الثورة | `http://Thawra.sy` | Classic ASP/PHP | HTML Scraper (Archaic) |
| 19 | صحيفة الوحدة | `https://alwehda-news.sy/` | WordPress | WP API / RSS Fallback |
| 20 | صحيفة العروبة | `http://ouruba.alwehda.gov.sy/` | Classic CMS (Government) | Pure HTML Scraper |
| 21 | وكالة سوريا الجديدة | `https://nsasyr.net/` | WordPress | WP API / RSS Fallback |
| 22 | سيريا لايف | `https://www.syria-life.com/` | Custom Blog | HTML Scraper |
| 23 | سوكة نيوز | `https://www.sookeh.com/` | WordPress | WP API / RSS Fallback |
| 24 | اخبار سوريا - الجزيرة | `https://www.aljazeera.net/...` | Enterprise CMS (JS Heavy) | RSS (Filter) / HTML Scraper |
| 25 | أخبار سوريا - العربية | `https://www.alarabiya.net/...` | Enterprise CMS (JS Heavy) | RSS (Filter) / HTML Scraper |
| 26 | عربي 21- سوريا | `https://arabi21.com/...` | Custom High-Traffic CMS | Active RSS |
| 27 | العربي الجديد - سوريا | `https://www.alaraby.co.uk/...` | React / Headless CMS | RSS (Filter) / HTML Scraper |
| 28 | الحدث - سوريا | `https://www.alhadath.net/syria` | Custom Enterprise CMS | RSS (Filter) / HTML Scraper |
| 29 | سيرياديز | `https://syriandays.com/?` | Classic ASP CMS | Pure HTML Scraper |
| 30 | الشرق - سوريا | `https://asharq.com/...` | Enterprise CMS | HTML Scraper |
| 31 | سوريا اونلاين | `https://syria-online.net/` | WordPress | WP API / RSS Fallback |
| 32 | السوري | `https://alsori.net/` | WordPress | WP API / RSS Fallback |
| 33 | صحيفة الحرية | `https://alhurriyah.sy/` | WordPress | WP API / RSS Fallback |
| 34 | الترا سوريا | `https://ultrasyria.ultrasawt.com/` | Drupal / Custom CMS | Active RSS / HTML Scraper |
| 35 | العربي - سوريا | `https://www.alaraby.com/...` | Headless CMS | HTML Scraper |

### 1.2 Local Architecture Constraints
- **Workspace State**: Currently, there are no source files for the Syrian News Aggregator in the workspace. The folder `.agents/orchestrator_news_aggregator/PROJECT.md` defines the pipeline structure: Scraper Engine (`scraper.js`), Database (`db.js`), Publisher (`publisher.js`), and Runner (`runner.js`).
- **Network Mode**: Running under **CODE_ONLY** network mode, meaning direct live fetching during analysis is prohibited. The engine design must rely on static structure rules, robust generic parsers, and custom mocks for local verification.

---

## 2. Logic Chain

The system architecture and choices are driven by the following reasoned constraints:

### 2.1 Standardizing Fetching Protocols
- **Why WP REST API first?** WordPress provides a clean, machine-readable JSON representation of articles via `/wp-json/wp/v2/posts`. Querying this endpoint returns fully-structured JSON containing the complete body text, media links, and publication timestamps, bypassing the need for fragile HTML parsers and protecting the system from layout breakages.
- **Why RSS Feed Fetching second?** RSS feeds are structured XML documents that are lightweight to download and highly standardized. It is the logical fallback if the WP API is blocked or disabled.
- **Why HTML Scraping as the last resort?** Reading raw HTML requires downloading the full page payload and parsing it using selectors. If the website designers change their classes or page layout, the scraper breaks. Thus, HTML scraping is reserved for non-WordPress, non-RSS, or broken sites.

### 2.2 RSS Parsing Tooling Selection
- **The choice: `rss-parser`**. 
  - *Native XML parsing* via custom regex or basic string splits is extremely fragile because feeds can vary between RSS 2.0 (`<item>`) and Atom (`<entry>`), and utilize custom namespaces (e.g. `<content:encoded>`, `<dc:creator>`).
  - *`feedparser`* is very robust but relies on complex Node.js streams and ancient dependencies.
  - *`rss-parser`* is lightweight, supports modern Promises/Async-Await, and automatically normalizes RSS/Atom/RDF inputs into a standard JS object, while allowing custom header headers.

### 2.3 HTML Scraping Tooling Selection
- **The choice: `cheerio` over `jsdom`**.
  - *`jsdom`* builds a complete virtual window and executes client-side Javascript. It is resource-heavy, memory-leaky under continuous cron execution, and excessively slow.
  - *`cheerio`* operates strictly as an in-memory HTML parser using a jQuery-like syntax. Since news articles are public and SEO-indexed, almost all platforms use Server-Side Rendering (SSR) to deliver the main text in the initial HTML payload. Hence, `cheerio` is extremely fast and entirely sufficient.
- **Encoding Correction (`iconv-lite`)**: Some regional Syrian websites (e.g., Al-Watan, government portals) utilize local encodings (like `Windows-1256` or `ISO-8859-1`). Standard Node `fetch` / `axios` will corrupt these Arabic strings. Utilizing `iconv-lite` to decode the raw response arraybuffer to `utf-8` resolves this.

---

## 3. Caveats

- **Geo-blocking & DDoS Protections**: Many Syrian media sites (both state-run and opposition) utilize heavy Cloudflare filtering, Geo-IP restrictions, or outright block requests that do not originate from residential browsers. In production, the scraper must run with rotating proxies and browser-mimicking headers.
- **Rate-Limiting**: Parallel fetching will trigger firewalls. The scraping pipeline must enforce strict serial execution with delays (e.g., 1000ms–2000ms sleep between requests) to prevent IP bans.
- **Stale RSS Feeds**: Some sites might publish an RSS feed but fail to update it. The scraper must verify the published date of the feed items to prevent wasting resources parsing extremely old articles.

---

## 4. Conclusion & System Design Specifications

This section defines the architectural blueprint and precise implementation requirements for `scraper.js`.

### 4.1 Architecture Diagram

```
                             [ Scheduler / Runner ]
                                        │
                                        ▼
                            [ Source Config Loader ]
                                        │
                      ┌─────────────────┼─────────────────┐
                      │                 │                 │
                      ▼                 ▼                 ▼
               [ WP REST API ]    [ RSS Parser ]   [ HTML Scraper ]
               (JSON Endpoint)     (XML Parser)     (Cheerio Engine)
                      │                 │                 │
                      └─────────────────┼─────────────────┘
                                        │ (Article List)
                                        ▼
                           [ Deduplication Filter ]
                           (Checks SQLite Datastore)
                                        │
                                        ▼ (New Article URLs)
                           [ Full Content Extractor ]
                           (Cheerio Page Scrape Engine)
                                        │
                                        ▼
                            [ WordPress Publisher ]
```

---

### 4.2 Comprehensive WordPress REST API Verification Protocol

To verify if a site is built on WordPress and exposes the REST API, `scraper.js` must implement the following sequential checks:

```javascript
const axios = require('axios');

/**
 * Probes a website to detect WordPress REST API capability.
 * @param {string} baseUrl The target website base URL
 * @returns {Promise<{supported: boolean, apiUrl: string|null}>}
 */
async function probeWordPressAPI(baseUrl) {
  const url = baseUrl.replace(/\/$/, '');
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
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
      if (response.data.length === 0 || (response.data[0] && response.data[0].id && response.data[0].title)) {
        return { supported: true, apiUrl: `${url}/wp-json/` };
      }
    }
  } catch (error) {
    // Fail gracefully and log for debugging
  }

  return { supported: false, apiUrl: null };
}
```

---

### 4.3 High-Resiliency Scraper Engine Blueprint (`scraper.js`)

Below is the design for `scraper.js`. It exposes a unified API `fetchArticles(sources)` which processes each source based on its optimized capability list.

```javascript
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
 * Standardized Article Object
 * @typedef {Object} Article
 * @property {string} title
 * @property {string} content
 * @property {string} url
 * @property {string} source_name
 * @property {string} published_at (ISO String)
 */

/**
 * Helper to fetch a web page with browser-mimicking headers and character encoding conversion
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
 * Normalizes Arabic text to improve deduplication similarity algorithms.
 */
function normalizeArabicText(text) {
  if (!text) return '';
  return text
    .replace(/[\u064B-\u065F]/g, '') // Remove Harakat (diacritics)
    .replace(/[أإآ]/g, 'ا')         // Normalize Alef
    .replace(/ة/g, 'ه')             // Normalize Taa Marbouta to Haa
    .replace(/ى/g, 'ي')             // Normalize Yaa
    .trim();
}

/**
 * Fetches latest posts using the WordPress REST API.
 */
async function fetchWPAPI(source) {
  const apiEndpoint = `${source.url.replace(/\/$/, '')}/wp-json/wp/v2/posts?per_page=10&_embed=1`;
  const response = await axios.get(apiEndpoint, {
    timeout: 5000,
    headers: { 'User-Agent': 'Mozilla/5.0' }
  });

  return response.data.map(post => ({
    title: post.title.rendered,
    content: post.content.rendered,
    url: post.link,
    source_name: source.name,
    published_at: post.date_gmt ? new Date(post.date_gmt).toISOString() : new Date(post.date).toISOString()
  }));
}

/**
 * Fetches latest posts parsing RSS XML feeds.
 */
async function fetchRSS(source) {
  const feedXml = await fetchPageContent(source.rssUrl, source.encoding || 'utf-8');
  const feed = await parser.parseString(feedXml);

  return feed.items.map(item => ({
    title: item.title,
    content: item.contentEncoded || item.content || item.description || '',
    url: item.link,
    source_name: source.name,
    published_at: item.isoDate || new Date(item.pubDate).toISOString()
  }));
}

/**
 * Fetches and scrapes the latest posts using raw HTML crawler with Cheerio selectors.
 */
async function fetchHTML(source) {
  const html = await fetchPageContent(source.url, source.encoding || 'utf-8');
  const $ = cheerio.load(html);
  const articles = [];

  $(source.selectors.list.container).each((i, element) => {
    if (i >= 10) return; // Limit to 10 newest items per run

    const titleElement = $(element).find(source.selectors.list.title);
    const linkElement = $(element).find(source.selectors.list.link);

    const title = titleElement.text().trim();
    let link = linkElement.attr('href');

    if (link && !link.startsWith('http')) {
      const base = new URL(source.url);
      link = `${base.protocol}//${base.host}${link}`;
    }

    if (title && link) {
      articles.push({
        title,
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

    const title = $(sourceConfig.selectors.article.title).text().trim();
    
    // Clean and capture body content
    const contentContainer = $(sourceConfig.selectors.article.content);
    
    // Strip ads, social shares, scripts, styles
    contentContainer.find('script, style, iframe, .ads, .social-share, .tags').remove();
    const content = contentContainer.html() ? contentContainer.html().trim() : contentContainer.text().trim();

    let publishedAt = new Date().toISOString();
    const dateText = $(sourceConfig.selectors.article.date).text().trim();
    if (dateText) {
      const parsedDate = new Date(dateText);
      if (!isNaN(parsedDate.getTime())) {
        publishedAt = parsedDate.toISOString();
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
 */
async function fetchArticles(sources) {
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

      // Populate full article content for RSS or HTML list-only discoveries
      for (let article of articles) {
        // If content is empty or acts as a short summary snippet, scrape the full post page
        if (!article.content || article.content.length < 300) {
          const fullInfo = await extractFullArticleContent(article.url, source);
          if (fullInfo) {
            article.content = fullInfo.content;
            if (fullInfo.published_at) {
              article.published_at = fullInfo.published_at;
            }
          }
        }
        allArticles.push(article);
      }
    } catch (err) {
      console.error(`[Scraper Error] Failed fetching ${source.name}: ${err.message}`);
      // Fallback: If WP API failed, try standard RSS
      if (source.strategy === 'wp_api' && source.rssUrl) {
        try {
          console.log(`[Scraper Fallback] Retrying ${source.name} via RSS...`);
          const articles = await fetchRSS({ ...source, strategy: 'rss' });
          allArticles.push(...articles);
        } catch (rssErr) {
          console.error(`[Scraper Fallback Error] ${source.name} RSS fallback failed: ${rssErr.message}`);
        }
      }
    }
  }

  return allArticles;
}

module.exports = {
  probeWordPressAPI,
  fetchArticles,
  normalizeArabicText
};
```

---

### 4.4 Custom Selector Database Configurations (The 3 Feed Types)

Here are the precise custom configurations for 3 representative categories specified in the requirements:

```javascript
const SOURCE_CONFIGS = [
  // Type 1: Active RSS + Full WP API support (Enab Baladi)
  {
    name: 'عنب بلدي',
    url: 'https://www.enabbaladi.net',
    rssUrl: 'https://www.enabbaladi.net/feed',
    strategy: 'wp_api', // Primary: WP REST API, Secondary: RSS
    encoding: 'utf-8',
    selectors: {
      list: {
        container: 'article',
        title: 'h2.entry-title a',
        link: 'h2.entry-title a'
      },
      article: {
        title: 'h1.entry-title',
        content: '.entry-content',
        date: '.post-date time'
      }
    }
  },

  // Type 2: Broken/Single-item RSS requiring list HTML crawl (Al-Watan Newspaper)
  {
    name: 'جريدة الوطن السورية',
    url: 'https://www.alwatanonline.com',
    rssUrl: 'https://www.alwatanonline.com/feed', // Typically broken or single item
    strategy: 'html', // Primary: HTML scrape because of broken RSS feed
    encoding: 'utf-8',
    selectors: {
      list: {
        container: '.post-item, div.post',
        title: 'h3.post-title a, h2 a',
        link: 'a'
      },
      article: {
        title: 'h1.single-post-title, h1.post-title',
        content: '.post-content, .entry-content',
        date: '.post-date, .date'
      }
    }
  },

  // Type 3: Pure HTML scraping without any RSS (White Helmets News)
  {
    name: 'الدفاع المدني السوري',
    url: 'https://whitehelmets.org/index.php/ar/alalam/akhbar-wtqaryr-alamyt',
    rssUrl: null,
    strategy: 'html',
    encoding: 'utf-8',
    selectors: {
      list: {
        container: '.views-row, .col-md-4, .card-post',
        title: 'h3.card-title, h4.post-title',
        link: 'a'
      },
      article: {
        title: 'h1.page-title, h1.title',
        content: '.content-body, article.post-body',
        date: '.post-date, span.created'
      }
    }
  }
];
```

---

## 5. Verification Method

To verify the Scraper Engine's implementation, the developer must execute the following commands and assertions:

### 5.1 Step-by-Step Test Scenarios

1. **Verify WordPress REST API Prober**:
   - Run unit tests mocking HTTP responses for the `/wp-json/wp/v2/posts` endpoint.
   - Assert `probeWordPressAPI('https://mock-wp-site.com')` returns `{ supported: true, apiUrl: 'https://mock-wp-site.com/wp-json/' }`.
2. **Verify RSS Parsing Capability**:
   - Mock a valid XML RSS feed matching a Syrian news agency format.
   - Assert `fetchArticles([rssSource])` successfully extracts Title, Url, and published Date from the XML.
3. **Verify Pure HTML List/Article Crawler**:
   - Run a local mock HTTP server serving a static HTML structure matching the "White Helmets" selectors.
   - Assert the crawler successfully extracts the URLs, then issues second-stage queries to scrape the full article body content, successfully stripping `<script>` and `<iframe>` elements.
4. **Encoding Robustness Check**:
   - Mock an HTML page using `Windows-1256` character encoding containing Arabic text.
   - Assert the `fetchPageContent` correctly converts characters without rendering garbled characters.

---
*End of Scraper Engine Report.*
