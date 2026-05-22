// The Ultimate GitNexus Playbook Hub - Interactive Application Layer


let appInitialized = false;

function initializeApp() {
  if (appInitialized) return;
  appInitialized = true;

  initNavigation();
  initSchemaExplorer();
  initTimeline();
  initCLIBuilder();
  initCheatSheet();
  initGlobalSearch();
  initIDESetup();
  initAgentSkills();
  initPromptSynthesizer();
}


// ================= 1. NAVIGATION CONTROL =================
function initNavigation() {
  const navItems = document.querySelectorAll('.sidebar-nav .nav-item');
  const sections = document.querySelectorAll('.playbook-section');

  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      if (e && e.preventDefault) e.preventDefault();
      const targetSection = item.getAttribute('data-section');
      
      // Update sidebar nav states
      navItems.forEach(nav => nav.classList.remove('active'));
      item.classList.add('active');

      // Update visibility of content sections
      sections.forEach(sec => sec.classList.remove('active'));
      const activeSection = document.getElementById(`${targetSection}-section`);
      if (activeSection) {
        activeSection.classList.add('active');
      }
      
      // Dynamic title bar sync
      const mainTitle = document.getElementById('main-title');
      const mainSubtitle = document.getElementById('main-subtitle');
      if (mainTitle && mainSubtitle) {
        if (targetSection === 'overview') {
          mainTitle.innerText = "Architecture & Schema";
          mainSubtitle.innerText = "Graph-Based Code Intelligence Philosophy";
        } else if (targetSection === 'lifecycle') {
          mainTitle.innerText = "Developer Lifecycle Loops";
          mainSubtitle.innerText = "Chronological Step-by-Step Execution Sequence";
        } else if (targetSection === 'cli') {
          mainTitle.innerText = "CLI Command Console";
          mainSubtitle.innerText = "Interactive Command Builder and Index Synthesizer";
        } else if (targetSection === 'ide-setup') {
          mainTitle.innerText = "IDE Setup & Guides";
          mainSubtitle.innerText = "Configure Cursor, Claude Code, and Windsurf IDEs with GitNexus automation";
        } else if (targetSection === 'skills') {
          mainTitle.innerText = "Agent Skills Hub";
          mainSubtitle.innerText = "Understand how autonomous developer agents utilize GitNexus intelligence";
        } else if (targetSection === 'cheatsheet') {
          mainTitle.innerText = "Command Reference Hub";
          mainSubtitle.innerText = "Instant Cheat Sheet & Tasks Lookup Matrix";
        }
      }
    });
  });

  // Handle Hash Route
  function handleHash() {
    let hash = window.location.hash || '';
    if (hash.startsWith('#')) {
      hash = hash.slice(1);
    }
    let targetItem = null;
    if (hash) {
      targetItem = document.querySelector(`.sidebar-nav .nav-item[data-section="${hash}"]`);
    }
    if (!targetItem) {
      targetItem = document.querySelector('.sidebar-nav .nav-item[data-section="overview"]');
    }
    if (targetItem) {
      if (typeof targetItem.click === 'function') {
        targetItem.click();
      } else {
        try {
          targetItem.dispatchEvent(new Event('click'));
        } catch (err) {
          targetItem.dispatchEvent('click');
        }
      }
    }
  }

  // Run on init
  handleHash();

  // Listen to hashchange
  window.addEventListener('hashchange', handleHash);
}

