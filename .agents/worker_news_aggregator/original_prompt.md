## 2026-05-23T22:38:25Z

You are the Implementation Worker for the Syrian News Aggregator and WP Posting System.
Your working directory is: C:\Users\LOQ\Documents\antigravity\wonderful-faraday\.agents\worker_news_aggregator

Your mission is to implement and verify the entire Syrian News Aggregator system based on the detailed blueprints provided by Explorer 1, 2, and 3:
1. Read the handoff reports from:
   - Explorer 1: C:\Users\LOQ\Documents\antigravity\wonderful-faraday\.agents\explorer_news_1\handoff.md (Unified blueprint & environment setup)
   - Explorer 2: C:\Users\LOQ\Documents\antigravity\wonderful-faraday\.agents\explorer_news_2\handoff.md (Scraper engine details)
   - Explorer 3: C:\Users\LOQ\Documents\antigravity\wonderful-faraday\.agents\explorer_news_3\handoff.md (Database & WordPress publisher details)

2. Implement the following files inside C:\Users\LOQ\Documents\antigravity\wonderful-faraday\syrian_news_aggregator\:
   - `db.js`: SQLite schema initialization, URL normalizer (strips protocols, tracking parameters, subdomains, trailing slashes), Arabic text normalizer (strips diacritics/tashkeel, unifies letters), exact hash check on URL & Title, Jaccard similarity near-duplicate title scoring (using past 7 days window, 0.85 threshold), database prune routine (older than 90 days), and save/retrieve functions.
   - `scraper.js`: High-resiliency scraper engine. Implements standard `rss-parser` queries, Cheerio HTML list/article scraping, and `probeWordPressAPI` detector. Handles Arabic characters gracefully using `iconv-lite` decodings. Exposes `fetchArticles(sources)` interface.
   - `publisher.js`: WordPress REST API publisher using Basic Auth (WordPress Application Passwords). Formats the body content with an elegant HTML blockquote attribution box (source name, date, link to original URL) at the bottom. Supports draft/publish modes. Includes a complete local dry-run Mock Publisher fallback class mimicking API delays, payload validation, and return schemas to support test execution.
   - `runner.js`: The central automation pipeline orchestrator. Reads the news source configurations, runs them sequentially with strict rate-limit delay sleeps (e.g. 1000ms–2000ms) to bypass basic firewalls, checks duplicates in `db.js`, fetches full body text via `scraper.js` if necessary, publishes to WordPress via `publisher.js`, and logs metadata in `db.js`.
   - `test_aggregator.js`: A comprehensive, self-contained E2E and Unit verification test suite that executes successfully in Node.js, asserting:
     - Scraper runs and fetches news from 3 distinct feed types (active RSS, single-item RSS/list crawler fallback, and pure HTML scraper using mock HTML/XML data or static files).
     - Arabic diacritics stripping and normalization.
     - Jaccard title similarity and exact URL duplicate checks (consecutive runs return zero duplicates).
     - WordPress mock publication and database linking.

3. Run the test suite (`node test_aggregator.js`) and ensure 100% of the assertions pass cleanly.

4. Follow GitNexus integration rules:
   - Since these are brand-new modules, you don't need to run impact analysis before creating them, but you MUST run `detect_changes` on the GitNexus server (or term command) to verify the index tracks the new files and execution flows correctly before completing your work!

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A Forensic Auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Once complete, write your handoff report (including implemented files, test commands, and exact terminal outputs) to `C:\Users\LOQ\Documents\antigravity\wonderful-faraday\.agents\worker_news_aggregator\handoff.md` and send a message back to the orchestrator (conversation ID: 957890fd-1327-4360-8284-6ff2b92e7143) using send_message.

## 2026-05-23T22:40:27Z

**Context**: Integration of AI Rewriting Stage Requirement (System Implementation Worker)
**Content**: High priority update! The user has added a new core requirement for the Syrian News Aggregator and WordPress posting system. 

Requirement (verbatim):
"The system must support integrating an AI rewriting step (specifically compatible with n8n workflows or a custom OpenAI/LLM API rewrite stage) to paraphrase or rewrite the news article content before publishing it to WordPress. Please incorporate this into the system design, the scraper/publisher pipeline, and the final n8n workflow output."

Please incorporate this into your implementation:
1. Create an AI rewriting module (`rewriter.js` or similar) that integrates with standard OpenAI/LLM REST APIs to paraphrase/rewrite news content before publication.
2. Ensure there are configuration settings to enable/disable (bypass) this step, set endpoints, custom prompt instructions, and credentials.
3. Build a dry-run mock LLM API capability so that local E2E test runs (`test_aggregator.js`) can execute successfully without external internet connections or live API keys (mocking the rewrite response).
4. Update the test suite (`test_aggregator.js`) to assert that when enabled, news articles are successfully rewritten (using mock responses in test dry-runs) before WordPress publishing.
5. Create a standardized n8n workflow JSON structure or template (e.g., `n8n_workflow.json` or in a guide) showing the sequential pipeline: Feed Fetching -> SQLite Deduplication Check -> AI Rewrite (paraphrasing via LLM node) -> WordPress Draft Posting.

**Action**: Please reply to acknowledge receipt of this high-priority requirement and confirm it is integrated into your implementation tasks!
