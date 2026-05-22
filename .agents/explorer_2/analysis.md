# Comprehensive Codebase Analysis & Design Report

This report provides a precise, actionable roadmap for transitioning the Wonderful Faraday repository from low-level database-focused operations to a developer-centric, AI-agent integration platform. It identifies exact lines of code for removal, provides replacement snippets, and outlines interactive designs.

---

## 1. Playbook Refactoring (`ultimate_gitnexus_playbook.md`)

### Target Code Areas & Pruning Plan
To simplify the playbook and remove raw KuzuDB database schema details, low-level BFS/DFS traversals, and the advanced Cypher queries section, the following modifications are proposed:

| Target Area | Current Location | Modification Action | Rationale |
|---|---|---|---|
| Mermaid Sequence Diagram (KuzuDB traverse) | `ultimate_gitnexus_playbook.md` Line 46 | Replace `Perform BFS/DFS upstream graph traversal` with `Perform dependency blast radius calculation` | Abstract away internal graph traversal algorithms. |
| Diagram Participant Label | `ultimate_gitnexus_playbook.md` Line 20 | Replace `participant GraphDB as KuzuDB (Graph Database)` with `participant GraphDB as Graph Database` | Focus on generic graph abstraction rather than embedding brand. |
| Section 2: "The Graph Schema" | `ultimate_gitnexus_playbook.md` Lines 215-237 | Simplify. Remove property descriptions references to physical KuzuDB frames, replace with structural relationships. | Reduce developer cognitive load; prevent database-level exposure. |
| Section 3: "Surgical Debugging & Error Tracing" | `ultimate_gitnexus_playbook.md` Lines 938, 1084, 1093 | Replace physical "KuzuDB" references with "local GitNexus graph repository". | Keep vocabulary consistent with external tool commands. |
| Section 5: "Advanced Custom Cypher Queries" | `ultimate_gitnexus_playbook.md` Lines 1156-1389 | **DELETE ENTIRE SECTION**. Replace with developer-centric high-level concepts. | Cypher syntax is out of scope for high-level agentic developers. |
| Section 6: "Specialized Agent Skills & Zero-Server Browser Architecture" | `ultimate_gitnexus_playbook.md` Lines 1390-1490 | Rename to "Specialized Agent Skills & IDE Configuration Guides". Delete "Browser-Native Zero-Server" section. Insert Cursor, Claude Code, and Windsurf configurations. | Reprioritize agent automation and concrete setup steps. |

### Proposed Playbook Text Replacements

#### Replacement 1: Mermaid Diagram Update
* **File:** `ultimate_gitnexus_playbook.md` (Lines 44-48)
* **Target:**
```mermaid
    GitNexus_MCP->>GraphDB: Perform BFS/DFS upstream graph traversal
    GraphDB-->>GitNexus_MCP: Return list of impacted callers
```
* **Replacement:**
```mermaid
    GitNexus_MCP->>GraphDB: Perform dependency blast radius calculation
    GraphDB-->>GitNexus_MCP: Return list of impacted callers
```

#### Replacement 2: Section 5 Complete Overhaul
* **File:** `ultimate_gitnexus_playbook.md` (Lines 1156-1389)
* **Target:** Remove the entire `## Section 5: Advanced Custom Cypher Queries` section and replace it with:
```markdown
## Section 5: Semantic Code Graphs & Search Philosophy

GitNexus bypasses raw syntactic grep matches by indexing codebases as structural graphs. Instead of searching for exact string combinations, developers and AI agents can query the conceptual model of the codebase using semantic searches, call relationships, and modular groupings.

### Key Conceptual Mapping Capabilities
1. **Semantic Search (`gitnexus_query`)**: Searches for concepts rather than characters. It matches terms like "auth flow" to functions handling sessions, JWT validation, or cookie parsing.
2. **Blast Radius Analysis (`gitnexus_impact`)**: Computes structural dependencies. By specifying a symbol, the system traces callers across modular borders, enabling developers to estimate refactoring risk instantly.
3. **Change Detection (`gitnexus_detect_changes`)**: Audits uncommitted changes. By analyzing diff patches, it alerts the developer to the exact call flows that are affected by recent edits.
```

