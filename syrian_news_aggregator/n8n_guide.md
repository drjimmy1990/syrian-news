# n8n Workflow Integration Guide

This guide details the design, configuration, and execution flows for the **Syrian News Aggregator & AI Rewriter** pipeline represented by `n8n_workflow.json`.

## Workflow Node Overview

The workflow represents a complete, production-grade automated pipeline consisting of the following sequential stages:

```
[Schedule Trigger] 
       │
       ▼
[Fetch Latest News (HTTP Request)]
       │
       ▼
[Item Lists (Loop Over Articles)]
       │
       ▼
[SQLite Deduplication Check]
       │
       ▼
  [Is Unique?] ──(No)──► [Duplicate Bypassed (NoOp)]
       │ (Yes)
       ▼
[AI Paraphraser (OpenAI)]
       │
       ▼
[WordPress (Create Draft)]
       │
       ▼
[Save to Local DB (SQLite)]
```

### 1. Schedule Trigger
- **Purpose**: Automates periodic scraping executions.
- **Configuration**: Set to trigger every `15 minutes` to capture breaking news quickly without exceeding target site request rate limits.

### 2. Fetch Latest News (HTTP Request)
- **Purpose**: Interacts with high-resiliency syndication endpoints.
- **Target URL**: `https://www.enabbaladi.net/wp-json/wp/v2/posts?per_page=10&_embed=1`
- **Method**: `GET`
- **Output**: Array of 10 latest articles in standard WordPress REST API JSON payload layout.

### 3. Item Lists (Loop Over Articles)
- **Purpose**: Flattens the array and loops through each scraped article sequentially to allow atomic transactional processing (fetch -> deduplicate -> rewrite -> publish -> record).
- **Configuration**: Splitting on the root array to produce one item per article.

### 4. SQLite Deduplication Check
- **Purpose**: Prevents double-posting and coordinates exact duplicate protection.
- **Operation**: `Execute Query`
- **SQL Query**:
  ```sql
  SELECT id, title_hash, url_hash FROM articles 
  WHERE url_hash = :urlHash OR title_hash = :titleHash LIMIT 1
  ```
- **Parameters**: 
  - `urlHash`: `={{$json.link}}`
  - `titleHash`: `={{$json.title.rendered}}`

### 5. Is Unique? (If Node)
- **Purpose**: Checks the results of the SQLite database scan.
- **Condition**: Matches the number of results returned by the deduplication database query. If the array is empty (`length == 0`), it branches to `True` (Unique). Otherwise, it branches to `False` (Duplicate).
- **Duplicate Branch**: Routed to a NoOp node labeled "Duplicate Bypassed".

### 6. AI Paraphraser (OpenAI Node)
- **Purpose**: Automatically translates/rewrites/paraphrases the Arabic news body into high-quality professional modern standard Arabic before publishing.
- **Model**: `gpt-4o-mini`
- **Temperature**: `0.3` (optimized for stylistic diversity without sacrificing factual accuracy).
- **System Prompt**:
  ```
  أنت صحفي محترف. أعد صياغة الخبر التالي باللغة العربية الفصحى بأسلوب احترافي وجذاب مع الحفاظ على الدقة والمصداقية وتجنب التكرار. احتفظ بهيكل الـ HTML كما هو دون تغيير الوسوم.
  ```
- **User Prompt**: `={{$node["Item Lists (Loop Over Articles)"].json.content.rendered}}`

### 7. WordPress (Create Draft)
- **Purpose**: Submits the article to the WordPress website REST API.
- **Parameters**:
  - `Title`: `={{$node["Item Lists (Loop Over Articles)"].json.title.rendered}}`
  - `Content`: `={{$json.choices[0].message.content}}` (Rewritten body)
  - `Status`: `draft` (Allows manual editor review before publishing live).

### 8. Save to Local DB
- **Purpose**: Marks the article as successfully processed and published, preventing it from being imported again in future cycles.
- **Operation**: `Insert` into table `articles`.
- **Fields saved**: Title, URL, Rewritten Content, WP Post ID, and timestamp.
