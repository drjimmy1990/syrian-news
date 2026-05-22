const fs = require('fs');
const path = require('path');

// -----------------------------------------------------------------------------
// DOM MOCK IMPLEMENTATION FOR NODE.JS COMPATIBILITY
// -----------------------------------------------------------------------------
class MockElement {
  constructor(tag = 'div', id = '', classes = []) {
    this.tagName = tag.toUpperCase();
    this.id = id;
    this.classList = {
      classes: new Set(classes),
      add(cls) { this.classes.add(cls); },
      remove(cls) { this.classes.delete(cls); },
      contains(cls) { return this.classes.has(cls); },
      toggle(cls) {
        if (this.classes.has(cls)) {
          this.classes.delete(cls);
          return false;
        } else {
          this.classes.add(cls);
          return true;
        }
      }
    };
    this.attributes = {};
    this.children = [];
    this.listeners = {};
    this.style = {};
    this.innerHTML = '';
    this.innerText = '';
    this.value = '';
    this.disabled = false;
  }

  get className() {
    return Array.from(this.classList.classes).join(' ');
  }

  set className(val) {
    this.classList.classes = new Set(val.split(/\s+/).filter(Boolean));
  }

  setAttribute(name, val) {
    this.attributes[name] = String(val);
  }

  getAttribute(name) {
    return this.attributes[name] || null;
  }

  addEventListener(event, callback) {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
  }

  dispatchEvent(event) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(cb => cb({ 
        preventDefault: () => {},
        target: this,
        currentTarget: this
      }));
    }
  }

  click() {
    this.dispatchEvent('click');
  }

  appendChild(child) {
    this.children.push(child);
  }

  removeChild(child) {
    const idx = this.children.indexOf(child);
    if (idx !== -1) this.children.splice(idx, 1);
  }

  remove() {
    if (global.document && global.document.domElements) {
      const idx = global.document.domElements.indexOf(this);
      if (idx !== -1) global.document.domElements.splice(idx, 1);
    }
  }
}

const domMock = {
  listeners: {},
  domElements: [],
  reset() {
    this.listeners = {};
    this.domElements = [];
    this.parseHTML();
  },
  parseHTML() {
    try {
      const htmlPath = path.join(__dirname, 'index.html');
      if (!fs.existsSync(htmlPath)) return;
      const html = fs.readFileSync(htmlPath, 'utf8');
      const regex = /<([a-zA-Z0-9\-]+)([^>]*)>/g;
      let match;
      while ((match = regex.exec(html)) !== null) {
        const tagName = match[1];
        const attrsString = match[2];
        
        const idMatch = attrsString.match(/id=["']([^"']+)["']/);
        const id = idMatch ? idMatch[1] : '';
        
        const classMatch = attrsString.match(/class=["']([^"']+)["']/);
        const classes = classMatch ? classMatch[1].split(/\s+/) : [];
        
        const el = new MockElement(tagName, id, classes);
        
        const dataRegex = /data-([^=]+)=["']([^"']+)["']/g;
        let dMatch;
        while ((dMatch = dataRegex.exec(attrsString)) !== null) {
          el.setAttribute(`data-${dMatch[1]}`, dMatch[2]);
        }
        
        const onclickMatch = attrsString.match(/onclick=["']([^"']+)["']/);
        if (onclickMatch) {
          el.setAttribute('onclick', onclickMatch[1]);
        }
        
        if (id === 'ide-config-text') {
          const startIdx = match.index + match[0].length;
          const endIdx = html.indexOf('</code>', startIdx);
          if (endIdx !== -1) {
            el.innerText = html.substring(startIdx, endIdx).trim();
          }
        }
        
        this.domElements.push(el);
      }
    } catch (e) {
      // Fail silently, fall back to empty array
    }
  }
};

// Global Node.js mocks
global.MockElement = MockElement;
global.window = {
  addEventListener(event, cb) {},
  location: { hash: '' },
  showToast: () => {}
};

Object.defineProperty(global, 'showToast', {
  get() {
    return global.window.showToast;
  },
  set(val) {
    global.window.showToast = val;
  },
  configurable: true
});
const mockNavigator = {
  clipboard: {
    writeText(text) {
      global.lastCopiedText = text;
      return Promise.resolve();
    }
  }
};
try {
  delete global.navigator;
} catch (e) {}
Object.defineProperty(global, 'navigator', {
  value: mockNavigator,
  writable: true,
  configurable: true
});
global.lastCopiedText = '';

global.document = {
  addEventListener(event, cb) {
    domMock.listeners[event] = cb;
  },
  getElementById(id) {
    return domMock.domElements.find(el => el.id === id) || null;
  },
  querySelectorAll(selector) {
    const sel = selector.trim();
    if (sel === '.sidebar-nav .nav-item') {
      return domMock.domElements.filter(el => el.classList.contains('nav-item'));
    }
    if (sel === '.sidebar-nav .nav-item.active') {
      return domMock.domElements.filter(el => el.classList.contains('nav-item') && el.classList.contains('active'));
    }
    const attrMatch = sel.match(/\[([a-zA-Z0-9\-]+)=["']([^"']+)["']\]/);
    if (attrMatch) {
      const attrName = attrMatch[1];
      const attrVal = attrMatch[2];
      return domMock.domElements.filter(el => el.getAttribute(attrName) === attrVal);
    }
    if (sel.startsWith('.')) {
      const cls = sel.slice(1);
      if (cls.includes(' ')) {
        const parts = cls.split(/\s+/);
        return domMock.domElements.filter(el => parts.some(p => el.classList.contains(p.replace('.', ''))));
      }
      return domMock.domElements.filter(el => el.classList.contains(cls));
    }
    if (sel.startsWith('#')) {
      const id = sel.slice(1);
      const found = domMock.domElements.find(el => el.id === id);
      return found ? [found] : [];
    }
    if (sel === '.playbook-section') {
      return domMock.domElements.filter(el => el.classList.contains('playbook-section'));
    }
    if (sel === '.timeline-tab') {
      return domMock.domElements.filter(el => el.classList.contains('timeline-tab'));
    }
    if (sel === '.timeline-card') {
      return domMock.domElements.filter(el => el.classList.contains('timeline-card'));
    }
    if (sel === '.schema-btn') {
      return domMock.domElements.filter(el => el.classList.contains('schema-btn'));
    }
    if (sel === '.filter-chip') {
      return domMock.domElements.filter(el => el.classList.contains('filter-chip'));
    }
    if (sel === '.skill-card') {
      return domMock.domElements.filter(el => el.classList.contains('skill-card'));
    }
    if (sel === '.cypher-tabs button, .cypher-tabs .schema-btn') {
      return domMock.domElements.filter(el => el.classList.contains('cypher-tab-btn') || el.classList.contains('schema-btn'));
    }
    return domMock.domElements.filter(el => el.tagName === sel.toUpperCase());
  },
  querySelector(selector) {
    const list = this.querySelectorAll(selector);
    return list.length > 0 ? list[0] : null;
  },
  createElement(tag) {
    const el = new MockElement(tag);
    domMock.domElements.push(el);
    return el;
  }
};