#### Replacement 3: Section 6 Integration Guides
* **File:** `ultimate_gitnexus_playbook.md` (Lines 1390-1490)
* **Target:** Replace the entire Section 6 content with:
```markdown
## Section 6: Specialized Agent Skills & IDE Configuration Guides

To unlock full developer velocity, AI assistant frameworks must be configured to eagerly consult the local GitNexus MCP server. This section provides copy-pasteable configuration matrices for major IDE environments and autonomous agent command lines.

### 1. Cursor Rules Setup (`.cursorrules`)
Place a `.cursorrules` file at the root of your workspace to instruct Cursor's agentic modes to prioritize safety checks:

\`\`\`markdown
# GitNexus Integration Rules for Cursor AI
# Enforces automated call-graph checking prior to code edits

- **Before Code Edits**: Always run the blast radius calculation using the gitnexus MCP tool:
  \`gitnexus_impact({ target: "SymbolName", direction: "upstream" })\`
- **Assess Risk Levels**:
  - **LOW (<5 symbols)**: Proceed with edits.
  - **MEDIUM (5-15 symbols)**: Warn the user about direct callers.
  - **HIGH (>15 symbols)**: Pause, output the list of callers, and wait for explicit human approval.
- **Before Committing**: Run \`gitnexus_detect_changes({ scope: "staged" })\` to ensure only the intended targets were modified.
\`\`\`

### 2. Claude Code Integration (`config.json`)
Register the stdio transport channel inside your global Claude Code configuration file (located at `~/.claudecode/config.json`):

\`\`\`json
{
  "mcpServers": {
    "gitnexus-stdio": {
      "command": "npx",
      "args": ["-y", "gitnexus", "serve"],
      "env": {}
    }
  }
}
\`\`\`

### 3. Windsurf Workspace Setup (`.windsurfrules`)
Instruct Windsurf's internal AI agent to use the GitNexus Model Context Protocol for codebase context mapping:

\`\`\`markdown
# Windsurf GitNexus Context Rules
# Ensures all symbol resolutions utilize semantic graph lookups

- Always use the \`gitnexus_query\` tool to resolve architecture components before reading files sequentially.
- Prior to renaming symbols, run \`gitnexus_rename\` in dry run mode to verify caller references.
\`\`\`

### 4. Direct CLI Workflow Sequence
For manual index checking and rebuild operations:
- **Index Integrity Check**: \`npx gitnexus status\`
- **Rebuild call graph (Fast)**: \`npx gitnexus analyze --drop-embeddings\`
- **Rebuild with dense vectors (Complete)**: \`npx gitnexus analyze --embeddings\`
```

---

## 2. Interactive Dashboard Structure (`index.html` & `style.css`)

### Pruning Plan for `index.html`
1. **Sidebar Navigation**: Locate line 59 and replace the old Cypher Playground navigation item with the IDE Setup link.
2. **Main Section**: Locate `<section id="cypher-section">` (lines 610-686) and replace it completely with the new `<section id="ide-setup-section">` block containing glassmorphic styling, three-column tab selectors, a copyable editor panel, and a walkthrough pipeline.

### Target Snippets for Replacement in `index.html`

#### Replacement 1: Sidebar Link Update
* **Location:** `index.html` (Lines 59-66)
* **Target:**
```html
          <li class="nav-item" data-section="cypher">
            <a href="#cypher">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.9-2 1.81-2.9l1.24-1.25c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H7c0-2.76 2.24-5 5-5s5 2.24 5 5c0 1.04-.42 1.99-1.07 2.75z"/>
              </svg>
              <span>Cypher Playground</span>
            </a>
          </li>
```
* **Replacement:**
```html
          <li class="nav-item" data-section="ide-setup">
            <a href="#ide-setup">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
                <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm-8 12H4v-2h8v2zm8-4H4V8h16v4z"/>
              </svg>
              <span>IDE Setup & Guides</span>
            </a>
          </li>
```

