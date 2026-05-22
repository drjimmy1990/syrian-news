# Test Readiness & E2E Test Suite Specifications

This document declares that the end-to-end (E2E) testing infrastructure for the Wonderful Faraday Playbook & Dashboard is complete, verified, and ready for continuous integration loops.

## Test Philosophy
- **Opaque-Box & Native Node.js Execution:** We validate source files (`ultimate_gitnexus_playbook.md`, `index.html`, `style.css`, `app.js`) directly by analyzing content semantic boundaries, syntax, structure, DOM mocks, and interactive triggers without external third-party dependencies (such as npm packages or heavy browser runners).
- **Test-Driven Design (TDD):** Every requirement from the original specification is mapped to exact programmatic assertions. The test suite initially fails (38 failures out of 71) on the unimplemented changes and will compile with zero errors once other developers complete the presentation and playbook updates.

## How to Execute the Test Runner

The test suite runs natively on Node.js. Execute the following command from the repository root:

```powershell
node e2e_test_runner.js
```

### Pass/Fail Semantics:
- **Exits with Code `0`:** When all 71 test cases successfully pass.
- **Exits with Code `1`:** When any test case fails, printing detailed, colorized trace logs and the exact error condition.

---

## Test Inventory & Coverage Catalog (71 Total Cases)

### Tier 1: Feature Coverage (30 Tests)
*Verifies happy-path implementations and exact original requirements.*

1. **Playbook Simplification (`T1_PB_SIMP_1` - `T1_PB_SIMP_5`)**:
   - `T1_PB_SIMP_1`: Checks that raw KuzuDB schema details are removed from `ultimate_gitnexus_playbook.md`.
   - `T1_PB_SIMP_2`: Checks that BFS/DFS graph traversals are simplified or removed from the playbook.
   - `T1_PB_SIMP_3`: Checks that the "Advanced Cypher Queries" section is removed or simplified.
   - `T1_PB_SIMP_4`: Verifies that the playbook maintains clear natural language explanations of graph-based concepts without raw DB details.
   - `T1_PB_SIMP_5`: Checks that the playbook maintains a valid Markdown structure with standard heading levels.
2. **Playbook IDE Setup Guides (`T1_PB_IDE_1` - `T1_PB_IDE_5`)**:
   - `T1_PB_IDE_1`: Section 6 contains Cursor IDE configuration with `.cursorrules` details.
   - `T1_PB_IDE_2`: Section 6 contains Claude Code configuration with `config.json` and MCP commands.
   - `T1_PB_IDE_3`: Section 6 contains Windsurf IDE configuration with workspace rules.
   - `T1_PB_IDE_4`: Section 6 contains CLI Workflows for index management and staleness audits.
   - `T1_PB_IDE_5`: Configuration setup blocks contain proper code fence displays.
3. **Dashboard IDE Setup Tab (`T1_DB_IDE_1` - `T1_DB_IDE_5`)**:
   - `T1_DB_IDE_1`: Verifies that `index.html` has an `ide-setup` section instead of a `cypher` section.
   - `T1_DB_IDE_2`: Checks that `index.html` defines tabs for Cursor, Claude Code, and Windsurf within the IDE setup view.
   - `T1_DB_IDE_3`: Verifies that `index.html` has copyable code blocks or textarea snippets for each IDE setup configuration.
   - `T1_DB_IDE_4`: Checks that glassmorphic styles are present in `style.css` matching the new premium IDE Setup container classes.
   - `T1_DB_IDE_5`: Checks that `app.js` registers listeners or toggles for the IDE sub-tabs (Cursor, Claude Code, Windsurf).
4. **Sidebar Navigation & Sync (`T1_NAV_SYNC_1` - `T1_NAV_SYNC_5`)**:
   - `T1_NAV_SYNC_1`: Verifies that the sidebar nav list in `index.html` has `data-section="ide-setup"`.
   - `T1_NAV_SYNC_2`: Checks that the sidebar nav list in `index.html` has `data-section="skills"`.
   - `T1_NAV_SYNC_3`: Checks that `app.js` navigation syncs active tab highlight state correctly.
   - `T1_NAV_SYNC_4`: Selecting "skills" navigates correctly and syncs main title and subtitle.
   - `T1_NAV_SYNC_5`: Selecting "ide-setup" navigates correctly and syncs main title and subtitle.
