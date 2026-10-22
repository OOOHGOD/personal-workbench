<div align="center">

# DC's Personal Workbench

One workspace for tasks, projects, reports, and personal progress.

**English** · [简体中文](README.zh-CN.md)

![HTML](https://img.shields.io/badge/HTML-E34F26?style=flat-square) ![JavaScript](https://img.shields.io/badge/JavaScript-D4A900?style=flat-square) ![WorkBuddy](https://img.shields.io/badge/WorkBuddy-334155?style=flat-square) [![MIT License](https://img.shields.io/badge/License-MIT-2563EB?style=flat-square)](LICENSE)

</div>

<p align="center">
<a href="#overview">Overview</a> · <a href="#getting-started">Getting Started</a> · <a href="#user-guide">User Guide</a> · <a href="#repository-layout">Repository Layout</a> · <a href="#author--license">Author &amp; License</a>
</p>

---

> **Project focus** · Productivity App


<details>
<summary>Full contents</summary>

- [Overview](#overview)
- [Screenshots](#screenshots)
- [Feature Overview](#feature-overview)
- [Getting Started](#getting-started)
- [User Guide](#user-guide)
- [Mobile Experience](#mobile-experience)
- [Data Storage & Sync](#data-storage--sync)
- [Development](#development)
- [Repository Layout](#repository-layout)
- [Documentation Index](#documentation-index)
- [FAQ](#faq)
- [Author & License](#author--license)

</details>

## Overview

> A single-file HTML personal productivity workbench powered by WorkBuddy cloud database tables: tasks / projects / requirement research / quick notes / resources / daily & weekly reports / personal learning / study-abroad applications / monthly resume — 10 modules in one place.
> Glassmorphism + Bento Grid UI, responsive for desktop and mobile, fully inline with zero external dependencies, works offline.

- **Online version**: <https://workbuddy.link/p/MwXKAV7BlcR9zZAXXf0p3z> (data syncs automatically once signed in to your WorkBuddy account)
- **Offline version**: `DC的个人工作台-离线版.html` in the repo root — just open it in a browser
- **Current version**: v4.1 (Phase 4 "Monthly Resume Update" shipped)
- **Previously documented test baseline (not rerun for this documentation update)**: 282/282 unit tests · 111/111 cloud integration tests · 0 UX findings · 6-viewport layout checks all passed

---

## Screenshots

**Desktop · Today (Bento home)** — 8 daily metrics on the big card, one-tap access to overdue / blocked items, project updates and weekly overview:

![Desktop Today](screenshots/desktop-today.png)

<details>
<summary>More views: tasks, resume, and mobile</summary>

**Desktop · Tasks Board** — grouped by status, with filter chips and search:

![Desktop Tasks](screenshots/desktop-tasks.png)

**Desktop · Monthly Resume** — monthly achievements, one-click evidence rollup, draft generation and version snapshots:

![Desktop Resume](screenshots/desktop-resume.png)

**Mobile · Today** — single-column stacking with bottom navigation:

![Mobile Today](screenshots/mobile-today.png)

</details>

## Feature Overview

| Phase | Module | What it does |
|---|---|---|
| Phase 1 | Tasks | To-do list, priority matrix, status groups, date postponement, splitting, waiting tracker, daily focus |
| Phase 1 | Projects | Core/secondary tiering, stage & blockers, aggregated related tasks, click-through detail |
| Phase 1 | Research | Distinguishes "confirmed requirements" from "ideas to validate", keeps sources and conclusions |
| Phase 1 | Notes | One-line capture, tag filtering, project association |
| Phase 1 | Resources | Link index + one-click copy of local paths |
| Phase 2 | Reports | Auto-generates personal & manager report drafts from tasks/AI records; export to docx / Markdown; archive |
| Phase 3 | Learning | Study topics, types, progress, duration, notes |
| Phase 3 | Applications | Schools, rounds, deadline countdown, material checklists; near-deadline items surface on the home page |
| Phase 4 | Monthly résumé | One-click rollup of evidence-based achievements (completed tasks / project milestones / learning), monthly resume delta draft, version snapshots with rollback |

UI layer (v4): Bento Grid + glassmorphism home page, iCloud-style widget arrangement (drag & drop + S/M/L sizes), hash routing with deep links, modal focus management.

---

## Getting Started

### Option 1: Online (recommended)

1. Open <https://workbuddy.link/p/MwXKAV7BlcR9zZAXXf0p3z>
2. Sign in with your WorkBuddy account (data lives in your library's database tables, shared across devices)
3. First launch ships with 5 sample tasks plus sample data per module (marked "示例/sample" — one click clears them without touching real data)

> On mobile, add it to your home screen to use it like an app: open the link in the browser → Share → Add to Home Screen.

### Option 2: Offline version

Download `DC的个人工作台-离线版.html` from the repo root and open it in any browser.
The offline version uses local storage: you can view cached data and make local edits; merging back to the cloud is via JSON export/import (semi-automatic — see [Data Storage & Sync](#data-storage--sync)).

---

## User Guide

### 1. Today (Home)

The home page is a 12-column Bento grid that sizes cards by importance, filling two neat rows:

```
┌───────────────────────────┬──────────────┐
│ Today's Task Board (L 2/3) │ To Handle     │
│ 8 metrics + daily focus    │ (M 1/3)       │
├──────────────┬────────────┴───────────────┤
│ Core Projects │     This Week (L 2/3)      │
│ (M 1/3)       │  3 trend charts + reports  │
└──────────────┴────────────────────────────┘
```

**Quick capture**: the input bar pinned at the top — type one sentence, press Enter, and it lands in the Inbox for later triage. This is the most-used entry point.

**Today's Task Board (large card)**:
- 8 metrics: planned today / completed / to-do / in progress / waiting / **overdue** / **completion rate** / due today
- **Click any metric to jump to the Tasks board with that filter pre-applied** (e.g. "Overdue" → overdue tasks only)
- Three scope chips: planned today (by plan date) / due today (by due date) / completed today (by completion time)
- "Daily Focus" holds up to 3 items — set from any task via "Set as focus"

**To Handle**: overdue, due-today and follow-up tasks live here; overdue items are highlighted in red. Application deadline reminders are attached to this card too.

**Card shortcuts**: card headers have "Open tasks ›", "Open projects ›", "Generate report ›" links for one-click navigation.

**Arrange widgets (iCloud-style)**:
1. Click "整理小组件" (Arrange widgets) at the top right to enter edit mode (cards wiggle slightly)
2. Hold the ⠿ handle at a card's top-right corner to **drag it into position**; other cards make room with smooth FLIP animations
3. Each card has **S / M / L** size buttons: S compact (1/4 width, key items only), M standard (1/3), L large (2/3)
4. Click "Arrange widgets" again to exit and save

> S is greyed out in some cases: This Week (charts won't fit), To Handle (overdue items must stay fully visible), Core Projects when a project has a blocker — clicking a greyed button explains why.
> Arrangement & sizes are saved in your **local browser** (localStorage) and need redoing on a new device; "Reset to default layout" is in Data & Settings.

### 2. Tasks Board

- **Filters**: today / overdue / due today / completed today / in progress / waiting / inbox / future / no date / all / done
- **Search**: matches titles, next steps and notes
- **A task's lifecycle**:
  - Quick-captured into "Inbox" → open it to add priority, dates, project → set status to "In progress"
  - Not done today: click "Postpone" — it rolls to tomorrow (original plan date and postpone count are kept; nothing vanishes)
  - Blocked on someone: set status to "Waiting" with who/what/next-follow-up
  - Too big: click "Split" — project and category carry over automatically
  - Done: click the circle on the left; completion time is recorded automatically
- **Priority matrix** (explained in Settings): important & urgent first; important & not-urgent gets scheduled time daily; urgent & unimportant handled fast; general batched
- Modals support Esc to close, Tab focus trapping, and focus returns to the trigger button

### 3. Projects Board

- "Tier" splits **core work / secondary work**; the home page "Core Projects" card only shows core work
- Each project card: current stage, stage target date, next step, blockers, recent progress, goal
- **Click a project card for the detail modal**: all related tasks aggregate automatically (linked by stable project ID, survives renames)
- Projects with blockers are flagged in red on the home page, and the projects card can't shrink to S while any blocker exists

### 4. Requirement Research

- Each record distinguishes "confirmed requirement" vs "idea to validate", filterable by nature
- Fields: interviewee, date, related project, real problem/scenario, expected outcome, initial conclusion, items to confirm, next step, source
- Purpose: gradually distill "heard they want" into "confirmed requirements" that directly feed website/app development

### 5. Notes & Resources

- **Notes**: one-line body + comma-separated tags, filter by tag, associate with a project
- **Resources**: an index of frequently used files/links — name, local path (**one-click copy**), related project, purpose

### 6. Daily & Weekly Reports

Before writing a report, spend 10 seconds logging what you did with AI into "AI Work Records" (date, source WorkBuddy/Codex/DSH, type, topic, summary) — the honest substitute for auto-reading chat history (which isn't possible).

Then on the Reports page:
1. Pick daily/weekly + date range (quick buttons available)
2. Generate — two drafts are produced automatically:
   - **Personal version**: completed items, AI collaboration log, learning & application progress, next-day/next-week plan
   - **Manager summary**: condensed (**excludes** personal learning and study-abroad content)
3. Textareas have dirty-flag protection: regenerating after manual edits asks first
4. Export: **docx** (generated by hand-written pure JS, no dependencies) or Markdown; or copy text in one click
5. "Archive" saves to the cloud reports table for later viewing/deletion; archiving the same type+range prompts to overwrite

### 7. Learning & Study-Abroad Applications

- **Learning**: topic, type (language / course / skill / certificate / reading), progress, plan/study date, duration, notes; filter by progress with a stats row; records convert to tasks in one click
- **Applications**: school, program, round, **deadline countdown**, status, priority, material checklist, next step
  - Applications due within 14 days (including overdue) automatically appear in the "Deadline reminders" card and the home page "To Handle"
  - Applications also convert to tasks in one click

### 8. Monthly Resume Update

Turn "what got done" into resume material every month, so nothing is forgotten at year end:

- **Monthly achievement list**: browse entries by month (types: task completion / project milestone / learning / other); add manually via "Add achievement"; only entries checked "include in resume" feed the draft
- **One-click evidence rollup**: scans the month's completed tasks (by completion time), projects reaching their phase target (by target date) and completed learning records (by study date), de-duplicates and creates entries, all included by default
- **Monthly delta draft**: one click generates a Markdown draft grouped by type; editable, one-click copy
- **Version snapshots**: save the draft as a snapshot record in the cloud table; history supports view / rollback (load back into the draft area) / delete
- **Monthly reminder**: during days 1-7 of a month, if last month has no snapshot yet, a red reminder card appears on top of this module (a reminder + one-click generation fallback replacing platform automations)
- **Privacy boundary**: resume content stays in this self-use view and never enters the "leader summary" of reports

### 9. Data & Settings

- **Sync status**: pill indicator top-right (green = synced / yellow = syncing / red = offline)
- **Backup**: export JSON (all 10 tables), preview before import, **merge or replace** modes; v2 backups still import
- **Sample data**: records marked "示例" clear in one click; real data untouched
- **Layout**: reset widgets to default arrangement

---

## Mobile Experience

Below 768px the layout switches automatically:

- **Bottom tabs**: Today / Tasks / Projects / Research / **More**
- Remaining modules (Notes, Resources, Reports, Learning, Applications, Resume, Settings) live in the "More" drawer
- Home page stacks in a single column preserving desktop reading order; metric cards go 2-up
- Touch targets ≥44px, 16px inputs (prevents iOS auto-zoom), iPhone safe-area padding
- Recommended: add to home screen and use it like an app

---

## Data Storage & Sync

| Layer | Description |
|---|---|
| Cloud (primary) | 9 WorkBuddy library database tables; the page talks to them directly when signed in — every change writes through; edits made directly in the tables flow back to the page (onUpdated subscription) |
| Local (secondary) | Widget arrangement/sizes in localStorage; offline version's data also lives in localStorage |
| Backup | JSON export from Settings (local snapshot); import supports merge/replace |
| Offline fallback | Without the library SDK the page switches to "offline mode" (clearly labeled); local changes merge back via JSON export/import (**semi-automatic, not real-time** — an honestly-labeled current limitation) |

> Migration guide for new devices/accounts: `docs/08-接手指南.md` (Chinese).

---

## Development

Tech form: **fully-inline ES5 single-file HTML** (no build step, no frameworks, no external dependencies); database access via the WorkBuddy page SDK (`window.__SMART_PAGE__.database`).

Standard change workflow (run after every edit):

```bash
cd workbench_build

# 1. Syntax check (extract the <script> block first)
node --check <extracted.js>

# 2. Unit tests (jsdom + mocked SDK, 239 assertions)
cd tests && NODE_PATH="<node workspace>/node_modules" node unit_test.js

# 3. Three lint gates
cat canonical_v4_tasks.json | python <skill>/page/lint_schema.py --stdin   # ×10 tables
python <skill>/page/lint_database_sdk_usage.py --html ../workbench.html --schema-file ../schema_v4_merged.json
python <skill>/page/lint_page_quality.py --html ../workbench.html --ack "..."

# 4. Browser testing
node ux_review.js        # desktop 1440 + mobile 390: interactions/nav/modals
node layout_check.js     # 6 viewports: Bento grid / centering / width cap / no h-scroll

# 5. Publish
python <skill>/page/import_html.py ../workbench.html --node-block-id MwXKAV7BlcR9zZAXXf0p3z --databases '[...9 table ids...]'
python <skill>/page/publish_page.py --node-id MwXKAV7BlcR9zZAXXf0p3z
python <skill>/page/download_page_artifacts.py --node-id MwXKAV7BlcR9zZAXXf0p3z --source publish --out-dir pub_check
# → retest artifact → cp offline copy → python integration_test.py (95 cloud assertions)

# 6. Commit
git add -A && git commit -m "..." && git push origin main
```

Cloud resource IDs (page node, space, 10 tables) — `workbench_build/dbid_map_v4.json` is the single source of truth; architectural conventions (one-way DAG calls, single refreshAll, ES5, literal databaseId) are in `docs/07-维护文档.md` (Chinese).

---

## Repository Layout

```
.
├── README.md / README.zh-CN.md    # English / Chinese documentation
├── DC的个人工作台-离线版.html   # Offline copy (identical to source, plain cp)
├── 个人工作台制作过程笔记.md       # Process notes: reference library (R-xxx), design decisions
├── 工作台第1~4期测试报告.md        # Per-phase test reports
├── 工作台Bento改造与重建报告.md    # v4 redesign report
├── 工作台改造截图/                 # Before/after multi-width screenshots
├── docs/                          # 8 engineering docs (requirements → handover)
└── workbench_build/
    ├── workbench.html             # ★ Source (the only file you edit)
    ├── dbid_map_v4.json           # ★ 9-table ID map (single source of truth)
    ├── schema_v4_*.json           # Real cloud schemas (10 tables + merged)
    ├── canonical_v4_*.json        # Canonical schemas for lint
    ├── rebuild_tables_v4.py       # Idempotent table rebuild/reuse
    ├── seed_samples_v4.py         # Seed sample data
    ├── fetch_schemas_v4.py        # Fetch cloud schemas
    ├── gen_canonical_v4.py        # Generate canonical + merged
    └── tests/
        ├── unit_test.js           # Unit tests (239 assertions; HTML_PATH can point at artifacts)
        ├── integration_test.py    # Cloud integration (95 assertions)
        ├── ux_review.js           # Browser UX review
        └── layout_check.js        # Bento layout checks, 6 viewports
```

---

## Documentation Index

| Doc | Contents |
|---|---|
| `docs/01-需求文档.md` | What to build: 4-phase scope, functional/non-functional requirements |
| `docs/02-设计文档.md` | How: architecture, data design, 9 table IDs, render pipeline |
| `docs/03-项目计划文档.md` | Roadmap and Phase 4 planning |
| `docs/04-测试文档.md` | Regression checklist and lint rules |
| `docs/05-用户文档.md` | User manual |
| `docs/06-部署文档.md` | Publishing workflow |
| `docs/07-维护文档.md` | Repo map, change workflow, **known-pitfall quick reference** |
| `docs/08-接手指南.md` | Handover guide (new account / new machine) |
| `个人工作台制作过程笔记.md` | Reference library, design decision memos (read before UI work) |
| `工作台第1~4期测试报告.md` | Per-phase acceptance |
| `工作台Bento改造与重建报告.md` | v4 redesign (cloud rebuild + Bento/glassmorphism) |

---

## FAQ

**Q: The published link opens with empty data in an external browser?**
A: External browsers lack the WorkBuddy sign-in state and page SDK, so the page falls back to "offline mode" — structure renders, data is empty. Open it inside WorkBuddy, or sign in first.

**Q: The old link `workbuddy.link/p/Uo1qyjrSZ67qmecuVnAxXU` no longer works?**
A: That was the v3 publish from another account's space, which this account can no longer update. **As of v4, always use** `https://workbuddy.link/p/MwXKAV7BlcR9zZAXXf0p3z`.

**Q: Widget arrangement lost on another computer?**
A: Honest labeling — arrangement lives in local localStorage and doesn't sync across devices; use "Reset to default layout" in Data & Settings and re-arrange (data is unaffected).

**Q: Can reports auto-read my AI chat history?**
A: No — AI conversation logs can't be read automatically. The honest approach: spend 10 seconds logging AI collaboration into the "AI Work Records" table; report generation aggregates it (deduplicating records that share a name with completed tasks).

**Q: How do I clear sample data?**
A: Data & Settings → "Clear sample data". Only records marked "示例" are removed; real data is never touched.

**Q: Can the offline HTML version sync edits back to the cloud?**
A: Semi-automatically: "Export JSON backup" in the offline version → "Import" in the online version choosing merge mode. Automatic catch-up sync is not yet supported.

---

## Author & License

Author / maintainer: [OOOHGOD](https://github.com/OOOHGOD) · Original contributions: [MIT License](LICENSE)

Commercial use and modification are permitted with preservation of copyright and license notices in copies or substantial portions. Third-party code, datasets, models, and media retain their own terms; see [license scope](LICENSE_SCOPE.md).
