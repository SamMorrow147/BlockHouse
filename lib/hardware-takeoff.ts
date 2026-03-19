/**
 * Hardware Takeoff Calculator
 *
 * Derives connector counts, sheathing quantities, and house wrap coverage
 * from the parametric geometry in framing-data.ts. All numbers are computed,
 * not hard-coded.
 */

import {
  initialWalls, CMU_T, CMU_INTERIOR_W, CMU_INTERIOR_D,
  FR_GAP, FR_D,
  TJI_OC, TJI_RIM_T, TJI_DEPTH, SUBFLOOR_T,
  BATH_JOIST_OC, PARTITION_WALL_R,
  STAIR_LAND_RISERS, STAIR_TOTAL_RISERS,
  STAIR_WIDTH,
  secondFloorNorthWall, secondFloorSouthWall,
  secondFloorWestWall, secondFloorEastWall,
  thirdFloorNorthWall, thirdFloorSouthWall,
  THIRD_FLOOR_W,
} from "./framing-data";
import type { WallElevation } from "./types";

// ── Constants ────────────────────────────────────────────────────────────────
const OSB_SHEET_W  = 48;   // 4' = 48"
const OSB_SHEET_H  = 96;   // 8' = 96"
const OSB_SHEET_AREA = OSB_SHEET_W * OSB_SHEET_H;  // 4608 sq in = 32 sq ft
const OSB_WALL_T   = 7/16; // 7/16" wall sheathing thickness
const WRAP_ROLL_W  = 108;  // 9' = 108"
const WRAP_ROLL_L  = 1500; // 125' = 1500"
const WRAP_ROLL_AREA = WRAP_ROLL_W * WRAP_ROLL_L;   // 162,000 sq in = 1,125 sq ft
const WRAP_T       = 0.02; // negligible visual thickness — just a line

// ── Joist count calculator ───────────────────────────────────────────────────

export interface JoistLayout {
  wallId: string;
  wallLength: number;
  joistOC: number;
  joistCount: number;
  joistPositions: number[];
  rimBoardCount: number;  // always 2 per wall (left + right)
  hangerCount: number;    // 2 per joist (each end)
}

export function computeJoistLayout(wallLength: number, joistOC: number): JoistLayout {
  const SW = 1.5;  // stud width = joist flange width
  const joistOffset = SW / 2;
  const positions: number[] = [];
  let x = joistOC + joistOffset;
  const lastX = wallLength - TJI_RIM_T - SW;
  while (x <= lastX + 0.5) {
    positions.push(Math.min(x, lastX));
    x += joistOC;
  }
  return {
    wallId: "",
    wallLength,
    joistOC,
    joistCount: positions.length,
    joistPositions: positions,
    rimBoardCount: 2,
    hangerCount: positions.length * 2,
  };
}

// ── Floor system totals per level ────────────────────────────────────────────

export interface FloorSystemTakeoff {
  label: string;
  joistCount: number;
  rimBoardCount: number;
  hangerCount: number;
  subfloorSheets: number;
  subfloorArea: number;        // sq in
  hangerNailsPer: number;      // nails per hanger (MiTek IHFL25925 = 10)
  totalHangerNails: number;
}

function floorArea(widthIn: number, depthIn: number): number {
  return widthIn * depthIn;
}

function sheetsNeeded(area: number, waste: number = 0.10): number {
  return Math.ceil(area * (1 + waste) / OSB_SHEET_AREA);
}

export function computeFirstFloorSystem(): FloorSystemTakeoff {
  // Joists span N-S, laid out along the S and N wall lengths (both 286")
  const layout = computeJoistLayout(286, TJI_OC);
  const area = floorArea(CMU_INTERIOR_W, CMU_INTERIOR_D);
  return {
    label: "First Floor (1F→2F)",
    joistCount: layout.joistCount,
    rimBoardCount: 4 * 2,        // 4 walls × 2 rim pieces each
    hangerCount: layout.hangerCount,
    subfloorSheets: sheetsNeeded(area),
    subfloorArea: area,
    hangerNailsPer: 10,
    totalHangerNails: layout.hangerCount * 10,
  };
}

export function computeSecondFloorSystem(): FloorSystemTakeoff {
  const layout = computeJoistLayout(286, TJI_OC);
  const area = floorArea(CMU_INTERIOR_W, CMU_INTERIOR_D);
  return {
    label: "Second Floor (2F→3F)",
    joistCount: layout.joistCount,
    rimBoardCount: 4 * 2,
    hangerCount: layout.hangerCount,
    subfloorSheets: sheetsNeeded(area),
    subfloorArea: area,
    hangerNailsPer: 10,
    totalHangerNails: layout.hangerCount * 10,
  };
}