5. **Skills Hub Card Toggles (`T1_SKILLS_1` - `T1_SKILLS_5`)**:
   - `T1_SKILLS_1`: index.html defines interactive Agent Skills selection cards grid.
   - `T1_SKILLS_2`: index.html defines skill card details placeholders (#detail-skill-title, #detail-skill-checklist, #detail-skill-tools).
   - `T1_SKILLS_3`: app.js implements initAgentSkills function to bind active toggles.
   - `T1_SKILLS_4`: app.js maintains dynamic state structures containing tool descriptions for 6 skills.
   - `T1_SKILLS_5`: Clicking card dynamically alters card active states and swaps details.
6. **Prompt Synthesizer & Clipboard (`T1_SYNTH_1` - `T1_SYNTH_5`)**:
   - `T1_SYNTH_1`: index.html defines synthesizer form items and goal selector.
   - `T1_SYNTH_2`: app.js implements `initPromptSynthesizer` function.
   - `T1_SYNTH_3`: Synthesizer dynamically generates comprehensive multi-line prompt block based on concept and symbol inputs.
   - `T1_SYNTH_4`: Clipboard copy functionality hooks properly and triggers toast notification.
   - `T1_SYNTH_5`: No Javascript syntax errors are present in app.js.

### Tier 2: Boundary & Corner Cases (30 Tests)
*Validates edge states, empty arguments, invalid routes, and format boundaries.*

1. **Playbook Simplification Corners (`T2_PB_SIMP_1` - `T2_PB_SIMP_5`)**:
   - `T2_PB_SIMP_1`: Pruning leaves no orphan references or figures referencing old databases.
   - `T2_PB_SIMP_2`: Playbook completely removes the term "KuzuDB" from Section 6 completely.
   - `T2_PB_SIMP_3`: Checks that no orphan Cypher code blocks are left in the entire playbook.
   - `T2_PB_SIMP_4`: Title headings for Section 6 align exactly with new standardized specifications.
   - `T2_PB_SIMP_5`: Checks for malformed lists and orphan formatting brackets in modified files.
2. **Playbook IDE Guides Corners (`T2_PB_IDE_1` - `T2_PB_IDE_5`)**:
   - `T2_PB_IDE_1`: Cursor guides detail correct `.cursorrules` directory placement.
   - `T2_PB_IDE_2`: Claude Code guide correctly warns about stdio transport arguments.
   - `T2_PB_IDE_3`: Windsurf guide outlines setting workspace rules dynamically.
   - `T2_PB_IDE_4`: CLI Guides detail exact re-indexing parameters in recovery scenarios.
   - `T2_PB_IDE_5`: JSON structures in configurations are syntactically valid.
3. **IDE Setup Tab Corners (`T2_DB_IDE_1` - `T2_DB_IDE_5`)**:
   - `T2_DB_IDE_1`: IDE Setup snippets are pre-populated with reasonable default settings.
   - `T2_DB_IDE_2`: Defensive checks set Cursor sub-tab active on default workspace load.
   - `T2_DB_IDE_3`: style.css defines custom rules for scrollable textarea snippets to prevent overflow.
   - `T2_DB_IDE_4`: index.html contains zero duplicate ID elements for newly introduced IDE tab panels.
   - `T2_DB_IDE_5`: Interactive click handlers are defensive and check elements presence before modifying classes.
4. **Sidebar Navigation Corners (`T2_NAV_SYNC_1` - `T2_NAV_SYNC_5`)**:
   - `T2_NAV_SYNC_1`: URL hashes falling back safely to overview when unknown section is targeted.
   - `T2_NAV_SYNC_2`: Active class removal loops do not crash when nav elements list is empty.
   - `T2_NAV_SYNC_3`: Header title sync queries target nodes safely.
   - `T2_NAV_SYNC_4`: Repeated quick clicks on sidebar items do not lead to listener double-binding.
   - `T2_NAV_SYNC_5`: Transitions for responsive grid layout classes compile smoothly.
5. **Skills Hub Corners (`T2_SKILLS_1` - `T2_SKILLS_5`)**:
   - `T2_SKILLS_1`: Hub displays clean placeholder content if skill arrays are missing tools.
   - `T2_SKILLS_2`: Cards handle clicking safely even if missing custom attributes.
   - `T2_SKILLS_3`: Active skill card selection handles click propagation on children nodes correctly.
   - `T2_SKILLS_4`: Dynamic templates escape special characters prevent HTML injection risks.
   - `T2_SKILLS_5`: Grid layout boundaries preserve minimum sizes to prevent layout clipping.
6. **Prompt Synthesizer Corners (`T2_SYNTH_1` - `T2_SYNTH_5`)**:
   - `T2_SYNTH_1`: Synthesizer returns standard prompt block if concept input is empty.
   - `T2_SYNTH_2`: Synthesizer uses default prompts fallback values if variables are missing.
   - `T2_SYNTH_3`: Error messages containing special regex parameters or backticks escape properly.
   - `T2_SYNTH_4`: Toast notifications stack does not overflow DOM limit and automatically purges old elements.
   - `T2_SYNTH_5`: Navigator clipboard rejection handles exceptions and issues secondary failure toast safely.

### Tier 3: Cross-Feature Interactions (6 Tests)
*Validates programmatic interaction coupling across multiple views and controllers.*

- `T3_INT_1`: Selecting different synthesizer goals dynamically toggles parameter input visibility.
- `T3_INT_2`: Global search text updates filters cheatsheet tab results and switches active navigation to cheatsheet.
- `T3_INT_3`: Clicking copy-prompt copies prompt outputs text and triggers toast overlay in app.
- `T3_INT_4`: Sidebar nav clicks toggle active section visibility and update header text.
- `T3_INT_5`: Interactive checkpoint toggles completed state list metrics visual check.
- `T3_INT_6`: Modifying synthesizer goal selects input directly updates prompt output box text synchronously.

### Tier 4: Real-World Developer Workflows (5 Tests)
*Simulates actual chronological end-to-end integration loops.*

- `T4_WF_1`: Developer Onboarding & Exploration Workflow Loop (checks setup guide parsing, global search, and explore synthesis).
- `T4_WF_2`: Safe Coordinated Rename Refactoring Workflow Loop (skills check, synthesizer rename generation, copy validation).
- `T4_WF_3`: Integrated Bug Tracing & Debugging Workflow Loop (Windsurf copy, crash trace input, prompt synthesis).
- `T4_WF_4`: Pre-Commit Validation Workflow Loop (CLI command builder status execution, and pre-commit search routing).
- `T4_WF_5`: Integrated Tool Alignment Workflow Loop (Cursor .cursorrules setup check, upstream blast radius check, trigger output).