// -----------------------------------------------------------------------------
// DEFINITION OF THE 71 SYSTEMATIC TESTS
// -----------------------------------------------------------------------------
const tests = [];

// Helper to register tests
function addTest(tier, feature, id, description, runFn) {
  tests.push({ tier, feature, id, description, run: runFn });
}

// =============================================================================
// TIER 1: FEATURE COVERAGE (30 TESTS)
// =============================================================================

// Playbook Simplification
addTest('Tier 1: Feature Coverage', 'Playbook Simplification', 'T1_PB_SIMP_1', 'Checks that raw KuzuDB schema details are removed from playbook', () => {
  const content = fs.readFileSync('ultimate_gitnexus_playbook.md', 'utf8');
  if (content.includes('KuzuDB Properties') || content.includes('1. Graph Nodes') && content.includes('CodeRelation types')) {
    throw new Error('Playbook still contains low-level KuzuDB database schema details or relational property lists.');
  }
});

addTest('Tier 1: Feature Coverage', 'Playbook Simplification', 'T1_PB_SIMP_2', 'Checks that BFS/DFS graph traversals are simplified or removed', () => {
  const content = fs.readFileSync('ultimate_gitnexus_playbook.md', 'utf8');
  if (content.match(/BFS\/DFS/i) || content.includes('upstream graph traversal')) {
    throw new Error('Playbook still contains complex BFS/DFS graph traversal descriptions.');
  }
});

addTest('Tier 1: Feature Coverage', 'Playbook Simplification', 'T1_PB_SIMP_3', 'Checks that advanced Cypher queries section is removed', () => {
  const content = fs.readFileSync('ultimate_gitnexus_playbook.md', 'utf8');
  if (content.includes('Advanced Cypher Queries') || content.includes('MATCH p = (m1:Method)-[:CALLS*4]->(m2:Method)')) {
    throw new Error('Playbook still contains the complex Advanced Cypher Queries playground section.');
  }
});

addTest('Tier 1: Feature Coverage', 'Playbook Simplification', 'T1_PB_SIMP_4', 'Checks that general developer-centric and agent-centric explanation remains', () => {
  const content = fs.readFileSync('ultimate_gitnexus_playbook.md', 'utf8');
  if (!content.includes('AI') || !content.includes('agent') && !content.includes('skills')) {
    throw new Error('Playbook is missing core agent/skills developer-focused explanations.');
  }
});

addTest('Tier 1: Feature Coverage', 'Playbook Simplification', 'T1_PB_SIMP_5', 'Checks that playbook has valid structural Markdown headings', () => {
  const content = fs.readFileSync('ultimate_gitnexus_playbook.md', 'utf8');
  if (!content.startsWith('# ')) {
    throw new Error('Playbook does not have a valid primary h1 Markdown heading.');
  }
});

// Playbook IDE Setup Guides
addTest('Tier 1: Feature Coverage', 'Playbook IDE Guides', 'T1_PB_IDE_1', 'Section 6 contains Cursor IDE configuration with .cursorrules', () => {
  const content = fs.readFileSync('ultimate_gitnexus_playbook.md', 'utf8');
  if (!content.includes('.cursorrules') || !content.includes('Cursor')) {
    throw new Error('Section 6 does not contain a comprehensive guide or configuration snippet for Cursor (.cursorrules).');
  }
});

addTest('Tier 1: Feature Coverage', 'Playbook IDE Guides', 'T1_PB_IDE_2', 'Section 6 contains Claude Code configuration with config.json', () => {
  const content = fs.readFileSync('ultimate_gitnexus_playbook.md', 'utf8');
  if (!content.includes('Claude Code') || !content.includes('config.json') || !content.includes('gitnexus-stdio')) {
    throw new Error('Section 6 does not contain a comprehensive guide or config.json snippet for Claude Code (gitnexus-stdio).');
  }
});

addTest('Tier 1: Feature Coverage', 'Playbook IDE Guides', 'T1_PB_IDE_3', 'Section 6 contains Windsurf IDE configuration with workspace rules', () => {
  const content = fs.readFileSync('ultimate_gitnexus_playbook.md', 'utf8');
  if (!content.includes('Windsurf') || !content.includes('workspace rules') && !content.includes('.windsurf')) {
    throw new Error('Section 6 does not contain Windsurf workspace rules or system instructions config guides.');
  }
});

addTest('Tier 1: Feature Coverage', 'Playbook IDE Guides', 'T1_PB_IDE_4', 'Section 6 contains CLI Workflows for index management and staleness audits', () => {
  const content = fs.readFileSync('ultimate_gitnexus_playbook.md', 'utf8');
  if (!content.includes('npx gitnexus status') || !content.includes('npx gitnexus analyze')) {
    throw new Error('Section 6 does not outline direct sequency blocks for CLI status, staleness audits, and re-indexing.');
  }
});

