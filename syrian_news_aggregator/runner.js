/**
 * runner.js - Automation Pipeline Orchestrator with AI Rewriting
 */

const Datastore = require('./db');
const { fetchArticles } = require('./scraper');
const WordPressPublisher = require('./publisher');
const ContentRewriter = require('./rewriter');

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Executes the entire Syrian News Aggregator pipeline, including optional AI Rewriting.
 * 
 * @param {Object} options Pipeline options
 * @param {Array<Object>} options.sources List of news source configurations
 * @param {string|Object} options.database SQLite DB path or Datastore instance
 * @param {Object} options.wpConfig WordPress configuration options or WordPressPublisher instance
 * @param {Object} options.rewriterConfig AI Rewriter configurations or ContentRewriter instance
 * @param {number} options.rateLimitDelay Delay between processing distinct sources in ms (default: 1500)
 * @returns {Promise<Object>} Execution stats summary
 */
async function runPipeline(options = {}) {
  const {
    sources = [],
    database,
    wpConfig = {},
    rewriterConfig = {},
    rateLimitDelay = 1500,
    maxArticlesPerSource = 3
  } = options;

  console.log(`[Runner] Starting pipeline execution for ${sources.length} sources...`);
  
  // 1. Initialize Datastore
  let db;
  let closeDbAtEnd = false;
  if (database && typeof database.isDuplicate === 'function') {
    db = database;
  } else {
    const dbPath = typeof database === 'string' ? database : 'news_aggregator.db';
    db = new Datastore(dbPath);
    closeDbAtEnd = true;
  }

  // 2. Initialize WordPress Publisher
  let publisher;
  if (wpConfig && typeof wpConfig.publishArticle === 'function') {
    publisher = wpConfig;
  } else {
    publisher = new WordPressPublisher(wpConfig);
  }

  // 3. Initialize AI Content Rewriter
  let rewriter;
  if (rewriterConfig && typeof rewriterConfig.rewriteContent === 'function') {
    rewriter = rewriterConfig;
  } else {
    rewriter = new ContentRewriter(rewriterConfig);
  }

  const stats = {
    totalSources: sources.length,
    articlesScraped: 0,
    duplicatesSkipped: 0,
    articlesRewritten: 0,
    articlesPublished: 0,
    publishFailures: 0
  };

  try {
    for (let i = 0; i < sources.length; i++) {
      const source = sources[i];
      console.log(`\n[Runner] [${i + 1}/${sources.length}] Processing source: ${source.name}`);
      
      try {
        // Fetch articles from the source (returns formatted Article schemas)
        const articles = await fetchArticles([source], maxArticlesPerSource);
        console.log(`[Runner] Found ${articles.length} articles for ${source.name}`);
        
        for (const article of articles) {
          stats.articlesScraped++;
          
          // Check for duplication in SQLite
          const isDuplicate = db.isDuplicate(article);
          if (isDuplicate) {
            console.log(`[Runner] Duplicate detected. Skipping: "${article.title}" (${article.url})`);
            stats.duplicatesSkipped++;
            continue;
          }

          console.log(`[Runner] New article found: "${article.title}".`);

          // Execute AI Content Rewriting step if enabled
          if (rewriter.enabled) {
            console.log(`[Runner] AI Rewriting enabled. Paraphrasing content...`);
            const originalContent = article.content;
            const rewrittenContent = await rewriter.rewriteContent(originalContent);
            
            if (rewrittenContent && rewrittenContent !== originalContent) {
              article.content = rewrittenContent;
              stats.articlesRewritten++;
              console.log(`[Runner] Content successfully rewritten by AI.`);
            } else {
              console.log(`[Runner] Content left unmodified by AI (or bypass triggered).`);
            }
          }

          console.log(`[Runner] Publishing article to WordPress...`);
          
          // Publish article (which will contain the rewritten content if executed)
          const publishResult = await publisher.publishArticle(article);
          
          if (publishResult.success) {
            console.log(`[Runner] Successfully published! WP Post ID: ${publishResult.postId}`);
            
            // Save article signature & WP post ID to database
            const insertId = db.saveArticle(article, publishResult.postId);
            if (insertId) {
              stats.articlesPublished++;
            }
          } else {
            console.error(`[Runner Error] Failed to publish article: "${article.title}". Error: ${publishResult.error}`);
            stats.publishFailures++;
            
            // Still register the article in DB (without WP Post ID) to prevent infinite re-tries next time
            db.saveArticle(article, null);
          }
        }
      } catch (srcErr) {
        console.error(`[Runner Error] Critical failure scraping/publishing for source ${source.name}: ${srcErr.message}`);
      }

      // Enforce firewall-bypassing rate limit between different sources
      if (i < sources.length - 1) {
        const delay = typeof rateLimitDelay === 'function' 
          ? rateLimitDelay() 
          : (Math.floor(Math.random() * 1000) + rateLimitDelay); // add jitter
        console.log(`[Runner] Sleeping for ${delay}ms to protect rate limits...`);
        await sleep(delay);
      }
    }

    // 4. Database Maintenance Pruning (Older than 90 days)
    console.log('\n[Runner] Executing SQLite maintenance and pruning...');
    const prunedCount = db.pruneOldRecords(90);
    console.log(`[Runner] Pruned ${prunedCount} records older than 90 days.`);

  } finally {
    if (closeDbAtEnd) {
      db.close();
      console.log('[Runner] SQLite connection closed.');
    }
  }

  console.log('\n[Runner] Pipeline execution finished.');
  console.log(`Summary: Sources: ${stats.totalSources}, Scraped: ${stats.articlesScraped}, Duplicates Skipped: ${stats.duplicatesSkipped}, Rewritten by AI: ${stats.articlesRewritten}, Published: ${stats.articlesPublished}, Failures: ${stats.publishFailures}`);
  
  return stats;
}

module.exports = {
  runPipeline
};
