/**
 * index.js - Central Gateway & CLI Pipeline Coordinator
 */

const fs = require('fs');
const path = require('path');
const { runPipeline } = require('./runner');

// Path to central configuration file
const CONFIG_PATH = path.join(__dirname, 'config.json');

/**
 * Loads the active config.json file, with fail-safe defaults.
 */
function loadConfig() {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const rawData = fs.readFileSync(CONFIG_PATH, 'utf-8');
      return JSON.parse(rawData);
    }
  } catch (error) {
    console.error(`[Gateway Error] Failed loading config.json: ${error.message}`);
  }
  
  // Return baseline empty schema if file is missing or corrupted
  return {
    wordpress: { wpUrl: '', username: '', appPassword: '', statusMode: 'draft', isDryRun: true },
    aiRewriter: { enabled: false, isDryRun: true, apiKey: '', model: 'gpt-4o-mini' },
    general: { dbPath: 'news_aggregator.db', rateLimitDelay: 1500 },
    sources: []
  };
}

/**
 * Executes the aggregator pipeline using settings saved in config.json
 */
async function executeCLI() {
  console.log('==================================================');
  console.log('      SYRIAN NEWS AGGREGATOR CRON EXECUTION       ');
  console.log('==================================================');
  
  const config = loadConfig();
  
  // Filter active sources only
  const activeSources = (config.sources || []).filter(s => s.enabled);
  
  if (activeSources.length === 0) {
    console.log('[Gateway Warning] No active news sources enabled in configuration. Exiting.');
    return;
  }
  
  console.log(`[Gateway] Processing ${activeSources.length} active sources...`);
  
  try {
    const stats = await runPipeline({
      sources: activeSources,
      database: config.general ? config.general.dbPath : 'news_aggregator.db',
      wpConfig: config.wordpress || {},
      rewriterConfig: config.aiRewriter || {},
      rateLimitDelay: config.general ? config.general.rateLimitDelay : 1500,
      maxArticlesPerSource: config.general ? (config.general.maxArticlesPerSource || 3) : 3
    });
    
    console.log('\n[Gateway] Cron execution completed successfully.');
    process.exit(0);
  } catch (error) {
    console.error(`\n[Gateway Critical Error] Pipeline crash: ${error.message}`);
    process.exit(1);
  }
}

/**
 * Executes an isolated scraper run for a single news source, printing results to stdout.
 * @param {string} sourceNameOrIndex Name or 0-based configuration index of the source to test
 */
