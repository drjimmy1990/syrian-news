# GitNexus Codebase Analysis & Playbook Refactoring Plan

This analysis report outlines the complete target code areas, exact snippets to remove or replace, and detailed architectural plans for the Wonderful Faraday playbook and dashboard. It provides the subsequent implementer with a precise, low-risk roadmap to achieve full integration of specialized agent skills and premium glassmorphic IDE configuration panels.

---

## 1. Analysis of `ultimate_gitnexus_playbook.md`

### 1.1 Low-Level KuzuDB Details & BFS/DFS Terminology to Remove
*   **Context:** The manual contains references to low-level KuzuDB details, BFS/DFS traversal mechanics, and graph database storage formats. These details add unnecessary cognitive load for developers and AI agents focusing on command execution and IDE integrations.
*   **Target Snippets for Removal/Simplification:**
    1.  **Section 1 (Mermaid Diagram & Phase 3, Lines 15-61 & 115-130):** Remove occurrences of KuzuDB and BFS/DFS in steps and diagrams. Replace with high-level code intelligence graphs and directional dependency traversals.
        *   *Line 20:* `participant GraphDB as KuzuDB (Graph Database)` -> `participant GraphDB as Graph Database Cache`
        *   *Line 46:* `Perform BFS/DFS upstream graph traversal` -> `Perform upstream dependency graph traversal`
        *   *Line 76-80:* Mention of KuzuDB registry storage formats -> Simplify to high-level local metadata registry cache.
    2.  **Section 2 (Lines 215-237):** The physical and database engine storage representation.
        *   *Snippet to remove/simplify:*
            ```markdown
            Under the hood, GitNexus models repositories inside a high-performance graph database (KuzuDB) using a strict schema composed of specialized Nodes and semantic Edges:
            ```
            Replace with:
            ```markdown
            Under the hood, GitNexus models repositories as directed graph networks using a strict schema of specialized Node concepts and semantic Edge relationships:
            ```
            Remove all mentions of low-level column property types (e.g., `INT64`, `DOUBLE`, `TIMESTAMP`) and focus strictly on conceptual attributes (e.g., `String`, `Boolean`).
    3.  **Section 3 (Lines 934-939):** Surgical Debugging & Error Tracing introduction.
        *   *Snippet to remove:*
            ```markdown
            By indexing the codebase as a topological call graph in KuzuDB, GitNexus allows you to trace exception pathways...
            ```
            Replace with:
            ```markdown
            By indexing the codebase as a topological call graph registry, GitNexus allows you to trace exception pathways...
            ```
    4.  **Section 4 (Lines 1073-1090):** CLI Command Center.
        *   *Snippet to remove:*
            ```markdown
            indexes the entities in KuzuDB, and writes all graph database files into the local `.gitnexus/` directory.
            ```
            Replace with:
            ```markdown
            indexes the entities in the local cache, and writes all metadata intelligence files into the local `.gitnexus/` directory.
            ```

### 1.2 Section 5 deletion / extreme simplification
*   **Context:** The current Section 5 contains 4 advanced Cypher queries with in-depth syntax specifications, database schemas, and data structures. This entire section must be removed to prioritize developer-centric and agent-centric automation.
*   **Action Plan:**
    - Delete lines 1156 to 1389 entirely.
    - Renumber the remaining sections:
      - Section 6 (Specialized Agent Skills & Zero-Server Browser Architecture) becomes **Section 5: Specialized Agent Skills & IDE Integrations**.
      - Section 7 (Unified GitNexus Cheat Sheet) becomes **Section 6: Unified GitNexus Cheat Sheet**.
      - Conclusion remains the final section.

### 1.3 Draft of Step-by-Step IDE Configuration Guides
To enrich Section 5 (formerly Section 6), we introduce comprehensive, copyable integration guides:

