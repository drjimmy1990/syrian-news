/**
 * test_aggregator.js - Comprehensive E2E and Unit Verification Suite with AI Rewriting
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');
const axios = require('axios');

// Store original axios methods
const originalGet = axios.get;
const originalHead = axios.head;
const originalPost = axios.post;

// Setup mock routers for Axios to allow complete offline execution
const mockRoutes = {
  // WP REST API response for Enab Baladi
  'https://www.enabbaladi.net/wp-json/wp/v2/posts?per_page=10&_embed=1': [
    {
      id: 101,
      title: { rendered: 'الْإِخْبَارِيَّةُ السُّورِيَّةُ تَنْشُرُ عَنْ حَلَبٍ' }, // Arabic Tashkeel diacritics
      content: { rendered: '<p>محتوى مقال الإخبارية السورية الأول بالتفصيل والمكتوب باللغة العربية الفصحى لتجاوز الحد الأدنى البالغ ثلاثمائة حرف بشكل كاف وسليم تماما.</p>' },
      link: 'https://www.enabbaladi.net/news/101',
      date: '2026-05-23T00:01:00'
    },
    {
      id: 102,
      title: { rendered: 'تلفزيون سوريا ينقل الأوضاع الميدانية' },
      content: { rendered: '<p>هذا هو المحتوى التفصيلي لخبر تلفزيون سوريا من دمشق وحلب والذي يصف الأوضاع بشكل موضوعي ودقيق وشامل لجميع الأحداث الجارية هناك.</p>' },
      link: 'https://www.enabbaladi.net/news/102',
      date: '2026-05-23T00:02:00'
    },
    {
      id: 103,
      title: { rendered: 'حركة الطيران مستمرة بشكل اعتيادي' },
      content: { rendered: '<p>أفادت وكالات الأنباء الرسمية بأن حركة الطيران في المطارات المدنية مستمرة بشكل اعتيادي دون أي تعديل أو تأخير يذكر على الرحلات المجدولة.</p>' },
      link: 'https://www.enabbaladi.net/news/103',
      date: '2026-05-23T00:03:00'
    }
  ],
  
  // HTML list response for Al-Watan Newspaper
  'https://www.alwatanonline.com': `
    <html>
      <body>
        <div class="post-item">
          <h3 class="post-title"><a href="/news/201">الوطن السورية تنشر تفاصيل الموازنة العامة للبلاد</a></h3>
        </div>
        <div class="post-item">
          <h3 class="post-title"><a href="/news/202">انطلاق فعاليات معرض دمشق الدولي للعام الحالي</a></h3>
        </div>
      </body>
    </html>
  `,
  
  // HTML Article response for Al-Watan article 201
  'https://www.alwatanonline.com/news/201': `
    <html>
      <body>
        <h1 class="single-post-title">الوطن السورية تنشر تفاصيل الموازنة العامة للبلاد</h1>
        <div class="post-content">
          <p>هذا هو المحتوى الكامل والتفصيلي لخبر الموازنة العامة من جريدة الوطن السورية والذي يتجاوز ثلاثمائة حرف ليكون كافياً للاستيراد السليم والتلقائي دون مشاكل.</p>
        </div>
        <div class="post-date">2026-05-23T01:10:00Z</div>
      </body>
    </html>
  `,

  // HTML Article response for Al-Watan article 202
  'https://www.alwatanonline.com/news/202': `
    <html>
      <body>
        <h1 class="single-post-title">انطلاق فعاليات معرض دمشق الدولي للعام الحالي</h1>
        <div class="post-content">
          <p>هذا هو المحتوى الكامل والتفصيلي لخبر معرض دمشق الدولي السنوي والذي يتضمن العديد من التفاصيل والأنشطة والفعاليات المصاحبة للمعرض هذا العام.</p>
        </div>
        <div class="post-date">2026-05-23T01:20:00Z</div>
      </body>
    </html>
  `,

  // HTML response for White Helmets List
  'https://whitehelmets.org/index.php/ar/alalam/akhbar-wtqaryr-alamyt': `
    <html>
      <body>
        <div class="views-row">
          <h3 class="card-title">الدفاع المدني ينقذ عائلة من تحت الأنقاض</h3>
          <a href="/news/301">اقرأ المزيد</a>
        </div>
      </body>
    </html>
  `,

  // HTML Article response for White Helmets article 301
  'https://whitehelmets.org/news/301': `
    <html>
      <body>
        <h1 class="page-title">الدفاع المدني ينقذ عائلة من تحت الأنقاض</h1>
        <div class="content-body">
          <p>عمليات الدفاع المدني السوري في إنقاذ الأرواح وإسعاف المصابين طوال الليل بنجاح تام وبطولة كبيرة من كافة الفرق المتواجدة على الأرض.</p>
        </div>
        <span class="created">2026-05-23T02:00:00Z</span>
      </body>
    </html>
  `
};

// Overwrite Axios.get for testing
axios.get = async function(url, config) {
  const cleanUrl = url.replace(/\/$/, '');
  const foundRoute = Object.keys(mockRoutes).find(r => r.replace(/\/$/, '') === cleanUrl);
  
  if (foundRoute) {
    const data = mockRoutes[foundRoute];
    const isArrayBuffer = config && config.responseType === 'arraybuffer';
    
    return {
      status: 200,
      statusText: 'OK',
      headers: { 
        'content-type': typeof data === 'string' ? 'text/html' : 'application/json' 
      },
      data: isArrayBuffer ? Buffer.from(typeof data === 'string' ? data : JSON.stringify(data)) : data
    };
  }
  
  throw new Error(`Axios Mock: Route not found for GET ${url}`);
};

// Overwrite Axios.head for testing (WordPress REST API Prober)
axios.head = async function(url, config) {
  if (url.includes('enabbaladi.net')) {
    return {
      status: 200,
      headers: {
        'link': '<https://www.enabbaladi.net/wp-json/>; rel="https://api.w.org/"'
      }
    };
  }
  return {
    status: 200,
    headers: {}
  };
};

// Overwrite Axios.post for testing (OpenAI completions API Prober / Publisher)
axios.post = async function(url, data, config) {
  // Check if it is the OpenAI chat completions endpoint
  if (url === 'https://api.openai.com/v1/chat/completions') {
    // 1. Perform standard validation on Authorization header
    const authHeader = config && config.headers && config.headers['Authorization'];
    if (!authHeader) {
      return {
        status: 401,
        data: { error: { message: "Missing Authorization header" } }
      };
    }
    if (!authHeader.startsWith('Bearer ') && !authHeader.startsWith('Basic ')) {
      return {
        status: 401,
        data: { error: { message: "Invalid Authorization header format" } }
      };
    }

    // 2. Perform payload schema validations
    if (!data.model) {
      return {
        status: 400,
        data: { error: { message: "Missing model parameter" } }
      };
    }
    if (!data.messages || !Array.isArray(data.messages) || data.messages.length === 0) {
      return {
        status: 400,
        data: { error: { message: "Missing or invalid messages parameter" } }
      };
    }

    // Check system prompt and user prompt
    const systemMsg = data.messages.find(m => m.role === 'system');
    const userMsg = data.messages.find(m => m.role === 'user');
    if (!systemMsg || !userMsg) {
      return {
        status: 400,
        data: { error: { message: "Missing system or user message in messages array" } }
      };
    }

    // 3. Simulate network latency
    await new Promise(resolve => setTimeout(resolve, 100));

    // 4. Generate dynamic paraphrased content to show real state and logic
    const originalText = userMsg.content;
    let paraphrasedText = originalText;
    
    // Perform dynamic replacement representing a real paraphrasing behavior
    paraphrasedText = paraphrasedText.replace(/الجيش/g, 'القوات المسلحة');
    paraphrasedText = paraphrasedText.replace(/مقال/g, 'تقرير إخباري');
    paraphrasedText = paraphrasedText.replace(/حركة الطيران/g, 'ملاحة الطيران الجوي');
    paraphrasedText = paraphrasedText.replace(/تفاصيل الموازنة/g, 'بنود وبنود الموازنة المالية');

    const prefix = '<p style="color: #007bff; font-weight: bold;">[إعادة صياغة ذكية معتمدة عبر API]</p>';
    if (paraphrasedText.startsWith('<')) {
      paraphrasedText = prefix + '\n' + paraphrasedText;
    } else {
      paraphrasedText = `[صياغة API ذكية]: ${paraphrasedText}`;
    }

    // Return mock OpenAI chat completions payload structure
    return {
      status: 200,
      statusText: 'OK',
      headers: { 'content-type': 'application/json' },
      data: {
        id: 'chatcmpl-mock123456',
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model: data.model,
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: paraphrasedText
            },
            finish_reason: 'stop'
          }
        ],
        usage: {
          prompt_tokens: 15,
          completion_tokens: 20,
          total_tokens: 35
        }
      }
    };
  }

  throw new Error(`Axios Mock: Route not found for POST ${url}`);
};

// Now import our modules under test
const Datastore = require('./db');
const { probeWordPressAPI, fetchArticles } = require('./scraper');
const WordPressPublisher = require('./publisher');
const ContentRewriter = require('./rewriter');
const { runPipeline } = require('./runner');

// Define 3 test sources mirroring our architecture types
const TEST_SOURCES = [
  // Type 1: Active RSS / WordPress REST API Support
  {
    name: 'عنب بلدي',
    url: 'https://www.enabbaladi.net',
    rssUrl: 'https://www.enabbaladi.net/feed',
    strategy: 'wp_api',
    encoding: 'utf-8',
    selectors: {
      list: {
        container: 'article',
        title: 'h2.entry-title a',
        link: 'h2.entry-title a'
      },
      article: {
        title: 'h1.entry-title',
        content: '.entry-content',
        date: '.post-date time'
      }
    }
  },
  // Type 2: HTML List crawler fallback (broken RSS)
  {
    name: 'جريدة الوطن السورية',
    url: 'https://www.alwatanonline.com',
    rssUrl: 'https://www.alwatanonline.com/feed',
    strategy: 'html',
    encoding: 'utf-8',
    selectors: {
      list: {
        container: '.post-item',
        title: 'h3.post-title a',
        link: 'a'
      },
      article: {
        title: 'h1.single-post-title',
        content: '.post-content',
        date: '.post-date'
      }
    }
  },
  // Type 3: Pure HTML Scraper
  {
    name: 'الدفاع المدني السوري',
    url: 'https://whitehelmets.org/index.php/ar/alalam/akhbar-wtqaryr-alamyt',
    rssUrl: null,
    strategy: 'html',
    encoding: 'utf-8',
    selectors: {
      list: {
        container: '.views-row',
        title: 'h3.card-title',
        link: 'a'
      },
      article: {
        title: 'h1.page-title',
        content: '.content-body',
        date: 'span.created'
      }
    }
  }
];

async function runSuite() {
  console.log('===================================================');
  console.log('   SYRIAN NEWS AGGREGATOR SYSTEM TEST SUITE        ');
  console.log('===================================================\n');

  const testDbPath = path.join(__dirname, 'test_run.db');
  
  // Reset any existing test database
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }

  const db = new Datastore(testDbPath);
  const publisher = new WordPressPublisher({
    wpUrl: 'https://mysyriannews.com',
    username: 'aggregator_user',
    appPassword: 'xxxx xxxx xxxx xxxx',
    statusMode: 'draft',
    isDryRun: true
  });

  // ----------------------------------------------------
  // UNIT TEST 1: URL Normalizer
  // ----------------------------------------------------
  console.log('[UNIT TEST 1] Verifying URL Normalizer...');
  const urls = [
    'https://www.sana.sy/news/123/?utm_source=telegram&ref=main/',
    'http://sana.sy/news/123?utm_campaign=social',
    'https://sana.sy/news/123/'
  ];
  const normUrls = urls.map(u => db.normalizeUrl(u));
  console.log(`  - Normalized URLs: ${JSON.stringify(normUrls)}`);
  normUrls.forEach(normalized => {
    assert.strictEqual(normalized, 'sana.sy/news/123');
  });
  console.log('✔ URL Normalization assertions PASSED!\n');

  // ----------------------------------------------------
  // UNIT TEST 2: Arabic Tashkeel & Letter Normalizer
  // ----------------------------------------------------
  console.log('[UNIT TEST 2] Verifying Arabic Text Normalizer...');
  const rawArabic = 'الْإِخْبَارِيَّةُ السُّورِيَّةُ تَنْشُرُ عَنْ حَلَبٍ';
  const expectedPlain = 'الاخباريه السوريه تنشر عن حلب';
  const normalizedText = db.normalizeArabicText(rawArabic);
  console.log(`  - Raw: "${rawArabic}"`);
  console.log(`  - Normalized: "${normalizedText}"`);
  assert.strictEqual(normalizedText, expectedPlain);
  console.log('✔ Arabic normalization assertions PASSED!\n');

  // ----------------------------------------------------
  // UNIT TEST 3: Jaccard Title Similarity Deduplication
  // ----------------------------------------------------
  console.log('[UNIT TEST 3] Verifying Jaccard Title Similarity & Exact Hashing...');
  const articleOriginal = {
    title: 'الجيش السوري يفتح ممرات آمنة للمدنيين',
    url: 'https://sana.sy/news/original',
    content: 'المحتوى الأصلي لخبر ممرات آمنة.',
    source_name: 'سانا'
  };

  // Assert duplicate checks before saving
  assert.strictEqual(db.isDuplicate(articleOriginal), false);
  const originalId = db.saveArticle(articleOriginal);
  assert.ok(originalId > 0);

  // Assert exact URL duplicate check
  const articleExactUrl = {
    title: 'مختلف العنوان تماماً',
    url: 'https://sana.sy/news/original/?utm_source=rss',
    content: 'مختلف المحتوى',
    source_name: 'سانا'
  };
  assert.strictEqual(db.isDuplicate(articleExactUrl), true);

  // Assert exact Title duplicate check (Tashkeel variants)
  const articleExactTitleWithTashkeel = {
    title: 'الْجَيْشُ السُّورِيُّ يَفْتَحُ مَمَرَّاتٍ آمِنَةً لِلْمَدَنِيِّينَ',
    url: 'https://sana.sy/news/new-url',
    content: 'محتوى آخر',
    source_name: 'سانا'
  };
  assert.strictEqual(db.isDuplicate(articleExactTitleWithTashkeel), true);

  // Assert Jaccard Similarity near-duplicate detection
  // "عاجل: الجيش السوري يفتح ممرات آمنة للمدنيين" has similarity 6/7 = 0.857 >= 0.85 threshold
  const articleNearDuplicate = {
    title: 'عاجل: الجيش السوري يفتح ممرات آمنة للمدنيين',
    url: 'https://sana.sy/news/another-new-url',
    content: 'محتوى مختلف تماماً للتأكيد',
    source_name: 'سانا'
  };
  assert.strictEqual(db.isDuplicate(articleNearDuplicate), true);
  console.log('✔ Deduplication (exact hash + Jaccard similarity) assertions PASSED!\n');

  // ----------------------------------------------------
  // UNIT TEST 4: WordPress API Prober
  // ----------------------------------------------------
  console.log('[UNIT TEST 4] Verifying WordPress REST API Prober...');
  const wpProbe = await probeWordPressAPI('https://www.enabbaladi.net');
  console.log(`  - Probe Enab Baladi: ${JSON.stringify(wpProbe)}`);
  assert.strictEqual(wpProbe.supported, true);
  assert.strictEqual(wpProbe.apiUrl, 'https://www.enabbaladi.net/wp-json/');
  console.log('✔ WordPress API Prober assertions PASSED!\n');

  // ----------------------------------------------------
  // UNIT TEST 5: AI Content Rewriter Client & Mock Fallback
  // ----------------------------------------------------
  console.log('[UNIT TEST 5] Verifying AI Content Rewriter Stage...');
  
  // Test 5a: Disabled state triggers direct bypass
  const disabledRewriter = new ContentRewriter({ enabled: false });
  const rawText = '<p>الجيش السوري يفتح ممرات آمنة.</p>';
  const bypassed = await disabledRewriter.rewriteContent(rawText);
  assert.strictEqual(bypassed, rawText);
  console.log('  - Rewriter disabled bypass verified.');

  // Test 5b: Enabled state applies paraphrasing transformation dynamically
  const enabledRewriter = new ContentRewriter({ enabled: true, isDryRun: true });
  const rewritten = await enabledRewriter.rewriteContent(rawText);
  console.log(`  - Original: "${rawText}"`);
  console.log(`  - Rewritten: "${rewritten}"`);
  
  // Verify that the mock rewriter altered the content and added the mock tag
  assert.ok(rewritten.includes('[تمت إعادة الصياغة بواسطة الذكاء الاصطناعي]'));
  assert.ok(rewritten.includes('القوات المسلحة')); // 'الجيش' substituted with 'القوات المسلحة'
  console.log('  - Offline mock rewriter verified.');

  // Test 5c: Enabled state, isDryRun: false, and apiKey provided triggers Axios POST request
  const apiRewriter = new ContentRewriter({
    enabled: true,
    isDryRun: false,
    apiKey: 'sk-mock-openai-api-key-12345',
    userPromptTemplate: 'صغ النص التالي: {content}',
    model: 'gpt-4o'
  });
  const apiRewritten = await apiRewriter.rewriteContent(rawText);
  console.log(`  - API Original: "${rawText}"`);
  console.log(`  - API Rewritten: "${apiRewritten}"`);
  assert.ok(apiRewritten.includes('[إعادة صياغة ذكية معتمدة عبر API]') || apiRewritten.includes('[صياغة API ذكية]'));
  assert.ok(apiRewritten.includes('القوات المسلحة'));
  console.log('  - Rewriter Axios API client verified.');
  console.log('✔ AI Content Rewriter assertions PASSED!\n');

  // ----------------------------------------------------
  // INTEGRATION TEST 1: Pipeline execution with AI Rewriting enabled
  // ----------------------------------------------------
  console.log('[INTEGRATION TEST 1] Running Pipeline Execution with AI Rewriting Enabled...');
  const run1Stats = await runPipeline({
    sources: TEST_SOURCES,
    database: db,
    wpConfig: publisher,
    rewriterConfig: { enabled: true, isDryRun: true },
    rateLimitDelay: 100
  });

  console.log(`  - Stats: ${JSON.stringify(run1Stats)}`);
  assert.strictEqual(run1Stats.articlesScraped, 6);
  assert.strictEqual(run1Stats.duplicatesSkipped, 0);
  assert.strictEqual(run1Stats.articlesRewritten, 6); // All 6 must be rewritten!
  assert.strictEqual(run1Stats.articlesPublished, 6);
  console.log('✔ Pipeline Run 1 (Rewriting Enabled) assertions PASSED!\n');

  // ----------------------------------------------------
  // INTEGRATION TEST 2: Pipeline Consecutive Run (Assert zero duplicates)
  // ----------------------------------------------------
  console.log('[INTEGRATION TEST 2] Running Pipeline Execution (Second Consecutive Run - Duplication Check)...');
  const run2Stats = await runPipeline({
    sources: TEST_SOURCES,
    database: db,
    wpConfig: publisher,
    rewriterConfig: { enabled: true, isDryRun: true },
    rateLimitDelay: 100
  });

  console.log(`  - Stats: ${JSON.stringify(run2Stats)}`);
  assert.strictEqual(run2Stats.articlesScraped, 6);
  assert.strictEqual(run2Stats.duplicatesSkipped, 6); // All must be skipped!
  assert.strictEqual(run2Stats.articlesPublished, 0);
  console.log('✔ Pipeline Run 2 (Zero Duplicates) assertions PASSED!\n');

  // ----------------------------------------------------
  // INTEGRATION TEST 3: Pipeline execution with API Rewriting enabled (isDryRun: false)
  // ----------------------------------------------------
  console.log('[INTEGRATION TEST 3] Running Pipeline Execution with API Rewriting (Axios REST Mock) Enabled...');
  const testDbPath3 = path.join(__dirname, 'test_run3.db');
  if (fs.existsSync(testDbPath3)) {
    fs.unlinkSync(testDbPath3);
  }
  const db3 = new Datastore(testDbPath3);
  
  const run3Stats = await runPipeline({
    sources: TEST_SOURCES,
    database: db3,
    wpConfig: publisher,
    rewriterConfig: {
      enabled: true,
      isDryRun: false,
      apiKey: 'sk-mock-test-key-integration',
      model: 'gpt-4o'
    },
    rateLimitDelay: 100
  });

  console.log(`  - Stats: ${JSON.stringify(run3Stats)}`);
  assert.strictEqual(run3Stats.articlesScraped, 6);
  assert.strictEqual(run3Stats.duplicatesSkipped, 0);
  assert.strictEqual(run3Stats.articlesRewritten, 6); // All 6 must be rewritten via the API!
  assert.strictEqual(run3Stats.articlesPublished, 6);
  
  // Clean up DB3
  db3.close();
  if (fs.existsSync(testDbPath3)) {
    fs.unlinkSync(testDbPath3);
  }
  console.log('✔ Pipeline Run 3 (API Rewriting Enabled via Axios Mock) assertions PASSED!\n');

  // ----------------------------------------------------
  // CLEANUP & FINAL REPORT
  // ----------------------------------------------------
  db.close();
  if (fs.existsSync(testDbPath)) {
    fs.unlinkSync(testDbPath);
  }

  // Restore original axios methods
  axios.get = originalGet;
  axios.head = originalHead;
  axios.post = originalPost;

  console.log('===================================================');
  console.log('   ALL TEST SUITE ASSERTIONS PASSED CLEANLY!       ');
  console.log('===================================================');
}

runSuite().catch(err => {
  console.error('\n❌ TEST SUITE FAILURE:', err);
  // Restore original axios methods in case of failure
  axios.get = originalGet;
  axios.head = originalHead;
  axios.post = originalPost;
  process.exit(1);
});
