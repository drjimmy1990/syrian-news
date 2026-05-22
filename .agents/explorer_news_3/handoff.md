# Handoff Report — WordPress Publisher & Deduplication Architecture Design

This handoff report provides a self-contained, high-density technical design specification for the Syrian News Aggregator's Database, Deduplication, and WordPress Publisher components. It contains complete database schemas, normalization functions, deduplication algorithms (including Jaccard similarity), and a decoupled mock WordPress REST API publisher suitable for dry-run testing under strict `CODE_ONLY` network restrictions.

---

## 1. Observation

We directly observed the following constraints, requirements, and interfaces within the agent configuration files:

1.  **File Path:** `C:\Users\LOQ\Documents\antigravity\wonderful-faraday\.agents\orchestrator_news_aggregator\PROJECT.md`
    *   *Observation 1a (Database Architecture, Line 5):* 
        > `Lightweight Datastore (db.js): SQLite database to track processed news articles with title/url/similarity hashing to prevent duplicates.`
    *   *Observation 1b (Publisher Architecture, Line 6):* 
        > `WordPress Publisher (publisher.js): Integrates with WordPress REST API to create posts, supporting title, content, external source attribution, and draft/publish modes. Includes a full mock fallback for testing without real credentials.`
    *   *Observation 1c (Interface Contracts, Lines 22-24):*
        ```javascript
        - isDuplicate(article): Database check using title/URL/similarity hash. Returns boolean.
        - saveArticle(article): Saves article metadata and hash to SQLite datastore.
        - publishToWordPress(article): Calls WP REST API to create a post. Falls back to mock publisher if WP credentials are not set.
        ```

2.  **File Path:** `C:\Users\LOQ\Documents\antigravity\wonderful-faraday\.agents\orchestrator_news_aggregator\plan.md`
    *   *Observation 2a (Milestone 3 Specifications, Lines 27-33):*
        > `- [ ] Milestone 3: Lightweight Datastore & Deduplication`
        > `Goal: Build SQLite database and deduplication logic with title, URL, or similarity hashing.`
        > `Worker Task: Implement db.js with SQLite schema (articles table, unique hash constraint). Design hashing/similarity checking function (SHA256 of URL/title, or basic similarity metric). Ensure consecutive runs produce 0 duplicate entries in the database or WordPress.`
    *   *Observation 2b (Milestone 4 Specifications, Lines 35-40):*
        > `- [ ] Milestone 4: WordPress Publisher Integration`
        > `Goal: Connect to WP REST API, support creating posts with title, content, external source attribution, and draft/publish status.`
        > `Worker Task: Implement publisher.js utilizing WordPress REST API with proper authorization headers. Design mock capability so the system can run E2E test runs successfully even if real WP credentials are not provided (falling back to a local mock server or mock client).`

3.  **File Path:** `C:\Users\LOQ\Documents\antigravity\wonderful-faraday\.agents\orchestrator_news_aggregator\context.md`
    *   *Observation 3a (Technology Stack & Libraries, Lines 10-15):*
        > `Technology Stack`
        > `- Runtime: Node.js`
        > `- Libraries: Database: better-sqlite3 or standard sqlite3`
    *   *Observation 3b (Network Restrictions, Lines 17-19):*
        > `Network restrictions`
        > `- Parent orchestrator is in CODE_ONLY network mode and cannot query the internet directly.`
        > `- The scraping and WP posting scripts should run in the user's terminal environment... or be validated with mock interfaces during test execution, so that E2E tests pass reliably without real credential requirements.`

4.  **File Path:** `C:\Users\LOQ\Documents\antigravity\wonderful-faraday`
    *   *Observation 4a (Workspace Absence of Source Files):*
        A full recursive workspace file scan confirmed that no source files (such as `db.js`, `publisher.js`, `scraper.js`, or `runner.js`) exist yet. The aggregator system is currently in the **Milestone 1: Design and Exploration Specs** phase.

---

## 2. Logic Chain

Based on these direct observations, we established the following architectural reasoning:

1.  **SQLite Schema & Performance Scaling (Observation 1a, 2a, 3a):**
    *   *Reasoning:* Consecutive scraping runs must identify and prevent duplicates at the database level before any external HTTP traffic hits WordPress. A simple URL check is insufficient because scrapers encounter duplicate URLs with varying query parameters or trailing slashes.
    *   *Reasoning:* Therefore, we need an SQLite schema storing multiple hash types: a unique **normalized URL hash**, a unique **normalized title hash**, and a **content hash**.
    *   *Reasoning:* To prevent the SQLite database from inflating indefinitely and slowing down lookup queries, a **90-day pruning routine** is designed. This keeps the active hash registry compact, leveraging indexed searches while ensuring zero duplicates for active news cycles.

2.  **Robust Normalization & Similarity Deduplication (Observation 2a, 3b):**
    *   *Reasoning:* Scraping Arabic news sites (such as SANA, Syria TV, or Enab Baladi) introduces diacritics variations (e.g. Fatha, Damma, Kasra) and character forms (e.g., 'أ', 'إ', 'آ' vs. 'ا').
    *   *Reasoning:* A simple exact string match will fail if a news desk republished a story with corrected diacritics, modified word order, or slight variations.
    *   *Reasoning:* Therefore, the deduplication algorithm must:
        1. Normalize URLs by stripping protocols, subdomains, trailing slashes, and tracking query parameters (e.g. `utm_source`).
        2. Normalize titles by stripping Arabic diacritics and standardizing Arabic letters.
        3. Perform a primary exact hash check on URL and Title hashes (highly performant indexed O(1) checks).
        4. Perform a secondary **Jaccard Similarity** (word-bag intersection over union) check against recent database records (e.g., past 7 days) if the URL is new but the title is highly similar. This catches title rephrasings (e.g., adding "عاجل" or "مراسلنا:").

3.  **WordPress REST API Publisher & Mock Interceptor (Observation 1b, 2b, 3b):**
    *   *Reasoning:* The script must post successfully to WordPress, mapping title, content, original source URL, original source name, and publish date.
    *   *Reasoning:* WordPress REST API supports **Application Passwords** natively, which provides a highly secure, non-interactive Basic Authentication mapping: `Basic Base64(Username:ApplicationPassword)`.
    *   *Reasoning:* Since the orchestrator is in `CODE_ONLY` network mode, calling the real WordPress REST API during local builds/tests will fail.
    *   *Reasoning:* Therefore, `publisher.js` must implement a **Dry-Run Mock Publisher** that acts as an identical interface, executing the exact same promise signatures and return contracts (mocking response statuses, parsing payloads, validating mapped fields, and returning simulated post IDs) without triggering real network calls.

---

## 3. Caveats

1.  **SQLite Library:** The implementation assumes `better-sqlite3` (synchronous, high-speed, thread-safe wrapper) is used due to its superior performance and simpler syntax in Node.js, but standard `sqlite3` can be swapped in by wrapping queries in Promises.
2.  **Custom Meta Key Registration:** WordPress REST API rejects writing to `meta` fields unless they have been explicitly registered on the WordPress backend using `register_post_meta()` in PHP. To handle cases where custom meta fields are not registered or the user has a vanilla WordPress setup, our design includes a **Post Content Wrap** that appends an elegant, styled HTML blockquote attribution block directly at the bottom of the article's body.
3.  **Near-Duplicate Scoring Window:** Calculating Jaccard similarity against *all* historical database records would become a bottleneck over time. Our design limits similarity checks strictly to database records from the **past 7 days**, which is the maximum logical window in which near-duplicate news revisions occur.

---

## 4. Conclusion & Technical Design Specs

We have designed a complete, actionable technical blueprint for the SQLite Datastore (`db.js`) and WordPress REST API Publisher (`publisher.js`) components.

### 4.1 SQLite Database Schema (`db.js`)

Below is the proposed SQLite schema. It features unique indexes for normalized URL and title hashes, and includes metadata to link processed entries directly to published WordPress post IDs.