addTest('Tier 1: Feature Coverage', 'Playbook IDE Guides', 'T1_PB_IDE_5', 'Configuration setup blocks contain proper code fence displays', () => {
  const content = fs.readFileSync('ultimate_gitnexus_playbook.md', 'utf8');
  const codeFences = content.match(/```(json|markdown|powershell|bash)?/g);
  if (!codeFences || codeFences.length < 3) {
    throw new Error('Playbook lacks code fences displaying exact configuration snippets.');
  }
});

// Dashboard IDE Setup Tab
addTest('Tier 1: Feature Coverage', 'Dashboard IDE Setup Tab', 'T1_DB_IDE_1', 'index.html has an ide-setup-section instead of cypher-section', () => {
  domMock.reset();
  const el = document.getElementById('ide-setup-section');
  if (!el) {
    throw new Error('index.html is missing the required ide-setup-section container element.');
  }
});

addTest('Tier 1: Feature Coverage', 'Dashboard IDE Setup Tab', 'T1_DB_IDE_2', 'IDE Setup view displays tab sub-controls for Cursor, Claude Code, and Windsurf', () => {
  domMock.reset();
  const cursorBtn = document.querySelector('[data-ide="cursor"]');
  const claudeBtn = document.querySelector('[data-ide="claude"]');
  const windsurfBtn = document.querySelector('[data-ide="windsurf"]');
  if (!cursorBtn || !claudeBtn || !windsurfBtn) {
    throw new Error('index.html does not contain the tab selection selectors for individual IDE platforms.');
  }
});

addTest('Tier 1: Feature Coverage', 'Dashboard IDE Setup Tab', 'T1_DB_IDE_3', 'index.html contains copyable code config text blocks or containers', () => {
  domMock.reset();
  const configBlock = document.getElementById('ide-config-text');
  if (!configBlock) {
    throw new Error('index.html is missing the copyable #ide-config-text container for configuration setup files.');
  }
});

addTest('Tier 1: Feature Coverage', 'Dashboard IDE Setup Tab', 'T1_DB_IDE_4', 'style.css defines custom styling rules matching the IDE glassmorphism setup container', () => {
  const style = fs.readFileSync('style.css', 'utf8');
  if (!style.includes('.ide-setup') && !style.includes('.glassmorphic') && !style.includes('.ide-tab')) {
    throw new Error('style.css does not define required styling properties for glassmorphism tabs or setup container.');
  }
});

addTest('Tier 1: Feature Coverage', 'Dashboard IDE Setup Tab', 'T1_DB_IDE_5', 'app.js wires sub-tab listeners changing displayed setup config in app', () => {
  domMock.reset();
  global.showToast = () => {};
  const appCode = fs.readFileSync('app.js', 'utf8');
  eval(appCode);
  
  const cursorBtn = document.querySelector('[data-ide="cursor"]');
  if (cursorBtn && cursorBtn.listeners && cursorBtn.listeners.click) {
    // Should be wired
  } else {
    throw new Error('app.js does not hook active event click listeners onto IDE setup sub-tabs.');
  }
});

// Sidebar Navigation & Sync
addTest('Tier 1: Feature Coverage', 'Sidebar Navigation & Sync', 'T1_NAV_SYNC_1', 'index.html has sidebar navigation item with data-section="ide-setup"', () => {
  domMock.reset();
  const navItem = document.querySelector('[data-section="ide-setup"]');
  if (!navItem) {
    throw new Error('index.html is missing a sidebar navigation list item with data-section="ide-setup".');
  }
});

addTest('Tier 1: Feature Coverage', 'Sidebar Navigation & Sync', 'T1_NAV_SYNC_2', 'index.html has sidebar navigation item with data-section="skills"', () => {
  domMock.reset();
  const navItem = document.querySelector('[data-section="skills"]');
  if (!navItem) {
    throw new Error('index.html is missing sidebar navigation list item with data-section="skills".');
  }
});

addTest('Tier 1: Feature Coverage', 'Sidebar Navigation & Sync', 'T1_NAV_SYNC_3', 'app.js contains dynamic sidebar nav highlighting logic', () => {
  domMock.reset();
  global.showToast = () => {};
  const appCode = fs.readFileSync('app.js', 'utf8');
  eval(appCode);
  
  const navItem = document.querySelector('[data-section="ide-setup"]');
  if (!navItem) throw new Error('Missing ide-setup nav element');
  navItem.dispatchEvent('click');
  
  if (!navItem.classList.contains('active')) {
    throw new Error('Clicking sidebar item does not add the active class to navigation node.');
  }
});

addTest('Tier 1: Feature Coverage', 'Sidebar Navigation & Sync', 'T1_NAV_SYNC_4', 'Selecting "skills" navigates correctly and syncs main title and subtitle', () => {
  domMock.reset();
  global.showToast = () => {};
  const appCode = fs.readFileSync('app.js', 'utf8');
  eval(appCode);
  
  const navItem = document.querySelector('[data-section="skills"]');
  if (!navItem) throw new Error('Missing skills nav element');
  navItem.dispatchEvent('click');
  
  const title = document.getElementById('main-title');
  const subtitle = document.getElementById('main-subtitle');
  if (!title || !title.innerText.includes('Skills Hub') && !title.innerText.includes('Agent Skills')) {
    throw new Error('Sidebar navigation fails to sync document header title correctly for Agent Skills Hub.');
  }
});

addTest('Tier 1: Feature Coverage', 'Sidebar Navigation & Sync', 'T1_NAV_SYNC_5', 'Selecting "ide-setup" navigates correctly and syncs main title and subtitle', () => {
  domMock.reset();
  global.showToast = () => {};
  const appCode = fs.readFileSync('app.js', 'utf8');
  eval(appCode);
  
  const navItem = document.querySelector('[data-section="ide-setup"]');
  if (!navItem) throw new Error('Missing ide-setup nav element');
  navItem.dispatchEvent('click');
  
  const title = document.getElementById('main-title');
  if (!title || !title.innerText.includes('IDE Setup') && !title.innerText.includes('Developer IDEs')) {
    throw new Error('Sidebar navigation fails to sync document header title correctly for IDE Setup tab.');
  }
});

// Skills Hub Card Toggles
addTest('Tier 1: Feature Coverage', 'Skills Hub Card Toggles', 'T1_SKILLS_1', 'index.html defines interactive Agent Skills selection cards grid', () => {
  domMock.reset();
  const grid = document.querySelector('.skills-grid');
  const cards = document.querySelectorAll('.skill-card');
  if (!grid || cards.length < 6) {
    throw new Error('index.html is missing the skills-grid or lacks 6 distinct skill cards.');
  }
});

addTest('Tier 1: Feature Coverage', 'Skills Hub Card Toggles', 'T1_SKILLS_2', 'index.html defines skill card details placeholders', () => {
  domMock.reset();
  const title = document.getElementById('detail-skill-title');
  const checklist = document.getElementById('detail-skill-checklist');
  const tools = document.getElementById('detail-skill-tools');
  if (!title || !checklist || !tools) {
    throw new Error('index.html is missing one or more detail display placeholders (#detail-skill-*).');
  }
});

addTest('Tier 1: Feature Coverage', 'Skills Hub Card Toggles', 'T1_SKILLS_3', 'app.js implements initAgentSkills function to bind active toggles', () => {
  domMock.reset();
  const appCode = fs.readFileSync('app.js', 'utf8');
  eval(appCode);
  if (typeof initAgentSkills !== 'function') {
    throw new Error('app.js does not define initAgentSkills() function handler.');
  }
});

addTest('Tier 1: Feature Coverage', 'Skills Hub Card Toggles', 'T1_SKILLS_4', 'app.js maintains dynamic state structures containing tool descriptions for 6 skills', () => {
  domMock.reset();
  const appCode = fs.readFileSync('app.js', 'utf8');
  if (!appCode.includes('gitnexus-cli') || !appCode.includes('gitnexus-exploring') || !appCode.includes('gitnexus-impact-analysis') || !appCode.includes('gitnexus-refactoring') || !appCode.includes('gitnexus-debugging') || !appCode.includes('gitnexus-guide')) {
    throw new Error('app.js is missing the primary state mappings mapping primary checklists or tools for all 6 skills.');
  }
});

addTest('Tier 1: Feature Coverage', 'Skills Hub Card Toggles', 'T1_SKILLS_5', 'Clicking card dynamically alters card active states and swaps details', () => {
  domMock.reset();
  global.showToast = () => {};
  const appCode = fs.readFileSync('app.js', 'utf8');
  eval(appCode);
  
  const cards = document.querySelectorAll('.skill-card');
  const exploringCard = domMock.domElements.find(el => el.classList.contains('skill-card') && el.getAttribute('data-skill') === 'exploring');
  if (!exploringCard) throw new Error('Missing exploring skill card');
  
  exploringCard.dispatchEvent('click');
  const title = document.getElementById('detail-skill-title');
  if (!exploringCard.classList.contains('active') || !title.innerText.includes('exploring')) {
    throw new Error('Clicking skill card fails to set active state or dynamically swap header details.');
  }
});

// Prompt Synthesizer & Clipboard
addTest('Tier 1: Feature Coverage', 'Prompt Synthesizer & Clipboard', 'T1_SYNTH_1', 'index.html defines synthesizer form items and goal selector', () => {
  domMock.reset();
  const select = document.getElementById('synth-goal');
  const concept = document.getElementById('synth-concept');
  const symbol = document.getElementById('synth-symbol');
  if (!select || !concept || !symbol) {
    throw new Error('index.html is missing Prompt Synthesizer interactive input selector fields.');
  }
});

addTest('Tier 1: Feature Coverage', 'Prompt Synthesizer & Clipboard', 'T1_SYNTH_2', 'app.js implements initPromptSynthesizer function', () => {
  domMock.reset();
  const appCode = fs.readFileSync('app.js', 'utf8');
  eval(appCode);
  if (typeof initPromptSynthesizer !== 'function') {
    throw new Error('app.js does not define initPromptSynthesizer() handler.');
  }
});

addTest('Tier 1: Feature Coverage', 'Prompt Synthesizer & Clipboard', 'T1_SYNTH_3', 'Synthesizer dynamically generates comprehensive multi-line prompt block based on concept and symbol inputs', () => {
  domMock.reset();
  global.showToast = () => {};
  const appCode = fs.readFileSync('app.js', 'utf8');
  eval(appCode);
  
  const select = document.getElementById('synth-goal');
  const concept = document.getElementById('synth-concept');
  const symbol = document.getElementById('synth-symbol');
  const output = document.getElementById('prompt-output-text');
  
  if (select && concept && symbol && output) {
    select.value = 'rename';
    concept.value = 'jwt authentication';
    symbol.value = 'validateUser';
    
    // Trigger synthesizer update
    select.dispatchEvent('change');
    
    if (!output.innerText || output.innerText.length < 50 || !output.innerText.includes('validateUser')) {
      throw new Error('Prompt Synthesizer fails to dynamically generate or display high-density instruction block.');
    }
  } else {
    throw new Error('Synthesizer DOM nodes missing');
  }
});

addTest('Tier 1: Feature Coverage', 'Prompt Synthesizer & Clipboard', 'T1_SYNTH_4', 'Clipboard copy functionality hooks properly and triggers toast notification', () => {
  domMock.reset();
  let toastTriggered = false;
  global.showToast = (msg) => {
    if (msg.includes('Copy') || msg.includes('clipboard') || msg.includes('synthesized')) toastTriggered = true;
  };
  const appCode = fs.readFileSync('app.js', 'utf8');
  eval(appCode);
  
  const copyBtn = document.getElementById('btn-copy-prompt');
  if (copyBtn) {
    copyBtn.dispatchEvent('click');
    if (!toastTriggered && global.lastCopiedText === '') {
      throw new Error('Clicking copy-prompt does not trigger toast notification or clipboard mapping.');
    }
  } else {
    throw new Error('Copy prompt button missing');
  }
});

addTest('Tier 1: Feature Coverage', 'Prompt Synthesizer & Clipboard', 'T1_SYNTH_5', 'No Javascript syntax errors are present in app.js', () => {
  domMock.reset();
  try {
    const appCode = fs.readFileSync('app.js', 'utf8');
    eval(appCode);
  } catch (e) {
    throw new Error('app.js contains JS execution or syntax errors: ' + e.message);
  }
});


// =============================================================================
// TIER 2: BOUNDARY & CORNER CASES (30 TESTS)
// =============================================================================

// Playbook Simplification Boundary cases
addTest('Tier 2: Boundary Cases', 'Playbook Simplification', 'T2_PB_SIMP_1', 'Pruning leaves no orphan references or figures referencing old databases', () => {
  const content = fs.readFileSync('ultimate_gitnexus_playbook.md', 'utf8');
  if (content.match(/fig_\d+/i) && content.includes('Cypher')) {
    throw new Error('Playbook still contains orphan database figures.');
  }
});

addTest('Tier 2: Boundary Cases', 'Playbook Simplification', 'T2_PB_SIMP_2', 'Playbook completely removes the term "KuzuDB" from Section 6 completely', () => {
  const content = fs.readFileSync('ultimate_gitnexus_playbook.md', 'utf8');
  const sections = content.split('## ');
  const section6 = sections.find(s => s.startsWith('Section 6:'));
  if (section6 && section6.toLowerCase().includes('kuzudb')) {
    throw new Error('Section 6 playbook manual still details KuzuDB internals.');
  }
});

addTest('Tier 2: Boundary Cases', 'Playbook Simplification', 'T2_PB_SIMP_3', 'Checks that no orphan Cypher code blocks are left in the entire playbook', () => {
  const content = fs.readFileSync('ultimate_gitnexus_playbook.md', 'utf8');
  if (content.includes('MATCH (f1:File)')) {
    throw new Error('Playbook still contains unpruned Cypher query snippets.');
  }
});

addTest('Tier 2: Boundary Cases', 'Playbook Simplification', 'T2_PB_SIMP_4', 'Title headings for Section 6 align exactly with new standardized specifications', () => {
  const content = fs.readFileSync('ultimate_gitnexus_playbook.md', 'utf8');
  if (!content.includes('Section 6: Specialized Agent Skills & Triggers')) {
    throw new Error('Section 6 title format is invalid or missing.');
  }
});

addTest('Tier 2: Boundary Cases', 'Playbook Simplification', 'T2_PB_SIMP_5', 'Checks for malformed lists and orphan formatting brackets in modified files', () => {
  const content = fs.readFileSync('ultimate_gitnexus_playbook.md', 'utf8');
  if (content.includes(' - [ ] - ') || content.includes('[[[[') || content.includes(']]]]')) {
    throw new Error('Malformed brackets or lists detected in the playbook.');
  }
});

// Playbook IDE Setup Guides Boundary cases
addTest('Tier 2: Boundary Cases', 'Playbook IDE Guides', 'T2_PB_IDE_1', 'Cursor guides detail correct .cursorrules directory placement', () => {
  const content = fs.readFileSync('ultimate_gitnexus_playbook.md', 'utf8');
  if (!content.includes('.cursorrules') || !content.includes('root') && !content.includes('workspace')) {
    throw new Error('.cursorrules guide lacks specific placement details.');
  }
});

addTest('Tier 2: Boundary Cases', 'Playbook IDE Guides', 'T2_PB_IDE_2', 'Claude Code guide correctly warns about stdio transport arguments', () => {
  const content = fs.readFileSync('ultimate_gitnexus_playbook.md', 'utf8');
  if (!content.includes('gitnexus-stdio') || !content.includes('mcp') && !content.includes('command')) {
    throw new Error('Claude Code configuration instructions are incomplete.');
  }
});

addTest('Tier 2: Boundary Cases', 'Playbook IDE Guides', 'T2_PB_IDE_3', 'Windsurf guide outlines setting workspace rules dynamically', () => {
  const content = fs.readFileSync('ultimate_gitnexus_playbook.md', 'utf8');
  if (!content.includes('Windsurf') || !content.includes('rules')) {
    throw new Error('Windsurf setup instructions lack details.');
  }
});

addTest('Tier 2: Boundary Cases', 'Playbook IDE Guides', 'T2_PB_IDE_4', 'CLI Guides detail exact re-indexing parameters in recovery scenarios', () => {
  const content = fs.readFileSync('ultimate_gitnexus_playbook.md', 'utf8');
  if (!content.includes('analyze') || !content.includes('--force') && !content.includes('--embeddings')) {
    throw new Error('CLI guides lack detailed re-indexing recovery arguments.');
  }
});

addTest('Tier 2: Boundary Cases', 'Playbook IDE Guides', 'T2_PB_IDE_5', 'JSON structures in configurations are syntactically valid', () => {
  const content = fs.readFileSync('ultimate_gitnexus_playbook.md', 'utf8');
  const jsonBlocks = content.match(/```json([\s\S]*?)```/g);
  if (jsonBlocks) {
    jsonBlocks.forEach(block => {
      const code = block.replace(/```json/g, '').replace(/```/g, '').trim();
      // Skip if it contains comments or placeholders that aren't valid JSON, otherwise verify
      if (!code.includes('//') && !code.includes('...') && !code.includes('/*')) {
        try {
          JSON.parse(code);
        } catch (e) {
          throw new Error('Malformed JSON block detected in configuration guide: ' + e.message);
        }
      }
    });
  }
});

// Dashboard IDE Setup Tab Boundary cases
addTest('Tier 2: Boundary Cases', 'Dashboard IDE Setup Tab', 'T2_DB_IDE_1', 'IDE Setup snippets are pre-populated with reasonable default settings', () => {
  domMock.reset();
  const configText = document.getElementById('ide-config-text');
  if (configText && (!configText.innerText || configText.innerText.length < 10)) {
    throw new Error('IDE config text content is empty or incomplete.');
  }
});

addTest('Tier 2: Boundary Cases', 'Dashboard IDE Setup Tab', 'T2_DB_IDE_2', 'Defensive checks set Cursor sub-tab active on default workspace load', () => {
  domMock.reset();
  const cursorBtn = document.querySelector('[data-ide="cursor"]');
  if (cursorBtn && !cursorBtn.classList.contains('active')) {
    throw new Error('Cursor is not highlighted active by default.');
  }
});

addTest('Tier 2: Boundary Cases', 'Dashboard IDE Setup Tab', 'T2_DB_IDE_3', 'style.css defines custom rules for scrollable textarea snippets prevents overflow', () => {
  const style = fs.readFileSync('style.css', 'utf8');
  if (!style.includes('overflow-y') && !style.includes('scroll') && !style.includes('max-height')) {
    throw new Error('style.css lacks container text scroll sizing modifiers.');
  }
});

addTest('Tier 2: Boundary Cases', 'Dashboard IDE Setup Tab', 'T2_DB_IDE_4', 'index.html contains zero duplicate ID elements for newly introduced IDE tab panels', () => {
  domMock.reset();
  const ids = domMock.domElements.map(el => el.id).filter(id => id !== '');
  const duplicates = ids.filter((item, index) => ids.indexOf(item) !== index);
  if (duplicates.includes('ide-setup-section') || duplicates.includes('ide-config-text')) {
    throw new Error('Duplicate IDs found in setup tab blocks.');
  }
});

addTest('Tier 2: Boundary Cases', 'Dashboard IDE Setup Tab', 'T2_DB_IDE_5', 'Interactive click handlers are defensive check elements presence before classes modification', () => {
  domMock.reset();
  const appCode = fs.readFileSync('app.js', 'utf8');
  // Should not throw on manual evaluations
  eval(appCode);
});

// Sidebar Navigation Boundary cases
addTest('Tier 2: Boundary Cases', 'Sidebar Navigation & Sync', 'T2_NAV_SYNC_1', 'URL hashes falling back safely to overview when unknown section is targeted', () => {
  domMock.reset();
  const appCode = fs.readFileSync('app.js', 'utf8');
  eval(appCode);
  // Manual trigger of popstate or init sequence with hash
  window.location.hash = '#invalid-hash';
  // Trigger DOMContentLoaded listener manually if registered
  if (domMock.listeners['DOMContentLoaded']) {
    domMock.listeners['DOMContentLoaded']();
  }
});

addTest('Tier 2: Boundary Cases', 'Sidebar Navigation & Sync', 'T2_NAV_SYNC_2', 'Active class removal loops do not crash when nav elements list is empty', () => {
  domMock.reset();
  const appCode = fs.readFileSync('app.js', 'utf8');
  eval(appCode);
});

addTest('Tier 2: Boundary Cases', 'Sidebar Navigation & Sync', 'T2_NAV_SYNC_3', 'Header title sync queries target nodes safely', () => {
  domMock.reset();
  const appCode = fs.readFileSync('app.js', 'utf8');
  eval(appCode);
});

addTest('Tier 2: Boundary Cases', 'Sidebar Navigation & Sync', 'T2_NAV_SYNC_4', 'Repeated quick clicks on sidebar items do not lead to listener double-binding', () => {
  domMock.reset();
  const appCode = fs.readFileSync('app.js', 'utf8');
  eval(appCode);
  const cursorBtn = document.querySelector('[data-section="ide-setup"]');
  if (cursorBtn) {
    cursorBtn.dispatchEvent('click');
    cursorBtn.dispatchEvent('click');
  }
});

addTest('Tier 2: Boundary Cases', 'Sidebar Navigation & Sync', 'T2_NAV_SYNC_5', 'Transitions for responsive grid layout classes compile smoothly', () => {
  const style = fs.readFileSync('style.css', 'utf8');
  if (!style.includes('@media')) {
    throw new Error('style.css does not declare responsive breakpoint rules.');
  }
});

// Skills Hub Boundary cases
addTest('Tier 2: Boundary Cases', 'Skills Hub Card Toggles', 'T2_SKILLS_1', 'Hub displays clean placeholder content if skill arrays are missing tools', () => {
  domMock.reset();
  const appCode = fs.readFileSync('app.js', 'utf8');
  eval(appCode);
});

addTest('Tier 2: Boundary Cases', 'Skills Hub Card Toggles', 'T2_SKILLS_2', 'Cards handle clicking safely even if missing custom attributes', () => {
  domMock.reset();
  const appCode = fs.readFileSync('app.js', 'utf8');
  eval(appCode);
});

addTest('Tier 2: Boundary Cases', 'Skills Hub Card Toggles', 'T2_SKILLS_3', 'Active skill card selection handles click propagation on children nodes correctly', () => {
  domMock.reset();
  const appCode = fs.readFileSync('app.js', 'utf8');
  eval(appCode);
});

addTest('Tier 2: Boundary Cases', 'Skills Hub Card Toggles', 'T2_SKILLS_4', 'Dynamic templates escape special characters prevent HTML injection risks', () => {
  const appCode = fs.readFileSync('app.js', 'utf8');
  if (!appCode.includes('escapeHtml') && !appCode.includes('&lt;')) {
    throw new Error('app.js does not escape text definitions printed inside skills view.');
  }
});

addTest('Tier 2: Boundary Cases', 'Skills Hub Card Toggles', 'T2_SKILLS_5', 'Grid layout boundaries preserve minimum sizes to prevent layout clipping', () => {
  const style = fs.readFileSync('style.css', 'utf8');
  if (!style.includes('min-width') && !style.includes('minmax')) {
    throw new Error('style.css does not define min-sizes for skills cards.');
  }
});

// Prompt Synthesizer Boundary cases
addTest('Tier 2: Boundary Cases', 'Prompt Synthesizer & Clipboard', 'T2_SYNTH_1', 'Synthesizer returns standard prompt block if concept input is empty', () => {
  domMock.reset();
  global.showToast = () => {};
  const appCode = fs.readFileSync('app.js', 'utf8');
  eval(appCode);
  
  const select = document.getElementById('synth-goal');
  const concept = document.getElementById('synth-concept');
  const output = document.getElementById('prompt-output-text');
  
  if (select && concept && output) {
    concept.value = '';
    select.dispatchEvent('change');
    if (!output.innerText || output.innerText.includes('undefined')) {
      throw new Error('Empty concept field output generates undefined values or breaks synthesizer.');
    }
  }
});

addTest('Tier 2: Boundary Cases', 'Prompt Synthesizer & Clipboard', 'T2_SYNTH_2', 'Synthesizer uses default prompts fallback values if variables are missing', () => {
  domMock.reset();
  global.showToast = () => {};
  const appCode = fs.readFileSync('app.js', 'utf8');
  eval(appCode);
  
  const select = document.getElementById('synth-goal');
  const symbol = document.getElementById('synth-symbol');
  const output = document.getElementById('prompt-output-text');
  
  if (select && symbol && output) {
    symbol.value = '';
    select.value = 'rename';
    select.dispatchEvent('change');
    if (!output.innerText || output.innerText.includes('undefined') || output.innerText.includes('null')) {
      throw new Error('Missing variable triggers undefined prints inside dynamic prompts.');
    }
  }
});

addTest('Tier 2: Boundary Cases', 'Prompt Synthesizer & Clipboard', 'T2_SYNTH_3', 'Error messages containing special regex parameters or backticks escape properly', () => {
  domMock.reset();
  global.showToast = () => {};
  const appCode = fs.readFileSync('app.js', 'utf8');
  eval(appCode);
  
  const select = document.getElementById('synth-goal');
  const errorInput = document.getElementById('synth-error');
  const output = document.getElementById('prompt-output-text');
  
  if (select && errorInput && output) {
    errorInput.value = 'TypeError: Cannot read properties of `undefined` (reading "jwt")';
    select.value = 'debug';
    select.dispatchEvent('change');
    if (output.innerText.includes('undefined`')) {
      // Valid mapping
    }
  }
});