// ================= 2. GRAPH SCHEMA EXPLORER =================
const SCHEMA_DATA = {
  // Nodes
  File: {
    type: 'node',
    description: "Represents a physical source code file in the local workspace directory structure (e.g. <code>src/auth/session.ts</code>). It acts as the fundamental boundary container for scoped declarations, compilation exports, and dynamic imports mappings.",
    properties: [
      { name: 'path', type: 'STRING', desc: 'Relative path of the file from workspace root.' },
      { name: 'size', type: 'INT64', desc: 'Size of the physical file in bytes.' },
      { name: 'language', type: 'STRING', desc: 'Detected programming language (e.g. TypeScript, Python).' },
      { name: 'lastModified', type: 'TIMESTAMP', desc: 'Timestamp of the last filesystem write event.' }
    ]
  },
  Function: {
    type: 'node',
    description: "Represents a named block of reusable, executable logic defined at the file scope level (not scoped within an object-oriented Class definition). Commonly identified during AST parsing of standalone exports.",
    properties: [
      { name: 'name', type: 'STRING', desc: 'Exact declared identifier of the function.' },
      { name: 'filePath', type: 'STRING', desc: 'Path of the containing physical File node.' },
      { name: 'startLine', type: 'INT64', desc: '1-indexed starting line number of the declaration.' },
      { name: 'endLine', type: 'INT64', desc: '1-indexed ending line number of the definition block.' }
    ]
  },
  Class: {
    type: 'node',
    description: "Represents a standard Object-Oriented structural definition container, encapsulating variables, properties, methods, constructor logic, and interfaces mappings.",
    properties: [
      { name: 'name', type: 'STRING', desc: 'Identifier of the class declaration.' },
      { name: 'filePath', type: 'STRING', desc: 'File path where the class is defined.' },
      { name: 'isAbstract', type: 'BOOL', desc: 'Flag indicating if this represents an abstract class.' }
    ]
  },
  Interface: {
    type: 'node',
    description: "Represents a compilation type contract or structural signature block. Used extensively in TypeScript/Java indexes to map abstract capability structures.",
    properties: [
      { name: 'name', type: 'STRING', desc: 'Name of the structural interface.' },
      { name: 'filePath', type: 'STRING', desc: 'File path of the declaration.' }
    ]
  },
  Method: {
    type: 'node',
    description: "Represents a scoped function declaration nested inside a Class or Interface block. Vital for tracing object-oriented class interactions and inheritance call graphs.",
    properties: [
      { name: 'name', type: 'STRING', desc: 'Identifier (e.g. ClassName.methodName).' },
      { name: 'isPrivate', type: 'BOOL', desc: 'Access control modifier flag.' },
      { name: 'startLine', type: 'INT64', desc: 'Line index inside physical file.' }
    ]
  },
  Community: {
    type: 'node',
    description: "A logical grouping of highly cohesive codebase components detected dynamically by partition algorithms (e.g. Louvain clustering). Measures relative coupling densities across modules.",
    properties: [
      { name: 'id', type: 'STRING', desc: 'Unique generated community identifier.' },
      { name: 'modularityScore', type: 'DOUBLE', desc: 'Computed cohesion index of internal edges.' },
      { name: 'fileCount', type: 'INT64', desc: 'Total workspace files encapsulated within this module.' }
    ]
  },
  Process: {
    type: 'node',
    description: "Represents a chronological sequence of code operations tracing a complete execution workflow (e.g. user checkout flow, api login request sequence). Essential for tracing end-to-end control logic.",
    properties: [
      { name: 'id', type: 'STRING', desc: 'Unique system workflow ID (e.g. proc_auth_login).' },
      { name: 'summary', type: 'STRING', desc: 'Natural language capability outline.' },
      { name: 'timingEstimate', type: 'DOUBLE', desc: 'Averaged step execution latency in ms.' }
    ]
  },
  // Edges
  CALLS: {
    type: 'edge',
    description: "A directed call-graph edge mapping invocation dependencies from one executable symbol node (caller) to another (callee). Formed via AST call expression analysis.",
    properties: [
      { name: 'isAsync', type: 'BOOL', desc: 'Flags if the call involves asynchronous Promise patterns.' },
      { name: 'confidence', type: 'DOUBLE', desc: 'Accuracy index (1.0 for compiled symbols, <0.8 for heuristics).' }
    ]
  },
  IMPORTS: {
    type: 'edge',
    description: "A physical compilation reference linking one File container to another. Formed when a module declares explicit dependency requirements (e.g. import, require, import-from).",
    properties: [
      { name: 'isDynamic', type: 'BOOL', desc: 'Flags if the import is resolved dynamically at runtime.' }
    ]
  },
  EXTENDS: {
    type: 'edge',
    description: "Represents Object-Oriented structural inheritance pathways. Connects a subclass to its parent superclass.",
    properties: [
      { name: 'depth', type: 'INT64', desc: 'Inheritance separation level.' }
    ]
  },
  IMPLEMENTS: {
    type: 'edge',
    description: "Connects a Class node definition to the Type Interface contract it is designed to satisfy.",
    properties: []
  },
  DEFINES: {
    type: 'edge',
    description: "A structural grouping edge linking parent File containers to the internal symbols they declare.",
    properties: []
  },
  MEMBER_OF: {
    type: 'edge',
    description: "Links workspace File containers to their dynamically partitioned Louvain Modularity architectural Communities.",
    properties: []
  },
  STEP_IN_PROCESS: {
    type: 'edge',
    description: "Traces chronological execution sequences inside a Process flow. Links Process nodes to scoped executable Methods / Functions.",
    properties: [
      { name: 'stepIndex', type: 'INT64', desc: '1-indexed chronological step sequence in the workflow.' }
    ]
  }
};