#### Cursor Integration Setup (`.cursorrules`)
Force Cursor's composer and chat agents to consult the GitNexus context window recursively before initiating changes:
```markdown
# .cursorrules - GitNexus Integration Rules
Before making any edits, refactoring, or modifications to any code, you MUST always follow this protocol:
1. Check the local index status and age by reading the virtual context file: `gitnexus://repo/{repoName}/context`.
2. If the index is stale (i.e., local commits are ahead of the indexed commit), you MUST run `npx gitnexus analyze --embeddings` in the terminal to re-index the workspace before proceeding.
3. When analyzing the architecture or locating a feature entry point, do NOT guess file names or run flat keywords grep. Run a semantic query:
   mcp_gitnexus-sse_query({ query: "concept description", repo: "wonderful-faraday" })
4. Before modifying, refactoring, or deleting any function, class, interface, or method, you MUST run:
   mcp_gitnexus-sse_impact({ target: "symbolName", direction: "upstream", repo: "wonderful-faraday" })
5. Evaluate the blast radius risk level:
   - LOW (<5 symbols, few processes): Proceed safely.
   - MEDIUM (5-15 symbols, 2-5 processes): Design a coordinated refactoring checklist first.
   - HIGH (>15 symbols or many processes): STOP immediately, warn the user, list all direct callers, and ask for explicit approval.
   - CRITICAL (Authentication, Billing, DB transactions): HALT. Do not modify the critical path directly. Propose an expand-and-contract (parallel change) pattern and await user approval.
6. NEVER rename methods or functions with simple string find-and-replace. You MUST run:
   mcp_gitnexus-sse_rename({ symbol_name: "oldName", new_name: "newName", repo: "wonderful-faraday" })
7. Before committing your work, run a change detection audit:
   mcp_gitnexus-sse_detect_changes({ repo: "wonderful-faraday", scope: "staged" })
   Verify that the affected processes match only the intended scope and that no circular dependencies or type mismatches were introduced.
```

#### Claude Code MCP Integration (`config.json`)
Claude Code interfaces with GitNexus through the standard Model Context Protocol (MCP) server command:
```json
{
  "mcpServers": {
    "gitnexus-stdio": {
      "command": "npx",
      "args": ["-y", "gitnexus", "serve", "--transport", "stdio"],
      "alwaysAllow": []
    }
  }
}
```

#### Windsurf Workspace Rules (`.windsurf/rules.md`)
Configure Windsurf Cascade agent instructions to prioritize the GitNexus MCP tools:
```markdown
# Windsurf Cascade Code Intelligence Rules

