# 📘 WordPress REST API Guide — souree.net

## 🔑 Authentication

All requests use **Basic Auth** with your Application Password.

```
Username: admin
App Password: Ny5d 3Khd ufj7 y6C5 XdMX J5zr
```

**Base64 token** (used in headers):
```bash
echo -n "admin:Ny5d 3Khd ufj7 y6C5 XdMX J5zr" | base64
# Result: YWRtaW46Tnk1ZCAzS2hkIHVmajcgeTZDNSBYZE1YIEo1enI=
```

Every curl below uses this header:
```
-H "Authorization: Basic YWRtaW46Tnk1ZCAzS2hkIHVmajcgeTZDNSBYZE1YIEo1enI="
```

---

## 📂 Categories

### List All Categories
```bash
curl -s "https://www.souree.net/wp-json/wp/v2/categories?per_page=100" \
  -H "Authorization: Basic YWRtaW46Tnk1ZCAzS2hkIHVmajcgeTZDNSBYZE1YIEo1enI=" \
  | python3 -m json.tool
```

### Your Category IDs (souree.net)

| ID | Name | Slug |
|----|------|------|
| 20 | الأخبار (محلي) | news |
| 21 | سياسة | politics |
| 22 | تقارير | reports |
| 24 | اقتصاد | economy |
| 25 | أخبار رسمية | official |
| 26 | مجتمع | society |
| 28 | ثقافة | culture |
| 29 | فن | art |
| 32 | رياضة | sports |
| 35 | تكنولوجيا | technology |
| 71 | العالم (دولي) | international |
| 102 | عسكري وأمني | military-security |
| 41 | دمشق | damascus |
| 42 | حلب | aleppo |
| 43 | حمص | homs |
| 44 | حماة | hama |
| 45 | إدلب | idlib |
| 46 | درعا | daraa |
| 33 | منوعات | misc |

### Create a New Category
```bash
curl -s -X POST "https://www.souree.net/wp-json/wp/v2/categories" \
  -H "Authorization: Basic YWRtaW46Tnk1ZCAzS2hkIHVmajcgeTZDNSBYZE1YIEo1enI=" \
  -H "Content-Type: application/json" \
  -d '{"name": "اسم التصنيف", "slug": "category-slug"}' \
  | python3 -m json.tool
```

### Get a Single Category by ID
```bash
curl -s "https://www.souree.net/wp-json/wp/v2/categories/21" \
  -H "Authorization: Basic YWRtaW46Tnk1ZCAzS2hkIHVmajcgeTZDNSBYZE1YIEo1enI="
```

### Update a Category
```bash
curl -s -X PUT "https://www.souree.net/wp-json/wp/v2/categories/21" \
  -H "Authorization: Basic YWRtaW46Tnk1ZCAzS2hkIHVmajcgeTZDNSBYZE1YIEo1enI=" \
  -H "Content-Type: application/json" \
  -d '{"name": "اسم جديد", "description": "وصف التصنيف"}'
```

### Delete a Category
```bash
curl -s -X DELETE "https://www.souree.net/wp-json/wp/v2/categories/99?force=true" \
  -H "Authorization: Basic YWRtaW46Tnk1ZCAzS2hkIHVmajcgeTZDNSBYZE1YIEo1enI="
```

---

## 📝 Posts

### List Recent Posts
```bash
curl -s "https://www.souree.net/wp-json/wp/v2/posts?per_page=5&status=publish" \
  -H "Authorization: Basic YWRtaW46Tnk1ZCAzS2hkIHVmajcgeTZDNSBYZE1YIEo1enI=" \
  | python3 -m json.tool
```

### List Draft Posts
```bash
curl -s "https://www.souree.net/wp-json/wp/v2/posts?per_page=10&status=draft" \
  -H "Authorization: Basic YWRtaW46Tnk1ZCAzS2hkIHVmajcgeTZDNSBYZE1YIEo1enI="
```

### List Posts by Category
```bash
# Get all posts in سياسة (ID: 21)
curl -s "https://www.souree.net/wp-json/wp/v2/posts?categories=21&per_page=10" \
  -H "Authorization: Basic YWRtaW46Tnk1ZCAzS2hkIHVmajcgeTZDNSBYZE1YIEo1enI="
```

### Search Posts by Title
```bash
curl -s "https://www.souree.net/wp-json/wp/v2/posts?search=سوريا&per_page=5" \
  -H "Authorization: Basic YWRtaW46Tnk1ZCAzS2hkIHVmajcgeTZDNSBYZE1YIEo1enI="
```

### Create a Post (as Draft)
```bash
curl -s -X POST "https://www.souree.net/wp-json/wp/v2/posts" \
  -H "Authorization: Basic YWRtaW46Tnk1ZCAzS2hkIHVmajcgeTZDNSBYZE1YIEo1enI=" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "عنوان الخبر هنا",
    "content": "<p>محتوى الخبر بصيغة HTML</p>",
    "status": "draft",
    "categories": [21]
  }'
```

