/**
 * publisher.js - WordPress REST API Connector and Mock Publisher
 */

class WordPressPublisher {
  constructor(config = {}) {
    this.wpUrl = config.wpUrl || ''; // base URL: e.g., https://mywordpresssite.com
    this.username = config.username || '';
    this.appPassword = config.appPassword || '';
    this.statusMode = config.statusMode || 'draft'; // 'draft' or 'publish'
    this.isDryRun = config.isDryRun !== false; // Default true to prevent active hits unless configured

    // Setup base headers for native Application Passwords auth
    if (this.username && this.appPassword) {
      const creds = Buffer.from(`${this.username}:${this.appPassword}`).toString('base64');
      this.authHeader = `Basic ${creds}`;
    }
  }

  /**
   * Wrap content with elegant, styled HTML blockquotes for source attribution
   */
  formatArticleContent(article) {
    const pubDate = article.published_at 
      ? new Date(article.published_at).toLocaleString('ar-SY', { timeZone: 'Asia/Damascus' }) 
      : 'غير محدد';

    return `
      <div class="syrian-news-article" style="direction: rtl; text-align: right; font-family: tahoma, sans-serif; line-height: 1.8;">
        <!-- Original Article Content Body -->
        <div class="article-body-content">
          ${article.content}
        </div>
        
        <hr class="wp-block-separator" style="margin: 30px 0; border: none; border-top: 1px solid #ddd;" />
        
        <!-- Premium attribution card -->
        <blockquote class="wp-block-quote source-attribution" style="border-right: 4px solid #0056b3; border-left: none; padding-right: 15px; margin: 20px 0; background-color: #f9f9f9; padding: 15px 20px; border-radius: 4px;">
          <p style="margin: 0 0 10px 0; font-size: 14px; color: #555;">
            هذا الخبر مستورد تلقائياً عبر نظام التجميع والنشـر التلقائي من موقع: 
            <strong style="color: #0056b3;">${article.source_name}</strong>
          </p>
          <p style="margin: 0 0 10px 0; font-size: 13px; color: #777;">
            تاريخ النشـر الأصلي: <span>${pubDate}</span>
          </p>
          <p style="margin: 0; font-size: 14px;">
            المصدر الأصلي للخبر: 
            <a href="${article.url}" target="_blank" rel="noopener noreferrer" style="color: #0056b3; text-decoration: underline; font-weight: bold;">
              اضغط هنا لزيارة الرابط الأصلي
            </a>
          </p>
        </blockquote>
      </div>
    `;
  }

  /**
   * Core Post Creation Interface
   */
  async publishArticle(article) {
    // If dry run is true OR credentials/URL are not set, fall back to mock publisher
    if (this.isDryRun || !this.wpUrl || !this.authHeader) {
      return this.publishMock(article);
    }

    const formattedContent = this.formatArticleContent(article);
    
    // WordPress REST API POST Payload
    const payload = {
      title: article.title,
      content: formattedContent,
      status: this.statusMode,
      date: article.published_at ? new Date(article.published_at).toISOString() : new Date().toISOString(),
      meta: {
        source_url: article.url,
        source_name: article.source_name
      }
    };

    const endpoint = `${this.wpUrl.replace(/\/$/, '')}/wp-json/wp/v2/posts`;

    try {
      // Use standard global fetch available in Node.js >= 18
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': this.authHeader
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`WordPress API Error [${response.status}]: ${errorData.message || response.statusText}`);
      }

      const postData = await response.json();
      return {
        success: true,
        postId: postData.id,
        link: postData.link,
        status: postData.status,
        meta: postData.meta
      };
    } catch (err) {
      return {
        success: false,
        error: err.message,
        postId: null
      };
    }
  }

  /**
   * Dry-Run Mock Publisher to satisfy CODE_ONLY restrictions and E2E test runs
   */
  async publishMock(article) {
    // Simulate real network/API processing latency
    await new Promise(resolve => setTimeout(resolve, 150));

    // Simple validation checks
    if (!article.title || !article.url || !article.source_name) {
      return {
        success: false,
        error: 'Validation failed: title, url, or source_name missing from scraped article schema',
        postId: null
      };
    }

    // Generate simulated WP rest post responses
    const mockPostId = Math.floor(Math.random() * 90000) + 10000;
    const mockLink = `${this.wpUrl || 'https://mock-wordpress.local'}/?p=${mockPostId}`;

    return {
      success: true,
      postId: mockPostId,
      link: mockLink,
      status: this.statusMode,
      isMock: true,
      meta: {
        source_url: article.url,
        source_name: article.source_name
      }
    };
  }
}

module.exports = WordPressPublisher;
