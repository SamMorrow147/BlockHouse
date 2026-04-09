"use client";

import React, { useState } from "react";
import { Toggle } from "@/components/ui/toggle";
import {
  initialWalls, CMU_T, CMU_BLOCK_W, CMU_INTERIOR_W, CMU_INTERIOR_D,
  FR_GAP, FR_D, INT_D, INT_SW, PARTITION_WALL_R, PARTITION_V_OFFSET,
  COUNTER_DEPTH, vertPartition,
  FRIDGE_W, SMALL_CTR_W, KIT_SINK_W, KIT_SINK_D, KIT_SINK_RIM,
  BATH_VAN_W, BATH_VAN_D, BATH_VAN_RIM, SHOWER_W, SHOWER_CURB,
  TOILET_W, TOILET_TANK_D, TOILET_BOWL_D,
  BATH_JOIST_OC, BATH_LEDGER_T,
  STAIR_TREAD_DEPTH, STAIR_APPR_STEPS, STAIR_WIDTH, STAIR_MAIN_STEPS,
  STAIR_LAND_RISERS, STAIR_TOTAL_RISERS, STAIR_LAND_POST_W, TJI_DEPTH, SUBFLOOR_T,
  STOVE_W, STOVE_D, STOVE_REAR_CLR, STOVE_SIDE_CLR,
  STOVE_FLUE_DIA, STOVE_THIMBLE_OD,
  HEARTH_PAD_FRONT, HEARTH_PAD_SIDE, HEARTH_PAD_REAR,
} from "@/lib/framing-data";
import { computeWallLayout } from "@/lib/layout-calculator";
import {
  CMU_W, CMU_D, CI_L, CI_R, CI_N, CI_S,
  FN_OUT, FN_IN, FS_IN, FS_OUT, FW_OUT, FW_IN, FE_IN, FE_OUT,
  SD_L, SD_R, NW_L, NW_R, EW_T, EW_B, WD_T, WD_B,
} from "@/lib/plan-geometry";

// ── Scale & Wall Constants ──────────────────────────────────────────────────
const FP_PX   = 3;    // px per inch (floor plan is smaller than wall elevations)

// ── SVG margin around plan drawing (px) ────────────────────────────────────
const AL = 140;  // left   (vertical dim + exterior counter overhang)
const AT = 56;   // top    (title + south dimension; raised slightly for label clearance)
const AR = 62;   // right  (west label + door label clearance)
const AB = 68;   // bottom (north dim + label)

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
const CMU_BL = CMU_BLOCK_W;

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

// Horizontal wall band (South / North).
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

// Vertical wall band (West / East).
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

function LayerBtn({ label, on, toggle }: { label: string; on: boolean; toggle: () => void }) {
  return (
    <Toggle
      pressed={on}
      onPressedChange={toggle}
      size="sm"
      variant="outline"
      className="h-7 px-3 text-xs font-mono rounded-full border-zinc-300 text-zinc-600
                 data-[state=on]:bg-zinc-800 data-[state=on]:text-white
                 data-[state=on]:border-zinc-800 hover:bg-zinc-100
                 data-[state=on]:hover:bg-zinc-700 transition-all"
    >
      {label}
    </Toggle>
  );
}

