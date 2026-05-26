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
    lblN8nStatus: document.getElementById('lbl-n8n-status'),
    dotN8nStatus: document.getElementById('dot-n8n-status'),
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
    filterDateFrom: document.getElementById('filter-date-from'),
    filterDateTo: document.getElementById('filter-date-to'),
    tblArticlesBody: document.getElementById('tbl-articles-body'),
    lblArticlesCount: document.getElementById('lbl-articles-count'),
    lblPaginationInfo: document.getElementById('lbl-pagination-info'),
    btnPagePrev: document.getElementById('btn-page-prev'),
    btnPageNext: document.getElementById('btn-page-next'),
    btnCleanAllArticles: document.getElementById('btn-clean-all-articles'),
    btnDeleteBySource: document.getElementById('btn-delete-by-source'),
    btnDeleteByDate: document.getElementById('btn-delete-by-date'),

    // Confirm Delete Modal
    modalConfirmDelete: document.getElementById('modal-confirm-delete'),
    confirmDeleteTitle: document.getElementById('confirm-delete-title'),
    confirmDeleteMessage: document.getElementById('confirm-delete-message'),
    confirmDeleteInput: document.getElementById('confirm-delete-input'),
    btnConfirmDeleteExecute: document.getElementById('btn-confirm-delete-execute'),

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

    formConfigN8n: document.getElementById('form-config-n8n'),
    inpN8nEnabled: document.getElementById('inp-n8n-enabled'),
    inpN8nSelectorsUrl: document.getElementById('inp-n8n-selectors-url'),
    inpN8nRewriteUrl: document.getElementById('inp-n8n-rewrite-url'),

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
    inpSrcAllowAi: document.getElementById('inp-src-allow-ai'),
    btnAutoDetect: document.getElementById('btn-auto-detect'),

    toastContainer: document.getElementById('toast-container'),

    // Per-source production controls (in source editor modal)
    inpSrcMaxArticles: document.getElementById('inp-src-max-articles'),
    inpSrcTimeout: document.getElementById('inp-src-timeout'),
    inpSrcRetry: document.getElementById('inp-src-retry'),
    inpSrcCrawlDepth: document.getElementById('inp-src-crawl-depth'),
    inpSrcPriority: document.getElementById('inp-src-priority'),
    lblSrcPriorityVal: document.getElementById('lbl-src-priority-val'),

    // Test All modal
    modalTestAll: document.getElementById('modal-test-all'),
    btnTestAllSources: document.getElementById('btn-test-all-sources'),
    btnStartTestAll: document.getElementById('btn-start-test-all'),
    testAllResultsList: document.getElementById('test-all-results-list'),
    testAllSummaryBar: document.getElementById('test-all-summary-bar'),
    testAllProgress: document.getElementById('test-all-progress'),
    testAllProgressFill: document.getElementById('test-all-progress-fill'),
    taCountSuccess: document.getElementById('ta-count-success'),
    taCountWarn: document.getElementById('ta-count-warn'),
    taCountFail: document.getElementById('ta-count-fail'),
    taCountPending: document.getElementById('ta-count-pending'),

    // Bulk Import modal
    modalBulkImport: document.getElementById('modal-bulk-import'),
    btnBulkImportModal: document.getElementById('btn-bulk-import-modal'),
    btnBulkParse: document.getElementById('btn-bulk-parse'),
    btnBulkDetectAll: document.getElementById('btn-bulk-detect-all'),
    btnBulkBack: document.getElementById('btn-bulk-back'),
    btnBulkImportExecute: document.getElementById('btn-bulk-import-execute'),
    bulkUrlsTextarea: document.getElementById('bulk-urls-textarea'),
    bulkUrlParseCount: document.getElementById('bulk-url-parse-count'),
    bulkStepPaste: document.getElementById('bulk-step-paste'),
    bulkStepPreview: document.getElementById('bulk-step-preview'),
    bulkPreviewLabel: document.getElementById('bulk-preview-label'),
    bulkPreviewTbody: document.getElementById('bulk-preview-tbody'),
    bulkCheckAll: document.getElementById('bulk-check-all'),
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
      // Fallback removal in case transitionend doesn't fire
      setTimeout(() => {
        if (toast.parentNode) toast.remove();
      }, 500);
      toast.addEventListener('transitionend', () => {
        if (toast.parentNode) toast.remove();
      });
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

    // Check n8n connection status
    const n8n = state.config.n8n;
    if (n8n && n8n.enabled) {
      if (n8n.selectorsWebhookUrl && n8n.rewriteWebhookUrl) {
        DOM.lblN8nStatus.textContent = 'خادم الأتمتة n8n مفعّل وجاهز للربط!';
        DOM.dotN8nStatus.className = 'status-dot online';
      } else if (n8n.selectorsWebhookUrl || n8n.rewriteWebhookUrl) {
        DOM.lblN8nStatus.textContent = 'تكامل n8n غير مكتمل (أحد الروابط فارغ).';
        DOM.dotN8nStatus.className = 'status-dot warning';
      } else {
        DOM.lblN8nStatus.textContent = 'أتمتة n8n مفعّلة ولكن تفتقد روابط الويب هوك.';
        DOM.dotN8nStatus.className = 'status-dot offline';
      }
    } else {
      DOM.lblN8nStatus.textContent = 'أتمتة وتكامل n8n معطّلة حالياً.';
      DOM.dotN8nStatus.className = 'status-dot warning';
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

      // n8n Settings Form Populate
      const n8n = state.config.n8n || {};
      DOM.inpN8nEnabled.checked = n8n.enabled || false;
      DOM.inpN8nSelectorsUrl.value = n8n.selectorsWebhookUrl || '';
      DOM.inpN8nRewriteUrl.value = n8n.rewriteWebhookUrl || '';

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

  // Handle n8n Form Submission
  if (DOM.formConfigN8n) {
    DOM.formConfigN8n.addEventListener('submit', async (e) => {
      e.preventDefault();
      const n8n = {
        enabled: DOM.inpN8nEnabled.checked,
        selectorsWebhookUrl: DOM.inpN8nSelectorsUrl.value.trim(),
        rewriteWebhookUrl: DOM.inpN8nRewriteUrl.value.trim()
      };

      try {
        const res = await fetch('/api/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ n8n })
        });
        const result = await res.json();
        if (result.success) {
          showToast('تم حفظ وتحديث إعدادات ربط n8n بنجاح!', 'success');
          state.config.n8n = n8n;
          checkConnectionProbes();
        } else {
          showToast(result.error, 'error');
        }
      } catch (err) {
        showToast(`فشل الاتصال البرمجي بالخادم: ${err.message}`, 'error');
      }
    });
  }

  // =========================================================================
  // 6. NEWS SOURCES TAB CONTROLLER
  // =========================================================================
  function formatRelativeTime(isoString) {
    if (!isoString) return 'غير مفحوص';
    try {
      const diff = Date.now() - new Date(isoString).getTime();
      const mins = Math.floor(diff / 60000);
      if (mins < 1) return 'الآن';
      if (mins < 60) return `منذ ${mins} دقيقة`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `منذ ${hours} ساعة`;
      const days = Math.floor(hours / 24);
      return `منذ ${days} يوم`;
    } catch (e) {
      return 'غير معروف';
    }
  }

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
        html: '<span class="badge badge-warning"><i class="fa-solid fa-spider"></i> HTML Crawl</span>',
        sitemap: '<span class="badge badge-info"><i class="fa-solid fa-sitemap"></i> Sitemap XML</span>'
      };

      // Build per-source settings micro-badges
      const maxArt = src.maxArticles !== undefined ? src.maxArticles : (state.config.general?.maxArticlesPerSource || '—');
      const depthLabel = src.crawlDepth === 'list' ? 'عناوين' : 'كامل';
      const depthClass = src.crawlDepth === 'list' ? 'badge-info' : 'badge-success';
      const priorityVal = src.priority !== undefined ? src.priority : 5;
      const retryVal = src.retryCount || 0;
      const timeoutVal = src.scrapeTimeout ? `${src.scrapeTimeout/1000}s` : '8s';
      const perSourceBadges = `
        <div style="display: flex; flex-wrap: wrap; gap: 4px; margin-top: 4px;">
          <span class="badge badge-secondary" title="الحد الأقصى للمقالات"><i class="fa-solid fa-newspaper"></i> ${maxArt}</span>
          <span class="badge ${depthClass}" title="عمق الزحف"><i class="fa-solid fa-layer-group"></i> ${depthLabel}</span>
          <span class="badge badge-secondary" title="المهلة الزمنية"><i class="fa-solid fa-clock"></i> ${timeoutVal}</span>
          ${retryVal > 0 ? `<span class="badge badge-purple" title="عدد إعادة المحاولات"><i class="fa-solid fa-rotate"></i> ${retryVal}</span>` : ''}
          ${priorityVal !== 5 ? `<span class="badge badge-warning" title="الأولوية"><i class="fa-solid fa-arrow-up-short-wide"></i> p${priorityVal}</span>` : ''}
        </div>
      `;

      let lastTestedHtml = '';
      if (src.lastTestedAt) {
        const timeStr = formatRelativeTime(src.lastTestedAt);
        const failCount = src.consecutiveFailures || 0;
        if (src.lastTestStatus === 'success') {
          lastTestedHtml = `<div style="display: flex; align-items: center; gap: 6px;"><span class="status-dot online" title="فحص ناجح"></span> <span class="font-tajawal text-xs text-white">${timeStr}</span></div>`;
        } else {
          const failBadge = failCount >= 3 
            ? `<span class="badge-fail-count" title="يتم تخطي هذا المصدر تلقائياً في الجلب الرئيسي">${failCount} فشل متكرر ⛔</span>` 
            : failCount > 0 
            ? `<span class="badge-fail-count minor" title="عدد مرات الفشل المتتالية">${failCount} فشل</span>` 
            : '';
          lastTestedHtml = `<div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;"><span class="status-dot offline" title="فشل الفحص: ${escapeHtml(src.lastTestError || '')}"></span> <span class="font-tajawal text-xs text-danger" title="فشل الفحص: ${escapeHtml(src.lastTestError || '')}">${timeStr} (فشل)</span>${failBadge}</div>`;
        }
      } else {
        lastTestedHtml = `<div style="display: flex; align-items: center; gap: 6px;"><span class="status-dot warning" title="غير مفحوص"></span> <span class="text-muted text-xs">غير مفحوص</span></div>`;
      }

      // Show a row-level broken warning for sources with 3+ consecutive failures
      const isBroken = (src.consecutiveFailures || 0) >= 3;
      const rowClass = isBroken ? 'source-row-broken' : '';

      const tr = document.createElement('tr');
      tr.className = rowClass;
      tr.innerHTML = `
        <td><strong>${escapeHtml(src.name)}</strong>${isBroken ? ' <span class="badge-broken-label">متوقف تلقائياً</span>' : ''}${perSourceBadges}</td>
        <td><a href="${src.url}" target="_blank" class="table-link">${escapeHtml(src.url)} <i class="fa-solid fa-up-right-from-square"></i></a></td>
        <td>${src.rssUrl ? `<a href="${src.rssUrl}" target="_blank" class="table-link">${escapeHtml(src.rssUrl)}</a>` : '<span class="text-muted">غير متوفر</span>'}</td>
        <td>${strategyMap[src.strategy] || src.strategy}</td>
        <td>${lastTestedHtml}</td>
        <td>
          <div class="source-toggle-wrapper" style="display:flex; align-items:center; gap:8px;">
            <label class="switch-container" style="margin:0;">
              <input type="checkbox" class="toggle-source-status" data-index="${idx}" ${src.enabled ? 'checked' : ''}>
              <span class="switch-slider"></span>
            </label>
            <span class="source-status-label ${src.enabled ? 'status-on' : 'status-off'}">${src.enabled ? 'مفعّل' : 'معطّل'}</span>
          </div>
        </td>
        <td>
          <div class="btn-group">
            <button class="btn btn-outline-purple btn-sm btn-test-src" data-index="${idx}" title="فحص الجلب"><i class="fa-solid fa-vial"></i></button>
            <button class="btn btn-outline-primary btn-sm btn-redetect-src" data-index="${idx}" title="إعادة كشف الاستراتيجية"><i class="fa-solid fa-magnifying-glass-chart"></i></button>
            <button class="btn btn-outline-primary btn-sm btn-edit-src" data-index="${idx}" title="تعديل"><i class="fa-solid fa-pen-to-square"></i></button>
            ${isBroken ? `<button class="btn btn-outline-warning btn-sm btn-reset-failures" data-index="${idx}" title="إعادة تفعيل المصدر وإعادة ضبط عداد الأخطاء"><i class="fa-solid fa-arrow-rotate-left"></i></button>` : ''}
            <button class="btn btn-outline-danger btn-sm btn-delete-src" data-index="${idx}" title="حذف"><i class="fa-solid fa-trash"></i></button>
          </div>
        </td>
      `;
      DOM.tblSourcesBody.appendChild(tr);
    });

    if (matchingSources === 0) {
      DOM.tblSourcesBody.innerHTML = `
        <tr>
          <td colspan="7" class="text-center py-4 text-muted">لا توجد مصادر إخبارية مطابقة للبحث الحالي.</td>
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

    // Bind Reset Failures (restore broken source) buttons
    document.querySelectorAll('.btn-reset-failures').forEach(btn => {
      btn.addEventListener('click', async () => {
        const index = btn.getAttribute('data-index');
        const sourceName = state.config.sources[index].name;
        try {
          const res = await fetch(`/api/sources/${index}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ consecutiveFailures: 0 })
          });
          const result = await res.json();
          if (result.success) {
            state.config.sources[index].consecutiveFailures = 0;
            showToast(`تمت إعادة ضبط عداد الأخطاء للمصدر "${sourceName}" — سيشارك مجدداً في الجلب الرئيسي.`, 'success');
            loadSourcesTable();
          } else {
            showToast(result.error || 'فشل إعادة الضبط.', 'error');
          }
        } catch (err) {
          showToast(`عطل في الاتصال: ${err.message}`, 'error');
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

    // Bind Re-detect Strategy buttons
    document.querySelectorAll('.btn-redetect-src').forEach(btn => {
      btn.addEventListener('click', async () => {
        const index = parseInt(btn.getAttribute('data-index'));
        const source = state.config.sources[index];
        if (!source) return;
        
        btn.disabled = true;
        btn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
        
        try {
          const response = await fetch('/api/sources/auto-detect', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: source.url })
          });
          const result = await response.json();
          
          if (result.success && result.isN8n) {
            showToast(`${source.name}: تم الإرسال للذكاء الاصطناعي للاستكشاف في الخلفية. سيتحدث تلقائياً.`, 'success');
          } else if (result.success && result.result && result.result.success) {
            const detected = result.result;
            // Update source with detected strategy
            const updates = {
              strategy: detected.strategy,
              selectors: detected.selectors
            };
            if (detected.rssUrl) updates.rssUrl = detected.rssUrl;
            
            const updateRes = await fetch(`/api/sources/${index}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(updates)
            });
            const updateResult = await updateRes.json();
            if (updateResult.success) {
              state.config.sources[index] = { ...state.config.sources[index], ...updates };
              loadSourcesTable();
              const strategyLabel = { wp_api: 'WP-JSON API', rss: 'RSS Feed', html: 'HTML Crawl', sitemap: 'Sitemap' }[detected.strategy] || detected.strategy;
              showToast(`✓ ${source.name}: تم الكشف عن استراتيجية ${strategyLabel}`, 'success');
            }
          } else {
            showToast(`${source.name}: ${result.result?.error || 'فشل الكشف التلقائي'}`, 'error');
          }
        } catch (err) {
          showToast(`خطأ: ${err.message}`, 'error');
        } finally {
          btn.disabled = false;
          btn.innerHTML = '<i class="fa-solid fa-magnifying-glass-chart"></i>';
        }
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
      html: 'HTML Crawl',
      sitemap: 'Sitemap XML'
    };
    DOM.testInfoStrategy.textContent = strategyMap[source.strategy] || source.strategy;
    
    DOM.testScrapeLoading.classList.remove('d-none');
    DOM.testScrapeError.classList.add('d-none');
    DOM.testScrapeResults.classList.add('d-none');
    DOM.testArticlesContainer.innerHTML = '';

    // Hide diagnostics until response
    const diagPanel = document.getElementById('test-diagnostics-panel');
    if (diagPanel) diagPanel.classList.add('d-none');
    
    DOM.modalTestScrape.classList.add('active');

    // Helper to populate diagnostics
    function showDiagnostics(result) {
      if (!diagPanel || !result.diagnostics) return;
      const d = result.diagnostics;
      const elMax = document.getElementById('test-diag-max');
      const elTimeout = document.getElementById('test-diag-timeout');
      const elDepth = document.getElementById('test-diag-depth');
      const elRetry = document.getElementById('test-diag-retry');
      const elEncoding = document.getElementById('test-diag-encoding');
      const elDuration = document.getElementById('test-diag-duration');
      
      if (elMax) elMax.textContent = d.maxArticles + ' مقالات';
      if (elTimeout) elTimeout.textContent = (d.scrapeTimeout / 1000) + ' ثانية';
      if (elDepth) elDepth.textContent = d.crawlDepth === 'list' ? 'عناوين فقط' : 'عناوين + محتوى';
      if (elRetry) elRetry.textContent = d.retryCount > 0 ? d.retryCount + ' محاولات' : 'بدون';
      if (elEncoding) elEncoding.textContent = d.encoding;
      if (elDuration) {
        const dur = result.durationMs;
        elDuration.textContent = dur >= 1000 ? (dur / 1000).toFixed(1) + 's' : dur + 'ms';
        elDuration.style.color = dur > 15000 ? '#f87171' : dur > 8000 ? '#fbbf24' : '#34d399';
      }
      
      diagPanel.classList.remove('d-none');
      diagPanel.style.display = 'grid';
    }

    try {
      const response = await fetch(`/api/sources/${index}/test`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const result = await response.json();
      
      DOM.testScrapeLoading.classList.add('d-none');
      showDiagnostics(result);
      
      if (result.success) {
        // Update client-side status state
        state.config.sources[index].lastTestedAt = result.lastTestedAt || new Date().toISOString();
        state.config.sources[index].lastTestStatus = 'success';
        state.config.sources[index].consecutiveFailures = 0;
        delete state.config.sources[index].lastTestError;
        loadSourcesTable();

        DOM.testResultsCount.textContent = result.articlesCount.toLocaleString('ar-EG');
        
        // Show limit info
        const limitInfoEl = document.getElementById('test-results-limit-info');
        if (limitInfoEl && result.diagnostics) {
          limitInfoEl.textContent = ` مقالات (من أصل حد أقصى ${result.diagnostics.maxArticles}) — استراتيجية ${strategyMap[source.strategy] || source.strategy}`;
        }
        
        DOM.testArticlesContainer.innerHTML = '';
        
        if (result.articles.length === 0) {
          const emptyMsg = result.warning
            ? `<div class="alert-warning-inline"><i class="fa-solid fa-triangle-exclamation"></i> ${escapeHtml(result.warning)}</div>`
            : '<p class="text-center py-4 text-muted">لم يتم العثور على أي مقالات إطلاقاً في هذا الفحص التجريبي.</p>';
          DOM.testArticlesContainer.innerHTML = emptyMsg;
        } else {
          result.articles.forEach((art, artIdx) => {
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

            const contentBadge = art.hasFullContent 
              ? '<span class="content-status-full"><i class="fa-solid fa-check"></i> محتوى كامل</span>'
              : '<span class="content-status-empty"><i class="fa-solid fa-exclamation"></i> بدون محتوى</span>';

            const card = document.createElement('div');
            card.className = 'test-article-card p-3 mb-2 rounded transition';
            card.innerHTML = `
              <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px;">
                <h4 class="mb-1 text-white" style="flex:1;">${artIdx + 1}. ${escapeHtml(art.title)}</h4>
                ${contentBadge}
              </div>
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
        state.config.sources[index].lastTestedAt = result.lastTestedAt || new Date().toISOString();
        state.config.sources[index].lastTestStatus = 'failed';
        state.config.sources[index].lastTestError = result.lastTestError || result.error;
        state.config.sources[index].consecutiveFailures = result.consecutiveFailures || 0;
        loadSourcesTable();

        const failMsg = result.error || 'حدث خطأ غير متوقع أثناء الجلب.';
        const failCount = result.consecutiveFailures || 0;
        DOM.testErrorMessage.innerHTML = `${escapeHtml(failMsg)}${failCount >= 3 ? '<br><strong style="color:#fbbf24">⚠️ هذا المصدر تجاوز ٣ أخطاء متتالية — سيتم تخطيه تلقائياً في الجلب الرئيسي. اضغط زر الاسترداد لإعادة تفعيله.</strong>' : failCount > 0 ? `<br><small style="opacity:.7">عدد الأخطاء المتتالية: ${failCount}/3</small>` : ''}`;
        DOM.testScrapeError.classList.remove('d-none');
      }
    } catch (error) {
      DOM.testScrapeLoading.classList.add('d-none');
      DOM.testErrorMessage.textContent = `عطل في الاتصال بالخادم: ${error.message}`;
      DOM.testScrapeError.classList.remove('d-none');

      state.config.sources[index].lastTestedAt = new Date().toISOString();
      state.config.sources[index].lastTestStatus = 'failed';
      state.config.sources[index].lastTestError = error.message;
      loadSourcesTable();
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
      if(DOM.inpSrcAllowAi) DOM.inpSrcAllowAi.checked = true;
      // Default standard selectors
      DOM.inpSelListContainer.value = 'article';
      DOM.inpSelListTitle.value = 'h2 a';
      DOM.inpSelArtContent.value = '.entry-content';
      DOM.inpSelArtDate.value = 'time';
      // Per-source controls defaults
      if (DOM.inpSrcMaxArticles) DOM.inpSrcMaxArticles.value = '';
      if (DOM.inpSrcTimeout) DOM.inpSrcTimeout.value = '';
      if (DOM.inpSrcRetry) DOM.inpSrcRetry.value = '0';
      if (DOM.inpSrcCrawlDepth) DOM.inpSrcCrawlDepth.value = 'list+article';
      if (DOM.inpSrcPriority) { DOM.inpSrcPriority.value = '5'; if (DOM.lblSrcPriorityVal) DOM.lblSrcPriorityVal.textContent = '5'; }
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
      if(DOM.inpSrcAllowAi) DOM.inpSrcAllowAi.checked = src.allowAiFallback !== false;

      const selectors = src.selectors || {};
      DOM.inpSelListContainer.value = selectors.list ? selectors.list.container || '' : '';
      DOM.inpSelListTitle.value = selectors.list ? selectors.list.title || '' : '';
      DOM.inpSelArtContent.value = selectors.article ? selectors.article.content || '' : '';
      DOM.inpSelArtDate.value = selectors.article ? selectors.article.date || '' : '';

      // Per-source controls
      if (DOM.inpSrcMaxArticles) DOM.inpSrcMaxArticles.value = src.maxArticles !== undefined ? src.maxArticles : '';
      if (DOM.inpSrcTimeout) DOM.inpSrcTimeout.value = src.scrapeTimeout ? src.scrapeTimeout.toString() : '';
      if (DOM.inpSrcRetry) DOM.inpSrcRetry.value = (src.retryCount || 0).toString();
      if (DOM.inpSrcCrawlDepth) DOM.inpSrcCrawlDepth.value = src.crawlDepth || 'list+article';
      if (DOM.inpSrcPriority) {
        const pVal = src.priority !== undefined ? src.priority : 5;
        DOM.inpSrcPriority.value = pVal.toString();
        if (DOM.lblSrcPriorityVal) DOM.lblSrcPriorityVal.textContent = pVal.toString();
      }
    }

    DOM.modalSourceForm.classList.add('active');
  }

  // Priority slider live value update
  if (DOM.inpSrcPriority) {
    DOM.inpSrcPriority.addEventListener('input', () => {
      if (DOM.lblSrcPriorityVal) {
        DOM.lblSrcPriorityVal.textContent = DOM.inpSrcPriority.value;
      }
    });
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
      allowAiFallback: DOM.inpSrcAllowAi ? DOM.inpSrcAllowAi.checked : true,
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

    // Include per-source production controls
    const maxArt = DOM.inpSrcMaxArticles ? DOM.inpSrcMaxArticles.value : '';
    if (maxArt !== '' && !isNaN(parseInt(maxArt))) {
      sourcePayload.maxArticles = parseInt(maxArt);
    }
    const timeout = DOM.inpSrcTimeout ? DOM.inpSrcTimeout.value : '';
    if (timeout !== '' && !isNaN(parseInt(timeout))) {
      sourcePayload.scrapeTimeout = parseInt(timeout);
    }
    if (DOM.inpSrcRetry) {
      sourcePayload.retryCount = parseInt(DOM.inpSrcRetry.value) || 0;
    }
    if (DOM.inpSrcCrawlDepth) {
      sourcePayload.crawlDepth = DOM.inpSrcCrawlDepth.value || 'list+article';
    }
    if (DOM.inpSrcPriority) {
      sourcePayload.priority = parseInt(DOM.inpSrcPriority.value) || 5;
    }

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
    const dateFrom = DOM.filterDateFrom ? DOM.filterDateFrom.value : '';
    const dateTo = DOM.filterDateTo ? DOM.filterDateTo.value : '';

    let url = `/api/articles?search=${encodeURIComponent(search)}&source=${encodeURIComponent(source)}&status=${encodeURIComponent(status)}&page=${page}&limit=15`;
    if (dateFrom) url += `&dateFrom=${dateFrom}T00:00:00Z`;
    if (dateTo) url += `&dateTo=${dateTo}T23:59:59Z`;
    
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

        const truncatedTitle = article.title.length > 120 ? article.title.slice(0, 120) + '...' : article.title;

        tr.innerHTML = `
          <td class="article-title-cell" title="${escapeHtml(article.title)}"><strong>${escapeHtml(truncatedTitle)}</strong></td>
          <td><span class="badge badge-secondary">${escapeHtml(article.source_name)}</span></td>
          <td><a href="${article.url}" target="_blank" class="table-link" title="زيارة رابط الخبر الأصلي"><i class="fa-solid fa-square-share-nodes"></i> زيارة</a></td>
          <td class="font-tajawal text-xs">${formattedDate}</td>
          <td>${wpIdDisplay}</td>
          <td>${statusBadge}</td>
          <td>
            <div class="btn-group" style="display: flex; gap: 4px;">
              <button class="btn btn-outline-primary btn-xs btn-view-article" data-id="${article.id}"><i class="fa-solid fa-eye"></i> التفاصيل</button>
              <button class="btn btn-outline-danger btn-xs btn-delete-article" data-id="${article.id}"><i class="fa-solid fa-trash-can"></i> حذف</button>
            </div>
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

      // Bind delete handlers
      document.querySelectorAll('.btn-delete-article').forEach(btn => {
        btn.addEventListener('click', async () => {
          const id = parseInt(btn.getAttribute('data-id'));
          const article = state.articles.find(a => a.id === id);
          if (!article) return;

          let deleteFromWP = false;
          const isPublished = article.wordpress_post_id;

          let confirmMsg = `هل أنت متأكد تماماً من حذف مقال "${article.title.slice(0, 50)}..." من السجل المحلي؟`;
          
          if (isPublished) {
            confirmMsg = `تنبيه: هذا المقال تم نشره في ووردبريس (Post ID: ${article.wordpress_post_id}).\n\n` +
                         `هل تريد حذف المقال من قاعدة البيانات المحلية؟`;
          }

          if (confirm(confirmMsg)) {
            if (isPublished) {
              deleteFromWP = confirm(`هل ترغب أيضاً في حذف وتدمير المقال من موقع ووردبريس (WordPress) الفعلي؟\n\nاضغط "موافق" للحذف من ووردبريس والمحلي معاً، أو "إلغاء" للحذف من الأرشيف المحلي فقط.`);
            }

            try {
              const res = await fetch(`/api/articles/${id}?deleteFromWP=${deleteFromWP}`, {
                method: 'DELETE'
              });
              const result = await res.json();
              if (result.success) {
                showToast(result.message || 'تم حذف المقال بنجاح!', 'success');
                loadArticlesTable(); // Refresh table
                loadStats(); // Update counters
              } else {
                showToast(result.error || 'فشل حذف المقال', 'error');
              }
            } catch (err) {
              showToast(`عطل بروتوكول الشبكة: ${err.message}`, 'error');
            }
          }
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

  // Date filter listeners
  if (DOM.filterDateFrom) {
    DOM.filterDateFrom.addEventListener('change', () => {
      state.pagination.page = 1;
      loadArticlesTable();
    });
  }
  if (DOM.filterDateTo) {
    DOM.filterDateTo.addEventListener('change', () => {
      state.pagination.page = 1;
      loadArticlesTable();
    });
  }

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

  // =========================================================================
  // 7b. ARTICLE MANAGEMENT — Clean / Delete actions
  // =========================================================================
  let pendingDeleteAction = null;

  function openConfirmModal(title, message, action) {
    pendingDeleteAction = action;
    DOM.confirmDeleteTitle.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> ${title}`;
    DOM.confirmDeleteMessage.textContent = message;
    DOM.confirmDeleteInput.value = '';
    DOM.btnConfirmDeleteExecute.disabled = true;
    DOM.modalConfirmDelete.classList.add('active');
    DOM.confirmDeleteInput.focus();
  }

  if (DOM.confirmDeleteInput) {
    DOM.confirmDeleteInput.addEventListener('input', () => {
      const val = DOM.confirmDeleteInput.value.trim();
      DOM.btnConfirmDeleteExecute.disabled = (val !== 'حذف');
    });
  }

  if (DOM.btnConfirmDeleteExecute) {
    DOM.btnConfirmDeleteExecute.addEventListener('click', async () => {
      if (!pendingDeleteAction) return;
      DOM.btnConfirmDeleteExecute.disabled = true;
      DOM.btnConfirmDeleteExecute.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري الحذف...';
      try {
        await pendingDeleteAction();
        DOM.modalConfirmDelete.classList.remove('active');
        state.pagination.page = 1;
        loadArticlesTable();
        loadDashboardStats();
      } catch (err) {
        showToast(`خطأ: ${err.message}`, 'error');
      } finally {
        DOM.btnConfirmDeleteExecute.innerHTML = '<i class="fa-solid fa-trash"></i> تنفيذ الحذف';
        pendingDeleteAction = null;
      }
    });
  }

  // Clean ALL articles
  if (DOM.btnCleanAllArticles) {
    DOM.btnCleanAllArticles.addEventListener('click', () => {
      const total = state.pagination.total || 0;
      openConfirmModal(
        'حذف جميع المقالات',
        `سيتم حذف ${total.toLocaleString('ar-EG')} مقال من قاعدة البيانات بشكل نهائي. لا يمكن التراجع عن هذا الإجراء.`,
        async () => {
          const res = await fetch('/api/articles/clean', { method: 'DELETE' });
          const result = await res.json();
          if (!result.success) throw new Error(result.error);
          showToast(result.message, 'success');
        }
      );
    });
  }

  // Delete by source
  if (DOM.btnDeleteBySource) {
    DOM.btnDeleteBySource.addEventListener('click', () => {
      const source = DOM.filterArticleSource.value;
      if (!source) {
        showToast('اختر مصدراً من القائمة المنسدلة أولاً ثم اضغط حذف حسب المصدر.', 'warning');
        return;
      }
      openConfirmModal(
        `حذف مقالات: ${source}`,
        `سيتم حذف جميع المقالات من المصدر "${source}" بشكل نهائي.`,
        async () => {
          const res = await fetch('/api/articles/by-source', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ sourceName: source })
          });
          const result = await res.json();
          if (!result.success) throw new Error(result.error);
          showToast(result.message, 'success');
        }
      );
    });
  }

  // Delete by date range
  if (DOM.btnDeleteByDate) {
    DOM.btnDeleteByDate.addEventListener('click', () => {
      let dateFrom = DOM.filterDateFrom ? DOM.filterDateFrom.value : '';
      let dateTo = DOM.filterDateTo ? DOM.filterDateTo.value : '';
      
      // If neither date is set, show warning
      if (!dateFrom && !dateTo) {
        showToast('حدد نطاق التاريخ (من - إلى) أولاً ثم اضغط حذف حسب التاريخ.', 'warning');
        return;
      }
      
      // Auto-fill missing date: if only "from" is set, use today as "to"
      if (dateFrom && !dateTo) {
        dateTo = new Date().toISOString().split('T')[0];
      }
      // If only "to" is set, use a very early date as "from"
      if (!dateFrom && dateTo) {
        dateFrom = '2020-01-01';
      }

      openConfirmModal(
        'حذف مقالات حسب التاريخ',
        `سيتم حذف جميع المقالات من ${dateFrom} إلى ${dateTo} بشكل نهائي.`,
        async () => {
          const res = await fetch('/api/articles/by-date', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ startDate: `${dateFrom}T00:00:00Z`, endDate: `${dateTo}T23:59:59Z` })
          });
          const result = await res.json();
          if (!result.success) throw new Error(result.error);
          showToast(result.message, 'success');
          loadArticlesTable();
        }
      );
    });
  }

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
    const params = new URLSearchParams();
    
    if (DOM.selectTerminalSource && DOM.selectTerminalSource.value !== '') {
      params.append('sourceIndex', DOM.selectTerminalSource.value);
    }
    
    const dateInput = document.getElementById('inp-terminal-date');
    if (dateInput && dateInput.value) {
      params.append('sinceDate', dateInput.value);
    }
    
    const queryString = params.toString();
    if (queryString) {
      url += '?' + queryString;
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

  // Handle Auto-Detect button click
  if (DOM.btnAutoDetect) {
    DOM.btnAutoDetect.addEventListener('click', async () => {
      const url = DOM.inpSrcUrl.value.trim();
      if (!url) {
        showToast('يرجى إدخال رابط الموقع أولاً للتمكن من فحسه وكشف الإعدادات تلقائياً.', 'warning');
        return;
      }

      // Show spinner state on the button
      const originalHtml = DOM.btnAutoDetect.innerHTML;
      DOM.btnAutoDetect.disabled = true;
      DOM.btnAutoDetect.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري الكشف...';

      try {
        const res = await fetch('/api/sources/auto-detect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url })
        });
        const result = await res.json();

        if (result.success && result.isN8n) {
          showToast('تم الإرسال للذكاء الاصطناعي للاستكشاف في الخلفية. سيتحدث تلقائياً لاحقاً. يمكنك الحفظ الآن.', 'success');
        } else if (result.success && result.result && result.result.success) {
          const detected = result.result;
          // Build a detailed toast message based on validation
          const vr = detected.validationResult;
          const strategyNames = { wp_api: 'WordPress API', rss: 'RSS Feed', html: 'HTML Crawl', sitemap: 'Sitemap' };
          let toastMsg = `✓ تم الكشف: ${strategyNames[detected.strategy] || detected.strategy}`;
          
          if (vr && vr.articlesFound > 0) {
            toastMsg += ` — تم التحقق بنجاح (${vr.articlesFound} مقال مطابق)`;
            showToast(toastMsg, 'success');
          } else if (vr && vr.note) {
            toastMsg += ` — ⚠️ ${vr.note}`;
            showToast(toastMsg, 'warning');
          } else if (detected.strategy === 'wp_api' || detected.strategy === 'rss') {
            showToast(toastMsg + ' — تم التحقق بنجاح', 'success');
          } else {
            showToast(toastMsg, 'info');
          }
          
          // Populate fields
          if (detected.name) DOM.inpSrcName.value = detected.name;
          if (detected.rssUrl) DOM.inpSrcRss.value = detected.rssUrl;
          else DOM.inpSrcRss.value = '';
          
          if (detected.strategy) DOM.inpSrcStrategy.value = detected.strategy;
          if (detected.encoding) DOM.inpSrcEncoding.value = detected.encoding;
          
          if (detected.selectors) {
            const list = detected.selectors.list || {};
            const art = detected.selectors.article || {};
            DOM.inpSelListContainer.value = list.container || '';
            DOM.inpSelListTitle.value = list.title || '';
            DOM.inpSelArtContent.value = art.content || '';
            DOM.inpSelArtDate.value = art.date || '';
          }
        } else {
          showToast(`فشل الكشف التلقائي: ${result.result?.error || 'عطل مجهول'}`, 'error');
        }
      } catch (err) {
        showToast(`عطل في الاتصال بخادم الكشف: ${err.message}`, 'error');
      } finally {
        DOM.btnAutoDetect.disabled = false;
        DOM.btnAutoDetect.innerHTML = originalHtml;
      }
    });
  }

  // =========================================================================
  // 10. TEST ALL SOURCES
  // =========================================================================

  let testAllRunning = false;

  if (DOM.btnTestAllSources) {
    DOM.btnTestAllSources.addEventListener('click', () => {
      DOM.modalTestAll.classList.add('active');
      // Reset UI
      DOM.testAllResultsList.innerHTML = '';
      DOM.testAllSummaryBar.classList.add('d-none');
      DOM.testAllProgress.classList.add('d-none');
      DOM.btnStartTestAll.disabled = false;
      DOM.btnStartTestAll.innerHTML = '<i class="fa-solid fa-play"></i> بدء الفحص الشامل';
    });
  }

  const btnRetestAllSources = document.getElementById('btn-retest-all-sources');
  if (btnRetestAllSources) {
    btnRetestAllSources.addEventListener('click', async () => {
      const skipAiConfirm = confirm('هل تريد تخطي استخدام الذكاء الاصطناعي (n8n) كملاذ أخير للاستكشاف؟\nاضغط "موافق" للتخطي، أو "إلغاء" لاستخدام الذكاء الاصطناعي.');
      const skipAi = skipAiConfirm;
      
      const originalText = btnRetestAllSources.innerHTML;
      btnRetestAllSources.disabled = true;
      let successCount = 0;
      let failCount = 0;
      let asyncCount = 0;
      
      for (let i = 0; i < state.config.sources.length; i++) {
        const source = state.config.sources[i];
        if (!source.enabled) continue;
        
        btnRetestAllSources.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> جاري فحص ${i + 1}/${state.config.sources.length}...`;
        
        try {
          const response = await fetch('/api/sources/auto-detect', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url: source.url, skipAi: skipAi })
          });
          const result = await response.json();
          
          if (result.success && result.isN8n) {
            asyncCount++;
            // N8n runs in background, give it a small delay so we don't spam too fast
            await new Promise(r => setTimeout(r, 1000));
          } else if (result.success && result.result && result.result.success) {
            const detected = result.result;
            const updates = { strategy: detected.strategy, selectors: detected.selectors };
            if (detected.rssUrl) updates.rssUrl = detected.rssUrl;
            if (detected.sitemapUrl) updates.sitemapUrl = detected.sitemapUrl;
            
            const updateRes = await fetch(`/api/sources/${i}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(updates)
            });
            const updateResult = await updateRes.json();
            if (updateResult.success) {
              state.config.sources[i] = { ...state.config.sources[i], ...updates };
              successCount++;
            }
          } else {
            failCount++;
          }
        } catch (err) {
          failCount++;
        }
      }
      
      btnRetestAllSources.disabled = false;
      btnRetestAllSources.innerHTML = originalText;
      let msg = `اكتمل الفحص الشامل. نجاح: ${successCount}, فشل: ${failCount}.`;
      if (asyncCount > 0) msg += ` تم إرسال ${asyncCount} مصدر للذكاء الاصطناعي في الخلفية.`;
      showToast(msg, 'success');
      loadSourcesTable();
    });
  }

  // Bulk AI Toggles
  const btnBulkAiEnable = document.getElementById('btn-bulk-ai-enable');
  const btnBulkAiDisable = document.getElementById('btn-bulk-ai-disable');
  
  async function toggleBulkAi(allow) {
    try {
      const response = await fetch('/api/sources/bulk-ai-toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ allowAiFallback: allow })
      });
      const result = await response.json();
      if (result.success) {
        showToast(result.message, 'success');
        // Update local state
        if (state.config && state.config.sources) {
          state.config.sources.forEach(s => s.allowAiFallback = allow);
        }
        // Close dropdown
        if (btnBulkAiEnable && btnBulkAiEnable.parentElement) {
          btnBulkAiEnable.parentElement.classList.add('d-none');
        }
      } else {
        showToast('حدث خطأ: ' + result.error, 'error');
      }
    } catch (err) {
      showToast('عطل في الاتصال بالخادم.', 'error');
    }
  }

  if (btnBulkAiEnable) {
    btnBulkAiEnable.addEventListener('click', () => toggleBulkAi(true));
  }
  if (btnBulkAiDisable) {
    btnBulkAiDisable.addEventListener('click', () => toggleBulkAi(false));
  }

  if (DOM.btnStartTestAll) {
    DOM.btnStartTestAll.addEventListener('click', async () => {
      if (testAllRunning) return;
      testAllRunning = true;

      const sources = state.config.sources || [];
      if (sources.length === 0) {
        showToast('لا توجد مصادر لفحصها.', 'warning');
        testAllRunning = false;
        return;
      }

      // Setup UI
      DOM.btnStartTestAll.disabled = true;
      DOM.btnStartTestAll.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري الفحص...';
      DOM.testAllSummaryBar.classList.remove('d-none');
      DOM.testAllProgress.classList.remove('d-none');
      DOM.testAllResultsList.innerHTML = '';

      let countSuccess = 0, countWarn = 0, countFail = 0, countPending = sources.length;

      const updateSummary = () => {
        DOM.taCountSuccess.textContent = countSuccess;
        DOM.taCountWarn.textContent = countWarn;
        DOM.taCountFail.textContent = countFail;
        DOM.taCountPending.textContent = countPending;
        const done = sources.length - countPending;
        DOM.testAllProgressFill.style.width = `${Math.round((done / sources.length) * 100)}%`;
      };

      updateSummary();

      // Build placeholder rows
      const rowEls = sources.map((src, idx) => {
        const row = document.createElement('div');
        row.id = `ta-row-${idx}`;
        row.className = 'ta-row ta-pending';
        row.innerHTML = `
          <span class="ta-status-icon"><i class="fa-solid fa-hourglass-half"></i></span>
          <span class="ta-name font-tajawal">${escapeHtml(src.name)}</span>
          <span class="ta-strategy-badge">${src.strategy}</span>
          <span class="ta-result-text text-muted">معلّق...</span>
        `;
        DOM.testAllResultsList.appendChild(row);
        return row;
      });

      // Run tests sequentially
      for (let idx = 0; idx < sources.length; idx++) {
        const row = rowEls[idx];
        row.className = 'ta-row ta-running';
        row.querySelector('.ta-status-icon').innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';
        row.querySelector('.ta-result-text').textContent = 'جاري الفحص...';
        row.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

        try {
          const res = await fetch(`/api/sources/${idx}/test`, { method: 'POST' });
          const result = await res.json();

          if (!res.ok || !result.success) {
            // Hard failure
            countFail++;
            countPending--;
            row.className = 'ta-row ta-fail';
            row.querySelector('.ta-status-icon').innerHTML = '<i class="fa-solid fa-circle-xmark text-danger"></i>';
            row.querySelector('.ta-result-text').innerHTML = `<span class="text-danger">${escapeHtml(result.error || 'فشل الجلب')}</span>`;
            // Update state
            if (state.config.sources[idx]) {
              state.config.sources[idx].lastTestStatus = 'failed';
              state.config.sources[idx].consecutiveFailures = result.consecutiveFailures || 0;
            }
          } else if (!result.hasArticles || result.articlesCount === 0) {
            // Connected but empty — warning
            countWarn++;
            countPending--;
            row.className = 'ta-row ta-warn';
            row.querySelector('.ta-status-icon').innerHTML = '<i class="fa-solid fa-triangle-exclamation text-warning"></i>';
            row.querySelector('.ta-result-text').innerHTML = `<span class="text-warning">مصدر متصل، صفر مقالات — تحقق من المحددات</span>`;
            if (state.config.sources[idx]) {
              state.config.sources[idx].lastTestStatus = 'success';
              state.config.sources[idx].consecutiveFailures = 0;
            }
          } else {
            // Full success
            countSuccess++;
            countPending--;
            row.className = 'ta-row ta-success';
            row.querySelector('.ta-status-icon').innerHTML = '<i class="fa-solid fa-circle-check text-success"></i>';
            row.querySelector('.ta-result-text').innerHTML = `<span class="text-success">${result.articlesCount} مقال تم جلبه بنجاح</span>`;
            if (state.config.sources[idx]) {
              state.config.sources[idx].lastTestStatus = 'success';
              state.config.sources[idx].consecutiveFailures = 0;
            }
          }
        } catch (err) {
          countFail++;
          countPending--;
          row.className = 'ta-row ta-fail';
          row.querySelector('.ta-status-icon').innerHTML = '<i class="fa-solid fa-circle-xmark text-danger"></i>';
          row.querySelector('.ta-result-text').innerHTML = `<span class="text-danger">عطل: ${escapeHtml(err.message)}</span>`;
        }

        updateSummary();
        // Small inter-request delay to avoid hammering sources
        await new Promise(r => setTimeout(r, 600));
      }

      // Done
      testAllRunning = false;
      DOM.btnStartTestAll.disabled = false;
      DOM.btnStartTestAll.innerHTML = '<i class="fa-solid fa-rotate-right"></i> إعادة الفحص';
      loadSourcesTable(); // Refresh the table with updated statuses
    });
  }

  // =========================================================================
  // 11. BULK IMPORT
  // =========================================================================

  // Bulk import state
  let bulkParsedUrls = []; // { url, isDuplicate }
  const bulkDetectionState = {}; // url -> { name, strategy, rssUrl, selectors, status }

  // Open Bulk Import modal
  if (DOM.btnBulkImportModal) {
    DOM.btnBulkImportModal.addEventListener('click', () => {
      // Reset
      DOM.bulkUrlsTextarea.value = '';
      DOM.bulkUrlParseCount.textContent = '';
      DOM.bulkStepPaste.classList.remove('d-none');
      DOM.bulkStepPreview.classList.add('d-none');
      DOM.btnBulkImportExecute.classList.add('d-none');
      DOM.bulkPreviewTbody.innerHTML = '';
      bulkParsedUrls = [];
      Object.keys(bulkDetectionState).forEach(k => delete bulkDetectionState[k]);
      DOM.modalBulkImport.classList.add('active');
    });
  }

  // Parse and clean URLs from raw textarea input
  function parseBulkUrls(rawText) {
    // Split on whitespace, commas, semicolons, newlines
    const tokens = rawText.split(/[\s,;|]+/).map(t => t.trim()).filter(Boolean);
    const urlRegex = /^(https?:\/\/)?([\w-]+\.)+[\w-]+(\/[^\s]*)?$/i;
    const seen = new Set();
    const existingUrls = new Set((state.config.sources || []).map(s => normalizeUrl(s.url)));
    const result = [];
    for (const token of tokens) {
      // Basic URL heuristic
      if (!urlRegex.test(token)) continue;
      let url = token;
      if (!url.startsWith('http://') && !url.startsWith('https://')) url = 'https://' + url;
      // Remove trailing slash for dedup
      const normalized = normalizeUrl(url);
      if (seen.has(normalized)) continue;
      seen.add(normalized);
      result.push({ url, isDuplicate: existingUrls.has(normalized) });
    }
    return result;
  }

  function normalizeUrl(url) {
    try {
      const u = new URL(url.startsWith('http') ? url : 'https://' + url);
      return u.hostname.replace(/^www\./, '') + u.pathname.replace(/\/$/, '');
    } catch { return url.toLowerCase().replace(/^www\./, '').replace(/\/$/, ''); }
  }

  const strategyBadgeMap = {
    wp_api: '<span class="badge badge-success"><i class="fa-solid fa-code"></i> WP API</span>',
    rss: '<span class="badge badge-purple"><i class="fa-solid fa-rss"></i> RSS</span>',
    html: '<span class="badge badge-warning"><i class="fa-solid fa-spider"></i> HTML</span>',
    detecting: '<span class="badge badge-info"><i class="fa-solid fa-spinner fa-spin"></i> كشف...</span>',
    failed: '<span class="badge badge-danger"><i class="fa-solid fa-xmark"></i> فشل</span>',
    unknown: '<span class="badge" style="background:rgba(148,163,184,.2);color:#94a3b8;">غير معروف</span>'
  };

  function renderBulkRow(entry, rowIndex) {
    const detection = bulkDetectionState[entry.url] || {};
    const strategyKey = detection.status === 'detecting' ? 'detecting' : detection.status === 'failed' ? 'failed' : detection.strategy || 'unknown';
    const duplicateWarning = entry.isDuplicate ? '<span class="badge-fail-count minor" title="يوجد مسبقاً في قائمة المصادر">تكرار</span>' : '';
    return `
      <tr id="bulk-row-${rowIndex}" ${entry.isDuplicate ? 'class="source-row-broken"' : ''}>
        <td><input type="checkbox" class="bulk-row-check" data-index="${rowIndex}" ${entry.isDuplicate ? '' : 'checked'}></td>
        <td style="font-size:12px;word-break:break-all;" dir="ltr">${escapeHtml(entry.url)} ${duplicateWarning}</td>
        <td class="bulk-name-cell" style="font-size:12px;">${escapeHtml(detection.name || '—')}</td>
        <td class="bulk-strategy-cell">${strategyBadgeMap[strategyKey] || strategyBadgeMap.unknown}</td>
        <td class="bulk-status-cell" style="font-size:11px;">${detection.status === 'done' ? '<span class="text-success">✔ جاهز</span>' : detection.status === 'failed' ? '<span class="text-danger">✘ فشل</span>' : detection.status === 'detecting' ? '<span class="text-muted">...</span>' : '<span class="text-muted">لم يُفحص</span>'}</td>
        <td><button class="btn btn-outline-purple btn-sm bulk-detect-one" data-index="${rowIndex}" title="كشف استراتيجية هذا الموقع" ${detection.status === 'detecting' ? 'disabled' : ''}><i class="fa-solid fa-magnifying-glass"></i></button></td>
      </tr>
    `;
  }

  function refreshBulkTable() {
    DOM.bulkPreviewTbody.innerHTML = bulkParsedUrls.map((e, i) => renderBulkRow(e, i)).join('');
    // Bind detect-one buttons
    DOM.bulkPreviewTbody.querySelectorAll('.bulk-detect-one').forEach(btn => {
      btn.addEventListener('click', () => detectOneUrl(parseInt(btn.getAttribute('data-index'))));
    });
    // Bind checkboxes for "check all"
    DOM.bulkCheckAll.onchange = () => {
      DOM.bulkPreviewTbody.querySelectorAll('.bulk-row-check').forEach(cb => { cb.checked = DOM.bulkCheckAll.checked; });
    };
  }

  async function detectOneUrl(rowIndex) {
    const entry = bulkParsedUrls[rowIndex];
    if (!entry) return;
    bulkDetectionState[entry.url] = { status: 'detecting' };
    refreshBulkTable();
    try {
      const res = await fetch('/api/sources/auto-detect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: entry.url })
      });
      const result = await res.json();
      if (result.success) {
        bulkDetectionState[entry.url] = {
          status: 'done',
          name: result.name,
          strategy: result.strategy,
          rssUrl: result.rssUrl,
          selectors: result.selectors,
          encoding: result.encoding || 'utf-8'
        };
      } else {
        bulkDetectionState[entry.url] = { status: 'failed' };
      }
    } catch (e) {
      bulkDetectionState[entry.url] = { status: 'failed' };
    }
    refreshBulkTable();
  }

  // Parse button
  if (DOM.btnBulkParse) {
    DOM.btnBulkParse.addEventListener('click', () => {
      const raw = DOM.bulkUrlsTextarea.value;
      bulkParsedUrls = parseBulkUrls(raw);
      if (bulkParsedUrls.length === 0) {
        showToast('لم يتم العثور على روابط صالحة في النص المُدخل.', 'warning');
        return;
      }
      const dupeCount = bulkParsedUrls.filter(e => e.isDuplicate).length;
      const newCount = bulkParsedUrls.length - dupeCount;
      DOM.bulkPreviewLabel.textContent = `${bulkParsedUrls.length} رابط مُكتشف — ${newCount} جديد، ${dupeCount} تكرار`;
      DOM.bulkStepPaste.classList.add('d-none');
      DOM.bulkStepPreview.classList.remove('d-none');
      DOM.btnBulkImportExecute.classList.remove('d-none');
      refreshBulkTable();
    });
  }

  // Back button
  if (DOM.btnBulkBack) {
    DOM.btnBulkBack.addEventListener('click', () => {
      DOM.bulkStepPaste.classList.remove('d-none');
      DOM.bulkStepPreview.classList.add('d-none');
      DOM.btnBulkImportExecute.classList.add('d-none');
    });
  }

  // Detect all button
  if (DOM.btnBulkDetectAll) {
    DOM.btnBulkDetectAll.addEventListener('click', async () => {
      DOM.btnBulkDetectAll.disabled = true;
      DOM.btnBulkDetectAll.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري الكشف...';
      for (let i = 0; i < bulkParsedUrls.length; i++) {
        const entry = bulkParsedUrls[i];
        if (bulkDetectionState[entry.url]?.status === 'done') continue; // Skip already detected
        await detectOneUrl(i);
        await new Promise(r => setTimeout(r, 300)); // Small delay
      }
      DOM.btnBulkDetectAll.disabled = false;
      DOM.btnBulkDetectAll.innerHTML = '<i class="fa-solid fa-magnifying-glass-chart"></i> كشف الاستراتيجية للكل';
      showToast('اكتمل كشف الاستراتيجيات لجميع المواقع.', 'success');
    });
  }

  // Import execute button
  if (DOM.btnBulkImportExecute) {
    DOM.btnBulkImportExecute.addEventListener('click', async () => {
      const checkedBoxes = DOM.bulkPreviewTbody.querySelectorAll('.bulk-row-check:checked');
      const selectedIndices = Array.from(checkedBoxes).map(cb => parseInt(cb.getAttribute('data-index')));
      if (selectedIndices.length === 0) {
        showToast('لم يتم تحديد أي مواقع للاستيراد.', 'warning');
        return;
      }

      let importedCount = 0;
      let failedCount = 0;

      for (const idx of selectedIndices) {
        const entry = bulkParsedUrls[idx];
        if (entry.isDuplicate) continue; // Skip duplicates silently

        const detection = bulkDetectionState[entry.url];
        const newSource = {
          name: detection?.name || new URL(entry.url.startsWith('http') ? entry.url : 'https://' + entry.url).hostname.replace('www.', ''),
          url: entry.url,
          rssUrl: detection?.rssUrl || null,
          strategy: detection?.strategy || 'html',
          enabled: true,
          encoding: detection?.encoding || 'utf-8',
          selectors: detection?.selectors || {
            list: { container: 'article', title: 'h2 a', link: 'a' },
            article: { title: 'h1', content: '.content', date: 'time' }
          }
        };

        try {
          const res = await fetch('/api/sources', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newSource)
          });
          const result = await res.json();
          if (result.success) {
            importedCount++;
          } else {
            failedCount++;
          }
        } catch (e) {
          failedCount++;
        }
      }

      if (importedCount > 0) {
        showToast(`تم استيراد ${importedCount} موقع بنجاح${failedCount > 0 ? ` (${failedCount} فشل)` : ''}.`, importedCount > 0 ? 'success' : 'error');
        DOM.modalBulkImport.classList.remove('active');
        await loadGlobalConfig();
        loadSourcesTable();
        loadStats();
      } else {
        showToast(failedCount > 0 ? `فشل استيراد جميع المواقع المحددة.` : 'لا يوجد مواقع جديدة للاستيراد (جميعها موجودة مسبقاً).', 'warning');
      }
    });
  }

  // =========================================================================
  // 12. INITIALIZATION
  // =========================================================================
  loadGlobalConfig();
  loadStats();
});
