# Block House — Construction Encyclopedia

## Measurement System

- **Base unit:** inches
- **Origin:** SE exterior corner of CMU shell (0, 0)
- **Plan X:** runs west (positive)
- **Plan Y:** runs north (positive)
- **Elevation Y:** runs up from floor (positive), 0 = subfloor
- **Note:** North and east elevations are mirrored (left in elevation = west/north in plan). Use `planPosToElevationX()` / `elevationXToPlanPos()` in `lib/plan-geometry.ts` for conversions.

## Key Reference Planes (inches from origin)

### Plan

> **Legacy constant names:** The code constants `FN_*`, `FS_*`, `FW_*`, `FE_*` and `CI_N`, `CI_S` were named
> under the original (incorrect) compass orientation and have **not** been renamed in the codebase.
> Their mapping to the corrected compass: FN = south side, FS = north side, FW = east side, FE = west side,
> CI_N = south interior CMU face, CI_S = north interior CMU face.

- CMU exterior east face:  0"
- CMU interior east face:  8"   → CI_L
- Frame outer face (east): 9"   → FW_OUT
- Frame inner face (east): 14.5" → FW_IN
- Frame inner face (west): 289.5" → FE_IN
- Frame outer face (west): 295"  → FE_OUT
- CMU interior west face:  296"  → CI_R
- CMU exterior west face:  304"  → CMU_W
- CMU interior south face: 8"   → CI_N
- Frame inner face (south): 14.5" → FN_IN
- Frame inner face (north): 169.5" → FS_IN
- CMU interior north face: 176"  → CI_S

### Vertical

- Subfloor (main):          0"
- Bottom plate top:         1.5"  → PLATE_H
- Stud top:                 113"  (computed from wallHeightInches − TOP_H = 116 − 3.0)
- Top plate top:            116"  → wallHeightInches
- TJI joist bottom:         116"
- TJI joist top:            127.875" (116 + TJI_DEPTH)
- Second floor subfloor:    128.625" (116 + TJI_DEPTH + SUBFLOOR_T)
- Bathroom raised floor:    22.698" (STAIR_LAND_RISERS × rise; matches landing)

## How To Make Changes

- All physical dimensions → `lib/framing-data.ts`
- Plan-space geometry → `lib/plan-geometry.ts` (do not edit directly — derived from framing-data)
- To move a piece: find its entry below, change the constant listed
- If entry says "computed from X" — change X only
- Never hardcode measurements in components
- After any change: `npm run dev`, verify visually

## Common Change Patterns

### Move an opening left/right

Edit `positionFromLeftInches` on the opening in `initialWalls.[wall].openings[0]`. Note: north and east openings are mirrored in plan — moving right in elevation moves left in plan view.

### Resize an opening

Edit `widthInches` and/or `heightInches` on the opening. Sill height: edit `sillHeightInches`.

### Move the kitchen/bath partition

Edit `PARTITION_WALL_R` in framing-data.ts. Automatically updates: horizontal partition length, bathroom zone, counter position, backing studs, raised floor extent, plan view.

### Change wall height

Edit `wallHeightInches` on the relevant wall in initialWalls. Note: affects stair geometry on north wall (FLOOR2_IN is derived).

### Change stair geometry

Edit `STAIR_TOTAL_RISERS`, `STAIR_TREAD_DEPTH`, `STAIR_LAND_RISERS`, or `STAIR_WIDTH` in framing-data.ts. All stair positions and landing height are computed from these.

### Add a new opening

Add an object to `openings[]` on the relevant wall:

```ts
{
  type: "door" | "window",
  widthInches: number,
  heightInches: number,
  positionFromLeftInches: number,
  sillHeightInches?: number  // windows only
}
```

## Design Decisions

- **PARTITION_WALL_R = 96"** — Places partition at 6 CMU blocks from exterior; aligns with block module grid.
- **STAIR_LAND_RISERS = 3** — Landing height 22.698"; matches bathroom raised floor height intentionally.
- **EAST_WIN_POS = 72"** — Window at 4.5 bays from north; bathroom partition south edge aligns with window jamb.
- **Bathroom raised floor at 22.7"** — Matches landing height so threshold is level.

## Header Schedule

| ID | Wall | RO Width | Spec | Note |
|----|------|----------|------|------|
| south-hdr-0 | South | 39" | (3) 2×8 on edge w/ OSB spacer | Review for MN snow load |
| north-hdr-0 | North | 40" | (3) 2×8 on edge w/ OSB spacer | Review for MN snow load |
| west-hdr-0 | West | 79" | 3.5" × 11.25" LVL beam | Engineer required |
| east-hdr-0 | East | 72" | 3.5" × 9.25" LVL beam | Engineer required |
| vert-partition-hdr-0 | Bath door | 28" | (2) 2×6 default | Non-bearing, OK |

All headers sized for two-story flat roof, northern Minnesota (60–80 psf ground snow load).
Final sizing must be confirmed by a licensed structural engineer before construction.

## Anchor Bolt Schedule

Standard: ½" diameter × 7" embed, per IRC R403.1.6
Spacing: 6' OC maximum; within 12" of plate ends; within 3" of high-load jack stud positions.

| Wall | x positions (inches) | Notes |
|------|----------------------|-------|
| West | 6, 38.5, 120.5, 160 | Critical bolts at jack stud point loads (38.5, 120.5) |
| South | TBD | Add after double-jack review |
| North | TBD | Add after double-jack review |
| East | 6, 72, 138, 160 | IRC R403.1.6: four bolts on continuous 166" plate. Max spacing 66". No critical point load positions — window has sill (jacks do not bear to floor). |

---

## South Wall — 286" (23'-10") total

**Source:** `initialWalls.south` in framing-data.ts. `wallHeightInches: 116`. One door 39" × 80" at positionFromLeftInches 127. Stud override: `south-stud-12` dx +1.5".

### south-bp-0 — Bottom plate (left of door)