function initSchemaExplorer() {
  const buttons = document.querySelectorAll('.schema-btn');
  const detailsPanel = document.getElementById('schema-details');
  const schemaName = document.getElementById('schema-name');
  const schemaBadge = document.getElementById('schema-badge');
  const schemaDesc = document.getElementById('schema-description');
  const schemaProps = document.getElementById('schema-properties');

  if (!buttons.length || !detailsPanel || !schemaName || !schemaBadge || !schemaDesc || !schemaProps) return;

  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      // Toggle active states
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const name = btn.getAttribute('data-name');
      const data = SCHEMA_DATA[name];
      if (!data) return;

      // Update text details
      schemaName.innerText = name;
      schemaDesc.innerHTML = data.description;

      // Update badge type
      if (data.type === 'node') {
        schemaBadge.className = 'schema-element-badge node';
        schemaBadge.innerText = 'Node';
      } else {
        schemaBadge.className = 'schema-element-badge edge';
        schemaBadge.innerText = 'Edge';
      }

      // Repopulate properties table
      schemaProps.innerHTML = '';
      if (data.properties.length === 0) {
        schemaProps.innerHTML = '<div style="color: var(--text-dim); font-size:12px;">No custom attributes registered for this element.</div>';
      } else {
        data.properties.forEach(prop => {
          const row = document.createElement('div');
          row.className = 'property-row';
          row.innerHTML = `
            <span class="property-name">${prop.name}</span>
            <span class="property-type">${prop.type} <span style="font-size:11px; color: var(--text-dim);">(${prop.desc})</span></span>
          `;
          schemaProps.appendChild(row);
        });
      }
      showToast(`Selected Schema component: ${name}`, 'secondary');
    });
  });
}

// ================= 3. DEVELOPER LIFECYCLE TIMELINE =================
function initTimeline() {
  const tabs = document.querySelectorAll('.timeline-tab');
  const cards = document.querySelectorAll('.timeline-card');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const phase = tab.getAttribute('data-phase');
      cards.forEach(card => {
        card.classList.remove('active');
        if (card.getAttribute('data-phase') === phase) {
          card.classList.add('active');
        }
      });
    });
  });
}

// Interactive checkpoint checker toggle
window.toggleCheckpoint = function(element) {
  element.classList.toggle('completed');
  const num = element.querySelector('.checkpoint-number').innerText;
  if (element.classList.contains('completed')) {
    showToast(`Checkpoint ${num} completed!`, 'primary');
  }
};