```sql
-- SQLite Schema Definition

-- Table: processed_articles
CREATE TABLE IF NOT EXISTS processed_articles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    url TEXT NOT NULL,
    normalized_url TEXT NOT NULL,
    url_hash CHAR(64) NOT NULL UNIQUE,       -- SHA256 of normalized URL
    title_hash CHAR(64) NOT NULL UNIQUE,     -- SHA256 of normalized Title
    content_hash CHAR(64) NOT NULL,          -- SHA256 of cleaned content text
    source_name TEXT NOT NULL,               -- e.g., "سانا" or "تلفزيون سوريا"
    published_at TEXT,                       -- ISO 8601 string from RSS/HTML
    processed_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
    wordpress_post_id INTEGER DEFAULT NULL,  -- Links to WP REST API response
    status TEXT NOT NULL DEFAULT 'processed' -- 'processed', 'published', 'failed'
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_articles_url_hash ON processed_articles(url_hash);
CREATE INDEX IF NOT EXISTS idx_articles_title_hash ON processed_articles(title_hash);
CREATE INDEX IF NOT EXISTS idx_articles_processed_at ON processed_articles(processed_at);
CREATE INDEX IF NOT EXISTS idx_articles_source_name ON processed_articles(source_name);
```

#### Pruning & Maintenance Queries:
To maintain high performance over time, run the following SQL tasks inside the database lifecycle helper:
```sql
-- Delete hashes older than 90 days
DELETE FROM processed_articles WHERE processed_at < datetime('now', '-90 days');

-- Recover deleted space and update query planner stats
VACUUM;
ANALYZE;
```

---

### 4.2 Normalization & Deduplication Logic (`db.js` Implementation)

The following complete Node.js code block defines the normalization functions (handling Arabic diacritics and URLs) and implements `isDuplicate()` using exact hashes and a Jaccard Similarity fallback.

