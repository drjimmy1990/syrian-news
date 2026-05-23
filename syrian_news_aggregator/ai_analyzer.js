/**
 * ai_analyzer.js - AI-Powered DOM Analyzer for Selector Discovery
 * 
 * Uses an LLM to intelligently analyze a website's DOM structure
 * and discover the correct CSS selectors for scraping news articles.
 * 
 * This is an OPTIONAL enhancement — the heuristic auto-detect in scraper.js
 * works without AI. This module is used when heuristics fail or confidence is low.
 */

const axios = require('axios');
const cheerio = require('cheerio');

class AIDOMAnalyzer {
  constructor(config = {}) {
    this.apiUrl = config.apiUrl || 'https://api.openai.com/v1/chat/completions';
    this.apiKey = config.apiKey || '';
    this.model = config.model || 'gpt-4o-mini';
    this.isDryRun = config.isDryRun !== false;
    this.maxDOMTokens = config.maxDOMTokens || 4000;
  }

  /**
   * Condenses the full HTML into a structural skeleton that the LLM can reason about.
   * Strips text content, keeps tags + classes + IDs + first few chars of text.
   * This reduces a 200KB page to ~3-4KB of structural signal.
   */
  condensDOM(html, maxChars = 12000) {
    const $ = cheerio.load(html);

    // Remove noise elements entirely
    $('script, style, iframe, noscript, svg, path, link[rel="stylesheet"], meta, comment').remove();
    $('nav, footer, .sidebar, .ads, .ad, .advertisement, .social-share, .related-posts').remove();
    $('.menu, .nav, .footer, .header-nav, .cookie, .popup, .modal').remove();

    // Build structural skeleton
    function skeleton(el, depth = 0) {
      if (depth > 8) return ''; // Don't go too deep
      const lines = [];
      
      $(el).children().each((i, child) => {
        if (i >= 20 && depth <= 2) return; // Limit breadth at top levels
        const $c = $(child);
        const tag = child.tagName;
        if (!tag) return;

        // Build attribute string (only class, id, href, type, datetime)
        const attrs = [];
        const cls = $c.attr('class');
        if (cls) attrs.push(`class="${cls.trim().substring(0, 80)}"`);
        const id = $c.attr('id');
        if (id) attrs.push(`id="${id}"`);
        const href = $c.attr('href');
        if (href && tag === 'a') attrs.push(`href="${href.substring(0, 100)}"`);
        const dt = $c.attr('datetime');
        if (dt) attrs.push(`datetime="${dt}"`);
        const type = $c.attr('type');
        if (type && tag === 'link') attrs.push(`type="${type}"`);

        const attrStr = attrs.length > 0 ? ' ' + attrs.join(' ') : '';

        // Get direct text (not children's text), truncated
        const directText = $c.contents()
          .filter((_, n) => n.type === 'text')
          .text()
          .trim()
          .substring(0, 40);
        const textHint = directText ? ` "${directText}${directText.length >= 40 ? '…' : ''}"` : '';

        const childCount = $c.children().length;
        const indent = '  '.repeat(depth);

        if (childCount === 0) {
          lines.push(`${indent}<${tag}${attrStr}>${textHint}</${tag}>`);
        } else {
          lines.push(`${indent}<${tag}${attrStr}>${textHint}`);
          const inner = skeleton(child, depth + 1);
          if (inner) lines.push(inner);
          lines.push(`${indent}</${tag}>`);
        }
      });

      return lines.join('\n');
    }

    // Start from <body> or the whole document
    const body = $('body').length ? $('body')[0] : $.root()[0];
    let result = skeleton(body);

    // Truncate to max chars
    if (result.length > maxChars) {
      result = result.substring(0, maxChars) + '\n<!-- ... truncated ... -->';
    }

    return result;
  }