#### Replacement 2: Section Overhaul
* **Location:** `index.html` (Lines 610-686)
* **Target:** Remove `<section id="cypher-section"> ... </section>` and replace with:
```html
      <!-- ================= SECTION: IDE SETUP & INTEGRATION GUIDES ================= -->
      <section id="ide-setup-section" class="playbook-section">
        <div class="card">
          <div class="card-header">
            <div>
              <h2 class="card-title">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="var(--primary)">
                  <path d="M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.56-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z"/>
                </svg>
                Advanced IDE Setup & Integration Guides
              </h2>
              <p class="card-subtitle">Configure your favorite AI agent frameworks to consult GitNexus call graphs</p>
            </div>
          </div>

          <div class="ide-setup-layout">
            <!-- IDE Selection Tabs -->
            <div class="ide-tabs">
              <button class="ide-tab-btn active" data-ide="cursor">Cursor Rules (.cursorrules)</button>
              <button class="ide-tab-btn" data-ide="claude">Claude Code (config.json)</button>
              <button class="ide-tab-btn" data-ide="windsurf">Windsurf Rules (.windsurfrules)</button>
            </div>

            <div class="ide-display-grid">
              <!-- Left: Configuration Snippet Box -->
              <div class="ide-panel">
                <div class="code-container" style="margin: 0; display: flex; flex-direction: column; height: 100%;">
                  <div class="code-header">
                    <span class="code-lang-tag" id="ide-code-lang" style="color: var(--primary);">MARKDOWN</span>
                    <button class="code-copy-btn" id="btn-copy-ide">
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                        <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                      </svg>
                      <span>Copy Config</span>
                    </button>
                  </div>
                  <div class="code-content" style="flex-grow: 1; min-height: 260px; background: #07090e;">
                    <pre><code id="ide-editor-text" style="color: #c9d1d9; white-space: pre-wrap; font-size: 12px; font-family: var(--font-mono);">...</code></pre>
                  </div>
                </div>

                <div class="ide-executor" style="padding: 16px 20px;">
                  <div class="ide-details">
                    <div class="ide-diag-title" id="ide-title" style="font-size:12px; font-weight:700;">Integration Target</div>
                    <p class="ide-diag-text" id="ide-description" style="font-size:12.5px; margin:0; line-height:1.45;">...</p>
                  </div>
                </div>
              </div>

              <!-- Right: Step-by-Step Walkthrough Guide -->
              <div class="ide-guide-panel" style="background: hsla(224, 25%, 3%, 0.3); border: 1px solid var(--border); border-radius: 14px; padding: 24px;">
                <h3 style="font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px; color: #fff; margin-bottom: 20px;">Walkthrough Setup</h3>
                <div class="guide-steps" style="display: flex; flex-direction: column; gap: 20px;">
                  
                  <div class="guide-step-item" style="display: flex; gap: 14px;">
                    <div class="guide-step-num" style="width: 26px; height: 26px; border-radius: 50%; background: hsla(196, 100%, 50%, 0.1); border: 1px solid var(--primary); color: var(--primary); display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; flex-shrink: 0;">1</div>
                    <div class="guide-step-content">
                      <h4 id="walkthrough-step1-title" style="font-size: 13.5px; font-weight: 600; color: #fff; margin: 0 0 4px 0;">Create Configuration File</h4>
                      <p id="walkthrough-step1-desc" style="font-size: 12px; color: var(--text-muted); line-height:1.45; margin: 0;">...</p>
                    </div>
                  </div>

                  <div class="guide-step-item" style="display: flex; gap: 14px;">
                    <div class="guide-step-num" style="width: 26px; height: 26px; border-radius: 50%; background: hsla(196, 100%, 50%, 0.1); border: 1px solid var(--primary); color: var(--primary); display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; flex-shrink: 0;">2</div>
                    <div class="guide-step-content">
                      <h4 id="walkthrough-step2-title" style="font-size: 13.5px; font-weight: 600; color: #fff; margin: 0 0 4px 0;">Paste the Configuration</h4>
                      <p id="walkthrough-step2-desc" style="font-size: 12px; color: var(--text-muted); line-height:1.45; margin: 0;">...</p>
                    </div>
                  </div>

                  <div class="guide-step-item" style="display: flex; gap: 14px;">
                    <div class="guide-step-num" style="width: 26px; height: 26px; border-radius: 50%; background: hsla(196, 100%, 50%, 0.1); border: 1px solid var(--primary); color: var(--primary); display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700; flex-shrink: 0;">3</div>
                    <div class="guide-step-content">
                      <h4 id="walkthrough-step3-title" style="font-size: 13.5px; font-weight: 600; color: #fff; margin: 0 0 4px 0;">Run Verification Scripts</h4>
                      <p id="walkthrough-step3-desc" style="font-size: 12px; color: var(--text-muted); line-height:1.45; margin: 0;">...</p>
                    </div>
                  </div>

                </div>
              </div>

            </div>
          </div>
        </div>
      </section>
```

### Style Sheet Additions in `style.css`
Replace lines 963-1090 in `style.css` (which specify `.cypher-*` playground elements) with clean, high-performance `.ide-*` styles:

```css
/* ================= IDE Setup & Integration Guides Layout ================= */
.ide-setup-layout {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.ide-tabs {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.ide-tab-btn {
  background: hsla(220, 20%, 8%, 0.4);
  border: 1px solid var(--border);
  color: var(--text-muted);
  padding: 12px;
  border-radius: 10px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: var(--transition);
  text-align: center;
}

.ide-tab-btn:hover {
  color: #fff;
  background: hsla(220, 20%, 12%, 0.6);
}

.ide-tab-btn.active {
  color: #fff;
  border-color: var(--primary);
  background: hsla(196, 100%, 50%, 0.05);
}

.ide-display-grid {
  display: grid;
  grid-template-columns: 1.2fr 1fr;
  gap: 30px;
}

.ide-panel {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.ide-executor {
  background: hsla(224, 25%, 3%, 0.4);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 20px;
}

.ide-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.ide-diag-title {
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  color: var(--primary);
  letter-spacing: 0.5px;
}

.ide-diag-text {
  font-size: 13px;
  color: var(--text-muted);
}
```

*Note:* Update the responsive selector at Line 1569:
```css
  .timeline-steps-grid, .cli-builder-grid, .ide-display-grid, .schema-explorer-layout {
```

---

## 3. Dynamic Application Logic (`app.js`)

`app.js` is the core execution driver. The three modules to implement are:
1. **Sidebar Navigation**: Handles click listeners, state toggles, and syncs section names.
2. **Interactive Agent Skills**: Switches skills, populates checklists, and tool badges.
3. **Prompt Synthesizer**: Composes custom developer prompt injections.

### Exact JS Replacements & Implementations

#### Replacement 1: Navigation Control Update
* **File:** `app.js` (Lines 14-55)
* **Replacement:**
```javascript
function initNavigation() {
  const navItems = document.querySelectorAll('.sidebar-nav .nav-item');
  const sections = document.querySelectorAll('.playbook-section');

  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      const targetSection = item.getAttribute('data-section');
      
      // Update sidebar nav active states
      navItems.forEach(nav => nav.classList.remove('active'));
      item.classList.add('active');

      // Update visibility of content sections
      sections.forEach(sec => sec.classList.remove('active'));
      const activeSection = document.getElementById(`${targetSection}-section`);
      if (activeSection) {
        activeSection.classList.add('active');
        
        // Dynamic title and subtitle synchronization
        const mainTitle = document.getElementById('main-title');
        const mainSubtitle = document.getElementById('main-subtitle');
        
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
          mainTitle.innerText = "IDE Integration Guides";
          mainSubtitle.innerText = "Power up your AI developer agents with GitNexus code intelligence";
        } else if (targetSection === 'skills') {
          mainTitle.innerText = "Agent Skills Hub";
          mainSubtitle.innerText = "Interactive manual on specialized autonomous agent abilities";
        } else if (targetSection === 'cheatsheet') {
          mainTitle.innerText = "Command Reference Hub";
          mainSubtitle.innerText = "Instant Cheat Sheet & Tasks Lookup Matrix";
        }
      }
    });
  });
}
```

#### Replacement 2: Remove Cypher and Insert IDE Setup, Skills Hub, and Prompt Synthesizer
* **File:** `app.js` (Delete lines 406-552, replacing `initCypherPlayground()` and its mock definitions completely)
* **Replacement:**

```javascript
// ================= 5. DYNAMIC IDE SETUP GUIDES =================
const IDE_DATA = {
  cursor: {
    title: "Cursor Rules Integration (.cursorrules)",
    desc: "Place this <code>.cursorrules</code> file in your workspace root. It instructs Cursor's agentic model to prioritize querying the local GitNexus MCP server before making structural edits or architecture plans.",
    lang: "MARKDOWN",
    step1Title: "Create Configuration File",
    step1Desc: "Create a new file named <code>.cursorrules</code> at your codebase's root directory.",
    step2Title: "Paste the Code Snippet",
    step2Desc: "Copy the markdown config snippet on the left and paste it into the file.",
    step3Title: "Trigger AI Agent Actions",
    step3Desc: "Ask Cursor to refactor or rename a symbol, and watch it consult the GitNexus graph tool automatically.",
    code: `# Cursor GitNexus Integration Rules
# Force the agent to consult GitNexus context before edits