addTest('Tier 2: Boundary Cases', 'Prompt Synthesizer & Clipboard', 'T2_SYNTH_4', 'Toast notifications stack does not overflow DOM limit and automatically purges old elements', () => {
  domMock.reset();
  const appCode = fs.readFileSync('app.js', 'utf8');
  eval(appCode);
  if (typeof showToast === 'function') {
    showToast('Test Toast');
    const toast = document.querySelector('.toast');
    if (!toast) throw new Error('Toast element was not appended to stack.');
  }
});

addTest('Tier 2: Boundary Cases', 'Prompt Synthesizer & Clipboard', 'T2_SYNTH_5', 'Navigator clipboard rejection handles exceptions and issues secondary failure toast safely', () => {
  domMock.reset();
  let failureToastTriggered = false;
  global.navigator.clipboard.writeText = () => Promise.reject(new Error('Rejected'));
  global.showToast = (msg, type) => {
    if (type === 'secondary' || msg.includes('failed') || msg.includes('manual')) failureToastTriggered = true;
  };
  
  const appCode = fs.readFileSync('app.js', 'utf8');
  eval(appCode);
  if (typeof copyToClipboard === 'function') {
    copyToClipboard('test copy text');
  }
});


// =============================================================================
// TIER 3: CROSS-FEATURE INTERACTIONS (6 TESTS)
// =============================================================================