  /**
   * Analyzes a page's DOM using an LLM to discover CSS selectors.
   * @param {string} html - The raw HTML of the page
   * @param {string} url - The URL (for context)
   * @returns {Promise<Object>} - Detected selectors and confidence
   */
  async analyzeDOM(html, url) {
    if (this.isDryRun || !this.apiKey) {
      return this.analyzeMock(html, url);
    }

    const domSkeleton = this.condensDOM(html);
    console.log(`[AI Analyzer] DOM condensed to ${domSkeleton.length} chars for ${url}`);

    const systemPrompt = `You are an expert web scraper analyst. Given a condensed DOM structure of a news website, you identify the CSS selectors needed to scrape articles.

Your output must be ONLY valid JSON with this exact structure:
{
  "strategy": "html" or "rss",
  "confidence": 0.0 to 1.0,
  "reasoning": "Brief explanation in Arabic of why you chose these selectors",
  "selectors": {
    "list": {
      "container": "CSS selector for each article item in the list",
      "title": "CSS selector for the title within each container",
      "link": "CSS selector for the link within each container"
    },
    "article": {
      "title": "CSS selector for the article page title",
      "content": "CSS selector for the main content area",
      "date": "CSS selector for the publication date"
    }
  }
}

Rules:
- Container selector should match multiple repeating elements (article cards/items)
- Title selector is RELATIVE to the container (not absolute)
- Prefer class-based selectors over tag-only selectors
- For content, pick the selector that contains the main article text, not sidebars
- confidence: 0.9+ if clear article patterns found, 0.5-0.8 if ambiguous, <0.5 if guessing
- If you see RSS/feed links in the DOM, note them in reasoning but still provide HTML selectors`;

    const userPrompt = `Analyze this news website DOM and find the article scraping selectors.

Website URL: ${url}

Condensed DOM structure:
\`\`\`
${domSkeleton}
\`\`\`

Return ONLY the JSON object, no markdown code fences, no explanation outside JSON.`;

    try {
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': this.apiKey.startsWith('Bearer ') ? this.apiKey : `Bearer ${this.apiKey}`
      };

      const response = await axios.post(this.apiUrl, {
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.1,
        max_tokens: 800
      }, { headers, timeout: 30000 });

      if (response.status !== 200) {
        throw new Error(`LLM API Error [${response.status}]`);
      }

      const raw = response.data?.choices?.[0]?.message?.content?.trim();
      if (!raw) throw new Error('Empty LLM response');

      // Parse JSON — handle markdown code fences if LLM wraps it
      let jsonStr = raw;
      const fenceMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (fenceMatch) jsonStr = fenceMatch[1].trim();

      const result = JSON.parse(jsonStr);

      // Validate the result structure
      if (!result.selectors?.list?.container || !result.selectors?.article?.content) {
        throw new Error('LLM returned incomplete selector structure');
      }

      // Validate selectors actually match elements in the DOM
      const $ = cheerio.load(html);
      const containerMatches = $(result.selectors.list.container).length;
      if (containerMatches < 1) {
        console.log(`[AI Analyzer] Warning: container selector "${result.selectors.list.container}" matches 0 elements`);
        result.confidence = Math.min(result.confidence || 0, 0.3);
        result.warning = 'المحدد المكتشف لا يطابق أي عنصر في الصفحة الحالية';
      } else {
        console.log(`[AI Analyzer] ✓ Container selector matches ${containerMatches} elements`);
      }

      return {
        success: true,
        source: 'ai',
        ...result
      };
    } catch (error) {
      console.error(`[AI Analyzer] Analysis failed: ${error.message}`);
      return {
        success: false,
        source: 'ai',
        error: `فشل التحليل بالذكاء الاصطناعي: ${error.message}`
      };
    }
  }

  /**
   * Mock AI analysis for dry-run / no API key mode.
   * Returns reasonable defaults based on basic DOM sniffing.
   */
  async analyzeMock(html, url) {
    await new Promise(r => setTimeout(r, 500)); // Simulate latency

    const $ = cheerio.load(html);
    
    // Quick heuristic: count common patterns
    const articleCount = $('article').length;
    const postCount = $('.post, .entry, .news-item, .card').length;
    const bestCount = Math.max(articleCount, postCount);

    let container = 'article';
    if (postCount > articleCount) {
      const classes = ['.post', '.entry', '.news-item', '.card'];
      for (const cls of classes) {
        if ($(cls).length >= 2) { container = cls; break; }
      }
    }

    return {
      success: true,
      source: 'ai_mock',
      strategy: 'html',
      confidence: 0.5,
      reasoning: 'نتيجة تجريبية (وضع الفحص الجاف) — لم يتم استخدام الذكاء الاصطناعي الفعلي. يرجى تفعيل مفتاح API للحصول على نتائج دقيقة.',
      selectors: {
        list: { container, title: 'h2 a, h3 a', link: 'a' },
        article: { title: 'h1', content: '.entry-content, .post-content, article, main', date: 'time, .date' }
      },
      elementsFound: bestCount
    };
  }
}

module.exports = AIDOMAnalyzer;
