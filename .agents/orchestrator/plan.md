# Orchestrator Plan — Wonderful Faraday Simplification & Updates

This plan breaks down our goals into actionable execution steps and maps them to specialized worker roles.

## Architectural Assessment
1. **Playbook simplification**:
   - Locate and remove KuzuDB Cypher schema references, query diagrams, and sample queries from `ultimate_gitnexus_playbook.md`.
   - Add IDE setup configs for:
     - **Cursor:** Setting up `.cursorrules` to force the agent to consult GitNexus context.
     - **Claude Code:** Setting up standard `config.json` with the `gitnexus-stdio` MCP server command.
     - **Windsurf:** Configuring workspace rules and system instructions.
     - **CLI Workflows:** Direct sequences for index management, staleness audits, and re-indexing.
2. **Dashboard Updates**:
   - In `index.html`:
     - Replace the "Cypher Playground" nav item with "IDE Setup & Guides".
     - Replace the `#cypher-section` with `#ide-setup-section` which contains tabbed configurations for Cursor, Claude Code, and Windsurf.
     - Ensure the sidebar nav matches the active section.
   - In `style.css`:
     - Style the new "IDE Setup & Guides" sub-tabs and copyable code blocks, maintaining the premium glassmorphic theme.
   - In `app.js`:
     - Wire navigation controls for the new layouts (supporting "skills" and "ide-setup" clicks, stripping Cypher playground logic).
     - Implement the Agent Skills Hub card toggles to dynamically show primary checklists and tools for each of the 6 skills.
     - Implement the Prompt Synthesizer logic to compile triggers dynamically based on goal selection and details, and attach clipboard copy with toast notifications.

## Execution Topology
We will dispatch independent workers for each track:
1. **Track A: Playbook Documentation & IDE Guides**
   - Agent Type: `teamwork_preview_worker`
   - Prompt: Complete R1 (simplify playbook, enrich Section 6 with Cursor, Claude Code, Windsurf, and CLI guides).
2. **Track B: Dashboard UI & Application Layer**
   - Agent Type: `teamwork_preview_worker`
   - Prompt: Complete R2 (update `index.html`, `style.css`, and `app.js` with new navigation, skills hub click toggles, IDE Setup guides tab, and prompt synthesizer logic).
3. **Track C: Review & Verification**
   - Agent Type: `teamwork_preview_reviewer`
   - Prompt: Verify correctness of files, ensure no Javascript errors exist in the console, check copy prompts and clipboard works.
4. **Track D: Forensic Integrity Audit**
   - Agent Type: `teamwork_preview_auditor`
   - Prompt: Verify no cheating or hardcoding exists.