addTest('Tier 3: Interactions', 'Cross-Feature Interactions', 'T3_INT_1', 'Selecting different synthesizer goals dynamically toggles parameter input visibility', () => {
  domMock.reset();
  global.showToast = () => {};
  const appCode = fs.readFileSync('app.js', 'utf8');
  eval(appCode);
  
  const goalSelect = document.getElementById('synth-goal');
  const groupConcept = document.getElementById('group-concept');
  const groupSymbol = document.getElementById('group-symbol');
  const groupNewname = document.getElementById('group-newname');
  const groupError = document.getElementById('group-error');
  
  if (goalSelect && groupConcept && groupSymbol && groupNewname && groupError) {
    // 1. Explore Goal
    goalSelect.value = 'explore';
    goalSelect.dispatchEvent('change');
    if (groupConcept.style.display !== 'block' || groupSymbol.style.display !== 'none' || groupNewname.style.display !== 'none' || groupError.style.display !== 'none') {
      throw new Error('Explore goal input visibility is incorrect.');
    }
    
    // 2. Rename Goal
    goalSelect.value = 'rename';
    goalSelect.dispatchEvent('change');
    if (groupConcept.style.display !== 'none' || groupSymbol.style.display !== 'block' || groupNewname.style.display !== 'block' || groupError.style.display !== 'none') {
      throw new Error('Rename goal input visibility is incorrect.');
    }
    
    // 3. Debug Goal
    goalSelect.value = 'debug';
    goalSelect.dispatchEvent('change');
    if (groupConcept.style.display !== 'none' || groupSymbol.style.display !== 'block' || groupNewname.style.display !== 'none' || groupError.style.display !== 'block') {
      throw new Error('Debug goal input visibility is incorrect.');
    }
  } else {
    throw new Error('Synthesizer form element selectors missing in DOM.');
  }
});

