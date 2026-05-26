# 📘 WordPress REST API Guide for n8n — souree.net

## 🔑 Authentication

In every **HTTP Request** node in n8n, set:

| Setting | Value |
|---------|-------|
| **Authentication** | `Generic Credential Type` → `Basic Auth` |
| **User** | `admin` |
| **Password** | `Ny5d 3Khd ufj7 y6C5 XdMX J5zr` |

> 💡 **Tip**: Create the credential **once** in n8n (Settings → Credentials → Add → Basic Auth), name it `WordPress souree.net`, then reuse it in every HTTP Request node.

---

## 📂 Categories

### Your Category IDs (souree.net)

| ID | Name | Use For |
|----|------|---------|
| 20 | الأخبار | محلي (default) |
| 21 | سياسة | أخبار سياسية |
| 22 | تقارير | تقارير مطولة |
| 24 | اقتصاد | أخبار اقتصادية |
| 25 | أخبار رسمية | بيانات رسمية |
| 26 | مجتمع | شؤون اجتماعية |
| 28 | ثقافة | ثقافة وأدب |
| 29 | فن | فنون |
| 32 | رياضة | أخبار رياضية |
| 35 | تكنولوجيا | تقنية |
| 71 | العالم | أخبار دولية |
| 102 | عسكري وأمني | أمن وعسكر |
| 41 | دمشق | — |
| 42 | حلب | — |
| 43 | حمص | — |
| 44 | حماة | — |
| 45 | إدلب | — |
| 46 | درعا | — |
| 33 | منوعات | متفرقات |

### List All Categories (HTTP Request Node)

| Setting | Value |
|---------|-------|
| Method | `GET` |
| URL | `https://www.souree.net/wp-json/wp/v2/categories?per_page=100` |
| Authentication | Basic Auth (WordPress credential) |
| Response Format | JSON |

### Create a New Category (HTTP Request Node)

| Setting | Value |
|---------|-------|
| Method | `POST` |
| URL | `https://www.souree.net/wp-json/wp/v2/categories` |
| Authentication | Basic Auth |
| Body Content Type | JSON |

**JSON Body:**
```json
{
  "name": "اسم التصنيف",
  "slug": "category-slug"
}
```

---

## 📝 Posts

### List Recent Posts (HTTP Request Node)

| Setting | Value |
|---------|-------|
| Method | `GET` |
| URL | `https://www.souree.net/wp-json/wp/v2/posts?per_page=5&status=publish` |
| Authentication | Basic Auth |
| Response Format | JSON |

### List Draft Posts

| Setting | Value |
|---------|-------|
| Method | `GET` |
| URL | `https://www.souree.net/wp-json/wp/v2/posts?per_page=10&status=draft` |
| Authentication | Basic Auth |

### List Posts by Category

| Setting | Value |
|---------|-------|
| Method | `GET` |
| URL | `https://www.souree.net/wp-json/wp/v2/posts?categories=21&per_page=10` |
| Authentication | Basic Auth |

> Change `21` to any category ID from the table above.

### Search Posts by Title

| Setting | Value |
|---------|-------|
| Method | `GET` |
| URL | `https://www.souree.net/wp-json/wp/v2/posts?search=سوريا&per_page=5` |
| Authentication | Basic Auth |

### Create a Post — Draft (HTTP Request Node)

| Setting | Value |
|---------|-------|
| Method | `POST` |
| URL | `https://www.souree.net/wp-json/wp/v2/posts` |
| Authentication | Basic Auth |
| Body Content Type | JSON |

**JSON Body:**
```json
{
  "title": "عنوان الخبر",
  "content": "<p>محتوى الخبر بصيغة HTML</p>",
  "status": "draft",
  "categories": [21]
}
```

### Create a Post — Published Immediately

Same as above but change status:
```json
{
  "title": "عنوان الخبر",
  "content": "<div dir=\"rtl\"><p>محتوى الخبر</p></div>",
  "status": "publish",
  "categories": [21, 41]
}
```
> You can assign **multiple categories** by adding IDs to the array: `[21, 41]` = سياسة + دمشق

### Create a Post with Featured Image

```json
{
  "title": "خبر مع صورة بارزة",
  "content": "<p>المحتوى</p>",
  "status": "draft",
  "categories": [24],
  "featured_media": 12345
}
```
> ⚠️ `featured_media` is the **Media ID** returned after uploading the image (see Media section below). You must upload the image first!

### Update an Existing Post (HTTP Request Node)

| Setting | Value |
|---------|-------|
| Method | `PUT` |
| URL | `https://www.souree.net/wp-json/wp/v2/posts/POST_ID` |
| Authentication | Basic Auth |
| Body Content Type | JSON |

**JSON Body** (only include fields you want to change):
```json
{
  "title": "عنوان محدّث",
  "status": "publish"
}
```

### Delete a Post

| Setting | Value |
|---------|-------|
| Method | `DELETE` |
| URL | `https://www.souree.net/wp-json/wp/v2/posts/POST_ID` |
| Authentication | Basic Auth |

> Add `?force=true` to the URL to delete permanently (skip trash).

---

## 🖼️ Media (Images) — Featured Image Workflow

### How Featured Images Work

WordPress requires **2 steps**:
```
Step 1: Upload image to Media Library → get back a Media ID (e.g. 12345)
Step 2: Create post with "featured_media": 12345
```

You cannot just pass an image URL — it must be uploaded first.

### Upload Image — Code Node (Recommended Method)

Use a **Code** node in n8n with this JavaScript:

```javascript
const article = $input.first().json;

// If no image, skip and pass through
if (!article.image_url) {
  return [{ json: { ...article, featuredMediaId: 0 } }];
}

try {
  // Step 1: Download the image from the source website
  const imageResponse = await this.helpers.httpRequest({
    method: 'GET',
    url: article.image_url,
    encoding: 'arraybuffer',
    returnFullResponse: true,
  });

  // Extract filename from the URL
  const urlParts = article.image_url.split('/');
  const filename = urlParts[urlParts.length - 1].split('?')[0] || 'news-image.jpg';

  // Step 2: Upload to WordPress Media Library
  const wpResponse = await this.helpers.httpRequest({
    method: 'POST',
    url: `${article.wpUrl}/wp-json/wp/v2/media`,
    headers: {
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Content-Type': imageResponse.headers['content-type'] || 'image/jpeg',
      'Authorization': 'Basic ' + Buffer.from('admin:Ny5d 3Khd ufj7 y6C5 XdMX J5zr').toString('base64'),
    },
    body: Buffer.from(imageResponse.body),
  });

  // Pass the Media ID forward
  return [{ json: { ...article, featuredMediaId: wpResponse.id } }];
} catch (e) {
  // If upload fails, continue without featured image
  return [{ json: { ...article, featuredMediaId: 0 } }];
}
```

> **Output**: This adds `featuredMediaId` to the article data. Use it as `featured_media` in the next node.

### List Uploaded Media (HTTP Request Node)

| Setting | Value |
|---------|-------|
| Method | `GET` |
| URL | `https://www.souree.net/wp-json/wp/v2/media?per_page=10` |
| Authentication | Basic Auth |

### Delete Media (HTTP Request Node)

| Setting | Value |
|---------|-------|
| Method | `DELETE` |
| URL | `https://www.souree.net/wp-json/wp/v2/media/MEDIA_ID?force=true` |
| Authentication | Basic Auth |

---

## 🏷️ Tags

### List All Tags (HTTP Request Node)

| Setting | Value |
|---------|-------|
| Method | `GET` |
| URL | `https://www.souree.net/wp-json/wp/v2/tags?per_page=100` |
| Authentication | Basic Auth |

### Create a Tag (HTTP Request Node)

| Setting | Value |
|---------|-------|
| Method | `POST` |
| URL | `https://www.souree.net/wp-json/wp/v2/tags` |
| Authentication | Basic Auth |
| Body Content Type | JSON |

**JSON Body:**
```json
{
  "name": "سوريا"
}
```

### Use Tags in a Post

Add tag IDs to the post JSON:
```json
{
  "title": "خبر مع وسوم",
  "content": "<p>المحتوى</p>",
  "status": "draft",
  "categories": [21],
  "tags": [10, 15, 22]
}
```

---

## 📋 Complete n8n Flow: Image Upload → Post Creation

In your n8n workflow, the last 3 nodes should be:

### Flow Diagram
```
[Build WP Payload] → [📷 Upload Image (Code)] → [📤 Create Post (HTTP Request)]
```

### Node: 📷 Upload Image (Code Node)
Use the JavaScript code from the "Upload Image" section above.

### Node: 📤 Create Post (Code Node — NOT HTTP Request!)

> ⚠️ **Why Code instead of HTTP Request?** Because the article HTML content contains `"` quotes and special characters that break n8n's JSON expression parser. A Code node uses `JSON.stringify()` which handles this automatically.

| Setting | Value |
|---------|-------|
| Type | `Code` |
| Language | `JavaScript` |

**JavaScript Code:**
```javascript
const article = $input.first().json;

const postBody = {
  title: article.postTitle,
  content: article.postContent,
  status: article.postStatus,
  categories: [article.categoryId],
  featured_media: article.featuredMediaId || 0
};

const response = await this.helpers.httpRequest({
  method: 'POST',
  url: `${article.wpUrl}/wp-json/wp/v2/posts`,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Basic ' + Buffer.from('admin:Ny5d 3Khd ufj7 y6C5 XdMX J5zr').toString('base64'),
  },
  body: postBody,
});

return [{
  json: {
    articleId: article.articleId,
    wpPostId: response.id,
    wpPostUrl: response.link,
    aggregatorUrl: article.aggregatorUrl,
  }
}];
```

**Response**: WordPress returns the created post. `response.id` is the post ID, `response.link` is the URL.

---

## 🔧 Useful n8n Expressions

| What | Expression |
|------|------------|
| Get WordPress post ID from response | `{{ $json.id }}` |
| Get post URL | `{{ $json.link }}` |
| Get media URL after upload | `{{ $json.source_url }}` |
| Current date (ISO) | `{{ $now.toISO() }}` |
| Reference another node's data | `{{ $('Node Name').first().json.fieldName }}` |

---

## ⚠️ Common Errors

| Error | Meaning | Fix |
|-------|---------|-----|
| `401 Unauthorized` | Bad credentials | Check username and Application Password |
| `403 Forbidden` | No permission | Make sure user has `administrator` role |
| `400 Bad Request` | Missing field | Check required fields (title, content) |
| `404 Not Found` | Wrong URL or ID | Verify the endpoint URL |
| `rest_cannot_create` | Insufficient permissions | Enable Application Passwords in WordPress |
| `featured_media invalid` | Wrong media ID | Upload image first, use the returned ID |

## 📌 Post Status Values

| Value | Meaning |
|-------|---------|
| `publish` | Live on the site immediately |
| `draft` | Saved but not visible to visitors |
| `pending` | Awaiting editor review |
| `private` | Only visible to admins |