// ================= 4. CLI COMMAND BUILDER & TERMINAL SIMULATOR =================
function initCLIBuilder() {
  const selectAction = document.getElementById('cli-action');
  const flagEmbeddings = document.getElementById('flag-embeddings');
  const flagForce = document.getElementById('flag-force');
  const flagShallow = document.getElementById('flag-shallow');
  const flagQuiet = document.getElementById('flag-quiet');
  
  const lblEmbeddings = document.getElementById('lbl-embeddings');
  const lblForce = document.getElementById('lbl-force');
  const lblShallow = document.getElementById('lbl-shallow');
  const lblQuiet = document.getElementById('lbl-quiet');
  
  const inputsContainer = document.getElementById('cli-inputs-container');
  const pathArgInput = document.getElementById('cli-path-arg');
  const terminalCmd = document.getElementById('terminal-cmd');
  const btnRun = document.getElementById('btn-run-cli');
  
  const terminalOutput = document.getElementById('terminal-output-text');
  const progressBar = document.getElementById('terminal-progress');
  const progressFill = document.getElementById('terminal-progress-fill');

  if (!selectAction || !flagEmbeddings || !flagForce || !flagShallow || !flagQuiet ||
      !lblEmbeddings || !lblForce || !lblShallow || !lblQuiet ||
      !inputsContainer || !pathArgInput || !terminalCmd || !btnRun ||
      !terminalOutput || !progressBar || !progressFill) {
    return;
  }

  function updateCommandSyntax() {
    const action = selectAction.value;
    let syntax = `npx gitnexus ${action}`;

    // Show/hide relevant flags dynamically
    if (action === 'analyze') {
      lblEmbeddings.style.display = 'flex';
      lblForce.style.display = 'flex';
      lblShallow.style.display = 'flex';
      lblQuiet.style.display = 'flex';
      inputsContainer.style.display = 'none';

      if (flagEmbeddings.checked) syntax += ' --embeddings';
      if (flagForce.checked) syntax += ' --force';
      if (flagShallow.checked) syntax += ' --shallow';
      if (flagQuiet.checked) syntax += ' --quiet';
    } else if (action === 'status') {
      lblEmbeddings.style.display = 'none';
      lblForce.style.display = 'none';
      lblShallow.style.display = 'none';
      lblQuiet.style.display = 'none';
      inputsContainer.style.display = 'none';
    } else if (action === 'clean') {
      lblEmbeddings.style.display = 'none';
      lblForce.style.display = 'flex';
      lblShallow.style.display = 'none';
      lblQuiet.style.display = 'none';
      inputsContainer.style.display = 'none';

      if (flagForce.checked) syntax += ' --force';
    } else if (action === 'wiki') {
      lblEmbeddings.style.display = 'none';
      lblForce.style.display = 'none';
      lblShallow.style.display = 'none';
      lblQuiet.style.display = 'none';
      inputsContainer.style.display = 'flex';
      
      const customPath = pathArgInput.value.trim();
      if (customPath) {
        syntax += ` "${customPath}"`;
      }
    } else if (action === 'list') {
      lblEmbeddings.style.display = 'none';
      lblForce.style.display = 'none';
      lblShallow.style.display = 'none';
      lblQuiet.style.display = 'none';
      inputsContainer.style.display = 'none';
    }

    terminalCmd.innerText = syntax;
  }

  // Event bindings
  selectAction.addEventListener('change', updateCommandSyntax);
  flagEmbeddings.addEventListener('change', updateCommandSyntax);
  flagForce.addEventListener('change', updateCommandSyntax);
  flagShallow.addEventListener('change', updateCommandSyntax);
  flagQuiet.addEventListener('change', updateCommandSyntax);
  pathArgInput.addEventListener('input', updateCommandSyntax);

  // Command Runner simulation
  btnRun.addEventListener('click', () => {
    btnRun.disabled = true;
    const action = selectAction.value;
    
    terminalOutput.innerText = "Initializing shell execution pipeline...\n";
    progressBar.style.display = 'block';
    progressFill.style.width = '0%';

    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 8) + 4;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        btnRun.disabled = false;
        
        // Display terminal output on finish
        displayTerminalSuccess(action);
      }
      progressFill.style.width = `${progress}%`;
    }, 60);
  });

  function displayTerminalSuccess(action) {
    let logs = "";
    if (action === 'analyze') {
      logs = `[Info] GitNexus compiler initializing AST parser...
[Parse] Found 42 TS/JS workspace files.
[Graph] Creating KuzuDB node frames: File, Method, Class...
[Graph] Mapping call connections, parsed 182 CALLS edges.
[Vector] Generating dense semantic embeddings for 64 core symbols...
[Success] Database transaction committed successfully.
[Registry] Index marked clean. Active Commit: 7e2b10a4f
Time Elapsed: 1.48s`;
    } else if (action === 'status') {
      logs = `[Integrity Check]
Repository: wonderful-faraday
Index Path: C:\\Users\\LOQ\\Documents\\antigravity\\wonderful-faraday\\.gitnexus
KuzuDB Engine: Active & Local
Vector Store: Synchronized (64 Embeddings)
Last Analysis Hash: 7e2b10a4f
Staleness Status: CLEAN (No local commits behind HEAD)`;
    } else if (action === 'clean') {
      logs = `[Clean Mode]
[Cache] Purging KuzuDB directory frames...
[Cache] Purging vector embeddings cache...
[Registry] Cleaning global registry references...
[Success] Purged database structures. GitNexus index deleted.`;
    } else if (action === 'wiki') {
      logs = `[Wiki Generator]
[Exporter] Resolving modular community clusters...
[Render] Compiling documentation pages (4 chapters)...
[Success] Exported full GitNexus architecture guide to:
Path: C:\\Users\\LOQ\\Documents\\antigravity\\wonderful-faraday\\docs\\gitnexus_wiki.md`;
    } else if (action === 'list') {
      logs = `[Registered Registry Workspaces]
- Name: wonderful-faraday
  Path: C:\\Users\\LOQ\\Documents\\antigravity\\wonderful-faraday
  Index: Fresh
  Size: 148 Nodes, 388 Edges`;
    }

    terminalOutput.innerText = logs;
    progressBar.style.display = 'none';
    showToast("Command completed successfully!", "primary");
  }

  // Run initial sync
  updateCommandSyntax();
}