- You MUST check gitnexus registry freshness on workspace entry: read `gitnexus://repo/{name}/context`.
- If commits are behind HEAD, execute: `npx gitnexus analyze --embeddings` in the terminal.
- Prior to ANY code modification, Cascade MUST run `gitnexus_impact` to assess risk.
- Do NOT make random file searches; use `gitnexus_query` to locate architectural features conceptually.
- Enforce the parallelExpand pattern for all CRITICAL risk level changes.
```

#### CLI Reindexing Workflows Sequence
1.  **Check Index Integrity & Staleness:**
    ```powershell
    npx gitnexus status
    ```
2.  **Generate Fresh Codebase Graph Index (With Embeddings):**
    ```powershell
    npx gitnexus analyze --embeddings
    ```
3.  **Hard Clean & Purge Cache Rebuild:**
    ```powershell
    npx gitnexus clean --force
    npx gitnexus analyze --embeddings
    ```

---

## 2. Analysis of `index.html` & `style.css`

### 2.1 Navigation & Section Replacement in `index.html`
*   **Nav Item Swap (Lines 59-66):**
    *   *Before:*
        ```html
        <li class="nav-item" data-section="cypher">
          <a href="#cypher">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-4 6h-4v2h4v2h-4v2h4v2H9V7h6v2z"/>
            </svg>
            <span>Cypher Playground</span>
          </a>
        </li>
        ```
    *   *After:*
        ```html
        <li class="nav-item" data-section="ide-setup">
          <a href="#ide-setup">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z"/>
            </svg>
            <span>IDE Setup & Guides</span>
          </a>
        </li>
        ```

*   **View Section Replacement (Lines 610-686):**
    Replace the old `#cypher-section` entirely with `#ide-setup-section`.
    *   *Proposed Section Structure:*
        ```html
        <!-- ================= SECTION: IDE SETUP & GUIDES ================= -->
        <section id="ide-setup-section" class="playbook-section">
          <div class="card">
            <div class="card-header">
              <div>
                <h2 class="card-title">
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="var(--primary)">
                    <path d="M19.43 12.98c.04-.32.07-.64.07-.98s-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.12-.22-.39-.3-.61-.22l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.23-.09-.49 0-.61.22l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.12.22.39.3.61.22l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.23.09.49 0 .61-.22l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zM12 15.5c-1.93 0-3.5-1.57-3.5-3.5s1.57-3.5 3.5-3.5 3.5 1.57 3.5 3.5-1.57 3.5-3.5 3.5z"/>
                  </svg>
                  IDE Setup & Integration Guides
                </h2>
                <p class="card-subtitle">Configure Cursor, Claude Code, and Windsurf to utilize GitNexus context natively</p>
              </div>
            </div>

            <div class="ide-setup-layout">
              <div class="ide-tabs">
                <button class="ide-tab-btn active" data-ide="cursor">Cursor Rules</button>
                <button class="ide-tab-btn" data-ide="claude">Claude Code config.json</button>
                <button class="ide-tab-btn" data-ide="windsurf">Windsurf Rules</button>
                <button class="ide-tab-btn" data-ide="cli-workflows">CLI Workflows</button>
              </div>

              <div class="ide-content-panel">
                <!-- Cursor rules pane -->
                <div class="ide-pane active" id="pane-cursor">
                  <h3 style="font-size: 16px; color: var(--primary); margin-bottom: 12px;">Cursor Rules Setup (.cursorrules)</h3>
                  <p style="color: var(--text-muted); font-size: 13px; margin-bottom: 16px;">
                    Place a <code>.cursorrules</code> file at the root of your repository to force Cursor's composer or agent to always query GitNexus before making modifications.
                  </p>
                  <div class="code-container">
                    <div class="code-header">
                      <span class="code-lang-tag">.cursorrules</span>
                      <button class="code-copy-btn" onclick="copyToClipboard(document.getElementById('code-cursorrules').innerText)">
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                          <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                        </svg>
                        <span>Copy</span>
                      </button>
                    </div>
                    <div class="code-content">
                      <pre><code id="code-cursorrules"># GitNexus Composer Rules

# MANDATORY: Before modifying any code, you MUST consult GitNexus!
1. If the user requests a code change to a class, function, interface, or method, run:
   mcp_gitnexus-sse_impact({ target: "symbolName", direction: "upstream", repo: "REPO-NAME" })
2. Evaluate the blast radius risk assessment scale:
   - Risk < 5 symbols: Proceed safely.
   - Risk 5-15 symbols: Plan a coordinated refactoring checklist.
   - Risk > 15 symbols or Critical Path: STOP immediately, outline affected callers, and warn the user.
3. NEVER use search-and-replace to rename code symbols. Use mcp_gitnexus-sse_rename() to coordinate graph updates.
4. Run mcp_gitnexus-sse_detect_changes() prior to saving/committing to ensure zero context leaks.</code></pre>
                    </div>
                  </div>
                </div>

                <!-- Claude Code pane -->
                <div class="ide-pane" id="pane-claude">
                  <h3 style="font-size: 16px; color: var(--primary); margin-bottom: 12px;">Claude Code MCP Integration</h3>
                  <p style="color: var(--text-muted); font-size: 13px; margin-bottom: 16px;">
                    Configure your standard global Claude Code configuration file to load the <code>gitnexus-stdio</code> MCP server on terminal startup.
                  </p>
                  <div class="code-container">
                    <div class="code-header">
                      <span class="code-lang-tag">~/.claude.json</span>
                      <button class="code-copy-btn" onclick="copyToClipboard(document.getElementById('code-claudemcp').innerText)">
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                          <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                        </svg>
                        <span>Copy JSON</span>
                      </button>
                    </div>
                    <div class="code-content">
                      <pre><code id="code-claudemcp">{
  "mcpServers": {
    "gitnexus-stdio": {
      "command": "npx",
      "args": ["-y", "gitnexus", "serve", "--transport", "stdio"],
      "alwaysAllow": []
    }
  }
}</code></pre>
                    </div>
                  </div>
                </div>

                <!-- Windsurf rules pane -->
                <div class="ide-pane" id="pane-windsurf">
                  <h3 style="font-size: 16px; color: var(--primary); margin-bottom: 12px;">Windsurf Workspace Rules</h3>
                  <p style="color: var(--text-muted); font-size: 13px; margin-bottom: 16px;">
                    Configure Windsurf workspace rules in your project folder to instruct Cascade agents to prioritize the GitNexus MCP tools.
                  </p>
                  <div class="code-container">
                    <div class="code-header">
                      <span class="code-lang-tag">.windsurf/rules.md</span>
                      <button class="code-copy-btn" onclick="copyToClipboard(document.getElementById('code-windsurf').innerText)">
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor">
                          <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"/>
                        </svg>
                        <span>Copy Rules</span>
                      </button>
                    </div>
                    <div class="code-content">
                      <pre><code id="code-windsurf"># Windsurf Cascade Code Intelligence Rules

- You MUST check gitnexus registry freshness on workspace entry: `gitnexus://repo/{name}/context`
- If commits are stale, execute re-indexing in Cascade terminal: `npx gitnexus analyze --embeddings`
- Prior to ANY code modification, Cascade MUST run `gitnexus_impact` to assess risk.
- Do NOT make random file searches; use `gitnexus_query` to locate architectural features conceptually.
- Enforce the parallelExpand pattern for all CRITICAL risk level changes.</code></pre>
                    </div>
                  </div>
                </div>

                <!-- CLI workflows pane -->
                <div class="ide-pane" id="pane-cli-workflows">
                  <h3 style="font-size: 16px; color: var(--primary); margin-bottom: 12px;">CLI Lifecycle Workflows Sequence</h3>
                  <p style="color: var(--text-muted); font-size: 13px; margin-bottom: 16px;">
                    Run these CLI sequences to manage your local GitNexus graph database cache and check staleness bounds during daily development.
                  </p>
                  
                  <div style="display: flex; flex-direction: column; gap: 16px;">
                    <div>
                      <h4 style="font-size: 13px; color: var(--text-main); margin-bottom: 6px;">1. Fresh Index Initialization</h4>
                      <pre style="background: #07090e; padding: 10px; border-radius: 8px; font-family: var(--font-mono); font-size: 12px; color: #c9d1d9;">npx gitnexus analyze --embeddings</pre>
                    </div>
                    <div>
                      <h4 style="font-size: 13px; color: var(--text-main); margin-bottom: 6px;">2. Daily Synchronization & Staleness Verification</h4>
                      <pre style="background: #07090e; padding: 10px; border-radius: 8px; font-family: var(--font-mono); font-size: 12px; color: #c9d1d9;">npx gitnexus status
