# Implementation Plan: Syrian News Aggregator and WP Posting System

## Objective
Design, implement, and verify a robust Node.js-based Syrian News Aggregator and WordPress posting system with deduplication, scraper fallback, and automated cron execution.

## Verification Gates
Each milestone requires clean build, E2E test confirmation, and a Clean Forensic Audit verdict.

## Plan Checklist

- [x] **Milestone 1: Environment Exploration & Design Specs**
  - **Goal**: Research workspace, discover available libraries, verify node environment, and construct full architecture design.
  - **Explorer Task**:
    - Query environment for Node.js, SQLite, or other CLI tools.
    - Check for existing WordPress API test setups or credentials.
    - Review the list of 37 Syrian news websites.
    - Write a detailed report proposing libraries (e.g. `sqlite3` or `better-sqlite3`, `feedparser` or `rss-parser`, `axios` or standard `fetch`).
  - **Gate**: Explorer handoff matches Project guidelines. (DONE)

- [x] **Milestone 2: Scraper Engine (RSS / WP API / HTML Crawler)**
  - **Goal**: Parse active RSS, retrieve posts from WordPress JSON APIs where available, and crawl HTML for sites with broken/missing RSS.
  - **Worker Task**:
    - Implement `scraper.js` supporting standard RSS, single-item RSS, WP-JSON fallback, and custom HTML selectors for at least 3 representative feeds.
    - Output raw article objects containing: `title`, `content` (text/HTML), `url`, `source_name`, and `published_at`.
  - **Gate**: Scraper engine unit tests and Reviewer audit. (DONE)

- [x] **Milestone 3: Lightweight Datastore & Deduplication**
  - **Goal**: Build SQLite database and deduplication logic with title, URL, or similarity hashing.
  - **Worker Task**:
    - Implement `db.js` with SQLite schema (articles table, unique hash constraint).
    - Design hashing/similarity checking function (SHA256 of URL/title, or basic similarity metric).
    - Ensure consecutive runs produce 0 duplicate entries in the database or WordPress.
  - **Gate**: Zero duplicate postings confirmed in unit tests. (DONE)

- [x] **Milestone 4: WordPress Publisher & AI Rewriter Integration**
  - **Goal**: Connect to WP REST API, support creating posts with title, content, external source attribution, and draft/publish status. Incorporate an AI rewriting stage (paraphrasing or rewriting the news content) before publishing, with configurable bypass and mock LLM API responses. Export n8n workflow structures representing the pipeline (Fetch → Deduplicate → AI Rewrite → Publish).
  - **Worker Task**:
    - Implement `publisher.js` utilizing WordPress REST API with proper authorization headers.
    - Implement an AI rewriting module (`rewriter.js` or method in `publisher.js` / `runner.js`) compatible with custom OpenAI/LLM APIs, featuring configurable parameters (enable/disable rewriting, API endpoints, custom prompt instructions).
    - Design mock capability so the system can run E2E test runs successfully even if real WP credentials or LLM API keys are not provided (mocking both WordPress and the LLM API responses).
    - Write n8n workflow output templates showing the n8n nodes for feed fetching, deduplication check, AI rewriting (paraphrasing), and WordPress post creation.
  - **Gate**: Test post and AI rewriter step successfully verified in dry-run mode. (DONE)

- [x] **Milestone 5: Automation Cron Layer & E2E Test Suite**
  - **Goal**: Create executable script (`index.js` / `runner.js`) for the cron system and a full E2E test suite (`test_aggregator.js`).
  - **Worker/Challenger Task**:
    - Implement the scheduler logic running every 10–15 minutes (or manual CLI trigger).
    - Implement `test_aggregator.js` verifying 3 feed types (active RSS, single RSS, HTML scrape), deduplication (back-to-back run zero duplicates), and WordPress API posting.
  - **Gate**: E2E test suite created and fully passing. (DONE)

- [x] **Milestone 6: Verification & Forensic Audit**
  - **Goal**: Verify complete compliance of the Syrian News Aggregator and WP posting system.
  - **Auditor Task**:
    - Run Forensic Auditor to ensure no hardcoded bypasses, dummy logic, or integrity violations exist.
  - **Gate**: Auditor verdict CLEAN. (DONE)

