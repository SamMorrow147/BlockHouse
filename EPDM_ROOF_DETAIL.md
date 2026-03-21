# Block House — EPDM Flat Roof & CMU Wall Transition Detail

**Purpose:** Technical recommendation for the EPDM membrane roof assembly and its transition down the CMU wall. This document maps to the existing Block House framing data and is intended to guide both blueprint updates in the app and actual construction detailing.

**Status:** DRAFT — must be reviewed by a licensed architect or roofing consultant before construction.

---

## 1. The Situation

The Block House has an existing CMU shell (304" x 184" exterior, 23 courses x 8" = 184" tall). A new independent wood-frame structure is built inside the shell. The second floor extends above the CMU top, and the flat roof deck sits at FLOOR3_IN (~252.5"), which is approximately 68.5" above the top of the CMU wall.

The flat roof goes flat at the top, and the EPDM membrane needs to be detailed from the roof deck surface, over the edge, and down to/past the CMU wall.

### Key Elevations

| Reference | Elevation | Notes |
|-----------|-----------|-------|
| CMU top (T.O. masonry) | 184" from slab | 23 courses x 8" |
| 2nd floor deck (FLOOR2_IN) | ~128.625" | Wood frame passes CMU at this level |
| Roof deck (FLOOR3_IN) | ~252.5" | EPDM assembly sits here |
| Wood frame above CMU | 128.625" to 252.5" | ~124" of wood-only wall above CMU |
| 3rd floor loft (partial) | West ~120" only | Open balcony east side acts as parapet |

---

## 2. Recommended Roof Assembly Layup (Bottom to Top)

Starting from the roof deck (TJI joists + 3/4" OSB subfloor at ~252.5"):

| Layer | Material | Thickness | Function |
|-------|----------|-----------|----------|
| 1. Deck | 3/4" T&G OSB (SKU 124-2888) | 0.75" | Structural substrate |
| 2. Vapor barrier | 6-mil polyethylene or self-adhered membrane | ~negligible | Prevents interior moisture from reaching insulation |
| 3. Insulation | Polyisocyanurate (polyiso) rigid foam | 4" minimum (R-25) | Thermal performance — verify against MN energy code for Climate Zone 7 (R-49 may be required; layer or combine with batt insulation in joist bays) |
| 4. Cover board | 1/2" high-density gypsum or DensDeck | 0.5" | Protects insulation, provides smooth EPDM substrate, fire resistance |
| 5. EPDM membrane | 60-mil RubberGard or equivalent | 0.060" | Primary waterproofing layer |

**Total buildup above deck:** approximately 4.5" to 5" (varies with insulation thickness).

**Insulation note for northern MN:** Climate Zone 7 requires R-49 minimum for roof assemblies per MN energy code. You'll likely need to combine batt insulation in the TJI joist bays (the joists are 9.5" deep — enough for R-30 fiberglass batts) with 4" polyiso above deck (R-25) to hit R-49+. The above-deck polyiso also eliminates thermal bridging at the joists.

---

## 3. EPDM Membrane Route — Roof to CMU Wall

This is the critical detail. Here's the recommended path for the EPDM membrane at the perimeter where the roof meets the CMU wall:

### 3a. At Walls Where Roof Is Above CMU (North, South, East exterior walls)

The roof deck at ~252.5" is approximately 68.5" above the CMU top at 184". The wood-frame wall continues above the CMU independently. The EPDM must transition from the horizontal roof field down to the wall.

**Exact geometry from app code (framing-data.ts, plan-geometry.ts):**

- CMU interior face to wood frame outer face: 1" air gap (FR_GAP = 1")
- Wood frame depth: 5.5" (FR_D, 2x6 actual)
- CMU wall thickness: 8" (CMU_T)
- CMU top: 184" (23 courses x 8")
- 2nd floor deck: ~106.25" (FLOOR2_IN = 96 + 9.5 + 0.75)
- CMU alongside 2nd floor walls: 126.25" to 184" (57.75" of overlap)
- Exposed wood frame above CMU: 184" to 252.5" (68.5" with NO CMU backing)
- Roof deck: 252.5" (FLOOR3_IN)

**The critical problem:** That 1" air gap between the CMU interior face and the wood frame outer face runs the full height of the building. At 184" (CMU top), this gap is suddenly open to the exterior on top. Rain, snowmelt, and wind-driven water can pour straight into this cavity. In northern MN freeze-thaw, water trapped in this cavity will destroy the wood framing and spall the CMU from the inside.

**Recommended detail — "Cap the CMU" approach (top to bottom):**

**At the roof level (252.5"):**

1. EPDM field membrane runs horizontally across roof deck
2. At the perimeter, EPDM turns up the wood-frame parapet/wall curb (minimum 8" above finished roof surface per IRC R903.2)
3. EPDM is secured at the top with a metal termination bar, mechanically fastened through the wood framing
4. Sheet-metal coping cap covers the top of the parapet/curb and laps over the termination bar by minimum 3"

**Down the exposed wood frame (252.5" to 184"):**

5. Self-adhered membrane (Grace Ice & Water Shield, Blueskin VP160, or similar peel-and-stick designed for vertical applications) runs the FULL 68.5" of exposed wood-frame wall from the roof edge down to the CMU top. This is NOT field EPDM — self-adhered membrane bonds directly to the OSB sheathing and is purpose-built for wall applications.
6. This membrane laps UNDER the EPDM roof membrane turn-down at the top (shingle-style, water sheds over the lap)
7. Mechanically fasten with cap nails at the top edge only; the adhesive bond handles the rest

**Over the CMU top (at 184"):**

8. The self-adhered membrane continues OVER the top of the CMU wall (8" across the CMU top course)
9. This caps the 1" cavity, sealing it from water entry above
10. The membrane wraps DOWN the exterior CMU face 2-3" (one quarter of a CMU course)
11. Terminate with a metal drip-edge flashing set into the horizontal mortar joint between CMU course 23 and course 22
12. Seal the reglet with polyurethane caulk (Sikaflex or equivalent)
13. The drip edge kicks out 1/2" to shed water away from the CMU face below

**Why this approach works for your building:**

- Protects the 68.5" of exposed wood frame that has NO CMU shell behind it — this is the most vulnerable zone
- Caps the CMU top to prevent water entry into the 1" cavity
- The 2-3" turn-down on the CMU exterior creates a clean drip edge without covering the whole CMU face
- Keeps the CMU face below the flashing open to breathe and dry out through mortar joints
- Self-adhered membrane handles MN temperature swings (-30F to 90F) without debonding

### 3b. How Far Down the CMU Exterior: Just 2-3 Inches

**Recommendation: Run the membrane over the CMU top and down the EXTERIOR face only 2-3 inches (to the first mortar joint below the top course).**

Do NOT run it all the way down the CMU to grade. Here's why:

- The CMU below course 22 is an existing, self-supporting masonry wall with no cavity exposure — it doesn't need membrane coverage
- Sealing the entire CMU face traps moisture that the masonry needs to release through its mortar joints
- The CMU has natural drainage through mortar joints at grade
- Running membrane 184" down a wall creates thermal expansion stress and serves no purpose
- The critical seal point is the TOP of the CMU where the cavity is exposed — once that's capped, the CMU below is just a standard masonry wall

**What to do below the drip edge:**

- Apply a masonry water repellent (silane/siloxane sealer like Prosoco Sure Klean Weather Seal) to the exposed CMU face below the flashing — this lets the CMU breathe while repelling bulk water
- Ensure weep holes exist at the CMU base (per standard masonry practice)
- The 1" cavity between the wood frame and CMU interior face should be ventilated at the base — do NOT seal the bottom of this cavity, water needs a way out

### 3b-alt. Interior Cavity Drainage Strategy

Since the 1" gap (FR_GAP) runs the full height, even with the top capped, some condensation will form inside the cavity due to temperature differentials between the CMU (cold) and wood frame (warm). Address this:

- Leave the cavity open at the base (at slab level) with weep holes or a drainage mat
- Do NOT fill the cavity with insulation or spray foam — it needs to drain and dry
- Consider a strip of drainage mat (like Mortairvent or Delta-Dry) on the CMU interior face within the cavity to channel condensation downward to the weeps
- The cavity acts as a rainscreen — this is actually good design, just needs top and bottom detailing

### 3c. At the West Wall (3rd Floor Loft / Parapet Condition)

The west ~120" of the building has a partial third floor loft built on top of the roof deck. The east side has an open balcony that acts as a parapet. This creates two conditions:

**Loft portion (west):** The EPDM membrane runs under the loft structure. The loft walls bear on the roof deck, so the membrane must be detailed as a "through-wall" condition — membrane runs continuously under the loft wall bottom plate with proper bearing protection (cover board under bearing points).

**Open balcony / parapet portion (east):** Standard parapet flashing detail — membrane turns up the parapet wall, secured with termination bar, capped with sheet-metal coping. Ensure parapet coping has positive slope back toward the roof (not outward) to prevent water from running down the exterior face.

---

## 4. Drainage Plan

### Slope

The roof deck must have positive slope toward drainage points. Minimum 1/4" per foot (1:48). Achieve this with tapered polyiso insulation boards — the structural deck stays flat, the insulation creates the slope.

### Scuppers (Primary Drainage)

For a flat roof at this scale (~286" x 166" = ~24' x 14'), scuppers through the parapet/wall are the most practical drainage method.

**Recommended scupper locations:**

- Minimum 2 scuppers on the low side of the slope (likely the east or south walls, depending on slope direction)
- Scupper opening size: minimum 4" high x 8" wide
- Scupper pan: EPDM-wrapped sheet metal extending through the wall and projecting minimum 4" beyond the exterior face
- Conductor heads or downspout connections at the exterior

### Crickets

Install tapered insulation crickets at:

- The base of the loft wall (west side) to direct water away from the loft-to-roof junction
- Any interior corners where water would otherwise pool
- Behind any mechanical penetrations

### Overflow / Emergency Drainage

Per IRC R903.4.1, provide at least one overflow drain or scupper set 2" above the primary scupper level. This prevents catastrophic ponding if the primary drains are blocked by snow/debris.

---

## 5. Connection to App Blueprint

### New Component Types Needed

These should be added to PARTS_CATALOG.md as new CT entries:

| Proposed ID | Component | Notes |
|-------------|-----------|-------|
| CT-025 | EPDM roof membrane (60 mil) | Field membrane + base flashing sheets |
| CT-026 | Roof insulation assembly (polyiso + batt) | Above-deck polyiso + in-joist batts |
| CT-027 | Cover board (DensDeck or equiv.) | Substrate for EPDM |
| CT-028 | Flashing / termination bar assembly | Metal termination bars, coping, counter-flashing |
| CT-029 | Scupper assembly | EPDM-wrapped sheet metal through-wall drain |
| CT-030 | Vapor barrier (roof) | 6-mil poly or self-adhered |

### App Rendering Status (Roof Toggle)

Toggle the **Roof** layer in any wall elevation to see these elements:

| Element | Rendered | Description |
|---------|----------|-------------|
| R-38 batt fills | ✅ N/S walls | Yellow fills in TJI joist bays at roof deck level |
| Above-deck layer strokes | ✅ All walls | 5 color-coded horizontal lines: vapor barrier, polyiso, taper, cover board, EPDM |
| Membrane transition path | ✅ All walls | Red path (both edges): runs down frame face → over CMU top → 3" down exterior CMU face |
| Drip-edge flashing | ✅ All walls | Blue indicator at membrane termination on CMU exterior (mortar joint) |
| Termination bar | ✅ All walls | Gray bar at parapet top where EPDM is mechanically secured |
| Scupper openings | 🟡 Not yet | Need to add scupper markers on plan view and relevant elevations |

**Constants added to framing-data.ts:**

- `CMU_TOTAL_H = 184` — total CMU height (23 courses × 8")
- `ROOF_MEMBRANE_TURNDOWN = 3` — membrane runs 3" down exterior CMU face
- `ROOF_DRIP_EDGE_W = 0.5` — drip edge kicks out 1/2" from CMU face
- `ROOF_TERM_BAR_W = 1.5` — termination bar width
- `ROOF_COPING_H = 2` — coping cap height above parapet

**Hover tooltips:** Each membrane path element has interactive tooltips showing exact dimensions, materials, and installation notes.

---

## 6. Material Considerations for Northern MN

| Concern | Recommendation |
|---------|---------------|
| Freeze-thaw cycles | EPDM rated to -65 F brittleness, ideal for MN. Use 60-mil minimum (not 45-mil). |
| Snow load (60-80 psf) | Tapered insulation must be rated for the design snow load. Verify compressive strength of polyiso (minimum 25 psi). |
| Ice damming | Not typical on flat roofs with proper slope, but ensure scuppers are large enough to handle meltwater and won't freeze shut. Consider heat trace cable at scuppers. |
| Adhesive performance | Fully-adhered EPDM is preferred over mechanically-attached for snow load resistance. Adhesive must be applied above 40 F — schedule accordingly. |
| UV exposure | EPDM is UV-stable, but consider white EPDM or reflective coating to reduce thermal cycling stress. |
| Thermal movement | Counter-flashing must allow independent movement between roof membrane and CMU wall. Never rigidly connect them. |

---

## 7. Code References

- **IRC R903.2** — Flashing at roof-to-wall intersections, minimum 8" turn-up above roof surface
- **IRC R903.4** — Roof drainage, scupper sizing
- **IRC R903.4.1** — Secondary (overflow/emergency) drainage
- **MN Energy Code (Climate Zone 7)** — R-49 minimum roof insulation
- **ASTM D4637** — Standard specification for EPDM sheet rubber
- **NRCA Roofing Manual** — Low-slope membrane roofing details
- **TEK 19-05A (NCMA)** — Flashing details for concrete masonry walls

---

## 8. Critical Warnings

1. **Do NOT rely on this document alone for construction.** Have a licensed architect or roofing consultant review and produce sealed shop drawings for the roof-to-wall transition details.

2. **The wood-to-CMU transition at 184" is the most vulnerable point.** Water that gets behind the flashing at this junction can cause rot in the wood framing and efflorescence/spalling in the CMU. Double-flash this area.

3. **Drainage behind the membrane matters.** The cavity between the independent wood frame and the CMU interior face must have a drainage strategy. If this cavity is sealed at top and bottom, moisture WILL accumulate and cause problems.

4. **The partial loft structure complicates the roof.** Where the loft walls bear on the roof deck, the membrane runs UNDER the bearing — this is a "split slab" or "plaza deck" condition that requires specific detailing to prevent leaks at the bearing points. Consider a fully-adhered membrane here (not loose-laid).

5. **Snow removal plan.** With 60-80 psf design snow load, consider whether the roof will be actively cleared. If so, the EPDM surface must be protected from shovels/equipment (walkway pads, sacrificial membrane layer).

---

*Generated: 2026-03-20 | Source: Web research on EPDM roofing details, IRC code references, NCMA TEK notes, and Block House framing data*