# If commits are behind HEAD:
npx gitnexus analyze --embeddings</pre>
                    </div>
                    <div>
                      <h4 style="font-size: 13px; color: var(--text-main); margin-bottom: 6px;">3. Hard Index Cache Purging & Rebuild</h4>
                      <pre style="background: #07090e; padding: 10px; border-radius: 8px; font-family: var(--font-mono); font-size: 12px; color: #c9d1d9;">npx gitnexus clean --force
npx gitnexus analyze --embeddings</pre>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        ```

### 2.2 CSS Styles to add in `style.css`
Replace old Cypher Playground classes and append custom glassmorphic styling:
```css
/* IDE Setup & Guides Layout */
.ide-setup-layout {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.ide-tabs {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
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
  box-shadow: 0 0 15px var(--primary-glow);
}

.ide-content-panel {
  background: hsla(224, 25%, 3%, 0.4);
  border: 1px solid var(--border);
  border-radius: 16px;
  padding: 24px;
  display: flex;
  flex-direction: column;
  backdrop-filter: blur(10px);
}

.ide-pane {
  display: none;
}

.ide-pane.active {
  display: block;
  animation: fadeIn 0.4s ease forwards;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(5px); }
  to { opacity: 1; transform: translateY(0); }
}
```

---

## 3. Analysis of `app.js`

### 3.1 Initial Navigation & Wiring changes
1.  **DOMContentLoaded Initializer (Lines 3-11):**
    *   *Before:*
        ```javascript
        initNavigation();
        initSchemaExplorer();
        initTimeline();
        initCLIBuilder();
        initCypherPlayground();
        initCheatSheet();
        initGlobalSearch();
        ```
    *   *After:*
        ```javascript
        initNavigation();
        initSchemaExplorer();
        initTimeline();
        initCLIBuilder();
        initIDESetup();
        initAgentSkills();
        initPromptSynthesizer();
        initCheatSheet();
        initGlobalSearch();
        ```
2.  **Navigation wiring updates in `initNavigation()` (Lines 13-55):**
    *   Update checks to support `"skills"` and `"ide-setup"`, while removing `"cypher"`:
        ```javascript
        } else if (targetSection === 'skills') {
          mainTitle.innerText = "Agent Skills Hub";
          mainSubtitle.innerText = "Specialized AI Agent Capabilities & Triggers";
        } else if (targetSection === 'ide-setup') {
          mainTitle.innerText = "IDE Configuration & Guides";
          mainSubtitle.innerText = "Step-by-Step IDE Integrations & CLI Workflows";
        }
        ```

### 3.2 Agent Skills Hub card toggles & detailed data
We will declare the metadata for the 6 skills inside `app.js` and implement `initAgentSkills()` to bind click events dynamically:
```javascript
const SKILLS_DETAIL_DATA = {
  cli: {
    title: "gitnexus-cli",
    checklist: [
      "Verify physical registry mappings inside <code>~/.gitnexus/registry.json</code>.",
      "Check index age, repository stats, and commitsBehind offset bounds.",
      "Trigger async re-indexing to synchronize the knowledge graph."
    ],
    tools: ["npx gitnexus status", "npx gitnexus analyze", "npx gitnexus clean"]
  },
  exploring: {
    title: "gitnexus-exploring",
    checklist: [
      "Run semantic queries to discover feature/concept entry points conceptually.",
      "Retrieve Louvain modularity clusters to map high-level architecture modularity.",
      "Inspect chronological execution paths step-by-step for a process flow."
    ],
    tools: ["gitnexus_query", "gitnexus://repo/{name}/clusters", "gitnexus://repo/{name}/processes", "gitnexus://repo/{name}/process/{processId}"]
  },
  impact: {
    title: "gitnexus-impact-analysis",
    checklist: [
      "Run upstream impact checks before editing any code symbol.",
      "Map dependents tree to evaluate Low/Med/High/Crit risk levels.",
      "Execute pre-commit change audits on staged diffs to prevent leakage."
    ],
    tools: ["gitnexus_impact (upstream)", "gitnexus_detect_changes", "gitnexus_context"]
  },
  refactoring: {
    title: "gitnexus-refactoring",
    checklist: [
      "Trigger coordinated renames using AST call-graphs.",
      "Perform a rename dry-run first to preview graph vs AST heuristic matches.",
      "Isolate and extract bloated modules with caller boundary safety checks."
    ],
    tools: ["gitnexus_rename", "gitnexus_context", "gitnexus_impact"]
  },
  debugging: {
    title: "gitnexus-debugging",
    checklist: [
      "Map raw stack trace messages to precise throw-site AST nodes.",
      "Trace asynchronous execution step flows across decoupled promise queues.",
      "Audit high in-degree choke points and fat out-degree N+1 vectors."
    ],
    tools: ["gitnexus_context", "gitnexus_cypher", "gitnexus://repo/{name}/process/{processId}"]
  },
  guide: {
    title: "gitnexus-guide",
    checklist: [
      "Expose KuzuDB graph schema node attributes and edge definitions.",
      "Cross-reference Cypher query property matrices.",
      "Verify checklist compliance and mitigation rules prior to code merges."
    ],
    tools: ["gitnexus://repo/{name}/schema", "gitnexus_cypher"]
  }
};