# Always follow this workflow:
1. Check index freshness by reading \`gitnexus://repo/wonderful-faraday/context\`.
2. For exploring unfamiliar logic, use \`gitnexus_query\` to locate relevant processes instead of fuzzy regex matching.
3. MANDATORY: Prior to editing any symbol, run \`gitnexus_impact\` with \`direction: "upstream"\`.
   - If risk is HIGH (>5 symbols) or CRITICAL (auth/billing paths), pause, report the blast radius, and await human approval.
4. Post-change: Always run \`gitnexus_detect_changes\` to verify only expected scopes are affected.`
  },
  claude: {
    title: "Claude Code stdio Configuration",
    desc: "Configure your global Claude Code setup (usually located at <code>~/.claudecode/config.json</code>) to spin up the GitNexus stdio Model Context Protocol (MCP) server automatically upon launching the tool.",
    lang: "JSON",
    step1Title: "Open Global Config",
    step1Desc: "Open your local Claude Code config file at <code>~/.claudecode/config.json</code>.",
    step2Title: "Register gitnexus-stdio",
    step2Desc: "Add the <code>gitnexus-stdio</code> tool block under the <code>mcpServers</code> dictionary key.",
    step3Title: "Initialize Claude Code",
    step3Desc: "Run <code>claude</code> in your terminal. The GitNexus tool declarations will load eagerly.",
    code: `{
  "mcpServers": {
    "gitnexus-stdio": {
      "command": "npx",
      "args": ["-y", "gitnexus", "serve"],
      "env": {}
    }
  }
}`
  },
  windsurf: {
    title: "Windsurf Workspace Rules (.windsurfrules)",
    desc: "Create a <code>.windsurfrules</code> file at your repository's root. This instructs Windsurf's internal AI agent to integrate with the GitNexus server to run safety pre-checks and structural scans.",
    lang: "MARKDOWN",
    step1Title: "Create Rule File",
    step1Desc: "Create a file named <code>.windsurfrules</code> at your repository's root directory.",
    step2Title: "Apply Rule Configurations",
    step2Desc: "Copy and paste the markdown instructions on the left to set system parameters.",
    step3Title: "Audit Call-Graph Paths",
    step3Desc: "Run Windsurf commands normally. The agent will execute impact assessments in the background.",
    code: `# Windsurf GitNexus System Rules
# Configures the AI system to utilize GitNexus graph tools first

- **Architecture Discovery**: Always run the \`gitnexus_query\` MCP tool to discover code files and modular structures conceptually rather than reading file lists manually.
- **Safety Pre-Check**: Never modify a function or class without first querying \`gitnexus_impact\` to assess direct and indirect upstream callers.
- **AST Multi-File Renames**: When the user requests a symbol rename, use \`gitnexus_rename\` with \`dry_run: true\` to check the payload confidence first. Do not use generic regex replace.`
  }
};

function initIDESetup() {
  const tabs = document.querySelectorAll('.ide-tab-btn');
  const ideCode = document.getElementById('ide-editor-text');
  const ideCodeLang = document.getElementById('ide-code-lang');
  const ideTitle = document.getElementById('ide-title');
  const ideDesc = document.getElementById('ide-description');
  const btnCopy = document.getElementById('btn-copy-ide');

  const step1Title = document.getElementById('walkthrough-step1-title');
  const step1Desc = document.getElementById('walkthrough-step1-desc');
  const step2Title = document.getElementById('walkthrough-step2-title');
  const step2Desc = document.getElementById('walkthrough-step2-desc');
  const step3Title = document.getElementById('walkthrough-step3-title');
  const step3Desc = document.getElementById('walkthrough-step3-desc');

  let activeTab = 'cursor';

  function updateIDEShowcase(tabKey) {
    activeTab = tabKey;
    const data = IDE_DATA[tabKey];
    if (!data) return;

    ideCode.innerText = data.code;
    ideCodeLang.innerText = data.lang;
    ideTitle.innerText = data.title;
    ideDesc.innerHTML = data.desc;

    step1Title.innerHTML = data.step1Title;
    step1Desc.innerHTML = data.step1Desc;
    step2Title.innerHTML = data.step2Title;
    step2Desc.innerHTML = data.step2Desc;
    step3Title.innerHTML = data.step3Title;
    step3Desc.innerHTML = data.step3Desc;
  }

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      const targetIDE = tab.getAttribute('data-ide');
      updateIDEShowcase(targetIDE);
      showToast(`Selected IDE framework: ${targetIDE.toUpperCase()}`, 'secondary');
    });
  });

  btnCopy.addEventListener('click', () => {
    const data = IDE_DATA[activeTab];
    if (data) {
      copyToClipboard(data.code);
    }
  });

  // Initial showcase render
  updateIDEShowcase('cursor');
}