```javascript
/**
 * db.js - SQLite Datastore and Deduplication Engine
 */
const crypto = require('crypto');
const Database = require('better-sqlite3'); // Fallback to 'sqlite3' if needed

class Datastore {
  constructor(dbPath = 'news_aggregator.db') {
    this.db = new Database(dbPath);
    this.initSchema();
  }

  initSchema() {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS processed_articles (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        url TEXT NOT NULL,
        normalized_url TEXT NOT NULL,
        url_hash CHAR(64) NOT NULL UNIQUE,
        title_hash CHAR(64) NOT NULL UNIQUE,
        content_hash CHAR(64) NOT NULL,
        source_name TEXT NOT NULL,
        published_at TEXT,
        processed_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
        wordpress_post_id INTEGER DEFAULT NULL,
        status TEXT NOT NULL DEFAULT 'processed'
      );
      CREATE INDEX IF NOT EXISTS idx_articles_url_hash ON processed_articles(url_hash);
      CREATE INDEX IF NOT EXISTS idx_articles_title_hash ON processed_articles(title_hash);
      CREATE INDEX IF NOT EXISTS idx_articles_processed_at ON processed_articles(processed_at);
    `);
  }

  /**
   * Normalize URLs to ensure consistency
   */
  normalizeUrl(rawUrl) {
    if (!rawUrl) return '';
    try {
      let urlObj = new URL(rawUrl);
      // Strip common tracking parameters and query variables
      const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'fbclid', 's', 'ref'];
      trackingParams.forEach(param => urlObj.searchParams.delete(param));

      // Standardize protocol and domain (lowercase, remove www.)
      let hostname = urlObj.hostname.toLowerCase();
      if (hostname.startsWith('www.')) {
        hostname = hostname.substring(4);
      }

      let pathname = urlObj.pathname;
      // Strip trailing slash
      if (pathname.endsWith('/') && pathname.length > 1) {
        pathname = pathname.slice(0, -1);
      }

      return `https://${hostname}${pathname}${urlObj.search}`;
    } catch (e) {
      // Fallback for broken strings
      return rawUrl.trim().toLowerCase().replace(/\/$/, '');
    }
  }

  /**
   * Normalize Arabic text by removing diacritics (tashkeel) and unifying letters
   */
  normalizeArabicText(text) {
    if (!text) return '';
    let normalized = text.trim();

    // 1. Remove Tashkeel (diacritics: Fatha, Damma, Kasra, Sukun, Shadda, etc.)
    const tashkeelRegex = /[\u064B-\u0652]/g;
    normalized = normalized.replace(tashkeelRegex, '');

    // 2. Unify Alef variations (أ, إ, آ -> ا)
    normalized = normalized.replace(/[\u0622\u0623\u0625]/g, '\u0627');

    // 3. Unify Teh Marbuta (ة -> ه)
    normalized = normalized.replace(/\u0629/g, '\u0647');

    // 4. Unify Alef Maksura (ى -> ي)
    normalized = normalized.replace(/\u0649/g, '\u064A');

    // 5. Remove punctuation, special characters, and double spaces
    normalized = normalized.replace(/[^\w\s\u0600-\u06FF]/g, ' ');
    normalized = normalized.replace(/\s+/g, ' ').trim();

    return normalized.toLowerCase();
  }

  /**
   * SHA256 Utility Helper
   */
  computeHash(text) {
    return crypto.createHash('sha256').update(text).digest('hex');
  }

  /**
   * Jaccard Similarity Scoring (Word Token Bag Intersection / Union)
   */
  calculateJaccardSimilarity(text1, text2) {
    const words1 = new Set(this.normalizeArabicText(text1).split(' ').filter(w => w.length > 1));
    const words2 = new Set(this.normalizeArabicText(text2).split(' ').filter(w => w.length > 1));

    if (words1.size === 0 || words2.size === 0) return 0;

    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);

    return intersection.size / union.size;
  }

  /**
   * Core Deduplication Check Interface
   * Checks if an article already exists (exact hash or near-duplicate similarity)
   */
  isDuplicate(article, similarityThreshold = 0.85) {
    const normalizedUrl = this.normalizeUrl(article.url);
    const urlHash = this.computeHash(normalizedUrl);

    // 1. Exact URL Hash Check - O(1) Index Lookup
    const urlCheck = this.db.prepare('SELECT id FROM processed_articles WHERE url_hash = ?').get(urlHash);
    if (urlCheck) return true;

    // 2. Exact Title Hash Check - O(1) Index Lookup
    const normalizedTitle = this.normalizeArabicText(article.title);
    const titleHash = this.computeHash(normalizedTitle);
    const titleCheck = this.db.prepare('SELECT id FROM processed_articles WHERE title_hash = ?').get(titleHash);
    if (titleCheck) return true;

    // 3. Near-Duplicate Title Similarity Check (past 7 days window)
    const recentArticles = this.db.prepare(`
      SELECT title FROM processed_articles 
      WHERE processed_at >= datetime('now', '-7 days')
    `).all();

    for (const recent of recentArticles) {
      const similarity = this.calculateJaccardSimilarity(article.title, recent.title);
      if (similarity >= similarityThreshold) {
        return true; // Flags as duplicate due to highly similar title phrasing
      }
    }

    return false;
  }

  /**
   * Save Article Signature metadata
   */
  saveArticle(article, wordpressPostId = null) {
    const normalizedUrl = this.normalizeUrl(article.url);
    const urlHash = this.computeHash(normalizedUrl);
    const normalizedTitle = this.normalizeArabicText(article.title);
    const titleHash = this.computeHash(normalizedTitle);
    const contentHash = this.computeHash(article.content || '');

    const stmt = this.db.prepare(`
      INSERT INTO processed_articles 
        (title, url, normalized_url, url_hash, title_hash, content_hash, source_name, published_at, wordpress_post_id, status)
      VALUES 
        (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    try {
      const result = stmt.run(
        article.title,
        article.url,
        normalizedUrl,
        urlHash,
        titleHash,
        contentHash,
        article.source_name,
        article.published_at || null,
        wordpressPostId,
        wordpressPostId ? 'published' : 'processed'
      );
      return result.lastInsertRowid;
    } catch (err) {
      if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        return null; // Silent duplicate catch
      }
      throw err;
    }
  }

  /**
   * Prune hashes older than 90 days to scale database sizing
   */
  pruneOldRecords(days = 90) {
    const stmt = this.db.prepare("DELETE FROM processed_articles WHERE processed_at < datetime('now', ?)");
    const result = stmt.run(`-${days} days`);
    this.db.exec('VACUUM');
    return result.changes;
  }
}

module.exports = Datastore;
```

---

### 4.3 WordPress REST API Publisher Connector (`publisher.js`)

Below is the design of the standard WordPress REST API connector. It implements the native **Application Passwords** credential mapper, features post content wrapping for reliable source attribution, and includes a built-in **Dry-Run Mock mode** for local E2E test runs.

```javascript
/**
 * publisher.js - WordPress REST API Connector and Mock Publisher
 */

class WordPressPublisher {
  constructor(config = {}) {
    this.wpUrl = config.wpUrl || ''; // base URL: e.g., https://mywordpresssite.com
    this.username = config.username || '';
    this.appPassword = config.appPassword || '';
    this.statusMode = config.statusMode || 'draft'; // 'draft' or 'publish'
    this.isDryRun = config.isDryRun !== false; // Default true to prevent active hits unless configured

    // Setup base headers for native Application Passwords auth
    if (this.username && this.appPassword) {
      const creds = Buffer.from(`${this.username}:${this.appPassword}`).toString('base64');
      this.authHeader = `Basic ${creds}`;
    }
  }

  /**
   * Wrap content with elegant, styled HTML blockquotes for source attribution
   */
  formatArticleContent(article) {
    const pubDate = article.published_at 
      ? new Date(article.published_at).toLocaleString('ar-SY', { timeZone: 'Asia/Damascus' }) 
      : 'غير محدد';

    return `
      <div class="syrian-news-article" style="direction: rtl; text-align: right; font-family: tahoma, sans-serif; line-height: 1.8;">
        <!-- Original Article Content Body -->
        <div class="article-body-content">
          ${article.content}
        </div>
        
        <hr class="wp-block-separator" style="margin: 30px 0; border: none; border-top: 1px solid #ddd;" />
        
        <!-- Premium attribution card -->
        <blockquote class="wp-block-quote source-attribution" style="border-right: 4px solid #0056b3; border-left: none; padding-right: 15px; margin: 20px 0; background-color: #f9f9f9; padding: 15px 20px; border-radius: 4px;">
          <p style="margin: 0 0 10px 0; font-size: 14px; color: #555;">
            هذا الخبر مستورد تلقائياً عبر نظام التجميع والنشـر التلقائي من موقع: 
            <strong style="color: #0056b3;">${article.source_name}</strong>
          </p>
          <p style="margin: 0 0 10px 0; font-size: 13px; color: #777;">
            تاريخ النشـر الأصلي: <span>${pubDate}</span>
          </p>
          <p style="margin: 0; font-size: 14px;">
            المصدر الأصلي للخبر: 
            <a href="${article.url}" target="_blank" rel="noopener noreferrer" style="color: #0056b3; text-decoration: underline; font-weight: bold;">
              اضغط هنا لزيارة الرابط الأصلي
            </a>
          </p>
        </blockquote>
      </div>
    `;
  }

  /**
   * Core Post Creation Interface
   */
  async publishArticle(article) {
    if (this.isDryRun || !this.wpUrl || !this.authHeader) {
      return this.publishMock(article);
    }

    const formattedContent = this.formatArticleContent(article);
    
    // WordPress REST API POST Payload
    const payload = {
      title: article.title,
      content: formattedContent,
      status: this.statusMode,
      date: article.published_at ? new Date(article.published_at).toISOString() : new Date().toISOString(),
      meta: {
        source_url: article.url,
        source_name: article.source_name
      }
    };

    const endpoint = `${this.wpUrl.replace(/\/$/, '')}/wp-json/wp/v2/posts`;

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.authHeader
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`WordPress API Error [${response.status}]: ${errorData.message || response.statusText}`);
      }

      const postData = await response.json();
      return {
        success: true,
        postId: postData.id,
        link: postData.link,
        status: postData.status,
        meta: postData.meta
      };
    } catch (err) {
      return {
        success: false,
        error: err.message,
        postId: null
      };
    }
  }

  /**
   * Dry-Run Mock Publisher to satisfy CODE_ONLY restrictions and E2E test runs
   */
  async publishMock(article) {
    // Simulate real network/API processing latency
    await new Promise(resolve => setTimeout(resolve, 150));

    // Simple validation schema mapping checks
    if (!article.title || !article.url || !article.source_name) {
      return {
        success: false,
        error: 'Validation failed: title, url, or source_name missing from scraped article schema',
        postId: null
      };
    }

    // Generate simulated WP rest post responses
    const mockPostId = Math.floor(Math.random() * 90000) + 10000;
    const cleanUrlPart = article.title.trim().replace(/\s+/g, '-').substring(0, 30);
    const mockLink = `${this.wpUrl || 'https://mock-wordpress.local'}/?p=${mockPostId}`;

    return {
      success: true,
      postId: mockPostId,
      link: mockLink,
      status: this.statusMode,
      isMock: true,
      meta: {
        source_url: article.url,
        source_name: article.source_name
      }
    };
  }
}

module.exports = WordPressPublisher;
```

---

## 5. Verification Method

To independently verify the proposed database schema, normalization routines, deduplication algorithms, and publisher interfaces, a standalone verification suite is prepared.

### 5.1 Unit Verification Script (`test_db_publisher.js`)

This executable script asserts happy paths, edge cases, Arabic normalizations, similarity triggers, database constraints, and dry-run publishing interfaces.

```javascript
/**
 * test_db_publisher.js - Self-Contained Verification Runner
 * Execute this to test the complete db.js and publisher.js architecture
 */

const fs = require('fs');
const path = require('path');
const Datastore = require('./db');
const WordPressPublisher = require('./publisher');

async function runVerification() {
  console.log("=== STARTING ARCHITECTURAL VERIFICATION SUITE ===\n");
  const testDbFile = path.join(__dirname, 'test_news_aggregator.db');
  
  // Clean up any old test run DB
  if (fs.existsSync(testDbFile)) {
    fs.unlinkSync(testDbFile);
  }

  const ds = new Datastore(testDbFile);
  console.log("✔ SQLite Database Schema successfully initialized.");

  // Test 1: URL Normalization Verification
  console.log("\n[Test 1] Testing URL Normalization...");
  const rawUrl1 = "https://www.sana.sy/news/123/?utm_source=telegram&ref=main/";
  const rawUrl2 = "http://sana.sy/news/123?utm_campaign=social";
  const normalized1 = ds.normalizeUrl(rawUrl1);
  const normalized2 = ds.normalizeUrl(rawUrl2);
  
  console.log(`- Raw 1: ${rawUrl1} => Normalized: ${normalized1}`);
  console.log(`- Raw 2: ${rawUrl2} => Normalized: ${normalized2}`);
  if (normalized1 === normalized2 && normalized1 === "https://sana.sy/news/123") {
    console.log("✔ URL Normalization verified successfully (stripped subdomains, trailing slashes, tracker parameters).");
  } else {
    throw new Error("✘ URL Normalization failed.");
  }

  // Test 2: Arabic Text Diacritic Stripping Verification
  console.log("\n[Test 2] Testing Arabic Diacritic and Letter Normalization...");
  const titleWithTashkeel = "الْإِخْبَارِيَّةُ السُّورِيَّةُ تَنْشُرُ عَنْ حَلَبٍ";
  const titlePlain = "الاخبارية السورية تنشر عن حلب";
  const normalizedTitle1 = ds.normalizeArabicText(titleWithTashkeel);
  const normalizedTitle2 = ds.normalizeArabicText(titlePlain);
  
  console.log(`- Title with Tashkeel: "${titleWithTashkeel}"\n- Normalized:          "${normalizedTitle1}"`);
  console.log(`- Title plain:         "${titlePlain}"\n- Normalized:          "${normalizedTitle2}"`);
  if (normalizedTitle1 === normalizedTitle2 && normalizedTitle1 === "الاخباريه السوريه تنشر عن حلب") {
    console.log("✔ Arabic text normalization verified successfully (Tashkeel stripped, Alef & Teh Marbuta unified).");
  } else {
    throw new Error("✘ Arabic text normalization failed.");
  }

  // Test 3: Deduplication Verification
  console.log("\n[Test 3] Testing Deduplication Signatures & Constraints...");
  const articleA = {
    title: "الجيش السوري يفتح ممرات آمنة",
    url: "https://www.sana.sy/news/999/?utm_source=twitter",
    content: "محتوى مقال الجيش السوري المفتوح بممرات امنه للمواطنين",
    source_name: "سانا",
    published_at: "2026-05-23T00:00:00Z"
  };

  const isDupFirst = ds.isDuplicate(articleA);
  console.log(`- Initial duplicate check for Article A: ${isDupFirst} (Expected: false)`);
  
  const insertId = ds.saveArticle(articleA);
  console.log(`- Article A saved. ID: ${insertId}`);

  // Test exact duplicate
  const isDupSecond = ds.isDuplicate(articleA);
  console.log(`- Back-to-back duplicate check for exact duplicate: ${isDupSecond} (Expected: true)`);
  if (!isDupSecond) throw new Error("✘ Failed to catch exact duplicate article.");

  // Test URL variation duplicate
  const articleAVariant = {
    title: "الجيش السوري يفتح ممرات آمنة",
    url: "http://sana.sy/news/999?utm_medium=rss",
    content: "محتوى مختلف قليلا",
    source_name: "سانا"
  };
  const isDupVariant = ds.isDuplicate(articleAVariant);
  console.log(`- Duplicate check for alternate URL parameter: ${isDupVariant} (Expected: true)`);
  if (!isDupVariant) throw new Error("✘ Failed to catch duplicate with altered URL params.");

  // Test Jaccard Similarity near-duplicate title (slight rephrasing)
  const articleANearTitle = {
    title: "الْجَيْشُ السُّورِيُّ يَفْتَحُ مَمَرَّاتٍ آمِنَةً جَدِيدَةً", // "الجيش السوري يفتح ممرات آمنة جديدة"
    url: "https://www.sana.sy/news/1001",
    content: "محتوى آخر",
    source_name: "سانا"
  };
  const isDupNearTitle = ds.isDuplicate(articleANearTitle);
  console.log(`- Duplicate check for rephrased Title (Jaccard near-match): ${isDupNearTitle} (Expected: true)`);
  if (!isDupNearTitle) throw new Error("✘ Failed to catch near-duplicate title.");
  console.log("✔ Deduplication logic (Exact hashes + Jaccard similarity) verified successfully.");

  // Test 4: Mock WordPress Publisher & Field Mapping Verification
  console.log("\n[Test 4] Testing WordPress REST API Publisher (Dry-Run Mode)...");
  const publisher = new WordPressPublisher({
    wpUrl: "https://syriatoday.gov.sy",
    username: "admin_aggregator",
    appPassword: "xxxx xxxx xxxx xxxx",
    statusMode: 'draft',
    isDryRun: true
  });

  const wpResult = await publisher.publishArticle(articleA);
  console.log("- Mock WordPress publication result:", JSON.stringify(wpResult, null, 2));
  
  if (wpResult.success && wpResult.postId && wpResult.status === 'draft' && wpResult.isMock) {
    console.log("✔ Mock WordPress Publisher mapped fields and executed identical return contracts.");
  } else {
    throw new Error("✘ Mock WordPress Publisher verification failed.");
  }

  // Save the successfully published WP Post ID back to Database
  ds.saveArticle(articleA, wpResult.postId);
  console.log("\n✔ Complete pipeline verified. All 4 architecture checks PASSED.");
  
  // Clean up
  ds.db.close();
  if (fs.existsSync(testDbFile)) {
    fs.unlinkSync(testDbFile);
  }
}

if (require.main === module) {
  runVerification().catch(err => {
    console.error("\n❌ VERIFICATION FAILURE:", err.message);
    process.exit(1);
  });
}
```

### 5.2 CLI Verification Commands

Developers can run these commands from the shell root to run verification checks inside their environment:

```powershell
# 1. To run the complete design and logic checks
node test_db_publisher.js

# 2. To run standard linter check for JavaScript syntax compliance
npx eslint db.js publisher.js --fix
```

### 5.3 Invalidation Conditions
The verification suite will be considered **invalidated** (failing) if:
- Back-to-back scrapers result in a duplicate entry being inserted into SQLite.
- Standard Arabic diacritical news titles result in separate unique row hash conflicts rather than collision matches.
- The publisher crashes on undefined metadata properties when WP server credentials are empty (must correctly fall back to mock publisher responses).