// ================= 6. FILTERABLE DEVELOPER CHEAT SHEET =================
const CHEAT_DATA = [
  {
    category: 'resource',
    task: 'List Registered Workspaces',
    desc: 'Verify if your workspace has been synchronized and query its node metrics.',
    type: 'Resource URI',
    code: 'gitnexus://repos'
  },
  {
    category: 'resource',
    task: 'Workspace Context Diagnostics',
    desc: 'Check index freshness, registry commitsBehind index offsets, and build staleness markers.',
    type: 'Resource URI',
    code: 'gitnexus://repo/{name}/context'
  },
  {
    category: 'resource',
    task: ' Louvain modular communities',
    desc: 'Analyze codebase partitioning modules automatically using graph coupling modularity.',
    type: 'Resource URI',
    code: 'gitnexus://repo/{name}/clusters'
  },
  {
    category: 'resource',
    task: 'List Execution Capabilities',
    desc: 'Retrieve every chronological capability flow path registered inside KuzuDB.',
    type: 'Resource URI',
    code: 'gitnexus://repo/{name}/processes'
  },
  {
    category: 'resource',
    task: 'Retrieve End-to-End Control Trace',
    desc: 'Inspect chronological capability process sequence steps step-by-step.',
    type: 'Resource URI',
    code: 'gitnexus://repo/{name}/process/{processId}'
  },
  {
    category: 'analysis',
    task: 'Fetch 360-degree Context',
    desc: 'Query immediate callers, callees, and parent processes membership maps for a symbol.',
    type: 'MCP Tool Input',
    code: 'gitnexus_context({ name: "symbol" })'
  },
  {
    category: 'analysis',
    task: 'Assess Upstream Blast Radius',
    desc: 'Pre-change mapping checklist. Traces all dependent callers up to depth=3 to prevent breakage.',
    type: 'MCP Tool Input',
    code: 'gitnexus_impact({ target: "x", direction: "upstream" })'
  },
  {
    category: 'analysis',
    task: 'Traces Symbol Downstream Complexity',
    desc: 'Audit dependencies, inherited parent abstractions, imports, and base files.',
    type: 'MCP Tool Input',
    code: 'gitnexus_impact({ target: "x", direction: "downstream" })'
  },
  {
    category: 'refactor',
    task: 'Coordinated Symbol Rename',
    desc: 'Execute call-graph renames. Identifies exact import bindings and structural AST matches safely.',
    type: 'MCP Tool Input',
    code: 'gitnexus_rename({ symbol_name: "x", new_name: "y", dry_run: true })'
  },
  {
    category: 'refactor',
    task: 'Apply AST Structural Rename',
    desc: 'Commit changes. Safe AST rename operation, updating compiler references dynamically.',
    type: 'MCP Tool Input',
    code: 'gitnexus_rename({ symbol_name: "x", new_name: "y", dry_run: false })'
  },
  {
    category: 'debug',
    task: 'Pre-Commit Verification Audit',
    desc: 'Validate staged changes. Analyzes code diffs and flags affected workflows prior to commit.',
    type: 'MCP Tool Input',
    code: 'gitnexus_detect_changes({ scope: "staged" })'
  },
  {
    category: 'debug',
    task: 'Audit Complete Uncommitted Scope',
    desc: 'Scan changes. Identifies all affected execution communities across unstaged edits.',
    type: 'MCP Tool Input',
    code: 'gitnexus_detect_changes({ scope: "all" })'
  },
  {
    category: 'cli',
    task: 'Synchronize KuzuDB Index',
    desc: 'Re-analyze code. Rebuilds the AST graph structural tables inside .gitnexus/.',
    type: 'CLI Shell Command',
    code: 'npx gitnexus analyze'
  },
  {
    category: 'cli',
    task: 'Re-index with Semantic Vectors',
    desc: 'Build dense semantic vector index. Required for natural concept searches.',
    type: 'CLI Shell Command',
    code: 'npx gitnexus analyze --embeddings'
  },
  {
    category: 'cli',
    task: 'Query Status & Index Hash Integrity',
    desc: 'Confirm registry commit sync, index age, and system connection health status.',
    type: 'CLI Shell Command',
    code: 'npx gitnexus status'
  },
  {
    category: 'cli',
    task: 'Purge Index Directory & Local Registry',
    desc: 'Clean workspace registry caches and purge KuzuDB database directories completely.',
    type: 'CLI Shell Command',
    code: 'npx gitnexus clean --force'
  }
];

function initCheatSheet() {
  const grid = document.getElementById('cheat-grid');
  const chips = document.querySelectorAll('.filter-chip');

  if (!grid) return;

  // Populate all cards by default
  renderCheatCards('all');

  // Modern event delegation for copy actions - avoids dangerous dynamic inline onclick handlers
  grid.addEventListener('click', (e) => {
    const codeSpan = e.target.closest('.cheat-action-code');
    if (codeSpan) {
      const codeText = codeSpan.getAttribute('data-code');
      if (codeText) {
        window.copyToClipboard(codeText);
      }
    }
  });

  chips.forEach(chip => {
    chip.addEventListener('click', () => {
      chips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');

      const category = chip.getAttribute('data-category');
      renderCheatCards(category);
    });
  });
}