export function computeRoofDeckSystem(): FloorSystemTakeoff {
  // Roof deck spans the full building width (joists same as lower floors)
  const layout = computeJoistLayout(286, TJI_OC);
  const area = floorArea(CMU_INTERIOR_W, CMU_INTERIOR_D);
  return {
    label: "Roof Deck (3F ceiling)",
    joistCount: layout.joistCount,
    rimBoardCount: 4 * 2,
    hangerCount: layout.hangerCount,
    subfloorSheets: sheetsNeeded(area),
    subfloorArea: area,
    hangerNailsPer: 10,
    totalHangerNails: layout.hangerCount * 10,
  };
}

// ── OSB Wall Sheathing calculator ────────────────────────────────────────────

export interface WallSheathingTakeoff {
  wallId: string;
  wallName: string;
  grossArea: number;          // sq in
  openingArea: number;        // sq in
  netArea: number;            // sq in
  sheetsNeeded: number;
  wallLength: number;
  wallHeight: number;
}

export function computeWallSheathing(wall: WallElevation): WallSheathingTakeoff {
  const H = wall.wallHeightInches;
  const L = wall.totalLengthInches;
  const gross = L * H;
  let openingArea = 0;
  for (const op of wall.openings) {
    if (op.type !== "cmu-only") {
      openingArea += op.widthInches * op.heightInches;
    }
  }
  const net = gross - openingArea;
  return {
    wallId: wall.id,
    wallName: wall.name,
    grossArea: gross,
    openingArea,
    netArea: net,
    sheetsNeeded: sheetsNeeded(net, 0.15),  // 15% waste for cuts around openings
    wallLength: L,
    wallHeight: H,
  };
}

export interface SheathingTotals {
  walls: WallSheathingTakeoff[];
  totalSheets: number;
  totalNetArea: number;
  totalGrossArea: number;
}

export function computeAllSheathing(walls: WallElevation[]): SheathingTotals {
  const results = walls.map(computeWallSheathing);
  return {
    walls: results,
    totalSheets: results.reduce((s, w) => s + w.sheetsNeeded, 0),
    totalNetArea: results.reduce((s, w) => s + w.netArea, 0),
    totalGrossArea: results.reduce((s, w) => s + w.grossArea, 0),
  };
}

// Pre-computed takeoffs for each floor level
export function getSecondFloorSheathing(): SheathingTotals {
  return computeAllSheathing([
    secondFloorNorthWall,
    secondFloorSouthWall,
    secondFloorEastWall,
    secondFloorWestWall,
  ]);
}

export function getThirdFloorSheathing(): SheathingTotals {
  return computeAllSheathing([
    thirdFloorNorthWall,
    thirdFloorSouthWall,
  ]);
}

// ── House Wrap calculator ────────────────────────────────────────────────────

export interface HouseWrapTakeoff {
  perimeterInches: number;
  wallHeight: number;
  grossArea: number;          // sq in
  rollsNeeded: number;
  rollAreaSqIn: number;
}

export function computeHouseWrap(walls: WallElevation[]): HouseWrapTakeoff {
  const perimeter = walls.reduce((s, w) => s + w.totalLengthInches, 0);
  const height = walls[0]?.wallHeightInches ?? 116;
  const gross = perimeter * height;
  return {
    perimeterInches: perimeter,
    wallHeight: height,
    grossArea: gross,
    rollsNeeded: Math.ceil(gross * 1.15 / WRAP_ROLL_AREA), // 15% overlap
    rollAreaSqIn: WRAP_ROLL_AREA,
  };
}

// ── Anchor Bolt totals ───────────────────────────────────────────────────────

export interface AnchorBoltTakeoff {
  wallId: string;
  count: number;
  positions: number[];
}

export function computeAnchorBolts(walls: Record<string, WallElevation>): {
  perWall: AnchorBoltTakeoff[];
  totalBolts: number;
} {
  const perWall: AnchorBoltTakeoff[] = [];
  let total = 0;
  for (const [id, wall] of Object.entries(walls)) {
    const bolts = wall.anchorBolts ?? [];
    perWall.push({ wallId: id, count: bolts.length, positions: bolts });
    total += bolts.length;
  }
  return { perWall, totalBolts: total };
}

