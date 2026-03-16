

import React from "react";
import { initialWalls } from "@/lib/framing-data";
import { computeWallLayout } from "@/lib/layout-calculator";

// ── Scale & Wall Constants ──────────────────────────────────────────────────
const FP_PX   = 3;    // px per inch (floor plan is smaller than wall elevations)
const CMU_T   = 8;    // CMU wall thickness, inches (nominal 8" block incl. mortar)
const FR_GAP  = 1;    // air gap between CMU interior face and wood frame outer face
const FR_D    = 5.5;  // wood frame depth — 2×6 on flat (actual 5.5")

// ── SVG margin around plan drawing (px) ────────────────────────────────────
const AL = 140;  // left   (vertical dim + exterior counter overhang)
const AT = 52;   // top    (title + north-wall opening label)
const AR = 56;   // right  (east label)
const AB = 68;   // bottom (south dim + label)

// ── Helpers ────────────────────────────────────────────────────────────────
const pf = (n: number) => n * FP_PX;      // inches → plan-scale px
const fmt = (n: number) => {
  const ft = Math.floor(n / 12);
  const ins = Math.round((n % 12) * 4) / 4;
  if (ft === 0) return `${ins}"`;
  if (ins === 0) return `${ft}'-0"`;
  return `${ft}'-${ins}"`;
};

// ── CMU block module (matching elevation) ──────────────────────────────────
// One block = 16" long × CMU_T deep (8").  Single course in plan — no sub-row
// splitting.  Anchored at (0, 0) so joints align with the elevation block count.
const CMU_BL = 16;   // nominal block length, inches

// Helper: walk a range, split around voids, yield clipped rect elements.
function clipRects(
  keyPfx:  string,
  fixedA:  number,   // SVG fixed-axis start (x or y of band)
  fixedSz: number,   // SVG fixed-axis size  (band thickness in px)
  segFrom: number,   // var-axis start (SVG px)
  segTo:   number,   // var-axis end   (SVG px)
  voidsPx: { a: number; b: number }[],  // void spans in SVG px
  horiz:   boolean,  // true → rects are horizontal (N/S walls)
  ppf:     (n: number) => number,
): React.ReactElement[] {
  const rects: React.ReactElement[] = [];
  let cur = segFrom;
  const sorted = voidsPx.filter(v => v.a < segTo && v.b > segFrom)
    .sort((a, b) => a.a - b.a);
  const emit = (x1: number, x2: number, key: string) => {
    if (x2 <= x1) return;
    rects.push(horiz
      ? <rect key={key} className="fp-cmu-block"
          x={x1} y={fixedA} width={x2 - x1} height={fixedSz} />
      : <rect key={key} className="fp-cmu-block"
          x={fixedA} y={x1} width={fixedSz} height={x2 - x1} />
    );
  };
  for (const v of sorted) {
    emit(cur, v.a, `${keyPfx}v${v.a}`);
    cur = Math.max(cur, v.b);
  }
  emit(cur, segTo, `${keyPfx}end`);
  return rects;
}

// Horizontal wall band (North / South).
function hCMUBlocks(
  yBand: number, xFrom: number, xTo: number,
  voids: { l: number; r: number }[],
  ppx: (n: number) => number,
  ppy: (n: number) => number,
  ppf: (n: number) => number,
): React.ReactElement[] {
  const rects: React.ReactElement[] = [];
  const yPx  = ppy(yBand);
  const hPx  = ppf(CMU_T);
  const vPx  = voids.map(v => ({ a: ppx(v.l), b: ppx(v.r) }));
  // Anchor at x=0 — same joint phase as the elevation CMU
  let bx = Math.floor(xFrom / CMU_BL) * CMU_BL;
  while (bx < xTo) {
    const bL = Math.max(xFrom, bx);
    const bR = Math.min(xTo,   bx + CMU_BL);
    if (bR > bL) {
      rects.push(...clipRects(`hx${bx}`, yPx, hPx, ppx(bL), ppx(bR), vPx, true, ppf));
    }
    bx += CMU_BL;
  }
  return rects;
}

// Vertical wall band (East / West).
function vCMUBlocks(
  xBand: number, yFrom: number, yTo: number,
  voids: { t: number; b: number }[],
  ppx: (n: number) => number,
  ppy: (n: number) => number,
  ppf: (n: number) => number,
): React.ReactElement[] {
  const rects: React.ReactElement[] = [];
  const xPx  = ppx(xBand);
  const wPx  = ppf(CMU_T);
  const vPx  = voids.map(v => ({ a: ppy(v.t), b: ppy(v.b) }));
  let by = Math.floor(yFrom / CMU_BL) * CMU_BL;
  while (by < yTo) {
    const bT = Math.max(yFrom, by);
    const bB = Math.min(yTo,   by + CMU_BL);
    if (bB > bT) {
      rects.push(...clipRects(`vy${by}`, xPx, wPx, ppy(bT), ppy(bB), vPx, false, ppf));
    }
    by += CMU_BL;
  }
  return rects;
}

