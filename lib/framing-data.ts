/**
 * ═══════════════════════════════════════════════════════════════════════
 *  BLOCK HOUSE — SINGLE SOURCE OF TRUTH FOR ALL HOUSE-SPECIFIC GEOMETRY
 * ═══════════════════════════════════════════════════════════════════════
 *
 * Every dimension that describes THIS house lives here.
 * Components are dumb renderers; layout-calculator.ts is pure math.
 * Standard lumber dimensions (stud face width, plate height, header
 * depth) live in layout-calculator.ts — they describe how framing
 * works, not this specific building.
 *
 * ─── CONFIGURABLE VALUE INDEX ─────────────────────────────────────
 *
 *  CMU SHELL GEOMETRY                                        line  96
 *    CMU_T .............. 8"     CMU wall thickness
 *    CMU_BLOCK_W ........ 16"    Block width (incl. mortar)
 *    CMU_BLOCK_H ........ 8"     Block height (incl. mortar)
 *    CMU_INTERIOR_W ..... 288"   Interior width E-W (19 blocks)
 *    CMU_INTERIOR_D ..... 168"   Interior depth N-S (11.5 blocks)
 *    CMU_EXT_TOP ........ 8"     CMU above top plate
 *    CMU_EXT_SIDE ....... 9"     Visible CMU past frame end (1″ gap + 8″)
 *
 *  FRAME CONFIGURATION                                       line 104
 *    FR_GAP ............. 1"     Air gap CMU-to-frame
 *    FR_D ............... 5.5"   Exterior frame depth (2×6 actual)
 *
 *  INTERIOR PARTITIONS                                       line 109
 *    INT_D .............. 3.5"   2×4 partition wall depth
 *    INT_SW ............. 1.5"   2×4 stud face width
 *    PARTITION_WALL_R ... 96"    Horizontal partition east edge
 *    PARTITION_V_OFFSET . 16.5"  Horiz. partition south of canopy jamb
 *    COUNTER_H .......... 36"    Kitchen counter height (elevation)
 *    COUNTER_DEPTH ...... 24"    Kitchen counter depth (plan)
 *    horizPartition            Kitchen/bath partition wall definition  line 118
 *    vertPartition             Bathroom door wall definition (28″ door) line 128
 *
 *  STAIR PARAMETERS                                          line 141
 *    STAIR_TOTAL_RISERS . 14     Total risers floor-to-floor (106.25/14 = 7.59" riser)
 *    STAIR_TREAD_DEPTH .. 9"     Tread depth (run per step)
 *    STAIR_LAND_RISERS .. 2      Risers in landing zone (platform 15.18")
 *    STAIR_WIDTH ........ 36"    Stair / landing width (code min.)
 *    STAIR_APPR_STEPS ... 1      N-S approach steps (floor plan)
 *    STAIR_MAIN_STEPS ... 11     Main run treads E-W (floor plan)
 *
 *  STAIR LANDING DETAIL LUMBER                               line 151
 *    STAIR_TREAD_T ...... 1.0"   5/4×12 tread board
 *    STAIR_RISER_T ...... 0.75"  1×8 riser board
 *    STAIR_LAND_JOIST_W . 1.5"   2×10 joist face width
 *    STAIR_LAND_JOIST_D . 9.25"  2×10 joist depth
 *    STAIR_LAND_RIM_W ... 1.5"   2×10 rim header face width
 *    STAIR_LAND_DECK_T .. 0.75"  ¾″ plywood landing deck
 *    STAIR_LAND_POST_W .. 3.5"   4×4 post width
 *    STAIR_LAND_LEDGER_W  1.5"   2×10 ledger face width
 *
 *  STAIR STRINGER LUMBER
 *    STAIR_STRINGER_DEPTH 11.25" 2×12 actual depth
 *    STAIR_STRINGER_FACE  1.5"   2×12 face width
 *
 *  FIXTURE DIMENSIONS (plan view)                            line 161
 *    FRIDGE_W ........... 30"    Fridge width
 *    SMALL_CTR_W ........ 12"    Small counter between fridge and door
 *    KIT_SINK_W ......... 33"    Kitchen double sink width
 *    KIT_SINK_D ......... 18"    Kitchen sink depth
 *    KIT_SINK_RIM ....... 2"     Kitchen sink rim
 *    BATH_VAN_W ......... 24"    Bathroom vanity width
 *    BATH_VAN_D ......... 18"    Bathroom vanity depth
 *    BATH_VAN_RIM ....... 2"     Bathroom vanity rim
 *    SHOWER_W ........... 36"    Shower width
 *    SHOWER_CURB ........ 2"     Shower curb width
 *    TOILET_W ........... 14"    Toilet width
 *    TOILET_TANK_D ...... 7"     Toilet tank depth
 *    TOILET_BOWL_D ...... 21"    Toilet bowl depth
 *
 *  WOOD STOVE — SW CORNER (6" flue, through-wall south)
 *    STOVE_W ............ 24"    Stove footprint width (E-W)
 *    STOVE_D ............ 24"    Stove footprint depth (N-S)
 *    STOVE_REAR_CLR ..... 12"    Clearance: south wall → stove back
 *    STOVE_SIDE_CLR ..... 18"    Clearance: west wall → stove side
 *    STOVE_FLUE_DIA ..... 6"     Flue diameter
 *    STOVE_FLUE_H ....... 30"    Flue collar height above floor
 *    STOVE_THIMBLE_OD ... 12"    Insulated wall thimble OD
 *    HEARTH_PAD_FRONT ... 18"    Pad extension in front of stove
 *    HEARTH_PAD_SIDE .... 8"     Pad extension on each side
 *    HEARTH_PAD_REAR .... 2"     Pad extension behind stove
 *
 *  TJI FLOOR JOIST SYSTEM (main floor)                       line 177
 *    TJI_DEPTH .......... 9.5"    TJI joist depth (PRI-40, SKU 106-5882)
 *    TJI_FLANGE_H ....... 1.5"   TJI flange height
 *    TJI_WEB_W .......... 0.75"  TJI web width
 *    TJI_RIM_T .......... 1.125" Rim board thickness (SKU 106-8025)
 *    TJI_OC ............. 16"    TJI joist spacing
 *    SUBFLOOR_T ......... 0.75"  Main floor subfloor thickness
 *
 *  BATHROOM RAISED FLOOR                                     line 186
 *    BATH_JOIST_H ....... 5.5"   2×6 bath floor joist depth
 *    BATH_JOIST_OC ...... 16"    Bath joist spacing
 *    BATH_CLEAT_H ....... 3.5"   Ledger cleat height (2×4)
 *    BATH_SUBFLOOR_T .... 0.75"  Bathroom subfloor thickness
 *    BATH_LEDGER_T ...... 1.5"   Ledger thickness
 *
 *  EXTERIOR WALLS                                            line 194
 *    initialWalls               North / South / East / West definitions
 *                                (south wall carries studOverrides for
 *                                 joist-alignment nudge on studs 17-18)
 */

