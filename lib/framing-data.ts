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
 *    STAIR_TOTAL_RISERS . 15     Total risers floor-to-floor
 *    STAIR_TREAD_DEPTH .. 10"    Tread depth (run per step)
 *    STAIR_LAND_RISERS .. 3      Risers in landing zone
 *    STAIR_WIDTH ........ 36"    Stair / landing width (code min.)
 *    STAIR_RISE_TOT ..... 21.75" Total landing rise (3 × 7.25″)
 *    STAIR_APPR_STEPS ... 2      N-S approach steps (floor plan)
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
 *  TJI FLOOR JOIST SYSTEM (main floor)                       line 177
 *    TJI_DEPTH .......... 11.875" TJI joist depth
 *    TJI_FLANGE_H ....... 1.5"   TJI flange height
 *    TJI_WEB_W .......... 0.75"  TJI web width
 *    TJI_RIM_T .......... 1.5"   Rim board thickness
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
export const PARTITION_WALL_R   = 96;
export const PARTITION_V_OFFSET = 16.5;
export const COUNTER_H          = 36;
export const COUNTER_DEPTH      = 24;

export const horizPartition: WallElevation = {
  id: "east" as WallId,
  name: "Kitchen / Bath Partition (horizontal)",
  totalLengthInches: 81.5,
  wallHeightInches: 96,
  studSpacingOC: 16,
  sections: [{ lengthInches: 81.5 }],
  openings: [],
};

export const vertPartition: WallElevation = {
  id: "west" as WallId,
  name: "Bathroom Door Wall",
  totalLengthInches: 50,
  wallHeightInches: 96,
  studSpacingOC: 16,
  sections: [
    { lengthInches: 28, label: "28\" door RO" },
    { lengthInches: 22, label: "22\"" },
  ],
  openings: [{ type: "door", widthInches: 28, heightInches: 80, positionFromLeftInches: 0 }],
};

// ═══ STAIR PARAMETERS ═══════════════════════════════════════════════

export const STAIR_TOTAL_RISERS = 15;
export const STAIR_TREAD_DEPTH  = 10;
export const STAIR_LAND_RISERS  = 3;
export const STAIR_WIDTH        = 36;
export const STAIR_RISE_TOT     = 21.75;
export const STAIR_APPR_STEPS   = 2;
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

// ═══ TJI FLOOR JOIST SYSTEM (main floor) ════════════════════════════

export const TJI_DEPTH    = 11.875;
export const TJI_FLANGE_H = 1.5;
export const TJI_WEB_W    = 0.75;
export const TJI_RIM_T    = 1.5;
export const TJI_OC       = 16;
export const SUBFLOOR_T   = 0.75;

// ═══ BATHROOM RAISED FLOOR ══════════════════════════════════════════

export const BATH_JOIST_H    = 5.5;
export const BATH_JOIST_OC   = 16;
export const BATH_CLEAT_H    = 3.5;
export const BATH_SUBFLOOR_T = 0.75;
export const BATH_LEDGER_T   = 1.5;

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
  north: {
    id: "north",
    name: "North Wall",
    totalLengthInches: 286,
    wallHeightInches: 96,
    studSpacingOC: 16,
    sections: [
      { lengthInches: 127, label: "127\" (west of door)" },
      { lengthInches: 39,  label: "39\" door RO" },
      { lengthInches: 120, label: "120\" (east of door)" },
    ],
    openings: [
      {
        type: "door",
        widthInches: 39,
        heightInches: 80,
        positionFromLeftInches: 127,
        label: "3'-3\" × 6'-8\"",
      },
    ],
    studOverrides: {
      "north-stud-12": { dx: 1.5 },
    },
  },

  south: {
    id: "south",
    name: "South Wall",
    totalLengthInches: 286,
    wallHeightInches: 96,
    studSpacingOC: 16,
    sections: [
      { lengthInches: 151, label: "151\" (east of window)" },
      { lengthInches: 40,  label: "40\" window RO (2.5 blocks)" },
      { lengthInches: 95,  label: "95\" (west of window)" },
    ],
    openings: [
      {
        type: "window",
        widthInches: 40,
        heightInches: 48,
        sillHeightInches: 36,
        positionFromLeftInches: 151,
        label: "3'-4\" × 4'",
      },
    ],
  },

  east: {
    id: "east",
    name: "East Wall",
    totalLengthInches: 166,
    wallHeightInches: 96,
    studSpacingOC: 16,
    sections: [
      { lengthInches: 40, label: "40\" / 2.5 bays" },
      { lengthInches: 79, label: "79\" sliding door RO" },
      { lengthInches: 47, label: "47\" / right section" },
    ],
    openings: [
      {
        type: "door",
        widthInches: 79,
        heightInches: 80,
        positionFromLeftInches: 40,
        label: "6'7\" × 6'-8\"",
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
      { lengthInches: 72, label: "72\" / 4.5 bays" },
      { lengthInches: 72, label: "72\" window RO" },
      { lengthInches: 22, label: "22\" / right section" },
    ],
    openings: [
      {
        type: "window",
        widthInches: 72,
        heightInches: 48,
        sillHeightInches: 36,
        positionFromLeftInches: 72,
        label: "6' × 4'",
      },
    ],
  },
};
