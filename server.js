/**
 * server.js - Web Dashboard Backend API Server
 */

const express = require('express');
const fs = require('fs');
const path = require('path');
const Database = require('better-sqlite3');
const axios = require('axios');

// Import system orchestrators
const { runPipeline } = require('./runner');
const Datastore = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const CONFIG_PATH = path.join(__dirname, 'config.json');

/**
 * Utility: Load configuration file
 */
function readConfig() {
  if (fs.existsSync(CONFIG_PATH)) {
    try {
      return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf-8'));
    } catch (e) {
      console.error('[Server] Configuration file corrupted, using default settings.');
    }
  }
  return {
    wordpress: { wpUrl: '', username: '', appPassword: '', statusMode: 'draft', isDryRun: true },
    aiRewriter: { enabled: false, isDryRun: true, apiKey: '', model: 'gpt-4o-mini' },
    general: { dbPath: 'news_aggregator.db', rateLimitDelay: 1500, maxArticlesPerSource: 3 },
    sources: []
  };
}

/**
 * Utility: Save configuration file
 */
function saveConfig(config) {
  fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
}

// ----------------------------------------------------
// REST API ROUTES
// ----------------------------------------------------

/**
 * GET /api/config - Retrieve configuration schema
 */
app.get('/api/config', (req, res) => {
  res.json(readConfig());
});

/**
 * POST /api/config - Save configuration schema
 */