import type { WallElevation, WallId } from "./types";

// ═══ CMU SHELL GEOMETRY ═════════════════════════════════════════════

export const CMU_T          = 8;
export const CMU_BLOCK_W    = 16;
export const CMU_BLOCK_H    = 8;
export const CMU_INTERIOR_W = 288;
export const CMU_INTERIOR_D = 168;
export const CMU_EXT_TOP    = 8;
export const CMU_EXT_SIDE   = 9;

// ═══ FRAME CONFIGURATION ═══════════════════════════════════════════

export const FR_GAP = 1;
export const FR_D   = 5.5;

// ═══ INTERIOR PARTITIONS ═══════════════════════════════════════════

export const INT_D              = 3.5;
export const INT_SW             = 1.5;
export const PARTITION_WALL_R   = 100.5;
export const PARTITION_V_OFFSET = 16.5;
export const COUNTER_H          = 36;
export const COUNTER_DEPTH      = 24;

export const EAST_WIN_POS       = 72;    // east wall window positionFromLeftInches
export const BATH_DOOR_RO       = 28;    // bathroom door rough opening width

const HORIZ_PART_LENGTH = PARTITION_WALL_R - (CMU_T + FR_GAP + FR_D);
const VERT_PART_LENGTH  = EAST_WIN_POS - FR_D - PARTITION_V_OFFSET;

export const horizPartition: WallElevation = {
  id: "horiz-partition",
  name: "Kitchen / Bath Partition (horizontal)",
  totalLengthInches: HORIZ_PART_LENGTH,
  wallHeightInches: 96,
  studSpacingOC: 16,
  sections: [{ lengthInches: HORIZ_PART_LENGTH }],
  openings: [],
};