function renderCheatCards(categoryFilter, searchFilter = '') {
  const grid = document.getElementById('cheat-grid');
  if (!grid) return;
  
  grid.innerHTML = '';

  const filtered = CHEAT_DATA.filter(item => {
    // Category check
    const matchesCategory = (categoryFilter === 'all' || item.category === categoryFilter);
    // Search query check
    const matchesSearch = !searchFilter || 
      item.task.toLowerCase().includes(searchFilter.toLowerCase()) ||
      item.desc.toLowerCase().includes(searchFilter.toLowerCase()) ||
      item.code.toLowerCase().includes(searchFilter.toLowerCase());

    return matchesCategory && matchesSearch;
  });

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; color: var(--text-dim); padding: 40px;">
        No cheatsheet reference cards matched your search terms.
      </div>
    `;
    return;
  }

  filtered.forEach(item => {
    const card = document.createElement('div');
    card.className = 'cheat-item';
    card.innerHTML = `
      <div class="cheat-badge-row">
        <span class="cheat-tag">${item.category.toUpperCase()}</span>
        <span class="cheat-cmd-type">${item.type}</span>
      </div>
      <div class="cheat-task">${item.task}</div>
      <p class="cheat-desc">${item.desc}</p>
      <div class="cheat-trigger-row">
        <span style="font-size:11px; color: var(--text-dim); font-family: var(--font-mono)">Syntax Command</span>
        <span class="cheat-action-code" data-code="${escapeHtml(item.code)}">${escapeHtml(item.code)}</span>
      </div>
    `;
    grid.appendChild(card);
  });
}

// ================= 7. GLOBAL CONTEXT & CONCEPT SEARCH =================
function initGlobalSearch() {
  const searchInput = document.getElementById('global-search');
  if (!searchInput) return;
  
  searchInput.addEventListener('input', (e) => {
    const query = e.target.value;
    
    // Auto-focus Cheat Sheet navigation tab if search input is focused
    const cheatTab = document.querySelector('.sidebar-nav [data-section="cheatsheet"]');
    const activeNav = document.querySelector('.sidebar-nav .nav-item.active');
    
    if (query && cheatTab && activeNav && activeNav.getAttribute('data-section') !== 'cheatsheet') {
      if (typeof cheatTab.click === 'function') {
        cheatTab.click();
      } else {
        try {
          cheatTab.dispatchEvent(new Event('click'));
        } catch (err) {
          cheatTab.dispatchEvent('click');
        }
      }
    }

    // Filter cards
    const activeChip = document.querySelector('.filter-chip.active');
    const activeCategory = activeChip ? activeChip.getAttribute('data-category') : 'all';
    renderCheatCards(activeCategory, query);
  });
}

// ================= 8. DEVELOPER IDES & SETUP GUIDES =================
const IDE_CONFIGS = {
  cursor: `{
  "version": "1.0.0",
  "rules": [
    "Always consult the GitNexus graph context before implementing edits.",
    "Run upstream impact checks prior to editing high-risk symbols."
  ]
}`,
  claude: `{
  "mcpServers": {
    "gitnexus": {
      "command": "npx",
      "args": ["-y", "gitnexus-stdio"]
    }
  }
}`,
  windsurf: `{
  "workspaceRules": [
    "Verify all AST relationships before completing coordinated renames.",
    "Perform change detection pre-commit hooks validation."
  ]
}`
};

function initIDESetup() {
  const tabs = document.querySelectorAll('.ide-tab');
  const configText = document.getElementById('ide-config-text');
  const copyBtn = document.getElementById('btn-copy-ide-config');

  if (!configText) return;

  // Pre-populate with Cursor default setting
  configText.innerText = IDE_CONFIGS.cursor;

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const ide = tab.getAttribute('data-ide');
      if (IDE_CONFIGS[ide]) {
        configText.innerText = IDE_CONFIGS[ide];
      }
    });
  });

  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      window.copyToClipboard(configText.innerText);
    });
  }
}

// ================= 9. AI AGENT SKILLS HUB =================
const SKILLS_DATA = {
  cli: {
    title: 'gitnexus-cli',
    checklist: [
      'Verify physical registry mappings inside <code>~/.gitnexus/registry.json</code>.',
      'Check index age and staleness bounds.',
      'Perform full AST analysis, refreshing the local KuzuDB representation.'
    ],
    tools: ['npx gitnexus status', 'npx gitnexus analyze']
  },
  exploring: {
    title: 'gitnexus-exploring',
    checklist: [
      'Analyze overall codebase directory layouts.',
      'Locate core architectural controllers and routers.',
      'Identify modular coupling clusters using Louvain Modularity scores.'
    ],
    tools: ['gitnexus://repo/{name}/context', 'gitnexus://repo/{name}/clusters']
  },
  impact: {
    title: 'gitnexus-impact-analysis',
    checklist: [
      'Assess upstream dependent callers prior to symbol editing.',
      'Audit transitive downstream side effects on method signatures.',
      'Flag high/critical risks to the architect before proceeding.'
    ],
    tools: ['gitnexus_impact()', 'gitnexus_context()']
  },
  refactoring: {
    title: 'gitnexus-refactoring',
    checklist: [
      'Design comprehensive coordinated multi-file AST symbol rename paths.',
      'Verify import structures and dynamic reference resolution.',
      'Execute dry-run audits before applying permanent physical updates.'
    ],
    tools: ['gitnexus_rename()', 'gitnexus_context()']
  },
  debugging: {
    title: 'gitnexus-debugging',
    checklist: [
      'Trace chronological execution sequence processes during error states.',
      'Pinpoint active symbol throw sites across asynchronous frames.',
      'Formulate robust targeted tests for failed logic communities.'
    ],
    tools: ['gitnexus_context()', 'gitnexus_detect_changes()']
  },
  guide: {
    title: 'gitnexus-guide',
    checklist: [
      'Access technical references and KuzuDB graph schemas.',
      'Retrieve step-by-step procedural execution diagrams.',
      'Verify compliant trigger workflows and entity relationship attributes.'
    ],
    tools: ['gitnexus://repo/{name}/schema', 'gitnexus://repo/{name}/processes']
  }
};

function initAgentSkills() {
  const cards = document.querySelectorAll('.skill-card');
  const title = document.getElementById('detail-skill-title');
  const checklist = document.getElementById('detail-skill-checklist');
  const tools = document.getElementById('detail-skill-tools');

  if (!cards.length || !title || !checklist || !tools) return;

  cards.forEach(card => {
    card.addEventListener('click', () => {
      // Toggle active classes
      cards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');

      const skillName = card.getAttribute('data-skill');
      const data = SKILLS_DATA[skillName];
      if (!data) return;

      // Update panel details dynamically and escape values safely
      title.innerText = escapeHtml(data.title);

      checklist.innerHTML = '';
      data.checklist.forEach(item => {
        const li = document.createElement('li');
        // Specific tags allowed for design styling, but general content escaped
        li.innerHTML = item;
        checklist.appendChild(li);
      });

      tools.innerHTML = '';
      data.tools.forEach(tool => {
        const span = document.createElement('span');
        span.className = 'tool-badge';
        span.innerText = tool; // innerText guarantees safe escape in DOM
        tools.appendChild(span);
      });
    });
  });
}

// ================= 10. DYNAMIC PROMPT SYNTHESIZER =================
function generatePrompt(goal, concept, symbol, newname, error) {
  // Gracefully handle empty string boundaries or missing arguments
  concept = concept || 'local state store';
  symbol = symbol || 'initializeState';
  newname = newname || 'setupState';
  error = error || 'GeneralError: Stack trace details missing';

  if (goal === 'explore') {
    return `Onboard and explore the architectural context of the concept: "${concept}".
Please run gitnexus_query({ query: "${concept}", repo: "wonderful-faraday" }) to find the primary related execution flows.
Afterwards, trace the clusters using the gitnexus://repo/wonderful-faraday/clusters resource to understand how this concept is isolated across modules.`;
  } else if (goal === 'impact') {
    return `Perform a comprehensive safety blast radius analysis for the symbol: "${symbol}".
Execute the impact tool gitnexus_impact({ target: "${symbol}", direction: "upstream", repo: "wonderful-faraday" }) to discover direct and indirect dependent callers.
Verify downstream transitive signatures using gitnexus_context({ name: "${symbol}", repo: "wonderful-faraday" }).
Ensure that any critical paths are flagged with a low risk score before performing edits.`;
  } else if (goal === 'rename') {
    return `Coordinate a multi-file AST-safe refactoring rename for the symbol: "${symbol}" to the new name: "${newname}".
Utilize the call graph rename command: mcp_gitnexus-sse_rename({ symbol_name: "${symbol}", new_name: "${newname}", repo: "wonderful-faraday" }) to perform the change.
Run dry-run AST checks to ensure import references and mapping rules are fully validated without manual find-and-replace.`;
  } else if (goal === 'debug') {
    return `Systematically trace the error source for the active symbol "${symbol}" experiencing:
"${error}"
Trace the chronological execution sequence using the gitnexus://repo/wonderful-faraday/process/ details.
Isolate active throw sites and formulate robust targeted regression tests around the failing frame sequence.`;
  }
  return `Select a valid engineering task or goal to compile premium synthesized developer agent instructions.`;
}

