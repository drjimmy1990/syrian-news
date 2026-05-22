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
    const { wordpress, aiRewriter, general } = req.body;
    
    if (wordpress) config.wordpress = wordpress;
    if (aiRewriter) config.aiRewriter = aiRewriter;
    if (general) config.general = general;
    
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
 * POST /api/sources/:index/test - Test scrape a single source configuration in isolation
 */
app.post('/api/sources/:index/test', async (req, res) => {
  try {
    const config = readConfig();
    const index = parseInt(req.params.index);

    if (isNaN(index) || index < 0 || index >= config.sources.length) {
      return res.status(404).json({ success: false, error: 'News source index out of bounds.' });
    }

    const source = config.sources[index];
    const { fetchArticles } = require('./scraper');

    console.log(`[Server] Isolated scrape test initiated for: ${source.name} [Index ${index}]`);

    // Force limit of 2 for testing, but let's use the source config itself if available
    const articles = await fetchArticles([source], 2);

    res.json({
      success: true,
      sourceName: source.name,
      strategy: source.strategy,
      articlesCount: articles.length,
      articles: articles.map(art => ({
        title: art.title,
        url: art.url,
        published_at: art.published_at,
        contentLength: art.content ? art.content.length : 0,
        contentPreview: art.content ? art.content.replace(/<[^>]*>/g, '').slice(0, 300) + '...' : ''
      }))
    });
  } catch (error) {
    console.error(`[Server Error] Isolated test scraping failed:`, error);
    res.json({ success: false, error: `Scraping failed: ${error.message}` });
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
    activeSources = config.sources.filter(s => s.enabled);
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
    maxArticlesPerSource: config.general ? (config.general.maxArticlesPerSource || 3) : 3
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