export function FloorPlan() {
  // CMU interior dimensions — fixed by block module, independent of frame wall lengths.
  // E/W frame walls = 166" (168" CMU depth − 2×1" gap).
  // N/S frame walls = 275" (288" CMU width  − 2×6.5" gap+depth).
  const W_INT = 288;   // CMU interior E-W span (19 blocks)
  const D_INT = 168;   // CMU interior N-S span (11.5 blocks)

  // CMU exterior bounding box
  const CMU_W = W_INT + 2 * CMU_T;   // 304"
  const CMU_D = D_INT + 2 * CMU_T;   // 184"

  // CMU interior face positions (inches from CMU exterior NW corner)
  const CI_L = CMU_T;            //   8"  west CMU interior face
  const CI_R = CMU_W - CMU_T;    // 296"  east CMU interior face
  const CI_N = CMU_T;            //   8"  north CMU interior face
  const CI_S = CMU_D - CMU_T;    // 176"  south CMU interior face

  // Wood frame face positions (each wall)
  // "outer" = face toward CMU   "inner" = face toward room
  const FN_OUT = CI_N + FR_GAP;           //  9"
  const FN_IN  = CI_N + FR_GAP + FR_D;    // 14.5"
  const FS_IN  = CI_S - FR_GAP - FR_D;    // 169.5"
  const FS_OUT = CI_S - FR_GAP;           // 175"
  const FW_OUT = CI_L + FR_GAP;           //  9"
  const FW_IN  = CI_L + FR_GAP + FR_D;    // 14.5"
  const FE_IN  = CI_R - FR_GAP - FR_D;    // 289.5"
  const FE_OUT = CI_R - FR_GAP;           // 295"

  // ── Openings in plan-space coordinates ────────────────────────────────
  // positionFromLeftInches is measured from the CMU interior face (CI_L / CI_R),
  // matching the elevation where the CMU starts 8" before the frame left.
  // e.g. 128" + 8" CMU offset = 136" = 8.5 CMU blocks from CMU exterior.
  const nOp  = initialWalls.north.openings[0];
  const ND_L = CI_L + nOp.positionFromLeftInches;   // 8 + 128 = 136" = 8.5 CMU blocks
  const ND_R = ND_L + nOp.widthInches;              // 136 + 39 = 175"

  const sOp  = initialWalls.south.openings[0];
  // South elevation is an interior view (left = East). Mirror to plan-space (left = West):
  // physicalFromWest = totalLength - positionFromLeftInches - widthInches = 275 - 154 - 30 = 91"
  const sPhysFromWest = initialWalls.south.totalLengthInches - sOp.positionFromLeftInches - sOp.widthInches;
  const SW_L = CI_L + sPhysFromWest;   // 8 + 91 = 99"
  const SW_R = SW_L + sOp.widthInches; // 99 + 30 = 129"

  // West wall: "left" = South. Wall starts at FS_OUT (1" from CMU S face) and ends at FN_OUT.
  const wOp  = initialWalls.west.openings[0];
  const WW_B = FS_OUT - wOp.positionFromLeftInches;  // 175 - 72 = 103" (south edge of window)
  const WW_T = WW_B - wOp.widthInches;                // 103 - 72 =  31" (north edge of window)

  // East wall: "left" = North. Wall starts at FN_OUT (1" from CMU N face) and ends at FS_OUT.
  const eOp  = initialWalls.east.openings[0];
  const ED_T = FN_OUT + eOp.positionFromLeftInches;  //  9 + 40 = 49"
  const ED_B = ED_T + eOp.widthInches;                //  49 + 79 = 128"

  // ── SVG coordinate helpers ────────────────────────────────────────────
  const px = (x: number) => AL + pf(x);
  const py = (y: number) => AT + pf(y);
  const svgW = AL + pf(CMU_W) + AR;
  const svgH = AT + pf(CMU_D) + AB;

  // Door swing parameters
  const DOOR_W = nOp.widthInches;   // 39" = radius of swing

  // ── Interior bathroom partition (2×4 walls, INT_D = 3.5" actual) ─────
  const INT_D  = 3.5;
  // Bathroom west wall: 72" from east inner face (mirrors canopy window's 72" from S end)
  const BTH_W  = wOp.positionFromLeftInches;   // 72"  — reuse canopy window position
  const BTH_X  = FE_IN - BTH_W;               // 289.5 - 72 = 217.5"  west face of bathroom
  // Partition y: aligned with south edge of canopy window (WW_B = 103")
  const BTH_Y  = WW_B;                         // 103"  north face of partition
  const INT_SW = 1.5;   // 2×4 stud width along wall (inches)

  // ── Horizontal partition — runs West wall → east end ───────────────────
  // FW_IN (14.5") → 96" (6 CMU blocks), 81.5" long
  // Stops 8" (half a block) before south window left jamb (SW_L = 104")
  const partWallL = FW_IN;
  const partWallR = 6 * CMU_BL;  // 96" = 6 CMU blocks from exterior
  const partStudXs: number[] = [];
  partStudXs.push(partWallL);
  for (let x = partWallL + 16; x < partWallR - INT_SW; x += 16) {
    partStudXs.push(x);
  }
  partStudXs.push(partWallR - INT_SW);                  // east end stud

  // ── Vertical partition — drops south from top of horizontal wall → south wall ──
  // x = partWallR (96") → partWallR + INT_D (99.5"), 3.5" wide (E-W)
  // y = top of horizontal wall (119.5") → FS_IN (169.5"), 50" tall
  // Overlaps horizontal wall in the corner zone (119.5"→123") forming a solid L-corner.
  const partVWallT = BTH_Y + 16.5;           // 119.5" — aligns with horiz. wall top face
  const partVWallB = FS_IN;                   // 169.5" — south wall inner face

  // ── Bathroom door in vertical partition ────────────────────────────────
  // 28" RO (standard min. bathroom door = 2'-4"), hinge at south jamb.
  // Swings WEST into bathroom; open leaf rests along the south wall.
  const BATH_DOOR_W = 28;
  const partVDoorT = partVWallB - BATH_DOOR_W;  // 141.5" — north (top) jamb of door

  // Studs ABOVE the door opening only (119.5" → 141.5")
  const partVStudYs: number[] = [];
  partVStudYs.push(partVWallT);               // north end stud (inside corner zone)
  for (let y = partVWallT + 16; y < partVDoorT - INT_SW; y += 16) {
    partVStudYs.push(y);                       // 16" OC field studs
  }
  partVStudYs.push(partVDoorT - INT_SW);      // king stud at door north jamb

  // ── Stud layouts (from same data as wall elevations) ─────────────────
  // North/South stud.x is measured from the West interior face.
  // West stud.x is measured from the South interior face ("left" = South from outside).
  // East stud.x is measured from the North interior face ("left" = North from outside).
  const nStuds = computeWallLayout(initialWalls.north).studs;
  const sStuds = computeWallLayout(initialWalls.south).studs;
  const wStuds = computeWallLayout(initialWalls.west).studs;
  const eStuds = computeWallLayout(initialWalls.east).studs;

  return (
    <svg
      viewBox={`0 0 ${svgW} ${svgH}`}
      width="100%"
      style={{ maxHeight: 700, display: "block" }}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <style>{`
          .fp-cmu       { fill: rgba(222,218,212,0.18); stroke: #111; stroke-width: 1.6px; stroke-linejoin: miter; }
          .fp-cmu-block { fill: none; stroke: #c8a800; stroke-width: 0.75px; }
          .fp-stud      { fill: #fff; stroke: #111; stroke-width: 0.8px; stroke-linecap: square; }
          .fp-int-wall  { fill: #e4e4e4; stroke: #222; stroke-width: 1px; stroke-linejoin: miter; }
          .fp-room      { fill: #f9f8f3; stroke: none; }
          .fp-frame     { fill: none; stroke: #111; stroke-width: 1px; stroke-linecap: square; }
          .fp-cmugap    { fill: none; stroke: #bbb; stroke-width: 0.5px; stroke-dasharray: 3 3; }
          .fp-door-leaf { fill: none; stroke: #222; stroke-width: 1px; }
          .fp-door-arc  { fill: none; stroke: #666; stroke-width: 0.8px; stroke-dasharray: 4 2; }
          .fp-win       { fill: none; stroke: #333; stroke-width: 0.8px; }
          .fp-dl        { fill: none; stroke: #1a55bb; stroke-width: 0.8px; }
          .fp-dt        { fill: #1a55bb; font-size: 10.5px; font-family: ui-monospace, monospace; text-anchor: middle; }
          .fp-wlbl      { fill: #555; font-size: 8.5px; font-family: ui-monospace, monospace;
                          text-anchor: middle; letter-spacing: 0.12em; }
          .fp-olbl      { fill: #333; font-size: 9px; font-family: ui-monospace, monospace; text-anchor: middle; }
          .fp-title     { fill: #111; font-size: 12px; font-family: ui-monospace, monospace; font-weight: 700; }
          .fp-sub       { fill: #666; font-size: 8.5px; font-family: ui-monospace, monospace; }
          .fp-narrow    { fill: #111; }
          .fp-counter   { fill: #e8dfc8; stroke: #555; stroke-width: 1px; }
          .fp-counter-ext { fill: #d8cfb0; stroke: #555; stroke-width: 1px; stroke-dasharray: 4 2; }
          .fp-counter-edge { fill: none; stroke: #333; stroke-width: 1.5px; }
          .fp-fridge    { fill: #d0dce8; stroke: #445; stroke-width: 1px; }
          .fp-fridge-handle { fill: none; stroke: #223; stroke-width: 1.5px; stroke-linecap: round; }
          .fp-sink-basin { fill: #c8dce8; stroke: #336; stroke-width: 0.8px; }
          .fp-sink-rim   { fill: none; stroke: #445; stroke-width: 1px; }
          .fp-sink-drain { fill: #aac; stroke: #336; stroke-width: 0.6px; }
          .fp-shower     { fill: #ddeef5; stroke: #336; stroke-width: 1px; }
          .fp-shower-curb { fill: none; stroke: #336; stroke-width: 1.5px; }
          .fp-shower-door { fill: none; stroke: #224; stroke-width: 1px; stroke-dasharray: 3 2; }
          .fp-toilet-tank { fill: #e0e8ee; stroke: #336; stroke-width: 1px; }
          .fp-toilet-bowl { fill: #e8f0f5; stroke: #336; stroke-width: 0.8px; }
          .fp-platform    { fill: #e8e4d8; stroke: #555; stroke-width: 1px; }
          .fp-raised-floor { fill: rgba(210,200,180,0.18); stroke: none; }
          .fp-ledger      { fill: none; stroke: #555; stroke-width: 2.5px; }
          .fp-joist-2x6   { fill: none; stroke: #888; stroke-width: 0.8px; }
          .fp-stair-run   { fill: #f0ece2; stroke: #555; stroke-width: 1px; }
          .fp-stair-tread { fill: none; stroke: #666; stroke-width: 0.7px; }
          .fp-stair-cut   { fill: none; stroke: #333; stroke-width: 1.2px; stroke-dasharray: 6 3; }
          .fp-up-arrow    { fill: none; stroke: #333; stroke-width: 1px; marker-end: url(#arrowhead); }
          .fp-fixture-lbl { fill: #666; font-size: 7.5px; font-family: ui-monospace, monospace; text-anchor: middle; }
        `}</style>
      <marker id="arrowhead" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
        <path d="M0,0 L0,6 L6,3 z" fill="#333" />
      </marker>
      </defs>

      {/* ── Title block ──────────────────────────────────────────────────── */}
      <text className="fp-title" x={AL} y={AT - 30}>01 — MAIN LEVEL FLOOR PLAN (INTERIOR FRAMING)</text>
      <text className="fp-sub" x={AL} y={AT - 16}>
        SCALE: 3px = 1&quot;  |  8&quot; CMU WALLS  |  2×6 WOOD FRAME 1&quot; OFF CMU  |  INTERIOR {W_INT}&quot; × {D_INT}&quot;
      </text>

      {/* ══ CMU WALLS ════════════════════════════════════════════════════════
          Strategy: draw full exterior as CMU color, then punch white for
          interior, then white for each opening, so hatching follows.         */}

      {/* CMU background fill (no stroke — outline drawn as segments below) */}
      <rect className="fp-cmu" style={{stroke:"none"}}
        x={px(0)} y={py(0)} width={pf(CMU_W)} height={pf(CMU_D)} />

      {/* CMU outer border — segments skipping openings */}
      {(() => {
        const s = "#111"; const sw = "1.6";
        const lp = (x1:number,y1:number,x2:number,y2:number,k:string) =>
          <line key={k} x1={px(x1)} y1={py(y1)} x2={px(x2)} y2={py(y2)}
            stroke={s} strokeWidth={sw} strokeLinecap="square" />;
        return <>
          {/* North outer edge — skip door (ND_L→ND_R) */}
          {lp(0, 0, ND_L, 0, "n1")}
          {lp(ND_R, 0, CMU_W, 0, "n2")}
          {/* South outer edge — skip window (SW_L→SW_R) */}
          {lp(0, CMU_D, SW_L, CMU_D, "s1")}
          {lp(SW_R, CMU_D, CMU_W, CMU_D, "s2")}
          {/* West outer edge — skip window (WW_T→WW_B) */}
          {lp(0, 0, 0, WW_T, "w1")}
          {lp(0, WW_B, 0, CMU_D, "w2")}
          {/* East outer edge — skip door (ED_T→ED_B) */}
          {lp(CMU_W, 0, CMU_W, ED_T, "e1")}
          {lp(CMU_W, ED_B, CMU_W, CMU_D, "e2")}
        </>;
      })()}

      {/* ── White at openings (before blocks) — clears gray so opening is
          visible, but block joints still draw on top in yellow              */}
      <rect fill="#fff" stroke="none"
        x={px(ND_L)} y={py(0)} width={pf(nOp.widthInches)} height={pf(CMU_T)} />
      <rect fill="#fff" stroke="none"
        x={px(SW_L)} y={py(CI_S)} width={pf(sOp.widthInches)} height={pf(CMU_T)} />
      <rect fill="#fff" stroke="none"
        x={px(0)} y={py(WW_T)} width={pf(CMU_T)} height={pf(wOp.widthInches)} />
      <rect fill="#fff" stroke="none"
        x={px(CI_R)} y={py(ED_T)} width={pf(CMU_T)} height={pf(eOp.widthInches)} />

      {/* ── Yellow CMU block pattern — continuous so block count is readable */}
      {hCMUBlocks(0,    0, CMU_W, [], px, py, pf)}
      {hCMUBlocks(CI_S, 0, CMU_W, [], px, py, pf)}
      {vCMUBlocks(0,    0, CMU_D, [], px, py, pf)}
      {vCMUBlocks(CI_R, 0, CMU_D, [], px, py, pf)}

      {/* Interior clear (CMU interior) */}
      <rect fill="#fff" stroke="none"
        x={px(CI_L)} y={py(CI_N)} width={pf(W_INT)} height={pf(D_INT)} />

      {/* Re-draw CMU outline on top for clean edge */}
      <rect fill="none" stroke="#111" strokeWidth="1.8"
        x={px(0)} y={py(0)} width={pf(CMU_W)} height={pf(CMU_D)} />
      {/* CMU interior face (lighter inner edge) */}
      <rect fill="none" stroke="#555" strokeWidth="0.8"
        x={px(CI_L)} y={py(CI_N)} width={pf(W_INT)} height={pf(D_INT)} />

      {/* CMU opening cuts removed — block pattern runs continuously through
          all openings; frame lines / swing symbols indicate actual openings */}

      {/* ── Room interior cream fill ────────────────────────────────────── */}
      <rect className="fp-room"
        x={px(FW_IN)} y={py(FN_IN)}
        width={pf(FE_IN - FW_IN)} height={pf(FS_IN - FN_IN)} />

      {/* ── Counter — L-shape: north wall → west wall → partition top ───── */}
      {(() => {
        const CD = 24;                          // counter depth (inches)
        const partTopY = BTH_Y + 16.5;         // 119.5" — partition north face

        return <>
          {/* Piece A — along north wall: main counter → fridge → small counter */}
          {(() => {
            const FRIDGE_W  = 30;   // fridge width (E-W)
            const SMALL_CTR = 12;   // 1-foot cabinet between fridge and door
            const mainCtrW  = ND_L - FW_IN - FRIDGE_W - SMALL_CTR;

            const fridgeL = FW_IN + mainCtrW;
            const fridgeR = fridgeL + FRIDGE_W;
            const hPad    = 3;  // handle inset from front/back edges

            return <>
              {/* Main counter (west wall → fridge) */}
              <rect className="fp-counter"
                x={px(FW_IN)} y={py(FN_IN)}
                width={pf(mainCtrW)} height={pf(CD)} />
              <text className="fp-fixture-lbl"
                x={px(FW_IN + mainCtrW / 2)} y={py(FN_IN + 13)}>
                COUNTER
              </text>

              {/* Fridge */}
              <rect className="fp-fridge"
                x={px(fridgeL)} y={py(FN_IN)}
                width={pf(FRIDGE_W)} height={pf(CD)} />
              {/* Fridge handle — horizontal bar near front edge */}
              <line className="fp-fridge-handle"
                x1={px(fridgeL + hPad)} y1={py(FN_IN + CD - 4)}
                x2={px(fridgeR - hPad)} y2={py(FN_IN + CD - 4)} />
              <text className="fp-fixture-lbl"
                x={px(fridgeL + FRIDGE_W / 2)} y={py(FN_IN + 13)}>
                FRIDGE
              </text>

              {/* Small counter slice (fridge → door) */}
              <rect className="fp-counter"
                x={px(fridgeR)} y={py(FN_IN)}
                width={pf(SMALL_CTR)} height={pf(CD)} />

              {/* Unified front edge across full north run */}
              <line className="fp-counter-edge"
                x1={px(FW_IN + CD)} y1={py(FN_IN + CD)}
                x2={px(ND_L)}       y2={py(FN_IN + CD)} />
            </>;
          })()}

          {/* Piece B — along west wall (north counter → partition top) */}
          <rect className="fp-counter"
            x={px(FW_IN)} y={py(FN_IN + CD)}
            width={pf(CD)} height={pf(partTopY - CD - (FN_IN + CD))} />


          {/* Piece C — along partition north face (west wall → east face of vertical 2×4) */}
          <rect className="fp-counter"
            x={px(FW_IN)} y={py(partTopY - CD)}
            width={pf(partWallR + INT_D - FW_IN)} height={pf(CD)} />

          {/* Front edges — west and partition legs of the L */}
          {/* West counter front edge */}
          <line className="fp-counter-edge"
            x1={px(FW_IN + CD)} y1={py(FN_IN + CD)}
            x2={px(FW_IN + CD)} y2={py(partTopY - CD)} />
          {/* Partition counter front edge (runs to east face of vertical 2×4 wall) */}
          <line className="fp-counter-edge"
            x1={px(FW_IN + CD)}        y1={py(partTopY - CD)}
            x2={px(partWallR + INT_D)} y2={py(partTopY - CD)} />

          {/* Labels */}
          <text className="fp-fixture-lbl"
            x={px(FW_IN + CD / 2)}
            y={py(FN_IN + CD + (partTopY - CD - FN_IN - CD) / 2)}
            transform={`rotate(-90, ${px(FW_IN + CD / 2)}, ${py(FN_IN + CD + (partTopY - CD - FN_IN - CD) / 2)})`}>
            COUNTER
          </text>
          <text className="fp-fixture-lbl"
            x={px(FW_IN + (partWallR + INT_D - FW_IN) / 2)} y={py(partTopY - 11)}>
            COUNTER
          </text>

          {/* ── Double sink — centered on Piece C (bathroom partition counter) ── */}
          {(() => {
            const SINK_W    = 33;   // total sink width (two basins + rim)
            const SINK_D    = 18;   // sink depth (fits in 24" counter with 3" rim each side)
            const RIM       = 2;    // rim around each basin
            const BASIN_W   = (SINK_W - RIM * 3) / 2;  // ~13.5" each basin
            const ctrMidX   = FW_IN + (partWallR + INT_D - FW_IN) / 2;
            const sinkL     = ctrMidX - SINK_W / 2;
            const sinkNorth = partTopY - CD + 3;        // 3" back-rim
            const bTop      = sinkNorth + RIM;
            const bBot      = bTop + SINK_D - RIM * 2;
            const b1L = sinkL + RIM;
            const b1R = b1L + BASIN_W;
            const b2L = b1R + RIM;
            const b2R = b2L + BASIN_W;
            const drainR = 2.5;

            return <>
              {/* Outer sink rim outline */}
              <rect className="fp-sink-rim"
                x={px(sinkL)} y={py(sinkNorth)}
                width={pf(SINK_W)} height={pf(SINK_D)} rx="1" />
              {/* Left basin */}
              <rect className="fp-sink-basin"
                x={px(b1L)} y={py(bTop)}
                width={pf(BASIN_W)} height={pf(bBot - bTop)} rx="1" />
              {/* Right basin */}
              <rect className="fp-sink-basin"
                x={px(b2L)} y={py(bTop)}
                width={pf(BASIN_W)} height={pf(bBot - bTop)} rx="1" />
              {/* Drains */}
              <circle className="fp-sink-drain"
                cx={px(b1L + BASIN_W / 2)} cy={py(bTop + (bBot - bTop) / 2)}
                r={pf(drainR)} />
              <circle className="fp-sink-drain"
                cx={px(b2L + BASIN_W / 2)} cy={py(bTop + (bBot - bTop) / 2)}
                r={pf(drainR)} />
            </>;
          })()}
        </>;
      })()}

      {/* ── 1" air gap fill (white strip between CMU and frame) ─────────── */}
      {/* N gap */}
      <rect fill="#fff" stroke="none"
        x={px(CI_L)} y={py(CI_N)} width={pf(W_INT)} height={pf(FR_GAP)} />
      {/* S gap */}
      <rect fill="#fff" stroke="none"
        x={px(CI_L)} y={py(FS_OUT)} width={pf(W_INT)} height={pf(FR_GAP)} />
      {/* W gap */}
      <rect fill="#fff" stroke="none"
        x={px(CI_L)} y={py(CI_N)} width={pf(FR_GAP)} height={pf(D_INT)} />
      {/* E gap */}
      <rect fill="#fff" stroke="none"
        x={px(FE_OUT)} y={py(CI_N)} width={pf(FR_GAP)} height={pf(D_INT)} />

      {/* ── Opening cuts in wood frame zone ─────────────────────────────── */}
      <rect fill="#fff" stroke="none"
        x={px(ND_L)} y={py(FN_OUT)} width={pf(nOp.widthInches)} height={pf(FR_D)} />
      <rect fill="#fff" stroke="none"
        x={px(SW_L)} y={py(FS_IN)} width={pf(sOp.widthInches)} height={pf(FR_D)} />
      <rect fill="#fff" stroke="none"
        x={px(FW_OUT)} y={py(WW_T)} width={pf(FR_D)} height={pf(wOp.widthInches)} />
      <rect fill="#fff" stroke="none"
        x={px(FE_IN)} y={py(ED_T)} width={pf(FR_D)} height={pf(eOp.widthInches)} />

      {/* ── CMU interior face dashed lines (1" gap indicator) ───────────── */}
      {/* North CMU interior face — full span (CMU interior face runs CI_L to CI_R) */}
      <line className="fp-cmugap" x1={px(CI_L)} y1={py(CI_N)} x2={px(ND_L)} y2={py(CI_N)} />
      <line className="fp-cmugap" x1={px(ND_R)} y1={py(CI_N)} x2={px(CI_R)} y2={py(CI_N)} />
      <line className="fp-cmugap" x1={px(CI_L)} y1={py(CI_S)} x2={px(SW_L)} y2={py(CI_S)} />
      <line className="fp-cmugap" x1={px(SW_R)} y1={py(CI_S)} x2={px(CI_R)} y2={py(CI_S)} />
      <line className="fp-cmugap" x1={px(CI_L)} y1={py(CI_N)} x2={px(CI_L)} y2={py(WW_T)} />
      <line className="fp-cmugap" x1={px(CI_L)} y1={py(WW_B)} x2={px(CI_L)} y2={py(CI_S)} />
      <line className="fp-cmugap" x1={px(CI_R)} y1={py(CI_N)} x2={px(CI_R)} y2={py(ED_T)} />
      <line className="fp-cmugap" x1={px(CI_R)} y1={py(ED_B)} x2={px(CI_R)} y2={py(CI_S)} />

      {/* ══ WOOD FRAME LINES ════════════════════════════════════════════════
          Corner convention: E/W walls run the full CMU interior depth (168",
          CI_N→CI_S). N/S walls are shorter (275") and butt into the E/W inner
          faces (FW_IN→FE_IN). The 1" standoff from CMU is on all wall faces. */}

      {/* North — outer face (wall spans FW_IN to FE_IN = 275") */}
      <line className="fp-frame" x1={px(FW_IN)} y1={py(FN_OUT)} x2={px(ND_L)} y2={py(FN_OUT)} />
      <line className="fp-frame" x1={px(ND_R)} y1={py(FN_OUT)} x2={px(FE_IN)} y2={py(FN_OUT)} />
      {/* North — inner face */}
      <line className="fp-frame" x1={px(FW_IN)} y1={py(FN_IN)} x2={px(ND_L)} y2={py(FN_IN)} />
      <line className="fp-frame" x1={px(ND_R)} y1={py(FN_IN)} x2={px(FE_IN)} y2={py(FN_IN)} />
      {/* North — butt ends (butts into E/W inner faces) */}
      <line className="fp-frame" x1={px(FW_IN)} y1={py(FN_OUT)} x2={px(FW_IN)} y2={py(FN_IN)} />
      <line className="fp-frame" x1={px(FE_IN)} y1={py(FN_OUT)} x2={px(FE_IN)} y2={py(FN_IN)} />
      {/* North — door jambs */}
      <line className="fp-frame" x1={px(ND_L)} y1={py(FN_OUT)} x2={px(ND_L)} y2={py(FN_IN)} />
      <line className="fp-frame" x1={px(ND_R)} y1={py(FN_OUT)} x2={px(ND_R)} y2={py(FN_IN)} />

      {/* South — outer face (wall spans FW_IN to FE_IN = 275") */}
      <line className="fp-frame" x1={px(FW_IN)} y1={py(FS_OUT)} x2={px(SW_L)} y2={py(FS_OUT)} />
      <line className="fp-frame" x1={px(SW_R)} y1={py(FS_OUT)} x2={px(FE_IN)} y2={py(FS_OUT)} />
      {/* South — inner face */}
      <line className="fp-frame" x1={px(FW_IN)} y1={py(FS_IN)} x2={px(SW_L)} y2={py(FS_IN)} />
      <line className="fp-frame" x1={px(SW_R)} y1={py(FS_IN)} x2={px(FE_IN)} y2={py(FS_IN)} />
      {/* South — butt ends */}
      <line className="fp-frame" x1={px(FW_IN)} y1={py(FS_IN)} x2={px(FW_IN)} y2={py(FS_OUT)} />
      <line className="fp-frame" x1={px(FE_IN)} y1={py(FS_IN)} x2={px(FE_IN)} y2={py(FS_OUT)} />
      <line className="fp-frame" x1={px(SW_L)} y1={py(FS_IN)} x2={px(SW_L)} y2={py(FS_OUT)} />
      <line className="fp-frame" x1={px(SW_R)} y1={py(FS_IN)} x2={px(SW_R)} y2={py(FS_OUT)} />

      {/* West — outer face (FN_OUT → FS_OUT: 1" standoff from both N and S CMU faces) */}
      <line className="fp-frame" x1={px(FW_OUT)} y1={py(FN_OUT)} x2={px(FW_OUT)} y2={py(WW_T)} />
      <line className="fp-frame" x1={px(FW_OUT)} y1={py(WW_B)} x2={px(FW_OUT)} y2={py(FS_OUT)} />
      {/* West — inner face */}
      <line className="fp-frame" x1={px(FW_IN)} y1={py(FN_OUT)} x2={px(FW_IN)} y2={py(WW_T)} />
      <line className="fp-frame" x1={px(FW_IN)} y1={py(WW_B)} x2={px(FW_IN)} y2={py(FS_OUT)} />
      {/* West — plate ends (flush with N/S outer faces — clean T corner) */}
      <line className="fp-frame" x1={px(FW_OUT)} y1={py(FN_OUT)} x2={px(FW_IN)} y2={py(FN_OUT)} />
      <line className="fp-frame" x1={px(FW_OUT)} y1={py(FS_OUT)} x2={px(FW_IN)} y2={py(FS_OUT)} />
      {/* West — window jambs */}
      <line className="fp-frame" x1={px(FW_OUT)} y1={py(WW_T)} x2={px(FW_IN)} y2={py(WW_T)} />
      <line className="fp-frame" x1={px(FW_OUT)} y1={py(WW_B)} x2={px(FW_IN)} y2={py(WW_B)} />

      {/* East — outer face (FN_OUT → FS_OUT: 1" standoff from both N and S CMU faces) */}
      <line className="fp-frame" x1={px(FE_OUT)} y1={py(FN_OUT)} x2={px(FE_OUT)} y2={py(ED_T)} />
      <line className="fp-frame" x1={px(FE_OUT)} y1={py(ED_B)} x2={px(FE_OUT)} y2={py(FS_OUT)} />
      {/* East — inner face */}
      <line className="fp-frame" x1={px(FE_IN)} y1={py(FN_OUT)} x2={px(FE_IN)} y2={py(ED_T)} />
      <line className="fp-frame" x1={px(FE_IN)} y1={py(ED_B)} x2={px(FE_IN)} y2={py(FS_OUT)} />
      {/* East — plate ends (flush with N/S outer faces — clean T corner) */}
      <line className="fp-frame" x1={px(FE_IN)} y1={py(FN_OUT)} x2={px(FE_OUT)} y2={py(FN_OUT)} />
      <line className="fp-frame" x1={px(FE_IN)} y1={py(FS_OUT)} x2={px(FE_OUT)} y2={py(FS_OUT)} />
      {/* East — door jambs */}
      <line className="fp-frame" x1={px(FE_IN)} y1={py(ED_T)} x2={px(FE_OUT)} y2={py(ED_T)} />
      <line className="fp-frame" x1={px(FE_IN)} y1={py(ED_B)} x2={px(FE_OUT)} y2={py(ED_B)} />

      {/* ══ 2×6 STUD CROSS-SECTIONS (plan view) ════════════════════════════
          Each stud appears as a 1.5" × 5.5" rectangle within the frame band.
          North/South: stud.x measured from West interior face.
          West:        stud.x measured from South interior face (left=South from outside).
          East:        stud.x measured from North interior face (left=North from outside). */}

      {nStuds.map((s, i) => (
        <rect key={`ns${i}`} className="fp-stud"
          x={px(FW_IN + s.x)} y={py(FN_OUT)}
          width={pf(s.width)} height={pf(FR_D)} />
      ))}
      {sStuds.map((s, i) => (
        <rect key={`ss${i}`} className="fp-stud"
          x={px(FE_IN - s.x - s.width)} y={py(FS_IN)}
          width={pf(s.width)} height={pf(FR_D)} />
      ))}
      {/* West: stud.x from South (wall starts at FS_OUT, ends at FN_OUT) */}
      {wStuds.map((s, i) => (
        <rect key={`ws${i}`} className="fp-stud"
          x={px(FW_OUT)} y={py(FS_OUT - s.x - s.width)}
          width={pf(FR_D)} height={pf(s.width)} />
      ))}
      {/* East: stud.x from North (wall starts at FN_OUT, ends at FS_OUT) */}
      {eStuds.map((s, i) => (
        <rect key={`es${i}`} className="fp-stud"
          x={px(FE_IN)} y={py(FN_OUT + s.x)}
          width={pf(FR_D)} height={pf(s.width)} />
      ))}

      {/* ══ INTERIOR PARTITION WALLS (2×4) ═══════════════════════════════════
          Horizontal wall: north face of bottom zone, SW_L → FE_IN at y=BTH_Y
          Vertical wall:   west face of bathroom, BTH_X, y=BTH_Y → FS_IN       */}

      {/* Horizontal — bathroom partition wall (SW corner)
          16.5" south of canopy window south jamb (mirrors 16.5" stub above window) */}
      <rect className="fp-int-wall"
        x={px(partWallL)} y={py(BTH_Y + 16.5)}
        width={pf(partWallR - partWallL)} height={pf(INT_D)} />
      {/* 2×4 studs at 16" OC within the partition wall band */}
      {partStudXs.map((sx, i) => (
        <rect key={`ps${i}`} className="fp-stud"
          x={px(sx)} y={py(BTH_Y + 16.5)}
          width={pf(INT_SW)} height={pf(INT_D)} />
      ))}

      {/* T-intersection backing studs — West exterior wall ──────────────────
          Two 2×6 studs side-by-side give 3" nailing surface for partition end stud. */}
      <rect className="fp-stud"
        x={px(FW_OUT)} y={py(BTH_Y + 16.5)}
        width={pf(FR_D)} height={pf(INT_SW)} />
      <rect className="fp-stud"
        x={px(FW_OUT)} y={py(BTH_Y + 16.5 + INT_SW)}
        width={pf(FR_D)} height={pf(INT_SW)} />

      {/* Vertical partition — solid wall above door opening only */}
      <rect className="fp-int-wall"
        x={px(partWallR)} y={py(partVWallT)}
        width={pf(INT_D)} height={pf(partVDoorT - partVWallT)} />
      {/* 2×4 studs above door (stud crosses: 3.5" E-W × 1.5" N-S) */}
      {partVStudYs.map((sy, i) => (
        <rect key={`pv${i}`} className="fp-stud"
          x={px(partWallR)} y={py(sy)}
          width={pf(INT_D)} height={pf(INT_SW)} />
      ))}

      {/* ── Bathroom door ───────────────────────────────────────────────────
          28" RO, hinge at south jamb (96", 169.5") — door tucks against south wall when open.
          Closed: leaf runs north along wall face to north jamb (96", 141.5").
          Open:   leaf swings 90° west to (68", 169.5") — ~1" from south wall.
          Arc:    free end sweeps from north jamb → west end, sweep=0 (CCW = short 90° arc). */}
      <line className="fp-door-leaf"
        x1={px(partWallR)} y1={py(partVWallB)}
        x2={px(partWallR)} y2={py(partVDoorT)} />
      <line className="fp-door-leaf"
        x1={px(partWallR)} y1={py(partVWallB)}
        x2={px(partWallR - BATH_DOOR_W)} y2={py(partVWallB)} />
      <path className="fp-door-arc"
        d={`M ${px(partWallR)} ${py(partVDoorT)} A ${pf(BATH_DOOR_W)} ${pf(BATH_DOOR_W)} 0 0 0 ${px(partWallR - BATH_DOOR_W)} ${py(partVWallB)}`} />

      {/* T-intersection backing studs — South exterior wall ──────────────────
          Two 2×6 studs side-by-side at the vertical partition x-location,
          giving 3" nailing surface for the vertical partition south end stud. */}
      <rect className="fp-stud"
        x={px(partWallR)} y={py(FS_IN)}
        width={pf(INT_SW)} height={pf(FR_D)} />
      <rect className="fp-stud"
        x={px(partWallR + INT_SW)} y={py(FS_IN)}
        width={pf(INT_SW)} height={pf(FR_D)} />

      {/* ── Bathroom vanity sink — NE corner (north wall × east/partition wall) ── */}
      {(() => {
        const VAN_W  = 24;                          // vanity width (W-E along north wall)
        const VAN_D  = 18;                          // vanity depth (N-S into bathroom)
        const bathNorthY = partVWallT + INT_D;      // 123" — south face of horiz. partition
        const vanL   = partWallR - VAN_W;           // 72"
        const vanR   = partWallR;                   // 96"
        const vanTop = bathNorthY;                  // 123"
        const vanBot = bathNorthY + VAN_D;          // 141"
        const RIM    = 2;
        const bL = vanL + RIM;
        const bR = vanR - RIM;
        const bT = vanTop + RIM;
        const bB = vanBot - RIM;
        return <>
          {/* Vanity cabinet */}
          <rect className="fp-counter"
            x={px(vanL)} y={py(vanTop)}
            width={pf(VAN_W)} height={pf(VAN_D)} />
          {/* Front edge */}
          <line className="fp-counter-edge"
            x1={px(vanL)} y1={py(vanBot)}
            x2={px(vanR)} y2={py(vanBot)} />
          {/* Basin */}
          <rect className="fp-sink-basin"
            x={px(bL)} y={py(bT)}
            width={pf(bR - bL)} height={pf(bB - bT)} rx="1" />
          {/* Drain */}
          <circle className="fp-sink-drain"
            cx={px(vanL + VAN_W / 2)} cy={py(vanTop + VAN_D / 2)}
            r={pf(2.5)} />
          <text className="fp-fixture-lbl"
            x={px(vanL + VAN_W / 2)} y={py(vanTop + VAN_D / 2 + 8)}>
            SINK
          </text>
        </>;
      })()}

      {/* ── Bathroom shower — SW corner ─────────────────────────────────── */}
      {(() => {
        const SH_W = 36;                          // shower width (E-W)
        const bathNorthY = partVWallT + INT_D;    // 123" — north wall of bathroom
        const shL = FW_IN;                        // 14.5"
        const shR = FW_IN + SH_W;                // 50.5"
        const shT = bathNorthY;                   // 123" — full height to north wall
        const shB = FS_IN;                        // 169.5" — full height to south wall
        const SH_D = shB - shT;                  // 46.5" — full bathroom depth
        const CURB = 2;                           // curb width
        const doorY = shT + SH_D * 0.35;         // door gap starts 35% down east face
        const doorH = SH_D * 0.45;               // door gap ~21"
        return <>
          {/* Shower pan */}
          <rect className="fp-shower"
            x={px(shL)} y={py(shT)}
            width={pf(SH_W)} height={pf(SH_D)} />
          {/* Curb — inner inset lines (3 sides; east side has door opening) */}
          <line className="fp-shower-curb" x1={px(shL+CURB)} y1={py(shT+CURB)} x2={px(shR-CURB)} y2={py(shT+CURB)} />
          <line className="fp-shower-curb" x1={px(shL+CURB)} y1={py(shT+CURB)} x2={px(shL+CURB)} y2={py(shB-CURB)} />
          <line className="fp-shower-curb" x1={px(shL+CURB)} y1={py(shB-CURB)} x2={px(shR-CURB)} y2={py(shB-CURB)} />
          {/* East curb above door */}
          <line className="fp-shower-curb" x1={px(shR-CURB)} y1={py(shT+CURB)} x2={px(shR-CURB)} y2={py(doorY)} />
          {/* East curb below door */}
          <line className="fp-shower-curb" x1={px(shR-CURB)} y1={py(doorY+doorH)} x2={px(shR-CURB)} y2={py(shB-CURB)} />
          {/* Sliding door panel (dashed line on east face across opening) */}
          <line className="fp-shower-door"
            x1={px(shR)} y1={py(doorY)}
            x2={px(shR)} y2={py(doorY + doorH)} />
          {/* Drain */}
          <circle className="fp-sink-drain"
            cx={px(shL + SH_W / 2)} cy={py(shT + SH_D * 0.6)}
            r={pf(3)} />
          <text className="fp-fixture-lbl"
            x={px(shL + SH_W / 2)} y={py(shT + SH_D * 0.6 + 9)}>
            SHOWER
          </text>
        </>;
      })()}

      {/* ── Bathroom toilet — north wall, west of vanity sink ───────────── */}
      {(() => {
        const TL_W   = 14;                            // toilet width (E-W)
        const TANK_D = 7;                             // tank depth (N-S)
        const BOWL_D = 21;                            // bowl depth (N-S)
        const bathNorthY = partVWallT + INT_D;        // 123" — south face of horiz. partition
        const tlR    = partWallR - 24 - 3;           // 69" — 3" gap west of vanity (vanity at 72")
        const tlL    = tlR - TL_W;                   // 55"
        const tlTop  = bathNorthY;                    // 123" — tank against north wall
        const tankB  = tlTop + TANK_D;               // 130"
        const bowlCX = tlL + TL_W / 2;              // 62"
        const bowlCY = tankB + BOWL_D / 2;           // 140.5"
        return <>
          {/* Tank — against north wall */}
          <rect className="fp-toilet-tank"
            x={px(tlL)} y={py(tlTop)}
            width={pf(TL_W)} height={pf(TANK_D)} rx="1" />
          {/* Bowl (oval) — pointing south into bathroom */}
          <ellipse className="fp-toilet-bowl"
            cx={px(bowlCX)} cy={py(bowlCY)}
            rx={pf(TL_W / 2 - 1)} ry={pf(BOWL_D / 2 - 1)} />
          <text className="fp-fixture-lbl"
            x={px(bowlCX)} y={py(bowlCY + 9)}>
            WC
          </text>
        </>;
      })()}

      {/* ══ RAISED BATHROOM FLOOR — ledger + 2×6 joists ════════════════════
          Platform rises ~21¾" above main floor to match landing height.
          Primary ledger on south wall inner face (FS_IN).
          North end bears on horizontal 2×4 partition south face (bathN).
          2×6 joists span N-S at 16" OC between south ledger and north partition.
      ═══════════════════════════════════════════════════════════════════ */}
      {(() => {
        const bathW  = FW_IN;                    // west: 14.5"
        const bathE  = partWallR;                // east: 96"
        const bathN  = partVWallT + INT_D;       // north: 123"  (bearing on horiz. partition)
        const bathS  = FS_IN;                    // south: 169.5" (ledger on south wall)
        const JOIST_OC = 16;
        const LEDGER_T = 1.5;                    // ledger thickness shown as inset

        // Joist positions E-W, first flush with west wall, last at/near east wall
        const joistXs: number[] = [];
        for (let x = bathW; x <= bathE + 0.01; x += JOIST_OC) {
          joistXs.push(Math.min(x, bathE));
          if (x >= bathE) break;
        }
        if (joistXs[joistXs.length - 1] < bathE - 0.01) joistXs.push(bathE);

        return (
          <>
            {/* Raised floor fill */}
            <rect className="fp-raised-floor"
              x={px(bathW)} y={py(bathN)}
              width={pf(bathE - bathW)} height={pf(bathS - bathN)} />

            {/* 2×6 floor joists — running N-S at 16" OC */}
            {joistXs.map((x, i) => (
              <line key={`bj${i}`} className="fp-joist-2x6"
                x1={px(x)} y1={py(bathN + LEDGER_T)}
                x2={px(x)} y2={py(bathS - LEDGER_T)} />
            ))}

            {/* Raised floor label */}
            <text className="fp-fixture-lbl"
              x={px((bathW + bathE) / 2)} y={py(bathN + (bathS - bathN) / 2 - 8)}>
              RAISED FLOOR
            </text>
            <text className="fp-fixture-lbl"
              x={px((bathW + bathE) / 2)} y={py(bathN + (bathS - bathN) / 2 + 2)}>
              +21¾&quot; (S LEDGER + 2×6 N–S)
            </text>
          </>
        );
      })()}

      {/* ══ STAIR SYSTEM ════════════════════════════════════════════════════
          Flow (heading south):
            ① N-S approach  — 2 steps descending south, east of bathroom partition
            ② Landing        — turn right (west) → bathroom door
                               turn left  (east) → main stair run going UP
            ③ Main stair run — E-W along south wall, continuing up to next floor
      ═══════════════════════════════════════════════════════════════════ */}
      {(() => {
        const TREAD      = 10;   // tread depth (inches)
        const APPR_STEPS = 3;    // N-S approach steps (matches elevation: 3 risers @ 7.24")
        const APPR_W     = 36;   // approach width (E-W)
        const MAIN_STEPS = 11;   // main run treads (12 risers - 1 = 11 treads × 10" = 110")
        const MAIN_W     = APPR_W;   // main stair width matches landing (36" — code minimum)

        // ── Landing — 36"×36", flush against south wall ─────────────────
        const platL  = partWallR + INT_D;              // 99.5"
        const platR  = platL + APPR_W;                // 135.5"
        const platB  = FS_IN;                          // 169.5" — south wall
        const platT  = platB - APPR_W;                // 133.5" — 36" square

        // ── N-S approach (2 steps) — north of landing, travel south ─────
        const apprL  = platL;                          // 99.5"
        const apprR  = platR;                          // 135.5"
        const apprB  = platT;                          // 133.5" — connects to landing top
        const apprT  = apprB - APPR_STEPS * TREAD;    // 113.5"

        // ── Main stair run (turn left = east, going UP) ─────────────────
        const stairL = platR;                          // 135.5"
        const stairR = stairL + MAIN_STEPS * TREAD;   // 245.5"
        const stairT = FS_IN - MAIN_W;                // 127.5" — fits within room
        const stairB = FS_IN;                          // 169.5" — stops at south wall inner face
        const cutX   = stairL + Math.round(MAIN_STEPS / 2) * TREAD;

        const apprTreads: number[] = [];
        for (let i = 1; i <= APPR_STEPS; i++) apprTreads.push(apprT + i * TREAD);

        const mainTreads: number[] = [];
        for (let i = 1; i <= MAIN_STEPS; i++) mainTreads.push(stairL + i * TREAD);

        return <>
          {/* ① N-S approach — 2 steps heading south */}
          <rect className="fp-platform"
            x={px(apprL)} y={py(apprT)}
            width={pf(APPR_W)} height={pf(apprB - apprT)} />
          <rect fill="none" stroke="#555" strokeWidth="1"
            x={px(apprL)} y={py(apprT)}
            width={pf(APPR_W)} height={pf(apprB - apprT)} />
          {apprTreads.map((ty, i) => (
            <line key={`at${i}`} className="fp-stair-tread"
              x1={px(apprL)} y1={py(ty)}
              x2={px(apprR)} y2={py(ty)} />
          ))}
          {/* Arrow — direction of travel = south (heading down to landing) */}
          <line className="fp-up-arrow"
            x1={px(apprL + APPR_W / 2)} y1={py(apprT + 4)}
            x2={px(apprL + APPR_W / 2)} y2={py(apprB - 4)} />
          <text className="fp-fixture-lbl"
            x={px(apprL + APPR_W / 2 + 10)} y={py(apprT + (apprB - apprT) / 2)}>
            3R DN
          </text>

          {/* ② Landing */}
          <rect className="fp-platform"
            x={px(platL)} y={py(platT)}
            width={pf(platR - platL)} height={pf(platB - platT)} />
          <rect fill="none" stroke="#555" strokeWidth="1"
            x={px(platL)} y={py(platT)}
            width={pf(platR - platL)} height={pf(platB - platT)} />
          <text className="fp-fixture-lbl"
            x={px(platL + (platR - platL) / 2)} y={py(platT + (platB - platT) / 2 - 6)}>
            LANDING
          </text>
          {/* Right arrow → bathroom */}
          <text className="fp-fixture-lbl"
            x={px(platL + (platR - platL) / 2)} y={py(platT + (platB - platT) / 2 + 6)}>
            → BATH
          </text>
          {/* Left arrow → stairs */}
          <text className="fp-fixture-lbl"
            x={px(platL + (platR - platL) / 2)} y={py(platT + (platB - platT) / 2 + 16)}>
            ← UP
          </text>

          {/* ③ Main stair run — turn left (east), heading up */}
          <rect className="fp-stair-run"
            x={px(stairL)} y={py(stairT)}
            width={pf(stairR - stairL)} height={pf(MAIN_W)} />
          <rect fill="none" stroke="#555" strokeWidth="1"
            x={px(stairL)} y={py(stairT)}
            width={pf(stairR - stairL)} height={pf(MAIN_W)} />
          {mainTreads.map((tx, i) => (
            <line key={`mt${i}`} className="fp-stair-tread"
              x1={px(tx)} y1={py(stairT)}
              x2={px(tx)} y2={py(stairB)} />
          ))}
          {/* Mid-flight cut */}
          <polyline className="fp-stair-cut"
            points={`${px(cutX)},${py(stairT)} ${px(cutX-4)},${py(stairT + MAIN_W*0.3)} ${px(cutX+4)},${py(stairT + MAIN_W*0.7)} ${px(cutX)},${py(stairB)}`} />
          {/* UP arrow east */}
          <line className="fp-up-arrow"
            x1={px(stairL + 5)} y1={py(stairT + MAIN_W / 2)}
            x2={px(cutX - 8)}  y2={py(stairT + MAIN_W / 2)} />
          <text className="fp-fixture-lbl"
            x={px(stairL + (cutX - stairL) / 2)} y={py(stairT + MAIN_W / 2 - 5)}>
            UP
          </text>
          <text className="fp-fixture-lbl"
            x={px(stairL + (cutX - stairL) / 2)} y={py(stairT + MAIN_W / 2 + 12)}>
            {MAIN_STEPS}R
          </text>
        </>;
      })()}

      {/* ══ OPENING SYMBOLS ═════════════════════════════════════════════════ */}

      {/* ── North door: hinge right (east jamb = ND_R), swings into room (south) ── */}
      {/* Open leaf perpendicular from hinge; closed leaf along wall */}
      <line className="fp-door-leaf"
        x1={px(ND_R)} y1={py(FN_IN)}
        x2={px(ND_R)} y2={py(FN_IN + DOOR_W)} />
      <line className="fp-door-leaf"
        x1={px(ND_R)} y1={py(FN_IN)}
        x2={px(ND_L)} y2={py(FN_IN)} />
      {/* Swing arc: free end travels from ND_L (closed) → ND_R,FN_IN+DOOR_W (open) */}
      <path className="fp-door-arc"
        d={`M ${px(ND_L)} ${py(FN_IN)} A ${pf(DOOR_W)} ${pf(DOOR_W)} 0 0 0 ${px(ND_R)} ${py(FN_IN + DOOR_W)}`} />

      {/* ── South window: three parallel lines across opening ─────────────  */}
      {[0.2, 0.5, 0.8].map((t, i) => {
        const yy = py(FS_IN + t * FR_D);
        return (
          <line key={i} className="fp-win"
            x1={px(SW_L)} y1={yy} x2={px(SW_R)} y2={yy} />
        );
      })}

      {/* ── West window: three parallel lines down opening ────────────────  */}
      {[0.2, 0.5, 0.8].map((t, i) => {
        const xx = px(FW_OUT + t * FR_D);
        return (
          <line key={i} className="fp-win"
            x1={xx} y1={py(WW_T)} x2={xx} y2={py(WW_B)} />
        );
      })}

      {/* ── East sliding door: two overlapping panel rects ────────────────  */}
      {(() => {
        const pW = eOp.widthInches / 2;   // each panel = half RO width
        const lap = 4;                      // overlap in inches
        return (
          <>
            {/* Panel 1 (north panel) */}
            <rect className="fp-win"
              x={px(FE_IN)} y={py(ED_T)}
              width={pf(FR_D)} height={pf(pW + lap)} />
            {/* Panel 2 (south panel) */}
            <rect className="fp-win"
              x={px(FE_IN)} y={py(ED_T + pW - lap)}
              width={pf(FR_D)} height={pf(pW + lap)} />
            {/* Center track line */}
            <line className="fp-win"
              x1={px(FE_IN + FR_D / 2)} y1={py(ED_T)}
              x2={px(FE_IN + FR_D / 2)} y2={py(ED_B)} />
          </>
        );
      })()}

      {/* ══ DIMENSION ANNOTATIONS ══════════════════════════════════════════ */}

      {/* Interior width (bottom) — CMU_L to CMU_R */}
      {(() => {
        const yD = AT + pf(CMU_D) + 32;
        const x1 = px(CI_L);
        const x2 = px(CI_R);
        const xm = (x1 + x2) / 2;
        return (
          <g>
            <line className="fp-dl" x1={x1} y1={yD - 5} x2={x1} y2={yD + 5} />
            <line className="fp-dl" x1={x2} y1={yD - 5} x2={x2} y2={yD + 5} />
            <line className="fp-dl" x1={x1} y1={yD} x2={x2} y2={yD} />
            <text className="fp-dt" x={xm} y={yD + 14}>
              {W_INT}&quot; ({fmt(W_INT)}) INTERIOR WIDTH
            </text>
          </g>
        );
      })()}

      {/* Interior depth (left) — CI_N to CI_S */}
      {(() => {
        const xD = AL - 44;
        const y1 = py(CI_N);
        const y2 = py(CI_S);
        const ym = (y1 + y2) / 2;
        return (
          <g>
            <line className="fp-dl" x1={xD - 5} y1={y1} x2={xD + 5} y2={y1} />
            <line className="fp-dl" x1={xD - 5} y1={y2} x2={xD + 5} y2={y2} />
            <line className="fp-dl" x1={xD} y1={y1} x2={xD} y2={y2} />
            <text className="fp-dt" transform={`translate(${xD - 13} ${ym}) rotate(-90)`}>
              {D_INT}&quot; ({fmt(D_INT)}) INTERIOR DEPTH
            </text>
          </g>
        );
      })()}

      {/* North door position chain — spans CMU interior (CI_L to CI_R = 288") */}
      {(() => {
        const yD = AT - 18;
        const segs = [
          { x1: CI_L, x2: ND_L, label: `${Math.round(ND_L - CI_L)}"` },
          { x1: ND_L, x2: ND_R, label: `${nOp.widthInches}" RO` },
          { x1: ND_R, x2: CI_R, label: `${Math.round(CI_R - ND_R)}"` },
        ];
        return (
          <g>
            {segs.map((s, i) => {
              const x1 = px(s.x1);
              const x2 = px(s.x2);
              const xm = (x1 + x2) / 2;
              return (
                <g key={i}>
                  <line className="fp-dl" x1={x1} y1={yD - 4} x2={x1} y2={yD + 4} />
                  {i === segs.length - 1 &&
                    <line className="fp-dl" x1={x2} y1={yD - 4} x2={x2} y2={yD + 4} />
                  }
                  <line className="fp-dl" x1={x1} y1={yD} x2={x2} y2={yD} />
                  <text className="fp-dt" style={{ fontSize: "9px" }} x={xm} y={yD - 6}>{s.label}</text>
                </g>
              );
            })}
          </g>
        );
      })()}

      {/* South window label */}
      <text className="fp-olbl"
        x={px((SW_L + SW_R) / 2)}
        y={AT + pf(CMU_D) + 14}>
        {sOp.label} WIN
      </text>

      {/* West window label (rotated) */}
      <text className="fp-olbl"
        transform={`translate(${AL - 12} ${py((WW_T + WW_B) / 2)}) rotate(-90)`}>
        {wOp.label} WIN
      </text>

      {/* East door label (rotated) */}
      <text className="fp-olbl"
        transform={`translate(${AL + pf(CMU_W) + 14} ${py((ED_T + ED_B) / 2)}) rotate(90)`}>
        {eOp.label} SLIDING DOOR
      </text>

      {/* ══ WALL LABELS ═════════════════════════════════════════════════════ */}
      <text className="fp-wlbl" x={px(CMU_W / 2)} y={AT - 30}>NORTH</text>
      <text className="fp-wlbl" x={px(CMU_W / 2)} y={AT + pf(CMU_D) + 52}>SOUTH</text>
      <text className="fp-wlbl"
        transform={`translate(${AL - 6} ${AT + pf(CMU_D / 2)}) rotate(-90)`}>WEST</text>
      <text className="fp-wlbl"
        transform={`translate(${AL + pf(CMU_W) + 10} ${AT + pf(CMU_D / 2)}) rotate(90)`}>EAST</text>

      {/* ══ NORTH ARROW ═════════════════════════════════════════════════════ */}
      {(() => {
        const nx = AL + pf(CMU_W) + AR - 18;
        const ny = AT + 24;
        return (
          <g>
            <line stroke="#111" strokeWidth="1.2" x1={nx} y1={ny + 16} x2={nx} y2={ny - 6} />
            <polygon className="fp-narrow"
              points={`${nx},${ny - 12} ${nx - 4},${ny - 2} ${nx},${ny} ${nx + 4},${ny - 2}`} />
            <text style={{
              fill: "#111", fontSize: "9px",
              fontFamily: "ui-monospace, monospace",
              textAnchor: "middle"
            }} x={nx} y={ny + 26}>N</text>
          </g>
        );
      })()}
    </svg>
  );
}