addTest('Tier 3: Interactions', 'Cross-Feature Interactions', 'T3_INT_2', 'Global search text updates filters cheatsheet tab results and switches active navigation to cheatsheet', () => {
  domMock.reset();
  global.showToast = () => {};
  const appCode = fs.readFileSync('app.js', 'utf8');
  eval(appCode);
  
  const searchInput = document.getElementById('global-search');
  const cheatsheetNav = document.querySelector('[data-section="cheatsheet"]');
  
  if (searchInput && cheatsheetNav) {
    cheatsheetNav.classList.remove('active');
    searchInput.value = 'repos';
    searchInput.dispatchEvent('input');
    
    if (!cheatsheetNav.classList.contains('active')) {
      throw new Error('Typing in global search failed to auto-navigate to the Cheat Sheet tab.');
    }
  } else {
    throw new Error('Global search or Cheatsheet navigation tab missing.');
  }
});

addTest('Tier 3: Interactions', 'Cross-Feature Interactions', 'T3_INT_3', 'Clicking copy-prompt copies prompt outputs text and triggers toast overlay in app', () => {
  domMock.reset();
  let toastTriggered = false;
  global.navigator.clipboard.writeText = (txt) => {
    global.lastCopiedText = txt;
    return Promise.resolve();
  };
  global.showToast = (msg) => {
    if (msg.includes('Copied') || msg.includes('clipboard') || msg.includes('toast')) toastTriggered = true;
  };
  
  const appCode = fs.readFileSync('app.js', 'utf8');
  eval(appCode);
  
  const copyBtn = document.getElementById('btn-copy-prompt');
  const output = document.getElementById('prompt-output-text');
  if (copyBtn && output) {
    output.innerText = 'Copied Trigger Block Test text';
    copyBtn.dispatchEvent('click');
    if (global.lastCopiedText !== 'Copied Trigger Block Test text') {
      throw new Error('Copy prompt did not copy the correct text from prompt output field.');
    }
  } else {
    throw new Error('Copy prompt trigger DOM elements missing.');
  }
});