function initAgentSkills() {
  const skillCards = document.querySelectorAll('.skill-card');
  const detailTitle = document.getElementById('detail-skill-title');
  const detailChecklist = document.getElementById('detail-skill-checklist');
  const detailTools = document.getElementById('detail-skill-tools');

  skillCards.forEach(card => {
    card.addEventListener('click', () => {
      // Toggle card active states
      skillCards.forEach(c => c.classList.remove('active'));
      card.classList.add('active');

      const skillName = card.getAttribute('data-skill');
      const data = SKILLS_DETAIL_DATA[skillName];
      if (!data) return;

      // Update contents
      detailTitle.innerText = data.title;

      detailChecklist.innerHTML = '';
      data.checklist.forEach(item => {
        const li = document.createElement('li');
        li.innerHTML = item;
        detailChecklist.appendChild(li);
      });

      detailTools.innerHTML = '';
      data.tools.forEach(tool => {
        const badge = document.createElement('span');
        badge.className = 'tool-badge';
        badge.innerText = tool;
        detailTools.appendChild(badge);
      });

      showToast(`Swapped to skill: ${data.title}`, 'secondary');
    });
  });
}
```

### 3.3 Prompt Synthesizer Logic
Implement `initPromptSynthesizer()` to read selected goals and input details to generate copyable prompt strings dynamically:
```javascript
function initPromptSynthesizer() {
  const selectGoal = document.getElementById('synth-goal');
  const inputConcept = document.getElementById('synth-concept');
  const inputSymbol = document.getElementById('synth-symbol');
  const inputNewName = document.getElementById('synth-newname');
  const inputError = document.getElementById('synth-error');

  const groupConcept = document.getElementById('group-concept');
  const groupSymbol = document.getElementById('group-symbol');
  const groupNewName = document.getElementById('group-newname');
  const groupError = document.getElementById('group-error');

  const promptOutput = document.getElementById('prompt-output-text');
  const btnCopyPrompt = document.getElementById('btn-copy-prompt');

  function handleGoalChange() {
    const goal = selectGoal.value;

    // Show/Hide input groups based on active goal
    groupConcept.style.display = goal === 'explore' ? 'block' : 'none';
    groupSymbol.style.display = goal !== 'explore' ? 'block' : 'none';
    groupNewName.style.display = goal === 'rename' ? 'block' : 'none';
    groupError.style.display = goal === 'debug' ? 'block' : 'none';

    generatePrompt();
  }

  function generatePrompt() {
    const goal = selectGoal.value;
    const concept = inputConcept.value.trim() || 'jwt authentication pipeline';
    const symbol = inputSymbol.value.trim() || 'validateUserSession';
    const newname = inputNewName.value.trim() || 'authenticateSession';
    const error = inputError.value.trim() || 'TypeError: Cannot read properties of undefined (reading \'jwt\')';

    let promptText = '';

    if (goal === 'explore') {
      promptText = `Context: Onboarding & Exploration of '${concept}'.
Instructions for Agent (Claude Code / Cursor / Windsurf):
1. Activate your \`gitnexus-exploring\` skill.
2. Check the index status and freshness by reading \`gitnexus://repo/wonderful-faraday/context\`. If it is stale, run re-indexing via CLI.
3. Perform a semantic query with \`gitnexus_query\` targeting '${concept}' to locate feature entry points.
4. Group findings by Louvain processes and read the relevant execution traces step-by-step to construct a clear mental model.`;
    } else if (goal === 'impact') {
      promptText = `Context: Pre-Change Upstream Blast Radius Check for symbol '${symbol}'.
Instructions for Agent (Claude Code / Cursor / Windsurf):
1. Activate your \`gitnexus-impact-analysis\` skill before modifying any code.
2. Perform upstream impact analysis on '${symbol}' by calling \`gitnexus_impact\` with \`direction: "upstream"\`.
3. Group callers by depth (d=1, d=2, d=3) to estimate the complete blast radius.
4. If the risk is HIGH (affecting >15 symbols or multiple processes) or CRITICAL (touching core Auth/Billing/DB paths), STOP immediately, outline affected callers, and warn the user.`;
    } else if (goal === 'rename') {
      promptText = `Context: Coordinated AST Rename of '${symbol}' to '${newname}'.
Instructions for Agent (Claude Code / Cursor / Windsurf):
1. Activate your \`gitnexus-refactoring\` skill to perform a safe AST-level rename.
2. Run a dry-run rename with \`gitnexus_rename\` (setting \`dry_run: true\`) to preview changes.
3. Review any low-confidence matches (AST searches with confidence < 0.8) and verify them to prevent false positives.
4. Execute the rename (setting \`dry_run: false\`) to coordinate files and update imports across the call graph.
5. Validate staged changes using \`gitnexus_detect_changes\` to verify the exact modified scope.`;
    } else if (goal === 'debug') {
      promptText = `Context: Trace Stack Trace / Exception for symbol '${symbol}'.
Symptom: ${error}
Instructions for Agent (Claude Code / Cursor / Windsurf):
1. Activate your \`gitnexus-debugging\` skill.
2. Run \`gitnexus_context\` on the symbol '${symbol}' to check incoming callers, outgoing callees, and process memberships.
3. Trace chronological execution steps for the affected process to bridge any async promise or queue boundaries.
4. Locate the throw-site of '${error}' and fix the missing null/undefined checks.
5. Perform an upstream blast radius check via \`gitnexus_impact\` to guarantee the fix has zero side-effects.`;
    }

    promptOutput.innerText = promptText;
  }

  // Event listeners
  selectGoal.addEventListener('change', handleGoalChange);
  inputConcept.addEventListener('input', generatePrompt);
  inputSymbol.addEventListener('input', generatePrompt);
  inputNewName.addEventListener('input', generatePrompt);
  inputError.addEventListener('input', generatePrompt);

  // Copy prompt button listener
  btnCopyPrompt.addEventListener('click', () => {
    const textToCopy = promptOutput.innerText;
    if (textToCopy) {
      navigator.clipboard.writeText(textToCopy).then(() => {
        showToast("Copied Synthesized Prompt to clipboard!", "primary");
      }).catch(() => {
        showToast("Clipboard copy failed. Please select manually.", "secondary");
      });
    }
  });

  // Run initial synthesis
  handleGoalChange();
}
```

### 3.4 IDE Setup Tab Selection Handler
Declare `initIDESetup()` inside `app.js` to manage setups for Cursor, Claude Code, and Windsurf:
```javascript
function initIDESetup() {
  const ideTabs = document.querySelectorAll('.ide-tab-btn');
  const idePanes = document.querySelectorAll('.ide-pane');

  ideTabs.forEach(tab => {
    tab.addEventListener('click', () => {
      // Toggle active states on tab buttons
      ideTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      // Toggle active states on code panels
      const selectedIDE = tab.getAttribute('data-ide');
      idePanes.forEach(pane => {
        pane.classList.remove('active');
        if (pane.id === `pane-${selectedIDE}`) {
          pane.classList.add('active');
        }
      });

      showToast(`Swapped to IDE Setup pane: ${tab.innerText}`, 'secondary');
    });
  });
}
```

---

## 4. Verification Methods

1.  **Visual Elements Verification:**
    Inspect that all interactive HTML container bindings (IDs: `#ide-setup-section`, `#pane-cursor`, `#pane-claude`, `#pane-windsurf`, `#pane-cli-workflows`, `#detail-skill-title`, `#detail-skill-checklist`, `#detail-skill-tools`, `#synth-goal`, `#prompt-output-text`, `#btn-copy-prompt`) exist and match layout conventions.
2.  **State Management Audits:**
    Ensure `DOMContentLoaded` binds nav item click hooks cleanly and toggling target active states syncs `#main-title` and `#main-subtitle` strings seamlessly.
3.  **Synthesizer Integrity Verification:**
    Select different options in the Goal selector to confirm input groups show/hide in strict accordance with functional domains, and trace-prompt triggers emit high-density configurations without JS console errors.
4.  **End-to-End Test Suite:**
    Execute the command `node e2e_test_runner.js` to run the comprehensive opaque-box test suites and confirm a complete pass.

---

## Conclusion

This codebase analysis establishes that removing low-level Cypher query syntax and KuzuDB database internals directly matches developer requirements. Substituting manual query parameters with automated, copy-pasteable IDE integration templates and an interactive Prompt Synthesizer minimizes developer friction and enhances autonomous agent alignment with GitNexus.