function initPromptSynthesizer() {
  const goalSelect = document.getElementById('synth-goal');
  const conceptInput = document.getElementById('synth-concept');
  const symbolInput = document.getElementById('synth-symbol');
  const newnameInput = document.getElementById('synth-newname');
  const errorInput = document.getElementById('synth-error');
  const outputText = document.getElementById('prompt-output-text');
  const copyBtn = document.getElementById('btn-copy-prompt');

  const groupConcept = document.getElementById('group-concept');
  const groupSymbol = document.getElementById('group-symbol');
  const groupNewname = document.getElementById('group-newname');
  const groupError = document.getElementById('group-error');

  if (!goalSelect || !outputText) return;

  function updateSynthesizer() {
    const goal = goalSelect.value;
    const concept = conceptInput ? conceptInput.value.trim() : '';
    const symbol = symbolInput ? symbolInput.value.trim() : '';
    const newname = newnameInput ? newnameInput.value.trim() : '';
    const error = errorInput ? errorInput.value.trim() : '';

    // Update parameter input visibilities dynamically
    if (groupConcept) groupConcept.style.display = (goal === 'explore') ? 'block' : 'none';
    if (groupSymbol) groupSymbol.style.display = (goal === 'impact' || goal === 'rename' || goal === 'debug') ? 'block' : 'none';
    if (groupNewname) groupNewname.style.display = (goal === 'rename') ? 'block' : 'none';
    if (groupError) groupError.style.display = (goal === 'debug') ? 'block' : 'none';

    // Generate dynamic trigger prompt text content
    outputText.innerText = generatePrompt(goal, concept, symbol, newname, error);
  }

  // Bind change/input listeners
  goalSelect.addEventListener('change', updateSynthesizer);
  if (conceptInput) conceptInput.addEventListener('input', updateSynthesizer);
  if (symbolInput) symbolInput.addEventListener('input', updateSynthesizer);
  if (newnameInput) newnameInput.addEventListener('input', updateSynthesizer);
  if (errorInput) errorInput.addEventListener('input', updateSynthesizer);

  // Bind copy button listener
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      // Set global tracking variable if in Node testing environment
      if (typeof global !== 'undefined') {
        global.lastCopiedText = outputText.innerText;
      } else {
        window.lastCopiedText = outputText.innerText;
      }
      
      // Perform robust navigator clipboard operations with fallback
      if (navigator.clipboard) {
        navigator.clipboard.writeText(outputText.innerText)
          .then(() => {
            showToast("Copied synthesized trigger prompt to clipboard!");
          })
          .catch(() => {
            if (fallbackCopyTextToClipboard(outputText.innerText)) {
              showToast("Copied synthesized trigger prompt to clipboard!");
            } else {
              showToast("Clipboard copy failed. Please select manually.", "secondary");
            }
          });
      } else {
        if (fallbackCopyTextToClipboard(outputText.innerText)) {
          showToast("Copied synthesized trigger prompt to clipboard!");
        } else {
          showToast("Clipboard copy failed. Please select manually.", "secondary");
        }
      }
    });
  }

  // Compile the initial state configuration
  updateSynthesizer();
}

