# 📡 Syrian News Aggregator — API & Production Guide

> **Base URL:** `http://localhost:3000`  
> **Dashboard:** `http://localhost:3000`  
> **Content-Type:** `application/json`

---

## 📋 Table of Contents

1. [Full Production Flow](#-full-production-flow)
2. [Quick Start](#-quick-start)
3. [API Endpoints Reference](#-api-endpoints-reference)
   - [Configuration](#%EF%B8%8F-configuration)
   - [Sources Management](#-sources-management)
   - [Articles](#-articles)
   - [Testing & Diagnostics](#-testing--diagnostics)
   - [Pipeline Execution](#-pipeline-execution)
4. [n8n Integration](#-n8n-integration)
5. [Per-Source Controls Reference](#-per-source-controls-reference)
6. [Error Handling](#-error-handling)

---

## 🔄 Full Production Flow

```
┌─────────────────────────────────────────────────────────────┐
│                   PRODUCTION PIPELINE                       │
│                                                             │
│  1. CONFIGURE                                               │
│     ├─ Add news sources (URL, strategy, selectors)          │
│     ├─ Set per-source limits (maxArticles, timeout, etc.)   │
│     ├─ Enable/Disable sources with ON/OFF toggle            │
│     └─ Configure WordPress + AI Rewriter credentials        │
│                                                             │
│  2. TEST (per source)                                       │
│     ├─ Click 🧪 flask button on each source                │
│     ├─ Verify articles are fetched correctly                │
│     ├─ Check content status (full vs empty)                 │
│     └─ Review diagnostics (time, strategy, depth)           │
│                                                             │
│  3. RUN PIPELINE (manual or scheduled via n8n)              │
│     ├─ Fetch articles from all enabled sources              │
│     ├─ Skip duplicates (URL + title hash check)             │
│     ├─ AI Rewrite content (optional, via n8n)               │
│     ├─ Publish to WordPress                                 │
│     └─ Log results per source                               │
│                                                             │
│  4. AI DEDUP (n8n workflow, runs every 15 min)              │
│     ├─ Fetch recent unprocessed titles                      │
│     ├─ Compare against last 50 published titles             │
│     ├─ Mark duplicates as skipped                           │
│     └─ Allow unique articles to proceed                     │
│                                                             │
│  5. MONITOR                                                 │
│     ├─ Dashboard shows live stats                           │
│     ├─ Sources auto-disable after 3 consecutive failures    │
│     └─ Per-source stats show health metrics                 │
└─────────────────────────────────────────────────────────────┘
```

### Step-by-Step Production Setup

#### 1. Start the server
```bash
cd syrian_news_aggregator
npm install
node server.js
```

#### 2. Open the dashboard
Open `http://localhost:3000` in your browser.

#### 3. Configure WordPress connection
Go to **⚙️ Settings** tab → fill in:
- WordPress URL (e.g., `https://yoursite.com`)
- WordPress Username
- WordPress Application Password
- Click **Test Connection** to verify

#### 4. Add news sources
Go to **📰 Sources** tab → click **إضافة مصدر جديد** → fill in:
- Source name, URL, RSS URL (optional)
- Strategy: `wp_api`, `rss`, `html`, or `sitemap`
- CSS Selectors (for html strategy)
- Per-source controls (maxArticles, timeout, depth, priority)

#### 5. Test each source
Click the **🧪** button on each source row to run a production-identical test.

#### 6. Enable/Disable sources
Use the **ON/OFF toggle** in the sources table. Green = مفعّل (active), Red = معطّل (disabled).

#### 7. Run the pipeline
- **Manual:** Click **▶️ تشغيل الجلب** in the Terminal tab
- **Scheduled:** Set up the n8n workflow to run automatically

---

## 🚀 Quick Start

```bash
# Check server health
curl http://localhost:3000/api/stats

# List all sources
curl http://localhost:3000/api/config | jq '.config.sources[] | {name, enabled, strategy}'

# Test a specific source (index 0)
curl -X POST http://localhost:3000/api/sources/0/test

# Run full pipeline (SSE stream)
curl -N http://localhost:3000/api/run-stream

# Enable a source (index 0)
curl -X PUT http://localhost:3000/api/sources/0 \
  -H "Content-Type: application/json" \
  -d '{"enabled": true}'

# Disable a source (index 0)
curl -X PUT http://localhost:3000/api/sources/0 \
  -H "Content-Type: application/json" \
  -d '{"enabled": false}'
```

---

## 📚 API Endpoints Reference

---

### ⚙️ Configuration

#### `GET /api/config`
Returns the full system configuration including all sources, WordPress settings, and AI rewriter settings.

```bash
curl http://localhost:3000/api/config
```

**Response:**
```json
{
  "success": true,
  "config": {
    "general": {
      "dbPath": "news_aggregator.db",
      "maxArticlesPerSource": 3,
      "rateLimitDelay": 1500
    },
    "sources": [...],
    "wordpress": { "url": "...", "username": "...", "appPassword": "..." },
    "aiRewriter": { "n8nWebhookUrl": "..." }
  }
}
```

---

#### `POST /api/config`
Update the full system configuration.

```bash
curl -X POST http://localhost:3000/api/config \
  -H "Content-Type: application/json" \
  -d '{
    "general": {
      "maxArticlesPerSource": 5,
      "rateLimitDelay": 2000
    },
    "wordpress": {
      "url": "https://yoursite.com",
      "username": "admin",
      "appPassword": "xxxx xxxx xxxx xxxx"
    }
  }'
```

---

### 📰 Sources Management

#### `POST /api/sources`
Add a new news source.

```bash
curl -X POST http://localhost:3000/api/sources \
  -H "Content-Type: application/json" \
  -d '{
    "name": "سانا",
    "url": "https://sana.sy",
    "rssUrl": "https://sana.sy/feed",
    "strategy": "rss",
    "enabled": true,
    "maxArticles": 10,
    "scrapeTimeout": 10000,
    "retryCount": 2,
    "crawlDepth": "list+article",
    "priority": 1,
    "encoding": "utf-8",
    "selectors": {
      "articleContainer": "article",
      "titleLink": "h2 a",
      "fullArticleBody": ".entry-content",
      "dateSelector": "time[datetime]"
    }
  }'
```

---

#### `PUT /api/sources/:index`
Update an existing source by its index.

**Enable a source:**
```bash
curl -X PUT http://localhost:3000/api/sources/0 \
  -H "Content-Type: application/json" \
  -d '{"enabled": true}'
```

**Disable a source:**
```bash
curl -X PUT http://localhost:3000/api/sources/0 \
  -H "Content-Type: application/json" \
  -d '{"enabled": false}'
```

**Update per-source production controls:**
```bash
curl -X PUT http://localhost:3000/api/sources/0 \
  -H "Content-Type: application/json" \
  -d '{
    "maxArticles": 15,
    "scrapeTimeout": 15000,
    "retryCount": 3,
    "crawlDepth": "list",
    "priority": 2
  }'
```

**Reset a broken source (clear consecutive failures):**
```bash
curl -X PUT http://localhost:3000/api/sources/0 \
  -H "Content-Type: application/json" \
  -d '{"consecutiveFailures": 0, "enabled": true}'
```

---

#### `DELETE /api/sources/:index`
Delete a source by its index.

```bash
curl -X DELETE http://localhost:3000/api/sources/2
```

---

#### `GET /api/sources/stats`
Get per-source database statistics (article counts, date ranges).

```bash
curl http://localhost:3000/api/sources/stats
```

**Response:**
```json
{
  "success": true,
  "stats": [
    {
      "source_name": "عنب بلدي",
      "article_count": 45,
      "first_article": "2025-01-15",
      "last_article": "2025-05-26"
    }
  ]
}
```

---

#### `POST /api/sources/auto-detect`
Auto-detect the best scraping strategy for a URL.

```bash
curl -X POST http://localhost:3000/api/sources/auto-detect \
  -H "Content-Type: application/json" \
  -d '{"url": "https://enabbaladi.net"}'
```

---

#### `POST /api/sources/ai-detect`
Use AI to detect CSS selectors for a source.

```bash
curl -X POST http://localhost:3000/api/sources/ai-detect \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example-news.com/news", "strategy": "html"}'
```

---

### 📄 Articles

#### `GET /api/articles`
Get paginated articles from the database.

```bash
# Get first page (default 20 per page)
curl "http://localhost:3000/api/articles?page=1&limit=20"

# Filter by source
curl "http://localhost:3000/api/articles?source=عنب+بلدي"

# Filter by status
curl "http://localhost:3000/api/articles?status=published"

# Search by title
curl "http://localhost:3000/api/articles?search=سوريا"
```

**Response:**
```json
{
  "success": true,
  "articles": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 150,
    "totalPages": 8
  }
}
```

---

#### `GET /api/articles/stats`
Get article statistics overview.

```bash
curl http://localhost:3000/api/articles/stats
```

---

#### `GET /api/articles/recent-titles`
Get recent article titles (for AI deduplication in n8n).

```bash
# Get last 50 titles (default)
curl "http://localhost:3000/api/articles/recent-titles?limit=50"

# Get last 100 titles
curl "http://localhost:3000/api/articles/recent-titles?limit=100"
```

**Response:**
```json
{
  "success": true,
  "count": 50,
  "titles": [
    {
      "id": 1,
      "title": "عنوان الخبر",
      "source_name": "عنب بلدي",
      "published_at": "2025-05-26T10:30:00Z"
    }
  ]
}
```

---

#### `POST /api/articles/:id/mark-duplicate`
Mark an article as duplicate (used by n8n AI dedup workflow).

```bash
curl -X POST http://localhost:3000/api/articles/42/mark-duplicate
```

**Response:**
```json
{
  "success": true,
  "message": "Article 42 marked as duplicate_skipped"
}
```

---

#### `PUT /api/articles/:id`
Update an article (approve/reject).

```bash
curl -X PUT http://localhost:3000/api/articles/42 \
  -H "Content-Type: application/json" \
  -d '{"status": "approved"}'
```

---

#### `DELETE /api/articles/:id`
Delete a single article.

```bash
curl -X DELETE http://localhost:3000/api/articles/42
```

---

#### `DELETE /api/articles/clean`
Delete ALL articles from the database.

```bash
curl -X DELETE http://localhost:3000/api/articles/clean
```

> ⚠️ **WARNING:** This permanently deletes all articles!

---

#### `DELETE /api/articles/by-date`
Delete articles older than a date.

```bash
curl -X DELETE http://localhost:3000/api/articles/by-date \
  -H "Content-Type: application/json" \
  -d '{"beforeDate": "2025-01-01"}'
```

---

#### `DELETE /api/articles/by-source`
Delete articles from a specific source.

```bash
curl -X DELETE http://localhost:3000/api/articles/by-source \
  -H "Content-Type: application/json" \
  -d '{"sourceName": "اسم المصدر"}'
```

---

### 🧪 Testing & Diagnostics

#### `POST /api/sources/:index/test`
Run a production-identical test on a single source. Uses the source's own settings (maxArticles, timeout, crawlDepth, etc.).

```bash
# Test source at index 0 with its own settings
curl -X POST http://localhost:3000/api/sources/0/test

# Override test limit
curl -X POST "http://localhost:3000/api/sources/0/test?limit=3"
```

**Response (success):**
```json
{
  "success": true,
  "hasArticles": true,
  "sourceName": "عنب بلدي",
  "strategy": "wp_api",
  "diagnostics": {
    "strategy": "wp_api",
    "scrapeTimeout": 8000,
    "crawlDepth": "list+article",
    "retryCount": 0,
    "maxArticles": 10,
    "priority": 5,
    "encoding": "utf-8"
  },
  "durationMs": 2381,
  "articlesCount": 10,
  "lastTestedAt": "2025-05-26T01:06:33.123Z",
  "lastTestStatus": "success",
  "consecutiveFailures": 0,
  "articles": [
    {
      "title": "عنوان المقال",
      "url": "https://...",
      "published_at": "2025-05-26T10:30:00Z",
      "contentLength": 5200,
      "contentPreview": "أول 400 حرف من المحتوى...",
      "hasFullContent": true
    }
  ]
}
```

**Response (failure):**
```json
{
  "success": false,
  "error": "Scraping failed: read ECONNRESET",
  "diagnostics": { ... },
  "durationMs": 8050,
  "consecutiveFailures": 2
}
```

---

#### `POST /api/test-wp`
Test WordPress connection.

```bash
curl -X POST http://localhost:3000/api/test-wp \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://yoursite.com",
    "username": "admin",
    "appPassword": "xxxx xxxx xxxx xxxx"
  }'
```

---

#### `POST /api/test-ai`
Test AI rewriter connection (n8n webhook).

```bash
curl -X POST http://localhost:3000/api/test-ai \
  -H "Content-Type: application/json" \
  -d '{
    "n8nWebhookUrl": "https://your-n8n.com/webhook/xxxxx"
  }'
```

---

#### `GET /api/stats`
Get overall system statistics.

```bash
curl http://localhost:3000/api/stats
```

---

### ▶️ Pipeline Execution

#### `GET /api/run-stream`
Run the full pipeline with Server-Sent Events (SSE) live log streaming.

**Run all enabled sources:**
```bash
curl -N http://localhost:3000/api/run-stream
```

**Run a single source (dry-run, safe test):**
```bash
curl -N "http://localhost:3000/api/run-stream?sourceIndex=0"
```

**Run with date filter (only articles after a date):**
```bash
curl -N "http://localhost:3000/api/run-stream?sinceDate=2025-05-01"
```

**SSE Output format:**
```
data: {"type":"info","message":"Identified 5 active sources to scrape..."}
data: {"type":"log","message":"[Scraper] Processing source: عنب بلدي | strategy: wp_api"}
data: {"type":"log","message":"[Runner] Found 10 articles for عنب بلدي"}
data: {"type":"log","message":"[Runner] Successfully published! WP Post ID: 12345"}
data: {"type":"error","message":"[Scraper] Failed to fetch: Connection timeout"}
data: [DONE]
```

> **Note:** When `sourceIndex` is specified, the pipeline runs in **dry-run mode** — it processes articles but does NOT publish to WordPress or save to the database.

---

## 🔗 n8n Integration

### Available Workflows

| File | Purpose |
|------|---------|
| `n8n_workflow.json` | Main scrape + publish pipeline |
| `n8n_ai_rewrite_publish_workflow.json` | AI rewrite + publish |
| `n8n_ai_dedup_workflow.json` | AI duplicate detection (every 15 min) |
| `n8n_ai_selectors_workflow.json` | AI CSS selector detection |

### n8n → Aggregator API Calls

**Trigger a full pipeline run from n8n:**
```
GET http://YOUR_SERVER:3000/api/run-stream
```

**Fetch recent titles for dedup:**
```
GET http://YOUR_SERVER:3000/api/articles/recent-titles?limit=50
```

**Mark an article as duplicate:**
```
POST http://YOUR_SERVER:3000/api/articles/{id}/mark-duplicate
```

**Enable/Disable a source remotely:**
```
PUT http://YOUR_SERVER:3000/api/sources/{index}
Body: {"enabled": true}   // or false
```

---

## 🎛️ Per-Source Controls Reference

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `maxArticles` | number | global setting (3) | Max articles to fetch per run |
| `scrapeTimeout` | number (ms) | 8000 | Request timeout in milliseconds |
| `retryCount` | number | 0 | Retry attempts with exponential backoff |
| `crawlDepth` | string | `"list+article"` | `"list"` = titles only, `"list+article"` = full content |
| `priority` | number (1-10) | 5 | Processing order (1 = first, 10 = last) |
| `encoding` | string | `"utf-8"` | Character encoding for content |
| `enabled` | boolean | true | **ON/OFF toggle** — whether source is active |

### Strategy Types

| Strategy | Description | Best For |
|----------|-------------|----------|
| `wp_api` | WordPress REST API (`/wp-json/wp/v2/posts`) | WordPress sites |
| `rss` | RSS/Atom feed parsing | Sites with RSS feeds |
| `html` | HTML page crawling with CSS selectors | Any website |
| `sitemap` | XML Sitemap parsing | Sites with sitemaps |

---

## ❌ Error Handling

### Consecutive Failure Auto-Skip

Sources that fail **3 times in a row** are automatically skipped in pipeline runs:

- ❌ **1-2 failures:** Source continues running, warning shown
- 🔴 **3+ failures:** Source auto-skipped with "متوقف تلقائياً" badge
- ✅ **Recovery:** Test the source (🧪 button) — successful test resets the counter

**Reset manually via API:**
```bash
curl -X PUT http://localhost:3000/api/sources/0 \
  -H "Content-Type: application/json" \
  -d '{"consecutiveFailures": 0, "enabled": true}'
```

### Common Errors

| Error | Cause | Fix |
|-------|-------|-----|
| `ECONNRESET` | WAF/Firewall blocked | Try different strategy, increase timeout |
| `ETIMEDOUT` | Server too slow | Increase `scrapeTimeout` to 15000+ |
| `0 articles found` | Wrong CSS selectors | Use AI detect or test with different selectors |
| `Content too short` | List page only, no article body | Set `crawlDepth: "list+article"` |

---

## 🗂️ Project Files

| File | Purpose |
|------|---------|
| `server.js` | Express API server + dashboard |
| `scraper.js` | Multi-strategy news scraper engine |
| `runner.js` | Pipeline orchestrator |
| `publisher.js` | WordPress publisher |
| `rewriter.js` | AI content rewriter (n8n webhook) |
| `ai_analyzer.js` | AI source analyzer |
| `db.js` | SQLite database operations |
| `config.json` | All configuration (sources, WP, AI) |
| `public/` | Dashboard frontend (HTML/CSS/JS) |