app.post('/api/config', (req, res) => {
  try {
    const config = readConfig();
    const { wordpress, aiRewriter, general, n8n } = req.body;
    
    if (wordpress) config.wordpress = wordpress;
    if (aiRewriter) config.aiRewriter = aiRewriter;
    if (general) config.general = general;
    if (n8n) config.n8n = n8n;
    
    saveConfig(config);
    res.json({ success: true, message: 'Settings saved successfully!' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/stats - Retrieve SQLite database metrics
 */
app.get('/api/stats', (req, res) => {
  const config = readConfig();
  const dbPath = config.general.dbPath || 'news_aggregator.db';
  
  let dbConnection;
  try {
    dbConnection = new Database(dbPath);
    
    // Ensure table exists by running schema init if DB is blank
    const ds = new Datastore(dbPath);
    ds.close();
    
    const totalRow = dbConnection.prepare('SELECT COUNT(*) as count FROM processed_articles').get();
    const publishedRow = dbConnection.prepare("SELECT COUNT(*) as count FROM processed_articles WHERE status = 'published' OR wordpress_post_id IS NOT NULL").get();
    
    const sourceStats = dbConnection.prepare(`
      SELECT source_name, COUNT(*) as total, 
             SUM(CASE WHEN wordpress_post_id IS NOT NULL THEN 1 ELSE 0 END) as published
      FROM processed_articles 
      GROUP BY source_name
    `).all();
    
    res.json({
      success: true,
      stats: {
        totalProcessed: totalRow ? totalRow.count : 0,
        totalPublished: publishedRow ? publishedRow.count : 0,
        sourcesCount: config.sources.length,
        activeSourcesCount: config.sources.filter(s => s.enabled).length,
        sourcesBreakdown: sourceStats
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: `SQLite Connection Failed: ${error.message}` });
  } finally {
    if (dbConnection) dbConnection.close();
  }
});

/**
 * GET /api/articles - Retrieve paginated and filtered logs
 */
app.get('/api/articles', (req, res) => {
  const config = readConfig();
  const dbPath = config.general.dbPath || 'news_aggregator.db';
  
  const search = req.query.search || '';
  const source = req.query.source || '';
  const status = req.query.status || '';
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 15;
  const offset = (page - 1) * limit;
  
  let dbConnection;
  try {
    dbConnection = new Database(dbPath);
    
    // Ensure schema
    const ds = new Datastore(dbPath);
    ds.close();
    
    let queryStr = 'SELECT * FROM processed_articles WHERE 1=1';
    let countStr = 'SELECT COUNT(*) as count FROM processed_articles WHERE 1=1';
    const params = [];
    
    if (search) {
      queryStr += ' AND (title LIKE ? OR url LIKE ?)';
      countStr += ' AND (title LIKE ? OR url LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    
    if (source) {
      queryStr += ' AND source_name = ?';
      countStr += ' AND source_name = ?';
      params.push(source);
    }
    
    if (status) {
      queryStr += ' AND status = ?';
      countStr += ' AND status = ?';
      params.push(status);
    }

    if (req.query.dateFrom) {
      queryStr += ' AND processed_at >= ?';
      countStr += ' AND processed_at >= ?';
      params.push(req.query.dateFrom);
    }

    if (req.query.dateTo) {
      queryStr += ' AND processed_at <= ?';
      countStr += ' AND processed_at <= ?';
      params.push(req.query.dateTo);
    }
    
    // Get total count for pagination
    const totalRow = dbConnection.prepare(countStr).get(...params);
    const total = totalRow ? totalRow.count : 0;
    
    // Append order and limits
    queryStr += ' ORDER BY processed_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);
    
    const articles = dbConnection.prepare(queryStr).all(...params);
    const totalPages = Math.ceil(total / limit);
    
    res.json({
      success: true,
      data: articles,
      pagination: {
        total,
        page,
        limit,
        totalPages
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  } finally {
    if (dbConnection) dbConnection.close();
  }
});

/**
 * DELETE /api/articles/clean - Purge all articles from database
 */
app.delete('/api/articles/clean', (req, res) => {
  const config = readConfig();
  const dbPath = config.general.dbPath || 'news_aggregator.db';
  try {
    const ds = new Datastore(dbPath);
    const deletedCount = ds.deleteAllArticles();
    ds.close();
    res.json({ success: true, message: `تم حذف ${deletedCount} مقال بنجاح.`, deletedCount });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/articles/by-date - Delete articles in a date range
 */
app.delete('/api/articles/by-date', (req, res) => {
  let { startDate, endDate } = req.body;
  if (!startDate && !endDate) {
    return res.status(400).json({ success: false, error: 'يرجى تحديد تاريخ البداية أو النهاية.' });
  }
  // Default missing dates
  if (!startDate) startDate = '2020-01-01T00:00:00Z';
  if (!endDate) endDate = new Date().toISOString();
  const config = readConfig();
  const dbPath = config.general.dbPath || 'news_aggregator.db';
  try {
    const ds = new Datastore(dbPath);
    const deletedCount = ds.deleteArticlesByDateRange(startDate, endDate);
    ds.close();
    res.json({ success: true, message: `تم حذف ${deletedCount} مقال.`, deletedCount });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/articles/by-source - Delete all articles from a specific source
 */
app.delete('/api/articles/by-source', (req, res) => {
  const { sourceName } = req.body;
  if (!sourceName) {
    return res.status(400).json({ success: false, error: 'يرجى تحديد اسم المصدر.' });
  }
  const config = readConfig();
  const dbPath = config.general.dbPath || 'news_aggregator.db';
  try {
    const ds = new Datastore(dbPath);
    const deletedCount = ds.deleteArticlesBySource(sourceName);
    ds.close();
    res.json({ success: true, message: `تم حذف ${deletedCount} مقال من ${sourceName}.`, deletedCount });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/articles/stats - Detailed article statistics
 */
app.get('/api/articles/stats', (req, res) => {
  const config = readConfig();
  const dbPath = config.general.dbPath || 'news_aggregator.db';
  try {
    const ds = new Datastore(dbPath);
    const stats = ds.getArticleStats();
    ds.close();
    res.json({ success: true, stats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// =========================================================================
// TELEGRAM CHANNELS ENDPOINTS
// =========================================================================

/**
 * GET /api/telegram-channels - Fetch all telegram channels
 */
app.get('/api/telegram-channels', (req, res) => {
  const config = readConfig();
  const dbPath = config.general.dbPath || 'news_aggregator.db';
  try {
    const ds = new Datastore(dbPath);
    const channels = ds.getTelegramChannels();
    ds.close();
    res.json({ success: true, data: channels });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/telegram-channels - Add a telegram channel
 */
app.post('/api/telegram-channels', (req, res) => {
  const { name, link } = req.body;
  const sort_order = parseInt(req.body.sort_order) || 0;
  if (!name || !link) {
    return res.status(400).json({ success: false, error: 'يرجى إدخال اسم القناة والرابط.' });
  }
  
  const config = readConfig();
  const dbPath = config.general.dbPath || 'news_aggregator.db';
  try {
    const ds = new Datastore(dbPath);
    const result = ds.addTelegramChannel(name, link, sort_order);
    ds.close();
    
    if (result.success) {
      res.json({ success: true, message: 'تم إضافة القناة بنجاح.', id: result.id });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/telegram-channels/:id - Delete a telegram channel
 */
app.delete('/api/telegram-channels/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const config = readConfig();
  const dbPath = config.general.dbPath || 'news_aggregator.db';
  try {
    const ds = new Datastore(dbPath);
    const deleted = ds.deleteTelegramChannel(id);
    ds.close();
    
    if (deleted) {
      res.json({ success: true, message: 'تم حذف القناة بنجاح.' });
    } else {
      res.status(404).json({ success: false, error: 'لم يتم العثور على القناة.' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// =========================================================================
// TELEGRAM POSTS ENDPOINTS
// =========================================================================

/**
 * GET /api/telegram-posts/:channel_id - Fetch post statuses for a specific channel
 */
app.get('/api/telegram-posts/:channel_id', (req, res) => {
  const channel_id = parseInt(req.params.channel_id);
  const config = readConfig();
  const dbPath = config.general.dbPath || 'news_aggregator.db';
  try {
    const ds = new Datastore(dbPath);
    const posts = ds.getTelegramPostsStatus(channel_id);
    ds.close();
    res.json({ success: true, data: posts });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/telegram-posts - Insert or update the status of a telegram post
 */
app.post('/api/telegram-posts', (req, res) => {
  const { channel_id, post_id, title } = req.body;
  const status = req.body.status || 'scraped';
  if (!channel_id || !post_id) {
    return res.status(400).json({ success: false, error: 'يرجى إدخال معرف القناة ومعرف المنشور.' });
  }
  
  const config = readConfig();
  const dbPath = config.general.dbPath || 'news_aggregator.db';
  try {
    const ds = new Datastore(dbPath);
    const result = ds.upsertTelegramPostStatus(parseInt(channel_id), String(post_id), status, title);
    ds.close();
    
    if (result.success) {
      res.json({ success: true, message: 'تم تحديث حالة المنشور بنجاح.' });
    } else {
      res.status(400).json({ success: false, error: result.error });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/articles/recent-titles - Retrieve recent article titles for AI deduplication.
 * Used by the n8n AI dedup workflow to compare incoming articles against already-processed ones.
 * Query params: ?limit=50 (default 50, max 200)
 */
app.get('/api/articles/recent-titles', (req, res) => {
  const config = readConfig();
  const dbPath = config.general.dbPath || 'news_aggregator.db';
  const limit = Math.min(parseInt(req.query.limit) || 50, 200);

  try {
    const ds = new Datastore(dbPath);
    const titles = ds.getRecentTitles(limit);
    ds.close();
    res.json({ success: true, count: titles.length, titles });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/articles/:id/mark-duplicate - Mark an article as duplicate (used by n8n dedup workflow)
 */
app.post('/api/articles/:id/mark-duplicate', (req, res) => {
  const config = readConfig();
  const dbPath = config.general.dbPath || 'news_aggregator.db';
  const id = parseInt(req.params.id);
  const { matchedTitle } = req.body;

  if (isNaN(id)) {
    return res.status(400).json({ success: false, error: 'Invalid article ID.' });
  }

  try {
    const ds = new Datastore(dbPath);
    const updated = ds.markAsDuplicateSkipped(id, matchedTitle || null);
    ds.close();

    if (updated) {
      res.json({ success: true, message: `Article ${id} marked as duplicate_skipped.` });
    } else {
      res.status(404).json({ success: false, error: 'Article not found.' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * GET /api/sources/stats - Per-source statistics from the database for dashboard source cards
 */
app.get('/api/sources/stats', (req, res) => {
  const config = readConfig();
  const dbPath = config.general.dbPath || 'news_aggregator.db';

  try {
    const ds = new Datastore(dbPath);
    const perSourceStats = ds.getPerSourceStats();
    ds.close();
    res.json({ success: true, stats: perSourceStats });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/articles/:id - Delete an article from database (and optionally WordPress)
 */
app.delete('/api/articles/:id', async (req, res) => {
  const config = readConfig();
  const dbPath = config.general.dbPath || 'news_aggregator.db';
  const id = parseInt(req.params.id);
  const deleteFromWP = req.query.deleteFromWP === 'true';

  if (isNaN(id)) {
    return res.status(400).json({ success: false, error: 'Invalid article ID.' });
  }

  let dbConnection;
  try {
    dbConnection = new Database(dbPath);
    const ds = new Datastore(dbPath);
    
    // Fetch article by ID
    const article = dbConnection.prepare('SELECT * FROM processed_articles WHERE id = ?').get(id);
    if (!article) {
      ds.close();
      return res.status(404).json({ success: false, error: 'Article not found.' });
    }

    // Optionally delete from WordPress via REST API
    if (deleteFromWP && article.wordpress_post_id) {
      console.log(`[Server] Request to delete post ID ${article.wordpress_post_id} from WordPress...`);
      const WordPressPublisher = require('./publisher');
      const publisher = new WordPressPublisher(config.wordpress || {});
      const wpResult = await publisher.deletePost(article.wordpress_post_id);
      
      if (!wpResult.success) {
        console.error(`[Server Warning] WordPress deletion failed: ${wpResult.error}`);
        // We warn and log but still proceed to let them clean up the local database record
      }
    }

    // Delete locally from SQLite datastore
    const deleted = ds.deleteArticle(id);
    ds.close();

    if (deleted) {
      res.json({ success: true, message: 'Article deleted successfully!' });
    } else {
      res.status(500).json({ success: false, error: 'Failed to delete article from local database.' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  } finally {
    if (dbConnection) dbConnection.close();
  }
});

/**
 * PUT /api/articles/:id - Update article content (used by n8n AI rewriting workflow)
 */
app.put('/api/articles/:id', (req, res) => {
  const config = readConfig();
  const dbPath = config.general.dbPath || 'news_aggregator.db';
  const id = parseInt(req.params.id);

  if (isNaN(id)) {
    return res.status(400).json({ success: false, error: 'Invalid article ID.' });
  }

  const { content, status, wordpress_post_id } = req.body;
  if (!content && !status && (wordpress_post_id === undefined)) {
    return res.status(400).json({ success: false, error: 'يرجى تحديد محتوى أو حالة للتحديث.' });
  }

  try {
    const ds = new Datastore(dbPath);
    const updated = ds.updateArticleContent(id, { content, status, wordpress_post_id });
    ds.close();

    if (updated) {
      res.json({ success: true, message: 'تم تحديث المقال بنجاح.' });
    } else {
      res.status(404).json({ success: false, error: 'المقال غير موجود.' });
    }
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/sources/ai-detect - AI-powered selector discovery using LLM
 */
app.post('/api/sources/ai-detect', async (req, res) => {
  const { url, selectors, strategy } = req.body;
  if (!url) {
    return res.status(400).json({ success: false, error: 'Target URL is required.' });
  }

  try {
    const config = readConfig();

    // 1. If selectors & strategy are present, save back results (from n8n callback)
    if (selectors) {
      const parsedSelectors = typeof selectors === 'string' ? JSON.parse(selectors) : selectors;
      const sourceIndex = config.sources.findIndex(s => 
        s.url.replace(/\/$/, '') === url.replace(/\/$/, '') || 
        s.name.toLowerCase() === url.toLowerCase()
      );

      if (sourceIndex !== -1) {
        config.sources[sourceIndex].selectors = parsedSelectors;
        config.sources[sourceIndex].strategy = strategy || 'html';
        config.sources[sourceIndex].lastTestedAt = new Date().toISOString();
        config.sources[sourceIndex].lastTestStatus = 'success';
        saveConfig(config);
        console.log(`[n8n Callback] Successfully updated source selectors for: ${config.sources[sourceIndex].name}`);
        return res.json({ success: true, message: 'Successfully updated source selectors from n8n callback!', source: config.sources[sourceIndex] });
      } else {
        return res.status(404).json({ success: false, error: 'Source not found for the provided URL to update.' });
      }
    }

    // 2. Otherwise, run detection
    const n8nConfig = config.n8n || {};
    if (n8nConfig.enabled && n8nConfig.selectorsWebhookUrl) {
      console.log(`[n8n Trigger] Forwarding AI selector discovery for ${url} to n8n webhook`);
      
      try {
        const { fetchPageContent } = require('./scraper');
        console.log(`[n8n Trigger] Fetching clean DOM for n8n payload...`);
        const html = await fetchPageContent(url, 'utf-8', 15000);
        
        const payload = {
          targetUrl: url,
          html: html,
          aggregatorBaseUrl: req.protocol + '://' + req.get('host')
        };

        // Trigger n8n webhook
        const n8nResponse = await axios.post(n8nConfig.selectorsWebhookUrl, payload, { timeout: 25000 });
        
        // Check if n8n returned the result synchronously
        const n8nData = n8nResponse.data;
        if (n8nData && (n8nData.selectors || (n8nData.success && n8nData.result))) {
          const result = n8nData.selectors || n8nData.result;
          return res.json({ 
            success: true, 
            isN8n: true,
            result: {
              strategy: n8nData.strategy || 'html',
              selectors: result,
              confidence: n8nData.confidence || 0.9,
              reasoning: n8nData.reasoning || 'تم الكشف بنجاح عبر سيرفر أتمتة n8n.'
            } 
          });
        }

        // Otherwise it is asynchronous, n8n will post back to this endpoint
        return res.json({ 
          success: true, 
          isN8n: true,
          async: true,
          message: 'تم تشغيل سيرفر أتمتة n8n بنجاح! سيتم تحديث المحددات تلقائياً في الخلفية عند اكتمال التحليل.'
        });
      } catch (err) {
        console.error(`[n8n Error] Failed triggering webhook: ${err.message}`);
        throw new Error(`فشل الاتصال بسيرفر أتمتة n8n: ${err.message}`);
      }
    }

    // 3. Fallback to local AI Analyzer if n8n is not enabled
    const aiConfig = config.aiRewriter || {};
    const AIDOMAnalyzer = require('./ai_analyzer');
    const analyzer = new AIDOMAnalyzer({
      apiKey: aiConfig.apiKey || '',
      model: aiConfig.model || 'gpt-4o-mini',
      isDryRun: aiConfig.isDryRun !== false
    });

    const { fetchPageContent } = require('./scraper');
    const html = await fetchPageContent(url, 'utf-8', 15000);
    const result = await analyzer.analyzeDOM(html, url);
    
    res.json({ success: true, result });
  } catch (error) {
    console.error(`[Server Error] AI detect failed: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/sources - Add news source configuration
 */
app.post('/api/sources', (req, res) => {
  try {
    const config = readConfig();
    const newSource = req.body;
    
    if (!newSource.name || !newSource.url) {
      return res.status(400).json({ success: false, error: 'Source Name and Base URL are required fields.' });
    }
    
    // Supply default structure
    const sourceSchema = {
      name: newSource.name.trim(),
      url: newSource.url.trim(),
      rssUrl: newSource.rssUrl ? newSource.rssUrl.trim() : null,
      strategy: newSource.strategy || 'html',
      enabled: newSource.enabled !== undefined ? newSource.enabled : true,
      encoding: newSource.encoding || 'utf-8',
      selectors: newSource.selectors || {
        list: { container: 'article', title: 'h2 a', link: 'a' },
        article: { title: 'h1', content: '.content', date: 'time' }
      }
    };
    
    config.sources.push(sourceSchema);
    saveConfig(config);
    
    res.json({ success: true, message: 'News source added successfully!', source: sourceSchema });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * PUT /api/sources/:index - Update or toggle news source
 */
app.put('/api/sources/:index', (req, res) => {
  try {
    const config = readConfig();
    const index = parseInt(req.params.index);
    
    if (isNaN(index) || index < 0 || index >= config.sources.length) {
      return res.status(404).json({ success: false, error: 'News source index out of bounds.' });
    }
    
    const updatedSource = req.body;
    config.sources[index] = { ...config.sources[index], ...updatedSource };
    
    saveConfig(config);
    res.json({ success: true, message: 'News source updated successfully!', source: config.sources[index] });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * DELETE /api/sources/:index - Remove news source
 */
app.delete('/api/sources/:index', (req, res) => {
  try {
    const config = readConfig();
    const index = parseInt(req.params.index);
    
    if (isNaN(index) || index < 0 || index >= config.sources.length) {
      return res.status(404).json({ success: false, error: 'News source index out of bounds.' });
    }
    
    const removed = config.sources.splice(index, 1);
    saveConfig(config);
    res.json({ success: true, message: `Removed source "${removed[0].name}" successfully!` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/sources/bulk-ai-toggle - Enable/disable AI fallback for ALL sources at once
 */
app.post('/api/sources/bulk-ai-toggle', (req, res) => {
  try {
    const config = readConfig();
    const { allowAiFallback } = req.body;

    if (typeof allowAiFallback !== 'boolean') {
      return res.status(400).json({ success: false, error: 'allowAiFallback must be a boolean value.' });
    }

    if (!config.sources || config.sources.length === 0) {
      return res.json({ success: true, message: 'لا توجد مصادر لتحديثها.', updatedCount: 0 });
    }

    let updatedCount = 0;
    config.sources.forEach(source => {
      source.allowAiFallback = allowAiFallback;
      updatedCount++;
    });

    saveConfig(config);

    const stateText = allowAiFallback ? 'تفعيل' : 'تعطيل';
    res.json({
      success: true,
      message: `تم ${stateText} الذكاء الاصطناعي لجميع المصادر (${updatedCount} مصدر).`,
      updatedCount
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/test-wp - Quick connection probe to WordPress REST API
 */
app.post('/api/test-wp', async (req, res) => {
  const { wpUrl, username, appPassword } = req.body;
  if (!wpUrl || !username || !appPassword) {
    return res.status(400).json({ success: false, error: 'All connection credentials (WP URL, username, application password) must be provided.' });
  }
  
  const cleanUrl = wpUrl.replace(/\/$/, '');
  const endpoint = `${cleanUrl}/wp-json/wp/v2/users/me`;
  const token = Buffer.from(`${username}:${appPassword}`).toString('base64');
  
  try {
    console.log(`[Server] Testing WordPress connection: GET ${endpoint}`);
    const response = await axios.get(endpoint, {
      headers: {
        'Authorization': `Basic ${token}`,
        'User-Agent': 'SyrianNewsAggregatorWebDashboard/1.0.0'
      },
      timeout: 8000
    });
    
    if (response.status === 200 && response.data.id) {
      res.json({ success: true, message: `Successfully connected! Authenticated as "${response.data.name || username}" (WP ID: ${response.data.id}).` });
    } else {
      res.json({ success: false, error: `Invalid response format: HTTP ${response.status}` });
    }
  } catch (error) {
    let errorMsg = error.message;
    if (error.response) {
      errorMsg = `HTTP ${error.response.status}: ${JSON.stringify(error.response.data)}`;
    }
    res.json({ success: false, error: `WordPress verification failed: ${errorMsg}` });
  }
});

/**
 * POST /api/test-ai - OpenAI completion API connection check
 */
app.post('/api/test-ai', async (req, res) => {
  const { apiKey, model } = req.body;
  if (!apiKey) {
    return res.status(400).json({ success: false, error: 'OpenAI API key must be provided.' });
  }
  
  try {
    console.log(`[Server] Testing OpenAI API: ${model || 'gpt-4o-mini'}`);
    const response = await axios.post('https://api.openai.com/v1/chat/completions', {
      model: model || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a test agent.' },
        { role: 'user', content: 'Say OK' }
      ],
      max_tokens: 5
    }, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      timeout: 8000
    });
    
    const reply = response.data.choices[0].message.content.trim();
    res.json({ success: true, message: `Successfully connected! OpenAI Response: "${reply}" (Model: ${response.data.model})` });
  } catch (error) {
    let errorMsg = error.message;
    if (error.response) {
      errorMsg = `HTTP ${error.response.status}: ${JSON.stringify(error.response.data)}`;
    }
    res.json({ success: false, error: `OpenAI verification failed: ${errorMsg}` });
  }
});

/**
 * POST /api/sources/auto-detect - Auto-probe website scraping options
 */
app.post('/api/sources/auto-detect', async (req, res) => {
  const { url, skipAi } = req.body;
  if (!url) {
    return res.status(400).json({ success: false, error: 'Target URL is required.' });
  }

  try {
    const config = readConfig();
    
    // Find the source to check its individual AI preference
    const sourceObj = config.sources.find(s => s.url === url) || {};
    const allowAi = skipAi ? false : (sourceObj.allowAiFallback !== false); // default to true unless explicitly false

    const { autoDetectStrategy } = require('./scraper');
    const result = await autoDetectStrategy(url, config);
    
    // If autoDetectStrategy falls back to heuristics (strategy = 'html') and validation found 0 articles,
    // we should route to n8n or AI as a more robust fallback!
    if (result && result.success && result.strategy === 'html' && 
        (!result.validationResult || result.validationResult.articlesFound === 0) && allowAi) {
        
        console.log(`[Server] Standard heuristics failed for ${url}. Falling back to robust AI/n8n...`);
        const n8nConfig = config.n8n || {};
        
        if (n8nConfig.enabled && n8nConfig.selectorsWebhookUrl) {
          const axios = require('axios');
          const { fetchPageContent } = require('./scraper');
          
          try {
            console.log(`[n8n Fallback] Fetching clean DOM for n8n payload...`);
            const html = await fetchPageContent(url, 'utf-8', 15000);
            
            const payload = { 
              targetUrl: url, 
              html: html,
              aggregatorBaseUrl: req.protocol + '://' + req.get('host') 
            };
            
            const n8nResponse = await axios.post(n8nConfig.selectorsWebhookUrl, payload, { timeout: 25000 });
            const n8nData = n8nResponse.data;
            if (n8nData && (n8nData.selectors || (n8nData.success && n8nData.result))) {
              const aiResult = n8nData.selectors || n8nData.result;
              return res.json({
                success: true,
                isN8n: true,
                result: {
                  strategy: n8nData.strategy || 'html',
                  selectors: aiResult,
                  confidence: n8nData.confidence || 0.9,
                  reasoning: n8nData.reasoning || 'تم الكشف بنجاح عبر سيرفر أتمتة n8n.'
                }
              });
            }
            return res.json({ 
              success: true, isN8n: true, async: true,
              message: 'تم تشغيل سيرفر أتمتة n8n بنجاح! سيتم تحديث المحددات تلقائياً في الخلفية عند اكتمال التحليل.'
            });
          } catch (e) {
            console.error(`[n8n Fallback Error] ${e.message}`);
          }
        }
        
        // Local AI Fallback
        const aiConfig = config.aiRewriter || {};
        if (aiConfig.enabled && aiConfig.apiKey) {
           const AIDOMAnalyzer = require('./ai_analyzer');
           const analyzer = new AIDOMAnalyzer({ apiKey: aiConfig.apiKey, model: aiConfig.model || 'gpt-4o-mini', isDryRun: aiConfig.isDryRun !== false });
           const { fetchPageContent } = require('./scraper');
           try {
             const html = await fetchPageContent(url, 'utf-8', 15000);
             const aiLocalResult = await analyzer.analyzeDOM(html, url);
             return res.json({ success: true, result: aiLocalResult });
           } catch(e) {
             console.error(`[Local AI Fallback Error] ${e.message}`);
           }
        }
    }
    
    // Return original result if no robust fallback available or needed
    res.json({ success: true, result });
  } catch (error) {
    console.error(`[Server Error] Auto-detect failed: ${error.message}`);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/sources/:index/test - Test scrape a single source configuration in isolation
 * Query params: ?limit=N (override test article count, defaults to source maxArticles or 5)
 */
app.post('/api/sources/:index/test', async (req, res) => {
  const config = readConfig();
  const index = parseInt(req.params.index);

  if (isNaN(index) || index < 0 || index >= config.sources.length) {
    return res.status(404).json({ success: false, error: 'News source index out of bounds.' });
  }

  const source = config.sources[index];
  const { fetchArticles } = require('./scraper');

  // Determine test limit: query param > source maxArticles > global maxArticles > 5
  const globalMax = config.general ? (config.general.maxArticlesPerSource || 3) : 3;
  const testLimit = req.query.limit 
    ? parseInt(req.query.limit) 
    : (source.maxArticles || globalMax);
  
  const diagnostics = {
    strategy: source.strategy || 'html',
    scrapeTimeout: source.scrapeTimeout || 8000,
    crawlDepth: source.crawlDepth || 'list+article',
    retryCount: source.retryCount || 0,
    maxArticles: testLimit,
    priority: source.priority || 5,
    encoding: source.encoding || 'utf-8'
  };

  console.log(`[Server] Isolated scrape test initiated for: ${source.name} [Index ${index}] — limit: ${testLimit}, strategy: ${diagnostics.strategy}, depth: ${diagnostics.crawlDepth}`);
  
  const startTime = Date.now();

  try {
    const articles = await fetchArticles([source], testLimit);
    const durationMs = Date.now() - startTime;

    // Save test diagnostics metadata
    source.lastTestedAt = new Date().toISOString();
    source.lastTestStatus = 'success';
    source.consecutiveFailures = 0; // Reset on success
    delete source.lastTestError;
    saveConfig(config);

    // Distinguish: true success (has articles) vs "empty success" (connected but 0 articles — likely selector mismatch)
    const hasArticles = articles.length > 0;
    res.json({
      success: true,
      hasArticles,
      warning: !hasArticles ? 'تم الاتصال بالمصدر بنجاح لكن لم يتم العثور على أي مقالات. قد يعني هذا أن محددات CSS غير صحيحة أو أن الصفحة فارغة.' : null,
      sourceName: source.name,
      strategy: source.strategy,
      diagnostics,
      durationMs,
      articlesCount: articles.length,
      lastTestedAt: source.lastTestedAt,
      lastTestStatus: source.lastTestStatus,
      consecutiveFailures: 0,
      articles: articles.map(art => ({
        title: art.title,
        url: art.url,
        published_at: art.published_at,
        contentLength: art.content ? art.content.length : 0,
        contentPreview: art.content ? art.content.replace(/<[^>]*>/g, '').slice(0, 400) + '...' : '',
        hasFullContent: !!(art.content && art.content.length > 100)
      }))
    });
  } catch (error) {
    const durationMs = Date.now() - startTime;
    console.error(`[Server Error] Isolated test scraping failed: ${error.message}`);
    
    // Save failed test diagnostics metadata — increment consecutive failures
    source.lastTestedAt = new Date().toISOString();
    source.lastTestStatus = 'failed';
    source.lastTestError = error.message;
    source.consecutiveFailures = (source.consecutiveFailures || 0) + 1;
    saveConfig(config);

    res.json({ 
      success: false, 
      error: `Scraping failed: ${error.message}`,
      diagnostics,
      durationMs,
      lastTestedAt: source.lastTestedAt,
      lastTestStatus: source.lastTestStatus,
      lastTestError: source.lastTestError,
      consecutiveFailures: source.consecutiveFailures
    });
  }
});

/**
 * GET /api/run-stream - SSE (Server-Sent Events) live log pipeline runner
 */
app.get('/api/run-stream', (req, res) => {
  // Establish Server-Sent Events headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive'
  });
  res.write('\n');
  
  // Custom streamer function to write messages to SSE
  const sendLog = (message, type = 'info') => {
    res.write(`data: ${JSON.stringify({ type, message })}\n\n`);
  };
  
  sendLog('Initializing dynamic manual pipeline run...', 'status');
  
  const config = readConfig();
  const sourceIndex = req.query.sourceIndex;
  const sinceDate = req.query.sinceDate;
  let activeSources = [];
  let isSingleTest = false;
  
  if (sourceIndex !== undefined && sourceIndex !== '') {
    const idx = parseInt(sourceIndex, 10);
    if (!isNaN(idx) && idx >= 0 && idx < config.sources.length) {
      activeSources = [config.sources[idx]];
      isSingleTest = true;
    } else {
      sendLog('Aborted: Invalid source index specified for test run.', 'error');
      res.write('data: [DONE]\n\n');
      res.end();
      return;
    }
  } else {
    // Filter: enabled AND not repeatedly broken (skip sources with 3+ consecutive failures)
    const rawActive = config.sources.filter(s => s.enabled);
    const skippedBroken = rawActive.filter(s => (s.consecutiveFailures || 0) >= 3);
    activeSources = rawActive.filter(s => (s.consecutiveFailures || 0) < 3);
    
    if (skippedBroken.length > 0) {
      skippedBroken.forEach(s => {
        sendLog(`⚠️ Skipping "${s.name}" — ${s.consecutiveFailures} consecutive failures. Run an isolated test to re-enable.`, 'error');
      });
    }
  }
  
  if (activeSources.length === 0) {
    sendLog('Aborted: There are 0 active news sources enabled in configuration!', 'error');
    res.write('data: [DONE]\n\n');
    res.end();
    return;
  }
  
  if (isSingleTest) {
    sendLog(`Starting single source isolated test run for: ${activeSources[0].name}...`, 'info');
  } else {
    sendLog(`Identified ${activeSources.length} active sources to scrape...`, 'info');
  }
  
  // Capture global console.log and console.error outputs
  const originalLog = console.log;
  const originalError = console.error;
  
  console.log = (...args) => {
    const output = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' ');
    originalLog.apply(console, args);
    sendLog(output, 'log');
  };
  
  console.error = (...args) => {
    const output = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg) : arg).join(' ');
    originalError.apply(console, args);
    sendLog(output, 'error');
  };
  
  // Define options for runPipeline
  const runOptions = {
    sources: activeSources,
    database: config.general ? config.general.dbPath : 'news_aggregator.db',
    wpConfig: config.wordpress || {},
    rewriterConfig: config.aiRewriter || {},
    rateLimitDelay: config.general ? config.general.rateLimitDelay : 1500,
    maxArticlesPerSource: config.general ? (config.general.maxArticlesPerSource || 3) : 3,
    sinceDate: sinceDate || null
  };
  
  // If it's a single test run, force safe non-mutation dry-run options!
  if (isSingleTest) {
    runOptions.wpConfig = { ...config.wordpress, isDryRun: true };
    runOptions.rewriterConfig = { ...config.aiRewriter, isDryRun: true }; // offline mock AI
    
    // Pass a mock non-writing database to ensure zero mutations to news_aggregator.db
    // But allow processing everything (even duplicates) so they can test exactly what the scraper fetches!
    runOptions.database = {
      isDuplicate: () => false, // Always say false so it processes all fetched articles to show them in the logs!
      saveArticle: () => 1,
      pruneOldRecords: () => 0,
      close: () => {}
    };
  }
  
  // Run the pipeline asynchronously
  runPipeline(runOptions).then((stats) => {
    sendLog('==================================================', 'info');
    if (isSingleTest) {
      sendLog(`Isolated test run finished. Articles fetched: ${stats.articlesScraped}, Simulated Published: ${stats.articlesPublished}, Failures: ${stats.publishFailures}`, 'status');
    } else {
      sendLog(`Aggregation finished. Scraped: ${stats.articlesScraped}, Bypassed duplicates: ${stats.duplicatesSkipped}, Rewritten: ${stats.articlesRewritten}, Published: ${stats.articlesPublished}, Failures: ${stats.publishFailures}`, 'status');
    }
    sendLog('==================================================', 'info');
  }).catch((err) => {
    sendLog(`Pipeline Execution Error: ${err.message}`, 'error');
  }).finally(() => {
    // Restore original console log methods
    console.log = originalLog;
    console.error = originalError;
    
    // Close the connection
    res.write('data: [DONE]\n\n');
    res.end();
  });
  
  // Clean up if the user closes or aborts the browser tab
  req.on('close', () => {
    console.log = originalLog;
    console.error = originalError;
  });
});

// ----------------------------------------------------
// LISTEN
// ----------------------------------------------------
app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`  Syrian News Aggregator Dashboard Server is running!  `);
  console.log(`  Access the Premium UI: http://localhost:${PORT}        `);
  console.log(`======================================================\n`);
});
