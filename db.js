/**
 * db.js - SQLite Datastore and Deduplication Engine
 */
const crypto = require('crypto');
const Database = require('better-sqlite3');

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
        content TEXT DEFAULT NULL,
        source_name TEXT NOT NULL,
        published_at TEXT,
        processed_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
        wordpress_post_id INTEGER DEFAULT NULL,
        status TEXT NOT NULL DEFAULT 'processed',
        image_url TEXT DEFAULT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_articles_url_hash ON processed_articles(url_hash);
      CREATE INDEX IF NOT EXISTS idx_articles_title_hash ON processed_articles(title_hash);
      CREATE INDEX IF NOT EXISTS idx_articles_processed_at ON processed_articles(processed_at);

      CREATE TABLE IF NOT EXISTS telegram_channels (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        link TEXT NOT NULL UNIQUE,
        created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
      );
    `);

    // Migration: add 'content' column to existing databases that don't have it
    try {
      const cols = this.db.pragma('table_info(processed_articles)');
      const hasContent = cols.some(c => c.name === 'content');
      if (!hasContent) {
        this.db.exec('ALTER TABLE processed_articles ADD COLUMN content TEXT DEFAULT NULL');
        console.log('[DB] Migrated: added content column to processed_articles');
      }
      const hasImage = cols.some(c => c.name === 'image_url');
      if (!hasImage) {
        this.db.exec('ALTER TABLE processed_articles ADD COLUMN image_url TEXT DEFAULT NULL');
        console.log('[DB] Migrated: added image_url column to processed_articles');
      }
      // Ignore if table doesn't exist yet (first-run case)
    }
  }

  // =========================================================================
  // TELEGRAM CHANNELS
  // =========================================================================

  getTelegramChannels() {
    return this.db.prepare('SELECT * FROM telegram_channels ORDER BY created_at DESC').all();
  }

  addTelegramChannel(name, link) {
    try {
      const stmt = this.db.prepare('INSERT INTO telegram_channels (name, link) VALUES (?, ?)');
      const result = stmt.run(name, link);
      return { success: true, id: result.lastInsertRowid };
    } catch (error) {
      if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        return { success: false, error: 'هذه القناة مضافة مسبقاً.' };
      }
      return { success: false, error: error.message };
    }
  }

  deleteTelegramChannel(id) {
    const stmt = this.db.prepare('DELETE FROM telegram_channels WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  /**
   * Normalize URLs by stripping protocols, tracking parameters, subdomains, and trailing slashes.
   */
  normalizeUrl(rawUrl) {
    if (!rawUrl) return '';
    try {
      let urlStr = rawUrl.trim();
      // Ensure the URL has a protocol for the URL constructor
      if (!/^https?:\/\//i.test(urlStr)) {
        urlStr = 'http://' + urlStr;
      }
      
      const urlObj = new URL(urlStr);
      
      // Strip common tracking parameters and query variables
      const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'fbclid', 's', 'ref', 'utm_id', 'gclid'];
      trackingParams.forEach(param => urlObj.searchParams.delete(param));

      // Standardize domain (lowercase, remove www. and other subdomains if requested)
      // The requirement says "strips protocols, tracking parameters, subdomains, trailing slashes"
      let hostname = urlObj.hostname.toLowerCase();
      
      // Strip www. and any subdomains
      // e.g. "www.sana.sy" -> "sana.sy", "ouruba.alwehda.gov.sy" -> "alwehda.gov.sy"
      // Let's strip www. first. Then, if we want to strip all subdomains:
      if (hostname.startsWith('www.')) {
        hostname = hostname.substring(4);
      }
      
      // A robust subdomain stripper (retains only the main domain e.g. "sana.sy")
      // But we should be careful with domains like ".gov.sy" or ".com.ar".
      // Let's strip only "www." and other known subdomains, or implement a general subdomain removal for standard cases.
      // E.g. "ouruba.alwehda.gov.sy" -> "alwehda.gov.sy" or keep it if it's a distinct site.
      // The requirement: "strips protocols, tracking parameters, subdomains, trailing slashes".
      // Let's implement a clean subdomain stripping:
      // If we have "subdomain.domain.tld", let's extract the main domain.
      // Let's do a standard extraction:
      const parts = hostname.split('.');
      if (parts.length > 2) {
        // Handle common double-tld domains like .gov.sy, .com.sy, .edu.sy, .org.sy
        const isDoubleTld = ['gov', 'com', 'edu', 'org', 'net'].includes(parts[parts.length - 2]);
        if (isDoubleTld && parts.length > 3) {
          hostname = parts.slice(-3).join('.');
        } else if (!isDoubleTld) {
          hostname = parts.slice(-2).join('.');
        }
      }

      let pathname = urlObj.pathname;
      // Strip trailing slash
      if (pathname.endsWith('/') && pathname.length > 1) {
        pathname = pathname.slice(0, -1);
      }
      if (pathname === '/') {
        pathname = '';
      }

      // Reconstruct query string if any searchParams remain
      const search = urlObj.search;

      return `${hostname}${pathname}${search}`;
    } catch (e) {
      // Fallback for broken strings: strip protocols, subdomains, trailing slash manually
      let cleaned = rawUrl.trim().toLowerCase();
      cleaned = cleaned.replace(/^https?:\/\//i, '');
      cleaned = cleaned.replace(/^www\./i, '');
      cleaned = cleaned.replace(/\/$/, '');
      return cleaned;
    }
  }

  /**
   * Normalize Arabic text by removing diacritics (tashkeel) and unifying letters
   */
  normalizeArabicText(text) {
    if (!text) return '';
    let normalized = text.trim();

    // 1. Remove Tashkeel (diacritics: Fatha, Damma, Kasra, Sukun, Shadda, etc.)
    // \u064B-\u0652 covers standard tashkeel, \u0653-\u065F covers additional diacritics
    const tashkeelRegex = /[\u064B-\u065F]/g;
    normalized = normalized.replace(tashkeelRegex, '');

    // 2. Unify Alef variations (أ, إ, آ, ٱ -> ا)
    normalized = normalized.replace(/[\u0622\u0623\u0625\u0671]/g, '\u0627');

    // 3. Unify Teh Marbuta (ة -> ه)
    normalized = normalized.replace(/\u0629/g, '\u0647');

    // 4. Unify Alef Maksura (ى -> ي)
    normalized = normalized.replace(/\u0649/g, '\u064A');

    // 5. Remove punctuation, special characters, and double spaces
    // Keep Arabic letters (\u0600-\u06FF), english alphanumeric, and spaces
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
    const norm1 = this.normalizeArabicText(text1);
    const norm2 = this.normalizeArabicText(text2);
    
    const words1 = new Set(norm1.split(' ').filter(w => w.length > 1));
    const words2 = new Set(norm2.split(' ').filter(w => w.length > 1));

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
   * Save Article Signature metadata.
   * If the article is already in the database, update its wordpress_post_id and status if provided.
   */
  saveArticle(article, wordpressPostId = null) {
    const normalizedUrl = this.normalizeUrl(article.url);
    const urlHash = this.computeHash(normalizedUrl);
    const normalizedTitle = this.normalizeArabicText(article.title);
    const titleHash = this.computeHash(normalizedTitle);
    const contentHash = this.computeHash(article.content || '');

    // Check if it already exists in db by url_hash or title_hash to update it
    const existing = this.db.prepare(`
      SELECT id, wordpress_post_id FROM processed_articles 
      WHERE url_hash = ? OR title_hash = ?
    `).get(urlHash, titleHash);

    if (existing) {
      // Update WP post ID if provided, and always backfill content if it was NULL
      const updates = [];
      const params = [];
      if (wordpressPostId !== null) {
        updates.push("wordpress_post_id = ?", "status = 'published'");
        params.push(wordpressPostId);
      }
      if (article.content) {
        updates.push("content = COALESCE(content, ?)");
        params.push(article.content);
      }
      if (article.image_url) {
        updates.push("image_url = COALESCE(image_url, ?)");
        params.push(article.image_url);
      }
      if (updates.length > 0) {
        params.push(existing.id);
        this.db.prepare(`UPDATE processed_articles SET ${updates.join(', ')} WHERE id = ?`).run(...params);
      }
      return existing.id;
    }

    const stmt = this.db.prepare(`
      INSERT INTO processed_articles 
        (title, url, normalized_url, url_hash, title_hash, content_hash, content, source_name, published_at, wordpress_post_id, status, image_url)
      VALUES 
        (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    try {
      const result = stmt.run(
        article.title,
        article.url,
        normalizedUrl,
        urlHash,
        titleHash,
        contentHash,
        article.content || null,
        article.source_name,
        article.published_at || null,
        wordpressPostId,
        wordpressPostId ? 'published' : 'processed',
        article.image_url || null
      );
      return result.lastInsertRowid;
    } catch (err) {
      if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
        // Return existing item's ID in case of concurrency or race condition
        const retryGet = this.db.prepare(`
          SELECT id FROM processed_articles WHERE url_hash = ? OR title_hash = ?
        `).get(urlHash, titleHash);
        return retryGet ? retryGet.id : null;
      }
      throw err;
    }
  }

  /**
   * Retrieve processed articles
   */
  getArticles(limit = 100) {
    return this.db.prepare('SELECT * FROM processed_articles ORDER BY processed_at DESC LIMIT ?').all(limit);
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

  /**
   * Delete an article record by ID
   */
  deleteArticle(id) {
    const stmt = this.db.prepare('DELETE FROM processed_articles WHERE id = ?');
    const result = stmt.run(id);
    return result.changes > 0;
  }

  /**
   * Update an article's content (used by n8n AI rewriting workflow)
   * @param {number} id - Article ID
   * @param {Object} updates - Fields to update { content, status, wordpress_post_id }
   * @returns {boolean} Success
   */
  updateArticleContent(id, updates = {}) {
    const fields = [];
    const values = [];
    
    if (updates.content !== undefined) {
      fields.push('content = ?');
      values.push(updates.content);
      // Update content hash too
      fields.push('content_hash = ?');
      values.push(this.computeHash(updates.content));
    }
    if (updates.status !== undefined) {
      fields.push('status = ?');
      values.push(updates.status);
    }
    if (updates.wordpress_post_id !== undefined) {
      fields.push('wordpress_post_id = ?');
      values.push(updates.wordpress_post_id);
    }

    if (fields.length === 0) return false;

    values.push(id);
    const stmt = this.db.prepare(`UPDATE processed_articles SET ${fields.join(', ')} WHERE id = ?`);
    const result = stmt.run(...values);
    return result.changes > 0;
  }

  /**
   * Delete ALL articles from the database and vacuum
   */
  deleteAllArticles() {
    const countBefore = this.db.prepare('SELECT COUNT(*) as count FROM processed_articles').get().count;
    this.db.exec('DELETE FROM processed_articles');
    this.db.exec('VACUUM');
    return countBefore;
  }

  /**
   * Delete articles within a date range
   * @param {string} startDate - ISO date string
   * @param {string} endDate - ISO date string
   * @returns {number} Number of deleted articles
   */
  deleteArticlesByDateRange(startDate, endDate) {
    const stmt = this.db.prepare(
      'DELETE FROM processed_articles WHERE processed_at >= ? AND processed_at <= ?'
    );
    const result = stmt.run(startDate, endDate);
    return result.changes;
  }

  /**
   * Delete all articles from a specific source
   * @param {string} sourceName
   * @returns {number} Number of deleted articles
   */
  deleteArticlesBySource(sourceName) {
    const stmt = this.db.prepare('DELETE FROM processed_articles WHERE source_name = ?');
    const result = stmt.run(sourceName);
    return result.changes;
  }



  /**
   * Get detailed article statistics
   */
  getArticleStats() {
    const total = this.db.prepare('SELECT COUNT(*) as count FROM processed_articles').get().count;
    const withContent = this.db.prepare("SELECT COUNT(*) as count FROM processed_articles WHERE content IS NOT NULL AND content != ''").get().count;
    const published = this.db.prepare("SELECT COUNT(*) as count FROM processed_articles WHERE wordpress_post_id IS NOT NULL").get().count;
    const oldest = this.db.prepare('SELECT MIN(processed_at) as d FROM processed_articles').get().d;
    const newest = this.db.prepare('SELECT MAX(processed_at) as d FROM processed_articles').get().d;
    const bySource = this.db.prepare(`
      SELECT source_name, COUNT(*) as total,
             SUM(CASE WHEN wordpress_post_id IS NOT NULL THEN 1 ELSE 0 END) as published,
             SUM(CASE WHEN content IS NOT NULL AND content != '' THEN 1 ELSE 0 END) as withContent
      FROM processed_articles GROUP BY source_name ORDER BY total DESC
    `).all();
    return { total, withContent, withoutContent: total - withContent, published, oldest, newest, bySource };
  }

  /**
   * Retrieve recent article titles for AI deduplication comparison.
   * Returns lightweight title-only records for n8n workflow consumption.
   * @param {number} limit Max number of recent titles to return
   * @returns {Array<{id: number, title: string, source_name: string, published_at: string}>}
   */
  getRecentTitles(limit = 50) {
    return this.db.prepare(`
      SELECT id, title, source_name, published_at 
      FROM processed_articles 
      WHERE status = 'published' OR wordpress_post_id IS NOT NULL
      ORDER BY processed_at DESC 
      LIMIT ?
    `).all(limit);
  }

  /**
   * Mark an article as duplicate-skipped by the AI dedup workflow.
   * @param {number} id Article ID
   * @param {string} matchedTitle The title it was matched against
   * @returns {boolean} Success
   */
  markAsDuplicateSkipped(id, matchedTitle = null) {
    const stmt = this.db.prepare(
      "UPDATE processed_articles SET status = 'duplicate_skipped' WHERE id = ?"
    );
    const result = stmt.run(id);
    return result.changes > 0;
  }

  /**
   * Get detailed per-source statistics for the dashboard source control panel.
   * Returns counts, date ranges, and health metrics per source.
   * @returns {Array<Object>}
   */
  getPerSourceStats() {
    return this.db.prepare(`
      SELECT 
        source_name,
        COUNT(*) as total_articles,
        SUM(CASE WHEN wordpress_post_id IS NOT NULL THEN 1 ELSE 0 END) as published_count,
        SUM(CASE WHEN status = 'duplicate_skipped' THEN 1 ELSE 0 END) as duplicates_skipped,
        SUM(CASE WHEN content IS NOT NULL AND content != '' THEN 1 ELSE 0 END) as with_content,
        MIN(processed_at) as first_scraped,
        MAX(processed_at) as last_scraped,
        COUNT(CASE WHEN processed_at >= datetime('now', '-24 hours') THEN 1 END) as last_24h_count,
        COUNT(CASE WHEN processed_at >= datetime('now', '-7 days') THEN 1 END) as last_7d_count
      FROM processed_articles 
      GROUP BY source_name 
      ORDER BY last_scraped DESC
    `).all();
  }

  close() {
    this.db.close();
  }
}

module.exports = Datastore;
