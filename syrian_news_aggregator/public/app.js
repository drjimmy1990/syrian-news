/**
 * app.js - Web Dashboard Frontend Client-Side Application
 * Responsive visual elements, tabs, pagination, modal editors, connection testers, and SSE streaming log receiver.
 */

document.addEventListener('DOMContentLoaded', () => {
  // Global State
  const state = {
    config: null,
    articles: [],
    pagination: {
      total: 0,
      page: 1,
      limit: 15,
      totalPages: 1
    },
    filters: {
      search: '',
      source: '',
      status: ''
    },
    activeTab: 'overview',
    eventSource: null
  };

  // Cache DOM Elements
  const DOM = {
    // Navigation & Tabs
    menuItems: document.querySelectorAll('.menu-item'),
    tabPanels: document.querySelectorAll('.tab-panel'),
    pageTitleText: document.getElementById('page-title-text'),
    pageSubtitleText: document.getElementById('page-subtitle-text'),

    // Stats
    statTotalProcessed: document.getElementById('stat-total-processed'),
    statTotalPublished: document.getElementById('stat-total-published'),
    statTotalSources: document.getElementById('stat-total-sources'),
    statActiveSources: document.getElementById('stat-active-sources'),
    tblSourceStatsBody: document.getElementById('tbl-source-stats-body'),

    // Probes & Status Indicators
    lblWpStatus: document.getElementById('lbl-wp-status'),
    dotWpStatus: document.getElementById('dot-wp-status'),
    lblAiStatus: document.getElementById('lbl-ai-status'),
    dotAiStatus: document.getElementById('dot-ai-status'),
    btnTestWpTop: document.getElementById('btn-test-wp-top'),
    btnTestAiTop: document.getElementById('btn-test-ai-top'),

    // News Sources Tab
    inputSearchSources: document.getElementById('input-search-sources'),
    tblSourcesBody: document.getElementById('tbl-sources-body'),
    btnAddSourceModal: document.getElementById('btn-add-source-modal'),

    // Articles Tab
    filterArticleSearch: document.getElementById('filter-article-search'),
    filterArticleSource: document.getElementById('filter-article-source'),
    filterArticleStatus: document.getElementById('filter-article-status'),
    tblArticlesBody: document.getElementById('tbl-articles-body'),
    lblArticlesCount: document.getElementById('lbl-articles-count'),
    lblPaginationInfo: document.getElementById('lbl-pagination-info'),
    btnPagePrev: document.getElementById('btn-page-prev'),
    btnPageNext: document.getElementById('btn-page-next'),

    // Forms & Settings
    formConfigWp: document.getElementById('form-config-wp'),
    inpWpUrl: document.getElementById('inp-wp-url'),
    inpWpUsername: document.getElementById('inp-wp-username'),
    inpWpPassword: document.getElementById('inp-wp-password'),
    inpWpStatus: document.getElementById('inp-wp-status'),
    inpWpDryrun: document.getElementById('inp-wp-dryrun'),
    btnTestWp: document.getElementById('btn-test-wp'),

    formConfigAi: document.getElementById('form-config-ai'),
    inpAiEnabled: document.getElementById('inp-ai-enabled'),
    inpAiKey: document.getElementById('inp-ai-key'),
    inpAiModel: document.getElementById('inp-ai-model'),
    inpAiDryrun: document.getElementById('inp-ai-dryrun'),
    inpAiPrompt: document.getElementById('inp-ai-prompt'),
    btnTestAi: document.getElementById('btn-test-ai'),

    formConfigGeneral: document.getElementById('form-config-general'),
    inpGenDb: document.getElementById('inp-gen-db'),
    inpGenDelay: document.getElementById('inp-gen-delay'),
    inpGenMaxArticles: document.getElementById('inp-gen-max-articles'),

    // Live Terminal
    btnTriggerRun: document.getElementById('btn-trigger-run'),
    btnQuickRun: document.getElementById('btn-quick-run'),
    btnQuickPrune: document.getElementById('btn-quick-prune'),
    btnTerminalClear: document.getElementById('btn-terminal-clear'),
    btnTerminalRun: document.getElementById('btn-terminal-run'),
    selectTerminalSource: document.getElementById('select-terminal-source'),
    terminalOutputContainer: document.getElementById('terminal-output-container'),
    terminalStatusText: document.getElementById('terminal-status-text'),
    terminalPulse: document.getElementById('terminal-pulse'),

    // Modals
    modalViewArticle: document.getElementById('modal-view-article'),
    modalArticleTitle: document.getElementById('modal-article-title'),
    modalArticleSource: document.getElementById('modal-article-source'),
    modalArticleDate: document.getElementById('modal-article-date'),
    modalArticleWpid: document.getElementById('modal-article-wpid'),
    modalArticleLink: document.getElementById('modal-article-link'),
    modalArticleBody: document.getElementById('modal-article-body'),

    modalTestScrape: document.getElementById('modal-test-scrape'),
    testInfoName: document.getElementById('test-info-name'),
    testInfoStrategy: document.getElementById('test-info-strategy'),
    testScrapeLoading: document.getElementById('test-scrape-loading'),
    testScrapeError: document.getElementById('test-scrape-error'),
    testErrorMessage: document.getElementById('test-error-message'),
    testScrapeResults: document.getElementById('test-scrape-results'),
    testResultsCount: document.getElementById('test-results-count'),
    testArticlesContainer: document.getElementById('test-articles-container'),

    modalSourceForm: document.getElementById('modal-source-form'),
    modalSourceTitle: document.getElementById('modal-source-title'),
    formSourceEditor: document.getElementById('form-source-editor'),
    inpSourceIndex: document.getElementById('inp-source-index'),
    inpSrcName: document.getElementById('inp-src-name'),
    inpSrcUrl: document.getElementById('inp-src-url'),
    inpSrcRss: document.getElementById('inp-src-rss'),
    inpSrcStrategy: document.getElementById('inp-src-strategy'),
    inpSrcEncoding: document.getElementById('inp-src-encoding'),
    inpSelListContainer: document.getElementById('inp-sel-list-container'),
    inpSelListTitle: document.getElementById('inp-sel-list-title'),
    inpSelArtContent: document.getElementById('inp-sel-art-content'),
    inpSelArtDate: document.getElementById('inp-sel-art-date'),
    inpSrcEnabled: document.getElementById('inp-src-enabled'),

    toastContainer: document.getElementById('toast-container')
  };

  // =========================================================================
  // 1. TOAST NOTIFICATIONS & UX HELPERS
  // =========================================================================
  function showToast(message, type = 'success') {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let icon = 'fa-circle-check';
    if (type === 'error') icon = 'fa-circle-exclamation';
    if (type === 'warning') icon = 'fa-triangle-exclamation';
    if (type === 'info') icon = 'fa-circle-info';

    toast.innerHTML = `
      <i class="fa-solid ${icon} toast-icon"></i>
      <span class="toast-message">${message}</span>
    `;

    DOM.toastContainer.appendChild(toast);
    
    // Auto remove toast
    setTimeout(() => {
      toast.classList.add('toast-fadeout');
      toast.addEventListener('transitionend', () => toast.remove());
    }, 4000);
  }

  // Toggle Password Visibility
  document.querySelectorAll('.btn-toggle-password').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      const input = btn.previousElementSibling;
      if (input.type === 'password') {
        input.type = 'text';
        btn.innerHTML = '<i class="fa-solid fa-eye-slash"></i>';
      } else {
        input.type = 'password';
        btn.innerHTML = '<i class="fa-solid fa-eye"></i>';
      }
    });
  });

  // Modal Close Events
  document.querySelectorAll('.btn-close-modal').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();
      document.querySelectorAll('.modal-overlay').forEach(modal => {
        modal.classList.remove('active');
      });
    });
  });

  // Close modals when clicking outside container
  document.querySelectorAll('.modal-overlay').forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('active');
      }
    });
  });

  // Code copier hooks
  document.querySelectorAll('.btn-copy-code').forEach(btn => {
    btn.addEventListener('click', () => {
      const codeText = btn.getAttribute('data-clipboard');
      navigator.clipboard.writeText(codeText).then(() => {
        const originalText = btn.innerHTML;
        btn.innerHTML = '<i class="fa-solid fa-check"></i> تم النسخ!';
        btn.style.background = 'rgba(16, 185, 129, 0.2)';
        setTimeout(() => {
          btn.innerHTML = originalText;
          btn.style.background = '';
        }, 2000);
      }).catch(err => {
        showToast('فشل نسخ الكود تلقائياً', 'error');
      });
    });
  });

  // =========================================================================
  // 2. NAVIGATION & TABS SWITCHER
  // =========================================================================
  function switchTab(tabId) {
    state.activeTab = tabId;
    
    // Manage Sidebar Toggles
    DOM.menuItems.forEach(item => {
      if (item.getAttribute('data-tab') === tabId) {
        item.classList.add('active');
      } else {
        item.classList.remove('active');
      }
    });

    // Manage Panel Visibility
    DOM.tabPanels.forEach(panel => {
      if (panel.id === `tab-${tabId}`) {
        panel.classList.add('active');
      } else {
        panel.classList.remove('active');
      }
    });

    // Update Header Text dynamically based on Tab Selection
    const headers = {
      overview: { title: 'لوحة التحكم والمراقبة', subtitle: 'مراقبة وإدارة مجمع الأخبار السوري والنشر التلقائي عبر الووردبريس' },
      sources: { title: 'مصادر الأخبار السورية', subtitle: 'تعديل أو تنشيط أو إضافة قنوات الجلب الذكي والأرشفة المتكاملة' },
      articles: { title: 'مستودع الأرشيف المحلي', subtitle: 'تصفح وفحص كامل المقالات التي تم معالجتها ومكافحة تكرارها بنجاح' },
      settings: { title: 'إعدادات النظام والربط', subtitle: 'تهيئة كلمات مرور الووردبريس، مفاتيح OpenAI، وإدارة أزمنة التأخير الاحترازية' },
      terminal: { title: 'منسق الأوامر والدمج المباشر', subtitle: 'تشغيل خط المعالجة الفوري ومتابعة مخرجات سجلات التشغيل خطوة بخطوة' },
      integration: { title: 'مركز التكامل والجدولة', subtitle: 'استيراد مخططات n8n الجاهزة، وتهيئة جدولة المهام الصامتة بنجاح' }
    };

    if (headers[tabId]) {
      DOM.pageTitleText.textContent = headers[tabId].title;
      DOM.pageSubtitleText.textContent = headers[tabId].subtitle;
    }

    // Tab specific load actions
    if (tabId === 'overview') {
      loadStats();
      checkConnectionProbes();
    } else if (tabId === 'sources') {
      loadSourcesTable();
    } else if (tabId === 'articles') {
      loadArticlesTable();
    }
  }

  // Bind Sidebar Clicks
  DOM.menuItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const tabId = item.getAttribute('data-tab');
      switchTab(tabId);
      window.location.hash = tabId;
    });
  });

  // Handle Hash Anchors on Page Load
  if (window.location.hash) {
    const targetTab = window.location.hash.substring(1);
    const validTabs = ['overview', 'sources', 'articles', 'settings', 'terminal', 'integration'];
    if (validTabs.includes(targetTab)) {
      switchTab(targetTab);
    }
  }

  // =========================================================================
  // 3. STATS & SUMMARY DASHBOARD WIDGETS
  // =========================================================================
  async function loadStats() {
    try {
      const response = await fetch('/api/stats');
      const result = await response.json();
      if (!result.success) throw new Error(result.error);

      const stats = result.stats;
      DOM.statTotalProcessed.textContent = stats.totalProcessed.toLocaleString('ar-EG');
      DOM.statTotalPublished.textContent = stats.totalPublished.toLocaleString('ar-EG');
      DOM.statTotalSources.textContent = stats.sourcesCount.toLocaleString('ar-EG');
      DOM.statActiveSources.textContent = stats.activeSourcesCount.toLocaleString('ar-EG');

      // Populate breakdown table
      DOM.tblSourceStatsBody.innerHTML = '';
      if (!stats.sourcesBreakdown || stats.sourcesBreakdown.length === 0) {
        DOM.tblSourceStatsBody.innerHTML = `
          <tr>
            <td colspan="4" class="text-center py-4 text-muted">لا تتوفر إحصائيات للمصادر حالياً. ابدأ بأول تشغيل للدمج!</td>
          </tr>
        `;
        return;
      }

      stats.sourcesBreakdown.forEach(row => {
        const total = row.total || 0;
        const published = row.published || 0;
        const rate = total > 0 ? Math.round((published / total) * 100) : 0;
        
        let rateBadge = 'badge-secondary';
        if (rate >= 80) rateBadge = 'badge-success';
        else if (rate >= 40) rateBadge = 'badge-purple';
        else if (rate > 0) rateBadge = 'badge-warning';

        const tr = document.createElement('tr');
        tr.innerHTML = `
          <td><strong>${escapeHtml(row.source_name)}</strong></td>
          <td>${total.toLocaleString('ar-EG')}</td>
          <td>${published.toLocaleString('ar-EG')}</td>
          <td><span class="badge ${rateBadge}">${rate}%</span></td>
        `;
        DOM.tblSourceStatsBody.appendChild(tr);
      });

    } catch (error) {
      console.error(error);
      showToast(`فشل جلب إحصائيات الأرشفة: ${error.message}`, 'error');
    }
  }

  // =========================================================================
  // 4. API CONNECTION VERIFICATIONS
  // =========================================================================
  async function checkConnectionProbes() {
    // Quietly runs tests if settings are filled
    if (!state.config) return;

    const wp = state.config.wordpress;
    const ai = state.config.aiRewriter;

    // Check WordPress connection status
    if (wp && wp.wpUrl && wp.username && wp.appPassword) {
      DOM.lblWpStatus.textContent = 'جاري التحقق من أوراق اعتماد ووردبريس...';
      try {
        const res = await fetch('/api/test-wp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ wpUrl: wp.wpUrl, username: wp.username, appPassword: wp.appPassword })
        });
        const result = await res.json();
        if (result.success) {
          DOM.lblWpStatus.textContent = 'بوابة ووردبريس متصلة ومعتمدة بنجاح!';
          DOM.dotWpStatus.className = 'status-dot online';
        } else {
          DOM.lblWpStatus.textContent = 'فشل الربط بالووردبريس. تفقد إعدادات الحساب.';
          DOM.dotWpStatus.className = 'status-dot offline';
        }
      } catch (err) {
        DOM.lblWpStatus.textContent = 'خادم ووردبريس غير مستجيب.';
        DOM.dotWpStatus.className = 'status-dot offline';
      }
    } else {
      DOM.lblWpStatus.textContent = 'الإعدادات غير مكتملة. يرجى تهيئة الربط بالـ Settings.';
      DOM.dotWpStatus.className = 'status-dot warning';
    }

    // Check AI connection status
    if (ai && ai.enabled && ai.apiKey) {
      DOM.lblAiStatus.textContent = 'جاري فحص صلاحية مفتاح واجهة OpenAI API...';
      try {
        const res = await fetch('/api/test-ai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ apiKey: ai.apiKey, model: ai.model })
        });
        const result = await res.json();
        if (result.success) {
          DOM.lblAiStatus.textContent = `خادم الذكاء الاصطناعي متصل وجاهز (${ai.model})!`;
          DOM.dotAiStatus.className = 'status-dot online';
        } else {
          DOM.lblAiStatus.textContent = 'مفتاح واجهة OpenAI مرفوض أو منتهي الصلاحية.';
          DOM.dotAiStatus.className = 'status-dot offline';
        }
      } catch (err) {
        DOM.lblAiStatus.textContent = 'خادم OpenAI غير مستجيب أو منقطع الاتصال.';
        DOM.dotAiStatus.className = 'status-dot offline';
      }
    } else if (ai && ai.enabled) {
      DOM.lblAiStatus.textContent = 'صياغة الذكاء الاصطناعي مفعّلة ولكن تفتقد مفتاح الـ API.';
      DOM.dotAiStatus.className = 'status-dot offline';
    } else {
      DOM.lblAiStatus.textContent = 'إعادة الصياغة بالذكاء الاصطناعي معطلة.';
      DOM.dotAiStatus.className = 'status-dot warning';
    }
  }

  // Connection checking triggers
  const triggerWpCheck = async (e) => {
    if (e) e.preventDefault();
    const wpUrl = DOM.inpWpUrl.value.trim();
    const username = DOM.inpWpUsername.value.trim();
    const appPassword = DOM.inpWpPassword.value.trim();

    if (!wpUrl || !username || !appPassword) {
      showToast('يرجى تعبئة كافة بيانات الووردبريس للفحص.', 'warning');
      return;
    }

    showToast('جاري بدء فحص اتصال خادم ووردبريس المباشر...', 'info');
    try {
      const response = await fetch('/api/test-wp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wpUrl, username, appPassword })
      });
      const result = await response.json();
      if (result.success) {
        showToast(result.message, 'success');
      } else {
        showToast(result.error, 'error');
      }
    } catch (err) {
      showToast(`عطل بروتوكول HTTP: ${err.message}`, 'error');
    }
  };

  const triggerAiCheck = async (e) => {
    if (e) e.preventDefault();
    const apiKey = DOM.inpAiKey.value.trim();
    const model = DOM.inpAiModel.value;

    if (!apiKey) {
      showToast('يرجى كتابة مفتاح واجهة OpenAI للفحص.', 'warning');
      return;
    }

    showToast('جاري إرسال اختبار واجهة OpenAI API...', 'info');
    try {
      const response = await fetch('/api/test-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ apiKey, model })
      });
      const result = await response.json();
      if (result.success) {
        showToast(result.message, 'success');
      } else {
        showToast(result.error, 'error');
      }
    } catch (err) {
      showToast(`عطل بروتوكول HTTP: ${err.message}`, 'error');
    }
  };

  DOM.btnTestWp.addEventListener('click', triggerWpCheck);
  DOM.btnTestWpTop.addEventListener('click', triggerWpCheck);
  DOM.btnTestAi.addEventListener('click', triggerAiCheck);
  DOM.btnTestAiTop.addEventListener('click', triggerAiCheck);

  // =========================================================================
  // 5. GLOBAL CONFIGURATION LOADER & SETTINGS UPDATER
  // =========================================================================
  async function loadGlobalConfig() {
    try {
      const response = await fetch('/api/config');
      state.config = await response.json();

      // WordPress Settings Form Populate
      const wp = state.config.wordpress || {};
      DOM.inpWpUrl.value = wp.wpUrl || '';
      DOM.inpWpUsername.value = wp.username || '';
      DOM.inpWpPassword.value = wp.appPassword || '';
      DOM.inpWpStatus.value = wp.statusMode || 'draft';
      DOM.inpWpDryrun.value = wp.isDryRun !== undefined ? wp.isDryRun.toString() : 'true';

      // OpenAI AI Settings Form Populate
      const ai = state.config.aiRewriter || {};
      DOM.inpAiEnabled.checked = ai.enabled || false;
      DOM.inpAiKey.value = ai.apiKey || '';
      DOM.inpAiModel.value = ai.model || 'gpt-4o-mini';
      DOM.inpAiDryrun.value = ai.isDryRun !== undefined ? ai.isDryRun.toString() : 'true';
      DOM.inpAiPrompt.value = ai.systemPrompt || '';

      // General Settings Form Populate
      const gen = state.config.general || {};
      DOM.inpGenDb.value = gen.dbPath || 'news_aggregator.db';
      DOM.inpGenDelay.value = gen.rateLimitDelay || 1500;
      DOM.inpGenMaxArticles.value = gen.maxArticlesPerSource || 3;

      // Populate Article filters sources dropdown dynamically
      DOM.filterArticleSource.innerHTML = '<option value="">جميع المصادر</option>';
      state.config.sources.forEach(src => {
        const option = document.createElement('option');
        option.value = src.name;
        option.textContent = src.name;
        DOM.filterArticleSource.appendChild(option);
      });

      // Populate Terminal source dropdown dynamically
      if (DOM.selectTerminalSource) {
        DOM.selectTerminalSource.innerHTML = '<option value="">كل المصادر المفعّلة</option>';
        state.config.sources.forEach((src, idx) => {
          const option = document.createElement('option');
          option.value = idx.toString();
          option.textContent = src.name;
          DOM.selectTerminalSource.appendChild(option);
        });
      }

      // Execute background probes
      checkConnectionProbes();

    } catch (error) {
      console.error(error);
      showToast(`عطل في تحميل الإعدادات الرئيسية: ${error.message}`, 'error');
    }
  }

  // Handle WordPress Form Submission
  DOM.formConfigWp.addEventListener('submit', async (e) => {
    e.preventDefault();
    const wp = {
      wpUrl: DOM.inpWpUrl.value.trim(),
      username: DOM.inpWpUsername.value.trim(),
      appPassword: DOM.inpWpPassword.value.trim(),
      statusMode: DOM.inpWpStatus.value,
      isDryRun: DOM.inpWpDryrun.value === 'true'
    };

    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wordpress: wp })
      });
      const result = await res.json();
      if (result.success) {
        showToast('تم حفظ أوراق اعتماد ووردبريس بنجاح!', 'success');
        state.config.wordpress = wp;
        checkConnectionProbes();
      } else {
        showToast(result.error, 'error');
      }
    } catch (err) {
      showToast(`فشل الاتصال البرمجي بالخادم: ${err.message}`, 'error');
    }
  });

  // Handle OpenAI Form Submission
  DOM.formConfigAi.addEventListener('submit', async (e) => {
    e.preventDefault();
    const ai = {
      enabled: DOM.inpAiEnabled.checked,
      apiKey: DOM.inpAiKey.value.trim(),
      model: DOM.inpAiModel.value,
      isDryRun: DOM.inpAiDryrun.value === 'true',
      systemPrompt: DOM.inpAiPrompt.value.trim()
    };

    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aiRewriter: ai })
      });
      const result = await res.json();
      if (result.success) {
        showToast('تم تحديث وحفظ تفضيلات الصياغة الذكية!', 'success');
        state.config.aiRewriter = ai;
        checkConnectionProbes();
      } else {
        showToast(result.error, 'error');
      }
    } catch (err) {
      showToast(`فشل الاتصال البرمجي بالخادم: ${err.message}`, 'error');
    }
  });

  // Handle General Config Form Submission
  DOM.formConfigGeneral.addEventListener('submit', async (e) => {
    e.preventDefault();
    const general = {
      dbPath: DOM.inpGenDb.value.trim(),
      rateLimitDelay: parseInt(DOM.inpGenDelay.value),
      maxArticlesPerSource: parseInt(DOM.inpGenMaxArticles.value)
    };

    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ general })
      });
      const result = await res.json();
      if (result.success) {
        showToast('تم حفظ التهيئة العامة وتحديث قاعدة SQLite!', 'success');
        state.config.general = general;
      } else {
        showToast(result.error, 'error');
      }
    } catch (err) {
      showToast(`فشل الاتصال البرمجي بالخادم: ${err.message}`, 'error');
    }
  });

  // =========================================================================
  // 6. NEWS SOURCES TAB CONTROLLER
  // =========================================================================
  function loadSourcesTable() {
    if (!state.config || !state.config.sources) return;
    
    const query = DOM.inputSearchSources.value.toLowerCase().trim();
    DOM.tblSourcesBody.innerHTML = '';

    let matchingSources = 0;
    state.config.sources.forEach((src, idx) => {
      // Filter logic
      if (query && !src.name.toLowerCase().includes(query) && !src.url.toLowerCase().includes(query)) {
        return;
      }
      
      matchingSources++;
      const strategyMap = {
        wp_api: '<span class="badge badge-success"><i class="fa-solid fa-code"></i> WP-JSON API</span>',
        rss: '<span class="badge badge-purple"><i class="fa-solid fa-rss"></i> RSS Feed XML</span>',
        html: '<span class="badge badge-warning"><i class="fa-solid fa-spider"></i> HTML Crawl</span>'
      };

      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td><strong>${escapeHtml(src.name)}</strong></td>
        <td><a href="${src.url}" target="_blank" class="table-link">${escapeHtml(src.url)} <i class="fa-solid fa-up-right-from-square"></i></a></td>
        <td>${src.rssUrl ? `<a href="${src.rssUrl}" target="_blank" class="table-link">${escapeHtml(src.rssUrl)}</a>` : '<span class="text-muted">غير متوفر</span>'}</td>
        <td>${strategyMap[src.strategy] || src.strategy}</td>
        <td>
          <label class="switch-container">
            <input type="checkbox" class="toggle-source-status" data-index="${idx}" ${src.enabled ? 'checked' : ''}>
            <span class="switch-slider"></span>
          </label>
        </td>
        <td>
          <div class="btn-group">
            <button class="btn btn-outline-purple btn-sm btn-test-src" data-index="${idx}" title="فحص الجلب"><i class="fa-solid fa-vial"></i></button>
            <button class="btn btn-outline-primary btn-sm btn-edit-src" data-index="${idx}" title="تعديل"><i class="fa-solid fa-pen-to-square"></i></button>
            <button class="btn btn-outline-danger btn-sm btn-delete-src" data-index="${idx}" title="حذف"><i class="fa-solid fa-trash"></i></button>
          </div>
        </td>
      `;
      DOM.tblSourcesBody.appendChild(tr);
    });

    if (matchingSources === 0) {
      DOM.tblSourcesBody.innerHTML = `
        <tr>
          <td colspan="6" class="text-center py-4 text-muted">لا توجد مصادر إخبارية مطابقة للبحث الحالي.</td>
        </tr>
      `;
    }

    // Bind Toggle Switch triggers
    document.querySelectorAll('.toggle-source-status').forEach(toggle => {
      toggle.addEventListener('change', async () => {
        const index = toggle.getAttribute('data-index');
        const enabled = toggle.checked;
        
        try {
          const res = await fetch(`/api/sources/${index}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ enabled })
          });
          const result = await res.json();
          if (result.success) {
            state.config.sources[index].enabled = enabled;
            showToast(`تم ${enabled ? 'تنشيط' : 'تعطيل'} مصدر "${state.config.sources[index].name}" بنجاح!`, 'success');
            loadStats(); // Update active counts
          } else {
            toggle.checked = !enabled;
            showToast(result.error, 'error');
          }
        } catch (err) {
          toggle.checked = !enabled;
          showToast(`عطل في معالجة الطلب: ${err.message}`, 'error');
        }
      });
    });

    // Bind Delete buttons
    document.querySelectorAll('.btn-delete-src').forEach(btn => {
      btn.addEventListener('click', async () => {
        const index = btn.getAttribute('data-index');
        const sourceName = state.config.sources[index].name;

        if (confirm(`هل أنت متأكد تماماً من حذف مصدر "${sourceName}" من النظام الإخباري بالكامل؟`)) {
          try {
            const res = await fetch(`/api/sources/${index}`, { method: 'DELETE' });
            const result = await res.json();
            if (result.success) {
              showToast(result.message, 'success');
              state.config.sources.splice(index, 1);
              loadGlobalConfig(); // Reload and re-populate
              loadSourcesTable();
              loadStats();
            } else {
              showToast(result.error, 'error');
            }
          } catch (err) {
            showToast(`فشل حذف المصدر: ${err.message}`, 'error');
          }
        }
      });
    });

    // Bind Edit buttons
    document.querySelectorAll('.btn-edit-src').forEach(btn => {
      btn.addEventListener('click', () => {
        const index = btn.getAttribute('data-index');
        openSourceFormModal(index);
      });
    });

    // Bind Test Scrape buttons
    document.querySelectorAll('.btn-test-src').forEach(btn => {
      btn.addEventListener('click', () => {
        const index = btn.getAttribute('data-index');
        triggerTestScrape(index);
      });
    });
  }

  // Handle source search keyup
  DOM.inputSearchSources.addEventListener('keyup', loadSourcesTable);

  async function triggerTestScrape(index) {
    const source = state.config.sources[index];
    if (!source) return;

    // Reset and show modal
    DOM.testInfoName.textContent = source.name;
    const strategyMap = {
      wp_api: 'WP-JSON API',
      rss: 'RSS Feed XML',
      html: 'HTML Crawl'
    };
    DOM.testInfoStrategy.textContent = strategyMap[source.strategy] || source.strategy;
    
    DOM.testScrapeLoading.classList.remove('d-none');
    DOM.testScrapeError.classList.add('d-none');
    DOM.testScrapeResults.classList.add('d-none');
    DOM.testArticlesContainer.innerHTML = '';
    
    DOM.modalTestScrape.classList.add('active');

    try {
      const response = await fetch(`/api/sources/${index}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const result = await response.json();
      
      DOM.testScrapeLoading.classList.add('d-none');
      
      if (result.success) {
        DOM.testResultsCount.textContent = result.articlesCount.toLocaleString('ar-EG');
        DOM.testArticlesContainer.innerHTML = '';
        
        if (result.articles.length === 0) {
          DOM.testArticlesContainer.innerHTML = '<p class="text-center py-4 text-muted">لم يتم العثور على أي مقالات إطلاقاً في هذا الفحص التجريبي.</p>';
        } else {
          result.articles.forEach(art => {
            let formattedDate = 'غير متوفر';
            if (art.published_at) {
              try {
                const dateObj = new Date(art.published_at);
                formattedDate = dateObj.toLocaleDateString('ar-EG', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                });
              } catch(e) {}
            }

            const card = document.createElement('div');
            card.className = 'test-article-card p-3 mb-2 rounded transition';
            card.innerHTML = `
              <h4 class="mb-1 text-white">${escapeHtml(art.title)}</h4>
              <div class="meta-info d-flex flex-wrap gap-2 text-xs mb-2">
                <span class="text-muted"><i class="fa-regular fa-calendar-days"></i> ${formattedDate}</span>
                <span class="text-muted"><i class="fa-solid fa-align-left"></i> حجم المحتوى: ${art.contentLength.toLocaleString('ar-EG')} حرف</span>
                <a href="${art.url}" target="_blank" class="text-primary"><i class="fa-solid fa-up-right-from-square"></i> زيارة المصدر</a>
              </div>
              <div class="preview-text text-muted text-sm">${escapeHtml(art.contentPreview)}</div>
            `;
            DOM.testArticlesContainer.appendChild(card);
          });
        }
        
        DOM.testScrapeResults.classList.remove('d-none');
      } else {
        DOM.testErrorMessage.textContent = result.error || 'حدث خطأ غير متوقع أثناء الجلب.';
        DOM.testScrapeError.classList.remove('d-none');
      }
    } catch (error) {
      DOM.testScrapeLoading.classList.add('d-none');
      DOM.testErrorMessage.textContent = `عطل في الاتصال بالخادم: ${error.message}`;
      DOM.testScrapeError.classList.remove('d-none');
    }
  }

  // Open Modal Form (Add / Edit)
  function openSourceFormModal(index = null) {
    DOM.formSourceEditor.reset();
    
    if (index === null) {
      // Add mode
      DOM.modalSourceTitle.textContent = 'إضافة مصدر إخباري جديد';
      DOM.inpSourceIndex.value = '';
      DOM.inpSrcEnabled.checked = true;
      // Default standard selectors
      DOM.inpSelListContainer.value = 'article';
      DOM.inpSelListTitle.value = 'h2 a';
      DOM.inpSelArtContent.value = '.entry-content';
      DOM.inpSelArtDate.value = 'time';
    } else {
      // Edit mode
      const src = state.config.sources[index];
      DOM.modalSourceTitle.textContent = `تعديل المصدر: ${src.name}`;
      DOM.inpSourceIndex.value = index;
      
      DOM.inpSrcName.value = src.name;
      DOM.inpSrcUrl.value = src.url;
      DOM.inpSrcRss.value = src.rssUrl || '';
      DOM.inpSrcStrategy.value = src.strategy || 'html';
      DOM.inpSrcEncoding.value = src.encoding || 'utf-8';
      DOM.inpSrcEnabled.checked = src.enabled !== false;

      const selectors = src.selectors || {};
      DOM.inpSelListContainer.value = selectors.list ? selectors.list.container || '' : '';
      DOM.inpSelListTitle.value = selectors.list ? selectors.list.title || '' : '';
      DOM.inpSelArtContent.value = selectors.article ? selectors.article.content || '' : '';
      DOM.inpSelArtDate.value = selectors.article ? selectors.article.date || '' : '';
    }

    DOM.modalSourceForm.classList.add('active');
  }

  // Add source button trigger click
  DOM.btnAddSourceModal.addEventListener('click', () => openSourceFormModal());

  // Form submission
  DOM.formSourceEditor.addEventListener('submit', async (e) => {
    e.preventDefault();
    const indexVal = DOM.inpSourceIndex.value;
    const isEdit = indexVal !== '';
    
    const sourcePayload = {
      name: DOM.inpSrcName.value.trim(),
      url: DOM.inpSrcUrl.value.trim(),
      rssUrl: DOM.inpSrcRss.value.trim() || null,
      strategy: DOM.inpSrcStrategy.value,
      encoding: DOM.inpSrcEncoding.value,
      enabled: DOM.inpSrcEnabled.checked,
      selectors: {
        list: {
          container: DOM.inpSelListContainer.value.trim() || 'article',
          title: DOM.inpSelListTitle.value.trim() || 'h2 a',
          link: 'a'
        },
        article: {
          title: 'h1',
          content: DOM.inpSelArtContent.value.trim() || '.content',
          date: DOM.inpSelArtDate.value.trim() || 'time'
        }
      }
    };

    try {
      let res;
      if (isEdit) {
        res = await fetch(`/api/sources/${indexVal}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sourcePayload)
        });
      } else {
        res = await fetch('/api/sources', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(sourcePayload)
        });
      }

      const result = await res.json();
      if (result.success) {
        showToast(result.message, 'success');
        DOM.modalSourceForm.classList.remove('active');
        
        if (isEdit) {
          state.config.sources[indexVal] = result.source;
        } else {
          state.config.sources.push(result.source);
        }

        loadGlobalConfig(); // Refresh components
        loadSourcesTable();
        loadStats();
      } else {
        showToast(result.error, 'error');
      }
    } catch (err) {
      showToast(`فشل حفظ إعداد المصدر: ${err.message}`, 'error');
    }
  });

  // =========================================================================
  // 7. ARTICLES SQLITE LOGS TABLE
  // =========================================================================
  async function loadArticlesTable() {
    DOM.tblArticlesBody.innerHTML = `
      <tr>
        <td colspan="7" class="text-center py-4 text-muted"><i class="fa-solid fa-spinner fa-spin"></i> جاري استعلام ومزامنة سجل المقالات...</td>
      </tr>
    `;

    const search = DOM.filterArticleSearch.value.trim();
    const source = DOM.filterArticleSource.value;
    const status = DOM.filterArticleStatus.value;
    const page = state.pagination.page;

    const url = `/api/articles?search=${encodeURIComponent(search)}&source=${encodeURIComponent(source)}&status=${encodeURIComponent(status)}&page=${page}&limit=15`;
    
    try {
      const response = await fetch(url);
      const result = await response.json();
      if (!result.success) throw new Error(result.error);

      state.articles = result.data || [];
      state.pagination = result.pagination;

      DOM.lblArticlesCount.textContent = `${state.pagination.total.toLocaleString('ar-EG')} مقال`;
      
      DOM.tblArticlesBody.innerHTML = '';
      if (state.articles.length === 0) {
        DOM.tblArticlesBody.innerHTML = `
          <tr>
            <td colspan="7" class="text-center py-4 text-muted">لا تتوفر أي مقالات مطابقة لمعايير التصفية والبحث الحالية.</td>
          </tr>
        `;
        DOM.lblPaginationInfo.textContent = 'الصفحة 0 من 0';
        DOM.btnPagePrev.disabled = true;
        DOM.btnPageNext.disabled = true;
        return;
      }

      state.articles.forEach(article => {
        const tr = document.createElement('tr');
        
        // Date formatting helper
        let formattedDate = 'غير متوفر';
        if (article.processed_at) {
          try {
            const dateObj = new Date(article.processed_at);
            formattedDate = dateObj.toLocaleDateString('ar-EG', {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });
          } catch(e) {}
        }

        const isPublished = article.status === 'published' || article.wordpress_post_id;
        const statusBadge = isPublished 
          ? '<span class="badge badge-success"><i class="fa-solid fa-cloud-arrow-up"></i> منشور بـ WP</span>'
          : '<span class="badge badge-purple"><i class="fa-solid fa-database"></i> مؤرشف محلياً</span>';

        const wpIdDisplay = article.wordpress_post_id 
          ? `<span class="badge badge-info font-monospace">${article.wordpress_post_id}</span>`
          : '<span class="text-muted">-</span>';

        tr.innerHTML = `
          <td class="article-title-cell" title="${escapeHtml(article.title)}"><strong>${escapeHtml(article.title)}</strong></td>
          <td><span class="badge badge-secondary">${escapeHtml(article.source_name)}</span></td>
          <td><a href="${article.url}" target="_blank" class="table-link" title="زيارة رابط الخبر الأصلي"><i class="fa-solid fa-square-share-nodes"></i> زيارة</a></td>
          <td class="font-tajawal text-xs">${formattedDate}</td>
          <td>${wpIdDisplay}</td>
          <td>${statusBadge}</td>
          <td>
            <button class="btn btn-outline-primary btn-xs btn-view-article" data-id="${article.id}"><i class="fa-solid fa-eye"></i> التفاصيل</button>
          </td>
        `;
        DOM.tblArticlesBody.appendChild(tr);
      });

      // Pagination Updates
      DOM.lblPaginationInfo.textContent = `الصفحة ${state.pagination.page.toLocaleString('ar-EG')} من ${state.pagination.totalPages.toLocaleString('ar-EG')}`;
      DOM.btnPagePrev.disabled = state.pagination.page <= 1;
      DOM.btnPageNext.disabled = state.pagination.page >= state.pagination.totalPages;

      // Bind detail viewers
      document.querySelectorAll('.btn-view-article').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = parseInt(btn.getAttribute('data-id'));
          const article = state.articles.find(a => a.id === id);
          if (article) showArticleModal(article);
        });
      });

    } catch (error) {
      console.error(error);
      DOM.tblArticlesBody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center py-4 text-danger">فشل الاستعلام من قاعدة البيانات: ${error.message}</td>
        </tr>
      `;
    }
  }

  // Bind article interactive filters
  DOM.filterArticleSearch.addEventListener('keyup', debounce(() => {
    state.pagination.page = 1;
    loadArticlesTable();
  }, 400));

  DOM.filterArticleSource.addEventListener('change', () => {
    state.pagination.page = 1;
    loadArticlesTable();
  });

  DOM.filterArticleStatus.addEventListener('change', () => {
    state.pagination.page = 1;
    loadArticlesTable();
  });

  DOM.btnPagePrev.addEventListener('click', () => {
    if (state.pagination.page > 1) {
      state.pagination.page--;
      loadArticlesTable();
    }
  });

  DOM.btnPageNext.addEventListener('click', () => {
    if (state.pagination.page < state.pagination.totalPages) {
      state.pagination.page++;
      loadArticlesTable();
    }
  });

  // Modal Viewer
  function showArticleModal(article) {
    DOM.modalArticleTitle.textContent = article.title;
    DOM.modalArticleSource.textContent = article.source_name;
    DOM.modalArticleWpid.innerHTML = article.wordpress_post_id 
      ? `<span class="badge badge-info">${article.wordpress_post_id}</span>` 
      : '<span class="text-muted">مسودة أو لم ينشر بعد في وضع الفحص</span>';

    try {
      const d = new Date(article.processed_at);
      DOM.modalArticleDate.textContent = d.toLocaleString('ar-EG');
    } catch(e) {
      DOM.modalArticleDate.textContent = article.processed_at;
    }

    DOM.modalArticleLink.href = article.url;
    DOM.modalArticleBody.innerHTML = article.content || '<p class="text-muted">لا يتوفر نص مفرغ لهذا المقال.</p>';

    DOM.modalViewArticle.classList.add('active');
  }

  // =========================================================================
  // 8. MANAGE LIVE RUNNER LOG STREAM (SSE PROTOCAL)
  // =========================================================================
  function startPipelineStream() {
    // If active stream is already running, prevent duplicate threads
    if (state.eventSource) {
      showToast('يوجد عملية دمج جارية بالفعل في الواجهة الخلفية.', 'warning');
      return;
    }

    switchTab('terminal');

    // Reset Terminal Panel Screen
    DOM.terminalOutputContainer.innerHTML = '';
    appendTerminalLine('جاري بدء اتصال SSE المباشر مع خادم الدمج والأرشفة...', 'system');
    
    // Toggle active state
    setTerminalRunningState(true);

    // Launch SSE event stream
    let url = '/api/run-stream';
    if (DOM.selectTerminalSource && DOM.selectTerminalSource.value !== '') {
      url += `?sourceIndex=${DOM.selectTerminalSource.value}`;
    }
    state.eventSource = new EventSource(url);

    state.eventSource.onmessage = (event) => {
      if (event.data === '[DONE]') {
        appendTerminalLine('[نظام الأرشفة] انتهت معالجة القنوات بنجاح وتم إغلاق خادم الدمج.', 'system');
        closePipelineStream();
        loadStats(); // Reload statistics counts
        return;
      }

      try {
        const payload = JSON.parse(event.data);
        const { type, message } = payload;
        
        if (type === 'status') {
          DOM.terminalStatusText.textContent = message;
          appendTerminalLine(`[الحالة] ${message}`, 'status');
        } else if (type === 'error') {
          appendTerminalLine(message, 'error');
        } else {
          appendTerminalLine(message, 'log');
        }
      } catch (err) {
        appendTerminalLine(event.data, 'log');
      }
    };

    state.eventSource.onerror = (err) => {
      console.error('SSE Error:', err);
      appendTerminalLine('حدث خطأ فادح في بروتوكول البث المباشر SSE أو انقطع اتصال الخادم.', 'error');
      closePipelineStream();
    };
  }

  function closePipelineStream() {
    if (state.eventSource) {
      state.eventSource.close();
      state.eventSource = null;
    }
    setTerminalRunningState(false);
  }

  function setTerminalRunningState(isRunning) {
    if (isRunning) {
      DOM.btnTerminalRun.disabled = true;
      DOM.btnTerminalRun.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري الدمج الآن...';
      DOM.btnTriggerRun.disabled = true;
      DOM.btnTriggerRun.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري الدمج...';
      DOM.btnQuickRun.disabled = true;
      DOM.btnQuickRun.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> معالجة جارية...';
      DOM.terminalPulse.classList.add('pulse-active');
    } else {
      DOM.btnTerminalRun.disabled = false;
      DOM.btnTerminalRun.innerHTML = '<i class="fa-solid fa-bolt"></i> بدء الدمج وجلب الأخبار الآن';
      DOM.btnTriggerRun.disabled = false;
      DOM.btnTriggerRun.innerHTML = '<i class="fa-solid fa-play"></i> <span>تشغيل يدوي للدمج</span>';
      DOM.btnQuickRun.disabled = false;
      DOM.btnQuickRun.innerHTML = '<i class="fa-solid fa-bolt"></i> تشغيل الدمج المباشر';
      DOM.terminalPulse.classList.remove('pulse-active');
      DOM.terminalStatusText.textContent = 'جاهز لبدء العملية';
    }
  }

  function appendTerminalLine(text, type = 'log') {
    const line = document.createElement('div');
    line.className = `terminal-line ${type}-line`;
    
    // Auto color code and format dates
    const dateStr = new Date().toLocaleTimeString('ar-EG');
    line.innerHTML = `<span class="terminal-time">[${dateStr}]</span> ${escapeHtml(text)}`;
    
    DOM.terminalOutputContainer.appendChild(line);
    
    // Auto scroll container
    DOM.terminalOutputContainer.scrollTop = DOM.terminalOutputContainer.scrollHeight;
  }

  // Bind Runner events
  DOM.btnTerminalRun.addEventListener('click', startPipelineStream);
  DOM.btnTriggerRun.addEventListener('click', startPipelineStream);
  DOM.btnQuickRun.addEventListener('click', startPipelineStream);

  DOM.btnTerminalClear.addEventListener('click', () => {
    DOM.terminalOutputContainer.innerHTML = '<div class="terminal-line system-line">[نظام الأرشفة] تم مسح شاشة السجلات. في انتظار أوامر المشرف...</div>';
  });

  // Database Prune Button Trigger
  DOM.btnQuickPrune.addEventListener('click', () => {
    if (confirm('تنبيه: سيتم تنظيف وحذف المقالات المؤرشفة قديماً (التي مر عليها أكثر من 90 يوماً). هل أنت متأكد؟')) {
      showToast('ميزة تنظيف الأرشفة القديمة قيد التطوير وستتفعل تلقائياً عند تراكم المقالات!', 'info');
    }
  });

  // =========================================================================
  // 9. UTILITY METHODS (ESCAPING & DEBOUNCING)
  // =========================================================================
  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }

  // =========================================================================
  // 10. INITIALIZATION
  // =========================================================================
  loadGlobalConfig();
  loadStats();
});
