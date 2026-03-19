# Block House — Materials × App Connections

Every SKU from the Menards build data sheet mapped to its physical location in the construction
and to its corresponding element ID(s) in the framing app.

Legend:
- ✅ **Already in app** — element rendered, tooltip exists
- 🔶 **Easy win** — element exists, just needs SKU/metadata added to `getElementMetadata()`
- 🟡 **New layer** — element not yet drawn, medium effort to add
- ⚪ **Hardware / consumable** — no practical SVG representation
- ⚠️ **Discrepancy** — SKU dimensions don't match `framing-data.ts` constants

---

## Foundation / Sill

| SKU | Description | Physical Location | App Element(s) | Status |
|-----|-------------|-------------------|----------------|--------|
| 161-1605 | 5-1/2" × 50' Sill Sealer Foam | Sits between CMU slab top and treated bottom plates — all 4 exterior walls | `*-bp-*` (beneath) | 🔶 Add to bp tooltip |
| 111-1066 | 2×6-16' AC2 Green Treated | **Bottom plates**, exterior walls (long runs) | `south-bp-*`, `north-bp-*` | 🔶 Add SKU to bp metadata |
| 111-1040 | 2×6-12' AC2 Green Treated | **Bottom plates**, exterior walls (short runs / splices) | `east-bp-*`, `west-bp-*` | 🔶 Add SKU to bp metadata |
| 102-1790 | 2×6-16' #2 SPF | **Double top plates** on all exterior walls; some header stock | `*-tp-*`, `*-hdr-*` | 🔶 Add SKU to tp metadata |
| 102-1046 | 2×6-92-5/8" SPF Stud | **Exterior wall studs** — all four walls, full-height | `north/south/east/west-stud-*` | 🔶 Add SKU to stud metadata |
| 102-2016 | 2×10-8' Fir | **Stair landing joists & rim header** (`STAIR_LAND_JOIST_D = 9.25"` = 2×10) | `north-landing` | ✅ Rendered |
| 208-1517 | 3-1/4" × .131 HDG Nails | General framing nails (plate-to-plate, stud face nails) | — | ⚪ Hardware |
| 232-7897 | 1/2" × 5-1/2" HDG Wedge Anchors | **Anchor bolts** — bottom plate to CMU slab (6 on N/S, 4 on E/W) | `anchorBolts[]` → rendered as dots in elevations | 🔶 Add SKU to anchor bolt tooltip |

---

## Interior Walls

| SKU | Description | Physical Location | App Element(s) | Status |
|-----|-------------|-------------------|----------------|--------|
| 111-1037 | 2×6-10' AC2 Green Treated | **Bottom plate**, kitchen/bath partition (treated, contacts slab) | `horiz-partition-bp-*` | 🔶 Add SKU to bp metadata |
| 102-1761 | 2×6-10' SPF | **Top plates** on interior partitions; short stud stock | `horiz-partition-tp-*`, `vert-partition-tp-*` | 🔶 Add SKU |
| 102-1046 | 2×6-92-5/8" SPF Stud | **Interior partition studs** (if 2×6 chase for plumbing) | `horiz-partition-stud-*` | 🔶 Add SKU |
| 111-0818 | 2×4-8' AC2 Green Treated | **Bath floor ledger cleats** (`BATH_CLEAT_H = 3.5"` = 2×4, contacts slab) | `north-bath-cleat-*` | 🔶 Add SKU to cleat metadata |
| 102-1127 | 2×4-12' SPF | **Bathroom door header** (vert-partition, 28" RO) + blocking | `vert-partition-hdr-0` | 🔶 Add SKU |
| 102-1101 | 2×4-8' SPF Stud | **Bathroom door wall studs** (`INT_D = 3.5"` = 2×4 partition) | `vert-partition-stud-*` | 🔶 Add SKU to stud metadata |

---

## First Floor Framing