export const vertPartition: WallElevation = {
  id: "vert-partition",
  name: "Bathroom Door Wall",
  totalLengthInches: VERT_PART_LENGTH,
  wallHeightInches: 96,
  studSpacingOC: 16,
  sections: [
    { lengthInches: BATH_DOOR_RO, label: `${BATH_DOOR_RO}" door RO` },
    { lengthInches: VERT_PART_LENGTH - BATH_DOOR_RO, label: `${VERT_PART_LENGTH - BATH_DOOR_RO}"` },
  ],
  openings: [{ type: "door", widthInches: BATH_DOOR_RO, heightInches: 80, positionFromLeftInches: 0 }],
};

/** Same size as bathroom door wall but no door — east face of bathroom (kitchen side). */
export const bathroomEastWall: WallElevation = {
  id: "bathroom-east",
  name: "Bathroom (east side)",
  totalLengthInches: VERT_PART_LENGTH,
  wallHeightInches: 96,
  studSpacingOC: 16,
  sections: [{ lengthInches: VERT_PART_LENGTH }],
  openings: [],
};

// ═══ STAIR PARAMETERS ═══════════════════════════════════════════════

export const STAIR_TOTAL_RISERS = 14;
export const STAIR_TREAD_DEPTH  = 9;
export const STAIR_NOSING       = 1;    // tread nosing overhang past riser face
export const STAIR_LAND_RISERS  = 2;
export const STAIR_WIDTH        = 36;
export const STAIR_APPR_STEPS   = 1;
export const STAIR_MAIN_STEPS   = 11;

// Stair landing detail lumber
export const STAIR_TREAD_T      = 1.0;
export const STAIR_RISER_T      = 0.75;
export const STAIR_LAND_JOIST_W = 1.5;
export const STAIR_LAND_JOIST_D = 9.25;
export const STAIR_LAND_RIM_W   = 1.5;
export const STAIR_LAND_DECK_T  = 0.75;
export const STAIR_LAND_POST_W  = 3.5;
export const STAIR_LAND_LEDGER_W = 1.5;

// Stair stringer lumber
export const STAIR_STRINGER_DEPTH = 11.25;   // 2×12 actual depth
export const STAIR_STRINGER_FACE  = 1.5;     // 2×12 face width

// Second floor stair (north wall, straight run — no landing)
// Elevation X at east end of main run; plan bottom landing west edge = (FW_OUT+nLen) − this.
// 159.5 → plan stair2BotX 135.5", bot land 99.5"–135.5" (aligned w/ 1F stairwell west edge).
export const STAIR2_START_X       = 159.5;
export const STAIR2_TOTAL_RISERS  = 14;
export const STAIR2_LAND_TOP_W    = 36;
export const STAIR2_LAND_BOT_W    = 36;

// ═══ FIXTURE DIMENSIONS (plan view) ═════════════════════════════════

export const FRIDGE_W      = 30;
export const SMALL_CTR_W   = 12;
export const KIT_SINK_W    = 33;
export const KIT_SINK_D    = 18;
export const KIT_SINK_RIM  = 2;
export const BATH_VAN_W    = 24;
export const BATH_VAN_D    = 18;
export const BATH_VAN_RIM  = 2;
export const SHOWER_W      = 36;
export const SHOWER_CURB   = 2;
export const TOILET_W      = 14;
export const TOILET_TANK_D = 7;
export const TOILET_BOWL_D = 21;

// ═══ WOOD STOVE — SW CORNER, 6" FLUE, THROUGH-WALL TO SOUTH ════════
//
//  Stove sits in the SW corner with rear flue exiting through the south
//  wall via an insulated Class A wall thimble.  Exterior vertical chimney
//  run rises on the south face of the CMU shell.
//
//  Code reference: NFPA 211, IRC M1306 (clearances to combustibles)
//  Pipe spec: 6" Class A triple-wall (UL 103HT), e.g. DuraTech / Selkirk
//  Connector: 6" double-wall black stove pipe (DVL / DuraBlack)
//  Wall pass-through: DuraTech 6DT-WT insulated thimble (2" clearance)
//
export const STOVE_W           = 24;     // stove footprint width (E-W)
export const STOVE_D           = 24;     // stove footprint depth (N-S)
export const STOVE_REAR_CLR    = 12;     // clearance: south wall inner face → stove back (w/ heat shield)
export const STOVE_SIDE_CLR    = 18;     // clearance: west wall inner face → stove right side
export const STOVE_FLUE_DIA    = 6;      // flue diameter (inches)
export const STOVE_FLUE_H      = 30;     // flue collar height above floor (elevation)
export const STOVE_THIMBLE_OD  = 12;     // insulated thimble outer diameter
export const HEARTH_PAD_FRONT  = 18;     // pad extension in front of stove door
export const HEARTH_PAD_SIDE   = 8;      // pad extension on each side of stove
export const HEARTH_PAD_REAR   = 2;      // pad extension behind stove (to wall)