async function executeCLITest(sourceNameOrIndex) {
  const config = loadConfig();
  
  if (sourceNameOrIndex === 'all') {
    console.log('==================================================');
    console.log('      ISOLATED TEST: ALL ENABLED SOURCES          ');
    console.log('==================================================');
    
    const activeSources = (config.sources || []).filter(s => s.enabled);
    if (activeSources.length === 0) {
      console.log('[Gateway Test] No active news sources enabled in configuration.');
      process.exit(0);
    }
    
    console.log(`[Gateway Test] Found ${activeSources.length} enabled sources. Initiating 1-article diagnostics crawl...\n`);
    
    const { fetchArticles } = require('./scraper');
    const results = [];
    
    for (let i = 0; i < activeSources.length; i++) {
      const source = activeSources[i];
      process.stdout.write(`[${i + 1}/${activeSources.length}] Testing "${source.name}"... `);
      
      try {
        const articles = await fetchArticles([source], 1); // fetch exactly 1 article
        if (articles.length > 0) {
          console.log(`✔ SUCCESS (${articles[0].title.slice(0, 40)}...)`);
          results.push({ name: source.name, status: 'SUCCESS', details: `Fetched: "${articles[0].title.slice(0, 50)}..."` });
        } else {
          console.log(`⚠ WARNING (0 articles fetched)`);
          results.push({ name: source.name, status: 'WARNING', details: 'No articles returned by scraper' });
        }
      } catch (err) {
        console.log(`✘ FAILED (${err.message})`);
        results.push({ name: source.name, status: 'FAILED', details: err.message });
      }
      
      // Gentle sleep between tests
      if (i < activeSources.length - 1) {
        await new Promise(r => setTimeout(r, 400));
      }
    }
    
    console.log('\n==================================================');
    console.log('            DIAGNOSTIC TEST SUMMARY               ');
    console.log('==================================================');
    results.forEach((res, idx) => {
      const statusIcon = res.status === 'SUCCESS' ? '✔' : res.status === 'WARNING' ? '⚠' : '✘';
      console.log(` [${String(idx).padStart(2, '0')}] ${res.name.padEnd(25, ' ')} | [${res.status}] ${statusIcon} | ${res.details}`);
    });
    console.log('==================================================\n');
    process.exit(results.some(r => r.status === 'FAILED') ? 1 : 0);
  }
  
  console.log('==================================================');
  console.log(`      ISOLATED SCRAPER TEST: ${sourceNameOrIndex}  `);
  console.log('==================================================');
  
  let source;
  
  // Attempt to find by index first
  const parsedIndex = parseInt(sourceNameOrIndex, 10);
  if (!isNaN(parsedIndex) && parsedIndex >= 0 && parsedIndex < config.sources.length) {
    source = config.sources[parsedIndex];
  } else {
    // Fallback to finding by exact name matching
    source = (config.sources || []).find(s => s.name === sourceNameOrIndex);
  }
  
  if (!source) {
    console.error(`[Gateway Error] Source "${sourceNameOrIndex}" not found in config.json.`);
    console.log('\nAvailable source names:');
    (config.sources || []).forEach((s, idx) => console.log(` [${idx}] ${s.name}`));
    process.exit(1);
  }
  
  const { fetchArticles } = require('./scraper');
  try {
    console.log(`[Gateway Test] Fetching live data for source: ${source.name}...`);
    console.log(`[Gateway Test] Strategy: ${source.strategy}`);
    if (source.strategy === 'rss') console.log(`[Gateway Test] RSS URL: ${source.rssUrl}`);
    else console.log(`[Gateway Test] Base URL: ${source.url}`);
    
    const articles = await fetchArticles([source], 2); // scrape at most 2 items
    
    console.log(`\n[Gateway Test] Successfully crawled ${articles.length} articles!`);
    console.log('==================================================');
    
    articles.forEach((art, index) => {
      console.log(`\n[Article #${index + 1}]`);
      console.log(`Title:        ${art.title}`);
      console.log(`URL:          ${art.url}`);
      console.log(`Date:         ${art.published_at}`);
      console.log(`Content Len:  ${art.content ? art.content.length : 0} chars`);
      
      const cleanTxt = (art.content || '').replace(/<[^>]*>/g, '').trim();
      const preview = cleanTxt.length > 200 ? `${cleanTxt.slice(0, 200)}...` : cleanTxt;
      console.log(`Preview text: ${preview || '(No text content extracted)'}`);
      console.log('--------------------------------------------------');
    });
    
    process.exit(0);
  } catch (err) {
    console.error(`\n[Gateway Test Error] Scraper run crashed: ${err.message}`);
    process.exit(1);
  }
}

// ----------------------------------------------------
// BOOTSTRAP GATEWAY
// ----------------------------------------------------

const args = process.argv.slice(2);
const isCronMode = args.includes('--cron') || args.includes('--pipeline');
const testIndex = args.indexOf('--test');

if (testIndex !== -1 && testIndex + 1 < args.length) {
  const targetSource = args[testIndex + 1];
  executeCLITest(targetSource);
} else if (isCronMode) {
  // Execute aggregation pipeline headlessly (for Crontab or scheduling)
  executeCLI();
} else {
  // Launch the Premium Web Dashboard (starts Express server)
  console.log('[Gateway] Starting Premium Web Dashboard backend...');
  require('./server');
}