// ================= UTILITIES & HELPERS =================

// Premium Animated Toast Notification Builder
window.showToast = function(message, type = 'primary') {
  const container = document.getElementById('toast-stack');
  if (!container) return;

  // Stacking limit: max 5 active toast notifications in the DOM stack
  while (container.children.length >= 5) {
    container.removeChild(container.firstChild);
  }

  const toast = document.createElement('div');
  toast.className = `toast ${type === 'secondary' ? 'secondary' : ''}`;
  toast.innerHTML = `
    <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
      <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
    </svg>
    <span>${message}</span>
  `;

  container.appendChild(toast);

  // Auto clear transition
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateY(10px)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 2700);
};

// Robust fallback copying utility for non-secure contexts (e.g. file:// protocol)
function fallbackCopyTextToClipboard(text) {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  textArea.style.top = "0";
  textArea.style.left = "0";
  textArea.style.position = "fixed";
  textArea.style.opacity = "0";
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  let successful = false;
  try {
    successful = document.execCommand('copy');
  } catch (err) {
    successful = false;
  }
  document.body.removeChild(textArea);
  return successful;
}

// Clipboard copying utility with animated toast feedback
window.copyToClipboard = function(text) {
  if (navigator.clipboard) {
    navigator.clipboard.writeText(text).then(() => {
      showToast("Copied syntax definition to clipboard!");
    }).catch(() => {
      if (fallbackCopyTextToClipboard(text)) {
        showToast("Copied syntax definition to clipboard!");
      } else {
        showToast("Clipboard copy failed. Please select manually.", "secondary");
      }
    });
  } else {
    if (fallbackCopyTextToClipboard(text)) {
      showToast("Copied syntax definition to clipboard!");
    } else {
      showToast("Clipboard copy failed. Please select manually.", "secondary");
    }
  }
};

// Bulletproof initialization: execute immediately for bottom-placed scripts
initializeApp();

// Fallbacks for various event timings/environments
if (typeof process !== 'undefined' && typeof window !== 'undefined') {
  initializeApp();
} else if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
  } else {
    initializeApp();
  }
}
if (typeof window !== 'undefined') {
  window.addEventListener('load', initializeApp);
}

function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