// ================= 8. AGENT SKILLS HUB & PROMPT SYNTHESIZER =================

const SKILLS_DATA = {
  cli: {
    title: "gitnexus-cli",
    checklist: [
      "Verify physical registry mappings inside <code>~/.gitnexus/registry.json</code>.",
      "Check index age and staleness bounds using HEAD offset hashes.",
      "Perform full AST analysis, refreshing the local graph representation."
    ],
    tools: ["npx gitnexus status", "npx gitnexus analyze", "npx gitnexus clean"]
  },
  exploring: {
    title: "gitnexus-exploring",
    checklist: [
      "Search codebase conceptually using natural language descriptions.",
      "Group results into high-cohesion processes to understand execution pathways.",
      "Expose the Louvain modular communities to identify package boundaries."
    ],
    tools: ["gitnexus_query", "gitnexus://repo/{name}/clusters", "gitnexus://repo/{name}/processes"]
  },
  impact: {
    title: "gitnexus-impact-analysis",
    checklist: [
      "Calculate 1st-degree upstream call dependencies for safety checking.",
      "Classify changes using the low/medium/high/critical risk assessment scale.",
      "Verify changes pre-commit to ensure zero cross-boundary pollution."
    ],
    tools: ["gitnexus_impact", "gitnexus_detect_changes", "gitnexus://repo/{name}/context"]
  },
  refactoring: {
    title: "gitnexus-refactoring",
    checklist: [
      "Perform coordinated, multi-file renames across compiled AST graph edges.",
      "Inspect heuristic matches (<80% confidence) to filter out false positives.",
      "Orchestrate circular dependency eliminations and module extractions."
    ],
    tools: ["gitnexus_rename", "gitnexus_context", "gitnexus_impact"]
  },
  debugging: {
    title: "gitnexus-debugging",
    checklist: [
      "Map stack trace exception strings semantically to throw-site nodes.",
      "Trace chronological asynchronous execution pathways across promise/event gaps.",
      "Identify fat out-degree fan-out methods causing N+1 latency hotspots."
    ],
    tools: ["gitnexus_context", "gitnexus://repo/{name}/process/{processId}", "gitnexus_cypher"]
  },
  guide: {
    title: "gitnexus-guide",
    checklist: [
      "Reference graph node types (File, Function, Class, Interface, Method, Community, Process).",
      "Validate directionality of relationship edges (CALLS, IMPORTS, EXTENDS, IMPLEMENTS, DEFINES).",
      "Verify workflow checklists against standardized prompting protocols."
    ],
    tools: ["gitnexus://repos", "gitnexus://repo/{name}/schema", "gitnexus://repo/{name}/context"]
  }
};

function initAgentSkills() {
  const cards = document.querySelectorAll('.skill-card');
  const title = document.getElementById('detail-skill-title');
  const checklist = document.getElementById('detail-skill-checklist');
  const toolsContainer = document.getElementById('detail-skill-tools');

  cards.forEach(card => {
    card.addEventListener('click', () => {
      cards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');

      const skillKey = card.getAttribute('data-skill');
      const data = SKILLS_DATA[skillKey];
      if (!data) return;

      // Update panel title
      title.innerText = data.title;

      // Render checklists
      checklist.innerHTML = '';
      data.checklist.forEach(item => {
        const li = document.createElement('li');
        li.innerHTML = item;
        checklist.appendChild(li);
      });

      // Render tool badges
      toolsContainer.innerHTML = '';
      data.tools.forEach(tool => {
        const span = document.createElement('span');
        span.className = 'tool-badge';
        span.innerText = tool;
        toolsContainer.appendChild(span);
      });

      showToast(`Swapped skills card: ${data.title}`, 'secondary');
    });
  });
}

