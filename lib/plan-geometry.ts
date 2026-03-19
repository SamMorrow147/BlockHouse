import {
  CMU_T, CMU_INTERIOR_W, CMU_INTERIOR_D,
  FR_GAP, FR_D,
  initialWalls,
} from "./framing-data";
import type { WallId } from "./types";

// ═══ CMU EXTERIOR DIMENSIONS ═══════════════════════════════════════════
export const CMU_W = CMU_INTERIOR_W + 2 * CMU_T;   // 304"
export const CMU_D = CMU_INTERIOR_D + 2 * CMU_T;   // 184"

// ═══ CMU INTERIOR FACE POSITIONS (inches from CMU exterior NW corner) ══
export const CI_L = CMU_T;            //   8"  west CMU interior face
export const CI_R = CMU_W - CMU_T;    // 296"  east CMU interior face
export const CI_N = CMU_T;            //   8"  north CMU interior face
export const CI_S = CMU_D - CMU_T;    // 176"  south CMU interior face

// ═══ FRAME FACE POSITIONS ══════════════════════════════════════════════
// "outer" = face toward CMU   "inner" = face toward room
export const FN_OUT = CI_N + FR_GAP;           //  9"
export const FN_IN  = CI_N + FR_GAP + FR_D;    // 14.5"
export const FS_IN  = CI_S - FR_GAP - FR_D;    // 169.5"
export const FS_OUT = CI_S - FR_GAP;           // 175"
export const FW_OUT = CI_L + FR_GAP;           //  9"
export const FW_IN  = CI_L + FR_GAP + FR_D;    // 14.5"
export const FE_IN  = CI_R - FR_GAP - FR_D;    // 289.5"
export const FE_OUT = CI_R - FR_GAP;           // 295"

// ═══ ELEVATION ↔ PLAN COORDINATE TRANSFORMS ═══════════════════════════
// N/S walls: elevation X maps to plan X.  E/W walls: elevation X maps to plan Y.
// South & West: no mirror (elevation left matches plan direction).
// North & East: mirrored (elevation left is opposite plan direction).
// For north & east the transform is self-inverse: f(f(x)) = x.

export function elevationXToPlanPos(wallId: WallId, elevX: number): number {
  switch (wallId) {
    case "south": return FW_OUT + elevX;
    case "north": return FW_OUT + initialWalls.north.totalLengthInches - elevX;
    case "east":  return FS_OUT - elevX;
    case "west":  return FN_OUT + elevX;
    case "north-2":
    case "horiz-partition":
    case "vert-partition":
      throw new Error(`elevationXToPlanPos not defined for partition: ${wallId}`);
  }
}

export function planPosToElevationX(wallId: WallId, planPos: number): number {
  switch (wallId) {
    case "south": return planPos - FW_OUT;
    case "north": return FW_OUT + initialWalls.north.totalLengthInches - planPos;
    case "east":  return FS_OUT - planPos;
    case "west":  return planPos - FN_OUT;
    case "north-2":
    case "horiz-partition":
    case "vert-partition":
      throw new Error(`planPosToElevationX not defined for partition: ${wallId}`);
  }
}

// ═══ OPENING PLAN-SPACE COORDINATES ════════════════════════════════════

const sOp  = initialWalls.south.openings[0];
export const SD_L = elevationXToPlanPos("south", sOp.positionFromLeftInches);
export const SD_R = elevationXToPlanPos("south", sOp.positionFromLeftInches + sOp.widthInches);

const nOp  = initialWalls.north.openings[0];
export const NW_R = elevationXToPlanPos("north", nOp.positionFromLeftInches);
export const NW_L = elevationXToPlanPos("north", nOp.positionFromLeftInches + nOp.widthInches);

const eOp  = initialWalls.east.openings[0];
export const EW_B = elevationXToPlanPos("east", eOp.positionFromLeftInches);
export const EW_T = elevationXToPlanPos("east", eOp.positionFromLeftInches + eOp.widthInches);

const wOp  = initialWalls.west.openings[0];
export const WD_T = elevationXToPlanPos("west", wOp.positionFromLeftInches);
export const WD_B = elevationXToPlanPos("west", wOp.positionFromLeftInches + wOp.widthInches);
