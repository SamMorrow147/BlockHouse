import type { WallElevation, HeaderSpec } from "./types";

export const SW = 1.5;          // stud face width — 2×6 actual = 1.5" (depth = 5.5", not shown in elevation)
export const PLATE_H = 1.5;     // single bottom plate
export const TOP_H = 3.0;       // double top plate (two 1.5" plates)
export const HEADER_D = 5.5;    // doubled 2×6 header — two 2×6s on edge, side by side (actual depth = 5.5")
const MAX_PLATE_LENGTH_IN = 192; // 16' — max single piece for standard lumber; longer runs get spliced

export interface Rect {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface HeaderRect extends Rect {
  headerSpec?: HeaderSpec;
}

export interface WallLayout {
  bottomPlates: Rect[];
  topPlates: Rect[];
  headers: HeaderRect[];
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
    topPlates: [],
    headers: [],
    studs:   [],
    openings: [],
    wallHeightInches:   H,
    totalLengthInches:  W,
  };

  // Top plates (with splice when W > 16'; upper course staggered)
  const pushTopPlateRects = (course: 0 | 1) => {
    const y = course === 0 ? H - TOP_H : H - TOP_H / 2;
    const h = TOP_H / 2;
    const prefix = course === 0 ? "Top Plate (lower)" : "Top Plate (upper)";
    if (W <= MAX_PLATE_LENGTH_IN) {
      layout.topPlates.push({ id: `${wId}-tp-${course}`, label: prefix, x: 0, y, width: W, height: h });
      return;
    }
    if (course === 0) {
      layout.topPlates.push({ id: `${wId}-tp-0-1`, label: `${prefix} #1`, x: 0, y, width: MAX_PLATE_LENGTH_IN, height: h });
      layout.topPlates.push({ id: `${wId}-tp-0-2`, label: `${prefix} #2`, x: MAX_PLATE_LENGTH_IN, y, width: W - MAX_PLATE_LENGTH_IN, height: h });
    } else {
      // Stagger: upper splice only at 96", so no splice at 192" (lower's splice). Upper second piece = 96" to W (< 192").
      const off = OC * 6; // 96"
      layout.topPlates.push({ id: `${wId}-tp-1-1`, label: `${prefix} #1`, x: 0, y, width: off, height: h });
      layout.topPlates.push({ id: `${wId}-tp-1-2`, label: `${prefix} #2`, x: off, y, width: W - off, height: h });
    }
  };
  pushTopPlateRects(0);
  pushTopPlateRects(1);

  const STUD_LABEL = "2×6 Stud";
  const pushFull = (x: number, label: string) => {
    layout.studs.push({ id: `${wId}-stud-${studIdx++}`, label, x, y: STUD_BASE, width: SW, height: STUD_H });
  };

  const pushPartial = (x: number, yBase: number, h: number, label: string) => {
    layout.studs.push({ id: `${wId}-stud-${studIdx++}`, label, x, y: yBase, width: SW, height: h });
  };

  const fillGap = (gapStart: number, gapEnd: number) => {
    let x = gapStart;
    while (x <= gapEnd - SW - OC / 3) {
      pushFull(x, STUD_LABEL);
      x += OC;
    }
  };

  const pushBottomPlateSegment = (x: number, width: number, labelPrefix: string) => {
    if (width <= 0) return;
    if (width <= MAX_PLATE_LENGTH_IN) {
      layout.bottomPlates.push({ id: `${wId}-bp-${plateIdx++}`, label: labelPrefix, x, y: 0, width, height: PLATE_H });
      return;
    }
    let curX = x;
    let remain = width;
    let seg = 1;
    while (remain > MAX_PLATE_LENGTH_IN) {
      layout.bottomPlates.push({ id: `${wId}-bp-${plateIdx++}`, label: `${labelPrefix} #${seg}`, x: curX, y: 0, width: MAX_PLATE_LENGTH_IN, height: PLATE_H });
      curX += MAX_PLATE_LENGTH_IN;
      remain -= MAX_PLATE_LENGTH_IN;
      seg++;
    }
    if (remain > 0.01) {
      layout.bottomPlates.push({ id: `${wId}-bp-${plateIdx++}`, label: `${labelPrefix} #${seg}`, x: curX, y: 0, width: remain, height: PLATE_H });
    }
  };

  // ── bottom plates ────────────────────────────────────────────────────────

  // "cmu-only" openings are voids in the CMU layer only — skip in frame layout
  const sorted = [...wall.openings]
    .filter(o => o.type !== "cmu-only")
    .sort((a, b) => a.positionFromLeftInches - b.positionFromLeftInches);

