# 🚀 دليل نشر مُجمّع الأخبار السورية — Ubuntu VPS

> دليل شامل خطوة بخطوة لنشر المشروع على سيرفر Ubuntu مع PM2 و Nginx و SSL.

---

## 📋 المتطلبات

| المتطلب | الحد الأدنى |
|---------|-------------|
| Ubuntu | 20.04+ LTS |
| RAM | 1 GB (2 GB مُوصى) |
| Disk | 10 GB+ |
| Node.js | 18+ |
| Domain | اختياري (للـ SSL) |

---

## الخطوة 1: تجهيز السيرفر

### 1.1 تحديث النظام

```bash
sudo apt update && sudo apt upgrade -y
```

### 1.2 تثبيت Node.js 20

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

تحقق من التثبيت:

```bash
node -v   # v20.x.x
npm -v    # 10.x.x
```

### 1.3 تثبيت أدوات البناء (مطلوبة لـ better-sqlite3)

```bash
sudo apt install -y build-essential python3
```

### 1.4 تثبيت Git

```bash
sudo apt install -y git
```

### 1.5 تثبيت PM2 (مدير العمليات)

```bash
sudo npm install -g pm2
```

### 1.6 تثبيت Nginx

```bash
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

---

## الخطوة 2: نشر الكود

### 2.1 إنشاء مستخدم التطبيق (اختياري لكن مُوصى)

```bash
sudo adduser --disabled-password newsapp
sudo usermod -aG sudo newsapp
su - newsapp
```

أو استخدم المستخدم الحالي مباشرة.

### 2.2 استنساخ المشروع

```bash
cd /home/newsapp   # أو أي مسار تفضله
git clone https://github.com/YOUR_USERNAME/syrian-news-aggregator.git
cd syrian-news-aggregator
```

> ⚠️ **استبدل** `YOUR_USERNAME` و `syrian-news-aggregator` باسم المستخدم واسم المستودع الحقيقي.

### 2.3 تثبيت الاعتماديات

```bash
npm install
```

> ملاحظة: `better-sqlite3` يحتاج تجميع C++. إذا فشل، تأكد من تثبيت `build-essential` و `python3`.

### 2.4 تعديل الإعدادات

```bash
nano config.json
```

عدّل الحقول الحساسة:

```json
{
  "wordpress": {
    "wpUrl": "https://yourdomain.com",
    "username": "your_wp_user",
    "appPassword": "xxxx xxxx xxxx xxxx",
    "statusMode": "draft",
    "isDryRun": false
  },
  "aiRewriter": {
    "enabled": true,
    "apiKey": "sk-your-openai-key",
    "model": "gpt-4o-mini",
    "isDryRun": false
  },
  "general": {
    "dbPath": "news_aggregator.db",
    "rateLimitDelay": 1500,
    "maxArticlesPerSource": 3
  }
}
```

> ⚠️ **مهم:** لا تترك `isDryRun: true` في الإنتاج إذا كنت تريد النشر الفعلي على WordPress.

---

## الخطوة 3: اختبار التشغيل يدوياً

```bash
node server.js
```

يجب أن ترى:

```
======================================================
  Syrian News Aggregator Dashboard Server is running!
  Access the Premium UI: http://localhost:3000
======================================================
```

اختبر من السيرفر نفسه:

```bash
curl http://localhost:3000/api/stats
```

أوقف السيرفر بـ `Ctrl+C` بعد التأكد.

---

## الخطوة 4: تشغيل بـ PM2 (الإنتاج)

### 4.1 إنشاء ملف إعدادات PM2

```bash
nano ecosystem.config.js
```

```javascript
module.exports = {
  apps: [{
    name: 'news-aggregator',
    script: 'server.js',
    cwd: '/home/newsapp/syrian-news-aggregator',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/error.log',
    out_file: './logs/output.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true
  }]
};
```

### 4.2 إنشاء مجلد السجلات وتشغيل التطبيق

```bash
mkdir -p logs
pm2 start ecosystem.config.js
```

### 4.3 أوامر PM2 المفيدة

```bash
# حالة التطبيق
pm2 status

# مشاهدة السجلات مباشرة
pm2 logs news-aggregator

# إعادة التشغيل
pm2 restart news-aggregator

# إيقاف
pm2 stop news-aggregator

# حذف من PM2
pm2 delete news-aggregator

# مراقبة الأداء
pm2 monit
```

### 4.4 التشغيل التلقائي عند إعادة تشغيل السيرفر

```bash
pm2 startup systemd
# سينتج أمر — انسخه وشغّله (سيبدأ بـ sudo)

pm2 save
```

---

## الخطوة 5: إعداد Nginx كـ Reverse Proxy

### 5.1 إنشاء ملف إعداد Nginx

```bash
sudo nano /etc/nginx/sites-available/news-aggregator
```

```nginx
server {
    listen 80;
    server_name your-domain.com;  # أو IP السيرفر

    # الحد الأقصى لحجم الطلب (مفيد للـ config الكبير)
    client_max_body_size 10M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # SSE (Server-Sent Events) support — مهم لـ /api/run-stream
        proxy_buffering off;
        proxy_read_timeout 300s;
    }
}
```

### 5.2 تفعيل الموقع

```bash
sudo ln -s /etc/nginx/sites-available/news-aggregator /etc/nginx/sites-enabled/
sudo nginx -t          # اختبار الإعدادات
sudo systemctl reload nginx
```

### 5.3 إزالة الموقع الافتراضي (اختياري)

```bash
sudo rm /etc/nginx/sites-enabled/default
sudo systemctl reload nginx
```

الآن يمكنك الوصول عبر: `http://your-domain.com` أو `http://SERVER_IP`