### Create a Post (Published Immediately)
```bash
curl -s -X POST "https://www.souree.net/wp-json/wp/v2/posts" \
  -H "Authorization: Basic YWRtaW46Tnk1ZCAzS2hkIHVmajcgeTZDNSBYZE1YIEo1enI=" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "عنوان الخبر",
    "content": "<div dir=\"rtl\"><p>محتوى الخبر</p></div>",
    "status": "publish",
    "categories": [21, 41]
  }'
```

### Create a Post with Featured Image
```bash
# Step 1: Upload the image first (see Media section below)
# Step 2: Use the returned media ID
curl -s -X POST "https://www.souree.net/wp-json/wp/v2/posts" \
  -H "Authorization: Basic YWRtaW46Tnk1ZCAzS2hkIHVmajcgeTZDNSBYZE1YIEo1enI=" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "خبر مع صورة بارزة",
    "content": "<p>محتوى الخبر</p>",
    "status": "draft",
    "categories": [24],
    "featured_media": 12345
  }'
```
> **Note**: `featured_media` is the ID returned from the media upload. This sets the "Featured Image" (الصورة البارزة) of the post.

### Create a Post with Multiple Categories
```bash
curl -s -X POST "https://www.souree.net/wp-json/wp/v2/posts" \
  -H "Authorization: Basic YWRtaW46Tnk1ZCAzS2hkIHVmajcgeTZDNSBYZE1YIEo1enI=" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "خبر سياسي من دمشق",
    "content": "<p>تفاصيل الخبر</p>",
    "status": "publish",
    "categories": [21, 41]
  }'
```
> This puts the post in both سياسة (21) AND دمشق (41).

### Update an Existing Post
```bash
curl -s -X PUT "https://www.souree.net/wp-json/wp/v2/posts/POST_ID" \
  -H "Authorization: Basic YWRtaW46Tnk1ZCAzS2hkIHVmajcgeTZDNSBYZE1YIEo1enI=" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "عنوان محدّث",
    "status": "publish"
  }'
```

### Delete a Post (Trash)
```bash
curl -s -X DELETE "https://www.souree.net/wp-json/wp/v2/posts/POST_ID" \
  -H "Authorization: Basic YWRtaW46Tnk1ZCAzS2hkIHVmajcgeTZDNSBYZE1YIEo1enI="
```

### Delete a Post (Permanently)
```bash
curl -s -X DELETE "https://www.souree.net/wp-json/wp/v2/posts/POST_ID?force=true" \
  -H "Authorization: Basic YWRtaW46Tnk1ZCAzS2hkIHVmajcgeTZDNSBYZE1YIEo1enI="
```

---

## 🖼️ Media (Images)

### Upload an Image from a URL (2 Steps)

**Step 1: Download the image**
```bash
curl -s -o /tmp/news-image.jpg "https://example.com/path/to/image.jpg"
```

**Step 2: Upload to WordPress**
```bash
curl -s -X POST "https://www.souree.net/wp-json/wp/v2/media" \
  -H "Authorization: Basic YWRtaW46Tnk1ZCAzS2hkIHVmajcgeTZDNSBYZE1YIEo1enI=" \
  -H "Content-Disposition: attachment; filename=news-image.jpg" \
  -H "Content-Type: image/jpeg" \
  --data-binary "@/tmp/news-image.jpg"
```

**Response** (the important part):
```json
{
  "id": 12345,
  "source_url": "https://www.souree.net/wp-content/uploads/2026/05/news-image.jpg"
}
```
> Use the `id` (e.g. `12345`) as `featured_media` when creating a post.

### Upload an Image from URL (1 Command — Download + Upload)
```bash
curl -sL "https://example.com/image.jpg" | \
  curl -s -X POST "https://www.souree.net/wp-json/wp/v2/media" \
    -H "Authorization: Basic YWRtaW46Tnk1ZCAzS2hkIHVmajcgeTZDNSBYZE1YIEo1enI=" \
    -H "Content-Disposition: attachment; filename=news-image.jpg" \
    -H "Content-Type: image/jpeg" \
    --data-binary "@-"
```

### List Uploaded Media
```bash
curl -s "https://www.souree.net/wp-json/wp/v2/media?per_page=10" \
  -H "Authorization: Basic YWRtaW46Tnk1ZCAzS2hkIHVmajcgeTZDNSBYZE1YIEo1enI="
```

### Delete Media
```bash
curl -s -X DELETE "https://www.souree.net/wp-json/wp/v2/media/MEDIA_ID?force=true" \
  -H "Authorization: Basic YWRtaW46Tnk1ZCAzS2hkIHVmajcgeTZDNSBYZE1YIEo1enI="
```