// ═══ LAUNDRY — WASHER / DRYER (north wall, far left / west end) ═══

export const WASHER_W        = 27;    // standard front-load washer width
export const WASHER_H        = 39;    // front-load height
export const WASHER_D        = 33;    // depth (not shown in elevation)
export const DRYER_W         = 27;    // standard dryer width
export const DRYER_H         = 39;    // dryer height (matches washer)
export const DRYER_D         = 33;    // depth
export const WD_GAP          = 1;     // gap between washer and dryer
export const WD_TOTAL_W      = WASHER_W + WD_GAP + DRYER_W; // 55"
export const WD_X            = 3;     // start past end king stud + gap (west end of north elev)
export const STANDPIPE_H     = 42;    // standpipe height (max per code)
export const DRYER_VENT_D    = 4;     // 4" rigid metal duct

// ═══ CABINET LAYOUT ════════════════════════════════════════════════

// Standard heights
export const CAB_TOE_KICK    = 4;
export const CAB_BASE_H      = 34.5;
export const CAB_UPPER_BOT   = 54;
export const CAB_UPPER_H_STD = 36;
export const CAB_UPPER_TOP   = 90;
export const CAB_BASE_D      = 24;
export const CAB_UPPER_D     = 12;
export const FRIDGE_H        = 70;
export const FRIDGE_D        = 30;

// North wall base cabinet runs (elevation x positions)
export const NCAB_MAIN_L     = 5.5;
export const NCAB_MAIN_R     = 85;
export const NCAB_FRIDGE_L   = 85;
export const NCAB_FRIDGE_R   = 115;
export const NCAB_SMALL_L    = 115;
export const NCAB_SMALL_R    = 127;
export const NCAB_RIGHT_L    = 166;
export const NCAB_RIGHT_R    = 280.5;

// North wall base cabinet individual widths (main run: 36+33+9 = 78, 1.5" filler)
export const NCAB_M1_W       = 36;
export const NCAB_M2_W       = 33;
export const NCAB_M3_W       = 9;

// North wall upper cabinet individual widths (36+30+12 = 78, 1.5" filler)
export const NCAB_U1_W       = 36;
export const NCAB_U2_W       = 30;
export const NCAB_U3_W       = 12;

// Right of door base cabinets
export const NCAB_R1_W       = 36;
export const NCAB_R2_W       = 36;

// West wall cabinet run (west wall elevation x)
export const WCAB_L          = 79.5;
export const WCAB_W1         = 27;
export const WCAB_W2         = 30;

// Partition counter (south wall elevation x)
export const PCAB_L          = 191;
export const PCAB_R          = 280.5;
export const PCAB_C1_W       = 30;
export const PCAB_C2_W       = 33;
export const PCAB_C3_W       = 24;

// ═══ TJI FLOOR JOIST SYSTEM (main floor) ════════════════════════════

export const TJI_DEPTH    = 9.5;     // PRI-40 I-Joist SKU 106-5882 (was 11.875)
export const TJI_FLANGE_H = 1.5;
export const TJI_WEB_W    = 0.75;
export const TJI_RIM_T    = 1.125;  // engineered rim board SKU 106-8025 (was 1.5)
export const TJI_OC       = 16;
export const SUBFLOOR_T   = 0.75;

// ═══ BATHROOM RAISED FLOOR ══════════════════════════════════════════

export const BATH_JOIST_H    = 5.5;
export const BATH_JOIST_OC   = 16;
export const BATH_CLEAT_H    = 3.5;
export const BATH_SUBFLOOR_T = 0.75;
export const BATH_LEDGER_T   = 1.5;