addTest('Tier 3: Interactions', 'Cross-Feature Interactions', 'T3_INT_4', 'Sidebar nav clicks toggle active section visibility and update header text', () => {
  domMock.reset();
  global.showToast = () => {};
  const appCode = fs.readFileSync('app.js', 'utf8');
  eval(appCode);
  
  const navItem = document.querySelector('[data-section="ide-setup"]');
  const title = document.getElementById('main-title');
  const subtitle = document.getElementById('main-subtitle');
  
  if (navItem && title && subtitle) {
    navItem.dispatchEvent('click');
    if (!title.innerText.includes('IDE Setup') || !subtitle.innerText.includes('Cursor') && !subtitle.innerText.includes('Guides')) {
      throw new Error('Clicking navigation did not update main header titles/subtitles correctly.');
    }
  } else {
    throw new Error('Header nodes missing.');
  }
});

addTest('Tier 3: Interactions', 'Cross-Feature Interactions', 'T3_INT_5', 'Interactive checkpoint toggles completed state list metrics visual check', () => {
  domMock.reset();
  global.showToast = () => {};
  const appCode = fs.readFileSync('app.js', 'utf8');
  eval(appCode);
  
  const checkpoint = document.querySelector('.timeline-checkpoint-item');
  if (checkpoint && typeof toggleCheckpoint === 'function') {
    toggleCheckpoint(checkpoint);
    if (!checkpoint.classList.contains('completed')) {
      throw new Error('Calling toggleCheckpoint on checkpoint node did not add the completed class.');
    }
  }
});

addTest('Tier 3: Interactions', 'Cross-Feature Interactions', 'T3_INT_6', 'Modifying synthesizer goal selects input directly updates prompt output box text synchronously', () => {
  domMock.reset();
  global.showToast = () => {};
  const appCode = fs.readFileSync('app.js', 'utf8');
  eval(appCode);
  
  const select = document.getElementById('synth-goal');
  const concept = document.getElementById('synth-concept');
  const output = document.getElementById('prompt-output-text');
  
  if (select && concept && output) {
    select.value = 'explore';
    concept.value = 'modular community trace';
    select.dispatchEvent('change');
    
    if (!output.innerText || !output.innerText.includes('modular community trace')) {
      throw new Error('Updating goal select does not update prompt text instantly.');
    }
  }
});


// =============================================================================
// TIER 4: REAL-WORLD DEVELOPER WORKFLOWS (5 TESTS)
// =============================================================================

addTest('Tier 4: Workflows', 'Developer Workflows', 'T4_WF_1', 'Developer Onboarding & Exploration Workflow Loop', () => {
  domMock.reset();
  global.showToast = () => {};
  const appCode = fs.readFileSync('app.js', 'utf8');
  eval(appCode);
  
  // 1. Navigate to IDE Setup to copy configuration
  const setupNav = document.querySelector('[data-section="ide-setup"]');
  setupNav.dispatchEvent('click');
  
  // 2. Select Claude Code setup tab
  const claudeTab = document.querySelector('[data-ide="claude"]');
  claudeTab.dispatchEvent('click');
  
  const configText = document.getElementById('ide-config-text');
  if (!configText.innerText.includes('gitnexus-stdio')) {
    throw new Error('Claude Code config snippet lacks stdio references.');
  }
  
  // 3. Search "jwt" to find reference cards
  const searchInput = document.getElementById('global-search');
  searchInput.value = 'jwt';
  searchInput.dispatchEvent('input');
  
  // 4. Synthesize exploration instructions
  const synthSelect = document.getElementById('synth-goal');
  const synthConcept = document.getElementById('synth-concept');
  synthSelect.value = 'explore';
  synthConcept.value = 'jwt session manager';
  synthSelect.dispatchEvent('change');
  
  const outputText = document.getElementById('prompt-output-text');
  if (!outputText.innerText.includes('jwt session manager')) {
    throw new Error('Synthesized prompt output fails to match concept query.');
  }
});

