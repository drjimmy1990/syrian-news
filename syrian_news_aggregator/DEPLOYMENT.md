# 🚀 دليل النشر — Ubuntu VPS + aaPanel

> نسخ ولصق فقط. كل شيء جاهز بالمشروع.

---

## الخطوة 1: تجهيز السيرفر (مرة واحدة)

عندك aaPanel و Node.js جاهزين. تأكد فقط من:

```bash
# تأكد من وجود build tools (مطلوب لـ better-sqlite3)
sudo apt install -y build-essential python3

# تثبيت PM2
npm install -g pm2
```

---

## الخطوة 2: سحب المشروع (مرة واحدة)

```bash
cd /www/wwwroot
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git syrian-news-aggregator
cd syrian-news-aggregator
npm install
mkdir -p logs
```

> ⚠️ غيّر `YOUR_USERNAME/YOUR_REPO_NAME` بالرابط الحقيقي للريبو.

---

## الخطوة 3: تعديل config.json

```bash
nano config.json
```

غيّر هذه القيم فقط:

| الحقل | القيمة |
|-------|--------|
| `wordpress.wpUrl` | رابط موقعك |
| `wordpress.username` | اسم مستخدم WordPress |
| `wordpress.appPassword` | كلمة مرور التطبيق |
| `wordpress.isDryRun` | `false` للنشر الفعلي |
| `aiRewriter.apiKey` | مفتاح OpenAI |
| `aiRewriter.isDryRun` | `false` للكتابة بالذكاء الاصطناعي |

---

## الخطوة 4: تشغيل بـ PM2

```bash
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

> آخر أمر سيطبع لك أمر — انسخه وشغّله. هذا يضمن التشغيل التلقائي عند إعادة تشغيل السيرفر.

### أوامر PM2

```bash
pm2 status                    # حالة التطبيق
pm2 logs news-aggregator      # السجلات مباشرة
pm2 restart news-aggregator   # إعادة تشغيل
pm2 stop news-aggregator      # إيقاف
```

---

## الخطوة 5: Reverse Proxy من aaPanel

1. افتح **aaPanel** → **Website** → **Add Site**
2. ضع الدومين أو استخدم IP
3. بعد الإنشاء، افتح إعدادات الموقع → **Reverse Proxy**
4. أضف Reverse Proxy:
   - **Name:** `news-aggregator`
   - **Target URL:** `http://127.0.0.1:3000`
5. احفظ

### إعداد SSE (مهم)

بعد إنشاء Reverse Proxy، ادخل على **Configuration File** وأضف هذه الأسطر داخل الـ `location /`:

```nginx
proxy_buffering off;
proxy_read_timeout 300s;
proxy_set_header Connection '';
proxy_http_version 1.1;
chunked_transfer_encoding off;
```

> بدون هذا، زر "جلب الأخبار الآن" في لوحة التحكم لن يعمل بشكل صحيح.

---

## الخطوة 6: SSL (اختياري)

من aaPanel → إعدادات الموقع → **SSL** → **Let's Encrypt** → اختر الدومين → Apply.

---

## الخطوة 7: جدولة الجلب التلقائي

### خيار 1: Cron من aaPanel

aaPanel → **Cron** → **Add Task**:
- **Type:** Shell Script
- **Name:** `news-scraper`
- **Period:** كل ساعة (أو كل 30 دقيقة)
- **Script:**

```bash
curl -s http://127.0.0.1:3000/api/run-stream > /dev/null 2>&1
```

### خيار 2: n8n

راجع [n8n_guide.md](./n8n_guide.md) لإعداد workflows متقدمة.

---

## التحديث (بعد كل push)

```bash
cd /www/wwwroot/syrian-news-aggregator
./deploy.sh
```

أو يدوياً:

```bash
cd /www/wwwroot/syrian-news-aggregator
git pull origin main
npm install
pm2 restart news-aggregator
```

---

## حماية لوحة التحكم (مُوصى)

من aaPanel → إعدادات الموقع → **Directory Auth**:
- فعّل الحماية بكلمة مرور
- ضع اسم مستخدم وكلمة مرور

> إذا تستخدم n8n من سيرفر خارجي يحتاج وصول للـ API، استخدم Nginx config يدوي لفصل حماية الـ Dashboard عن الـ API.

---

## استكشاف الأخطاء

```bash
# التطبيق لا يعمل
pm2 logs news-aggregator --lines 50

# خطأ better-sqlite3
npm rebuild better-sqlite3

# صلاحيات
chown -R www:www /www/wwwroot/syrian-news-aggregator

# تحقق من البورت
curl http://127.0.0.1:3000/api/stats
```

---

## ✅ قائمة التحقق

- [ ] `git clone` نجح
- [ ] `npm install` بدون أخطاء
- [ ] `config.json` معدّل بالبيانات الصحيحة
- [ ] `pm2 status` يظهر `online`
- [ ] `curl http://127.0.0.1:3000/api/stats` يرد JSON
- [ ] Reverse Proxy يعمل من aaPanel
- [ ] لوحة التحكم تفتح من المتصفح
- [ ] SSL مفعّل (إذا عندك دومين)
- [ ] Cron مضاف للجلب التلقائي
- [ ] `pm2 startup` + `pm2 save` مفعّل





cd /www/wwwroot
git clone https://github.com/drjimmy1990/syrian-news.git
cd syrian-news
npm install
mkdir -p logs
nano config.json   # edit credentials
pm2 start ecosystem.config.js
pm2 save && pm2 startup


cd /www/wwwroot
git clone https://github.com/drjimmy1990/syrian-news.git
cd syrian-news
npm install
mkdir -p logs
pm2 start ecosystem.config.js
pm2 save && pm2 startup