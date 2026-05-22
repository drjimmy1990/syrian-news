# Context — Codebase & Dependency Mapping

## Target Repository State
- **Workspace Path:** `C:\Users\LOQ\Documents\antigravity\wonderful-faraday`
- **Active Files:**
  - `ultimate_gitnexus_playbook.md` (87KB) - Playbook manual. Contains Section 5 (Advanced Custom Cypher Queries) which is to be removed/simplified, and Section 6 (Agent Skills) to be enriched.
  - `index.html` (49KB) - Main dashboard file. Contains navigation sidebar and several sections. Needs "Cypher Playground" replaced with "IDE Setup & Guides".
  - `style.css` (30KB) - Stylesheet. Needs premium glassmorphic styling for the new tabbed IDE setup guides.
  - `app.js` (31KB) - Dashboard interaction layer. Needs navigation listeners updated, Skills Hub toggles implemented, and Prompt Synthesizer wired.

## Dependency & Risk Analysis
- **High coupling in app.js / index.html:** Event listeners and selectors must exactly match. Replacing `.cypher-tab-btn` or `#cypher-section` elements requires careful updates in `app.js` to prevent JavaScript reference errors (`TypeError: Cannot read properties of null`).
- **No external servers:** All dashboard logic runs client-side. The prompt synthesizer and setup guides must be static/offline.
- **Copy-to-clipboard API compatibility:** Browser standard `navigator.clipboard.writeText` is used. Fallbacks should be verified.
- **No JavaScript errors:** If any script fails to initialize (e.g. because we removed an element that a function tried to query), the whole dashboard interaction might break. Ensure that `initCypherPlayground()` is completely removed or safely decoupled.