| SKU | Description | Physical Location | App Element(s) | Status |
|-----|-------------|-------------------|----------------|--------|
| 106-5882 ⚠️ | 2-1/2" × **9-1/2"** × 16' I-Joist PRI-40 | **TJI floor joists** spanning N–S across the first floor | `north/south/east/west-tji-*` | 🔶 Add SKU; see discrepancy note |
| 106-8025 ⚠️ | **1-1/8"** × 9-1/2" × 12' Rim Board | **Rim boards** at joist ends on all exterior walls | `*-rim-left`, `*-rim-right` | 🔶 Add SKU; see discrepancy note |
| 228-9267 | I-Joist Hanger IHFL25925 — MiTek | Metal face-mount hangers connecting TJI ends to rim at interior bearing walls | — (hardware) | ⚪ Hardware |
| 227-1442 | 1-1/2" Joist Hanger Nails HDG | Nails for the above hangers | — | ⚪ Hardware |
| 124-2888 | 3/4" (23/32) T&G OSB DryMax Subfloor | **Main floor subfloor** panels glued/nailed to TJI top flanges | `north/south/east/west-subfloor` | 🔶 Add SKU to subfloor metadata |
| 520-1944 | Loctite PL400 Subfloor Adhesive | Applied to TJI flanges before laying OSB — glues subfloor down | — (consumable) | ⚪ Consumable |
| 208-1509 | 2-3/8" × .113 Ring Shank Framing Nails | Nail subfloor to TJI top flanges (ring shank for squeak prevention) | — | ⚪ Hardware |

---

## Second Floor Walls

| SKU | Description | Physical Location | App Element(s) | Status |
|-----|-------------|-------------------|----------------|--------|
| 102-1790 | 2×6-16' SPF | **Top plates** on second-floor exterior walls | `north-2-tp-*`, etc. | 🔶 Add SKU |
| 102-1761 | 2×6-10' SPF | **Wall studs**, second floor exterior walls | `north-2-stud-*`, etc. | 🔶 Add SKU |
| 102-2155 | 2×12-10' Fir | **Stair stringers** (`STAIR_STRINGER_DEPTH = 11.25"` = 2×12 actual) | `north-stringer` | 🔶 Add SKU to stringer tooltip |
| 102-2016 | 2×10-6' Fir | Landing rim joist / ledger header at second floor stair | `north-landing` area | ✅ Rendered |
| 124-2728 | 7/16" × 4×8 OSB Sheathing | **Exterior wall sheathing** — over studs, under house wrap | — (not yet drawn) | 🟡 New layer needed |
| 161-3015 | 9' × 125' Tamlyn Elite House Wrap | **Weather-resistive barrier** — wraps over OSB sheathing | — (not yet drawn) | 🟡 New layer needed |
| 124-2823 | ForceField Premium Tape 3-3/4" × 90' | Seam tape for house wrap at joints and openings | — | ⚪ Consumable |
| 231-2194 | 5/16" Staples 5M | Mechanical fastening of house wrap to sheathing | — | ⚪ Hardware |
| 232-7231 | 3/16" × 2-3/4" Tapcon Screws | **Concrete fasteners** — possibly ledger-to-CMU or secondary anchor points | — | ⚪ Hardware |

---

## Second Level Floor

*(Same system as First Floor Framing — identical SKUs repeated for the second floor deck)*

| SKU | Description | App Element(s) | Status |
|-----|-------------|----------------|--------|
| 106-5882 ⚠️ | I-Joist PRI-40 (same as 1F) | Second floor `*-tji-*` | 🔶 Add SKU |
| 106-8025 ⚠️ | Rim Board (same as 1F) | Second floor `*-rim-left`, `*-rim-right` | 🔶 Add SKU |
| 228-9267 | I-Joist Hanger | — | ⚪ Hardware |
| 124-2889 | 3/4" T&G OSB Subfloor (alt SKU) | Second floor `*-subfloor` | 🔶 Add SKU |
| 520-1944 | PL400 Adhesive | — | ⚪ Consumable |
| 208-1509 | Ring Shank Nails | — | ⚪ Hardware |

---

## Third Level / Roof Deck

