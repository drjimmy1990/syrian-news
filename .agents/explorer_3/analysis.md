# Detailed Code Analysis & Refactoring Specifications

## 1. Executive Summary

This read-only investigation maps the comprehensive blueprints to shift the **Wonderful Faraday** hub from a low-level KuzuDB database internals handbook to a premium, developer-centric and agent-centric automation playground. 

The primary objectives are:
- **Simplify Playbook:** Remove complex KuzuDB database schemas, Louvain/modularity graph theory internals, and Section 5's Cypher queries in `ultimate_gitnexus_playbook.md`.
- **Enrich Agent Integrations:** Introduce step-by-step setup guides for Cursor (`.cursorrules`), Claude Code (`config.json`), and Windsurf (`.windsurfrules`) inside Section 6.
- **Glassmorphic UI Tab Replacement:** Swap out the "Cypher Playground" tab in `index.html` and `style.css` with a highly interactive, glassmorphic "IDE Setup & Guides" tab.
- **Application Logic Core Wiring:** Wire the sidebar navigations, implement the **Agent Skills Hub** checklist details, and write the **Prompt Synthesizer** engine in `app.js` with copy-to-clipboard toast mappings.

---

## 2. Playbook Refactoring Blueprint (`ultimate_gitnexus_playbook.md`)

### 2.1 Low-Level KuzuDB Internals to Remove or Simplify

To shift the playbook to a modern, developer-centric focus, we must locate and excise all raw database details and replace them with high-level AST conceptual structures.

#### Target Area 1: Sequence Diagram Database Participants (Section 1)
- **Current Code Lines:** ~15–23
  ```mermaid
  sequenceDiagram
      autonumber
      actor Developer
      participant GitNexus_MCP as GitNexus MCP Server
      participant GraphDB as KuzuDB (Graph Database)
      participant Embeddings as Semantic Embeddings Store
      participant Workspace as Local Workspace / Git
  ```
- **Proposed Replacement:** Replace database physical engines with conceptual GitNexus runtime actors.
  ```mermaid
  sequenceDiagram
      autonumber
      actor Developer
      participant GitNexus_MCP as GitNexus MCP Server
      participant GraphEngine as GitNexus Graph Engine
      participant Workspace as Local Workspace / Git
  ```

#### Target Area 2: Physical Database Schemas (Section 2)
- **Current Code Lines:** ~215–237 ("### The Graph Schema ... Under the hood, GitNexus models repositories inside a high-performance graph database (KuzuDB)...")
- **Proposed Simplification:** Frame the graph schema strictly from a code-compilation perspective rather than graph database primitives:
  - Remove all mentions of "KuzuDB Edge property types" or database internals.
  - Simplify Node/Edge lists to focus on standard AST constructs (File, Function, Class, Interface, Method) and their semantic dependencies (Calls, Imports, Extends, Implements).

#### Target Area 3: Section 5 - Advanced Custom Cypher Queries
- **Current Code Lines:** ~1156–1389
- **Action:** **Entirely DELETE this section.** The manual execution of raw database queries deviates from automated agent skills. Deleting it completely fulfills the "zero complex manual Cypher query sections" requirement.

#### Target Area 4: BFS/DFS andmodularity Traversal Text
- **Action:** Perform surgical text updates to remove database engineering jargon:
  - Replace `BFS/DFS upstream graph traversal` (lines 46, 124, 1460) with `upstream dependency analysis` or `transitive caller mapping`.
  - Replace `Louvain Modularity Algorithm` (lines 430–434) with `Community Detection algorithms` or `modular grouping heuristics`.

---

### 2.2 IDE Configuration Guides (Section 6)

We will enrich Section 6: Specialized Agent Skills & Triggers with comprehensive, step-by-step IDE setup guides:

