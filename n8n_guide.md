# 🔀 n8n Production Workflows Guide

This guide provides a step-by-step, node-by-node setup for integrating **n8n** with the **Syrian News Aggregator** backend database and your **WordPress** website.

We split the pipeline into **two separate workflows** for optimal reliability:
1. **Workflow 1: Scraper Trigger** — Triggers the server to scrape enabled sites every 1 hour and save them to the local SQLite database.
2. **Workflow 2: AI Publisher** — Every 15 minutes, pulls unprocessed articles, filters duplicates using AI, rewrites unique articles using AI, posts them to WordPress, and updates the aggregator database.

---

## 🗺️ High-Level Flow Chart

```
WORKFLOW 1 (Runs every 1 hour):
[Schedule Trigger] ──► [HTTP Request: GET /api/run-stream] ──► [Done]

WORKFLOW 2 (Runs every 15 minutes):
[Schedule Trigger] 
       │
       ├─► [Fetch Unprocessed (HTTP)] ──┐
       │                                ▼
       └─► [Fetch Recent Titles (HTTP)] ─┴─► [Prepare Payload (Code)]
                                                    │
                                                    ▼
                                           [🤖 AI Dedup Check (OpenAI)]
                                                    │
                                                    ▼
                                           [Parse AI Decision (Code)]
                                                    │
                                           ┌────────┴────────┐
                                    (Duplicate)           (Unique)
                                           ▼                 ▼
                                    [Mark Dup (HTTP)]   [🤖 AI Rewrite]
                                                             │
                                                             ▼
                                                        [Parse Rewrite]
                                                             │
                                                             ▼
                                                        [Build Payload]
                                                             │
                                                             ▼
                                                        [📤 WordPress Node]
                                                             │
                                                             ▼
                                                        [Update DB (HTTP)]
```

---

## 🛠️ Workflow 1: The Scraper Trigger (Hourly)

This workflow is extremely simple. Its sole purpose is to trigger the aggregator's background scraper engine.

### Node 1: Schedule Trigger
- **Name**: `Schedule Trigger`
- **Type**: `Schedule Trigger` (n8n-nodes-base.scheduleTrigger)
- **Parameters**:
  - **Trigger Interval**: `Hours`
  - **Hours Between Runs**: `1`
- **Purpose**: Tells the system to look for news every hour.