| SKU | Description | Physical Location | App Element(s) | Status |
|-----|-------------|-------------------|----------------|--------|
| 102-1774 | 2×6-12' Douglas Fir | Roof deck blocking / ledger members (stiffer fir for structural) | — | 🟡 Partial third floor not fully drawn |
| 102-1790 | 2×6-16' SPF | **Top plates**, partial north wall third floor | `north-3-tp-*` (thirdFloorNorthWall) | 🔶 Add SKU |
| 102-1046 | 2×6-92-5/8" SPF Stud | **Wall studs**, partial third floor north wall | `north-3-stud-*` | 🔶 Add SKU |
| 102-1758 | 2×6-8' SPF Stud | Short studs at roof deck parapet / cripples | `north-3-stud-*` (short) | 🔶 Add SKU |
| 102-2016 | 2×10-8' Fir | Roof deck perimeter ledger / blocking | — | 🟡 Roof deck framing not yet drawn |
| 106-5882 ⚠️ | I-Joist PRI-40 | **Roof deck joists** | — (roof deck not yet drawn) | 🟡 New section |
| 106-8025 ⚠️ | Rim Board | Roof deck rim | — | 🟡 New section |
| 228-9267 | I-Joist Hanger | — | ⚪ Hardware |
| 124-2888 | 3/4" T&G OSB DryMax | **Roof deck sheathing** (acts as subfloor for roof deck) | — | 🟡 New section |
| 520-1944 | PL400 Adhesive | — | ⚪ Consumable |
| 124-2728 | 7/16" OSB Sheathing | Roof deck wall sheathing (third floor partial wall) | — | 🟡 New section |

---

## ⚠️ Dimension Discrepancies to Resolve

These constants in `framing-data.ts` don't match the actual purchased materials:

| Constant | Code Value | Actual SKU | Difference | File to Fix |
|----------|-----------|------------|------------|-------------|
| `TJI_DEPTH` | 11.875" (2×12-equivalent) | 9-1/2" (SKU 106-5882) | −2.375" | `framing-data.ts` line 247 |
| `TJI_RIM_T` | 1.5" (2× lumber) | 1-1/8" (SKU 106-8025) | −0.375" | `framing-data.ts` line 250 |

> If the 9-1/2" joists are correct, updating `TJI_DEPTH = 9.5` will shift the floor system
> elevation in all four wall drawings. Should be verified against actual construction plans
> before changing — the engineer's spec may call for a different depth than what's been ordered.

---

## Implementation Priority

### Implement Now — Metadata additions only (no SVG changes, low risk)

These just require updating `getElementMetadata()` in `lib/element-metadata.ts` to surface
SKU numbers in hover tooltips. Zero risk to SVG drawing logic.

1. **Anchor bolts** → add SKU `232-7897` to the `-bp-*` or anchor bolt pattern
2. **Bottom plates** (all) → add treated lumber SKUs `111-1066 / 111-1040 / 111-1037`
3. **TJI joists** → add SKU `106-5882` + depth discrepancy note
4. **Rim boards** → add SKU `106-8025` + thickness discrepancy note
5. **Subfloor** → add SKU `124-2888 / 124-2889`
6. **Sill sealer** → add SKU `161-1605` as a note beneath bottom plates
7. **Studs** (exterior) → add SKU `102-1046`
8. **Stringer** → add SKU `102-2155`
9. **Bath cleats** → add SKU `111-0818` (already connected to `north-bath-cleat-*`)

### Implement Later — Requires new SVG geometry

10. **OSB wall sheathing layer** (124-2728) — thin rectangle outside the stud layer in each wall elevation
11. **House wrap layer** (161-3015) — thin line/fill outside the sheathing
12. **Roof deck section** — third floor TJI system, partial north wall full draw
13. **Second floor walls** — `north-2`, `east-2`, `west-2`, `south-2` elevation drawings

### No App Representation Needed

Hangers (228-9267), nails (208-1517, 227-1442, 208-1509), adhesive (520-1944),
tape (124-2823), staples (231-2194), Tapcon screws (232-7231) — these are hardware/
consumables with no meaningful SVG layer to draw.

---

*Generated: 2026-03-18 · Source: Menards Block House Build Data Sheet + framing-data.ts + element-metadata.ts*
