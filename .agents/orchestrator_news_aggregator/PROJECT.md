# Project: Syrian News Aggregator and WordPress Posting System

## Architecture
- **Scraper Engine (`scraper.js`):** Modular news fetching system that parses RSS feeds, falls back to raw HTML scraping (using custom selectors for lists/articles), and queries `/wp-json/wp/v2/posts` WordPress JSON API endpoint.
- **Lightweight Datastore (`db.js`):** SQLite database to track processed news articles with title/URL/similarity hashing to prevent duplicates.
- **WordPress Publisher (`publisher.js`):** Integrates with WordPress REST API to create posts, supporting title, content, external source attribution, and draft/publish modes. Includes a full mock fallback for testing without real credentials.
- **AI Rewriter Module (`rewriter.js`):** Paraphrases or rewrites news article content before publishing, supporting external OpenAI/LLM API endpoints, configuration overrides, optional bypasses, and mock LLM pipelines. Exports a standardized n8n JSON workflow integration structure.
- **Automation / Orchestration Runner (`runner.js`):** Main entry point executing the workflow (Fetch → Deduplicate → AI Rewrite → Publish) and configured to run as a cron or scheduled process.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Environment Exploration & Design Specs | Gather system specifications, verify Node/SQLite environment, outline news sites, define selectors/APIs, draft architecture and libraries. | None | DONE |
| 2 | Scraper Engine Implementation | Core fetching engine supporting RSS feeds, WP JSON fallbacks, and HTML crawlers for at least 3 types of feeds. | M1 | DONE |
| 3 | SQLite Datastore & Deduplication | Schema design, SHA256/Similarity hashing integration, back-to-back duplicate prevention testing. | M1, M2 | DONE |
| 4 | WordPress REST API Publisher & AI Rewriter | Publisher module mapping all custom fields, and an AI rewriting/paraphrasing module with mock APIs and exported n8n templates. | M1, M3 | DONE |
| 5 | Automation Cron Layer & E2E Test Suite | Core runner script. Comprehensive unit and integration test suite asserting happy path, scraper modes, deduplication, AI rewriting, and WP publishing. | M2, M3, M4 | DONE |
| 6 | Verification & Forensic Audit | Verification and forensic audit checklist validating clean implementation with zero integrity failures. | M5 | DONE |


## Interface Contracts
### Scraper Engine ↔ Database ↔ AI Rewriter ↔ Publisher (`runner.js` pipeline)
- `fetchArticles(sources)`: Returns an array of article objects: `{ title, content, url, source_name, published_at }`.
- `isDuplicate(article)`: Database check using title/URL/similarity hash. Returns boolean.
- `rewriteArticle(article, config)`: Rewrites or paraphrases the article content using OpenAI/LLM API. Supports mock fallback and enable/disable bypass.
- `saveArticle(article)`: Saves article metadata and hash to SQLite datastore.
- `publishToWordPress(article)`: Calls WP REST API to create a post. Falls back to mock publisher if WP credentials are not set.