// ═══ ROOF ASSEMBLY (shed roof over CMU shell) ══════════════════════
//
// Flat/low-slope shed roof for Alexandria, MN (climate zone 7).
// Design roof snow load: 42 psf (MSBC 1303.1700, northern MN zone).
// Roof area = CMU exterior footprint: 304" E-W × 184" N-S.
//
// HYBRID INSULATION — between joists + continuous rigid on top:
//   Between joists: R-38 mineral wool batts in 9.5" TJI bays
//   On top of deck:  2" rigid polyiso (R-11.4) continuous thermal break
//   Combined: R-38 + R-11.4 = R-49.4 (meets IRC R-49 min for zone 7)
//
// Assembly from deck up:
//   1. Structural deck (TJI + 3/4" OSB — same as floor system)
//   2. R-38 mineral wool batts between TJI joists (9.5" bays)
//   3. 6-mil poly vapor retarder on top of deck
//   4. 2" rigid polyiso (continuous over joist flanges)
//   5. Tapered polyiso cricket (1/4"/ft slope to scuppers)
//   6. 1/2" high-density cover board
//   7. 60-mil EPDM membrane (fully adhered)
//   8. Parapet flashing + termination bar + metal coping cap

export const ROOF_EXT_W         = 304;    // CMU exterior E-W (roof span)
export const ROOF_EXT_D         = 184;    // CMU exterior N-S (roof span)

// Between-joist insulation
export const ROOF_BATT_R        = 38;     // R-38 mineral wool batts
export const ROOF_BATT_T        = 9.5;    // fills full TJI joist depth

// Above-deck continuous insulation
export const ROOF_POLYISO_T     = 2;      // 2" rigid polyiso on top of deck
export const ROOF_POLYISO_R     = 5.7;    // R-value per inch of polyiso
export const ROOF_TOTAL_R       = 49.4;   // R-38 batts + R-11.4 polyiso

export const ROOF_TAPER_MIN     = 0.5;    // tapered polyiso min thickness (low end)
export const ROOF_TAPER_SLOPE   = 0.25;   // 1/4" per foot slope
export const ROOF_COVERBOARD_T  = 0.5;    // 1/2" high-density cover board
export const ROOF_EPDM_T        = 0.060;  // 60-mil EPDM membrane
export const ROOF_PARAPET_H     = 8;      // CMU parapet above roof deck (1 course min)
export const ROOF_FLASHING_LAP  = 12;     // membrane laps 12" up parapet wall (min)
export const ROOF_COPING_W      = 12;     // metal coping cap width
export const ROOF_SCUPPER_W     = 8;      // scupper opening width through CMU
export const ROOF_SCUPPER_H     = 4;      // scupper opening height
export const ROOF_SCUPPER_COUNT = 2;      // primary scuppers on low side
export const ROOF_SNOW_LOAD     = 42;     // design roof snow load (psf)

// ── EPDM-to-CMU Transition Detail ──
// Self-adhered membrane runs from roof edge down exposed wood frame
// to CMU top, over the CMU top course, and 2-3" down exterior CMU face.
// See EPDM_ROOF_DETAIL.md §3a for full specification.
export const CMU_TOTAL_H        = 184;    // total CMU height: 23 courses × 8"
export const ROOF_MEMBRANE_TURNDOWN = 3;  // membrane runs 3" down exterior CMU face
export const ROOF_DRIP_EDGE_W   = 0.5;   // drip edge kicks out 1/2" from CMU face
export const ROOF_TERM_BAR_W    = 1.5;   // termination bar width (aluminum)
export const ROOF_COPING_H      = 2;     // coping cap height above parapet top

// ═══ EXTERIOR WALLS ═════════════════════════════════════════════════
/**
 * CMU shell with wood frame built 1″ off the interior CMU face.
 * CMU block module: 16″ nominal (incl. mortar).
 *
 * CMU exterior: 304″ E-W (19 blocks) × 184″ N-S (11.5 blocks)
 * CMU interior: 288″ E-W × 168″ N-S
 *
 * Corner framing convention (1″ standoff on all wall faces from CMU):
 *   N/S walls: 286″ = 288″ CMU width  − 2 × 1″ gap
 *   E/W walls: 166″ = 168″ CMU depth − 2 × 1″ gap
 *   At corners the two frames overlap; E/W end studs tie into N/S plates.
 *
 * In the elevation, each frame end shows: 1″ gap + 8″ CMU wall = 9″
 *
 * North = South length ✓   East = West length ✓
 */