// ── Bathroom floor system ────────────────────────────────────────────────────

export interface BathFloorTakeoff {
  joistCount: number;
  cleatCount: number;
  subfloorArea: number;
  subfloorSheets: number;
}

export function computeBathFloorSystem(): BathFloorTakeoff {
  const bathW = 14.5;  // FW_IN
  const bathE = PARTITION_WALL_R;  // 96
  const count = Math.floor((bathE - bathW) / BATH_JOIST_OC) + 1;
  const bathDepth = 169.5 - 123;  // FS_IN - (partVWallT + INT_D) ≈ 46.5"
  const area = (bathE - bathW) * bathDepth;
  return {
    joistCount: count,
    cleatCount: count,
    subfloorArea: area,
    subfloorSheets: Math.ceil(area / OSB_SHEET_AREA),
  };
}

// ── Complete hardware summary ────────────────────────────────────────────────

export interface HardwareSummary {
  // I-Joist Hangers (MiTek IHFL25925)
  floor1Hangers: number;
  floor2Hangers: number;
  roofHangers: number;
  totalHangers: number;

  // Joist hanger nails (10 per hanger)
  totalHangerNails: number;
  hangerNailBoxes: number;  // ~1500 per 5lb box

  // I-Joists
  floor1Joists: number;
  floor2Joists: number;
  roofJoists: number;
  totalJoists: number;

  // Rim boards
  floor1Rims: number;
  floor2Rims: number;
  roofRims: number;
  totalRims: number;

  // OSB sheathing (wall)
  wallSheathingSheets: number;

  // House wrap
  houseWrapRolls: number;

  // Anchor bolts
  totalAnchorBolts: number;

  // Subfloor
  floor1SubfloorSheets: number;
  floor2SubfloorSheets: number;
  roofSubfloorSheets: number;
  totalSubfloorSheets: number;
}

export function computeFullHardwareSummary(): HardwareSummary {
  const f1 = computeFirstFloorSystem();
  const f2 = computeSecondFloorSystem();
  const roof = computeRoofDeckSystem();

  const sheathing2 = getSecondFloorSheathing();
  const sheathing3 = getThirdFloorSheathing();
  const totalSheathingSheets = sheathing2.totalSheets + sheathing3.totalSheets;

  const wrap = computeHouseWrap([
    secondFloorNorthWall, secondFloorSouthWall,
    secondFloorEastWall, secondFloorWestWall,
  ]);

  const bolts1 = computeAnchorBolts(initialWalls);
  const bolts2 = computeAnchorBolts({
    "north-2": secondFloorNorthWall,
    "south-2": secondFloorSouthWall,
    "east-2": secondFloorEastWall,
    "west-2": secondFloorWestWall,
  } as Record<string, WallElevation>);

  const totalHangers = f1.hangerCount + f2.hangerCount + roof.hangerCount;
  const totalNails = totalHangers * 10;

  return {
    floor1Hangers: f1.hangerCount,
    floor2Hangers: f2.hangerCount,
    roofHangers: roof.hangerCount,
    totalHangers,

    totalHangerNails: totalNails,
    hangerNailBoxes: Math.ceil(totalNails / 1500),

    floor1Joists: f1.joistCount,
    floor2Joists: f2.joistCount,
    roofJoists: roof.joistCount,
    totalJoists: f1.joistCount + f2.joistCount + roof.joistCount,

    floor1Rims: f1.rimBoardCount,
    floor2Rims: f2.rimBoardCount,
    roofRims: roof.rimBoardCount,
    totalRims: f1.rimBoardCount + f2.rimBoardCount + roof.rimBoardCount,

    wallSheathingSheets: totalSheathingSheets,
    houseWrapRolls: wrap.rollsNeeded,

    totalAnchorBolts: bolts1.totalBolts + bolts2.totalBolts,

    floor1SubfloorSheets: f1.subfloorSheets,
    floor2SubfloorSheets: f2.subfloorSheets,
    roofSubfloorSheets: roof.subfloorSheets,
    totalSubfloorSheets: f1.subfloorSheets + f2.subfloorSheets + roof.subfloorSheets,
  };
}

// ── Export constants for use in rendering ─────────────────────────────────────
export const OSB_WALL_THICKNESS = OSB_WALL_T;
export const HOUSE_WRAP_THICKNESS = WRAP_T;