---

## الخطوة 6: SSL مع Let's Encrypt (مُوصى)

> يتطلب دومين يشير إلى IP السيرفر.

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

اتبع التعليمات على الشاشة. سيُعدّل Certbot إعدادات Nginx تلقائياً.

### التجديد التلقائي

```bash
# اختبار التجديد
sudo certbot renew --dry-run

# Certbot يضيف cron job تلقائياً
```

---

## الخطوة 7: الفايروول (UFW)

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
sudo ufw status
```

> ⚠️ **لا تفتح المنفذ 3000 مباشرة** — Nginx يتعامل مع كل الحركة.

---

## الخطوة 8: Cron لجدولة الجلب التلقائي (بدون n8n)

إذا لم تستخدم n8n للجدولة، يمكنك استخدام cron مباشرة:

```bash
crontab -e
```

أضف (كل ساعة):

```cron
0 * * * * curl -s http://localhost:3000/api/run-stream > /dev/null 2>&1
```

أو كل 30 دقيقة:

```cron
*/30 * * * * curl -s http://localhost:3000/api/run-stream > /dev/null 2>&1
```

---

## الخطوة 9: التحديث من Git

عند إجراء تعديلات محلياً ودفعها إلى GitHub:

```bash
# على السيرفر
cd /home/newsapp/syrian-news-aggregator
git pull origin main

# إذا تغيرت الاعتماديات
npm install

# إعادة تشغيل التطبيق
pm2 restart news-aggregator
```

### سكريبت تحديث سريع (اختياري)

أنشئ ملف `deploy.sh`:

```bash
nano deploy.sh
```

```bash
#!/bin/bash
echo "🔄 Pulling latest changes..."
git pull origin main

echo "📦 Installing dependencies..."
npm install

echo "🔄 Restarting application..."
pm2 restart news-aggregator

echo "✅ Deployment complete!"
pm2 status
```

```bash
chmod +x deploy.sh

# عند الحاجة للتحديث:
./deploy.sh
```

---

## الخطوة 10: حماية لوحة التحكم (اختياري لكن مُوصى)

لوحة التحكم مفتوحة بدون تسجيل دخول. لحمايتها بكلمة مرور عبر Nginx:

### 10.1 إنشاء ملف كلمة المرور

```bash
sudo apt install -y apache2-utils
sudo htpasswd -c /etc/nginx/.htpasswd admin
# أدخل كلمة المرور
```

### 10.2 تعديل إعداد Nginx

```bash
sudo nano /etc/nginx/sites-available/news-aggregator
```

أضف داخل `location /`:

```nginx
    auth_basic "Syrian News Aggregator";
    auth_basic_user_file /etc/nginx/.htpasswd;
```

```bash
sudo systemctl reload nginx
```

> ⚠️ هذا سيطلب كلمة مرور لكل شيء بما فيه الـ API. إذا تستخدم n8n خارجياً، ضع الـ API في location منفصل بدون حماية:

```nginx
# API بدون حماية (لـ n8n)
location /api/ {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_buffering off;
    proxy_read_timeout 300s;
}

# Dashboard محمية
location / {
    auth_basic "News Aggregator Admin";
    auth_basic_user_file /etc/nginx/.htpasswd;
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
}
```

---

## 🔧 استكشاف الأخطاء

### التطبيق لا يعمل

```bash
pm2 logs news-aggregator --lines 50
```

### خطأ better-sqlite3

```bash
npm rebuild better-sqlite3
# أو
sudo apt install -y build-essential python3
npm install
```

### خطأ EACCES (صلاحيات)

```bash
sudo chown -R $USER:$USER /home/newsapp/syrian-news-aggregator
```

### خطأ في Nginx

```bash
sudo nginx -t
sudo tail -f /var/log/nginx/error.log
```

### قاعدة البيانات مقفلة (SQLITE_BUSY)

```bash
# تأكد أن نسخة واحدة فقط تعمل
pm2 list
# إذا كان هناك أكثر من نسخة، احذف الزائد
```

### التطبيق بطيء

```bash
pm2 monit              # مراقبة CPU/RAM
htop                   # مراقبة السيرفر ككل
```

---

## 📊 ملخص البنية النهائية

```
Internet
    │
    ▼
┌─────────────┐
│   Nginx     │  :80 / :443 (SSL)
│  (Reverse   │
│   Proxy)    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   PM2       │  Process Manager
│  (Node.js)  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  server.js  │  :3000 (internal)
│  Express    │
└──────┬──────┘
       │
   ┌───┴───┐
   ▼       ▼
┌──────┐ ┌─────────┐
│SQLite│ │WordPress│
│ .db  │ │ REST API│
└──────┘ └─────────┘
```

---

## ✅ قائمة التحقق بعد النشر

- [ ] `node -v` يعطي 18+
- [ ] `npm install` نجح بدون أخطاء
- [ ] `pm2 status` يظهر `online`
- [ ] `curl http://localhost:3000/api/stats` يرد JSON
- [ ] Nginx يعمل ويحوّل الطلبات
- [ ] SSL مفعّل (إذا استخدمت دومين)
- [ ] الفايروول يسمح فقط بـ SSH و HTTP/HTTPS
- [ ] `pm2 startup` مفعّل (يعيد التشغيل تلقائياً)
- [ ] لوحة التحكم تعمل من المتصفح
- [ ] جدولة الجلب التلقائي مفعّلة (cron أو n8n)
- [ ] `config.json` يحتوي البيانات الصحيحة
