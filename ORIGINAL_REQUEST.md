# Original User Request

## Initial Request — 2026-05-22T16:14:17Z

Enhance the "wonderful-faraday" playbook manual and dashboard to focus intensely on how developers and autonomous AI agents utilize GitNexus skills inside IDEs (Cursor, Claude Code, Windsurf) and via the CLI. Remove advanced database/manual internals (like complex custom Cypher query models and low-level BFS/DFS details) to prioritize developer-centric and agent-centric automation.

Working directory: C:\Users\LOQ\Documents\antigravity\wonderful-faraday
Integrity mode: development

## Requirements

### R1. Core Playbook Simplification & Skill Enrichment
- Modify [ultimate_gitnexus_playbook.md](file:///C:/Users/LOQ/Documents/antigravity/wonderful-faraday/ultimate_gitnexus_playbook.md) to:
  1. Remove raw KuzuDB database schema details, low-level BFS/DFS graph traversals, and the advanced Cypher queries section (simplifying or deleting them).
  2. Enrich Section 6: Specialized Agent Skills & Triggers with comprehensive, step-by-step IDE configuration guides:
     - **Cursor:** Setting up `.cursorrules` to force the agent to consult the GitNexus context.
     - **Claude Code:** Setting up standard `config.json` with the `gitnexus-stdio` MCP server command.
     - **Windsurf:** Configuring workspace rules and system instructions.
     - **CLI Workflows:** Direct, clear sequences for index management, staleness audits, and re-indexing.

### R2. Interactive Dashboard Update (IDE & Skills Focus)
- Modify [index.html](file:///C:/Users/LOQ/Documents/antigravity/wonderful-faraday/index.html) and [style.css](file:///C:/Users/LOQ/Documents/antigravity/wonderful-faraday/style.css) to:
  1. Replace the KuzuDB/Cypher Playground tab and view with a premium, glassmorphic **"IDE Setup & Guides"** tab.
  2. The IDE Setup view must contain tabbed setups displaying copyable configuration snippets for **Cursor**, **Claude Code**, and **Windsurf**.
  3. Ensure the Sidebar Navigation highlights the correct active tab (including "skills" and the new "ide-setup" tabs).
- Modify [app.js](file:///C:/Users/LOQ/Documents/antigravity/wonderful-faraday/app.js) to:
  1. Wire navigation controls for the new layout (removing the Cypher playground logic, adding "skills" and "ide-setup" tab listeners).
  2. Implement the **Agent Skills Hub** card toggles, dynamically displaying primary checklists and utilized tools for each of the 6 skills.
  3. Implement the **Prompt Synthesizer** logic. When a user selects a goal (e.g., Exploration, Impact Check, Safe Rename, Trace Bug) and inputs details, synthesize a copy-pasteable instruction block for Cursor/Claude Code/Windsurf and attach clipboard copying with toast notifications.

## Acceptance Criteria

### Playbook Documentation
- [ ] [ultimate_gitnexus_playbook.md](file:///C:/Users/LOQ/Documents/antigravity/wonderful-faraday/ultimate_gitnexus_playbook.md) contains zero complex manual Cypher query sections or low-level database schemas.
- [ ] Section 6 contains comprehensive, step-by-step setup snippets for `.cursorrules`, Claude Code `mcp` JSON, and Windsurf configurations.

### Dashboard Layout & Navigation
- [ ] The Sidebar Menu contains a dedicated "Agent Skills" and "IDE Setup" item instead of the old "Cypher Playground".
- [ ] Selecting "Agent Skills" navigates to the glassmorphic interactive skills hub with card clicking and detail swaps operating flawlessly.
- [ ] Selecting "IDE Setup" displays beautiful, tabbed copyable settings for Cursor, Claude Code, and Windsurf.
- [ ] Navigation syncs document headers (main title and subtitle) correctly.

### Interactive Synthesizer & Clipboard
- [ ] The Prompt Synthesizer compiles high-density instructions dynamically matching user inputs (concept name, symbol names, errors).
- [ ] Clicking copy-prompt captures the generated text and copies it to the clipboard, triggering a success toast notification.
- [ ] No Javascript errors are present in the console.

## Follow-up — 2026-05-22T22:34:28Z

An automated news aggregation and WordPress posting system that fetches the latest news from a list of specified Syrian news sources, prevents duplicate entries, and publishes them to a WordPress site.

Working directory: ~/teamwork_projects/syrian_news_aggregator
Integrity mode: development

## Requirements

### R1. News Scraper / Fetcher Engine
Fetch news articles from the user's provided list of Syrian news websites. The engine must support:
1. **RSS Feed Fetching**: Parsing standard RSS feeds efficiently.
2. **HTML Scrape / Fallback / WP-JSON API**: Crawling/scraping news pages directly when RSS feeds are broken, incomplete (e.g., only containing one item), or unavailable. Proactively check if the sites are WordPress sites and can be queried via `/wp-json/wp/v2/posts`.

List of websites:
- الوكالة العربية السورية للأنباء (سانا)	https://sana.sy
- الإخبارية السورية	https://alikhbariah.com
- تلفزيون سوريا	https://www.syria.tv
- جريدة الوطن السورية	https://www.alwatanonline.com
- زمان الوصل	https://www.zamanalwsl.net
- عنب بلدي	https://www.enabbaladi.net
- شبكة شام الإخبارية	https://shaam.org
- أثر برس	https://www.athrpress.com
- سناك سوري	https://snacksyrian.com/
- الدفاع المدني السوري	https://whitehelmets.org/index.php/ar/alalam/akhbar-wtqaryr-alamyt
- حلب اليوم 	https://halabtodaytv.net/
- نداء بوست 	https://nedaa-post.com/
- صوت العاصمة 	https://damascusv.com/
- شبكة نداء الفرات	https://furat-sy.com/
- فرات بوست	https://euphratespost.net/ar/
- الخابور	https://alkhabour.com/public/ar
- صحيفة الفرات	https://furat.alwehda.gov.sy/?cat=17
- صحيفة الثورة 	http://Thawra.sy
- صحيفة الوحدة 	https://alwehda-news.sy/
- صحيفة العروبة 	http://ouruba.alwehda.gov.sy/
- وكالة سوريا الجديدة	https://nsasyr.net/
- سيريا لايف	https://www.syria-life.com/
- سوكة نيوز	https://www.sookeh.com/
- اخبار سوريا - الجزيرة 	https://www.aljazeera.net/where/mideast/arab/syria/
- أخبار سوريا - العربية 	https://www.alarabiya.net/arab-and-world/syria
- عربي 21- سوريا 	https://arabi21.com/stories/t/50055/0/%D8%B3%D9%88%D8%B1%D9%8A%D8%A9
- العربي الجديد - سوريا 	https://www.alaraby.co.uk/news/syria
- الحدث - سوريا 	https://www.alhadath.net/syria
- سيرياديز	https://syriandays.com/?
- الشرق - سوريا	https://asharq.com/locations/%D8%B3%D9%88%D8%B1%D9%8A%D8%A7/
- سوريا اونلاين	https://syria-online.net/
- السوري	https://alsori.net/
- صحيفة الحرية 	https://alhurriyah.sy/
- الترا سوريا 	https://ultrasyria.ultrasawt.com/
- العربي - سوريا 	https://www.alaraby.com/news/arab-world/%D8%A3%D8%AE%D8%A8%D8%A7%D8%B1-%D8%B3%D9%88%D8%B1%D9%8A%D8%A7

### R2. Duplication Prevention & Database
Maintain a lightweight datastore (e.g., SQLite, JSON file, or WordPress custom meta keys check) to keep track of processed news articles using hash/unique signatures (URL, Title, or Content similarity hashes) to guarantee zero duplicate postings to WordPress.

### R3. WordPress Publisher Integration
Integrate with the WordPress REST API to publish parsed articles as drafts or published posts, mapping fields like Title, Content, Source Link, and publication date correctly.

### R4. Workflow / Automation Layer
Provide a runnable automation structure (such as n8n workflow exports, or a Node.js/Python cron job system) designed to execute at regular intervals (e.g., every 10–15 minutes).

## Acceptance Criteria

### Execution & Scraping Verification
- [ ] Script successfully runs and fetches news from at least 3 distinct types of feeds (active RSS, single-item RSS, and pure HTML scraper).
- [ ] Extracted article objects contain: `title`, `content` (text or HTML), `url`, `source_name`, and `published_at` date.

### Duplication Prevention Verification
- [ ] Running the script consecutively back-to-back must result in zero duplicate entries written to WordPress or the target datastore.

### WordPress Posting Verification
- [ ] Verified API connection to WordPress, creating a test post with the correct format, title, and external source attribution.

## Follow-up — 2026-05-22T22:39:46Z

The user has added a new requirement: The system must support integrating an AI rewriting step (specifically compatible with n8n workflows or a custom OpenAI/LLM API rewrite stage) to paraphrase or rewrite the news article content before publishing it to WordPress. Please incorporate this into the system design, the scraper/publisher pipeline, and the final n8n workflow output.