export const initialWalls: Record<string, WallElevation> = {
  south: {
    id: "south",
    name: "South Wall",
    totalLengthInches: 286,
    wallHeightInches: 96,
    studSpacingOC: 16,
    anchorBolts: [6, 66, 122, 170, 236, 280],
    sections: [
      { lengthInches: 127, label: "127\" (east of door)" },
      { lengthInches: 48,  label: "48\" door RO (3 CMU blocks)" },
      { lengthInches: 111, label: "111\" (west of door)" },
    ],
    openings: [
      {
        type: "door",
        widthInches: 48,
        heightInches: 80,
        positionFromLeftInches: 127,
        label: "4'-0\" × 6'-8\"",
        headerSpec: {
          depth: 7.25,
          plies: 1,
          label: "(2) 2×8 solid — engineer to verify",
          note: "Renders as single solid piece. Final spec TBD by engineer.",
        },
      },
      {
        // CMU window: 5 blocks from right (5×16=80"), 2.5 blocks wide (40"),
        // 5 blocks tall (40"), 1 block above (top at 23×8-8=176", sill at 136")
        type: "cmu-only",
        widthInches: 40,        // 2.5 CMU blocks × 16"
        heightInches: 40,       // 5 CMU blocks × 8"
        sillHeightInches: 136,  // 17 courses up × 8" = 136"
        positionFromLeftInches: 166, // 286 - 80(5 blocks) - 40(window) = 166"
        label: "CMU Window — 2½ × 5 block",
      },
    ],
    studOverrides: {
      "south-stud-12": { dx: 1.5 },
    },
  },

  north: {
    id: "north",
    name: "North Wall",
    totalLengthInches: 286,
    wallHeightInches: 96,
    studSpacingOC: 16,
    anchorBolts: [6, 72, 144, 216, 280],
    sections: [
      { lengthInches: 151, label: "151\" (west of window)" },
      { lengthInches: 40,  label: "40\" window RO (2.5 blocks)" },
      { lengthInches: 95,  label: "95\" (east of window)" },
    ],
    openings: [
      {
        type: "window",
        widthInches: 40,
        heightInches: 48,
        sillHeightInches: 40,
        positionFromLeftInches: 151,
        label: "3'-4\" × 4'-0\"",
        headerSpec: {
          depth: 5.5,
          plies: 1,
          label: "(2) 2×6 solid — engineer to verify",
          note: "Renders as single solid piece. Final spec TBD by engineer.",
          subPlate: {
            depth: 1.5,
            label: "2×6 flat plate under header",
          },
        },
      },
    ],
  },

  west: {
    id: "west",
    name: "West Wall",
    totalLengthInches: 166,
    wallHeightInches: 96,
    studSpacingOC: 16,
    sections: [
      { lengthInches: 40, label: "40\" / 2.5 bays" },
      { lengthInches: 79, label: "79\" sliding door RO" },
      { lengthInches: 47, label: "47\" / right section" },
    ],
    anchorBolts: [6, 38.5, 120.5, 160],
    openings: [
      {
        type: "door",
        widthInches: 79,
        heightInches: 73,
        positionFromLeftInches: 40,
        label: "6'7\" × 5'11\"",
        openingSubtype: "Sliding Door",
        jackCount: 2,
        headerSpec: {
          depth: 11.25,
          plies: 2,
          label: "3.5\" × 11.25\" LVL beam",
          note: "Engineer required — 6'7\" span, flat roof, northern MN snow load. LVL fits 2×6 wall without spacer.",
        },
      },
      {
        // CMU opening BELOW the solid 10th course: courses 2–9 (8"–80")
        // One solid course at the bottom (0"–8"), then open for door/framing cavity.
        // Course 10 (80"–88") is SOLID — runs continuously across the full wall.
        type: "cmu-only",
        widthInches: 71,          // 119" - 48" (door right edge, left inset ½ block)
        heightInches: 72,         // 9 courses × 8" (sill=8" to 80" = course 10 bottom)
        sillHeightInches: 8,      // 1 CMU course from bottom
        positionFromLeftInches: 48,
        label: "CMU Opening — W wall (below lintel)",
      },
      {
        // CMU opening ABOVE the solid 10th course: courses 12–22 (88"–176")
        // Course 10 (80"–88") is the solid lintel course; above it is open.
        type: "cmu-only",
        widthInches: 71,          // same width as lower opening
        heightInches: 88,         // 11 courses × 8" (88" to 176")
        sillHeightInches: 88,     // starts at top of course 11 (88")
        positionFromLeftInches: 48,
        label: "CMU Opening — W wall (above lintel)",
      },
    ],
  },

  east: {
    id: "east",
    name: "East Wall",
    totalLengthInches: 166,
    wallHeightInches: 96,
    studSpacingOC: 16,
    anchorBolts: [6, 72, 138, 160],
    sections: [
      { lengthInches: EAST_WIN_POS, label: `${EAST_WIN_POS}" / ${EAST_WIN_POS / 16} bays` },
      { lengthInches: EAST_WIN_POS, label: `${EAST_WIN_POS}" window RO` },
      { lengthInches: 22, label: "22\" / right section" },
    ],
    openings: [
      {
        type: "window",
        widthInches: EAST_WIN_POS,
        heightInches: 48,
        sillHeightInches: 36,
        positionFromLeftInches: EAST_WIN_POS,
        label: "6' × 4'",
        jackCount: 2,
        headerSpec: {
          depth: 9.25,
          plies: 2,
          label: "3.5\" × 9.25\" LVL beam",
          note: "Engineer required — 6' span, flat roof, northern MN snow load. LVL fits 2×6 wall without spacer.",
        },
      },
      {
        // CMU window: 4.5 blocks from right (4.5×16=72"), 2.5 blocks wide (40"),
        // 5 blocks tall (40"), 1 block above (top at 22×8=176", sill at 136")
        type: "cmu-only",
        widthInches: 40,        // 2.5 CMU blocks × 16"
        heightInches: 40,       // 5 CMU blocks × 8"
        sillHeightInches: 136,  // 17 courses up × 8" = 136"
        positionFromLeftInches: 54, // 166 - 72(4.5 blocks right) - 40(window) = 54"
        label: "CMU Window — E wall",
      },
    ],
  },
};

