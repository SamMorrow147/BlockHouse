# Block House Frame — Project Brief

**Purpose of this document:** Give another AI or developer enough context to assess the project fully: what it is, what it does, how it’s built, and what it uses.

---

## 1. What This Is

**Block House Frame** is a **parametric first-floor framing viewer** for a single-family block (CMU) house with wood-frame interior walls. It is a **static, read-only** web app: users view framing generated from a single data file; they do not edit dimensions in the UI.

- **Project name:** `block-house-frame` (from `package.json`)
- **Type:** Next.js 15 App Router app, React 18, TypeScript
- **Deployment:** Local/web (no backend; no database)
- **Repo:** Not in a git remote in the brief’s context; local workspace path: `Block House Frame`

---

## 2. What It Does (User-Facing)

1. **Header**
   - Dark bar with a **hamburger menu** (left) and title: “Block House — First Floor Framing”.
   - Hamburger opens a **slide-out drawer** (left, 280px) with a “Menu” title, close button, and nav links. Currently one link: “First Floor Framing” → `/`. Intended for future links to other pages.

2. **Main level — floor plan**
   - Single **floor plan** section showing:
     - CMU perimeter (block layout with openings for doors/windows).
     - Interior wood frame (1" off CMU), 2×6 framing.
     - North/south/east/west dimensions and labels.
     - Interior partitions (kitchen/bath) and stair footprint.

3. **Wall elevations (North, South, West, East)**
   - One **card per wall** with:
     - **Parametric elevation SVG**: CMU layer (running bond, clipped at openings), then wood framing (bottom/top plates, studs, king/jack studs, cripples, headers, sills, openings). All dimensions driven from data.
     - **Wall data summary**: total length, height, stud spacing, sections, openings (with positions).
     - For walls that have a door or window, an **“order size” diagram** (small SVG) with width/height and optional sill height for ordering.

4. **South wall interactivity**
   - Only the **South** wall elevation is `interactive={true}`: hover over framing elements shows a **tooltip** with element id, label, dimensions, and position (from `WallElevation.tsx`).

5. **Interior partitions**
   - A section **“Interior Partitions — Kitchen / Bathroom”** with:
     - Kitchen/bath horizontal partition (elevation).
     - Bathroom door wall (elevation with 28" door).
     - Stair layout (risers, treads, landing) and optional layer toggles (e.g. show/hide elements).

6. **Scaling**
   - Wall elevation SVGs use a **fixed scale** (e.g. 4 px per inch) and viewBox. Wrapper widths are **percentage-based** so that the **CMU block pitch is visually consistent** across all four walls at any viewport size (shorter walls don’t stretch to full width).

---

## 3. Tech Stack & Dependencies

- **Runtime:** Node 24.x (from `package.json` engines).
- **Framework:** Next.js 15.0.5 (App Router).
- **UI:** React 18.3.x, React DOM 18.3.x.
- **Language:** TypeScript 5.
- **Styling:** Plain CSS only (`app/globals.css`); no Tailwind, no CSS-in-JS.
- **No:** Backend API, database, auth, state library (e.g. Redux), UI component library, or external design system.

**Dev dependencies:** `@types/node`, `@types/react`, `@types/react-dom`, `eslint`, `eslint-config-next`, `typescript`.

---

## 4. Project Structure (Relevant Files)

```
Block House Frame/
├── app/
│   ├── layout.tsx          # Root layout: <html><body>{children}</body></html>; metadata only
│   ├── page.tsx            # Single page: header (hamburger + title) + main (floor plan, walls, interior partitions)
│   └── globals.css         # Global styles: layout, header, cards, wall UI, hamburger/drawer
├── components/
│   ├── HamburgerMenu.tsx   # Client: hamburger button, slide-out drawer, nav links (placeholder for future pages)
│   ├── FloorPlan.tsx       # Floor plan SVG (CMU + frame + partitions + stairs); reads initialWalls
│   ├── WallElevation.tsx   # Client: wall elevation SVG + tooltips (South only interactive); uses layout-calculator
│   ├── InteriorPartitionDetails.tsx  # Client: interior partition elevations + stair; layer toggles
│   └── AssessmentPanel.tsx  # Unused: dimension summary (N/S/E/W totals, match checks)
├── lib/
│   ├── types.ts            # WallId, Opening, Section, WallElevation, PX_PER_INCH
│   ├── framing-data.ts     # Single source of truth: initialWalls (north, south, east, west)
│   └── layout-calculator.ts # computeWallLayout(wall) → plates, headers, sills, studs, openings (Rect[])
├── package.json
└── PROJECT_BRIEF.md        # This file
```

- **Data flow:** `framing-data.ts` exports `initialWalls`. `page.tsx` and `FloorPlan` use it directly. `WallElevation` and `InteriorPartitionDetails` receive a wall (or derived wall) and call `computeWallLayout(wall)` to get rectangles for SVG.
- **Routing:** One route: `/` (home). No other pages yet; hamburger is prepared for future routes.

---

## 5. Data Model (Framing)

- **WallId:** `"north" | "south" | "east" | "west"`.
- **WallElevation:** `id`, `name`, `totalLengthInches`, `wallHeightInches`, `studSpacingOC`, `sections[]`, `openings[]`.
- **Opening:** `type` (window | door), `widthInches`, `heightInches`, `sillHeightInches?`, `positionFromLeftInches`, `label?`.
- **Section:** `lengthInches`, `label?` (used for narrative, e.g. “left of door”).
- **Layout:** `lib/layout-calculator.ts` turns a `WallElevation` into a `WallLayout`: arrays of `Rect` (id, label, x, y, width, height) for bottom plates, top plates, headers, sills, studs, openings. Conventions: 2×6 studs 1.5" face width, 16" OC; double top plate; max plate length 16'; king/jack/cripple logic for doors and windows.

**Building assumptions (from comments in framing-data):**
- CMU shell: 304"×184" exterior, 288"×168" interior (19 × 11.5 blocks).
- Wood frame 1" off interior CMU face on all sides; N/S walls 286", E/W 166".
- Scale for elevations: 4 px per inch (`PX_PER_INCH` in types).

---

## 6. Key Implementation Details

- **Client components:** `HamburgerMenu`, `WallElevation`, `InteriorPartitionDetails` use `"use client"` (state, events, refs). `FloorPlan` and `page.tsx` are server components by default.
- **South wall tooltips:** Implemented in `WallElevation.tsx` with mouse move/leave, refs, and hit-testing on layout rects in SVG coordinate space.
- **Floor plan:** `FloorPlan.tsx` uses the same `initialWalls` and derived geometry (CMU, frame depth, openings) with a smaller scale (3 px/inch) and different SVG margins; interior partitions and stairs are hardcoded in that component.
- **Interior partitions:** `InteriorPartitionDetails` defines its own `WallElevation`-like objects (horizontal partition 81.5", door wall 50" with 28" door) and reuses `WallElevationView` and `computeWallLayout`; stair layout is custom SVG.
- **AssessmentPanel:** Component exists but is **not imported or used** anywhere; can be removed or wired in later.

---

## 7. Styling Conventions

- **globals.css:** Resets (`* { box-sizing: border-box }`), `body` (background `#f5f5f0`, font system-ui), `.app` (flex column, min-height 100vh), `.header` (dark `#2d2d2d`, flex with gap for hamburger + title), `.main`, `.walls-grid`, `.wall-card`, `.wall-content`, `.wall-parametric-wrap`, `.wall-data-row`, opening/diagram columns, hamburger/drawer/overlay. Responsive: `max-width: 640px` flips wall data row to column.
- No CSS modules; all selectors global. Class names are semantic (e.g. `wall-card`, `nav-drawer`).

---

## 8. How to Run

- **Install:** `npm install`
- **Dev:** `npm run dev` (Next.js dev server)
- **Build:** `npm run build`
- **Start (prod):** `npm start`
- **Lint:** `npm run lint`

---

## 9. What’s “Live” vs Placeholder

- **Live:** Floor plan, all four wall elevations, interior partitions and stairs, South wall tooltips, hamburger and slide-out menu (one link to `/`), order-size diagrams for each opening.
- **Placeholder / future:** Additional nav links in the hamburger (no other routes yet). `AssessmentPanel` is built but unused.
- **Single source of truth:** To change dimensions or openings, edit `lib/framing-data.ts`; the rest of the app is parametric from that.

---

## 10. Summary for Another AI

Use this brief to: understand the app’s scope (parametric framing viewer, one page, no backend), find where data lives (`lib/framing-data.ts`, `lib/types.ts`), where layout math lives (`lib/layout-calculator.ts`), and which components render the plan and elevations (`FloorPlan`, `WallElevation`, `InteriorPartitionDetails`). The UI is header + cards + SVGs with optional tooltips and a slide-out nav ready for more pages. Styling is global CSS; state is local React (hamburger open/close, layer toggles, tooltip). No external APIs or databases.