---

## 🏷️ Tags

### List All Tags
```bash
curl -s "https://www.souree.net/wp-json/wp/v2/tags?per_page=100" \
  -H "Authorization: Basic YWRtaW46Tnk1ZCAzS2hkIHVmajcgeTZDNSBYZE1YIEo1enI="
```

### Create a Tag
```bash
curl -s -X POST "https://www.souree.net/wp-json/wp/v2/tags" \
  -H "Authorization: Basic YWRtaW46Tnk1ZCAzS2hkIHVmajcgeTZDNSBYZE1YIEo1enI=" \
  -H "Content-Type: application/json" \
  -d '{"name": "سوريا"}'
```

### Create a Post with Tags
```bash
curl -s -X POST "https://www.souree.net/wp-json/wp/v2/posts" \
  -H "Authorization: Basic YWRtaW46Tnk1ZCAzS2hkIHVmajcgeTZDNSBYZE1YIEo1enI=" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "خبر مع وسوم",
    "content": "<p>المحتوى</p>",
    "status": "draft",
    "categories": [21],
    "tags": [10, 15, 22]
  }'
```

---

## 👤 Users

### List Users
```bash
curl -s "https://www.souree.net/wp-json/wp/v2/users" \
  -H "Authorization: Basic YWRtaW46Tnk1ZCAzS2hkIHVmajcgeTZDNSBYZE1YIEo1enI="
```

### Get Current User (Me)
```bash
curl -s "https://www.souree.net/wp-json/wp/v2/users/me" \
  -H "Authorization: Basic YWRtaW46Tnk1ZCAzS2hkIHVmajcgeTZDNSBYZE1YIEo1enI="
```

---

## 🔧 Useful Queries

### Count Total Published Posts
```bash
curl -sI "https://www.souree.net/wp-json/wp/v2/posts?status=publish&per_page=1" \
  -H "Authorization: Basic YWRtaW46Tnk1ZCAzS2hkIHVmajcgeTZDNSBYZE1YIEo1enI=" \
  | grep -i "x-wp-total"
```

### Get Site Info
```bash
curl -s "https://www.souree.net/wp-json/" | python3 -m json.tool | head -20
```

### Test Authentication
```bash
curl -s "https://www.souree.net/wp-json/wp/v2/users/me" \
  -H "Authorization: Basic YWRtaW46Tnk1ZCAzS2hkIHVmajcgeTZDNSBYZE1YIEo1enI=" \
  | python3 -m json.tool
```
> If you see your user data, auth works. If you get `401`, the password is wrong.

---

## 📋 Complete Example: Upload Image + Create Post

```bash
#!/bin/bash
# Full pipeline: download image → upload to WP → create post with featured image

IMAGE_URL="https://example.com/news-photo.jpg"
AUTH="Basic YWRtaW46Tnk1ZCAzS2hkIHVmajcgeTZDNSBYZE1YIEo1enI="

# Step 1: Download image
echo "📥 Downloading image..."
curl -sL "$IMAGE_URL" -o /tmp/article-image.jpg

# Step 2: Upload to WordPress
echo "📤 Uploading to WordPress..."
MEDIA_RESPONSE=$(curl -s -X POST "https://www.souree.net/wp-json/wp/v2/media" \
  -H "Authorization: $AUTH" \
  -H "Content-Disposition: attachment; filename=article-image.jpg" \
  -H "Content-Type: image/jpeg" \
  --data-binary "@/tmp/article-image.jpg")

# Extract media ID
MEDIA_ID=$(echo "$MEDIA_RESPONSE" | python3 -c "import sys,json; print(json.load(sys.stdin)['id'])")
echo "✅ Image uploaded with ID: $MEDIA_ID"

# Step 3: Create post with featured image
echo "📝 Creating post..."
curl -s -X POST "https://www.souree.net/wp-json/wp/v2/posts" \
  -H "Authorization: $AUTH" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"عنوان الخبر التجريبي\",
    \"content\": \"<div dir='rtl'><p>هذا خبر تجريبي مع صورة بارزة</p></div>\",
    \"status\": \"draft\",
    \"categories\": [21],
    \"featured_media\": $MEDIA_ID
  }"

echo ""
echo "✅ Done! Check your WordPress drafts."
```

---

## ⚠️ Common Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success (GET, PUT) |
| 201 | Created (POST) |
| 400 | Bad request (missing required field) |
| 401 | Unauthorized (bad credentials) |
| 403 | Forbidden (no permission) |
| 404 | Not found (wrong URL or ID) |
| 500 | Server error |

## 📌 Post Status Values

| Value | Meaning |
|-------|---------|
| `publish` | Live on the site |
| `draft` | Saved but not visible |
| `pending` | Awaiting review |
| `private` | Only visible to admins |
| `trash` | In the trash |