### Node 2: Trigger Scraper
- **Name**: `Trigger Scraper (HTTP Request)`
- **Type**: `HTTP Request` (n8n-nodes-base.httpRequest)
- **Parameters**:
  - **Method**: `GET`
  - **URL**: `http://localhost:3000/api/run-stream`
    *(Note: Replace `localhost` with your server's IP address if n8n is running on a different machine).*
  - **Authentication**: `None`
  - **Response Format**: `String/Text`
  - **Timeout (ms)**: `300000` *(5 minutes, since scraping multiple sites can take time)*
- **Purpose**: Hits the server's SSE endpoint to start scraping all active sources. The server will automatically filter out simple exact duplicates and save new ones to the database as `'processed'`.

---

## 🛠️ Workflow 2: The AI Publisher (Every 15 min)

This is the main automation workflow. It manages AI deduplication, Arabic rewriting, posting, and database syncing.

### Node 1: Schedule Trigger
- **Name**: `Schedule Trigger`
- **Type**: `Schedule Trigger`
- **Parameters**:
  - **Trigger Interval**: `Minutes`
  - **Minutes Between Runs**: `15`
- **Purpose**: Polls for new articles every 15 minutes.

### Node 2: ⚙️ Configuration
- **Name**: `⚙️ Configuration`
- **Type**: `Set` (n8n-nodes-base.set)
- **Parameters**:
  - **Mode**: `Define below`
  - **Values**:
    - **String**: `aggregatorUrl` ➔ `http://localhost:3000` *(Replace with server IP if needed)*
    - **String**: `recentTitlesLimit` ➔ `50` *(Number of recent posts to check for deduplication)*
    - **String**: `wpUrl` ➔ `https://your-wordpress-site.com` *(Replace with WordPress website URL)*
    - **String**: `wpPostStatus` ➔ `draft` *(Set to `draft` for review, or `publish` to go live immediately)*
- **Purpose**: Centralizes server addresses and options so you only have to edit them in one place.

### Node 3: Fetch Unprocessed Articles (HTTP Request)
- **Name**: `Fetch Unprocessed Articles`
- **Type**: `HTTP Request`
- **Parameters**:
  - **Method**: `GET`
  - **URL**: `={{ $json.aggregatorUrl }}/api/articles?status=processed&limit=5`
  - **Response Format**: `JSON`
- **Purpose**: Pulls up to 5 newly scraped articles that have the status `'processed'` (meaning they haven't been processed by n8n yet).

### Node 4: Fetch Recent Published Titles (HTTP Request)
- **Name**: `Fetch Recent Published Titles`
- **Type**: `HTTP Request`
- **Parameters**:
  - **Method**: `GET`
  - **URL**: `={{ $('⚙️ Configuration').first().json.aggregatorUrl }}/api/articles/recent-titles?limit={{ $('⚙️ Configuration').first().json.recentTitlesLimit }}`
  - **Response Format**: `JSON`
- **Purpose**: Fetches the titles of the last 50 published articles from the aggregator database so the AI has something to compare against.

### Node 5: Prepare Dedup Payload (Code)
- **Name**: `Prepare Dedup Payload`
- **Type**: `Code` (n8n-nodes-base.code)
- **Parameters**:
  - **Language**: `JavaScript`
  - **JS Code**:
    ```javascript
    // Merge: new articles + existing titles for comparison
    const articlesResponse = $('Fetch Unprocessed Articles').first().json;
    const titlesResponse = $('Fetch Recent Published Titles').first().json;

    if (!articlesResponse.success || !articlesResponse.data || articlesResponse.data.length === 0) {
      return []; // No new articles to check
    }

    const existingTitles = (titlesResponse.titles || []).map(t => t.title);
    const newArticles = articlesResponse.data.filter(a => 
      a.content && 
      a.content.trim().length > 50 && 
      !a.wordpress_post_id &&
      a.status !== 'duplicate_skipped' &&
      new Date(a.published_at) > new Date(Date.now() - 60 * 60 * 1000) // Only articles from the last 1 hour
    );

    return newArticles.map(article => ({
      json: {
        id: article.id,
        title: article.title,
        content: article.content,
        source_name: article.source_name,
        url: article.url,
        image_url: article.image_url,
        published_at: article.published_at,
        existingTitles: existingTitles.join('\n')
      }
    }));
    ```
- **Purpose**: Filters out old articles (older than 1 hour), empty content, and already-handled entries. Then matches each new article with the list of already-published titles, outputting them as separate items for the AI Dedup check.

### Node 6: 🤖 AI Duplicate Check (OpenAI or Gemini)
- **Name**: `🤖 AI Duplicate Check`
- **Type**: `OpenAI` (or `Google Gemini` / `Llama`) under the **Advanced AI** nodes in n8n.
- **Parameters**:
  - **Model**: `gpt-4o-mini` (or `gemini-1.5-flash` / `gemini-2.0-flash`)
  - **System Prompt**:
    ```text
    أنت خبير في كشف الأخبار المكررة. مهمتك مقارنة عنوان خبر جديد مع قائمة عناوين أخبار منشورة سابقاً، لتحديد ما إذا كان الخبر الجديد يغطي نفس الحدث أو القصة الإخبارية.

    القواعد:
    - خبر مكرر = نفس الحدث/القصة حتى لو بصياغة مختلفة تماماً
    - خبر غير مكرر = حدث مختلف أو تطور جديد في نفس القصة
    - انتبه للتشابه الدلالي وليس اللفظي فقط
    - إذا كان العنوان عاماً جداً ولا يمكن تحديد ما إذا كان مكرراً، اعتبره غير مكرر

    أرجع النتيجة كـ JSON فقط:
    {
      "isDuplicate": true أو false,
      "matchedTitle": "العنوان المطابق" أو null,
      "confidence": 0.0 إلى 1.0,
      "reason": "سبب مختصر بالعربية"
    }
    ```
  - **User Prompt**:
    ```text
    العنوان الجديد:
    {{ $json.title }}

    المصدر: {{ $json.source_name }}

    قائمة العناوين المنشورة سابقاً:
    {{ $json.existingTitles }}
    ```
  - **Temperature**: `0.1` *(Very low for maximum consistency)*
- **Purpose**: Uses AI to detect if an incoming article is semantically a duplicate of a recently published post.

### Node 7: Parse AI Decision (Code)
- **Name**: `Parse AI Decision`
- **Type**: `Code`
- **Parameters**:
  - **Language**: `JavaScript`
  - **JS Code**:
    ```javascript
    const raw = $input.first().json.message?.content || $input.first().json.text || '';
    const article = $('Prepare Dedup Payload').first().json;
    const config = $('⚙️ Configuration').first().json;

    let result;
    try {
      let jsonStr = raw;
      const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (fenceMatch) jsonStr = fenceMatch[1].trim();
      result = JSON.parse(jsonStr);
    } catch (e) {
      result = { isDuplicate: false, confidence: 0, reason: 'فشل تحليل رد الذكاء الاصطناعي' };
    }

    return [{
      json: {
        articleId: article.id,
        title: article.title,
        content: article.content,
        source_name: article.source_name,
        url: article.url,
        image_url: article.image_url,
        isDuplicate: result.isDuplicate === true,
        matchedTitle: result.matchedTitle || null,
        confidence: result.confidence || 0,
        reason: result.reason || '',
        aggregatorUrl: config.aggregatorUrl
      }
    }];
    ```
- **Purpose**: Cleans and extracts the JSON output from the AI's response.

### Node 8: Is Duplicate? (If)
- **Name**: `Is Duplicate?`
- **Type**: `If` (n8n-nodes-base.if)
- **Parameters**:
  - **Conditions**:
    - **Boolean**: `{{ $json.isDuplicate }}` is equal to `true`
- **Connections**:
  - **TRUE** ➔ Connects to **Node 9: ❌ Mark as Duplicate**
  - **FALSE** ➔ Connects to **Node 10: 🤖 AI Rewrite Article**

---

### 🔴 Duplicate Path (Branch: TRUE)

### Node 9: ❌ Mark as Duplicate (HTTP Request)
- **Name**: `❌ Mark as Duplicate`
- **Type**: `HTTP Request`
- **Parameters**:
  - **Method**: `POST`
  - **URL**: `={{ $json.aggregatorUrl }}/api/articles/{{ $json.articleId }}/mark-duplicate`
  - **Body**: `JSON` ➔ `={{ JSON.stringify({ matchedTitle: $json.matchedTitle }) }}`
- **Purpose**: Informs the aggregator database that this article is a duplicate. The server updates its status to `'duplicate_skipped'` so it won't be queried again.

---

### 🟢 Unique Path (Branch: FALSE)

### Node 10: 🤖 AI Rewrite Article (OpenAI or Gemini)
- **Name**: `🤖 AI Rewrite Article`
- **Type**: `OpenAI` (or `Google Gemini` / `Llama`) under the **Advanced AI** nodes in n8n.
- **Parameters**:
  - **Model**: `gpt-4o-mini` (or `gemini-1.5-flash` / `gemini-2.0-flash`)
  - **System Prompt**:
    ```text
    أنت محرر أخبار محترف في وكالة أنباء سورية مستقلة. مهمتك إعادة صياغة الخبر التالي وتصنيفه.

    ═══════════════════════════
    📝 قواعد إعادة الصياغة:
    ═══════════════════════════
    1. أعد الصياغة بأسلوبك الخاص باللغة العربية الفصحى — لا تنسخ النص الأصلي
    2. احتفظ بجميع الحقائق والأرقام والأسماء والتواريخ دون أي تغيير
    3. اجعل العنوان جذاباً ومختصراً (لا يتجاوز 15 كلمة)
    4. لا تضف أي معلومات أو تحليلات أو آراء غير موجودة في النص الأصلي
    5. حافظ على نفس طول المحتوى الأصلي تقريباً

    ═══════════════════════════
    🧹 قواعد تنظيف HTML:
    ═══════════════════════════
    1. استخدم فقط: <p>, <h2>, <h3>, <strong>, <em>, <ul>, <ol>, <li>, <blockquote>, <figure>, <img>, <figcaption>
    2. ❌ ممنوع منعاً باتاً: <a href>, <iframe>, <script>, <style>, <div>, <span>, <table>
    3. ❌ لا تضع أي روابط (links) مطلقاً في المحتوى
    4. ❌ لا تضع أي كلمات مثل "اقرأ المزيد" أو "المصدر" أو "شاهد أيضاً"
    5. ✅ إذا وجدت صورة في المحتوى الأصلي، ضعها داخل <figure>:
       <figure><img src="رابط_الصورة" alt="وصف الصورة" /><figcaption>وصف مختصر</figcaption></figure>
    6. ابدأ المحتوى بفقرة تلخيصية قوية (lead paragraph)
    7. استخدم عناوين فرعية <h3> لتقسيم المحتوى إذا كان طويلاً

    ═══════════════════════════
    📂 التصنيف — اختر تصنيفاً واحداً فقط:
    ═══════════════════════════
    - سياسة (أخبار سياسية، قرارات حكومية، علاقات دولية، دبلوماسية)
    - عسكري وأمني (عمليات عسكرية، أمن، اشتباكات، إرهاب)
    - اقتصاد (أسعار، تجارة، مشاريع اقتصادية، بنوك، عملات)
    - مجتمع (شؤون اجتماعية، تعليم، صحة، بيئة، حوادث)
    - رياضة (كرة قدم، رياضات متنوعة، بطولات)
    - ثقافة وفن (فن، أدب، سينما، مسرح، موسيقى)
    - تكنولوجيا (تقنية، إنترنت، ذكاء اصطناعي، اتصالات)
    - دولي (أخبار العالم غير المتعلقة مباشرة بسوريا)
    - محلي (أخبار المحافظات والمدن السورية، بلديات، خدمات)

    ═══════════════════════════
    📤 شكل الإخراج — JSON فقط:
    ═══════════════════════════
    {
      "title": "العنوان المُعاد صياغته",
      "content": "المحتوى بصيغة HTML نظيفة",
      "category": "اسم التصنيف"
    }

    ⚠️ أرجع JSON فقط بدون أي نص إضافي أو شرح أو markdown.
    ```
  - **User Prompt**:
    ```text
    أعد صياغة وصنّف هذا الخبر:

    العنوان: {{ $json.title }}

    المصدر: {{ $json.source_name }}

    المحتوى:
    {{ $json.content }}
    ```
  - **Temperature**: `0.3` *(Slightly higher for vocabulary variation)*
- **Purpose**: Paraphrases the article, produces clean HTML with no links, and classifies it into one of the predefined news categories.

### Node 11: Parse Rewritten Content (Code)
- **Name**: `Parse Rewritten Content`
- **Type**: `Code`
- **Parameters**:
  - **Language**: `JavaScript`
  - **JS Code**:
    ```javascript
    const raw = $input.first().json.message?.content || $input.first().json.text || $input.first().json.output || '';
    const originalArticle = $('Parse AI Decision').first().json;

    let rewritten;
    try {
      let jsonStr = raw;
      const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (fenceMatch) jsonStr = fenceMatch[1].trim();
      rewritten = JSON.parse(jsonStr);
    } catch (e) {
      rewritten = {
        title: originalArticle.title,
        content: raw,
        category: 'محلي'
      };
    }

    // Strip any <a> tags the AI might have sneaked in
    let cleanContent = (rewritten.content || raw)
      .replace(/<a[^>]*>(.*?)<\/a>/gi, '$1')
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<iframe[\s\S]*?<\/iframe>/gi, '');

    return [{
      json: {
        articleId: originalArticle.articleId,
        originalTitle: originalArticle.title,
        rewrittenTitle: rewritten.title || originalArticle.title,
        rewrittenContent: cleanContent,
        category: rewritten.category || 'محلي',
        url: originalArticle.url,
        source_name: originalArticle.source_name,
        image_url: originalArticle.image_url,
        aggregatorUrl: originalArticle.aggregatorUrl
      }
    }];
    ```
- **Purpose**: Extracts the rewritten title, content, and category from the LLM. Also performs a safety cleanup to strip any links/scripts that the AI might have included.

### Node 12: Build WP Payload (Code)
- **Name**: `Build WP Payload`
- **Type**: `Code`
- **Parameters**:
  - **Language**: `JavaScript`
  - **JS Code**:
    ```javascript
    const article = $input.first().json;
    const config = $('⚙️ Configuration').first().json;

    // Category slug mapping (Arabic name → WordPress slug)
    // ⚠️ You MUST create these categories in WordPress first!
    // Go to: WordPress → Posts → Categories → Add each one
    const categoryMap = {
      'سياسة': 'politics',
      'عسكري وأمني': 'military-security',
      'اقتصاد': 'economy',
      'مجتمع': 'society',
      'رياضة': 'sports',
      'ثقافة وفن': 'culture-art',
      'تكنولوجيا': 'technology',
      'دولي': 'international',
      'محلي': 'local'
    };

    const categorySlug = categoryMap[article.category] || 'local';

    // RTL Blockquote style for WordPress
    const attribution = `
    <blockquote style="direction: rtl; text-align: right; border-right: 4px solid #3b82f6; padding: 12px; margin: 20px 0; background: #f8f9fa; font-size: 14px;">
      <strong>المصدر:</strong> ${article.source_name}<br>
      <a href="${article.url}" target="_blank" rel="noopener noreferrer">الرابط الأصلي للمصدر</a>
    </blockquote>`;

    // Only add the image HTML if an image_url actually exists
    const imageHtml = article.image_url 
      ? `<figure style="margin: 0 0 20px 0;"><img src="${article.image_url}" alt="${article.rewrittenTitle}" style="max-width: 100%; height: auto; border-radius: 8px; display: block;" /></figure>` 
      : '';

    const fullContent = `<div dir="rtl" style="text-align: right;">
    ${imageHtml}
    ${article.rewrittenContent}
    ${attribution}
    </div>`;

    return [{
      json: {
        articleId: article.articleId,
        wpUrl: config.wpUrl,
        wpPostStatus: config.wpPostStatus,
        categorySlug: categorySlug,
        categoryArabic: article.category,
        postPayload: {
          title: article.rewrittenTitle,
          content: fullContent,
          status: config.wpPostStatus,
          categories: categorySlug,
          meta: {
            source_url: article.url,
            source_name: article.source_name
          }
        }
      }
    }];
    ```
- **Purpose**: Assembles the post title, clean HTML content, category, and source attribution for WordPress publishing.

### Node 13: Publish to WordPress (WordPress Node)
- **Name**: `📤 Publish to WordPress`
- **Type**: `WordPress` (n8n-nodes-base.wordpress)
- **Parameters**:
  - **Resource**: `Post`
  - **Operation**: `Create`
  - **Title**: `={{ $json.postPayload.title }}`
  - **Content**: `={{ $json.postPayload.content }}`
  - **Status**: `={{ $json.wpPostStatus }}`
- **Credentials**:
  - **WordPress API**: Click **Create New Credentials**. Enter:
    - **WordPress URL**: e.g., `https://your-wordpress-site.com`
    - **Username**: Your WordPress admin username
    - **Application Password**: The 24-character Application Password generated under WordPress ➔ Users ➔ Profile.
- **Purpose**: Creates the draft or live post on your WordPress website.

### Node 14: Update Aggregator DB (HTTP Request)
- **Name**: `Update Aggregator DB`
- **Type**: `HTTP Request`
- **Parameters**:
  - **Method**: `PUT`
  - **URL**: `={{ $('⚙️ Configuration').first().json.aggregatorUrl }}/api/articles/{{ $json.articleId }}`
  - **Body**: `JSON`
  - **JSON Body**:
    ```json
    {
      "status": "published",
      "wordpress_post_id": "={{ $json.id }}",
      "content": "={{ $json.postPayload.content }}"
    }
    ```
- **Purpose**: Tells the aggregator database that this article has been successfully published, logging the WordPress Post ID and marking it as `'published'` so it won't be processed again.

---

## 🚀 How to Import and Setup

1. **Open n8n** in your browser.
2. **Create a New Workflow** for the hourly scraper.
   - Click the three dots (top right) ➔ **Import from File**.
   - Select the `n8n_workflow.json` or create it node-by-node following the **Workflow 1** settings.
3. **Create a Second Workflow** for the publisher:
   - Click the three dots (top right) ➔ **Import from File**.
   - Select `n8n_ai_rewrite_publish_workflow.json` (or build node-by-node using the **Workflow 2** settings).
4. **Enable both workflows** in n8n (toggle the active switch at the top right to **Active**).
5. **Set up WordPress Application Password**:
   - Go to your WordPress Dashboard ➔ Users ➔ Profile.
   - Scroll down to "Application Passwords".
   - Type `n8n Aggregator` and click **Add New Application Password**.
   - Copy the generated 24-character password and paste it into the n8n WordPress credentials.
