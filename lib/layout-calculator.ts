import type { WallElevation } from "./types";

const SW = 1.5;          // stud face width — 2×6 actual = 1.5" (depth = 5.5", not shown in elevation)
const PLATE_H = 1.5;     // single bottom plate
const TOP_H = 3.0;       // double top plate (two 1.5" plates)
const HEADER_D = 5.5;    // doubled 2×6 header — two 2×6s on edge, side by side (actual depth = 5.5")

export interface Rect {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface WallLayout {
  bottomPlates: Rect[];
  topPlates: Rect[];
  headers: Rect[];   // doubled headers — rendered as two stacked pieces
  sills: Rect[];     // rough sill plates (single piece, windows only)
  studs: Rect[];
  openings: Rect[];
  wallHeightInches: number;
  totalLengthInches: number;
}

export function computeWallLayout(wall: WallElevation): WallLayout {
  const wId = wall.id;
  const W   = wall.totalLengthInches;
  const H   = wall.wallHeightInches;
  const OC  = wall.studSpacingOC;

  const STUD_BASE = PLATE_H;              // studs sit on bottom plate
  const STUD_H    = H - PLATE_H - TOP_H; // full-height stud (e.g. 91.5")

  let studIdx  = 0;
  let plateIdx = 0;
  let headerIdx = 0;
  let sillIdx   = 0;
  let openIdx   = 0;

  const layout: WallLayout = {
    bottomPlates: [],
    sills: [],
    topPlates: [
      { id: `${wId}-tp-0`, label: "Top Plate (lower)", x: 0, y: H - TOP_H,       width: W, height: TOP_H / 2 },
      { id: `${wId}-tp-1`, label: "Top Plate (upper)", x: 0, y: H - TOP_H / 2,   width: W, height: TOP_H / 2 },
    ],
    headers: [],
    studs:   [],
    openings: [],
    wallHeightInches:   H,
    totalLengthInches:  W,
  };

  const pushFull = (x: number, label: string) => {
    layout.studs.push({ id: `${wId}-stud-${studIdx++}`, label, x, y: STUD_BASE, width: SW, height: STUD_H });
  };

  const pushPartial = (x: number, yBase: number, h: number, label: string) => {
    layout.studs.push({ id: `${wId}-stud-${studIdx++}`, label, x, y: yBase, width: SW, height: h });
  };

  const fillGap = (gapStart: number, gapEnd: number) => {
    let x = gapStart;
    while (x <= gapEnd - SW - OC / 2) {
      pushFull(x, "Stud");
      x += OC;
    }
  };

  // ── bottom plates ────────────────────────────────────────────────────────

  const sorted = [...wall.openings].sort(
    (a, b) => a.positionFromLeftInches - b.positionFromLeftInches
  );

  const doorAtFloor = sorted.find(
    (o) => o.type === "door" && !o.sillHeightInches
  );

  if (doorAtFloor) {
    const oLeft  = doorAtFloor.positionFromLeftInches;
    const oRight = oLeft + doorAtFloor.widthInches;
    const dl = oLeft  + SW;
    const dr = oRight - SW;
    if (dl > 0)  layout.bottomPlates.push({ id: `${wId}-bp-${plateIdx++}`, label: "Bottom Plate (left)", x: 0,  y: 0, width: dl,     height: PLATE_H });
    if (dr < W)  layout.bottomPlates.push({ id: `${wId}-bp-${plateIdx++}`, label: "Bottom Plate (right)", x: dr, y: 0, width: W - dr, height: PLATE_H });
  } else {
    layout.bottomPlates.push({ id: `${wId}-bp-${plateIdx++}`, label: "Bottom Plate", x: 0, y: 0, width: W, height: PLATE_H });
  }

  let cursor = 0;

  for (const op of sorted) {
    const oLeft   = op.positionFromLeftInches;
    const oRight  = oLeft + op.widthInches;
    const oBottom = op.sillHeightInches ?? 0;
    const oTop    = oBottom + op.heightInches;

    fillGap(cursor, oLeft);

    // left king
    pushFull(oLeft, "King Stud (left)");

    if (op.type === "door" && !op.sillHeightInches) {
      pushPartial(oLeft + SW,       0, oTop, "Jack Stud (left)");
      pushPartial(oRight - 2 * SW,  0, oTop, "Jack Stud (right)");
    } else {
      const jackH = op.heightInches;
      pushPartial(oLeft + SW,       oBottom, jackH, "Jack Stud (left)");
      pushPartial(oRight - 2 * SW,  oBottom, jackH, "Jack Stud (right)");

      const belowH = oBottom - STUD_BASE;
      if (belowH > 0.01) {
        const leftJackX  = oLeft  + SW;
        const rightJackX = oRight - 2 * SW;
        let cx = leftJackX;
        while (cx + SW <= rightJackX + 0.01) {
          pushPartial(cx, STUD_BASE, belowH, "Cripple (below sill)");
          cx += OC;
        }
        const lastPlaced = cx - OC;
        if (rightJackX - lastPlaced > SW + 0.5) {
          pushPartial(rightJackX, STUD_BASE, belowH, "Cripple (below sill)");
        }
      }

      layout.sills.push({ id: `${wId}-sill-${sillIdx++}`, label: "Sill Plate", x: oLeft + SW, y: oBottom, width: oRight - oLeft - 2 * SW, height: SW });
    }

    // right king
    pushFull(oRight - SW, "King Stud (right)");

    layout.headers.push({
      id: `${wId}-hdr-${headerIdx++}`, label: "Header",
      x: oLeft + SW, y: oTop,
      width: oRight - oLeft - 2 * SW, height: HEADER_D,
    });

    layout.openings.push({
      id: `${wId}-open-${openIdx++}`, label: `${op.type === "door" ? "Door" : "Window"} Opening`,
      x: oLeft + SW, y: oBottom,
      width: oRight - oLeft - 2 * SW, height: op.heightInches,
    });

    const crippleY = oTop + HEADER_D;
    const crippleH = H - TOP_H - crippleY;
    if (crippleH > 0.01) {
      let cx = Math.ceil(oLeft / OC) * OC;
      while (cx + SW <= oRight + 0.01) {
        layout.studs.push({ id: `${wId}-stud-${studIdx++}`, label: "Cripple (above header)", x: cx, y: crippleY, width: SW, height: crippleH });
        cx += OC;
      }
    }

    cursor = oRight;
  }

  const endKingX  = W - SW;
  const startX    = sorted.length > 0
    ? Math.ceil(cursor / OC) * OC
    : cursor;
  fillGap(startX, endKingX);

  pushFull(endKingX, "King Stud (end)");

  return layout;
}