#### 1. Cursor Setup Guide
```markdown
### 1. Cursor: Coordinated `.cursorrules`
To force Cursor's agent to utilize GitNexus call graphs before making modifications, create a `.cursorrules` file at the root of your workspace:

\`\`\`markdown
# GitNexus Architecture Enforcement Rules
Always consult GitNexus before making code changes.
1. Run \`gitnexus_impact\` to assess risk before editing any symbol.
2. If impact risk is HIGH or CRITICAL, notify the developer before editing.
3. Use \`gitnexus_query\` to explore semantic concepts rather than flat textual grep searches.
\`\`\`
```

#### 2. Claude Code Setup Guide
```markdown
### 2. Claude Code: Standard `config.json` Stdio Configuration
To integrate the GitNexus MCP server directly into Claude Code's shell execution runtime, add the stdio-transport command to your global configuration file (`~/.claude.json`):

\`\`\`json
{
  "mcpServers": {
    "gitnexus-stdio": {
      "command": "npx",
      "args": ["-y", "gitnexus-stdio"]
    }
  }
}
\`\`\`
```

#### 3. Windsurf Setup Guide
```markdown
### 3. Windsurf: Workspace Rules & Context System Instructions
To establish custom system rules for Windsurf's agent, configure a `.windsurfrules` file at the root of the workspace:

\`\`\`markdown
# Windsurf Workspace Rules for GitNexus
- Before implementing features, trace execution using \`gitnexus://repo/{name}/process/{processName}\`.
- Enforce pre-commit validation by running \`gitnexus_detect_changes\` with \`"scope": "staged"\`.
- Reject standard find-and-replace for structural refactoring. Use AST-guided renames via \`gitnexus_rename\`.
\`\`\`
```

#### 4. CLI Workflows Guide
```markdown
### 4. CLI Workflows: Direct Index Management Sequences
For direct command line audits and re-indexing, execute the following sequences:

\`\`\`powershell
# Step 1: Inspect Registry Workspace and Staleness Age
npx gitnexus status

# Step 2: Synchronize/Index Code Graph with Semantic Vectors
npx gitnexus analyze --embeddings

# Step 3: Run pre-commit Change Audit for Staged Scope
npx gitnexus detect-changes --scope staged
\`\`\`
```

---

## 3. Dashboard UI Update Blueprint (`index.html` & `style.css`)

### 3.1 Sidebar Navigation Replacement (`index.html`)

We will replace the "Cypher Playground" sidebar item with the "IDE Setup" item.

- **Before Snippet (lines 59–66):**
  ```html
  <li class="nav-item" data-section="cypher">
    <a href="#cypher">
      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
        <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-4 6h-4v2h4v2-4v2h4v2H9V7h6v2z"/>
      </svg>
      <span>Cypher Playground</span>
    </a>
  </li>
  ```

- **After Snippet:**
  ```html
  <li class="nav-item" data-section="ide-setup">
    <a href="#ide-setup">
      <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
        <path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/>
      </svg>
      <span>IDE Setup & Guides</span>
    </a>
  </li>
  ```

---

### 3.2 Main Content View Replacement (`index.html`)

The KuzuDB/Cypher Playground tab content (lines 610–686) will be completely replaced by the premium, glassmorphic "IDE Setup & Guides" tab.