export function FloorPlan() {
  const [showStairs,   setShowStairs]   = useState(true);
  const [showBathroom, setShowBathroom] = useState(true);
  const [showCabinets, setShowCabinets] = useState(true);
  const [showSewer,    setShowSewer]    = useState(true);
  const [showSubfloor,   setShowSubfloor]   = useState(false);
  const [showWoodStove,  setShowWoodStove]  = useState(true);

  // Opening objects — matched to their actual wall
  const sOp  = initialWalls.south.openings[0];   // south door  (48" × 80")
  const nOp  = initialWalls.north.openings[0];   // north window (40" × 48")
  const eOp  = initialWalls.east.openings[0];    // east window  (72" × 48")
  const wOp  = initialWalls.west.openings[0];    // west sliding door (79" × 73")

  // ── SVG coordinate helpers ────────────────────────────────────────────
  const px = (x: number) => AL + pf(x);
  const py = (y: number) => AT + pf(y);
  const svgW = AL + pf(CMU_W) + AR;
  const svgH = AT + pf(CMU_D) + AB;

  // Door swing parameters
  const DOOR_W = sOp.widthInches;   // 48" = south door RO width = swing radius

  const BTH_W  = eOp.positionFromLeftInches;   // 72"  — reuse east window position
  const BTH_X  = FE_IN - BTH_W;               // 289.5 - 72 = 217.5"  east face of bathroom
  const BTH_Y  = EW_B;                         // 103"  south face of partition

  // ── Horizontal partition — runs East wall → west end ───────────────────
  // FW_IN (14.5") → 96" (6 CMU blocks), 81.5" long
  // Stops 8" (half a block) before north window left jamb (NW_L = 104")
  const partWallL = FW_IN;
  const partWallR = PARTITION_WALL_R;
  const partStudXs: number[] = [];
  partStudXs.push(partWallL);
  for (let x = partWallL + 16; x < partWallR - INT_SW; x += 16) {
    partStudXs.push(x);
  }
  partStudXs.push(partWallR - INT_SW);                  // west end stud

  // ── Vertical partition — drops north from top of horizontal wall → north wall ──
  // x = partWallR (96") → partWallR + INT_D (99.5"), 3.5" wide (E-W)
  // y = top of horizontal wall (119.5") → FS_IN (169.5"), 50" tall
  // Overlaps horizontal wall in the corner zone (119.5"→123") forming a solid L-corner.
  const partVWallT = BTH_Y + PARTITION_V_OFFSET;
  const partVWallB = FS_IN;                   // 169.5" — north wall inner face

  // ── Bathroom door in vertical partition ────────────────────────────────
  // 28" RO (standard min. bathroom door = 2'-4"), hinge at north jamb.
  // Swings EAST into bathroom; open leaf rests along the north wall.
  const BATH_DOOR_W = vertPartition.openings[0].widthInches;
  const partVDoorT = partVWallB - BATH_DOOR_W;  // 141.5" — south (top) jamb of door

  // Studs ABOVE the door opening only (119.5" → 141.5")
  const partVStudYs: number[] = [];
  partVStudYs.push(partVWallT);               // south end stud (inside corner zone)
  for (let y = partVWallT + 16; y < partVDoorT - INT_SW; y += 16) {
    partVStudYs.push(y);                       // 16" OC field studs
  }
  partVStudYs.push(partVDoorT - INT_SW);      // king stud at door south jamb

  // ── Stud layouts (from same data as wall elevations) ─────────────────
  // South/North stud.x is measured from the East interior face.
  // East stud.x is measured from the North interior face ("left" = North from outside).
  // West stud.x is measured from the South interior face ("left" = South from outside).
  const nStuds = computeWallLayout(initialWalls.south).studs;
  const sStuds = computeWallLayout(initialWalls.north).studs;
  const wStuds = computeWallLayout(initialWalls.east).studs;
  const eStuds = computeWallLayout(initialWalls.west).studs;

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 px-3 py-2 bg-zinc-50 border-b border-zinc-200 sticky top-[44px] z-[9]">
        <LayerBtn label="Stairs"       on={showStairs}    toggle={() => setShowStairs(v => !v)} />
        <LayerBtn label="Bathroom"     on={showBathroom}  toggle={() => setShowBathroom(v => !v)} />
        <LayerBtn label="Cabinets"     on={showCabinets}  toggle={() => setShowCabinets(v => !v)} />
        <LayerBtn label="Sewer Outlet" on={showSewer}     toggle={() => setShowSewer(v => !v)} />
        <LayerBtn label="Subfloor"     on={showSubfloor}  toggle={() => setShowSubfloor(v => !v)} />
        <LayerBtn label="Wood Stove"   on={showWoodStove} toggle={() => setShowWoodStove(v => !v)} />
      </div>
    <svg
      viewBox={`0 0 ${svgW} ${svgH}`}
      width="100%"
      style={{ maxHeight: 700, display: "block" }}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <style>{`
          .fp-subfloor      { fill: rgba(210,185,145,0.28); stroke: #a07840; stroke-width: 0.8px; stroke-linejoin: miter; }
          .fp-subfloor-grain{ fill: none; stroke: rgba(160,120,60,0.18); stroke-width: 0.5px; }
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
          .fp-hearth-pad  { fill: rgba(180,160,130,0.25); stroke: #8b7348; stroke-width: 1px; stroke-dasharray: 4 2; }
          .fp-stove       { fill: #3a3a3a; stroke: #111; stroke-width: 1.2px; }
          .fp-stove-glass { fill: #1a1a2a; stroke: #555; stroke-width: 0.8px; }
          .fp-stove-pipe  { fill: none; stroke: #444; stroke-width: 2px; }
          .fp-thimble     { fill: rgba(200,180,150,0.4); stroke: #8b5e3c; stroke-width: 1.2px; }
          .fp-thimble-bore{ fill: #fff; stroke: #666; stroke-width: 0.8px; }
          .fp-clr-zone    { fill: none; stroke: #c44; stroke-width: 0.6px; stroke-dasharray: 3 3; }
          .fp-stove-lbl   { fill: #ddd; font-size: 6.5px; font-family: ui-monospace, monospace; text-anchor: middle; font-weight: 700; }
        `}</style>
      <marker id="arrowhead" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
        <path d="M0,0 L0,6 L6,3 z" fill="#333" />
      </marker>
      </defs>

      {/* ── Title block (y spaced to avoid SOUTH and dimension chain) ─────── */}
      <text className="fp-title" x={AL} y={AT - 28}>01 — MAIN LEVEL FLOOR PLAN (INTERIOR FRAMING)</text>
      <text className="fp-sub" x={AL} y={AT - 12}>
        SCALE: 3px = 1&quot;  |  8&quot; CMU WALLS  |  2×6 WOOD FRAME 1&quot; OFF CMU  |  INTERIOR {CMU_INTERIOR_W}&quot; × {CMU_INTERIOR_D}&quot;
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
          {/* South outer edge — skip door (SD_L→SD_R) */}
          {lp(0, 0, SD_L, 0, "n1")}
          {lp(SD_R, 0, CMU_W, 0, "n2")}
          {/* North outer edge — skip window (NW_L→NW_R) */}
          {lp(0, CMU_D, NW_L, CMU_D, "s1")}
          {lp(NW_R, CMU_D, CMU_W, CMU_D, "s2")}
          {/* East outer edge — skip window (EW_T→EW_B) */}
          {lp(0, 0, 0, EW_T, "w1")}
          {lp(0, EW_B, 0, CMU_D, "w2")}
          {/* West outer edge — skip door (WD_T→WD_B) */}
          {lp(CMU_W, 0, CMU_W, WD_T, "e1")}
          {lp(CMU_W, WD_B, CMU_W, CMU_D, "e2")}
        </>;
      })()}

      {/* ── White at openings (before blocks) — clears gray so opening is
          visible, but block joints still draw on top in yellow              */}
      <rect fill="#fff" stroke="none"
        x={px(SD_L)} y={py(0)} width={pf(sOp.widthInches)} height={pf(CMU_T)} />
      <rect fill="#fff" stroke="none"
        x={px(NW_L)} y={py(CI_S)} width={pf(nOp.widthInches)} height={pf(CMU_T)} />
      <rect fill="#fff" stroke="none"
        x={px(0)} y={py(EW_T)} width={pf(CMU_T)} height={pf(eOp.widthInches)} />
      <rect fill="#fff" stroke="none"
        x={px(CI_R)} y={py(WD_T)} width={pf(CMU_T)} height={pf(wOp.widthInches)} />

      {/* ── Yellow CMU block pattern — continuous so block count is readable */}
      {hCMUBlocks(0,    0, CMU_W, [], px, py, pf)}
      {hCMUBlocks(CI_S, 0, CMU_W, [], px, py, pf)}
      {vCMUBlocks(0,    0, CMU_D, [], px, py, pf)}
      {vCMUBlocks(CI_R, 0, CMU_D, [], px, py, pf)}

      {/* Interior clear (CMU interior) */}
      <rect fill="#fff" stroke="none"
        x={px(CI_L)} y={py(CI_N)} width={pf(CMU_INTERIOR_W)} height={pf(CMU_INTERIOR_D)} />

      {/* Re-draw CMU outline on top for clean edge */}
      <rect fill="none" stroke="#111" strokeWidth="1.8"
        x={px(0)} y={py(0)} width={pf(CMU_W)} height={pf(CMU_D)} />
      {/* CMU interior face (lighter inner edge) */}
      <rect fill="none" stroke="#555" strokeWidth="0.8"
        x={px(CI_L)} y={py(CI_N)} width={pf(CMU_INTERIOR_W)} height={pf(CMU_INTERIOR_D)} />

      {/* CMU opening cuts removed — block pattern runs continuously through
          all openings; frame lines / swing symbols indicate actual openings */}

      {/* ── Room interior cream fill ────────────────────────────────────── */}
      <rect className="fp-room"
        x={px(FW_IN)} y={py(FN_IN)}
        width={pf(FE_IN - FW_IN)} height={pf(FS_IN - FN_IN)} />

      {/* ══ SUBFLOOR SHEET LAYOUT ════════════════════════════════════════════
          3/4" (23/32) T&G OSB DryMax GP — 4×8 sheets
          Best practice: long edge (8' = 96") runs E-W, perpendicular to N-S joists.
          Rows are 48" (4') deep N-S; every other row is offset 48" E-W to stagger joints. */}
      {showSubfloor && (() => {
        const SHEET_L = 96;   // long edge runs E-W
        const SHEET_W = 48;   // short edge runs N-S
        const interiorX1 = FW_IN;
        const interiorX2 = FE_IN;
        const interiorY1 = FN_IN;
        const interiorY2 = FS_IN;
        const sheets: { x: number; y: number; w: number; h: number; label: boolean }[] = [];
        let rowIndex = 0;
        for (let rowY = interiorY1; rowY < interiorY2; rowY += SHEET_W, rowIndex++) {
          const clipY1 = rowY;
          const clipY2 = Math.min(rowY + SHEET_W, interiorY2);
          const xOffset = (rowIndex % 2 === 0) ? 0 : SHEET_L / 2;
          const startX  = interiorX1 - xOffset;
          for (let sheetX = startX; sheetX < interiorX2; sheetX += SHEET_L) {
            const clipX1 = Math.max(sheetX, interiorX1);
            const clipX2 = Math.min(sheetX + SHEET_L, interiorX2);
            if (clipX2 <= clipX1) continue;
            sheets.push({
              x: clipX1, y: clipY1,
              w: clipX2 - clipX1, h: clipY2 - clipY1,
              label: clipX2 - clipX1 > 48 && clipY2 - clipY1 > 20,
            });
          }
        }
        return (
          <g>
            {sheets.map((s, i) => (
              <g key={`sf${i}`}>
                <rect className="fp-subfloor"
                  x={px(s.x)} y={py(s.y)} width={pf(s.w)} height={pf(s.h)} />
                {/* Subtle N-S grain lines every 12" to show sheet orientation */}
                {Array.from({ length: Math.floor(s.w / 12) - 1 }, (_, gi) => {
                  const gx = s.x + (gi + 1) * 12;
                  if (gx >= s.x + s.w) return null;
                  return (
                    <line key={`g${gi}`} className="fp-subfloor-grain"
                      x1={px(gx)} y1={py(s.y)} x2={px(gx)} y2={py(s.y + s.h)} />
                  );
                })}
                {/* Sheet label — only when there's enough room */}
                {s.label && (
                  <text
                    x={px(s.x + s.w / 2)} y={py(s.y + s.h / 2) + 4}
                    textAnchor="middle" fontSize="7"
                    fill="#8B6030" fontFamily="ui-monospace,monospace" opacity={0.8}
                  >
                    4×8 T&G
                  </text>
                )}
              </g>
            ))}
          </g>
        );
      })()}

      {/* ── Cabinets / Counter layer ── */}
      {showCabinets && <>

      {/* ── Counter — L-shape: south wall → east wall → partition top ───── */}
      {(() => {
        const CD = COUNTER_DEPTH;
        const partTopY = BTH_Y + PARTITION_V_OFFSET;

        return <>
          {/* Piece A — along south wall: main counter → fridge → small counter */}
          {(() => {
            const mainCtrW  = SD_L - FW_IN - FRIDGE_W - SMALL_CTR_W;

            const fridgeL = FW_IN + mainCtrW;
            const fridgeR = fridgeL + FRIDGE_W;
            const hPad    = 3;  // handle inset from front/back edges

            return <>
              {/* Main counter (east wall → fridge) */}
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
                width={pf(SMALL_CTR_W)} height={pf(CD)} />

              {/* Unified front edge across full south run */}
              <line className="fp-counter-edge"
                x1={px(FW_IN + CD)} y1={py(FN_IN + CD)}
                x2={px(SD_L)}       y2={py(FN_IN + CD)} />
            </>;
          })()}

          {/* Piece B — along east wall (south counter → partition top) */}
          <rect className="fp-counter"
            x={px(FW_IN)} y={py(FN_IN + CD)}
            width={pf(CD)} height={pf(partTopY - CD - (FN_IN + CD))} />


          {/* Piece C — along partition south face (east wall → west face of vertical 2×4) */}
          <rect className="fp-counter"
            x={px(FW_IN)} y={py(partTopY - CD)}
            width={pf(partWallR + INT_D - FW_IN)} height={pf(CD)} />

          {/* Front edges — east and partition legs of the L */}
          {/* East counter front edge */}
          <line className="fp-counter-edge"
            x1={px(FW_IN + CD)} y1={py(FN_IN + CD)}
            x2={px(FW_IN + CD)} y2={py(partTopY - CD)} />
          {/* Partition counter front edge (runs to west face of vertical 2×4 wall) */}
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
            const BASIN_W   = (KIT_SINK_W - KIT_SINK_RIM * 3) / 2;  // ~13.5" each basin
            const ctrMidX   = FW_IN + (partWallR + INT_D - FW_IN) / 2;
            const sinkL     = ctrMidX - KIT_SINK_W / 2;
            const sinkNorth = partTopY - CD + 3;        // 3" back-rim
            const bTop      = sinkNorth + KIT_SINK_RIM;
            const bBot      = bTop + KIT_SINK_D - KIT_SINK_RIM * 2;
            const b1L = sinkL + KIT_SINK_RIM;
            const b1R = b1L + BASIN_W;
            const b2L = b1R + KIT_SINK_RIM;
            const b2R = b2L + BASIN_W;
            const drainR = 2.5;

            return <>
              {/* Outer sink rim outline */}
              <rect className="fp-sink-rim"
                x={px(sinkL)} y={py(sinkNorth)}
                width={pf(KIT_SINK_W)} height={pf(KIT_SINK_D)} rx="1" />
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

      </> /* end showCabinets */}

      {/* ── 1" air gap fill (white strip between CMU and frame) ─────────── */}
      {/* S gap */}
      <rect fill="#fff" stroke="none"
        x={px(CI_L)} y={py(CI_N)} width={pf(CMU_INTERIOR_W)} height={pf(FR_GAP)} />
      {/* N gap */}
      <rect fill="#fff" stroke="none"
        x={px(CI_L)} y={py(FS_OUT)} width={pf(CMU_INTERIOR_W)} height={pf(FR_GAP)} />
      {/* E gap */}
      <rect fill="#fff" stroke="none"
        x={px(CI_L)} y={py(CI_N)} width={pf(FR_GAP)} height={pf(CMU_INTERIOR_D)} />
      {/* W gap */}
      <rect fill="#fff" stroke="none"
        x={px(FE_OUT)} y={py(CI_N)} width={pf(FR_GAP)} height={pf(CMU_INTERIOR_D)} />

      {/* ── Opening cuts in wood frame zone ─────────────────────────────── */}
      <rect fill="#fff" stroke="none"
        x={px(SD_L)} y={py(FN_OUT)} width={pf(sOp.widthInches)} height={pf(FR_D)} />
      <rect fill="#fff" stroke="none"
        x={px(NW_L)} y={py(FS_IN)} width={pf(nOp.widthInches)} height={pf(FR_D)} />
      <rect fill="#fff" stroke="none"
        x={px(FW_OUT)} y={py(EW_T)} width={pf(FR_D)} height={pf(eOp.widthInches)} />
      <rect fill="#fff" stroke="none"
        x={px(FE_IN)} y={py(WD_T)} width={pf(FR_D)} height={pf(wOp.widthInches)} />

      {/* ── CMU interior face dashed lines (1" gap indicator) ───────────── */}
      {/* South CMU interior face — full span (CMU interior face runs CI_L to CI_R) */}
      <line className="fp-cmugap" x1={px(CI_L)} y1={py(CI_N)} x2={px(SD_L)} y2={py(CI_N)} />
      <line className="fp-cmugap" x1={px(SD_R)} y1={py(CI_N)} x2={px(CI_R)} y2={py(CI_N)} />
      <line className="fp-cmugap" x1={px(CI_L)} y1={py(CI_S)} x2={px(NW_L)} y2={py(CI_S)} />
      <line className="fp-cmugap" x1={px(NW_R)} y1={py(CI_S)} x2={px(CI_R)} y2={py(CI_S)} />
      <line className="fp-cmugap" x1={px(CI_L)} y1={py(CI_N)} x2={px(CI_L)} y2={py(EW_T)} />
      <line className="fp-cmugap" x1={px(CI_L)} y1={py(EW_B)} x2={px(CI_L)} y2={py(CI_S)} />
      <line className="fp-cmugap" x1={px(CI_R)} y1={py(CI_N)} x2={px(CI_R)} y2={py(WD_T)} />
      <line className="fp-cmugap" x1={px(CI_R)} y1={py(WD_B)} x2={px(CI_R)} y2={py(CI_S)} />

      {/* ══ WOOD FRAME LINES ════════════════════════════════════════════════
          E/W walls are the dominant (full-height) walls that own the corner zones.
          N/S walls butt into the E/W inner faces: they span FW_IN→FE_IN only.
          E/W walls span FN_OUT→FS_OUT (full depth including corner zones). */}

      {/* South — outer face (spans FW_IN to FE_IN, butting into E/W inner faces) */}
      <line className="fp-frame" x1={px(FW_IN)} y1={py(FN_OUT)} x2={px(SD_L)} y2={py(FN_OUT)} />
      <line className="fp-frame" x1={px(SD_R)} y1={py(FN_OUT)} x2={px(FE_IN)} y2={py(FN_OUT)} />
      {/* South — inner face */}
      <line className="fp-frame" x1={px(FW_IN)} y1={py(FN_IN)} x2={px(SD_L)} y2={py(FN_IN)} />
      <line className="fp-frame" x1={px(SD_R)} y1={py(FN_IN)} x2={px(FE_IN)} y2={py(FN_IN)} />
      {/* South — butt ends (flush with E/W inner faces) */}
      <line className="fp-frame" x1={px(FW_IN)} y1={py(FN_OUT)} x2={px(FW_IN)} y2={py(FN_IN)} />
      <line className="fp-frame" x1={px(FE_IN)} y1={py(FN_OUT)} x2={px(FE_IN)} y2={py(FN_IN)} />
      {/* South — door jambs */}
      <line className="fp-frame" x1={px(SD_L)} y1={py(FN_OUT)} x2={px(SD_L)} y2={py(FN_IN)} />
      <line className="fp-frame" x1={px(SD_R)} y1={py(FN_OUT)} x2={px(SD_R)} y2={py(FN_IN)} />

      {/* North — outer face (spans FW_IN to FE_IN, butting into E/W inner faces) */}
      <line className="fp-frame" x1={px(FW_IN)} y1={py(FS_OUT)} x2={px(NW_L)} y2={py(FS_OUT)} />
      <line className="fp-frame" x1={px(NW_R)} y1={py(FS_OUT)} x2={px(FE_IN)} y2={py(FS_OUT)} />
      {/* North — inner face */}
      <line className="fp-frame" x1={px(FW_IN)} y1={py(FS_IN)} x2={px(NW_L)} y2={py(FS_IN)} />
      <line className="fp-frame" x1={px(NW_R)} y1={py(FS_IN)} x2={px(FE_IN)} y2={py(FS_IN)} />
      {/* North — butt ends */}
      <line className="fp-frame" x1={px(FW_IN)} y1={py(FS_IN)} x2={px(FW_IN)} y2={py(FS_OUT)} />
      <line className="fp-frame" x1={px(FE_IN)} y1={py(FS_IN)} x2={px(FE_IN)} y2={py(FS_OUT)} />
      <line className="fp-frame" x1={px(NW_L)} y1={py(FS_IN)} x2={px(NW_L)} y2={py(FS_OUT)} />
      <line className="fp-frame" x1={px(NW_R)} y1={py(FS_IN)} x2={px(NW_R)} y2={py(FS_OUT)} />

      {/* East — outer face (full height FN_OUT → FS_OUT, owns corner zones) */}
      <line className="fp-frame" x1={px(FW_OUT)} y1={py(FN_OUT)} x2={px(FW_OUT)} y2={py(EW_T)} />
      <line className="fp-frame" x1={px(FW_OUT)} y1={py(EW_B)} x2={px(FW_OUT)} y2={py(FS_OUT)} />
      {/* East — inner face (stops at N/S inner faces: FN_IN → FS_IN) */}
      <line className="fp-frame" x1={px(FW_IN)} y1={py(FN_IN)} x2={px(FW_IN)} y2={py(EW_T)} />
      <line className="fp-frame" x1={px(FW_IN)} y1={py(EW_B)} x2={px(FW_IN)} y2={py(FS_IN)} />
      {/* East — cap ends (close corner zone at top and bottom) */}
      <line className="fp-frame" x1={px(FW_OUT)} y1={py(FN_OUT)} x2={px(FW_IN)} y2={py(FN_OUT)} />
      <line className="fp-frame" x1={px(FW_OUT)} y1={py(FS_OUT)} x2={px(FW_IN)} y2={py(FS_OUT)} />
      {/* East — window jambs */}
      <line className="fp-frame" x1={px(FW_OUT)} y1={py(EW_T)} x2={px(FW_IN)} y2={py(EW_T)} />
      <line className="fp-frame" x1={px(FW_OUT)} y1={py(EW_B)} x2={px(FW_IN)} y2={py(EW_B)} />

      {/* West — outer face (full height FN_OUT → FS_OUT, owns corner zones) */}
      <line className="fp-frame" x1={px(FE_OUT)} y1={py(FN_OUT)} x2={px(FE_OUT)} y2={py(WD_T)} />
      <line className="fp-frame" x1={px(FE_OUT)} y1={py(WD_B)} x2={px(FE_OUT)} y2={py(FS_OUT)} />
      {/* West — inner face (stops at N/S inner faces: FN_IN → FS_IN) */}
      <line className="fp-frame" x1={px(FE_IN)} y1={py(FN_IN)} x2={px(FE_IN)} y2={py(WD_T)} />
      <line className="fp-frame" x1={px(FE_IN)} y1={py(WD_B)} x2={px(FE_IN)} y2={py(FS_IN)} />
      {/* West — cap ends (close corner zone at top and bottom) */}
      <line className="fp-frame" x1={px(FE_IN)} y1={py(FN_OUT)} x2={px(FE_OUT)} y2={py(FN_OUT)} />
      <line className="fp-frame" x1={px(FE_IN)} y1={py(FS_OUT)} x2={px(FE_OUT)} y2={py(FS_OUT)} />
      {/* West — door jambs */}
      <line className="fp-frame" x1={px(FE_IN)} y1={py(WD_T)} x2={px(FE_OUT)} y2={py(WD_T)} />
      <line className="fp-frame" x1={px(FE_IN)} y1={py(WD_B)} x2={px(FE_OUT)} y2={py(WD_B)} />

      {/* ══ 2×6 STUD CROSS-SECTIONS (plan view) ════════════════════════════
          Each stud appears as a 1.5" × 5.5" rectangle within the frame band.
          South/North: stud.x measured from East interior face.
          East:        stud.x measured from North interior face (left=North from outside).
          West:        stud.x measured from South interior face (left=South from outside). */}

      {nStuds.map((s, i) => {
        const sx = Math.max(FW_IN, Math.min(FE_IN - s.width, FW_OUT + s.x));
        return <rect key={`ns${i}`} className="fp-stud"
          x={px(sx)} y={py(FN_OUT)}
          width={pf(s.width)} height={pf(FR_D)} />;
      })}
      {sStuds.map((s, i) => {
        const sx = Math.max(FW_IN, Math.min(FE_IN - s.width, FE_OUT - s.x - s.width));
        return <rect key={`ss${i}`} className="fp-stud"
          x={px(sx)} y={py(FS_IN)}
          width={pf(s.width)} height={pf(FR_D)} />;
      })}
      {/* East: stud.x from North (wall starts at FS_OUT, ends at FN_OUT) */}
      {wStuds.map((s, i) => (
        <rect key={`ws${i}`} className="fp-stud"
          x={px(FW_OUT)} y={py(FS_OUT - s.x - s.width)}
          width={pf(FR_D)} height={pf(s.width)} />
      ))}
      {/* West: stud.x from South (wall starts at FN_OUT, ends at FS_OUT) */}
      {eStuds.map((s, i) => (
        <rect key={`es${i}`} className="fp-stud"
          x={px(FE_IN)} y={py(FN_OUT + s.x)}
          width={pf(FR_D)} height={pf(s.width)} />
      ))}

      {/* ══ INTERIOR PARTITION WALLS (2×4) ═══════════════════════════════════
          Horizontal wall: south face of bottom zone, NW_L → FE_IN at y=BTH_Y
          Vertical wall:   east face of bathroom, BTH_X, y=BTH_Y → FS_IN       */}

      {/* Horizontal — bathroom partition wall (NE corner)
          16.5" north of canopy window north jamb (mirrors 16.5" stub above window) */}
      <rect className="fp-int-wall"
        x={px(partWallL)} y={py(partVWallT)}
        width={pf(partWallR - partWallL)} height={pf(INT_D)} />
      {partStudXs.map((sx, i) => (
        <rect key={`ps${i}`} className="fp-stud"
          x={px(sx)} y={py(partVWallT)}
          width={pf(INT_SW)} height={pf(INT_D)} />
      ))}

      {/* T-intersection backing studs — East exterior wall */}
      <rect className="fp-stud"
        x={px(FW_OUT)} y={py(partVWallT)}
        width={pf(FR_D)} height={pf(INT_SW)} />
      <rect className="fp-stud"
        x={px(FW_OUT)} y={py(partVWallT + INT_SW)}
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

      {/* ── Bathroom layer ── */}
      {showBathroom && <>

      {/* ── Bathroom door ───────────────────────────────────────────────────
          28" RO, hinge at north jamb (96", 169.5") — door tucks against north wall when open.
          Closed: leaf runs south along wall face to south jamb (96", 141.5").
          Open:   leaf swings 90° east to (68", 169.5") — ~1" from north wall.
          Arc:    free end sweeps from south jamb → east end, sweep=0 (CCW = short 90° arc). */}
      <line className="fp-door-leaf"
        x1={px(partWallR)} y1={py(partVWallB)}
        x2={px(partWallR)} y2={py(partVDoorT)} />
      <line className="fp-door-leaf"
        x1={px(partWallR)} y1={py(partVWallB)}
        x2={px(partWallR - BATH_DOOR_W)} y2={py(partVWallB)} />
      <path className="fp-door-arc"
        d={`M ${px(partWallR)} ${py(partVDoorT)} A ${pf(BATH_DOOR_W)} ${pf(BATH_DOOR_W)} 0 0 0 ${px(partWallR - BATH_DOOR_W)} ${py(partVWallB)}`} />

      {/* T-intersection backing studs — North exterior wall ──────────────────
          Two 2×6 studs side-by-side at the vertical partition x-location,
          giving 3" nailing surface for the vertical partition north end stud. */}
      <rect className="fp-stud"
        x={px(partWallR)} y={py(FS_IN)}
        width={pf(INT_SW)} height={pf(FR_D)} />
      <rect className="fp-stud"
        x={px(partWallR + INT_SW)} y={py(FS_IN)}
        width={pf(INT_SW)} height={pf(FR_D)} />

      {/* ── Bathroom vanity sink — SW corner (south wall × west/partition wall) ── */}
      {(() => {
        const VAN_W  = BATH_VAN_W;
        const bathNorthY = partVWallT + INT_D;      // 123" — north face of horiz. partition
        const vanL   = partWallR - BATH_VAN_W;     // 72"
        const vanR   = partWallR;                   // 96"
        const vanTop = bathNorthY;                  // 123"
        const vanBot = bathNorthY + BATH_VAN_D;    // 141"
        const bL = vanL + BATH_VAN_RIM;
        const bR = vanR - BATH_VAN_RIM;
        const bT = vanTop + BATH_VAN_RIM;
        const bB = vanBot - BATH_VAN_RIM;
        return <>
          {/* Vanity cabinet */}
          <rect className="fp-counter"
            x={px(vanL)} y={py(vanTop)}
            width={pf(BATH_VAN_W)} height={pf(BATH_VAN_D)} />
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
            cx={px(vanL + BATH_VAN_W / 2)} cy={py(vanTop + BATH_VAN_D / 2)}
            r={pf(2.5)} />
          <text className="fp-fixture-lbl"
            x={px(vanL + BATH_VAN_W / 2)} y={py(vanTop + BATH_VAN_D / 2 + 8)}>
            SINK
          </text>
        </>;
      })()}

      {/* ── Bathroom shower — NE corner ─────────────────────────────────── */}
      {(() => {
        const SH_W = SHOWER_W;
        const bathNorthY = partVWallT + INT_D;    // 123" — south wall of bathroom
        const shL = FW_IN;                        // 14.5"
        const shR = FW_IN + SH_W;                // 50.5"
        const shT = bathNorthY;                   // 123" — full height to south wall
        const shB = FS_IN;                        // 169.5" — full height to north wall
        const SH_D = shB - shT;                  // 46.5" — full bathroom depth
        const CURB = SHOWER_CURB;
        const doorY = shT + SH_D * 0.35;         // door gap starts 35% down west face
        const doorH = SH_D * 0.45;               // door gap ~21"
        return <>
          {/* Shower pan */}
          <rect className="fp-shower"
            x={px(shL)} y={py(shT)}
            width={pf(SH_W)} height={pf(SH_D)} />
          {/* Curb — inner inset lines (3 sides; west side has door opening) */}
          <line className="fp-shower-curb" x1={px(shL+CURB)} y1={py(shT+CURB)} x2={px(shR-CURB)} y2={py(shT+CURB)} />
          <line className="fp-shower-curb" x1={px(shL+CURB)} y1={py(shT+CURB)} x2={px(shL+CURB)} y2={py(shB-CURB)} />
          <line className="fp-shower-curb" x1={px(shL+CURB)} y1={py(shB-CURB)} x2={px(shR-CURB)} y2={py(shB-CURB)} />
          {/* West curb above door */}
          <line className="fp-shower-curb" x1={px(shR-CURB)} y1={py(shT+CURB)} x2={px(shR-CURB)} y2={py(doorY)} />
          {/* West curb below door */}
          <line className="fp-shower-curb" x1={px(shR-CURB)} y1={py(doorY+doorH)} x2={px(shR-CURB)} y2={py(shB-CURB)} />
          {/* Sliding door panel (dashed line on west face across opening) */}
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

      {/* ── Bathroom toilet — south wall, east of vanity sink ───────────── */}
      {(() => {
        const TL_W   = TOILET_W;
        const TANK_D = TOILET_TANK_D;
        const BOWL_D = TOILET_BOWL_D;
        const bathNorthY = partVWallT + INT_D;        // 123" — north face of horiz. partition
        const tlR    = partWallR - BATH_VAN_W - 3;    // 69" — 3" gap east of vanity
        const tlL    = tlR - TL_W;                   // 55"
        const tlTop  = bathNorthY;                    // 123" — tank against south wall
        const tankB  = tlTop + TANK_D;               // 130"
        const bowlCX = tlL + TL_W / 2;              // 62"
        const bowlCY = tankB + BOWL_D / 2;           // 140.5"
        return <>
          {/* Tank — against south wall */}
          <rect className="fp-toilet-tank"
            x={px(tlL)} y={py(tlTop)}
            width={pf(TL_W)} height={pf(TANK_D)} rx="1" />
          {/* Bowl (oval) — pointing north into bathroom */}
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
          Platform height = STAIR_LAND_RISERS × (floor-to-floor / total risers).
          Primary ledger on north wall inner face (FS_IN).
          South end bears on horizontal 2×4 partition north face (bathN).
          2×6 joists span N-S at 16" OC between north ledger and south partition.
      ═══════════════════════════════════════════════════════════════════ */}
      {(() => {
        const bathW  = FW_IN;                    // east: 14.5"
        const bathE  = partWallR;                // west: 96"
        const bathN  = partVWallT + INT_D;       // south: 123"  (bearing on horiz. partition)
        const bathS  = FS_IN;                    // north: 169.5" (ledger on north wall)
        const JOIST_OC = BATH_JOIST_OC;
        const LEDGER_TH = BATH_LEDGER_T;
        const northWall = initialWalls.north;
        const FLOOR2_IN = northWall.wallHeightInches + TJI_DEPTH + SUBFLOOR_T;
        const riserH    = FLOOR2_IN / STAIR_TOTAL_RISERS;
        const platH     = STAIR_LAND_RISERS * riserH;
        const platHFmt  = `+${Math.round(platH * 4) / 4}"`.replace(/\.0"$/, '"');

        // Joist positions E-W, first flush with east wall, last at/near west wall
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
                x1={px(x)} y1={py(bathN + LEDGER_TH)}
                x2={px(x)} y2={py(bathS - LEDGER_TH)} />
            ))}

            {/* Raised floor label */}
            <text className="fp-fixture-lbl"
              x={px((bathW + bathE) / 2)} y={py(bathN + (bathS - bathN) / 2 - 8)}>
              RAISED FLOOR
            </text>
            <text className="fp-fixture-lbl"
              x={px((bathW + bathE) / 2)} y={py(bathN + (bathS - bathN) / 2 + 2)}>
              {platHFmt} (N LEDGER + 2×6 N–S)
            </text>
          </>
        );
      })()}

      </> /* end showBathroom */}

      {showStairs && <>

      {/* ══ STAIR SYSTEM ════════════════════════════════════════════════════
          Flow (heading north):
            ① N-S approach  — 2 steps descending north, west of bathroom partition
            ② Landing        — turn right (east) → bathroom door
                               turn left  (west) → main stair run going UP
            ③ Main stair run — E-W along north wall, continuing up to next floor
      ═══════════════════════════════════════════════════════════════════ */}
      {(() => {
        const TREAD      = STAIR_TREAD_DEPTH;
        const APPR_STEPS = STAIR_APPR_STEPS;
        const APPR_W     = STAIR_WIDTH;
        const MAIN_STEPS = STAIR_MAIN_STEPS;
        const MAIN_W     = STAIR_WIDTH;

        // ── Landing — west edge aligns with north window west jamb ──────
        const platL  = partWallR + INT_D;              // 99.5"
        const platR  = NW_R;                           // 144" — flush with north window west edge
        const platB  = FS_IN;                          // 169.5" — north wall
        const platT  = platB - APPR_W;                // 133.5" — N-S depth = stair width

        // ── N-S approach (2 treads + landing face riser) — same width as landing ──
        const apprL  = platL;                          // 99.5"
        const apprR  = platR;                          // 144" — matches landing west edge
        const apprB  = platT;                          // 133.5" — connects to landing top
        const apprT  = apprB - APPR_STEPS * TREAD;    // 113.5"

        // ── Main stair run (turn left = west, going UP) ─────────────────
        const stairL = platR;                          // 144" — starts at landing west edge
        const stairR = stairL + MAIN_STEPS * TREAD;   // 252" (12 treads × 9")
        const stairT = FS_IN - MAIN_W;                // 127.5" — fits within room
        const stairB = FS_IN;                          // 169.5" — stops at north wall inner face
        const cutX   = stairL + Math.round(MAIN_STEPS / 2) * TREAD;

        const apprTreads: number[] = [];
        for (let i = 1; i <= APPR_STEPS; i++) apprTreads.push(apprT + i * TREAD);

        const mainTreads: number[] = [];
        for (let i = 1; i <= MAIN_STEPS; i++) mainTreads.push(stairL + i * TREAD);

        return <>
          {/* ① N-S approach — 2 steps + landing face riser heading north */}
          <rect className="fp-platform"
            x={px(apprL)} y={py(apprT)}
            width={pf(apprR - apprL)} height={pf(apprB - apprT)} />
          <rect fill="none" stroke="#555" strokeWidth="1"
            x={px(apprL)} y={py(apprT)}
            width={pf(apprR - apprL)} height={pf(apprB - apprT)} />
          {apprTreads.map((ty, i) => (
            <line key={`at${i}`} className="fp-stair-tread"
              x1={px(apprL)} y1={py(ty)}
              x2={px(apprR)} y2={py(ty)} />
          ))}
          {/* Arrow — direction of travel = north (heading down to landing) */}
          <line className="fp-up-arrow"
            x1={px((apprL + apprR) / 2)} y1={py(apprT + 4)}
            x2={px((apprL + apprR) / 2)} y2={py(apprB - 4)} />
          <text className="fp-fixture-lbl"
            x={px((apprL + apprR) / 2 + 10)} y={py(apprT + (apprB - apprT) / 2)}>
            {APPR_STEPS}R DN
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

          {/* ── 4×4 Landing & Stair Posts ─────────────────────────────── */}
          {(() => {
            const P = STAIR_LAND_POST_W; // 3.5"
            const posts: { x: number; y: number; label: string }[] = [
              // Kitty-corner from landing — beside first main-run step & approach,
              // sits in the open room at the junction of landing/approach/main run
              { x: platR, y: platT - P,       label: "4×4 POST (landing corner)" },
              // Mirror SE post — SW kitty-corner (landing NE of post; right edge at landing west)
              { x: platL - P, y: platT - P,   label: "4×4 POST (landing SW corner)" },
              // SW corner of main stair run — far west end, south side
              { x: stairR - P, y: stairT,     label: "4×4 POST (stair SW)" },
              // Kitty-corner at top of staircase — far west end, offset south
              // mirrors the landing corner post at the arrival end of the main run
              { x: stairR, y: stairT - P,     label: "4×4 POST (stair top corner)" },
              // North side of staircase — same x as SE landing and stair top, against north wall
              { x: platR, y: stairB,         label: "4×4 POST (landing N)" },
              { x: stairR, y: stairB,        label: "4×4 POST (stair top N)" },
            ];
            return posts.map((p, i) => (
              <rect key={`lp${i}`}
                x={px(p.x)} y={py(p.y)}
                width={pf(P)} height={pf(P)}
                fill="#e8d8b8" stroke="#8b7348" strokeWidth="1.4" />
            ));
          })()}

          {/* ③ Main stair run — turn left (west), heading up */}
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
          {/* UP arrow west */}
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

      </> /* end showStairs */}

      {/* ══ OPENING SYMBOLS ═════════════════════════════════════════════════ */}

      {/* ── South door: hinge right (west jamb = SD_R), swings into room (north) ── */}
      {/* Open leaf perpendicular from hinge; closed leaf along wall */}
      <line className="fp-door-leaf"
        x1={px(SD_R)} y1={py(FN_IN)}
        x2={px(SD_R)} y2={py(FN_IN + DOOR_W)} />
      <line className="fp-door-leaf"
        x1={px(SD_R)} y1={py(FN_IN)}
        x2={px(SD_L)} y2={py(FN_IN)} />
      {/* Swing arc: free end travels from SD_L (closed) → SD_R,FN_IN+DOOR_W (open) */}
      <path className="fp-door-arc"
        d={`M ${px(SD_L)} ${py(FN_IN)} A ${pf(DOOR_W)} ${pf(DOOR_W)} 0 0 0 ${px(SD_R)} ${py(FN_IN + DOOR_W)}`} />

      {/* ── North window: three parallel lines across opening ─────────────  */}
      {[0.2, 0.5, 0.8].map((t, i) => {
        const yy = py(FS_IN + t * FR_D);
        return (
          <line key={i} className="fp-win"
            x1={px(NW_L)} y1={yy} x2={px(NW_R)} y2={yy} />
        );
      })}

      {/* ── East window: three parallel lines down opening ────────────────  */}
      {[0.2, 0.5, 0.8].map((t, i) => {
        const xx = px(FW_OUT + t * FR_D);
        return (
          <line key={i} className="fp-win"
            x1={xx} y1={py(EW_T)} x2={xx} y2={py(EW_B)} />
        );
      })}

      {/* ── West sliding door: two overlapping panel rects ────────────────  */}
      {(() => {
        const pW = wOp.widthInches / 2;   // each panel = half RO width
        const lap = 4;                      // overlap in inches
        return (
          <>
            {/* Panel 1 (south panel) */}
            <rect className="fp-win"
              x={px(FE_IN)} y={py(WD_T)}
              width={pf(FR_D)} height={pf(pW + lap)} />
            {/* Panel 2 (north panel) */}
            <rect className="fp-win"
              x={px(FE_IN)} y={py(WD_T + pW - lap)}
              width={pf(FR_D)} height={pf(pW + lap)} />
            {/* Center track line */}
            <line className="fp-win"
              x1={px(FE_IN + FR_D / 2)} y1={py(WD_T)}
              x2={px(FE_IN + FR_D / 2)} y2={py(WD_B)} />
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
              {CMU_INTERIOR_W}&quot; ({fmt(CMU_INTERIOR_W)}) INTERIOR WIDTH
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
              {CMU_INTERIOR_D}&quot; ({fmt(CMU_INTERIOR_D)}) INTERIOR DEPTH
            </text>
          </g>
        );
      })()}

      {/* South door position chain — spans frame wall (FW_OUT to FE_OUT = 286") */}
      {(() => {
        const yD = AT - 4;
        const segs = [
          { x1: FW_OUT, x2: SD_L, label: `${Math.round(SD_L - FW_OUT)}"` },
          { x1: SD_L,   x2: SD_R, label: `${sOp.widthInches}" RO` },
          { x1: SD_R,   x2: FE_OUT, label: `${Math.round(FE_OUT - SD_R)}"` },
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

      {/* North window label */}
      <text className="fp-olbl"
        x={px((NW_L + NW_R) / 2)}
        y={AT + pf(CMU_D) + 14}>
        {nOp.label} WIN
      </text>

      {/* East window label (rotated) */}
      <text className="fp-olbl"
        transform={`translate(${AL - 12} ${py((EW_T + EW_B) / 2)}) rotate(-90)`}>
        {eOp.label} WIN
      </text>

      {/* West door label (rotated) — inset from WEST wall label */}
      <text className="fp-olbl"
        transform={`translate(${AL + pf(CMU_W) + 12} ${py((WD_T + WD_B) / 2)}) rotate(90)`}>
        {wOp.label} SLIDING DOOR
      </text>

      {/* ══ WALL LABELS (positioned to avoid dimension/opening labels) ═══════ */}
      <text className="fp-wlbl" x={px(CMU_W / 2)} y={AT - 40}>SOUTH</text>
      <text className="fp-wlbl" x={px(CMU_W / 2)} y={AT + pf(CMU_D) + 58}>NORTH</text>
      <text className="fp-wlbl"
        transform={`translate(${AL - 14} ${AT + pf(CMU_D / 2)}) rotate(-90)`}>EAST</text>
      <text className="fp-wlbl"
        transform={`translate(${AL + pf(CMU_W) + 26} ${AT + pf(CMU_D / 2)}) rotate(90)`}>WEST</text>

      {/* ══ WOOD STOVE — SW CORNER ══════════════════════════════════════════
          24"×24" stove in the SW corner with 6" rear-exit flue through the
          south wall.  Insulated Class A thimble through CMU+frame assembly.
          Exterior vertical chimney run rises on the south face.
      ═════════════════════════════════════════════════════════════════════ */}
      {showWoodStove && (() => {
        // ── Stove position (plan coords: x→E-W, y→N-S; south=top, west=right) ──
        const stoveR = FE_IN - STOVE_SIDE_CLR;            // 271.5" — west side of stove
        const stoveL = stoveR - STOVE_W;                   // 247.5" — east side of stove
        const stoveT = FN_IN + STOVE_REAR_CLR;            // 26.5"  — back (south/top) of stove
        const stoveB = stoveT + STOVE_D;                   // 50.5"  — front (north/bottom) of stove
        const stoveCX = (stoveL + stoveR) / 2;            // 259.5" — E-W center
        const stoveCY = (stoveT + stoveB) / 2;            // 38.5"  — N-S center

        // ── Hearth pad ──
        const padL = stoveL - HEARTH_PAD_SIDE;            // 239.5"
        const padR = Math.min(stoveR + HEARTH_PAD_SIDE, FE_IN); // 279.5" (clamped to west wall)
        const padT = Math.max(stoveT - HEARTH_PAD_REAR - STOVE_REAR_CLR, FN_IN); // at south wall
        const padB = stoveB + HEARTH_PAD_FRONT;           // 68.5"

        // ── Connector pipe — runs from stove back center to south wall thimble ──
        const pipeX = stoveCX;
        const pipeY1 = stoveT;                             // stove back
        const pipeY2 = FN_OUT + FR_D / 2;                 // center of frame wall

        // ── Thimble — centered on pipe at south frame wall ──
        const thimbleCX = pipeX;
        const thimbleCY = (FN_OUT + FN_IN) / 2;           // center of frame depth
        const thimbleR  = STOVE_THIMBLE_OD / 2;           // 6"
        const flueR     = STOVE_FLUE_DIA / 2;             // 3"

        // ── Clearance zones (36" to combustibles — dashed red) ──
        // Only drawn where combustible framing exists (frame walls)
        const CLR = 36; // NFPA 211 unshielded clearance

        return (
          <g>
            {/* Hearth pad — non-combustible floor protection */}
            <rect className="fp-hearth-pad"
              x={px(padL)} y={py(padT)}
              width={pf(padR - padL)} height={pf(padB - padT)} />
            <text className="fp-fixture-lbl"
              x={px((padL + padR) / 2)} y={py(padB - 4)}>
              HEARTH PAD
            </text>

            {/* 36" clearance zone from stove to combustibles (dashed red) */}
            <rect className="fp-clr-zone"
              x={px(stoveL - CLR)} y={py(stoveT - CLR)}
              width={pf(STOVE_W + CLR * 2)} height={pf(STOVE_D + CLR * 2)}
              rx={pf(2)} />
            <text style={{
              fill: "#c44", fontSize: "6px",
              fontFamily: "ui-monospace, monospace",
              textAnchor: "start",
            }} x={px(stoveL - CLR + 2)} y={py(stoveB + CLR - 2)}>
              36&quot; CLR
            </text>

            {/* Connector pipe — 6" double-wall black pipe (stove back → thimble) */}
            <line className="fp-stove-pipe"
              x1={px(pipeX)} y1={py(pipeY1)}
              x2={px(pipeX)} y2={py(pipeY2)} />
            {/* Pipe outline (show pipe diameter) */}
            <line style={{ fill: "none", stroke: "#888", strokeWidth: "0.5px" }}
              x1={px(pipeX - flueR)} y1={py(pipeY1)}
              x2={px(pipeX - flueR)} y2={py(pipeY2)} />
            <line style={{ fill: "none", stroke: "#888", strokeWidth: "0.5px" }}
              x1={px(pipeX + flueR)} y1={py(pipeY1)}
              x2={px(pipeX + flueR)} y2={py(pipeY2)} />

            {/* Wall thimble — insulated pass-through at south frame wall */}
            <circle className="fp-thimble"
              cx={px(thimbleCX)} cy={py(thimbleCY)}
              r={pf(thimbleR)} />
            <circle className="fp-thimble-bore"
              cx={px(thimbleCX)} cy={py(thimbleCY)}
              r={pf(flueR)} />

            {/* Exterior pipe stub — dashed circle on CMU exterior face */}
            <circle style={{
              fill: "none", stroke: "#666",
              strokeWidth: "0.8px", strokeDasharray: "3 2",
            }}
              cx={px(thimbleCX)} cy={py(CMU_T / 2)}
              r={pf(flueR + 1)} />

            {/* Stove body — dark rectangle */}
            <rect className="fp-stove"
              x={px(stoveL)} y={py(stoveT)}
              width={pf(STOVE_W)} height={pf(STOVE_D)}
              rx={pf(1)} />

            {/* Glass door on front (north face) */}
            <rect className="fp-stove-glass"
              x={px(stoveL + 4)} y={py(stoveB - 2)}
              width={pf(STOVE_W - 8)} height={pf(2)}
              rx="1" />

            {/* Stove label */}
            <text className="fp-stove-lbl"
              x={px(stoveCX)} y={py(stoveCY - 2)}>
              WOOD
            </text>
            <text className="fp-stove-lbl"
              x={px(stoveCX)} y={py(stoveCY + 5)}>
              STOVE
            </text>

            {/* Thimble label */}
            <text style={{
              fill: "#8b5e3c", fontSize: "6px",
              fontFamily: "ui-monospace, monospace",
              textAnchor: "middle",
            }} x={px(thimbleCX + 14)} y={py(thimbleCY + 1)}>
              6&quot; THIMBLE
            </text>
          </g>
        );
      })()}

      {showSewer && <>

      {/* ══ SEWER STUB-OUT — NE corner, ~3.5 CMU blocks from interior corner ══
          Estimated position: 28" south of north wall inner face (FS_IN),
          28" west of east wall inner face (FW_IN). Opening ≈ 14"×14".
      ═════════════════════════════════════════════════════════════════════ */}
      {(() => {
        const OPEN_W = 14;
        const OPEN_H = 14;
        const SEW_CX = FW_IN + 12;
        const SEW_CY = FS_IN - 40;
        const PIPE_R = 3;
        return (
          <g>
            {/* Cut opening in slab (dashed rect) */}
            <rect
              x={px(SEW_CX - OPEN_W / 2)} y={py(SEW_CY - OPEN_H / 2)}
              width={pf(OPEN_W)} height={pf(OPEN_H)}
              fill="rgba(80,60,40,0.15)" stroke="#666" strokeWidth="1"
              strokeDasharray="4 2" />
            {/* PVC pipe stub (circle) */}
            <circle
              cx={px(SEW_CX)} cy={py(SEW_CY)}
              r={pf(PIPE_R)}
              fill="rgba(220,220,210,0.8)" stroke="#555" strokeWidth="1" />
            {/* Label */}
            <text style={{
              fill: "#555", fontSize: "7px",
              fontFamily: "ui-monospace, monospace",
              textAnchor: "middle"
            }} x={px(SEW_CX)} y={py(SEW_CY - OPEN_H / 2) - 4}>
              SEWER STUB
            </text>
          </g>
        );
      })()}

      </> /* end showSewer */}

      {/* ══ SOUTH ARROW (right side, clear of WEST label) ═══════════════════ */}
      {(() => {
        const nx = AL + pf(CMU_W) + AR - 12;
        const ny = AT + 28;
        return (
          <g>
            <line stroke="#111" strokeWidth="1.2" x1={nx} y1={ny + 16} x2={nx} y2={ny - 6} />
            <polygon className="fp-narrow"
              points={`${nx},${ny - 12} ${nx - 4},${ny - 2} ${nx},${ny} ${nx + 4},${ny - 2}`} />
            <text style={{
              fill: "#111", fontSize: "9px",
              fontFamily: "ui-monospace, monospace",
              textAnchor: "middle"
            }} x={nx} y={ny + 26}>S</text>
          </g>
        );
      })()}
    </svg>
    </div>
  );
}