// ═══ THIRD FLOOR (OBSERVATION DECK + STAIR STRUCTURE) ═══════════════════════
// The third floor is a full-footprint open observation deck (no walls) with a
// small enclosed structure in the northwest corner where the staircase arrives.
// The structure is 6' long (E-W) × 3' wide (N-S), tucked against the north
// and west CMU walls.
export const THIRD_FLOOR_W  = 120;   // kept for wall elevation backward compat
export const THIRD_FLOOR_H  = 90;    // third floor wall height — 7'6"

// Stair structure dimensions (small enclosed room in NW corner)
export const VESTIBULE_W    = 72;    // 6' east-west (plan X) — long side along long building axis
export const VESTIBULE_D    = 36;    // 3' north-south (plan Y) — short side along short building axis

// West wall third floor — full width, shed roof sloping low-left → high-right
export const WEST_F3_LOW_H  = 84;    // low end (left/west) wall height at 3rd floor — 7'0"
export const WEST_F3_HIGH_H = 96;    // high end (right/east) wall height — matches north wall 3rd floor

export const thirdFloorEastWall: WallElevation = {
  id: "east-3" as WallId,
  name: "East Wall — Third Floor (Loft Landing)",
  totalLengthInches: 36,  // 36" wide — stair landing width at south end
  wallHeightInches:  THIRD_FLOOR_H,
  studSpacingOC: 16,
  sections: [{ lengthInches: 36, label: "36\" loft landing (S end)" }],
  openings: [],
  anchorBolts: [],
};

export const thirdFloorNorthWall: WallElevation = {
  id: "north-3" as WallId,
  name: "North Wall — Third Floor (Partial)",
  totalLengthInches: THIRD_FLOOR_W,
  wallHeightInches:  THIRD_FLOOR_H,
  studSpacingOC: 16,
  sections: [
    { lengthInches: 36, label: "36\" loft door RO" },
    { lengthInches: 84, label: "84\" right of loft door" },
  ],
  openings: [
    {
      type: "door",
      widthInches: 36,
      heightInches: 80,
      positionFromLeftInches: 0,
      label: "3'-0\" × 6'-8\"",
      openingSubtype: "Loft Access Door",
      jackCount: 1,
      headerSpec: {
        depth: 5.5,
        plies: 2,
        label: "(2) 2×6 flat header",
        note: "36\" span at loft level — double 2×6 flat header adequate under shed roof.",
      },
    },
  ],
  anchorBolts: [],
};

export const thirdFloorSouthWall: WallElevation = {
  id: "south-3" as WallId,
  name: "South Wall — Third Floor (Partial)",
  totalLengthInches: THIRD_FLOOR_W,
  wallHeightInches:  THIRD_FLOOR_H,
  studSpacingOC: 16,
  sections: [
    { lengthInches: 80, label: "80\" left of loft door" },
    { lengthInches: 36, label: "36\" loft door RO" },
    { lengthInches: 4,  label: "4\" closure (R of door)" },
  ],
  openings: [
    {
      type: "door",
      widthInches: 36,
      heightInches: 80,
      positionFromLeftInches: 80,
      label: "3'-0\" × 6'-8\"",
      openingSubtype: "Loft Access Door",
      jackCount: 1,
      headerSpec: {
        depth: 5.5,
        plies: 2,
        label: "(2) 2×6 flat header",
        note: "36\" span at loft level — double 2×6 flat header adequate under shed roof.",
      },
    },
  ],
  anchorBolts: [],
};

