# Project: Wonderful Faraday Playbook & Dashboard

## Architecture
- **Documentation Layer:** `ultimate_gitnexus_playbook.md` - Technical engineering playbook manual.
- **Presentation Layer:** `index.html` - Premium glassmorphic web-based user interface.
- **Styling Layer:** `style.css` - Custom CSS design variables, layout structures, and responsive utilities.
- **Application Layer:** `app.js` - Client-side state, navigation routers, UI handlers, interactive CLI builders, and the prompt synthesizer.

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| 1 | Playbook Simplification & Skill Enrichment | Simplify playbook by removing KuzuDB schema internals and Cypher query guides. Add step-by-step IDE config guides for Cursor, Claude Code, Windsurf, and CLI reindexing. | None | DONE |
| 2 | Dashboard Layout, Navigation & Skills Hub UI | Replace KuzuDB query playground tab with glassmorphic "IDE Setup & Guides" tab. Highlight correct active navigation items. Add Interactive Skills Hub card toggles in app.js. | None | DONE |
| 3 | Interactive Prompt Synthesizer & Clipboard | Wire goal selector/details form to dynamically synthesize triggers for each IDE. Attach clipboard copying and toast notifications. | M2 | DONE |
| 4 | Verification & Forensic Audit | Run a complete round of validation (staged changes audit, no JS errors in console, layout compliance, Forensic Auditor Clean verdict). | M1, M2, M3 | DONE |


## Interface Contracts
### Dashboard UI ↔ Application Logic (`app.js` API)
- `initNavigation()`: Selects `.sidebar-nav .nav-item` elements and attaches event listeners to toggle `.playbook-section` active states. Syncs `#main-title` and `#main-subtitle`.
- `initAgentSkills()`: Toggles active skill cards under `.skills-grid` and updates `#detail-skill-title`, `#detail-skill-checklist`, `#detail-skill-tools` elements dynamically.
- `initPromptSynthesizer()`: Listens for goal/concept/symbol/error/newname input modifications and compiles high-density copyable agent instructions dynamically.
- `copyToClipboard(text)`: Animated toast clipboard mapping using `navigator.clipboard.writeText` and `showToast`.