- **ID:** south-bp-0
- **Member:** 2×6 × 128.5"
- **Count:** 1
- **Location:** x=0" to 128.5", y=0" in elevation
- **Plan position:** east interior frame (FW_IN) to door left jamb (SD_L)
- **Connected to:** slab (anchor bolt), studs (toe nail)
- **Controls:** computed from `initialWalls.south.openings[0].positionFromLeftInches`, SW
- **Notes:** Left segment only; door at floor breaks plate.

### south-bp-1 — Bottom plate (right of door)

- **ID:** south-bp-1
- **Member:** 2×6 × 121.5"
- **Count:** 1
- **Location:** x=164.5" to 286", y=0" in elevation
- **Plan position:** door right jamb (SD_R) to west interior frame (FE_IN)
- **Connected to:** slab (anchor bolt), studs (toe nail)
- **Controls:** computed from opening position/width, totalLengthInches
- **Notes:** Right segment only.

### south-tp-0-1 — Top plate lower #1

- **ID:** south-tp-0-1
- **Member:** 2×6 × 192" (lower course, first piece)
- **Count:** 1
- **Location:** x=0" to 192", y=113" in elevation
- **Plan position:** full wall span (splice at 192")
- **Connected to:** studs (end nail), splice with tp-0-2
- **Controls:** MAX_PLATE_LENGTH_IN (192) in layout-calculator; W > 192 triggers splice
- **Notes:** South wall 286" > 192" so lower top plate is spliced.

### south-tp-0-2 — Top plate lower #2

- **ID:** south-tp-0-2
- **Member:** 2×6 × 94"
- **Count:** 1
- **Location:** x=192" to 286", y=113" in elevation
- **Connected to:** studs (end nail), splice with tp-0-1
- **Controls:** computed from totalLengthInches − MAX_PLATE_LENGTH_IN
- **Notes:** Second piece of lower course.

### south-tp-1-1 — Top plate upper #1

- **ID:** south-tp-1-1
- **Member:** 2×6 × 96"
- **Count:** 1
- **Location:** x=0" to 96", y=114.5" in elevation
- **Connected to:** lower top plate, studs (end nail)
- **Controls:** studSpacingOC × 6 = 96" (staggered splice)
- **Notes:** Upper course staggered so splice not over lower splice.

### south-tp-1-2 — Top plate upper #2

- **ID:** south-tp-1-2
- **Member:** 2×6 × 190"
- **Count:** 1
- **Location:** x=96" to 286", y=114.5" in elevation
- **Connected to:** lower top plate, studs (end nail)
- **Controls:** computed from totalLengthInches − 96
- **Notes:** Upper course second piece.

### south-stud-0 through south-stud-22 — Studs

- **ID:** south-stud-0 through south-stud-22
- **Member:** 2×6 × 111.5" (full-height) or shorter (jack, cripple)
- **Count:** 23
- **Location:** x at 16" OC from 0" to 284.5"; full studs y=1.5", height 111.5"; jacks/cripples vary
- **Plan position:** varies; elevation X maps to plan X (south wall)
- **Connected to:** bottom plate (toe nail), top plate (end nail); kings/jacks also to header (face nail)
- **Controls:** studSpacingOC 16, openings, wallHeightInches 116; STUD_BASE = PLATE_H, STUD_H = H − PLATE_H − TOP_H = 116 − 1.5 − 3.0 = 111.5"
- **Notes:** Includes full studs, left/right king, jacks, cripples above header, end king. `south-stud-12` has studOverrides dx +1.5" in framing-data.

### south-hdr-0 — Header

- **ID:** south-hdr-0
- **Member:** (3) 2×8 on edge w/ OSB spacer × 36"
- **Count:** 1
- **Location:** x=128.5" to 164.5", y=80" (top of door) in elevation
- **Plan position:** over door rough opening
- **Connected to:** king studs, jack studs (face nail); cripples above (end nail)
- **Controls:** `initialWalls.south.openings[0].headerSpec` — depth 7.25", 3 plies; review with engineer for MN snow load
- **Notes:** Cripple zone above header is now taller (36" at 116" wall vs. 10.5" at 96" wall).

### south-open-0 — Door opening

- **ID:** south-open-0
- **Member:** N/A (void)
- **Count:** 1
- **Location:** x=128.5" to 164.5", y=0" to 80" in elevation
- **Plan position:** SD_L to SD_R (plan-geometry)
- **Connected to:** N/A
- **Controls:** `initialWalls.south.openings[0]` (positionFromLeftInches 127, widthInches 39, heightInches 80)
- **Notes:** Door at floor; no sill.

### south-rim-left — Rim board (left)

- **ID:** south-rim-left
- **Member:** 1.25" × 11.875" (rim × TJI depth)
- **Count:** 1
- **Location:** x=0" to 1.5", y=116" in elevation
- **Plan position:** east end of south wall at top plate
- **Connected to:** top plate (bearing), TJI joists (end bearing)
- **Controls:** TJI_RIM_T 1.5, TJI_DEPTH 11.875; jBase = wallHeightInches
- **Notes:** South and north walls only; closes joist bay at left.

### south-rim-right — Rim board (right)

- **ID:** south-rim-right
- **Member:** 1.25" × 11.875"
- **Count:** 1
- **Location:** x=284.5" to 286", y=116" in elevation
- **Connected to:** top plate (bearing), TJI joists (end bearing)
- **Controls:** computed from totalLengthInches − TJI_RIM_T
- **Notes:** Closes joist bay at right.

### south-tji-0 through south-tji-16 — TJI joists

- **ID:** south-tji-0 through south-tji-16
- **Member:** TJI (2 × 1.5" flange visible in elevation) × 11.875" depth
- **Count:** 17
- **Location:** x from 16.75" to 267.75" at 16" OC (centers); y=116" in elevation
- **Plan position:** along south wall at second-floor level
- **Connected to:** rim boards, top plate (bearing); subfloor (face nail)
- **Controls:** TJI_OC 16, TJI_RIM_T, totalLengthInches; JOIST_W = SW 1.5; positions from TJI_OC + joistOffset to lastJoistX
- **Notes:** lastJoistX = wallLen − TJI_RIM_T − JOIST_W.

### south-subfloor — Subfloor

- **ID:** south-subfloor
- **Member:** 3/4" OSB × 286"
- **Count:** 1
- **Location:** x=0" to 286", y=127.875" (top of TJI) in elevation
- **Plan position:** full south wall at second floor
- **Connected to:** TJI flanges (face nail)
- **Controls:** SUBFLOOR_T 0.75, totalLengthInches; jTop = wallHeightInches + TJI_DEPTH
- **Notes:** Second-floor deck.

---

## North Wall — 286" (23'-10") total

**Source:** `initialWalls.north`. `wallHeightInches: 116`. One window 40" × 48", sill 36", positionFromLeftInches 151. Includes bathroom zone, partition overlay, stair, and floor joists.

### north-bp-0 — Bottom plate

- **ID:** north-bp-0
- **Member:** 2×6 × 286"
- **Count:** 1
- **Location:** x=0" to 286", y=0" in elevation
- **Plan position:** full north wall (no door at floor)
- **Connected to:** slab (anchor bolt), studs (toe nail)
- **Controls:** `initialWalls.north.totalLengthInches`
- **Notes:** Single full-length plate; window does not break plate.

### north-tp-0-1, north-tp-0-2, north-tp-1-1, north-tp-1-2 — Top plates

- **ID:** north-tp-0-1, north-tp-0-2, north-tp-1-1, north-tp-1-2
- **Member:** 2×6 spliced (same as south: 192" + 94" lower; 96" + 190" upper)
- **Count:** 4
- **Location:** y=113" and 114.5"; x spans 0–286" (splice at 192" lower, 96" upper)
- **Connected to:** studs (end nail)
- **Controls:** same as south (totalLengthInches 286, MAX_PLATE_LENGTH_IN, studSpacingOC)
- **Notes:** North elevation X mirrored: left = west in plan.

### north-stud-0 through north-stud-N — Studs

- **ID:** north-stud-0 through north-stud-N (exact count from layout)
- **Member:** 2×6 × 111.5" full-height or partial (king, jack, cripple below sill, cripple above header)
- **Count:** Computed by layout-calculator (fillGap, kings, jacks, cripples, end king)
- **Location:** 16" OC; full at y=1.5", height 111.5"; jacks/cripples at sill/header heights
- **Plan position:** elevation X → plan via planPosToElevationX("north", …)
- **Connected to:** bottom plate (toe nail), top plate (end nail); jacks to sill/header (face nail)
- **Controls:** studSpacingOC 16, openings (window 151", 40", sill 36"), wallHeightInches 116
- **Notes:** Window has cripples below sill and above header.

### north-sill-0 — Sill plate

- **ID:** north-sill-0
- **Member:** 2×6 on edge (sill) × 37"
- **Count:** 1
- **Location:** x=152.5" to 190.5", y=40" in elevation
- **Plan position:** over window RO at sill height
- **Connected to:** jack studs (face nail), cripples below (end nail)
- **Controls:** opening positionFromLeftInches 151, widthInches 40, sillHeightInches 40 (5 CMU courses × 8"); SW
- **Notes:** Sill aligns with top of 5th CMU course. Windows only; door at floor has no sill.

### north-hdr-0 — Header

- **ID:** north-hdr-0
- **Member:** (3) 2×8 on edge w/ OSB spacer × 37"
- **Count:** 1
- **Location:** x=152.5" to 190.5", y=88" (40" sill + 48" window height) in elevation
- **Connected to:** king/jack studs (face nail), cripples above (end nail)
- **Controls:** `initialWalls.north.openings[0].headerSpec` — depth 7.25", 3 plies; review with engineer for MN snow load
- **Notes:** Cripple zone above header: 116 − 88 − 7.25 = 20.75".

### north-open-0 — Window opening

- **ID:** north-open-0
- **Member:** N/A (void)
- **Count:** 1
- **Location:** x=152.5" to 190.5", y=40" to 88" in elevation
- **Plan position:** NW_L to NW_R (plan-geometry)
- **Connected to:** N/A
- **Controls:** `initialWalls.north.openings[0]` (positionFromLeftInches 151, widthInches 40, heightInches 48, sillHeightInches 40)
- **Notes:** North wall window. Sill at 5 CMU courses (40").

### north-partition-vert — 2×4 partition (vertical)

- **ID:** north-partition-vert
- **Member:** 2×4 partition wall (3.5" thick) × full height 116"
- **Count:** 1
- **Location:** x = planPosToElevationX("north", PARTITION_WALL_R + INT_D) to planPosToElevationX("north", PARTITION_WALL_R) (elevation); y=0" to 116"
- **Plan position:** x = 96" to 99.5" (PARTITION_WALL_R to PARTITION_WALL_R + INT_D), north wall zone
- **Connected to:** north wall (end nail), backing studs (face nail)
- **Controls:** PARTITION_WALL_R 96, INT_D 3.5; planPosToElevationX("north", …)
- **Notes:** Vertical kitchen/bath partition in elevation; shown when Bathroom layer on.

### north-backing-1, north-backing-2 — Backing studs (T-junction)

- **ID:** north-backing-1, north-backing-2
- **Member:** 2×6 × 111.5" (full height minus plates)
- **Count:** 2
- **Location:** x = planPosToElevationX("north", PARTITION_WALL_R + SW) and PARTITION_WALL_R + 2×SW; y=1.5" in elevation
- **Plan position:** at partition west face, 96" + 1.5" and 96" + 3" (north wall inner face)
- **Connected to:** bottom plate (toe nail), top plate (end nail), partition (face nail)
- **Controls:** PARTITION_WALL_R, SW; computed from plan-geometry
- **Notes:** Two 2×6s side-by-side for partition nailing surface.

### north-rim-left, north-rim-right — Rim boards

- **ID:** north-rim-left, north-rim-right
- **Member:** 1.25" × 11.875"
- **Count:** 2
- **Location:** x=0 to 1.5" and x=284.5" to 286", y=116" in elevation
- **Connected to:** top plate (bearing), TJI joists (end bearing)
- **Controls:** same as south (TJI_RIM_T, TJI_DEPTH, totalLengthInches)
- **Notes:** Same logic as south wall.

### north-tji-0 through north-tji-16 — TJI joists

- **ID:** north-tji-0 through north-tji-16
- **Member:** TJI × 11.875" depth
- **Count:** 17
- **Location:** x 16.75" to 267.75" at 16" OC, y=116"
- **Connected to:** rim boards, top plate (bearing), subfloor (face nail)
- **Controls:** same as south (TJI_OC, TJI_RIM_T, totalLengthInches)
- **Notes:** Same as south; north elevation mirrored.

### north-subfloor — Subfloor

- **ID:** north-subfloor
- **Member:** 3/4" OSB × 286"
- **Count:** 1
- **Location:** x=0" to 286", y=127.875" in elevation
- **Connected to:** TJI flanges (face nail)
- **Controls:** SUBFLOOR_T, totalLengthInches, jTop
- **Notes:** Second-floor deck.

### north-bath-cleat-0 through north-bath-cleat-4 — Ledger cleat

- **ID:** north-bath-cleat-0 through north-bath-cleat-4
- **Member:** 2×4 on edge (1.5" visible in elevation) × (jBot − PLATE_H)"
- **Count:** 5
- **Location:** x = sx + SW for each studXs[i] (sx = 208, 224, 240, 256, 272"); y=1.5" to jBot (15.5") in elevation
- **Plan position:** at north wall inner face (FS_IN), within bathroom zone (partition to wall end)
- **Connected to:** bottom plate (toe nail), joists bear on cleat
- **Controls:** BATH_JOIST_OC 16, PARTITION_WALL_R (bathL), totalLengthInches (platR); jBot = PLAT_H − BATH_SUBFLOOR_T − BATH_JOIST_H; PLAT_H from STAIR_LAND_RISERS, FLOOR2_IN
- **Notes:** studXs filtered where sx >= bathL − 0.5 && sx <= platR + 0.5; bathL = planPosToElevationX("north", 96) = 199".

### north-bath-joist-0 through north-bath-joist-4 — 2×6 floor joist

- **ID:** north-bath-joist-0 through north-bath-joist-4
- **Member:** 2×6 × 5.5" (BATH_JOIST_H) visible in elevation
- **Count:** 5
- **Location:** x = sx + SW (same as cleats); y=jBot (15.5") to 21" in elevation
- **Plan position:** N-S span in bathroom; bear on ledger at north, partition at south
- **Connected to:** ledger cleat (bears on), subfloor (face nail)
- **Controls:** BATH_JOIST_H 5.5, SW 1.5; same studXs as cleats
- **Notes:** Joists sit on cleats; no overlap with stud in elevation.

### north-bath-subfloor — Bath subfloor

- **ID:** north-bath-subfloor
- **Member:** 3/4" OSB × (286 − bathL)" (elevation) = 87" in elevation; plan span PARTITION_WALL_R to north wall
- **Count:** 1
- **Location:** x=bathL (199") to 286", y=21" (jTop) in elevation
- **Plan position:** bathroom floor from partition (96") to FS_IN (169.5")
- **Connected to:** 2×6 joists (face nail)
- **Controls:** BATH_SUBFLOOR_T 0.75, platR − bathL, bathL from PARTITION_WALL_R
- **Notes:** Raised bathroom platform deck.

### north-counter — Kitchen counter

- **ID:** north-counter
- **Member:** Fixture (counter height) × (ctrR − ctrL)" in elevation
- **Count:** 1
- **Location:** x=ctrL to ctrR (elevation), y=0" to 36" (COUNTER_H)
- **Plan position:** PARTITION_WALL_R + INT_D to FW_IN (kitchen side of partition)
- **Connected to:** Partition / wall (support)
- **Controls:** PARTITION_WALL_R, INT_D, FW_IN, COUNTER_H 36
- **Notes:** Cabinets layer; ctrL = planPosToElevationX("north", PARTITION_WALL_R + INT_D), ctrR = planPosToElevationX("north", FW_IN).

### north-landing — Landing

- **ID:** north-landing
- **Member:** Landing platform (stair)
- **Count:** 1
- **Location:** x=151" to 191" (window RO), y=0" to 22.698" (LAND_H) in elevation
- **Plan position:** aligns with north window RO (NW_L to NW_R)
- **Connected to:** North wall (bearing), main stair run (bearing)
- **Controls:** STAIR_LAND_RISERS 3, FLOOR2_IN/STAIR_TOTAL_RISERS; landL/landR from north opening positionFromLeftInches and widthInches
- **Notes:** LAND_H = 22.698"; matches bathroom raised floor.

### north-main-stair — Main stair run

- **ID:** north-main-stair
- **Member:** Stair run (main flight)
- **Count:** 1
- **Location:** x=stairEndX to stairStartX (151" − 130" = 21" to 151"), y=22.698" to 22.698 + MAIN_RISE in elevation
- **Plan position:** west from landing along north wall
- **Connected to:** Landing (bearing), stringer (supports)
- **Controls:** STAIR_TREAD_DEPTH 10, MAIN_TREADS 13, MAIN_RISERS 14; stairStartX = landL, stairEndX = landL − MAIN_TREADS × STAIR_TREAD_DEPTH
- **Notes:** MAIN_RISE = 14 × (FLOOR2_IN/17) = 105.927".

### north-stringer — 2×12 Notched Stringer

- **ID:** north-stringer
- **Member:** 2×12 × ~157" (13'-1") — one per side, 2 total
- **Count:** 2
- **Location:** x=stairEndX (21") to stairStartX (151"), diagonal from LAND_H to FLOOR2_IN in elevation
- **Plan position:** under main stair run, flanking stair width
- **Connected to:** Landing deck (seat cut + anchor bracket), second floor rim (plumb cut + hanger)
- **Controls:** STAIR_TREAD_DEPTH 9, RISER (~7.57"), STAIR_STRINGER_DEPTH 11.25"
- **Throat depth:** ~4.2" (IRC R311.7.5.2 minimum 3.5" ✓)
- **Slope:** 40.1° (arctan 7.57/9)
- **Top cut:** plumb cut at second floor rim
- **Bottom cut:** seat cut on landing deck
- **Notches:** 13 seat cuts (9" run) + 13 plumb cuts (7.57" rise)
- **Notes:** Rendered as realistic notched polygon — step-notch top edge with perpendicular offset (11.25") for bottom edge. Soffit fill behind.

---

## West Wall — 166" (13'-10") total

**Source:** `initialWalls.west`. `wallHeightInches: 116`. One door 79" × **73"** (6'7" × 5'11") at positionFromLeftInches 40. **jackCount: 2** (double jack studs). **anchorBolts: [6, 38.5, 120.5, 160]**.

### west-bp-0 — Bottom plate (left of door)

- **ID:** west-bp-0
- **Member:** 2×6 × 41.5"
- **Count:** 1
- **Location:** x=0" to 41.5", y=0" in elevation
- **Plan position:** south interior frame to door top jamb (WD_T)
- **Connected to:** slab (anchor bolt), studs (toe nail)
- **Controls:** opening positionFromLeftInches 40, SW
- **Notes:** Door at floor breaks plate.

### west-bp-1 — Bottom plate (right of door)

- **ID:** west-bp-1
- **Member:** 2×6 × 48.5"
- **Count:** 1
- **Location:** x=117.5" to 166", y=0" in elevation
- **Plan position:** door bottom jamb (WD_B) to north interior frame
- **Connected to:** slab (anchor bolt), studs (toe nail)
- **Controls:** opening, totalLengthInches 166
- **Notes:** Right segment.

### west-tp-0, west-tp-1 — Top plates

- **ID:** west-tp-0, west-tp-1
- **Member:** 2×6 × 166" (no splice; W ≤ 192)
- **Count:** 2 (lower and upper course)
- **Location:** x=0" to 166", y=113" and 114.5" in elevation
- **Connected to:** studs (end nail)
- **Controls:** totalLengthInches 166, TOP_H; W ≤ MAX_PLATE_LENGTH_IN so single piece per course
- **Notes:** West elevation: left = south in plan.

### west-stud-0 through west-stud-N — Studs

- **ID:** west-stud-0 through west-stud-N
- **Member:** 2×6 × 111.5" full-height or jack (door)
- **Count:** Computed by layout-calculator (fillGap 0–40, king left, double jacks ×2 each side, king right, fillGap 119–164.5, end king)
- **Location:** 16" OC; full y=1.5", height 111.5"; jacks 0 to 73"
- **Plan position:** elevation X maps to plan Y (west wall)
- **Connected to:** bottom plate (toe nail), top plate (end nail); jacks to header (face nail)
- **Controls:** studSpacingOC 16, openings (40", 79"), wallHeightInches 116, **jackCount: 2**
- **Notes:** **Double jack studs each side** per engineering review for 76" clear span LVL under two-story flat roof, northern MN snow load. Left jacks at x=41.5" and 43"; right jacks at x=115.5" and 114". Door height 73" (5'11" RO).

### west-hdr-0 — Header

- **ID:** west-hdr-0
- **Member:** 3.5" × 11.25" LVL beam × 76" (king-to-king span)
- **Count:** 1
- **Location:** x=41.5" to 117.5", y=73" in elevation
- **Connected to:** double jack studs (bears on, face nail to kings), cripples above (end nail)
- **Controls:** `initialWalls.west.openings[0].headerSpec` — depth 11.25", 2 plies LVL; engineer required, 6'7" span flat roof MN snow load
- **Notes:** LVL fits 2×6 wall without OSB spacer. Bears on double jacks each side. Cripple zone 116 − 73 − 11.25 = 31.75" above header.

### west-open-0 — Door opening

- **ID:** west-open-0
- **Member:** N/A (void)
- **Count:** 1
- **Location:** x=41.5" to 117.5", y=0" to 73" in elevation (king-to-king)
- **Plan position:** WD_T to WD_B
- **Connected to:** N/A
- **Controls:** `initialWalls.west.openings[0]` (positionFromLeftInches 40, widthInches 79, heightInches 73, jackCount 2)
- **Notes:** Sliding door 6'7" × 5'11". Double jack studs each side.

### west-ab-0 through west-ab-3 — Anchor Bolts

- **ID:** west-ab-0, west-ab-1, west-ab-2, west-ab-3
- **Member:** ½" × 7" embed anchor bolt
- **Count:** 4
- **Location:** x=6", 38.5", 120.5", 160" on bottom plate (y=0")
- **Connected to:** bottom plate (embed through), slab (cast-in)
- **Controls:** `initialWalls.west.anchorBolts` in framing-data.ts
- **Notes:** Per IRC R403.1.6. Bolts at 38.5" and 120.5" are critical — within 3" of jack stud point loads under LVL. Bolts at 6" and 160" within 12" of plate ends. Toggle "Anchor Bolts" layer to view.

---

## East Wall — 166" (13'-10") total

**Source:** `initialWalls.east`. `wallHeightInches: 116`. One window 72" × 48", sill 36", positionFromLeftInches 72.

### east-bp-0 — Bottom plate

- **ID:** east-bp-0
- **Member:** 2×6 × 166"
- **Count:** 1
- **Location:** x=0" to 166", y=0" in elevation
- **Plan position:** full east wall
- **Connected to:** slab (anchor bolt), studs (toe nail)
- **Controls:** totalLengthInches 166
- **Notes:** No door at floor; single plate.

### east-tp-0, east-tp-1 — Top plates

- **ID:** east-tp-0, east-tp-1
- **Member:** 2×6 × 166"
- **Count:** 2
- **Location:** x=0" to 166", y=113" and 114.5" in elevation
- **Connected to:** studs (end nail)
- **Controls:** totalLengthInches 166, TOP_H
- **Notes:** East elevation mirrored: left = north in plan.

### east-stud-0 through east-stud-N — Studs

- **ID:** east-stud-0 through east-stud-N
- **Member:** 2×6 × 111.5" full-height or jack/cripple (window)
- **Count:** Computed by layout-calculator (fillGap to 72, king left, double jacks ×2 each side, sill, cripples below, king right, header, cripples above, fillGap, end king)
- **Location:** 16" OC; full at y=1.5", height 111.5"; jacks/cripples at sill/header
- **Plan position:** elevation X → plan Y via planPosToElevationX("east", …)
- **Connected to:** bottom plate (toe nail), top plate (end nail); jacks to sill/header (face nail)
- **Controls:** EAST_WIN_POS 72, opening 72×48 sill 36, studSpacingOC 16, wallHeightInches 116, **jackCount: 2**
- **Notes:** **Double jack studs each side** per engineering review for 69" clear span LVL under two-story flat roof, northern MN snow load. Left jacks at x=73.5" and 75"; right jacks at x=139" and 140.5". Window has cripples below sill and above header.

### east-sill-0 — Sill plate

- **ID:** east-sill-0
- **Member:** 2×6 on edge × 69"
- **Count:** 1
- **Location:** x=73.5" to 141" (72+1.5 to 72+72−1.5), y=36" in elevation
- **Connected to:** jack studs (face nail), cripples below (end nail)
- **Controls:** opening positionFromLeftInches 72, widthInches 72, sillHeightInches 36; SW
- **Notes:** Rough sill at window.

### east-hdr-0 — Header

- **ID:** east-hdr-0
- **Member:** 3.5" × 9.25" LVL beam × 69"
- **Count:** 1
- **Location:** x=73.5" to 141", y=84" in elevation
- **Connected to:** king/jack studs (face nail), cripples above (end nail)
- **Controls:** `initialWalls.east.openings[0].headerSpec` — depth 9.25", LVL; engineer required, 6' span flat roof MN snow load. LVL fits 2×6 wall without spacer.
- **Notes:** Cripple zone 116 − 84 − 9.25 = 22.75" above header.

### east-open-0 — Window opening

- **ID:** east-open-0
- **Member:** N/A (void)
- **Count:** 1
- **Location:** x=73.5" to 141", y=36" to 84" in elevation
- **Plan position:** EW_T to EW_B
- **Connected to:** N/A
- **Controls:** `initialWalls.east.openings[0]` (positionFromLeftInches 72, widthInches 72, heightInches 48, sillHeightInches 36)
- **Notes:** Canopy window.

---

## Interior — Horizontal Partition (Kitchen/Bath)

**Source:** `horizPartition` in framing-data.ts. id: `horiz-partition`. `wallHeightInches: 116`. totalLengthInches = HORIZ_PART_LENGTH = 81.5". No openings in horizPartition; used for elevation view only (InteriorPartitionDetails right panel).

### horiz-partition-bp-0 — Bottom plate

- **ID:** horiz-partition-bp-0
- **Member:** 2×6 × 81.5"
- **Count:** 1
- **Location:** x=0" to 81.5", y=0" in elevation (partition local coordinates)
- **Plan position:** FW_IN (14.5") to PARTITION_WALL_R (96") along horizontal partition
- **Connected to:** floor (anchor), studs (toe nail)
- **Controls:** HORIZ_PART_LENGTH = PARTITION_WALL_R − (CMU_T + FR_GAP + FR_D) = 81.5"
- **Notes:** Horizontal partition; no door in this wall definition (door is in vertical partition).

### horiz-partition-tp-0, horiz-partition-tp-1 — Top plates

- **ID:** horiz-partition-tp-0, horiz-partition-tp-1
- **Member:** 2×6 × 81.5"
- **Count:** 2
- **Location:** x=0" to 81.5", y=113" and 114.5" in elevation
- **Connected to:** studs (end nail)
- **Controls:** totalLengthInches 81.5, TOP_H
- **Notes:** W ≤ 192 so no splice.

### horiz-partition-stud-0 through horiz-partition-stud-N — Studs

- **ID:** horiz-partition-stud-0 through horiz-partition-stud-N
- **Member:** 2×6 × 111.5" (2×4 partition; INT_SW 1.5 in plan — elevation shows 2×6 cross-section for consistency with exterior)
- **Count:** Computed by fillGap(0, 81.5−SW) + end king; 16" OC
- **Location:** x at 16" OC from 0 to 80"; y=1.5", height 111.5"
- **Plan position:** along horizontal partition (kitchen/bath)
- **Connected to:** bottom plate (toe nail), top plate (end nail)
- **Controls:** studSpacingOC 16, totalLengthInches 81.5, wallHeightInches 116
- **Notes:** horizPartition has openings: [] in framing-data; layout produces only field studs + end king.

### horiz-partition-hdr-*, horiz-partition-open-*

- **ID:** None (horizPartition has no openings)
- **Notes:** No header or opening rects generated for horizontal partition.

---

## Interior — Vertical Partition (Bathroom Door Wall)

**Source:** `vertPartition` in framing-data.ts. id: `vert-partition`. `wallHeightInches: 116`. totalLengthInches = VERT_PART_LENGTH = 50". One door 28" RO at positionFromLeftInches 0.

### vert-partition-bp-0 — Bottom plate (left of door)

- **ID:** vert-partition-bp-0
- **Member:** 2×6 × 1.5" (dl = 0 + SW; door at 0 so left segment is 0 to 1.5")
- **Count:** 1
- **Location:** x=0" to 1.5", y=0" in elevation (partition local)
- **Plan position:** north end of vertical partition (bathroom door wall)
- **Connected to:** floor, studs (toe nail)
- **Controls:** opening positionFromLeftInches 0, widthInches 28; dl = 1.5"
- **Notes:** Minimal left segment.

### vert-partition-bp-1 — Bottom plate (right of door)

- **ID:** vert-partition-bp-1
- **Member:** 2×6 × 23.5" (dr = 28 − 1.5 = 26.5; 50 − 26.5 = 23.5")
- **Count:** 1
- **Location:** x=26.5" to 50", y=0" in elevation
- **Connected to:** floor, studs (toe nail)
- **Controls:** opening, totalLengthInches 50
- **Notes:** Right of door RO.

### vert-partition-tp-0, vert-partition-tp-1 — Top plates

- **ID:** vert-partition-tp-0, vert-partition-tp-1
- **Member:** 2×6 × 50"
- **Count:** 2
- **Location:** x=0" to 50", y=113" and 114.5" in elevation
- **Connected to:** studs (end nail)
- **Controls:** totalLengthInches 50, TOP_H
- **Notes:** No splice.

### vert-partition-stud-0 through vert-partition-stud-N — Studs

- **ID:** vert-partition-stud-0 through vert-partition-stud-N
- **Member:** 2×6 × 111.5" full-height or jack (door)
- **Count:** Computed by layout (fillGap 0–0, king left, jacks, king right, header, opening, cripples above, fillGap 28–48.5, end king)
- **Location:** 16" OC; full y=1.5", height 111.5"; jacks 0 to 80"
- **Plan position:** vertical partition (bathroom door wall) in plan
- **Connected to:** bottom plate (toe nail), top plate (end nail); jacks to header (face nail)
- **Controls:** BATH_DOOR_RO 28, VERT_PART_LENGTH 50, studSpacingOC 16, wallHeightInches 116
- **Notes:** VERT_PART_LENGTH = EAST_WIN_POS − FR_D − PARTITION_V_OFFSET = 72 − 5.5 − 16.5 = 50".

### vert-partition-hdr-0 — Header

- **ID:** vert-partition-hdr-0
- **Member:** (2) 2×6 on edge (default) × 25" (28 − 2×SW)
- **Count:** 1
- **Location:** x=1.5" to 26.5", y=80" in elevation
- **Connected to:** king/jack studs (face nail), cripples above (end nail)
- **Controls:** HEADER_D = 5.5 (layout-calculator default) — no headerSpec; non-bearing interior partition
- **Notes:** Bathroom door rough opening. Adequate for non-bearing partition. Cripple zone 116 − 80 − 5.5 = 30.5".

### vert-partition-open-0 — Door opening

- **ID:** vert-partition-open-0
- **Member:** N/A (void)
- **Count:** 1
- **Location:** x=1.5" to 26.5", y=0" to 80" in elevation
- **Connected to:** N/A
- **Controls:** vertPartition.openings[0] (positionFromLeftInches 0, widthInches 28, heightInches 80)
- **Notes:** 28" bathroom door RO.

---

## Bathroom Raised Floor

All IDs are on the **north** wall elevation; bathroom layer must be toggled on.

### north-bath-cleat-0 through north-bath-cleat-4 — Ledger cleat

- **ID:** north-bath-cleat-0 through north-bath-cleat-4
- **Member:** 2×4 on edge (1.5" wide in elevation) × (jBot − PLATE_H)" = 14"
- **Count:** 5
- **Location:** x=209.5", 225.5", 241.5", 257.5", 273.5" (sx + SW for sx = 208, 224, 240, 256, 272); y=1.5" to 15.5" in elevation
- **Plan position:** North wall inner face (FS_IN 169.5"), between partition (96") and wall end; joists run N-S
- **Connected to:** Bottom plate (toe nail), 2×6 joists bear on cleat
- **Controls:** BATH_JOIST_OC 16, PARTITION_WALL_R (bathL), totalLengthInches; jBot computed from STAIR_LAND_RISERS, FLOOR2_IN, BATH_SUBFLOOR_T, BATH_JOIST_H
- **Notes:** Cleat runs from top of bottom plate to bottom of joist; 1.5" = 2×4 thickness in elevation.

### north-bath-joist-0 through north-bath-joist-4 — 2×6 floor joist

- **ID:** north-bath-joist-0 through north-bath-joist-4
- **Member:** 2×6 × 5.5" depth (BATH_JOIST_H)
- **Count:** 5
- **Location:** x same as cleats; y=15.5" to 21" in elevation
- **Plan position:** N-S span; north end on ledger, south end on horizontal partition north face
- **Connected to:** Ledger cleat (bears on), bath subfloor (face nail)
- **Controls:** BATH_JOIST_H 5.5, SW 1.5; same studXs as cleats
- **Notes:** Joist butts stud face (sx + SW); no overlap with stud.

### north-bath-subfloor — Bath subfloor

- **ID:** north-bath-subfloor
- **Member:** 3/4" OSB (BATH_SUBFLOOR_T) × (platR − bathL)" in elevation = 87"
- **Count:** 1
- **Location:** x=199" to 286", y=21.948" to 22.698" in elevation
- **Plan position:** Bathroom floor; east edge at partition (96"), north at FS_IN (169.5")
- **Connected to:** 2×6 joists (face nail)
- **Controls:** BATH_SUBFLOOR_T 0.75, PARTITION_WALL_R, totalLengthInches; sfBot = jTop
- **Notes:** Raised floor top at PLAT_H = STAIR_LAND_RISERS × (FLOOR2_IN / STAIR_TOTAL_RISERS) = 22.698".

---

## Stair System

### North wall elevation (Stairs layer)

- **north-landing** — Landing platform; x=151" to 191", y=0" to 22.698"; bears on north wall; aligned with window RO. Controls: STAIR_LAND_RISERS 3, north opening position/width, FLOOR2_IN/STAIR_TOTAL_RISERS.
- **north-main-stair** — Main stair run; x=21" to 151", y=22.698" to landing + MAIN_RISE; bears on landing. Controls: STAIR_TREAD_DEPTH 10, MAIN_TREADS 13, MAIN_RISERS 14.
- **north-stringer** — Stringer/soffit; x=21" to 151", y=0 to soffit; supports main run. Controls: same as main-stair; geometry from rise/run.

### InteriorPartitionDetails (stair landing detail)

No element IDs; tooltips use **labels** only. Reference by label when asking the agent:

- **4×4 Post** — STAIR_LAND_POST_W 3.5", height LAND_JOIST; at STAIR_WIDTH − post width.
- **2×6 Bearing Block** — Full height from bottom plate to joist bottom; north wall backing for landing.
- **2×10 Rim Header** — STAIR_LAND_RIM_W × STAIR_LAND_JOIST_D; at landing south edge.
- **2×10 Joist (N-S)** — Landing joists at 16" OC; bear on north wall cleat and rim header.
- **¾" Plywood Deck** — STAIR_LAND_DECK_T; landing walking surface.
- **2×12 Notched Stringer (×2)** — Approach steps; STAIR_TREAD_DEPTH, RH (FLOOR2_IN/STAIR_TOTAL_RISERS).
- **5/4×12 Tread Board** — Tread 1, Tread 2; STAIR_TREAD_T 1.0.
- **1×8 Riser Board** — Riser 2, Riser 3; STAIR_RISER_T 0.75.

Constants: STAIR_LAND_JOIST_W, STAIR_LAND_JOIST_D, STAIR_LAND_RIM_W, STAIR_LAND_DECK_T, STAIR_LAND_POST_W, STAIR_TREAD_T, STAIR_RISER_T, STAIR_TOTAL_RISERS, STAIR_LAND_RISERS, TJI_DEPTH, SUBFLOOR_T.

IMPORTANT: Riser height corrected from 8.575" to 7.566" by
increasing STAIR_TOTAL_RISERS from 15 to 17. Previous riser
height exceeded IRC R311.7.5.1 maximum of 7.75".
Main run now 13 treads × 10" = 130" total horizontal run.
stairEndX = 21" from east end of north wall.
STAIR_RISE_TOT constant deleted; landing height now computed
dynamically as STAIR_LAND_RISERS × (FLOOR2_IN / STAIR_TOTAL_RISERS).

## Stair Calculator — lib/stair-calculator.ts

`computeStairLayout(config: StairConfig) → StairLayout`

Input: StairConfig (from framing-data constants)
Output: All stair members as Rect arrays in north wall elevation coordinates

Member IDs generated:
- north-stair-ljoist-0, north-stair-ljoist-1 — landing joists
- north-stair-rim — rim header
- north-stair-ledger — bearing block at north wall
- north-stair-post — 4×4 post
- north-stair-deck — plywood deck
- north-stair-appr-tread-0, north-stair-appr-tread-1 — approach treads
- north-stair-appr-riser-0, north-stair-appr-riser-1 — approach risers
- north-stair-tread-0 through north-stair-tread-12 — main treads (13)
- north-stair-riser-0 through north-stair-riser-13 — main risers (14)
- north-stair-kickplate — kick plate at stringer base
- north-stair-top-ledger — ledger at second floor

### Implementation Status
- First floor stair (WallElevation.tsx north wall): wired to computeStairLayout()
- Second floor stair (NorthWallSecondFloor.tsx): wired to computeStairLayout()
- landRisers: 0 supported for straight runs with no landing
- Stringer polygon includes complete closed shape (notched top edge + smooth bottom edge)
- Tread rects include nosing overhang (nosing field added to StairConfig)

---

## North Wall — Second Floor

**Source:** `secondFloorNorthWall` in framing-data.ts
**Length:** 286" (23'-10") — same as first floor
**Height:** 116" (9'-8") — same as first floor
**Studs:** 2×6 @ 16" OC — no openings, clean wall
**Anchor bolts:** [6, 72, 138, 204, 280] — five bolts, 72" OC max

### CMU Background
- CMU shell: 23 courses × 8" = 184" total from slab
- First floor deck at: 128.625" (FLOOR2_IN)
- CMU above second floor deck: 184" - 128.625" = 55.375"
- T.O. CMU line at y=55.375" on second floor elevation
- Above 55.375": wood frame only, no CMU

### Second Floor Stair (straight run, no landing)
- Straight run uses all 17 risers — no landing risers subtracted
- stairStartX: 180" (bottom of run, at second floor deck)
- stairEndX: 36" (top of run, at third floor)
- Total risers: 17 @ 7.566" each (all in main run)
- Total treads: 16 @ 9" run + 1" nosing
- Horizontal run: 144" (16 × 9")
- Stringer: 2×12 notched, 11.25" deep, ~4.2" throat ✓
- Stringer bottom: horizontal seat cut bearing on second floor deck
- Bottom landing: 36" clear deck x=180" to x=216" (second floor)
- Top landing: 36" clear deck x=36" to x=72" (third floor)
- Controls: STAIR2_START_X, STAIR_TREAD_DEPTH, STAIR2_TOTAL_RISERS

### Key Dimensions
| Item | Value |
|------|-------|
| Wall length | 286" |
| Wall height | 116" |
| Stud height | 111.5" |
| CMU zone | 0"–55.375" |
| Wood only zone | 55.375"–116" |
| Third floor line | 128.625" above second floor deck |
| Stair bottom x | 180" |
| Stair top x | 36" |
| Bottom landing | x=180"–216", y=0 |
| Top landing | x=36"–72", y=128.625" |

---

## Floor System (First → Second Floor)

TJI joists, rim boards, and subfloor appear only on **South** and **North** wall elevations (first-floor ceiling / second-floor structure).

### Rim boards

- **south-rim-left**, **south-rim-right** — 1.5" × 11.875"; x=0 and 284.5–286", y=96". Controls: TJI_RIM_T, TJI_DEPTH, totalLengthInches.
- **north-rim-left**, **north-rim-right** — Same; north elevation mirrored.

### TJI joists

- **south-tji-0 through south-tji-16** — 17 joists; x centers 16.75" to 267.75" at 16" OC; y=96". Controls: TJI_OC 16, TJI_RIM_T 1.5, TJI_DEPTH 11.875, totalLengthInches 286; JOIST_W = SW 1.5.
- **north-tji-0 through north-tji-16** — Same count and spacing.

### Subfloor

- **south-subfloor** — 3/4" OSB; x=0–286", y=107.875" (top of TJI). Controls: SUBFLOOR_T 0.75, wallHeightInches, TJI_DEPTH.
- **north-subfloor** — Same.

All positions computed in WallElevation from layout.totalLengthInches, layout.wallHeightInches, and framing-data constants (no direct editing of plan-geometry for floor system).
