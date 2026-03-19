# shadcn/ui Integration Plan — Block House Frame
> Hand this file to Cursor. Execute phases in order. Do not skip steps.

---

## CRITICAL GROUND RULES

**NEVER touch these files:**
- `lib/framing-data.ts`
- `lib/stair-calculator.ts`
- `lib/layout-calculator.ts`
- `lib/plan-geometry.ts`
- `lib/element-metadata.ts`
- `lib/types.ts`
- `components/WallElevation.tsx` — SVG drawing logic (you will touch ONLY the `LayerBtn` function and its import line)
- `components/FloorPlan.tsx` — SVG drawing logic (you will touch ONLY the `LayerBtn` function and its import line)
- `components/InteriorPartitionDetails.tsx` — SVG drawing logic (you will touch ONLY the `LayerBtn` function and its import line)
- Any `viewBox`, `polygon`, `rect`, `path`, `line`, `text`, `g` SVG elements
- Any `wx()`, `wy()`, `px()` coordinate functions
- `HOUSE.md`

**The SVG elevation drawings are the entire point of this app. They do not get touched.**

---

## PHASE 1 — Install shadcn/ui (handles Tailwind automatically)

Run these commands in the project root (`Block House Frame/`):

```bash
npx shadcn@latest init
```

**When prompted, choose:**
- Style: **Default**
- Base color: **Zinc**
- CSS variables: **Yes**
- Global CSS file: `app/globals.css`
- Tailwind config: **Yes, create tailwind.config.ts**
- Components alias: `@/components` (default, press Enter)
- Utils alias: `@/lib/utils` (default, press Enter)

This will:
- Install `tailwindcss`, `postcss`, `autoprefixer`
- Create `tailwind.config.ts` and `postcss.config.mjs`
- Add Tailwind directives to `app/globals.css`
- Create `lib/utils.ts` (the `cn()` helper)
- Create `components/ui/` directory

Then install the specific components you need:

```bash
npx shadcn@latest add button
npx shadcn@latest add sheet
npx shadcn@latest add toggle
npx shadcn@latest add card
npx shadcn@latest add separator
npx shadcn@latest add badge
npx shadcn@latest add scroll-area
```

---

## PHASE 2 — Update `tailwind.config.ts`

After shadcn init creates `tailwind.config.ts`, confirm the `content` array includes all component paths. It should already be correct but verify it matches:

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      // shadcn init will populate this — do not modify
    },
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
```

---

## PHASE 3 — Update `app/globals.css`

shadcn init will prepend the Tailwind directives. After init, the top of `globals.css` should look like this. **Do not remove or reorder the existing custom CSS below the directives** — it is all still needed:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* shadcn/ui CSS variables — added by init, do not remove */
@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 240 10% 3.9%;
    --card: 0 0% 100%;
    --card-foreground: 240 10% 3.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 240 10% 3.9%;
    --primary: 240 5.9% 10%;
    --primary-foreground: 0 0% 98%;
    --secondary: 240 4.8% 95.9%;
    --secondary-foreground: 240 5.9% 10%;
    --muted: 240 4.8% 95.9%;
    --muted-foreground: 240 3.8% 46.1%;
    --accent: 240 4.8% 95.9%;
    --accent-foreground: 240 5.9% 10%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 0 0% 98%;
    --border: 240 5.9% 90%;
    --input: 240 5.9% 90%;
    --ring: 240 5.9% 10%;
    --radius: 0.5rem;
  }
}

/* ─── All existing CSS below this line — keep everything ─── */
* {
  box-sizing: border-box;
}
/* ... rest of existing globals.css unchanged ... */
```

**If shadcn init already added the variables block, leave it. Do not duplicate it.**

---

## PHASE 4 — Replace `components/HamburgerMenu.tsx`

Delete the entire file and replace with:

```tsx
"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

export function HamburgerMenu() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/15 hover:text-white"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>

      <SheetContent
        side="left"
        className="w-[280px] bg-[#2d2d2d] text-white border-r border-white/10 p-0"
      >
        <SheetHeader className="px-5 pt-5 pb-3">
          <SheetTitle className="text-white text-base font-semibold tracking-tight">
            Block House
          </SheetTitle>
        </SheetHeader>

        <Separator className="bg-white/15" />

        <nav className="flex flex-col gap-0.5 p-2 mt-1">
          <Link
            href="/"
            className="flex items-center px-3 py-2.5 rounded-md text-sm text-white/85 hover:bg-white/10 hover:text-white transition-colors"
          >
            First Floor Framing
          </Link>
          {/* Add new pages here as links — same pattern */}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
```

---

## PHASE 5 — Replace `LayerBtn` in three component files

The `LayerBtn` function exists in three files. In each file, do two things:
1. Add the import at the top
2. Replace the `LayerBtn` function body

**The LayerBtn replacement is IDENTICAL in all three files.**

### 5a. `components/WallElevation.tsx`

Add this import near the top (with the other imports, after React/Next imports):
```tsx
import { Toggle } from "@/components/ui/toggle";
```

Find the existing `LayerBtn` function (it looks like this):
```tsx
function LayerBtn({ label, on, toggle }: { label: string; on: boolean; toggle: () => void }) {
  return (
    <button onClick={toggle} style={{
      padding: "4px 14px", borderRadius: 20, border: "1px solid #bbb",
      background: on ? "#222" : "#fff", color: on ? "#fff" : "#555",
      fontSize: 12, cursor: "pointer", fontFamily: "ui-monospace,monospace",
      transition: "background 0.15s, color 0.15s",
    }}>
      {label}
    </button>
  );
}
```

Replace it entirely with:
```tsx
function LayerBtn({ label, on, toggle }: { label: string; on: boolean; toggle: () => void }) {
  return (
    <Toggle
      pressed={on}
      onPressedChange={toggle}
      size="sm"
      variant="outline"
      className="h-7 px-3 text-xs font-mono rounded-full border-zinc-300 text-zinc-600
                 data-[state=on]:bg-zinc-800 data-[state=on]:text-white
                 data-[state=on]:border-zinc-800 hover:bg-zinc-100
                 data-[state=on]:hover:bg-zinc-700 transition-all"
    >
      {label}
    </Toggle>
  );
}
```

### 5b. `components/FloorPlan.tsx`

Identical change — add the same import and replace the same `LayerBtn` function.

### 5c. `components/InteriorPartitionDetails.tsx`

Identical change — add the same import and replace the same `LayerBtn` function.

---

## PHASE 6 — Replace wall cards in `app/page.tsx`

### 6a. Add imports at the top of `page.tsx`

Add these imports (page.tsx is a Server Component — no "use client" needed for these):
```tsx
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
```

### 6b. Replace the Floor Plan card

Find:
```tsx
<div className="wall-card" style={{ marginBottom: "2rem" }}>
  <h3>Main Level — Floor Plan</h3>
  <div className="wall-parametric-wrap">
    <FloorPlan />
  </div>
</div>
```

Replace with:
```tsx
<Card className="overflow-visible shadow-sm mb-8">
  <CardHeader className="py-2.5 px-4 bg-zinc-100 border-b rounded-t-lg">
    <CardTitle className="text-sm font-medium text-zinc-700 tracking-wide uppercase">
      Main Level — Floor Plan
    </CardTitle>
  </CardHeader>
  <CardContent className="p-3">
    <div className="wall-parametric-wrap">
      <FloorPlan />
    </div>
  </CardContent>
</Card>
```

### 6c. Replace each wall elevation card

Find the map that renders wall cards:
```tsx
{WALL_ORDER.map((id) => {
  const wall = initialWalls[id];
  return (
    <div key={id} className="wall-card">
      <h3>
        {wall.name} — {formatInches(wall.totalLengthInches)} total
      </h3>
      <div className="wall-content">
        ...
      </div>
    </div>
  );
})}
```

Replace the outer `<div className="wall-card">` and `<h3>` and `<div className="wall-content">` wrapper as follows:

```tsx
{WALL_ORDER.map((id) => {
  const wall = initialWalls[id];
  return (
    <Card key={id} className="overflow-visible shadow-sm">
      <CardHeader className="py-2.5 px-4 bg-zinc-100 border-b rounded-t-lg flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-medium text-zinc-700 tracking-wide uppercase">
          {wall.name}
        </CardTitle>
        <Badge variant="secondary" className="font-mono text-xs font-normal">
          {formatInches(wall.totalLengthInches)}
        </Badge>
      </CardHeader>
      <CardContent className="p-3 flex flex-col items-center">
        {/* ALL EXISTING INNER CONTENT STAYS EXACTLY AS-IS — only the outer wrapper changed */}
        <div
          className="wall-parametric-wrap"
          style={{ width: `${(elevSvgW(wall.totalLengthInches) / maxElevW * 100).toFixed(2)}%` }}
        >
          <WallElevationView wall={wall} interactive={wall.id === "north"} />
        </div>
        <div className="wall-data-row">
          {/* ... all existing wall data summary and opening diagrams unchanged ... */}
        </div>
      </CardContent>
    </Card>
  );
})}
```

### 6d. Replace the Interior Partitions card

Find:
```tsx
<div className="wall-card" style={{ marginTop: "2rem" }}>
  <h3>Interior Partitions — Kitchen / Bathroom</h3>
  <InteriorPartitionDetails ... />
</div>
```

Replace with:
```tsx
<Card className="overflow-visible shadow-sm mt-8">
  <CardHeader className="py-2.5 px-4 bg-zinc-100 border-b rounded-t-lg">
    <CardTitle className="text-sm font-medium text-zinc-700 tracking-wide uppercase">
      Interior Partitions — Kitchen / Bathroom
    </CardTitle>
  </CardHeader>
  <CardContent className="p-3">
    <InteriorPartitionDetails
      stairWidthPct={`${(DOOR_WALL_SVG_W / maxElevW * 100).toFixed(2)}%`}
      partitionWidthPct={`${(HORIZ_PART_SVG_W / maxElevW * 100).toFixed(2)}%`}
    />
  </CardContent>
</Card>
```

---

## PHASE 7 — Polish the header in `app/page.tsx`

The `<header className="header">` element stays as-is for the dark background styling. Just ensure the title also gets slightly better typography. Find:

```tsx
<header className="header">
  <HamburgerMenu />
  <h1>Block House — First Floor Framing</h1>
</header>
```

Replace with:
```tsx
<header className="header">
  <HamburgerMenu />
  <div className="flex items-center gap-3">
    <h1 className="text-lg font-semibold tracking-tight text-white">
      Block House
    </h1>
    <span className="text-white/40 text-sm hidden sm:inline">—</span>
    <span className="text-white/70 text-sm font-mono hidden sm:inline">
      First Floor Framing
    </span>
  </div>
</header>
```

---

## PHASE 8 — Clean up `globals.css`

After the above changes, the following CSS classes in `globals.css` are now replaced by shadcn Card/Sheet components and can be REMOVED:

```
.hamburger-trigger
.hamburger-line
.nav-overlay
.nav-overlay--open
.nav-drawer
.nav-drawer--open
.nav-drawer-header
.nav-drawer-title
.nav-drawer-close
.nav-drawer-links
.nav-drawer-link
.wall-card
.wall-card h3
.wall-card .wall-content
```

**Keep all of these (still used):**
```
* { box-sizing }
body
.app
.header
.header h1
.main
.walls-grid
.wall-card .wall-content .wall-parametric-wrap   ← keep
.wall-card .wall-data-row                         ← keep
.wall-card .wall-data-row .wall-data-summary      ← keep
.wall-card .wall-data-row .sliding-door-column    ← keep
.wall-card .wall-data-row .opening-diagram-column ← keep
.wall-label
.wall-svg-wrap
.wall-parametric-wrap
.wall-data-summary and all its children
.wall-card svg / .wall-card .wall-svg             ← keep
@media (max-width: 640px)
```

---

## PHASE 9 — Verification Checklist

Run `npm run dev` and verify each of the following:

- [ ] App loads at localhost:3000 without errors
- [ ] Header shows dark bar with hamburger icon (lucide Menu icon) and title
- [ ] Clicking hamburger opens a smooth Sheet drawer from the left
- [ ] Sheet has dark background (#2d2d2d), white text, "First Floor Framing" link
- [ ] Clicking outside the Sheet or pressing Escape closes it
- [ ] Floor plan card shows with zinc header bar and CardTitle
- [ ] All 4 wall elevation cards render with zinc header bar and length Badge
- [ ] Layer toggle buttons render as pill-shaped Toggle components
- [ ] Active layer toggles show dark fill (zinc-800 background, white text)
- [ ] Inactive layer toggles show outline style (white bg, zinc border)
- [ ] Clicking a layer toggle correctly shows/hides that layer in the SVG
- [ ] Hovering over SVG framing elements still shows the tooltip (this was not touched)
- [ ] SVG elevation drawings look IDENTICAL to before — no coordinates changed
- [ ] Interior Partitions section renders with Card wrapper and correct SVGs
- [ ] No TypeScript errors (`npm run build` passes)
- [ ] No console errors in browser

---

## POTENTIAL GOTCHAS — Read before starting

**1. `"use client"` directive**
`app/page.tsx` is currently a Server Component (no "use client"). The Card and Badge imports from shadcn are compatible with Server Components. Do NOT add "use client" to page.tsx.

**2. Tailwind + existing CSS coexistence**
Tailwind's preflight resets some default browser styles (h1-h6 margins, etc.). The existing `globals.css` already has `* { box-sizing: border-box }` which Tailwind also sets — that's fine, no conflict. The wall-data-summary `ul` and `li` styles in globals.css use explicit padding/margin, so they won't be affected.

**3. SVG embedded `<style>` blocks**
The SVG components (WallElevation, FloorPlan, InteriorPartitionDetails) each have a `<style>` block inside the `<svg>` tag with class names like `.cmu`, `.plate`, `.stud`, `.header`, `.dl`, etc. These are scoped to the SVG rendering context and Tailwind will NOT affect them. Do not touch them.

**4. The `.header` CSS class**
`globals.css` has `.header` styling the `<header>` HTML element (dark bar). Tailwind does not have a `.header` utility class, so there is no conflict. Leave the `.header` CSS in globals.css as-is.

**5. `lib/utils.ts` creation**
shadcn init will create `lib/utils.ts` with the `cn()` helper function. This file does not conflict with any existing lib files. If a `lib/utils.ts` already exists for some reason, shadcn will ask to overwrite — say yes.

**6. Import paths**
The project uses `@/` path alias pointing to the project root. This is already configured in `tsconfig.json`. shadcn components will import correctly as `@/components/ui/...` and `@/lib/utils`.

**7. CardHeader flex row**
In Phase 6c, the CardHeader uses `flex flex-row items-center justify-between` for the wall name + badge layout. Confirm that CardHeader's default styles (it may have `flex-col` by default) are overridden correctly. If the badge appears below the title instead of beside it, add `!flex-row` to force the row direction.

---

## SUMMARY OF FILES CHANGED

| File | What changes |
|---|---|
| `package.json` | New deps added automatically by shadcn |
| `tailwind.config.ts` | Created by shadcn init |
| `postcss.config.mjs` | Created by shadcn init |
| `app/globals.css` | Tailwind directives + CSS variables prepended; some old classes removed |
| `lib/utils.ts` | Created by shadcn init (cn helper) |
| `components/ui/*` | Created by shadcn (Sheet, Toggle, Card, Button, Badge, Separator, ScrollArea) |
| `components/HamburgerMenu.tsx` | Replaced with shadcn Sheet implementation |
| `components/WallElevation.tsx` | LayerBtn function replaced with shadcn Toggle |
| `components/FloorPlan.tsx` | LayerBtn function replaced with shadcn Toggle |
| `components/InteriorPartitionDetails.tsx` | LayerBtn function replaced with shadcn Toggle |
| `app/page.tsx` | Wall card divs replaced with shadcn Card; header text polish |

## FILES NOT TOUCHED (zero changes)

`lib/framing-data.ts` · `lib/stair-calculator.ts` · `lib/layout-calculator.ts` · `lib/plan-geometry.ts` · `lib/element-metadata.ts` · `lib/types.ts` · `HOUSE.md` · All SVG drawing logic inside the three elevation components