// ═══ SECOND FLOOR WALLS ════════════════════════════════════════════════

export const secondFloorNorthWall: WallElevation = {
  id: "north-2" as WallId,
  name: "North Wall — Second Floor",
  totalLengthInches: 286,
  wallHeightInches: 96,
  studSpacingOC: 16,
  sections: [
    { lengthInches: 151, label: "151\" (east of stair)" },
    { lengthInches: 117, label: "117\" stair run" },
    { lengthInches: 18,  label: "18\" (west of stair)" },
  ],
  openings: [],
  anchorBolts: [6, 72, 138, 204, 280],
};

export const secondFloorSouthWall: WallElevation = {
  id: "south-2" as WallId,
  name: "South Wall — Second Floor",
  totalLengthInches: 286,
  wallHeightInches: 96,
  studSpacingOC: 16,
  sections: [
    { lengthInches: 166, label: "166\" left of window" },
    { lengthInches: 40,  label: "40\" window RO (2.5 CMU blocks)" },
    { lengthInches: 80,  label: "80\" right of window" },
  ],
  openings: [
    {
      // Matches CMU opening: 5 blocks from right, 2.5 blocks wide, 5 blocks tall
      type: "window",
      widthInches: 40,
      heightInches: 40,
      sillHeightInches: 29.75,  // 136" from slab − FLOOR2_IN (106.25") = 29.75" above deck — aligned with CMU opening
      positionFromLeftInches: 166,
      label: "3'4\" × 3'4\" CMU window",
      headerSpec: {
        depth: 5.5,
        plies: 2,
        label: "(2) 2×6 flat header",
        note: "40\" span — light load, double 2×6 flat header adequate.",
      },
    },
  ],
  anchorBolts: [6, 72, 138, 204, 280],
};

export const secondFloorWestWall: WallElevation = {
  id: "west-2" as WallId,
  name: "West Wall — Second Floor",
  totalLengthInches: 166,
  wallHeightInches: 96,
  studSpacingOC: 16,
  sections: [
    { lengthInches: 48, label: "48\" left of window" },
    { lengthInches: 71, label: "71\" picture window RO" },
    { lengthInches: 47, label: "47\" right of window" },
  ],
  openings: [
    {
      type: "window",
      widthInches: 71,          // fills full CMU opening (48" to 119")
      heightInches: 40,         // 3'4" picture window — header top lands at T.O. CMU
      sillHeightInches: 28.5,  // header top at CMU top: 77.75 - 9.25 (header) - 40 (window) = 28.5"
      positionFromLeftInches: 48,
      label: "5'11\" × 3'4\"",
      openingSubtype: "Picture Window",
      headerSpec: {
        depth: 9.25,
        plies: 2,
        label: "(2) 2×10 built-up header",
        note: "71\" span — double 2×10 adequate for picture window under flat roof.",
      },
    },
  ],
  anchorBolts: [6, 72, 138, 160],
};

export const secondFloorEastWall: WallElevation = {
  id: "east-2" as WallId,
  name: "East Wall — Second Floor",
  totalLengthInches: 166,
  wallHeightInches: 96,
  studSpacingOC: 16,
  sections: [
    { lengthInches: 54, label: "54\" left of window" },
    { lengthInches: 40, label: "40\" window RO (2.5 CMU blocks)" },
    { lengthInches: 72, label: "72\" right of window" },
  ],
  openings: [
    {
      // Matches CMU opening: 4.5 blocks from right, 2.5 blocks wide, 5 blocks tall
      type: "window",
      widthInches: 40,
      heightInches: 40,
      sillHeightInches: 29.75,   // 136" from slab − FLOOR2_IN (106.25") = 29.75" above deck — aligned with CMU opening
      positionFromLeftInches: 54,
      label: "3'4\" × 3'4\" CMU window",
      headerSpec: {
        depth: 5.5,
        plies: 2,
        label: "(2) 2×6 flat header",
        note: "40\" span — light load, double 2×6 flat header adequate.",
      },
    },
  ],
  anchorBolts: [6, 72, 138, 160],
};