- **Draft HTML Markup to Insert:**
  ```html
  <!-- ================= SECTION: IDE SETUP & GUIDES ================= -->
  <section id="ide-setup-section" class="playbook-section">
    <div class="card">
      <div class="card-header">
        <div>
          <h2 class="card-title">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="var(--primary)">
              <path d="M4 6H2v14c0 1.1.9 2 2 2h14v-2H4V6zm16-4H8c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H8V4h12v12z"/>
            </svg>
            IDE Setup & Editor Guides
          </h2>
          <p class="card-subtitle">Integrate GitNexus seamlessly into Cursor, Claude Code, and Windsurf</p>
        </div>
      </div>

      <div class="ide-setup-layout">
        <!-- IDE Editor Tabs -->
        <div class="ide-tabs">
          <button class="ide-tab-btn active" data-ide="cursor">Cursor Setup</button>
          <button class="ide-tab-btn" data-ide="claude">Claude Code Setup</button>
          <button class="ide-tab-btn" data-ide="windsurf">Windsurf Setup</button>
        </div>

        <!-- Tab Content Panel -->
        <div class="ide-content-panel">
          <!-- Cursor Tab -->
          <div class="ide-tab-content active" id="ide-cursor">
            <div class="ide-content-header">
              <h3>Cursor: Coordinated .cursorrules</h3>
              <button class="code-copy-btn" onclick="copyToClipboard(document.getElementById('cursor-rules-code').innerText)">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                  <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                </svg>
                <span>Copy Rules</span>
              </button>
            </div>
            <p class="ide-desc">Create a <code>.cursorrules</code> file at your workspace root to force the Cursor agent to utilize GitNexus call graphs before any modification.</p>
            <div class="code-container">
              <div class="code-header"><span class="code-lang-tag">markdown</span></div>
              <div class="code-content">
                <pre><code id="cursor-rules-code"># GitNexus Architecture Enforcement Rules
Always consult GitNexus before making code changes.
1. Run `gitnexus_impact` to assess risk before editing any symbol.
2. If impact risk is HIGH or CRITICAL, notify the user.
3. Use `gitnexus_query` to explore semantic concepts rather than flat textual grep searches.</code></pre>
              </div>
            </div>
          </div>

          <!-- Claude Code Tab -->
          <div class="ide-tab-content" id="ide-claude">
            <div class="ide-content-header">
              <h3>Claude Code: config.json mcp command</h3>
              <button class="code-copy-btn" onclick="copyToClipboard(document.getElementById('claude-config-code').innerText)">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                  <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                </svg>
                <span>Copy JSON</span>
              </button>
            </div>
            <p class="ide-desc">Add the standard <code>gitnexus-stdio</code> server to your global <code>~/.claude.json</code> config file to expose the code graph as tools in Claude Code.</p>
            <div class="code-container">
              <div class="code-header"><span class="code-lang-tag">json</span></div>
              <div class="code-content">
                <pre><code id="claude-config-code">{
  "mcpServers": {
    "gitnexus-stdio": {
      "command": "npx",
      "args": ["-y", "gitnexus-stdio"]
    }
  }
}</code></pre>
              </div>
            </div>
          </div>

          <!-- Windsurf Tab -->
          <div class="ide-tab-content" id="ide-windsurf">
            <div class="ide-content-header">
              <h3>Windsurf: Workspace Rules & Contexts</h3>
              <button class="code-copy-btn" onclick="copyToClipboard(document.getElementById('windsurf-rules-code').innerText)">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                  <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                </svg>
                <span>Copy Instructions</span>
              </button>
            </div>
            <p class="ide-desc">Configure a <code>.windsurfrules</code> file at your workspace root to establish custom system instructions for Windsurf's agent.</p>
            <div class="code-container">
              <div class="code-header"><span class="code-lang-tag">markdown</span></div>
              <div class="code-content">
                <pre><code id="windsurf-rules-code"># Windsurf Workspace Rules for GitNexus
- Before implementing features, trace execution using `gitnexus://repo/{name}/process/{processName}`.
- Enforce pre-commit validation by running `gitnexus_detect_changes` with `"scope": "staged"`.
- Reject standard find-and-replace for structural refactoring. Use AST-guided renames via `gitnexus_rename`.</code></pre>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
  ```

---

### 3.3 Style Adaptations (`style.css`)

We will completely excise all `.cypher-...` selector blocks (lines 962–1095) and introduce our premium glassmorphic IDE guides classes.

- **Proposed CSS Snippets:**
  ```css
  /* IDE Setup & Guides Section Styles */
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
    font-size: 13px;
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

  .ide-content-panel {
    background: hsla(224, 25%, 3%, 0.4);
    border: 1px solid var(--border);
    border-radius: 16px;
    padding: 24px;
    min-height: 300px;
  }

  .ide-tab-content {
    display: none;
    animation: slideIn 0.3s ease forwards;
  }

  .ide-tab-content.active {
    display: block;
  }

  .ide-content-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    border-bottom: 1px solid var(--border);
    padding-bottom: 12px;
  }

  .ide-content-header h3 {
    font-size: 16px;
    color: #fff;
    font-weight: 700;
  }

  .ide-desc {
    font-size: 13px;
    color: var(--text-muted);
    margin-bottom: 16px;
  }
  ```

---

## 4. Client Application Core Logic Blueprint (`app.js`)

### 4.1 Navigation Control and Wiring

Under `initNavigation()`, we replace the old `'cypher'` routing logic with the new `'ide-setup'` tab controls.

- **Proposed Changes in `initNavigation`:**
  ```javascript
  // lines 45–47 (Before):
  } else if (targetSection === 'cypher') {
    mainTitle.innerText = "Cypher Playground";
    mainSubtitle.innerText = "Direct KuzuDB Queries for Advanced Code Intelligence";
  }

  // After:
  } else if (targetSection === 'ide-setup') {
    mainTitle.innerText = "IDE Setup & Guides";
    mainSubtitle.innerText = "Step-by-step editor setups for Cursor, Claude Code, and Windsurf";
  }
  ```
  We also make sure the side-navigation event listener successfully displays the corresponding section card: `ide-setup-section`.

---

### 4.2 Interactive Agent Skills Hub Implementation

We will implement `initAgentSkills()` in `app.js` using a structured configuration object. This populates primary checklist items and utilized MCP tools dynamically inside the card interface.

- **Logic Specification:**
  ```javascript
  const SKILLS_DATA = {
    cli: {
      title: "gitnexus-cli — Indexing & Maintenance",
      checklist: [
        "Verify physical workspace registration inside the global registry file.",
        "Check index age, active commit hashes, and detect database staleness.",
        "Perform a full recursive AST analysis and build dense semantic embeddings.",
        "Generate clean, updated onboarding wikis (CLAUDE.md / AGENTS.md) asynchronously."
      ],
      tools: [
        "npx gitnexus status",
        "npx gitnexus analyze --embeddings",
        "npx gitnexus clean --force"
      ]
    },
    exploring: {
      title: "gitnexus-exploring — Architectural Onboarding",
      checklist: [
        "Search for semantic concepts and business capabilities natural-first.",
        "Group fuzzy search results automatically into logical Louvain modular processes.",
        "Retrieve chronological steps inside registered execution pipelines.",
        "Preserve token bandwidth by querying pre-filtered execution traces."
      ],
      tools: [
        "gitnexus_query",
        "gitnexus://repo/{name}/clusters",
        "gitnexus://repo/{name}/processes",
        "gitnexus://repo/{name}/process/{processId}"
      ]
    },
    impact: {
      title: "gitnexus-impact-analysis — Blast Radius Safety",
      checklist: [
        "Map upstream caller trees to depth=3 to discover all dependencies.",
        "Evaluate modifications against the GitNexus Risk Scale.",
        "Halt edits and warn user if risk level is HIGH or CRITICAL.",
        "Perform a parallel Change Pattern for high-risk components."
      ],
      tools: [
        "gitnexus_impact",
        "gitnexus_detect_changes",
        "gitnexus://repo/{name}/context"
      ]
    },
    refactoring: {
      title: "gitnexus-refactoring — Coordinated AST Renames",
      checklist: [
        "Execute multi-file renaming using actual call-graph bindings.",
        "Differentiate between 100% precise Graph Edges and AST heuristics.",
        "Run dry-runs to inspect low-confidence edit scopes before writing.",
        "Clean up orphaned methods by checking upstream references."
      ],
      tools: [
        "gitnexus_rename",
        "gitnexus_impact",
        "gitnexus_detect_changes"
      ]
    },
    debugging: {
      title: "gitnexus-debugging — Declarative Error Tracing",
      checklist: [
        "Resolve stack traces conceptually to target throw-site nodes.",
        "Audit incoming and outgoing execution boundaries around buggy symbols.",
        "Bridge asynchronous boundaries using registered process steps.",
        "Trace N+1 database connection pools or API performance hubs."
      ],
      tools: [
        "gitnexus_context",
        "gitnexus_cypher",
        "gitnexus://repo/{name}/process/{processName}"
      ]
    },
    guide: {
      title: "gitnexus-guide — Graph Schematics Reference",
      checklist: [
        "Audit raw graph structures using KuzuDB's strict Cypher queries.",
        "Confirm relation schema labels and directional edge property bindings.",
        "Build custom traversal maps for circular compilation dependency loops.",
        "Verify code standard patterns against corporate playbook instructions."
      ],
      tools: [
        "gitnexus_cypher",
        "gitnexus://repo/{name}/schema"
      ]
    }
  };

  function initAgentSkills() {
    const cards = document.querySelectorAll('.skill-card');
    const detailTitle = document.getElementById('detail-skill-title');
    const detailChecklist = document.getElementById('detail-skill-checklist');
    const detailTools = document.getElementById('detail-skill-tools');

    cards.forEach(card => {
      card.addEventListener('click', () => {
        // Toggle Active Class
        cards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');

        const skillKey = card.getAttribute('data-skill');
        const data = SKILLS_DATA[skillKey];
        if (!data) return;

        // Dynamic Elements Swap
        detailTitle.innerText = data.title;

        // Render Checklist items
        detailChecklist.innerHTML = '';
        data.checklist.forEach(item => {
          const li = document.createElement('li');
          li.innerText = item;
          detailChecklist.appendChild(li);
        });

        // Render Tool Badges
        detailTools.innerHTML = '';
        data.tools.forEach(tool => {
          const badge = document.createElement('span');
          badge.className = 'tool-badge';
          badge.innerText = tool;
          detailTools.appendChild(badge);
        });

        showToast(`Exposed skill capability: ${skillKey}`, 'primary');
      });
    });
  }
  ```

---

### 4.3 Prompt Synthesizer and Clipboard Logic

We will implement `initPromptSynthesizer()` to compile custom natural-language agent instructions dynamically based on selected goals (Exploration, Impact safety, AST Renames, Exception Debugging).

- **Logic Specification:**
  ```javascript
  function initPromptSynthesizer() {
    const selectGoal = document.getElementById('synth-goal');
    const groupConcept = document.getElementById('group-concept');
    const groupSymbol = document.getElementById('group-symbol');
    const groupNewname = document.getElementById('group-newname');
    const groupError = document.getElementById('group-error');

    const inputConcept = document.getElementById('synth-concept');
    const inputSymbol = document.getElementById('synth-symbol');
    const inputNewname = document.getElementById('synth-newname');
    const inputError = document.getElementById('synth-error');

    const outputPrompt = document.getElementById('prompt-output-text');
    const btnCopyPrompt = document.getElementById('btn-copy-prompt');

    function updateInputsDisplay() {
      const goal = selectGoal.value;
      
      // Reset displays
      groupConcept.style.display = 'none';
      groupSymbol.style.display = 'none';
      groupNewname.style.display = 'none';
      groupError.style.display = 'none';

      // Show relevant inputs per engineering goal
      if (goal === 'explore') {
        groupConcept.style.display = 'block';
      } else if (goal === 'impact') {
        groupSymbol.style.display = 'block';
      } else if (goal === 'rename') {
        groupSymbol.style.display = 'block';
        groupNewname.style.display = 'block';
      } else if (goal === 'debug') {
        groupSymbol.style.display = 'block';
        groupError.style.display = 'block';
      }

      synthesizePrompt();
    }

    function synthesizePrompt() {
      const goal = selectGoal.value;
      const concept = inputConcept.value.trim();
      const symbol = inputSymbol.value.trim();
      const newname = inputNewname.value.trim();
      const error = inputError.value.trim();
      
      let generatedText = '';

      if (goal === 'explore') {
        generatedText = `Onboard to this repository. Activate your \`gitnexus-exploring\` skill to check index freshness and run a semantic query for '${concept}'. Group your findings by Louvain processes, extract the top functional communities, and trace the primary entry-point execution flow step-by-step.`;
      } else if (goal === 'impact') {
        generatedText = `We need to analyze the architectural risk of modifying '${symbol}'. Activate your \`gitnexus-impact-analysis\` skill. Execute a \`gitnexus_impact\` upstream query up to a depth of 3 with a minimum confidence of 0.8. Assess the cumulative blast radius against the Risk Scale and wait for my explicit approval before making any code modifications.`;
      } else if (goal === 'rename') {
        generatedText = `We need to rename '${symbol}' to '${newname}' safely. Activate your \`gitnexus-refactoring\` skill. First, execute a dry-run rename with \`gitnexus_rename\` to preview the edits. Differentiate between precise Graph Edges and AST searches with confidence under 0.8. Check for any High/Critical risk callers, compile, and run process-specific tests once the rename is applied.`;
      } else if (goal === 'debug') {
        generatedText = `We are investigating an exception involving '${symbol}'. The error symptom is: '${error}'. Activate your \`gitnexus-debugging\` skill. Perform a conceptual search, inspect the 360-degree context of '${symbol}' to map all incoming callers and outgoing dependencies, trace the steps of its parent Process, and identify where the error is being thrown.`;
      }

      outputPrompt.innerText = generatedText;
    }

    // Input events bindings
    selectGoal.addEventListener('change', updateInputsDisplay);
    inputConcept.addEventListener('input', synthesizePrompt);
    inputSymbol.addEventListener('input', synthesizePrompt);
    inputNewname.addEventListener('input', synthesizePrompt);
    inputError.addEventListener('input', synthesizePrompt);

    // Copy trigger prompt to clipboard
    btnCopyPrompt.addEventListener('click', () => {
      const text = outputPrompt.innerText;
      navigator.clipboard.writeText(text).then(() => {
        showToast("Trigger prompt copied to clipboard!", "primary");
      }).catch(() => {
        showToast("Copy failed, please copy manually.", "secondary");
      });
    });

    // Run initial setup
    updateInputsDisplay();
  }
  ```

---

## 5. Verification Plan

A clean, rigorous step-by-step procedure has been compiled to verify these structural implementations post-implementation:

1. **Syntax Check & Build Verification:**
   - Pre-commit staged changes check:
     ```powershell
     git diff --stat
     ```
   - Ensure `ultimate_gitnexus_playbook.md` has zero remnants of Section 5 or KuzuDB properties.
   
2. **Dashboard SPA Layout Validation:**
   - Open `index.html` in an active browser.
   - Select the **"IDE Setup & Guides"** tab from the sidebar navigation. Check that the sidebar item highlights correctly and updates the Main Title and Subtitle dynamically.
   - Switch between **Cursor**, **Claude Code**, and **Windsurf** editor setups. Verify correct rules and configs display in copyable blocks.

3. **Interactivity Audit:**
   - Open the **Agent Skills Hub** page.
   - Click on the six distinct skills (`gitnexus-cli`, `gitnexus-exploring`, `gitnexus-impact-analysis`, etc.) and ensure the checklist items and tool badges swap flawlessly.
   - Interact with the **Prompt Synthesizer**: change goals and modify text fields. Check that high-density prompts adjust in the preview area instantly.
   - Click **Copy Prompt** and ensure a success toast flashes and clipboard captures text perfectly.
   
4. **Console Integrity Check:**
   - Right-click dashboard, select Inspect Element → Console.
   - Verify that no JavaScript runtime exceptions or undefined element errors are thrown.
