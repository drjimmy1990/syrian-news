# مجمع الأخبار السوري الذكي وناشر الووردبريس الذكي 📰🤖

مرحبًا بك في المستودع البرمجي الموحد لـ **مجمع الأخبار السورية وناشر الووردبريس التلقائي المتكامل**. يدمج هذا المشروع محرك جلب الأخبار المتطور، قاعدة بيانات مكافحة التكرار SQLite، صياغة المحتوى بالذكاء الاصطناعي (OpenAI API)، ولوحة تحكم ويب زجاجية مظلمة (Premium Glassmorphic Dashboard).

---

## 🚀 التشغيل السريع (Quick Start)

### 1. تثبيت الاعتمادات والمكتبات
```bash
npm install
```

### 2. تشغيل لوحة التحكم التفاعلية
```bash
npm start
```
- افتح المتصفح وتوجه إلى الرابط: **`http://localhost:3000`**

### 3. تشغيل المعالجة والدمج الصامت (CLI Cron)
```bash
node index.js --cron
```

---

## 📂 خريطة ملفات المشروع (Directory Map)

- [index.js](file:///C:/Users/LOQ/Documents/antigravity/wonderful-faraday/syrian_news_aggregator/index.js): بوابة التشغيل الرئيسية وموجه الأوامر.
- [server.js](file:///C:/Users/LOQ/Documents/antigravity/wonderful-faraday/syrian_news_aggregator/server.js): خادم Express للوحة التحكم وأدوات فحص الاتصال ومغذيات الـ SSE.
- [scraper.js](file:///C:/Users/LOQ/Documents/antigravity/wonderful-faraday/syrian_news_aggregator/scraper.js): محرك جلب وفك تغذيات RSS وزحف الـ HTML وقراءة ووردبريس.
- [db.js](file:///C:/Users/LOQ/Documents/antigravity/wonderful-faraday/syrian_news_aggregator/db.js): كبسولة SQLite للتحقق الفوري ومنع التكرار بمعامل Jaccard Similarity.
- [rewriter.js](file:///C:/Users/LOQ/Documents/antigravity/wonderful-faraday/syrian_news_aggregator/rewriter.js): بوابة إعادة الصياغة الصحفية باستخدام OpenAI GPT.
- [publisher.js](file:///C:/Users/LOQ/Documents/antigravity/wonderful-faraday/syrian_news_aggregator/publisher.js): محرك النشر والتنسيق وكتابة صناديق الإسناد لمصدر الخبر بووردبريس.
- [runner.js](file:///C:/Users/LOQ/Documents/antigravity/wonderful-faraday/syrian_news_aggregator/runner.js): المنسق العام لدورة المعالجة والدمج بالكامل.
- [config.json](file:///C:/Users/LOQ/Documents/antigravity/wonderful-faraday/syrian_news_aggregator/config.json): ملف إعدادات المصادر ومفاتيح الربط وبوابات النشر.
- [public/](file:///C:/Users/LOQ/Documents/antigravity/wonderful-faraday/syrian_news_aggregator/public): واجهة الويب المتكاملة للوحة التحكم تفصيلياً.

---

## 📖 الأدلة الإرشادية الكاملة (Documentation)

لقد وفرنا لك أدلة استخدام تفصيلية ومصورة لتسهيل تهيئة واستفادة كامل طاقات النظام البرمجية:

1. **[دليل الاستخدام الكامل (usage_guide.md)](file:///C:/Users/LOQ/Documents/antigravity/wonderful-faraday/syrian_news_aggregator/usage_guide.md) (مستحسن 🌟)**:
   - تفاصيل التثبيت والتهيئة للوحة التحكم والتشغيل.
   - تهيئة كلمات مرور تطبيق ووردبريس (Application Passwords).
   - تهيئة مفاتيح ربط OpenAI وصياغة الموجه التحريري.
   - تفاصيل هيكل قاعدة SQLite المدمجة ومكافحة التكرار.
   - شرح جدولة المهام التلقائية (Cron Jobs) على Linux و Windows بالتفصيل.

2. **[دليل تكامل منصة n8n البصرية (n8n_guide.md)](file:///C:/Users/LOQ/Documents/antigravity/wonderful-faraday/syrian_news_aggregator/n8n_guide.md)**:
   - دليل خطوة بخطوة لاستيراد وتفعيل مخطط n8n البصري.
   - تفاصيل عقد سير العمل ومراحل فلترة الأخبار وتدقيقها محلياً وبصرياً.
   - ملف الاستيراد الجاهز: [n8n_workflow.json](file:///C:/Users/LOQ/Documents/antigravity/wonderful-faraday/syrian_news_aggregator/n8n_workflow.json).

---
تمنياتنا لك بتجربة أرشفة ونشر فائقة الذكاء والسلاسة! 🚀