  const doorAtFloor = sorted.find(
    (o) => o.type === "door" && !o.sillHeightInches
  );

  if (doorAtFloor) {
    const oLeft  = doorAtFloor.positionFromLeftInches;
    const oRight = oLeft + doorAtFloor.widthInches;
    const dl = oLeft  + SW;
    const dr = oRight - SW;
    if (dl > 0)  pushBottomPlateSegment(0, dl, "Bottom Plate (left)");
    if (dr < W)  pushBottomPlateSegment(dr, W - dr, "Bottom Plate (right)");
  } else {
    pushBottomPlateSegment(0, W, "Bottom Plate");
  }

  let cursor = 0;

  for (const op of sorted) {
    const oLeft   = op.positionFromLeftInches;
    const oRight  = oLeft + op.widthInches;
    const oBottom = op.sillHeightInches ?? 0;
    const oTop    = oBottom + op.heightInches;
    const jc = op.jackCount ?? 1;

    fillGap(cursor, oLeft);

    // left king
    pushFull(oLeft, "2×6 King Stud (left)");

    if (op.type === "door" && !op.sillHeightInches) {
      for (let j = 0; j < jc; j++) {
        const lbl = jc > 1 ? ` #${j + 1}` : "";
        pushPartial(oLeft + (1 + j) * SW,  0, oTop, `2×6 Jack Stud (left${lbl})`);
        pushPartial(oRight - (2 + j) * SW, 0, oTop, `2×6 Jack Stud (right${lbl})`);
      }
    } else {
      const jackH = op.heightInches;
      for (let j = 0; j < jc; j++) {
        const lbl = jc > 1 ? ` #${j + 1}` : "";
        pushPartial(oLeft + (1 + j) * SW,  oBottom, jackH, `2×6 Jack Stud (left${lbl})`);
        pushPartial(oRight - (2 + j) * SW, oBottom, jackH, `2×6 Jack Stud (right${lbl})`);
      }

      const belowH = oBottom - STUD_BASE;
      if (belowH > 0.01) {
        const crippleXs: number[] = [];

        for (let j = 0; j < jc; j++) {
          crippleXs.push(oLeft + (1 + j) * SW);
          crippleXs.push(oRight - (2 + j) * SW);
        }

        const leftCripX  = oLeft  + SW;
        const rightCripX = oRight - 2 * SW;
        let fcx = leftCripX;
        while (fcx + SW <= rightCripX + 0.01) {
          crippleXs.push(fcx);
          fcx += OC;
        }
        const lastField = fcx - OC;
        if (rightCripX - lastField > SW + 0.5) {
          crippleXs.push(rightCripX);
        }

        crippleXs.sort((a, b) => a - b);
        const unique: number[] = [];
        for (const x of crippleXs) {
          if (unique.length === 0 || x - unique[unique.length - 1] > 0.1) {
            unique.push(x);
          }
        }

        for (const x of unique) {
          pushPartial(x, STUD_BASE, belowH, "Cripple (below sill)");
        }
      }

      layout.sills.push({ id: `${wId}-sill-${sillIdx++}`, label: "Sill Plate", x: oLeft + SW, y: oBottom, width: oRight - oLeft - 2 * SW, height: SW });
    }

    // right king
    pushFull(oRight - SW, "2×6 King Stud (right)");

    const hDepth = op.headerSpec?.depth ?? HEADER_D;

    layout.headers.push({
      id: `${wId}-hdr-${headerIdx++}`,
      label: op.headerSpec?.label ?? "Header",
      x: oLeft + SW, y: oTop,
      width: oRight - oLeft - 2 * SW, height: hDepth,
      headerSpec: op.headerSpec,
    });

    layout.openings.push({
      id: `${wId}-open-${openIdx++}`, label: `${op.type === "door" ? "Door" : "Window"} Opening`,
      x: oLeft + SW, y: oBottom,
      width: oRight - oLeft - 2 * SW, height: op.heightInches,
    });

    const crippleY = oTop + hDepth;
    const crippleH = H - TOP_H - crippleY;
    if (crippleH > 0.01) {
      let cx = Math.ceil(oLeft / OC) * OC;
      while (cx + SW <= oRight + 0.01) {
        layout.studs.push({ id: `${wId}-stud-${studIdx++}`, label: "2×6 Cripple (above header)", x: cx, y: crippleY, width: SW, height: crippleH });
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

  pushFull(endKingX, "2×6 King Stud (end)");

  if (wall.studOverrides) {
    for (const s of layout.studs) {
      const ov = wall.studOverrides[s.id];
      if (ov) {
        if (ov.dx) s.x += ov.dx;
        if (ov.dy) s.y += ov.dy;
      }
    }
  }

  return layout;
}
