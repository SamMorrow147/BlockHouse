# Block House — Parts Catalog

**Purpose:** Define every distinct component *type* in the construction once, then map every *instance* to it. This gives AI (and humans) a single document to assess completeness, trace connections, and identify gaps without reverse-engineering the app or HOUSE.md.

**How to use this with AI:** Feed this document alongside HOUSE.md. Ask things like:
- "Which instances have incomplete connection data?"
- "Trace the load path from roof deck to foundation for the west wall."
- "What component types exist in the data model but have no instances on the third floor?"
- "Which zones have no sheathing or weather barrier documented?"

---

## CRITICAL: Building Structure & Roof Position

**READ THIS FIRST.** The building has three levels but the ROOF is NOT on top of the third floor. The structure is:

| Level | What's There | Top Elevation | Notes |
|-------|-------------|---------------|-------|
| **1st Floor** | Full floor — all 4 exterior walls, interior partitions, kitchen, bathroom, stairs | ~126.25" (FLOOR2_IN) | TJI joists + subfloor form the 2F deck |
| **2nd Floor** | Full floor — all 4 exterior walls, straight stair run | ~252.5" (FLOOR3_IN) | TJI joists + subfloor form the **ROOF DECK** |
| **ROOF** | **The roof membrane assembly sits HERE at FLOOR3_IN (~252.5")** | ~252.5" + buildup | Batts in joist bays, polyiso, EPDM membrane on TOP of the 2F joist system |
| **3rd Floor (Loft)** | **Partial** — only the west ~120" of the building. Built ON TOP of the roof deck. | ~342.5" (FLOOR3_IN + 90") | Open balcony on the east side. Shed roof slopes from 84" to 116" above the loft deck. |

**The roof deck = the top of the 2nd floor structure = FLOOR3_IN.** The 3rd floor loft is a partial structure built on top of the roof, not under it. The shed roof at the loft level is a separate, higher roof structure over just the loft portion.

**Why this matters:** When rendering or calculating roof assembly materials (EPDM membrane, insulation, coping, scuppers), the vertical position is FLOOR3_IN (~252.5"), NOT the top of the 3rd floor walls or the CMU top (184"). Getting this wrong places the roof 90–115" too high or too low.

---

## Part 1 — Component Type Registry

Each type is defined once. Instances (in Part 2) reference these types by ID.

---

### CT-001: Bottom Plate

| Field | Value |
|-------|-------|
| **Type ID** | CT-001 |
| **Common Name** | Bottom plate / sole plate / sill plate |
| **Cross-Section** | 2×6 (1.5" × 5.5") — exterior walls and horizontal partition; 2×4 (1.5" × 3.5") — vertical partition |
| **Material** | AC2 pressure-treated SPF (ground contact); untreated SPF for raised partitions |
| **Orientation** | Flat (wide face down on slab/deck) |
| **Function** | Transfers vertical loads from studs to foundation/deck. Anchors wall to slab. Provides nailing surface for stud toes. |
| **Standard Connections** | **Below:** slab or deck via anchor bolts (CT-008) with sill sealer (CT-014) between. **Above:** studs (CT-005) via toe nail. **Ends:** butt to adjacent wall bottom plate or terminate at opening. |
| **Breaks At** | Door openings (no plate under doors). Window openings do NOT break the plate. |
| **Code Reference** | IRC R602.3.1 — Bottom plate attachment |
| **SKUs** | 111-1066 (2×6-16' treated), 111-1040 (2×6-12' treated), 111-1037 (2×6-10' treated), 111-0818 (2×4-8' treated) |
| **App Rendering** | ✅ Rendered in all wall elevations as horizontal rect at y=0 |
| **Controlling Data** | `initialWalls.[wall].totalLengthInches`, opening positions |

---

### CT-002: Top Plate (Double)

| Field | Value |
|-------|-------|
| **Type ID** | CT-002 |
| **Common Name** | Double top plate (lower course + upper course) |
| **Cross-Section** | 2×6 (1.5" × 5.5") per course — two courses stacked |
| **Material** | SPF #2 or better |
| **Orientation** | Flat (wide face horizontal) |
| **Function** | Ties wall together at top. Distributes header/joist loads to studs. Upper course overlaps lower course splices to create continuous tie. |
| **Standard Connections** | **Below (lower):** studs (CT-005) via end nail. **Above (lower):** upper top plate via face nail 16" OC. **Above (upper):** rim boards (CT-009), TJI joists (CT-010), or rafters bear on top. **Splices:** lower course spliced at max 192" (16'); upper course staggered so no splice aligns with lower splice. |
| **Splice Rules** | Walls ≤192": single piece per course, no splice. Walls >192": lower spliced at 192", upper at 96" (staggered 6 bays). |
| **Code Reference** | IRC R602.3.2 — Double top plates, splice offset ≥48" from lower splice |
| **SKUs** | 102-1790 (2×6-16' SPF), 102-1761 (2×6-10' SPF) |
| **App Rendering** | ✅ Rendered at y=113" (lower) and y=114.5" (upper) in elevations |
| **Controlling Data** | `wallHeightInches`, `MAX_PLATE_LENGTH_IN`, `studSpacingOC` |

---

### CT-003: Header

| Field | Value |
|-------|-------|
| **Type ID** | CT-003 |
| **Common Name** | Header / lintel |
| **Cross-Section** | Varies by span — see Header Schedule in HOUSE.md |
| **Material** | Built-up dimensional lumber with OSB spacer (small spans) or LVL beam (large spans) |
| **Orientation** | On edge (depth vertical) |
| **Function** | Spans opening, transfers loads from above (top plate, joists, upper floors) around the opening to jack studs. |
| **Standard Connections** | **Sides:** king studs (CT-005) via face nail; bears on jack studs (CT-005). **Above:** cripple studs (CT-005) via end nail. **Below:** opening void. |
| **Sizing Rules** | Non-bearing interior: (2) 2×6 default. Bearing exterior ≤40" span: (3) 2×8 w/ OSB spacer. Bearing exterior >60" span: LVL beam, engineer required. All sized for two-story flat roof, 60–80 psf MN snow load. |
| **Code Reference** | IRC R602.7, Table R602.7(1) — Headers |
| **SKUs** | 102-1790 (2×6/2×8 stock), LVL specified by engineer |
| **App Rendering** | ✅ Rendered over all openings with depth from headerSpec |
| **Controlling Data** | `initialWalls.[wall].openings[n].headerSpec` |

---

### CT-004: Sill Plate (Window)

| Field | Value |
|-------|-------|
| **Type ID** | CT-004 |
| **Common Name** | Rough sill / window sill plate |
| **Cross-Section** | 2×6 on edge (5.5" face visible) |
| **Material** | SPF |
| **Orientation** | On edge (flat face toward window) |
| **Function** | Defines bottom of window rough opening. Provides nailing for window flange. Distributes point loads from window weight to cripple studs below. |
| **Standard Connections** | **Sides:** jack studs (CT-005) via face nail. **Below:** cripple studs (CT-005) via end nail. **Above:** window opening void. |
| **Code Reference** | IRC R602.6 — Rough openings |
| **SKUs** | Cut from 102-1790 (2×6-16' SPF) |
| **App Rendering** | ✅ Rendered on north and east wall windows |
| **Controlling Data** | `opening.sillHeightInches`, `opening.widthInches` |

---

### CT-005: Stud (Full, King, Jack, Cripple)

| Field | Value |
|-------|-------|
| **Type ID** | CT-005 |
| **Common Name** | Wall stud |
| **Cross-Section** | 2×6 (1.5" × 5.5") exterior; 2×4 (1.5" × 3.5") interior partition |
| **Material** | SPF precut or cut-to-length |
| **Orientation** | Vertical (narrow face toward wall surface) |
| **Function** | Transfers vertical loads from top plate to bottom plate. Provides nailing surface for sheathing and interior finish. |
| **Sub-Types** | |
| — Full stud | Floor-to-ceiling (111.5" in 116" wall). 16" OC field layout. |
| — King stud | Full-height stud immediately flanking an opening. Carries header load to plate. |
| — Jack stud | Shortened stud from bottom plate to underside of header. Bears header directly. Single or double per engineering. |
| — Cripple (above header) | Short stud from top of header to underside of top plate. Maintains 16" OC layout through opening zone. |
| — Cripple (below sill) | Short stud from top of bottom plate to underside of sill. Maintains 16" OC layout. Windows only. |
| — End king | Final full stud at wall end for corner nailing. |
| **Standard Connections** | **Bottom:** bottom plate (CT-001) via toe nail. **Top:** top plate (CT-002) via end nail. **Kings:** also face-nailed to header (CT-003). **Jacks:** face-nailed to king, bear header. |
| **Code Reference** | IRC R602.3 — Stud spacing, R602.6 — Jack studs at openings |
| **SKUs** | 102-1046 (2×6-92-5/8" precut), 102-1101 (2×4-8' precut) |
| **App Rendering** | ✅ All sub-types rendered in elevations with correct heights |
| **Controlling Data** | `studSpacingOC`, `wallHeightInches`, `openings[]`, `jackCount` |

---

### CT-006: Backing Stud (T-Junction)

| Field | Value |
|-------|-------|
| **Type ID** | CT-006 |
| **Common Name** | Backing stud / partition nailer |
| **Cross-Section** | 2×6 (1.5" × 5.5") — two side-by-side |
| **Material** | SPF |
| **Function** | Provides nailing surface at partition-to-exterior wall T-junction. Two studs flat against exterior wall inner face where partition meets. |
| **Standard Connections** | **Bottom:** bottom plate (CT-001) via toe nail. **Top:** top plate (CT-002) via end nail. **Face:** partition end plate (CT-001) via face nail. |
| **Code Reference** | IRC R602.3 — Wall intersections |
| **App Rendering** | ✅ Rendered on north wall elevation at partition junction |
| **Controlling Data** | `PARTITION_WALL_R`, `SW` |

---

### CT-007: Interior Partition Wall (Assembly)

| Field | Value |
|-------|-------|
| **Type ID** | CT-007 |
| **Common Name** | Interior partition wall |
| **Cross-Section** | 2×6 (plumbing chase) or 2×4 (standard) |
| **Material** | SPF (treated bottom plate if on slab) |
| **Sub-Types** | |
| — Horizontal partition | Kitchen/bath divider, 81.5" long, no openings. 2×6 for plumbing chase. |
| — Vertical partition | Bathroom door wall, 50" long, one 28" door. 2×4. |
| **Function** | Divides interior spaces. Non-bearing (does not carry floor/roof loads). |
| **Standard Connections** | **Ends:** backing studs (CT-006) at exterior wall. **Floor:** slab via anchor or powder-actuated fastener. **Ceiling:** top plate to ceiling joists or blocking above. |
| **App Rendering** | ✅ Both partitions rendered in elevation and plan views |
| **Controlling Data** | `PARTITION_WALL_R`, `HORIZ_PART_LENGTH`, `VERT_PART_LENGTH`, `BATH_DOOR_RO` |

---

### CT-008: Anchor Bolt

| Field | Value |
|-------|-------|
| **Type ID** | CT-008 |
| **Common Name** | Anchor bolt / wedge anchor |
| **Size** | ½" diameter × 7" embed (wedge anchor for CMU) |
| **Material** | Hot-dip galvanized steel |
| **Function** | Secures bottom plate to slab/CMU foundation. Resists uplift and lateral forces. |
| **Standard Connections** | **Through:** bottom plate (CT-001), sill sealer (CT-014). **Into:** CMU bond beam or slab. |
| **Spacing Rules** | 6' OC maximum; within 12" of plate ends; within 3" of high-load jack stud positions (at headers). |
| **Code Reference** | IRC R403.1.6 |
| **SKUs** | 232-7897 (½" × 5-1/2" HDG wedge anchor) |
| **App Rendering** | ✅ Rendered as dots on west wall; data defined for east wall. South/north TBD. |
| **Controlling Data** | `initialWalls.[wall].anchorBolts[]` |

---

### CT-009: Rim Board

| Field | Value |
|-------|-------|
| **Type ID** | CT-009 |
| **Common Name** | Rim board / band joist / rim joist |
| **Cross-Section** | 1-1/8" × depth (matches TJI depth) |
| **Material** | Engineered rim board (LVL or OSB composite) |
| **Orientation** | Vertical, at ends of joist bays |
| **Function** | Closes floor system at wall lines. Transfers joist end reactions to top plate. Provides lateral bracing for joist ends. Fire-stops joist bays at perimeter. |
| **Standard Connections** | **Below:** top plate (CT-002) — bears on. **Sides:** TJI joists (CT-010) — end bearing/nailed. **Above:** subfloor (CT-011) — nailed. |
| **SKUs** | 106-8025 (1-1/8" × 9-1/2" × 12' rim board) |
| **Note** | ~~Discrepancy resolved~~ — `TJI_RIM_T` updated to 1.125" in framing-data.ts to match SKU. |
| **App Rendering** | ✅ Rendered at joist bay ends on south/north walls |
| **Controlling Data** | `TJI_RIM_T`, `TJI_DEPTH` |

---

### CT-010: TJI Floor Joist

| Field | Value |
|-------|-------|
| **Type ID** | CT-010 |
| **Common Name** | I-joist / TJI joist |
| **Cross-Section** | 2-1/2" flange × depth (see discrepancy) |
| **Material** | Engineered wood I-joist (OSB web, LVL/LSL flanges) |
| **Orientation** | Vertical web, flanges horizontal |
| **Function** | Spans north-to-south (~166" interior, bearing on south and north wall top plates). Supports subfloor and live/dead loads. South and north walls are the primary bearing walls; east and west walls are non-bearing for floor loads. |
| **Standard Connections** | **Ends:** rim boards (CT-009) or joist hangers at bearing walls. **Top flange:** subfloor (CT-011) via adhesive + ring-shank nails. **Bottom flange:** ceiling finish (future). **Bearing:** top plate (CT-002). |
| **Spacing** | 16" OC |
| **SKUs** | 106-5882 (2-1/2" × 9-1/2" × 16' PRI-40 I-Joist) |
| **Note** | ~~Discrepancy resolved~~ — `TJI_DEPTH` updated to 9.5" in framing-data.ts to match SKU. |
| **App Rendering** | ✅ Rendered on south/north wall elevations at floor level |
| **Controlling Data** | `TJI_OC`, `TJI_DEPTH`, `TJI_RIM_T` |

---

### CT-011: Subfloor

| Field | Value |
|-------|-------|
| **Type ID** | CT-011 |
| **Common Name** | Subfloor / floor deck |
| **Cross-Section** | 3/4" (23/32") T&G OSB |
| **Material** | OSB DryMax or equivalent structural panel |
| **Function** | Walking/working surface. Transfers live and dead loads to joists. Provides diaphragm action (lateral bracing) for floor system. |
| **Standard Connections** | **Below:** TJI flanges (CT-010) via PL400 adhesive + ring-shank nails. **Above:** finish floor or direct traffic. |
| **Code Reference** | IRC R503.2.1 |
| **SKUs** | 124-2888 (3/4" T&G OSB DryMax), 124-2889 (alt SKU) |
| **App Rendering** | ✅ Rendered as thin horizontal band above TJI on south/north walls |
| **Controlling Data** | `SUBFLOOR_T`, `TJI_DEPTH`, `wallHeightInches` |

---

### CT-012: Bathroom Raised Floor (Assembly)

| Field | Value |
|-------|-------|
| **Type ID** | CT-012 |
| **Common Name** | Raised bathroom platform |
| **Components** | Ledger cleats (2×4 on edge), 2×6 floor joists, 3/4" OSB subfloor |
| **Function** | Creates elevated floor in bathroom at landing height (22.698"). Provides space for drain plumbing below. Level threshold with stair landing. |
| **Standard Connections** | **Cleats:** toe-nailed to bottom plate (CT-001), bear on north wall studs (CT-005). **Joists:** bear on cleats, span N-S from north wall to horizontal partition. **Subfloor:** nailed to joist tops. |
| **Finished Height** | 22.698" (matches stair landing — intentional) |
| **App Rendering** | ✅ Rendered on north wall elevation (bathroom layer toggle) |
| **Controlling Data** | `BATH_JOIST_OC`, `BATH_JOIST_H`, `BATH_SUBFLOOR_T`, `STAIR_LAND_RISERS`, `PARTITION_WALL_R` |

---

### CT-013: Stair System (Assembly)

| Field | Value |
|-------|-------|
| **Type ID** | CT-013 |
| **Common Name** | Stair system |
| **Sub-Assemblies** | Landing platform, main stair run, stringers, treads, risers, kick plate, approach steps |
| **Function** | Provides code-compliant vertical circulation between floors. |
| **Key Dimensions** | Riser: 7.566" (IRC max 7.75" ✓). Tread run: 9" + 1" nosing (IRC min 10" tread depth ✓ with nosing). Total risers 1→2: 17. Landing risers: 4. Main risers: 13. Approach steps: 3. Main treads: 12. Second floor stair: straight run, 17 risers, no landing, starts at x=180". |
| **Standard Connections** | **Landing:** bears on north wall + 4×4 post + rim header. **Stringers:** seat cut on landing deck, plumb cut at second floor rim. **Treads/risers:** face-nailed to stringer notches. |
| **Code Reference** | IRC R311.7 — Stairways |
| **App Rendering** | ✅ First and second floor stairs rendered. Notched stringer polygons. |
| **Controlling Data** | `STAIR_*` constants in framing-data.ts, `computeStairLayout()` in stair-calculator.ts |

---

### CT-014: Sill Sealer

| Field | Value |
|-------|-------|
| **Type ID** | CT-014 |
| **Common Name** | Sill sealer foam / gasket |
| **Cross-Section** | 5-1/2" wide × ~1/4" thick foam strip |
| **Material** | Closed-cell foam |
| **Function** | Air seal and moisture barrier between CMU/slab and treated bottom plate. Prevents capillary moisture rise. |
| **Standard Connections** | **Below:** CMU bond beam or slab top. **Above:** bottom plate (CT-001). Anchor bolts (CT-008) pass through. |
| **SKUs** | 161-1605 (5-1/2" × 50' sill sealer foam) |
| **App Rendering** | ⚪ Not rendered (thin consumable — no practical SVG layer) |
| **Controlling Data** | N/A |

---

### CT-015: Wall Sheathing

| Field | Value |
|-------|-------|
| **Type ID** | CT-015 |
| **Common Name** | Structural wall sheathing |
| **Cross-Section** | 7/16" × 4'×8' panels |
| **Material** | OSB |
| **Function** | Provides racking resistance (shear wall). Nailing base for weather barrier. Braces studs against buckling. |
| **Standard Connections** | **Back:** studs (CT-005) via structural nails per schedule. **Front:** house wrap (CT-016). **Edges:** top plate (CT-002), bottom plate (CT-001). |
| **Code Reference** | IRC R602.10 — Wall bracing |
| **SKUs** | 124-2728 (7/16" × 4×8 OSB) |
| **App Rendering** | 🟡 Not yet rendered — new layer needed |
| **Controlling Data** | Not yet in framing-data.ts |

---

### CT-016: Weather Barrier (House Wrap)

| Field | Value |
|-------|-------|
| **Type ID** | CT-016 |
| **Common Name** | House wrap / WRB |
| **Material** | Tamlyn Elite or equivalent |
| **Function** | Weather-resistive barrier. Prevents bulk water intrusion while allowing vapor to escape. |
| **Standard Connections** | **Back:** wall sheathing (CT-015) via staples. **Front:** exterior cladding (not yet defined). **Seams:** taped with ForceField Premium tape. |
| **Code Reference** | IRC R703.2 — Weather-resistive barrier |
| **SKUs** | 161-3015 (9' × 125' house wrap), 124-2823 (tape), 231-2194 (staples) |
| **App Rendering** | 🟡 Not yet rendered — new layer needed |
| **Controlling Data** | Not yet in framing-data.ts |

---

### CT-017: CMU Shell (Existing)

| Field | Value |
|-------|-------|
| **Type ID** | CT-017 |
| **Common Name** | CMU block shell / masonry walls |
| **Cross-Section** | 8" nominal CMU (7-5/8" actual) |
| **Coursing** | 23 courses × 8" = 184" total height |
| **Exterior Dimensions** | 304" × 184" (E-W × N-S) |
| **Interior Dimensions** | 288" × 168" |
| **Function** | Structural shell. Bears all gravity and lateral loads to foundation. Wood frame is infill within CMU. |
| **Standard Connections** | **To wood frame:** anchor bolts (CT-008) through bottom plate (CT-001) into bond beam. 1" air gap between CMU interior face and frame outer face. |
| **App Rendering** | ✅ Rendered in all wall elevations (running bond pattern) and floor plan |
| **Controlling Data** | `CMU_T`, `CMU_INTERIOR_W`, `CMU_D`, plan-geometry.ts constants |

---

### CT-018: CMU-Only Opening

| Field | Value |
|-------|-------|
| **Type ID** | CT-018 |
| **Common Name** | CMU-only opening / masonry opening |
| **Function** | Opening cut in the CMU shell that does not correspond to a wood-frame opening. May be for ventilation, future windows at upper floors, or structural relief. Distinct from framed openings — supported by CMU lintel courses, not wood headers/jack studs. |
| **Structural Support** | Solid CMU lintel course (typically course 10 at 80"–88") spans across the opening. No wood header involved. |
| **Standard Connections** | **Edges:** surrounding CMU coursing. **Lintel:** solid CMU course above or bond beam. **Below:** CMU courses or foundation. |
| **Instances** | South wall: 1 (40"×40" window at sill 136"). West wall: 2 (71"×72" below lintel at sill 8", 71"×88" above lintel at sill 88"). East wall: 1 (40"×40" at sill 136"). |
| **App Rendering** | ✅ Rendered via `type: "cmu-only"` in openings array — CMU blocks clipped at opening zone |
| **Controlling Data** | `initialWalls.[wall].openings[]` where `type === "cmu-only"` |

---

### CT-019: Corner Assembly

| Field | Value |
|-------|-------|
| **Type ID** | CT-019 |
| **Common Name** | Corner framing / corner post |
| **Function** | Connects perpendicular wall frames at building corners. Transfers loads between intersecting walls. Provides interior drywall nailing surface at corners. |
| **Configuration** | Per code comment in framing-data.ts (line 298): "E/W end studs tie into N/S plates." Exact corner assembly type (California corner, three-stud, two-stud with clips) is **not specified** — this is a gap. |
| **Standard Connections** | **E/W wall end king stud (CT-005):** face-nailed or clipped to N/S wall bottom plate and top plate. **Both walls:** top plates overlap at corner per IRC R602.3.2 (upper top plate extends past lower on alternating walls). |
| **Code Reference** | IRC R602.3 — Corner framing, R602.3.2 — Top plate lap at corners |
| **Instances** | 8 total: SE, SW, NE, NW × first floor + second floor. Third floor has 2–3 (partial walls). |
| **App Rendering** | ⚪ Not rendered — plan view shows walls meeting but no corner detail |
| **Controlling Data** | Not in framing-data.ts. Needs: corner type, nailing schedule, drywall backing method. |
| **⚠️ Gap** | Corner assembly type must be decided. Affects: insulation continuity (California corners allow full insulation; three-stud does not), drywall backing, and lateral load transfer between walls. |

---

### CT-020: Stairwell Floor Opening Framing

| Field | Value |
|-------|-------|
| **Type ID** | CT-020 |
| **Common Name** | Stairwell opening / floor opening header and trimmers |
| **Function** | Frames the rectangular hole in the floor system where stairs pass through. Interrupted joists are supported by doubled headers; doubled trimmer joists carry the header loads to bearing walls. Required by code whenever floor joists are cut for an opening. |
| **Components** | |
| — Doubled trimmer joists | Full-span TJI joists on each side of the opening, doubled (2 TJIs sistered together). Run the full N-S span. Carry concentrated loads from headers. |
| — Doubled headers | Short TJI or LVL members spanning between trimmer joists at each end of the opening (east and west ends). Carry loads from interrupted joists. |
| — Tail joists | Shortened TJI joists that were cut to create the opening. Bear on headers via joist hangers instead of spanning full N-S distance. |
| — Joist hangers | Metal connectors at every tail-joist-to-header and header-to-trimmer connection. |
| **Standard Connections** | **Trimmers:** bear on south and north wall top plates (CT-002) like regular joists. **Headers:** face-nailed/bolted to trimmers; joist hangers at each end. **Tail joists:** joist hangers into headers. **Subfloor:** continuous over trimmers, cut at opening. |
| **Code Reference** | IRC R502.10 — Framing of openings. Headers required when more than one joist is interrupted. |

**First Floor Stairwell Opening (1→2 transition):**

| Dimension | Value | Source |
|-----------|-------|--------|
| Opening width (E-W) | STAIR_WIDTH = 36" | framing-data.ts |
| Opening length (N-S) | ~108" (12 treads × 9" run) — stair horizontal run | Computed from STAIR_MAIN_STEPS × STAIR_TREAD_DEPTH |
| Opening position | Centered on stair footprint along north wall | Derived from north wall stair position |
| Trimmer joist locations | At east and west edges of stair opening, 36" apart | STAIR_WIDTH |
| Header locations | At north and south ends of stair opening | Landing edge + stair bottom edge |
| Tail joists (interrupted) | ~2 TJI joists at 16" OC that fall within the 36" opening | TJI_OC = 16" |
| Joist hangers needed | 4 (tail joist to header) + 4 (header to trimmer) = 8 minimum | IRC R502.10 |

**Second Floor Stairwell Opening (2→3 transition):**

| Dimension | Value | Source |
|-----------|-------|--------|
| Opening width (E-W) | STAIR_WIDTH = 36" | framing-data.ts |
| Opening length (N-S) | ~144" (16 treads × 9" run) — straight run, no landing | STAIR2_TOTAL_RISERS − 1 = 16 treads × STAIR_TREAD_DEPTH |
| Opening position | STAIR2_START_X = 180" to ~36" along north wall | framing-data.ts |
| Trimmer joist locations | At east and west edges, 36" apart | STAIR_WIDTH |
| Tail joists (interrupted) | ~2 TJI joists within 36" opening | TJI_OC = 16" |
| Joist hangers needed | 8 minimum (same logic as 1F) | IRC R502.10 |

| **App Rendering** | ⚪ Not rendered — no opening framing in floor system. Joists currently shown as continuous across full wall span with no interruption for stair. |
| **Controlling Data** | Not in framing-data.ts. Needs: `STAIRWELL_OPENING_W`, `STAIRWELL_OPENING_L`, trimmer joist positions, header sizes, tail joist lengths, hanger count. |
| **⚠️ Critical Gap** | This is a structural element required by code. Without it, the floor system cannot be built as shown — the joists directly over the stair must be cut and the loads redistributed. The doubled trimmers and headers carry significant concentrated loads. Engineer should size the headers (TJI or LVL) for the specific span and loading. |

---

### CT-021: Joist Blocking / Bridging

| Field | Value |
|-------|-------|
| **Type ID** | CT-021 |
| **Common Name** | Joist blocking / bridging / squash blocks |
| **Function** | Prevents TJI joist rotation and web buckling at bearing points. Transfers lateral loads between joists. Required by TJI manufacturer for warranty compliance and by code at bearing walls. |
| **Types** | |
| — Bearing blocking | Solid blocking between joists at bearing walls (south and north top plates). Typically same depth as joist. Transfers point loads and provides fire-stopping. |
| — Midspan bridging | Cross-bridging or solid blocking at midspan for spans >12'. Prevents joist rotation under eccentric loading. |
| — Squash blocks | Solid blocks directly over bearing wall studs, between joist flanges, to prevent web crushing at concentrated loads. |
| **Standard Connections** | **Between:** adjacent TJI joists (CT-010). **Below:** top plate (CT-002) at bearing points. **Nailing:** face nail through blocking into joist web. |
| **Code Reference** | IRC R502.7 — Lateral restraint at supports. TJI manufacturer installation guide. |
| **App Rendering** | ⚪ Not rendered |
| **Controlling Data** | Not in framing-data.ts |

---

### CT-022: Fire Blocking

| Field | Value |
|-------|-------|
| **Type ID** | CT-022 |
| **Common Name** | Fire blocking / fire stopping |
| **Function** | Prevents fire spread through concealed spaces. Required at floor/ceiling intersections, top and bottom of stair stringers, soffits, and where partitions meet floor/ceiling assemblies. Critical in a three-story wood-frame structure inside CMU. |
| **Material** | 2× lumber, 3/4" plywood/OSB, or approved fire-rated material |
| **Locations Required** | |
| — Floor/ceiling transition | Between studs at each floor line where concealed stud cavity connects to joist bay. All four walls at 1F→2F and 2F→3F transitions. |
| — Stair stringers | At top and bottom of each stringer pair — seal the triangular space between stringer and wall. |
| — Soffits/drop ceilings | Under raised bathroom floor if concealed space connects to wall cavities. |
| — Partition-to-ceiling | Where interior partition top plate meets ceiling joist bay, if partition runs parallel to joists. |
| **Standard Connections** | Friction-fit or face-nailed between framing members to seal concealed cavities. |
| **Code Reference** | IRC R602.8 — Fire blocking required. R302.11 — Fireblocking in concealed spaces. |
| **App Rendering** | ⚪ Not rendered |
| **Controlling Data** | Not in framing-data.ts |

---

### CT-023: Cabinet / Fixture Assembly

| Field | Value |
|-------|-------|
| **Type ID** | CT-023 |
| **Common Name** | Kitchen cabinets, bathroom vanity, appliances |
| **Function** | Storage, workspace, appliance housing. Non-structural but occupies space and affects MEP routing. |
| **Sub-Types** | Base cabinets (34.5" high, 24" deep), upper cabinets (36" high, 12" deep), fridge (30"×30"×70"), kitchen sink (33"×18"), bathroom vanity (24"×18"), shower (36"×36"), toilet (14"×28"). |
| **Locations** | North wall main run (5.5"–85"), north wall fridge zone (85"–115"), north wall right of door (166"–280.5"), west wall cabinets (79.5"+), partition counter (191"–280.5"). |
| **Standard Connections** | **Back:** screwed to studs through cabinet back panel. **Upper cabs:** screwed to studs at 54" AFF. **Base cabs:** shimmed level on subfloor, screwed to studs. |
| **App Rendering** | ✅ Rendered in elevation views (Cabinets layer toggle) |
| **Controlling Data** | `CAB_*`, `NCAB_*`, `WCAB_*`, `PCAB_*`, fixture constants in framing-data.ts |

---

### CT-024: Laundry (Washer / Dryer)

| Field | Value |
|-------|-------|
| **Type ID** | CT-024 |
| **Common Name** | Washer and dryer stack / side-by-side |
| **Function** | Laundry appliances at west end of north wall. Requires: hot/cold water supply, drain with standpipe (42" max), 4" dryer vent to exterior, 240V circuit (dryer) + 120V circuit (washer). |
| **Dimensions** | Washer: 27"W × 33"D × 39"H. Dryer: 27"W × 33"D × 39"H. 1" gap between. Total width: 55". Positioned at x=3" from west end of north elevation. |
| **Standard Connections** | **Floor:** sits on subfloor, leveled. **Wall:** anti-tip bracket to stud behind dryer. **MEP:** standpipe, drain, supply lines in 2×6 plumbing chase (horizontal partition). |
| **App Rendering** | ✅ Rendered in elevation views (Appliances layer) |
| **Controlling Data** | `WASHER_*`, `DRYER_*`, `WD_*`, `STANDPIPE_H`, `DRYER_VENT_D` in framing-data.ts |

---

## Part 2 — Instance Registry

Every physical piece in the house, organized by zone. Each row references a Component Type from Part 1.

### Zone 1: South Wall (First Floor Exterior)

| Instance ID | Type | Member | Length/Size | Qty | Status |
|-------------|------|--------|-------------|-----|--------|
| south-bp-0 | CT-001 | 2×6 treated | left of door | 1 | ✅ Data + Render |
| south-bp-1 | CT-001 | 2×6 treated | right of door | 1 | ✅ Data + Render |
| south-tp-0-1 | CT-002 | 2×6 SPF (lower) | 192" | 1 | ✅ Data + Render |
| south-tp-0-2 | CT-002 | 2×6 SPF (lower) | 94" | 1 | ✅ Data + Render |
| south-tp-1-1 | CT-002 | 2×6 SPF (upper) | 96" | 1 | ✅ Data + Render |
| south-tp-1-2 | CT-002 | 2×6 SPF (upper) | 190" | 1 | ✅ Data + Render |
| south-stud-0 – N | CT-005 | 2×6 SPF | varies | ~23 | ✅ Data + Render |
| south-hdr-0 | CT-003 | (2) 2×8 solid | over 48" door RO | 1 | ✅ Data + Render |
| south-open-0 | — | Door void | 48"×80" (4'×6'8") | 1 | ✅ Data + Render |
| south-cmu-win | CT-018 | CMU-only window | 40"×40" at pos 166", sill 136" | 1 | ✅ Data + Render |
| south-ab-0 – 5 | CT-008 | ½" wedge anchor | [6, 66, 122, 170, 236, 280] | 6 | ✅ Defined in data |
| south-rim-left | CT-009 | Rim board | 9.5" depth | 1 | ✅ Data + Render |
| south-rim-right | CT-009 | Rim board | 9.5" depth | 1 | ✅ Data + Render |
| south-tji-0 – N | CT-010 | TJI joist | 9.5" depth | ~17 | ✅ Data + Render |
| south-subfloor | CT-011 | 3/4" OSB | 286" | 1 | ✅ Data + Render |
| south-corners | CT-019 | Corner assembly | 2 corners (SE, SW) | 2 | ⚪ Not defined |
| south-sheathing | CT-015 | 7/16" OSB panels | — | — | 🟡 Not yet defined |
| south-housewrap | CT-016 | WRB | — | — | 🟡 Not yet defined |

### Zone 2: North Wall (First Floor Exterior)

| Instance ID | Type | Member | Length/Size | Qty | Status |
|-------------|------|--------|-------------|-----|--------|
| north-bp-0 | CT-001 | 2×6 treated | 286" | 1 | ✅ Data + Render |
| north-tp-0-1, 0-2 | CT-002 | 2×6 SPF (lower) | 192" + 94" | 2 | ✅ Data + Render |
| north-tp-1-1, 1-2 | CT-002 | 2×6 SPF (upper) | 96" + 190" | 2 | ✅ Data + Render |
| north-stud-0 – N | CT-005 | 2×6 SPF | varies | ~23 | ✅ Data + Render |
| north-sill-0 | CT-004 | 2×6 on edge | 37" | 1 | ✅ Data + Render |
| north-hdr-0 | CT-003 | (2) 2×8 solid | over 40" window RO | 1 | ✅ Data + Render |
| north-open-0 | — | Window void | 40"×48", sill 40" | 1 | ✅ Data + Render |
| north-backing-1, 2 | CT-006 | 2×6 SPF | 111.5" | 2 | ✅ Data + Render |
| north-partition-vert | CT-007 | Partition overlay | 116" | 1 | ✅ Data + Render |
| north-bath-cleat-0 – 4 | CT-012 | 2×4 cleat | 14" | 5 | ✅ Data + Render |
| north-bath-joist-0 – 4 | CT-012 | 2×6 joist | 5.5" | 5 | ✅ Data + Render |
| north-bath-subfloor | CT-012 | 3/4" OSB | ~87" | 1 | ✅ Data + Render |
| north-ab-0 – 4 | CT-008 | ½" wedge anchor | [6, 72, 144, 216, 280] | 5 | ✅ Defined in data |
| north-rim-left, right | CT-009 | Rim board | 9.5" depth | 2 | ✅ Data + Render |
| north-tji-0 – N | CT-010 | TJI joist | 9.5" depth | ~17 | ✅ Data + Render |
| north-subfloor | CT-011 | 3/4" OSB | 286" | 1 | ✅ Data + Render |
| north-landing | CT-013 | Landing assembly | 4 risers | 1 | ✅ Data + Render |
| north-main-stair | CT-013 | Stair run | 12 treads × 9" = 108" horiz | 1 | ✅ Data + Render |
| north-stringer | CT-013 | 2×12 notched | ~130" | 2 | ✅ Data + Render |
| north-stairwell-opening | CT-020 | Floor opening framing | ~36"×108" opening in floor | 1 | ⚪ Not defined — see CT-020 |
| north-corners | CT-019 | Corner assembly | 2 corners (NE, NW) | 2 | ⚪ Not defined |
| north-sheathing | CT-015 | 7/16" OSB panels | — | — | 🟡 Not yet defined |

### Zone 3: West Wall (First Floor Exterior)

| Instance ID | Type | Member | Length/Size | Qty | Status |
|-------------|------|--------|-------------|-----|--------|
| west-bp-0 | CT-001 | 2×6 treated | 41.5" (left of door) | 1 | ✅ Data + Render |
| west-bp-1 | CT-001 | 2×6 treated | 48.5" (right of door) | 1 | ✅ Data + Render |
| west-tp-0, tp-1 | CT-002 | 2×6 SPF | 166" ea | 2 | ✅ Data + Render |
| west-stud-0 – N | CT-005 | 2×6 SPF (double jacks) | varies | ~12 | ✅ Data + Render |
| west-hdr-0 | CT-003 | 3.5"×11.25" LVL | 76" span | 1 | ✅ Data + Render |
| west-open-0 | — | Sliding door void | 79"×73" (6'7"×5'11") | 1 | ✅ Data + Render |
| west-cmu-lower | CT-018 | CMU opening below lintel | 71"×72" at pos 48", sill 8" | 1 | ✅ Data + Render |
| west-cmu-upper | CT-018 | CMU opening above lintel | 71"×88" at pos 48", sill 88" | 1 | ✅ Data + Render |
| west-ab-0 – 3 | CT-008 | ½" wedge anchor | [6, 38.5, 120.5, 160] | 4 | ✅ Data + Render |
| west-sheathing | CT-015 | 7/16" OSB panels | — | — | 🟡 Not yet defined |

### Zone 4: East Wall (First Floor Exterior)

| Instance ID | Type | Member | Length/Size | Qty | Status |
|-------------|------|--------|-------------|-----|--------|
| east-bp-0 | CT-001 | 2×6 treated | 166" | 1 | ✅ Data + Render |
| east-tp-0, tp-1 | CT-002 | 2×6 SPF | 166" ea | 2 | ✅ Data + Render |
| east-stud-0 – N | CT-005 | 2×6 SPF (double jacks) | varies | ~12 | ✅ Data + Render |
| east-sill-0 | CT-004 | 2×6 on edge | 69" | 1 | ✅ Data + Render |
| east-hdr-0 | CT-003 | 3.5"×9.25" LVL | 69" span | 1 | ✅ Data + Render |
| east-open-0 | — | Window void | 72"×48", sill 36" | 1 | ✅ Data + Render |
| east-cmu-win | CT-018 | CMU-only window | 40"×40" at pos 54", sill 136" | 1 | ✅ Data + Render |
| east-ab-0 – 3 | CT-008 | ½" wedge anchor | [6, 72, 138, 160] | 4 | ✅ Defined in data |
| east-sheathing | CT-015 | 7/16" OSB panels | — | — | 🟡 Not yet defined |

### Zone 5: Interior Partitions

**Note:** `PARTITION_WALL_R = 100.5"` in live code (not 96" as in HOUSE.md). `HORIZ_PART_LENGTH = 100.5 - (8 + 1 + 5.5) = 86"`. `VERT_PART_LENGTH = 72 - 5.5 - 16.5 = 50"`.

| Instance ID | Type | Member | Length/Size | Qty | Status |
|-------------|------|--------|-------------|-----|--------|
| horiz-partition-bp-0 | CT-001 | 2×6 treated | 86" | 1 | ✅ Data + Render |
| horiz-partition-tp-0, 1 | CT-002 | 2×6 SPF | 86" ea | 2 | ✅ Data + Render |
| horiz-partition-stud-0 – N | CT-005 | 2×6 SPF | 111.5" | ~6 | ✅ Data + Render |
| vert-partition-bp-0 | CT-001 | 2×6 treated | 1.5" | 1 | ✅ Data + Render |
| vert-partition-bp-1 | CT-001 | 2×6 treated | 23.5" | 1 | ✅ Data + Render |
| vert-partition-tp-0, 1 | CT-002 | 2×6 SPF | 50" ea | 2 | ✅ Data + Render |
| vert-partition-stud-0 – N | CT-005 | 2×4 SPF | varies | ~5 | ✅ Data + Render |
| vert-partition-hdr-0 | CT-003 | (2) 2×6 | 25" span | 1 | ✅ Data + Render |
| vert-partition-open-0 | — | Door void | 28"×80" | 1 | ✅ Data + Render |
| bathroom-east | CT-007 | Bathroom east wall (no openings) | 50" × 116" | 1 | ✅ Data defined |

### Zone 6: Second Floor

All four second floor walls are fully defined in `framing-data.ts` with openings, sections, and anchor bolts.

| Instance ID | Type | Member | Length/Size | Qty | Status |
|-------------|------|--------|-------------|-----|--------|
| north-2 wall | CT-001–005 | 2×6 SPF | 286", no openings | 1 wall | ✅ Data defined, render partial |
| south-2 wall | CT-001–005 | 2×6 SPF | 286", 1 window 40"×40" at pos 166" | 1 wall | ✅ Data defined |
| west-2 wall | CT-001–005 | 2×6 SPF | 166", 1 picture window 71"×40" at pos 48" | 1 wall | ✅ Data defined |
| east-2 wall | CT-001–005 | 2×6 SPF | 166", 1 window 40"×40" at pos 54" | 1 wall | ✅ Data defined |
| second-floor-stair | CT-013 | Straight run | 17 risers, starts x=180" | 1 | ✅ Data + Render |
| 2F-stairwell-opening | CT-020 | Floor opening framing (1→2) | ~36"×108" in 1F ceiling | 1 | ⚪ Not defined — see CT-020 |
| 2F-stairwell-opening-upper | CT-020 | Floor opening framing (2→3) | ~36"×144" in 2F ceiling | 1 | ⚪ Not defined — see CT-020 |
| second-floor-joists | CT-010 | TJI | 9.5" depth, span N-S | ~17 | 🟡 Not fully rendered |
| second-floor-subfloor | CT-011 | 3/4" OSB | — | — | 🟡 Not fully rendered |
| second-floor-joist-blocking | CT-021 | Blocking at bearing + midspan | — | — | ⚪ Not defined |
| 2F-fire-blocking | CT-022 | Fire stops at floor transition | all 4 walls | — | ⚪ Not defined |

### Zone 7: Third Floor / Roof Deck

Three third-floor walls defined: north (120" with 36" loft door), south (120" with 36" loft door), east (36" loft landing). West wall has height constants but no full WallElevation.

| Instance ID | Type | Member | Length/Size | Qty | Status |
|-------------|------|--------|-------------|-----|--------|
| north-3 wall | CT-001–005 | 2×6 SPF | 120", 1 door 36"×80" | 1 wall | ✅ Data defined |
| south-3 wall | CT-001–005 | 2×6 SPF | 120", 1 door 36"×80" at pos 80" | 1 wall | ✅ Data defined |
| east-3 wall | CT-001–005 | 2×6 SPF | 36", no openings | 1 wall | ✅ Data defined |
| west-3 wall | — | Shed roof slope 84"→116" | 166" (height constants only) | 1 wall | 🟡 Partial — no WallElevation |
| roof-deck-joists | CT-010 | TJI | — | — | ⚪ Not defined |
| roof-deck-subfloor | CT-011 | 3/4" OSB | — | — | ⚪ Not defined |
| roof-deck-rim | CT-009 | Rim board | — | — | ⚪ Not defined |
| 3F-fire-blocking | CT-022 | Fire stops at floor transition | — | — | ⚪ Not defined |

---

## Part 3 — Connection Topology

How pieces physically attach to each other. This is the graph an AI can walk to trace load paths or find orphan components.

### Joist Span Direction

**TJI joists span north-to-south** (~166" interior). South and north walls are the **primary bearing walls** — joists bear on their double top plates. East and west walls are **non-bearing** for floor joist loads (they carry only their own wall weight and any roof loads perpendicular to joist span). Rim boards close the joist bays at east and west ends.

### Load Path (Gravity — Roof to Foundation)

```
Roof deck subfloor (CT-011)
  ↓ bears on
Roof deck TJI joists (CT-010) — span N-S, bear on S/N 3F top plates
  ↓ bears on / hangers
Roof deck rim boards (CT-009) at E/W ends + Third floor top plates (CT-002) at S/N
  ↓ bears on
Third floor studs (CT-005) on S/N walls
  ↓ bears on
Third floor bottom plate (CT-001) = Second floor subfloor (CT-011)
  ↓ bears on
Second floor TJI joists (CT-010) — span N-S
  ↓ at stairwell: through stairwell opening headers (CT-020) → doubled trimmer joists
  ↓ bears on
Second floor rim boards (CT-009) at E/W + First floor top plates (CT-002) at S/N
  ↓ bears on
First floor studs (CT-005)
  ↓ at openings: through headers (CT-003) → jack studs (CT-005)
  ↓ bears on
First floor bottom plate (CT-001) + sill sealer (CT-014)
  ↓ anchor bolts (CT-008)
CMU shell / slab (CT-017)
  ↓ bears on
Foundation footing
```

### Lateral Load Path (Wind/Seismic)

```
Wind pressure (E-W or N-S)
  → Wall sheathing (CT-015) — NOT YET DEFINED ⚠️
  → Studs (CT-005) — shear transfer
  → Top plate (CT-002) — diaphragm connection via nailing to subfloor/rim
  → Corner assemblies (CT-019) — transfer between perpendicular walls ⚠️ NOT DEFINED
  → Subfloor (CT-011) — floor diaphragm action
  → Rim board (CT-009) — transfers to wall below
  → Bottom plate (CT-001)
  → Anchor bolts (CT-008)
  → CMU shell (CT-017) — ultimate lateral resistance
  → Foundation
```

### Connection Detail Table

| From | To | Connection Method | Hardware | Status |
|------|----|-------------------|----------|--------|
| CT-005 (stud) | CT-001 (bottom plate) | Toe nail (3× 8d) | Nails 208-1517 | ✅ Documented |
| CT-005 (stud) | CT-002 (top plate) | End nail (2× 16d) | Nails 208-1517 | ✅ Documented |
| CT-005 (jack) | CT-003 (header) | Face nail | Nails 208-1517 | ✅ Documented |
| CT-005 (king) | CT-003 (header) | Face nail | Nails 208-1517 | ✅ Documented |
| CT-001 (plate) | CT-017 (CMU/slab) | Anchor bolt (CT-008) | 232-7897 | ✅ Documented |
| CT-001 (plate) | CT-017 (CMU/slab) | Sill sealer (CT-014) | 161-1605 | 🔶 Not in tooltips |
| CT-002 (lower top) | CT-002 (upper top) | Face nail 16" OC | Nails 208-1517 | ✅ Documented |
| CT-002 (top plate) | CT-002 (top plate at corner) | Overlap tie — upper course extends past corner | Nails | ⚪ CT-019 not defined |
| CT-010 (TJI) | CT-002 (top plate, S/N walls) | End bearing on plate | — | ✅ Documented |
| CT-010 (TJI) | CT-009 (rim, E/W walls) | End bearing + face nail | Joist hanger 228-9267 | ⚪ Hardware only |
| CT-010 (TJI) | CT-011 (subfloor) | Adhesive + ring-shank nail | 520-1944, 208-1509 | ⚪ Hardware only |
| CT-010 (TJI) | CT-021 (blocking) | Face nail through blocking into web | Nails | ⚪ CT-021 not defined |
| CT-020 (trimmer joist) | CT-002 (top plate, S/N) | End bearing — doubled TJI | Joist hangers | ⚪ CT-020 not defined |
| CT-020 (header) | CT-020 (trimmer joist) | Joist hanger | 228-9267 or LVL-rated hanger | ⚪ CT-020 not defined |
| CT-020 (tail joist) | CT-020 (header) | Joist hanger | 228-9267 | ⚪ CT-020 not defined |
| CT-015 (sheathing) | CT-005 (stud) | Structural nailing schedule | TBD | 🟡 Not defined |
| CT-016 (house wrap) | CT-015 (sheathing) | Staples | 231-2194 | 🟡 Not defined |
| CT-006 (backing) | CT-007 (partition) | Face nail | Nails | ✅ Documented |
| CT-013 (stringer) | Landing deck | Seat cut + bracket | TBD | 🔶 Partial |
| CT-013 (stringer) | Second floor rim/header | Plumb cut + hanger | TBD | 🔶 Partial |
| CT-022 (fire blocking) | CT-005 (stud bays) | Friction fit + nails at floor transitions | 2× lumber or plywood | ⚪ CT-022 not defined |
| CT-023 (cabinets) | CT-005 (studs) | Screwed through back panel into studs | Cabinet screws | ✅ Position data exists |

---

## Part 4 — Completeness Matrix

For each zone, track what's defined at each documentation level.

| Zone | Pieces in Data | Rendered in SVG | Tooltip Metadata | SKUs Mapped | Connections Defined | Load Path Traced |
|------|---------------|-----------------|------------------|-------------|--------------------|-----------------|
| South wall (1F) | ✅ | ✅ | ✅ (interactive) | 🔶 Partial | ✅ | ✅ |
| North wall (1F) | ✅ | ✅ | ✅ | 🔶 Partial | ✅ | ✅ |
| West wall (1F) | ✅ | ✅ | ✅ | 🔶 Partial | ✅ | ✅ |
| East wall (1F) | ✅ | ✅ | ✅ | 🔶 Partial | ✅ | ✅ |
| Interior partitions | ✅ | ✅ | ✅ | 🔶 Partial | ✅ | ✅ (non-bearing) |
| Bathroom floor | ✅ | ✅ | 🔶 | 🔶 Partial | ✅ | ✅ |
| Stair (1→2) | ✅ | ✅ | ✅ | 🔶 Partial | 🔶 Partial | 🔶 Partial |
| Floor system (1→2) | ✅ | ✅ | 🔶 | 🔶 Partial | 🔶 Missing stairwell opening | 🔶 Stairwell not traced |
| Cabinets/fixtures | ✅ | ✅ | 🔶 | ⚪ | ✅ (screw to studs) | N/A (non-structural) |
| Laundry | ✅ | ✅ | ⚪ | ⚪ | ⚪ | N/A (non-structural) |
| Second floor walls | ✅ All 4 walls | 🔶 North only rendered | ⚪ | ⚪ | ⚪ | ⚪ |
| Stair (2→3) | ✅ | ✅ | ⚪ | ⚪ | ⚪ | ⚪ |
| Floor system (2→3) | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ |
| Third floor walls | ✅ 3 walls defined | 🔶 Partial render | ⚪ | ⚪ | ⚪ | ⚪ |
| Roof deck | ⚪ | ⚪ | ⚪ | 🔶 SKUs exist | ⚪ | ⚪ |
| **Corner assemblies** | **⚪ Not defined** | **⚪** | **⚪** | **⚪** | **⚪ Critical gap** | **⚪** |
| **Stairwell opening framing** | **⚪ Not defined** | **⚪** | **⚪** | **⚪** | **⚪ Critical gap** | **⚪ Breaks load path** |
| **Joist blocking** | **⚪ Not defined** | **⚪** | **⚪** | **⚪** | **⚪** | **⚪** |
| **Fire blocking** | **⚪ Not defined** | **⚪** | **⚪** | **⚪** | **⚪** | **N/A (fire safety)** |
| Wall sheathing | ⚪ | ⚪ | ⚪ | ✅ SKU known | ⚪ | ⚪ (lateral path) |
| Weather barrier | ⚪ | ⚪ | ⚪ | ✅ SKU known | ⚪ | N/A (envelope) |
| Exterior cladding | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ |
| Insulation | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | N/A (thermal) |
| Interior finish | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ |
| MEP (rough-in) | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ | ⚪ |
| Windows/doors (units) | 🔶 RO only | 🔶 Void only | ⚪ | ⚪ | ⚪ | ⚪ |
| CMU-only openings | ✅ | ✅ | ⚪ | N/A (masonry) | ⚪ | ✅ (CMU lintel) |

---

## Part 5 — Known Gaps & Next Actions

### ~~Resolved~~ (previously flagged, now fixed)

- ~~TJI depth discrepancy~~ — `TJI_DEPTH` updated to 9.5" in framing-data.ts. Matches SKU 106-5882.
- ~~Rim board thickness discrepancy~~ — `TJI_RIM_T` updated to 1.125" in framing-data.ts. Matches SKU 106-8025.
- ~~South/North anchor bolts TBD~~ — Both now defined: south [6, 66, 122, 170, 236, 280], north [6, 72, 144, 216, 280].
- ~~Second floor walls only north~~ — All four 2F walls fully defined in framing-data.ts.

### Critical (structural elements required by code but not in project)

1. **Stairwell floor opening framing (CT-020)** — When stairs pass through a floor, the TJI joists must be cut and the opening framed with doubled trimmer joists and doubled headers. This is required by IRC R502.10, carries significant concentrated loads, and doesn't exist anywhere — no data, no rendering, no documentation. Two openings needed: 1F→2F (~36"×108") and 2F→3F (~36"×144"). Engineer must size the headers. **This is the single biggest structural gap in the project.**

2. **Corner assembly details (CT-019)** — Eight first-floor corners, plus upper floor corners, with no assembly type specified. Affects insulation continuity, drywall backing, and lateral load transfer. Code comment says "E/W end studs tie into N/S plates" but doesn't specify how.

3. **Joist blocking at bearing walls (CT-021)** — TJI manufacturer requires blocking at bearing points. Without it, joist warranty may be void and webs can buckle under point loads. Needed at south and north wall bearing lines minimum.

4. **Fire blocking (CT-022)** — IRC R602.8 requires fire stops at every floor/ceiling transition and at stair stringers. Three-story wood frame inside CMU makes this especially important. Not documented anywhere.

### High Priority (completeness for AI assessment)

5. **HOUSE.md data drift** — HOUSE.md shows `PARTITION_WALL_R = 96"` but live code is `100.5"`. South door is 48" in code but 39" in HOUSE.md. Stair params differ (LAND_RISERS=4 not 3, TREAD_DEPTH=9 not 10, APPR_STEPS=3 not 2, MAIN_STEPS=12 not 13). **HOUSE.md needs a sync pass against framing-data.ts** to prevent future catalog errors.

6. **Floor system 2→3** — No TJI/rim/subfloor data for second-to-third floor transition. This is the middle of the gravity load path.

7. **Roof deck** — SKUs purchased but no framing data, no rendering. Top of the load path and critical for MN snow loads.

8. **West wall third floor** — Height constants exist (`WEST_F3_LOW_H=84"`, `WEST_F3_HIGH_H=116"` — shed roof slope) but no WallElevation definition.

9. **Wall sheathing layer (CT-015)** — Structural bracing element. Critical for lateral load path. SKU known but no data or rendering.

### Medium Priority (documentation depth)

10. **Window/door units** — Only rough openings documented. Actual unit specs (manufacturer, model, U-factor, SHGC) not tracked. Important for energy code compliance in MN climate zone 7.

11. **Stair connection hardware** — Stringer-to-landing and stringer-to-rim connections need specific hardware specs (hangers, brackets, fasteners).

12. **Insulation strategy** — Climate zone 7 requires ~R-21 walls and R-49 ceiling minimum. The 1" gap between CMU and wood frame — what goes there? This affects the entire thermal envelope and potentially the frame-to-CMU connection detail.

13. **MEP rough-in** — Plumbing (bathroom drain under raised floor, standpipe for laundry), electrical, HVAC. The 2×6 horizontal partition serves as a plumbing chase — this relationship should be documented.

14. **Guardrail/handrail at stairs** — IRC R311.7.8 requires handrails; R312.1 requires guards at open-sided walking surfaces >30" above grade. Two stair runs plus potential loft edge need rails.

### Low Priority (future layers)

15. **Interior finish** — Drywall, trim, flooring.
16. **Exterior cladding** — Whatever goes over the house wrap.
17. **Flashing details (CT-028 needed)** — At windows, doors, wall-to-roof transitions. Integrates window units with WRB.
18. **Flat roof system** — Membrane, drainage slope, parapet details, roof-to-wall transition. Not a component type yet.

---

## Part 6 — Data Drift Log

Track where HOUSE.md and PARTS_CATALOG.md diverge from the live code in `framing-data.ts`. This section exists so the next sync pass knows exactly what to fix.

| Field | HOUSE.md Value | Live Code Value | File | Line |
|-------|---------------|-----------------|------|------|
| PARTITION_WALL_R | 96" | 100.5" | framing-data.ts | 116 |
| South door width | 39" | 48" | framing-data.ts | 321 |
| South door RO label | "3'-3\" × 6'-8\"" | "4'-0\" × 6'-8\"" | framing-data.ts | 323 |
| STAIR_LAND_RISERS | 3 | 4 | framing-data.ts | 166 |
| STAIR_TREAD_DEPTH | 10" | 9" | framing-data.ts | 164 |
| STAIR_APPR_STEPS | 2 | 3 | framing-data.ts | 168 |
| STAIR_MAIN_STEPS | 13 | 12 | framing-data.ts | 169 |
| STAIR_NOSING | not documented | 1" | framing-data.ts | 165 |
| TJI_DEPTH | 11.875" (HOUSE.md) | 9.5" (resolved) | framing-data.ts | 272 |
| TJI_RIM_T | 1.5" (HOUSE.md) | 1.125" (resolved) | framing-data.ts | 275 |
| South wall CMU window | not in HOUSE.md | 40"×40" cmu-only at pos 166" | framing-data.ts | 334–340 |
| West wall CMU openings | not in HOUSE.md | 2 cmu-only openings | framing-data.ts | 406–425 |
| East wall CMU window | not in HOUSE.md | 40"×40" cmu-only at pos 54" | framing-data.ts | 457–466 |
| bathroomEastWall | not in HOUSE.md | 50" wall, no openings | framing-data.ts | 151–159 |
| South wall header | (3) 2×8 + OSB spacer | (2) 2×8 solid | framing-data.ts | 324–329 |
| North wall header | (3) 2×8 + OSB spacer | (2) 2×8 solid | framing-data.ts | 367–372 |
| South wall anchor bolts | TBD | [6, 66, 122, 170, 236, 280] | framing-data.ts | 311 |
| North wall anchor bolts | TBD | [6, 72, 144, 216, 280] | framing-data.ts | 353 |
| Second floor walls | north only in HOUSE.md | all 4 defined | framing-data.ts | 555–661 |
| Third floor walls | partial in HOUSE.md | 3 walls defined (N, S, E) | framing-data.ts | 471–551 |
| Cabinet/fixture data | not in HOUSE.md | extensive layout (lines 221–268) | framing-data.ts | 221–268 |
| Laundry data | not in HOUSE.md | washer/dryer/standpipe (lines 207–219) | framing-data.ts | 207–219 |

---

*Updated: 2026-03-19 · Source: framing-data.ts (live code, authoritative) + HOUSE.md + MATERIALS_CONNECTIONS.md + layout-calculator.ts + codebase analysis*