function initPromptSynthesizer() {
  const synthGoal = document.getElementById('synth-goal');
  const synthConcept = document.getElementById('synth-concept');
  const synthSymbol = document.getElementById('synth-symbol');
  const synthNewName = document.getElementById('synth-newname');
  const synthError = document.getElementById('synth-error');
  const outputText = document.getElementById('prompt-output-text');
  const btnCopyPrompt = document.getElementById('btn-copy-prompt');

  const groupConcept = document.getElementById('group-concept');
  const groupSymbol = document.getElementById('group-symbol');
  const groupNewName = document.getElementById('group-newname');
  const groupError = document.getElementById('group-error');

  function updateFormFieldsAndPrompt() {
    const goal = synthGoal.value;
    
    // Hide all input parameter groups initially
    groupConcept.style.display = 'none';
    groupSymbol.style.display = 'none';
    groupNewName.style.display = 'none';
    groupError.style.display = 'none';

    let promptText = '';

    if (goal === 'explore') {
      groupConcept.style.display = 'block';
      const concept = synthConcept.value.trim() || 'jwt authentication pipeline';
      promptText = `Activate your \`gitnexus-exploring\` skill to check index freshness and run a semantic query for '${concept}'. Identify the core files, functions, and active processes that participate in this capability. Trace the execution pathway step-by-step using gitnexus:// resources and report your architectural findings.`;
    } else if (goal === 'impact') {
      groupSymbol.style.display = 'block';
      const symbol = synthSymbol.value.trim() || 'validateUserSession';
      promptText = `Activate your \`gitnexus-impact-analysis\` skill. Run \`gitnexus_impact\` with target '${symbol}' in the 'upstream' direction to trace all immediate and transitive callers. Perform a thorough blast radius assessment across the Low/Medium/High/Critical risk scale. If risk is high or critical, present a breakdown of all affected systems and halt for human verification before making changes.`;
    } else if (goal === 'rename') {
      groupSymbol.style.display = 'block';
      groupNewName.style.display = 'block';
      const symbol = synthSymbol.value.trim() || 'validateUserSession';
      const newName = synthNewName.value.trim() || 'authenticateSession';
      promptText = `Activate your \`gitnexus-refactoring\` skill. We need to rename '${symbol}' to '${newName}'. Execute a coordinated, multi-file \`gitnexus_rename\` in 'dry_run: true' mode first. Carefully parse the results to distinguish graph edges (high confidence) from heuristic AST searches (low confidence). Verify low-confidence lines manually, then execute the rename with dry_run disabled. Run change-detection pre-commit.`;
    } else if (goal === 'debug') {
      groupSymbol.style.display = 'block';
      groupError.style.display = 'block';
      const symbol = synthSymbol.value.trim() || 'validateUserSession';
      const errorMsg = synthError.value.trim() || 'TypeError: Cannot read properties of undefined (reading \'jwt\')';
      promptText = `Activate your \`gitnexus-debugging\` skill to trace the throw-site of the exception: '${errorMsg}'. Use \`gitnexus_context\` on '${symbol}' to inspect incoming callers and outgoing callees. If the path traverses asynchronous queue boundaries or promise chains, retrieve the chronological process sequence from the registered capabilities resource to map connection pools or leaky connection errors.`;
    }

    outputText.innerText = promptText;
  }

  // Bind input element listeners
  synthGoal.addEventListener('change', updateFormFieldsAndPrompt);
  synthConcept.addEventListener('input', updateFormFieldsAndPrompt);
  synthSymbol.addEventListener('input', updateFormFieldsAndPrompt);
  synthNewName.addEventListener('input', updateFormFieldsAndPrompt);
  synthError.addEventListener('input', updateFormFieldsAndPrompt);

  // Bind copy button listener
  btnCopyPrompt.addEventListener('click', () => {
    const text = outputText.innerText;
    copyToClipboard(text);
  });

  // Initial call to sync preview box with default configurations
  updateFormFieldsAndPrompt();
}
```

#### Replacement 3: Modify DOMContentLoaded Event
* **File:** `app.js` (Lines 3-11)
* **Replacement:**
```javascript
document.addEventListener('DOMContentLoaded', () => {
  initNavigation();
  initSchemaExplorer();
  initTimeline();
  initCLIBuilder();
  initIDESetup();
  initAgentSkills();
  initPromptSynthesizer();
  initCheatSheet();
  initGlobalSearch();
});
```

---

## 4. Architectural Summary

By implementing the structural cleanups and interactive logic detailed in this report, the wonderful-faraday playbook and dashboard will become a high-velocity integration manual for advanced AI-driven engineering, directly preparing users to configure robust workspace environments with Cursor, Claude Code, and Windsurf, while retaining full conceptual alignment with the core GitNexus Model Context Protocol capabilities.
