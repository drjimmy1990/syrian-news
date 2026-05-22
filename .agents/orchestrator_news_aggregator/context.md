# Context: Syrian News Aggregator and WP Posting System

## Core Requirements & Specifications
1. **Sc scraper engine:** Supporting standard RSS, HTML crawling (fallback for broken RSS or sites without RSS), and WordPress REST API `/wp-json/wp/v2/posts` detection/querying.
2. **Deduplication:** Hashing (URL, title, or content similarity) stored in SQLite datastore.
3. **WordPress Publisher:** Connection to WP REST API with title, content, external source link, publication date.
4. **Automation layer:** Node.js script designed to be run via a cron job every 10–15 minutes.
5. **E2E verification:** Runs 3 types of feeds, zero-duplicates back-to-back testing, and WP posting verification.
6. **AI Rewriting stage:** Dynamic paraphrasing/rewriting of harvested articles before posting. Supports configurable OpenAI/LLM endpoints, parameter overrides, optional bypasses, mock LLM pipelines for tests, and exports n8n workflow integration mappings.

## Technology Stack
- **Runtime:** Node.js (matching existing Wonderful Faraday dashboard).
- **Libraries:**
  - Database: `better-sqlite3` or standard `sqlite3`
  - Fetching/Parsing: `rss-parser`, `jsdom` or `cheerio` (for HTML parsing), and built-in `fetch` or `axios`
  - Testing: Local native test suite or custom E2E runner (similar to `e2e_test_runner.js` in root)

## Network restrictions
- Parent orchestrator is in `CODE_ONLY` network mode and cannot query the internet directly.
- The scraping and WP posting scripts should run in the user's terminal environment (which has full internet access) or be validated with mock interfaces during test execution, so that E2E tests pass reliably without real credential requirements.

## GitNexus Integration Rules
- Always run `gitnexus_impact` before modifying any symbol.
- Always run `gitnexus_detect_changes` before committing or completing the phase.