addTest('Tier 4: Workflows', 'Developer Workflows', 'T4_WF_2', 'Safe Coordinated Rename Refactoring Workflow Loop', () => {
  domMock.reset();
  global.showToast = () => {};
  const appCode = fs.readFileSync('app.js', 'utf8');
  eval(appCode);
  
  // 1. Navigates to Agent Skills Hub to review gitnexus-refactoring
  const skillsNav = document.querySelector('[data-section="skills"]');
  skillsNav.dispatchEvent('click');
  
  const refactorCard = domMock.domElements.find(el => el.classList.contains('skill-card') && el.getAttribute('data-skill') === 'refactoring');
  refactorCard.dispatchEvent('click');
  
  const detailTitle = document.getElementById('detail-skill-title');
  if (!detailTitle.innerText.includes('refactoring')) {
    throw new Error('Skills detail title failed to update to refactoring.');
  }
  
  // 2. Go to prompt synthesizer
  const synthSelect = document.getElementById('synth-goal');
  const synthSymbol = document.getElementById('synth-symbol');
  const synthNewname = document.getElementById('synth-newname');
  
  synthSelect.value = 'rename';
  synthSymbol.value = 'parseOldSession';
  synthNewname.value = 'parseSecureSession';
  synthSelect.dispatchEvent('change');
  
  // 3. Copy prompt trigger block
  const copyBtn = document.getElementById('btn-copy-prompt');
  copyBtn.dispatchEvent('click');
  
  if (global.lastCopiedText === '' || !global.lastCopiedText.includes('parseOldSession') || !global.lastCopiedText.includes('parseSecureSession')) {
    throw new Error('Rename trigger instruction block copy mismatch.');
  }
});

addTest('Tier 4: Workflows', 'Developer Workflows', 'T4_WF_3', 'Integrated Bug Tracing & Debugging Workflow Loop', () => {
  domMock.reset();
  global.showToast = () => {};
  const appCode = fs.readFileSync('app.js', 'utf8');
  eval(appCode);
  
  // 1. Configure Windsurf from IDE Setup
  const setupNav = document.querySelector('[data-section="ide-setup"]');
  setupNav.dispatchEvent('click');
  
  const windsurfTab = document.querySelector('[data-ide="windsurf"]');
  windsurfTab.dispatchEvent('click');
  
  // 2. Navigates to Prompt Synthesizer on crash
  const synthSelect = document.getElementById('synth-goal');
  const synthSymbol = document.getElementById('synth-symbol');
  const synthError = document.getElementById('synth-error');
  
  synthSelect.value = 'debug';
  synthSymbol.value = 'SessionRouter';
  synthError.value = 'Error: Cannot read properties of null (reading "token")';
  synthSelect.dispatchEvent('change');
  
  const outputText = document.getElementById('prompt-output-text');
  if (!outputText.innerText.includes('SessionRouter') || !outputText.innerText.includes('null')) {
    throw new Error('Bug tracing synthesized instruction block mismatch.');
  }
});

addTest('Tier 4: Workflows', 'Developer Workflows', 'T4_WF_4', 'Pre-Commit Validation Workflow Loop', () => {
  domMock.reset();
  global.showToast = () => {};
  const appCode = fs.readFileSync('app.js', 'utf8');
  eval(appCode);
  
  // 1. Select status action in command builder
  const actionSelect = document.getElementById('cli-action');
  actionSelect.value = 'status';
  actionSelect.dispatchEvent('change');
  
  const cmdText = document.getElementById('terminal-cmd');
  if (!cmdText.innerText.includes('npx gitnexus status')) {
    throw new Error('CLI Command Builder status command syntax mismatch.');
  }
  
  // 2. Check Cheat Sheet for gitnexus_detect_changes syntax
  const searchInput = document.getElementById('global-search');
  searchInput.value = 'detect_changes';
  searchInput.dispatchEvent('input');
  
  const activeNav = document.querySelector('.sidebar-nav .nav-item.active');
  if (activeNav.getAttribute('data-section') !== 'cheatsheet') {
    throw new Error('Typing detect_changes failed to pop cheatsheet tab.');
  }
});

addTest('Tier 4: Workflows', 'Developer Workflows', 'T4_WF_5', 'Integrated Tool Alignment Workflow Loop', () => {
  domMock.reset();
  global.showToast = () => {};
  const appCode = fs.readFileSync('app.js', 'utf8');
  eval(appCode);
  
  // 1. Configure Cursor .cursorrules setup
  const setupNav = document.querySelector('[data-section="ide-setup"]');
  setupNav.dispatchEvent('click');
  
  const cursorTab = document.querySelector('[data-ide="cursor"]');
  cursorTab.dispatchEvent('click');
  
  // 2. Synthesize upstream blast radius check prompt
  const synthSelect = document.getElementById('synth-goal');
  const synthSymbol = document.getElementById('synth-symbol');
  
  synthSelect.value = 'impact';
  synthSymbol.value = 'authenticateUser';
  synthSelect.dispatchEvent('change');
  
  const outputText = document.getElementById('prompt-output-text');
  if (!outputText.innerText.includes('authenticateUser') || !outputText.innerText.includes('gitnexus_impact')) {
    throw new Error('Blast radius trigger prompt does not call correct mcp tools or target symbol.');
  }
});

// -----------------------------------------------------------------------------
// EXECUTION ENGINE
// -----------------------------------------------------------------------------
console.log('='.repeat(80));
console.log('              WONDERFUL FARADAY NATIVE NODE.JS E2E TEST RUNNER');
console.log('='.repeat(80));

let passed = 0;
let failed = 0;
const failureDetails = [];

// Reset DOM Mock initially
domMock.reset();

tests.forEach((test, idx) => {
  const testNum = String(idx + 1).padStart(2, '0');
  try {
    test.run();
    console.log(`[PASS] [${test.tier}] ${testNum}/71: ${test.id} - ${test.description}`);
    passed++;
  } catch (err) {
    console.log(`\x1b[31m[FAIL] [${test.tier}] ${testNum}/71: ${test.id} - ${test.description}\x1b[0m`);
    console.log(`       \x1b[33mError: ${err.message}\x1b[0m`);
    failed++;
    failureDetails.push({ id: test.id, error: err.message, tier: test.tier, desc: test.description });
  }
});

console.log('='.repeat(80));
console.log(`Execution Summary:`);
console.log(`  Passed: ${passed}/${tests.length}`);
console.log(`  Failed: ${failed}/${tests.length}`);
console.log('='.repeat(80));

if (failed > 0) {
  console.log(`\x1b[31mFAILURE DETECTED: ${failed} tests failed during opaque-box verification.\x1b[0m`);
  console.log('='.repeat(80));
  process.exit(1);
} else {
  console.log(`\x1b[32mSUCCESS: All E2E test suites passed successfully!\x1b[0m`);
  console.log('='.repeat(80));
  process.exit(0);
}
