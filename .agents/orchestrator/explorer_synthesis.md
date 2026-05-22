# Explorer Synthesis — Code Transition Roadmap

This document aggregates the codebase exploration and refactoring plans delivered by the Explorer subagents (Explorer 1 and Explorer 3).

## Consensus
Both explorers reached absolute consensus on the following target areas and transformation strategies:
1. **Playbook Simplification (`ultimate_gitnexus_playbook.md`):**
   - **Excision of Section 5:** The entire section (lines 1156–1389) containing raw manual KuzuDB Cypher queries is out of scope and must be completely removed.
   - **Excising low-level internals:** Replace database physical terminology with abstract AST conceptual terms:
     - Remove mentions of "KuzuDB Edge property types".
     - Replace "KuzuDB (Graph Database)" and "Semantic Embeddings Store" in Section 1's Mermaid sequence diagram with high-level conceptual engine participants.
     - Simplify terminology around BFS/DFS upstream traversals and Louvain Modularity algorithms to AST caller/callee mappings and community grouping.
2. **IDE Configurations (Section 6):**
   - **Cursor:** Provide `.cursorrules` targeting automated GitNexus consultation and impact queries.
   - **Claude Code:** Expose the `config.json` containing the global stdio command wrapper.
   - **Windsurf:** Expose the `.windsurfrules` capturing workspace rules and AST-guided rename instructions.
   - **CLI Workflows:** Expose clean command-line sequences for status auditing and `--embeddings` re-indexing.
3. **Dashboard HTML Replacement (`index.html`):**
   - Replace the old sidebar list item referencing `cypher` with `ide-setup` (incorporating a clean code brackets SVG icon).
   - Replace the entire `#cypher-section` card with `#ide-setup-section` incorporating tabbed layouts for Cursor, Claude Code, and Windsurf, along with copyable rules and config boxes.
4. **CSS Stylesheet Cleanups (`style.css`):**
   - Excise all old classes targeting the Cypher Playground layout (`.cypher-playground-layout`, `.cypher-tabs`, etc.).
   - Introduce premium glassmorphic styling declarations for the new IDE setup tabs, description panels, and styled code pre/code tags.
5. **Application Core Logic (`app.js`):**
   - Update `initNavigation()` to support `'ide-setup'` instead of `'cypher'`.
   - Safely remove the obsolete `initCypherPlayground()` and prevent DOM reference exceptions.
   - Implement the complete dynamic logic for `initAgentSkills()` mapping card clicks to the 6 specialized skills, updating the checklist and utilized tools list dynamically.
   - Implement `initPromptSynthesizer()` mapping goal changes to relevant textboxes and dynamically generating instruction strings copyable to the clipboard.

## Resolved Conflicts
No conflicts were identified. Both Explorer 1 and Explorer 3 recommended the exact same structural layouts, element naming conventions, and JavaScript event listeners, ensuring perfect consistency.

## Dissenting Views
None.

## Gaps
Both explorers noted that since the workspace operates purely as a static single-page application (SPA), the clipboard copy feature relies on standard `navigator.clipboard.writeText` and custom `showToast()` triggers. The implementer must ensure `showToast` is properly called in both the IDE guides blocks and the prompt synthesizer without console warnings.
