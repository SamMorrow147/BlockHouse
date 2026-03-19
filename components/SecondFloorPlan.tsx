"use client";

import React, { useState } from "react";
import { Toggle } from "@/components/ui/toggle";
import {
  CMU_T, CMU_BLOCK_W, CMU_INTERIOR_W, CMU_INTERIOR_D,
  FR_GAP, FR_D, INT_D,
  secondFloorSouthWall, secondFloorNorthWall,
  secondFloorWestWall, secondFloorEastWall,
  STAIR_TREAD_DEPTH, STAIR_WIDTH, STAIR_MAIN_STEPS,
  STAIR_LAND_RISERS, STAIR_TOTAL_RISERS,
  STAIR2_START_X, STAIR2_TOTAL_RISERS, STAIR2_LAND_TOP_W, STAIR2_LAND_BOT_W,
  PARTITION_WALL_R, PARTITION_V_OFFSET,
  TJI_DEPTH, SUBFLOOR_T,
} from "@/lib/framing-data";
import { computeWallLayout } from "@/lib/layout-calculator";
import {
  CMU_W, CMU_D, CI_L, CI_R, CI_N, CI_S,
  FN_OUT, FN_IN, FS_IN, FS_OUT, FW_OUT, FW_IN, FE_IN, FE_OUT,
  NW_L, NW_R,
} from "@/lib/plan-geometry";

// ── Scale & Margins ────────────────────────────────────────────────────
const FP_PX = 3;
const AL = 140;
const AT = 56;
const AR = 62;
const AB = 68;

const pf = (n: number) => n * FP_PX;
const fmt = (n: number) => {
  const ft = Math.floor(n / 12);
  const ins = Math.round((n % 12) * 4) / 4;
  if (ft === 0) return `${ins}"`;
  if (ins === 0) return `${ft}'-0"`;
  return `${ft}'-${ins}"`;
};

const CMU_BL = CMU_BLOCK_W;

// ── Reuse clipRects / hCMUBlocks / vCMUBlocks from first floor (inlined) ──

function clipRects(
  keyPfx: string, fixedA: number, fixedSz: number,
  segFrom: number, segTo: number,
  voidsPx: { a: number; b: number }[], horiz: boolean,
): React.ReactElement[] {
  const rects: React.ReactElement[] = [];
  let cur = segFrom;
  const sorted = voidsPx.filter(v => v.a < segTo && v.b > segFrom).sort((a, b) => a.a - b.a);
  const emit = (x1: number, x2: number, key: string) => {
    if (x2 <= x1) return;
    rects.push(horiz
      ? <rect key={key} className="fp-cmu-block" x={x1} y={fixedA} width={x2 - x1} height={fixedSz} />
      : <rect key={key} className="fp-cmu-block" x={fixedA} y={x1} width={fixedSz} height={x2 - x1} />
    );
  };
  for (const v of sorted) { emit(cur, v.a, `${keyPfx}v${v.a}`); cur = Math.max(cur, v.b); }
  emit(cur, segTo, `${keyPfx}end`);
  return rects;
}

function hCMUBlocks(
  yBand: number, xFrom: number, xTo: number,
  voids: { l: number; r: number }[],
  ppx: (n: number) => number, ppy: (n: number) => number,
): React.ReactElement[] {
  const rects: React.ReactElement[] = [];
  const yPx = ppy(yBand); const hPx = pf(CMU_T);
  const vPx = voids.map(v => ({ a: ppx(v.l), b: ppx(v.r) }));
  let bx = Math.floor(xFrom / CMU_BL) * CMU_BL;
  while (bx < xTo) {
    const bL = Math.max(xFrom, bx); const bR = Math.min(xTo, bx + CMU_BL);
    if (bR > bL) rects.push(...clipRects(`hx${bx}`, yPx, hPx, ppx(bL), ppx(bR), vPx, true));
    bx += CMU_BL;
  }
  return rects;
}

function vCMUBlocks(
  xBand: number, yFrom: number, yTo: number,
  voids: { t: number; b: number }[],
  ppx: (n: number) => number, ppy: (n: number) => number,
): React.ReactElement[] {
  const rects: React.ReactElement[] = [];
  const xPx = ppx(xBand); const wPx = pf(CMU_T);
  const vPx = voids.map(v => ({ a: ppy(v.t), b: ppy(v.b) }));
  let by = Math.floor(yFrom / CMU_BL) * CMU_BL;
  while (by < yTo) {
    const bT = Math.max(yFrom, by); const bB = Math.min(yTo, by + CMU_BL);
    if (bB > bT) rects.push(...clipRects(`vy${by}`, xPx, wPx, ppy(bT), ppy(bB), vPx, false));
    by += CMU_BL;
  }
  return rects;
}

function LayerBtn({ label, on, toggle }: { label: string; on: boolean; toggle: () => void }) {
  return (
    <Toggle pressed={on} onPressedChange={toggle} size="sm" variant="outline"
      className="h-7 px-3 text-xs font-mono rounded-full border-zinc-300 text-zinc-600
                 data-[state=on]:bg-zinc-800 data-[state=on]:text-white
                 data-[state=on]:border-zinc-800 hover:bg-zinc-100
                 data-[state=on]:hover:bg-zinc-700 transition-all"
    >{label}</Toggle>
  );
}

export function SecondFloorPlan() {
  const [showStairs,    setShowStairs]    = useState(true);
  const [showStairwell, setShowStairwell] = useState(true);
  const [showJoists,    setShowJoists]    = useState(false);
  const [showSubfloor,  setShowSubfloor]  = useState(false);

  // ── SVG coordinate helpers ──────────────────────────────────────────
  const px = (x: number) => AL + pf(x);
  const py = (y: number) => AT + pf(y);
  const svgW = AL + pf(CMU_W) + AR;
  const svgH = AT + pf(CMU_D) + AB;

  // ── Second floor openings — convert elevation positions to plan coords ──
  // South wall (plan: top edge, south exterior). South elevation X = plan X offset from FW_OUT.
  const sWin = secondFloorSouthWall.openings[0]; // 40" window at pos 166
  const S2W_L = FW_OUT + sWin.positionFromLeftInches;
  const S2W_R = S2W_L + sWin.widthInches;

  // North wall (mirrored): elevation X → plan X = FW_OUT + totalLen - elevX
  const nTotalLen = secondFloorNorthWall.totalLengthInches; // 286
  // North wall has NO openings

  // East wall: elevation X → plan Y = FS_OUT - elevX
  const eWin = secondFloorEastWall.openings[0]; // 40" window at pos 54 from left (left=north)
  const E2W_B = FS_OUT - eWin.positionFromLeftInches;
  const E2W_T = FS_OUT - (eWin.positionFromLeftInches + eWin.widthInches);

  // West wall: elevation X → plan Y = FN_OUT + elevX
  const wWin = secondFloorWestWall.openings[0]; // 71" picture window at pos 48 from left (left=south)
  const W2D_T = FN_OUT + wWin.positionFromLeftInches;
  const W2D_B = W2D_T + wWin.widthInches;

  // ── Stairwell opening (from first floor stair coming up) ──────────
  // The first floor main stair runs E-W along the north wall:
  //   landing: plan X from partWallR+INT_D (99.5") to NW_R (144")
  //   main run: from landing west edge (144") going west, 12 treads × 9" = 108"
  //   so stair run goes from plan X=144 to plan X=252
  //   stair width = 36", running N-S from FS_IN (169.5") inward = 133.5" to 169.5"
  // The floor opening needs to be at least the full stair footprint.
  const landL_plan = PARTITION_WALL_R + INT_D;  // 99.5"
  const stairR_plan = NW_R + STAIR_MAIN_STEPS * STAIR_TREAD_DEPTH; // 144 + 12×9 = 252
  const stairN_plan = FS_IN;                    // 169.5"
  const stairS_plan = FS_IN - STAIR_WIDTH;      // 133.5"

  // Full stairwell opening = landing + main run
  const wellL = landL_plan;     // 99.5"
  const wellR = stairR_plan;    // 252"
  const wellT = stairS_plan;    // 133.5"
  const wellB = stairN_plan;    // 169.5"

  // ── Second floor stair (going UP to third floor) ──────────────────
  // Per framing-data: STAIR2_START_X = 180 (elevation X on north wall, bottom of run)
  // Runs from 180" to 36" in elevation X (going west=up)
  // In plan: elevation X → plan X (north wall mirrored): planX = FW_OUT + 286 - elevX
  // Bottom: planX = 9 + 286 - 180 = 115
  // Top:    planX = 9 + 286 - 36 = 259
  const STAIR2_TREADS = STAIR2_TOTAL_RISERS - 1; // 16 treads
  const stair2BotX = FW_OUT + nTotalLen - STAIR2_START_X;  // 115
  const stair2TopX = stair2BotX + STAIR2_TREADS * STAIR_TREAD_DEPTH; // 115 + 16×9 = 259
  const stair2N = FS_IN;
  const stair2S = FS_IN - STAIR_WIDTH;

  // Bottom landing (at second floor level)
  const botLandL = stair2BotX - STAIR2_LAND_BOT_W; // 115 - 36 = 79
  const botLandR = stair2BotX;                       // 115

  // Top landing (at third floor, but shown as the arrival point)
  const topLandL = stair2TopX;                        // 259
  const topLandR = stair2TopX + STAIR2_LAND_TOP_W;   // 259 + 36 = 295 (at west wall)

  // ── Stud layouts ──────────────────────────────────────────────────
  const nStuds = computeWallLayout(secondFloorSouthWall).studs; // south exterior = top
  const sStuds = computeWallLayout(secondFloorNorthWall).studs; // north exterior = bottom
  const wStuds = computeWallLayout(secondFloorEastWall).studs;  // east exterior = left
  const eStuds = computeWallLayout(secondFloorWestWall).studs;  // west exterior = right

  // ── TJI joist positions (N-S span, 16" OC) ───────────────────────
  // Joists run north-south (short direction ~168"), bearing on east & west walls.
  // In plan, they appear as VERTICAL lines at varying X positions.
  const TJI_OC = 16;
  const joistPositions: number[] = [];
  for (let x = CI_L + TJI_OC; x < CI_R; x += TJI_OC) {
    joistPositions.push(x);
  }

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 px-3 py-2 bg-zinc-50 border-b border-zinc-200 sticky top-[44px] z-[9]">
        <LayerBtn label="Stairs"     on={showStairs}    toggle={() => setShowStairs(v => !v)} />
        <LayerBtn label="Stairwell"  on={showStairwell} toggle={() => setShowStairwell(v => !v)} />
        <LayerBtn label="Joists"     on={showJoists}    toggle={() => setShowJoists(v => !v)} />
        <LayerBtn label="Subfloor"   on={showSubfloor}  toggle={() => setShowSubfloor(v => !v)} />
      </div>
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
            .fp-win       { fill: none; stroke: #333; stroke-width: 0.8px; }
            .fp-dl        { fill: none; stroke: #1a55bb; stroke-width: 0.8px; }
            .fp-dt        { fill: #1a55bb; font-size: 10.5px; font-family: ui-monospace, monospace; text-anchor: middle; }
            .fp-wlbl      { fill: #555; font-size: 8.5px; font-family: ui-monospace, monospace;
                            text-anchor: middle; letter-spacing: 0.12em; }
            .fp-olbl      { fill: #333; font-size: 9px; font-family: ui-monospace, monospace; text-anchor: middle; }
            .fp-title     { fill: #111; font-size: 12px; font-family: ui-monospace, monospace; font-weight: 700; }
            .fp-sub       { fill: #666; font-size: 8.5px; font-family: ui-monospace, monospace; }
            .fp-stair-run   { fill: #f0ece2; stroke: #555; stroke-width: 1px; }
            .fp-stair-tread { fill: none; stroke: #666; stroke-width: 0.7px; }
            .fp-stair-cut   { fill: none; stroke: #333; stroke-width: 1.2px; stroke-dasharray: 6 3; }
            .fp-up-arrow    { fill: none; stroke: #333; stroke-width: 1px; marker-end: url(#arrowhead); }
            .fp-fixture-lbl { fill: #666; font-size: 7.5px; font-family: ui-monospace, monospace; text-anchor: middle; }
            .fp-platform    { fill: #e8e4d8; stroke: #555; stroke-width: 1px; }
            .fp-stairwell   { fill: rgba(255,220,180,0.25); stroke: #c80; stroke-width: 1.2px; stroke-dasharray: 6 3; }
            .fp-joist-line    { fill: none; stroke: #bbb; stroke-width: 0.5px; stroke-dasharray: 2 4; }
            .fp-subfloor      { fill: rgba(210,185,145,0.28); stroke: #a07840; stroke-width: 0.8px; stroke-linejoin: miter; }
            .fp-subfloor-grain{ fill: none; stroke: rgba(160,120,60,0.18); stroke-width: 0.5px; }
          `}</style>
          <marker id="arrowhead" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
            <path d="M0,0 L0,6 L6,3 z" fill="#333" />
          </marker>
        </defs>

        {/* ── Title ─────────────────────────────────────────────────── */}
        <text className="fp-title" x={AL} y={AT - 28}>02 — SECOND LEVEL FLOOR PLAN</text>
        <text className="fp-sub" x={AL} y={AT - 12}>
          SCALE: 3px = 1&quot;  |  8&quot; CMU WALLS  |  2×6 WOOD FRAME  |  DECK @ {fmt(TJI_DEPTH + SUBFLOOR_T + 116)} AFF
        </text>

        {/* ══ CMU WALLS ══════════════════════════════════════════════ */}
        <rect className="fp-cmu" style={{ stroke: "none" }}
          x={px(0)} y={py(0)} width={pf(CMU_W)} height={pf(CMU_D)} />

        {/* CMU outer border — continuous (no doors on second floor exterior) */}
        <rect fill="none" stroke="#111" strokeWidth="1.8"
          x={px(0)} y={py(0)} width={pf(CMU_W)} height={pf(CMU_D)} />

        {/* Yellow CMU block pattern */}
        {hCMUBlocks(0, 0, CMU_W, [], px, py)}
        {hCMUBlocks(CI_S, 0, CMU_W, [], px, py)}
        {vCMUBlocks(0, 0, CMU_D, [], px, py)}
        {vCMUBlocks(CI_R, 0, CMU_D, [], px, py)}

        {/* Interior clear */}
        <rect fill="#fff" stroke="none"
          x={px(CI_L)} y={py(CI_N)} width={pf(CMU_INTERIOR_W)} height={pf(CMU_INTERIOR_D)} />

        {/* CMU interior face */}
        <rect fill="none" stroke="#555" strokeWidth="0.8"
          x={px(CI_L)} y={py(CI_N)} width={pf(CMU_INTERIOR_W)} height={pf(CMU_INTERIOR_D)} />

        {/* CMU outer border on top */}
        <rect fill="none" stroke="#111" strokeWidth="1.8"
          x={px(0)} y={py(0)} width={pf(CMU_W)} height={pf(CMU_D)} />

        {/* ── Room interior cream fill ──────────────────────────────── */}
        <rect className="fp-room"
          x={px(FW_IN)} y={py(FN_IN)}
          width={pf(FE_IN - FW_IN)} height={pf(FS_IN - FN_IN)} />

        {/* ══ SUBFLOOR SHEET LAYOUT — 3/4" T&G OSB 4×8, long edge E-W ══ */}
        {showSubfloor && (() => {
          const SHEET_L = 96;
          const SHEET_W = 48;
          const x1 = FW_IN, x2 = FE_IN, y1 = FN_IN, y2 = FS_IN;
          const sheets: { x: number; y: number; w: number; h: number; label: boolean }[] = [];
          let row = 0;
          for (let ry = y1; ry < y2; ry += SHEET_W, row++) {
            const cy2 = Math.min(ry + SHEET_W, y2);
            const xOff = (row % 2 === 0) ? 0 : SHEET_L / 2;
            for (let sx = x1 - xOff; sx < x2; sx += SHEET_L) {
              const cx1 = Math.max(sx, x1), cx2 = Math.min(sx + SHEET_L, x2);
              if (cx2 <= cx1) continue;
              sheets.push({ x: cx1, y: ry, w: cx2 - cx1, h: cy2 - ry, label: cx2 - cx1 > 48 && cy2 - ry > 20 });
            }
          }
          return (
            <g>
              {sheets.map((s, i) => (
                <g key={`sf${i}`}>
                  <rect className="fp-subfloor" x={px(s.x)} y={py(s.y)} width={pf(s.w)} height={pf(s.h)} />
                  {Array.from({ length: Math.floor(s.w / 12) - 1 }, (_, gi) => {
                    const gx = s.x + (gi + 1) * 12;
                    return gx < s.x + s.w
                      ? <line key={`g${gi}`} className="fp-subfloor-grain" x1={px(gx)} y1={py(s.y)} x2={px(gx)} y2={py(s.y + s.h)} />
                      : null;
                  })}
                  {s.label && <text x={px(s.x + s.w / 2)} y={py(s.y + s.h / 2) + 4} textAnchor="middle" fontSize="7" fill="#8B6030" fontFamily="ui-monospace,monospace" opacity={0.8}>4×8 T&G</text>}
                </g>
              ))}
            </g>
          );
        })()}

        {/* ── 1" air gap ────────────────────────────────────────────── */}
        <rect fill="#fff" stroke="none" x={px(CI_L)} y={py(CI_N)} width={pf(CMU_INTERIOR_W)} height={pf(FR_GAP)} />
        <rect fill="#fff" stroke="none" x={px(CI_L)} y={py(FS_OUT)} width={pf(CMU_INTERIOR_W)} height={pf(FR_GAP)} />
        <rect fill="#fff" stroke="none" x={px(CI_L)} y={py(CI_N)} width={pf(FR_GAP)} height={pf(CMU_INTERIOR_D)} />
        <rect fill="#fff" stroke="none" x={px(FE_OUT)} y={py(CI_N)} width={pf(FR_GAP)} height={pf(CMU_INTERIOR_D)} />

        {/* ── Opening cuts in wood frame zone ───────────────────────── */}
        {/* South window */}
        <rect fill="#fff" stroke="none"
          x={px(S2W_L)} y={py(FN_OUT)} width={pf(sWin.widthInches)} height={pf(FR_D)} />
        {/* East window */}
        <rect fill="#fff" stroke="none"
          x={px(FW_OUT)} y={py(E2W_T)} width={pf(FR_D)} height={pf(eWin.widthInches)} />
        {/* West picture window */}
        <rect fill="#fff" stroke="none"
          x={px(FE_IN)} y={py(W2D_T)} width={pf(FR_D)} height={pf(wWin.widthInches)} />

        {/* ── CMU gap dashed lines ──────────────────────────────────── */}
        <line className="fp-cmugap" x1={px(CI_L)} y1={py(CI_N)} x2={px(CI_R)} y2={py(CI_N)} />
        <line className="fp-cmugap" x1={px(CI_L)} y1={py(CI_S)} x2={px(CI_R)} y2={py(CI_S)} />
        <line className="fp-cmugap" x1={px(CI_L)} y1={py(CI_N)} x2={px(CI_L)} y2={py(CI_S)} />
        <line className="fp-cmugap" x1={px(CI_R)} y1={py(CI_N)} x2={px(CI_R)} y2={py(CI_S)} />

        {/* ── Wood frame outlines ───────────────────────────────────── */}
        {/* South frame */}
        <line className="fp-frame" x1={px(FW_OUT)} y1={py(FN_OUT)} x2={px(S2W_L)} y2={py(FN_OUT)} />
        <line className="fp-frame" x1={px(S2W_R)} y1={py(FN_OUT)} x2={px(FE_OUT)} y2={py(FN_OUT)} />
        <line className="fp-frame" x1={px(FW_IN)} y1={py(FN_IN)} x2={px(S2W_L)} y2={py(FN_IN)} />
        <line className="fp-frame" x1={px(S2W_R)} y1={py(FN_IN)} x2={px(FE_IN)} y2={py(FN_IN)} />
        {/* North frame (no openings) */}
        <line className="fp-frame" x1={px(FW_OUT)} y1={py(FS_OUT)} x2={px(FE_OUT)} y2={py(FS_OUT)} />
        <line className="fp-frame" x1={px(FW_IN)} y1={py(FS_IN)} x2={px(FE_IN)} y2={py(FS_IN)} />
        {/* East frame */}
        <line className="fp-frame" x1={px(FW_OUT)} y1={py(FN_OUT)} x2={px(FW_OUT)} y2={py(E2W_T)} />
        <line className="fp-frame" x1={px(FW_OUT)} y1={py(E2W_B)} x2={px(FW_OUT)} y2={py(FS_OUT)} />
        <line className="fp-frame" x1={px(FW_IN)} y1={py(FN_IN)} x2={px(FW_IN)} y2={py(E2W_T)} />
        <line className="fp-frame" x1={px(FW_IN)} y1={py(E2W_B)} x2={px(FW_IN)} y2={py(FS_IN)} />
        {/* West frame */}
        <line className="fp-frame" x1={px(FE_OUT)} y1={py(FN_OUT)} x2={px(FE_OUT)} y2={py(W2D_T)} />
        <line className="fp-frame" x1={px(FE_OUT)} y1={py(W2D_B)} x2={px(FE_OUT)} y2={py(FS_OUT)} />
        <line className="fp-frame" x1={px(FE_IN)} y1={py(FN_IN)} x2={px(FE_IN)} y2={py(W2D_T)} />
        <line className="fp-frame" x1={px(FE_IN)} y1={py(W2D_B)} x2={px(FE_IN)} y2={py(FS_IN)} />

        {/* ── Studs ─────────────────────────────────────────────────── */}
        {/* South studs (top of plan) */}
        {nStuds.map((s, i) => {
          const sx = FW_OUT + s.x;
          return <line key={`ns${i}`} className="fp-stud"
            x1={px(sx)} y1={py(FN_OUT)} x2={px(sx)} y2={py(FN_IN)} />;
        })}
        {/* North studs (bottom of plan) */}
        {sStuds.map((s, i) => {
          const sx = FW_OUT + nTotalLen - s.x; // mirrored
          return <line key={`ss${i}`} className="fp-stud"
            x1={px(sx)} y1={py(FS_IN)} x2={px(sx)} y2={py(FS_OUT)} />;
        })}
        {/* East studs (left of plan) */}
        {wStuds.map((s, i) => {
          const sy = FS_OUT - s.x; // east elevation: left=north, mirrored
          return <line key={`ws${i}`} className="fp-stud"
            x1={px(FW_OUT)} y1={py(sy)} x2={px(FW_IN)} y2={py(sy)} />;
        })}
        {/* West studs (right of plan) */}
        {eStuds.map((s, i) => {
          const sy = FN_OUT + s.x; // west elevation: left=south
          return <line key={`es${i}`} className="fp-stud"
            x1={px(FE_IN)} y1={py(sy)} x2={px(FE_OUT)} y2={py(sy)} />;
        })}

        {/* ── TJI Joists (optional layer) ──────────────────────────── */}
        {showJoists && joistPositions.map((x, i) => (
          <line key={`j${i}`} className="fp-joist-line"
            x1={px(x)} y1={py(FN_IN)} x2={px(x)} y2={py(FS_IN)} />
        ))}

        {/* ══ STAIRWELL OPENING (from 1st floor) ═══════════════════ */}
        {showStairwell && (
          <g>
            <rect className="fp-stairwell"
              x={px(wellL)} y={py(wellT)}
              width={pf(wellR - wellL)} height={pf(wellB - wellT)} />
            <text className="fp-fixture-lbl"
              x={px((wellL + wellR) / 2)} y={py((wellT + wellB) / 2) - 6}>
              STAIRWELL OPENING
            </text>
            <text className="fp-fixture-lbl"
              x={px((wellL + wellR) / 2)} y={py((wellT + wellB) / 2) + 4}>
              (FROM 1ST FLOOR)
            </text>
            <text className="fp-fixture-lbl"
              x={px((wellL + wellR) / 2)} y={py((wellT + wellB) / 2) + 14}>
              {fmt(wellR - wellL)} × {fmt(wellB - wellT)}
            </text>
          </g>
        )}

        {/* ══ SECOND FLOOR STAIR (going UP to 3rd floor) ═══════════ */}
        {showStairs && (() => {
          const TREAD = STAIR_TREAD_DEPTH;
          const SW = STAIR_WIDTH;
          const NUM_TREADS = STAIR2_TREADS;

          // Bottom landing
          const bLandT = stair2S;
          const bLandB = stair2N;

          // Main stair run — E to W along north wall
          const mainTreads: number[] = [];
          for (let i = 1; i <= NUM_TREADS; i++) mainTreads.push(stair2BotX + i * TREAD);

          const cutX = stair2BotX + Math.round(NUM_TREADS / 2) * TREAD;

          return (
            <g>
              {/* Bottom landing */}
              <rect className="fp-platform"
                x={px(botLandL)} y={py(bLandT)}
                width={pf(botLandR - botLandL)} height={pf(SW)} />
              <rect fill="none" stroke="#555" strokeWidth="1"
                x={px(botLandL)} y={py(bLandT)}
                width={pf(botLandR - botLandL)} height={pf(SW)} />
              <text className="fp-fixture-lbl"
                x={px((botLandL + botLandR) / 2)} y={py(bLandT + SW / 2)}>
                LANDING
              </text>

              {/* Main stair run */}
              <rect className="fp-stair-run"
                x={px(stair2BotX)} y={py(stair2S)}
                width={pf(stair2TopX - stair2BotX)} height={pf(SW)} />
              <rect fill="none" stroke="#555" strokeWidth="1"
                x={px(stair2BotX)} y={py(stair2S)}
                width={pf(stair2TopX - stair2BotX)} height={pf(SW)} />
              {mainTreads.map((tx, i) => (
                <line key={`s2t${i}`} className="fp-stair-tread"
                  x1={px(tx)} y1={py(stair2S)}
                  x2={px(tx)} y2={py(stair2N)} />
              ))}
              {/* Mid-flight cut line */}
              <polyline className="fp-stair-cut"
                points={`${px(cutX)},${py(stair2S)} ${px(cutX - 4)},${py(stair2S + SW * 0.3)} ${px(cutX + 4)},${py(stair2S + SW * 0.7)} ${px(cutX)},${py(stair2N)}`} />
              {/* UP arrow — going west (right in plan) */}
              <line className="fp-up-arrow"
                x1={px(stair2BotX + 5)} y1={py(stair2S + SW / 2)}
                x2={px(cutX - 8)} y2={py(stair2S + SW / 2)} />
              <text className="fp-fixture-lbl"
                x={px(stair2BotX + (cutX - stair2BotX) / 2)} y={py(stair2S + SW / 2 - 5)}>
                UP TO 3RD
              </text>
              <text className="fp-fixture-lbl"
                x={px(stair2BotX + (cutX - stair2BotX) / 2)} y={py(stair2S + SW / 2 + 12)}>
                {NUM_TREADS}R
              </text>

              {/* Top landing (at 3rd floor level) — shown dashed as it's above */}
              <rect fill="rgba(232,228,216,0.3)" stroke="#888" strokeWidth="0.8" strokeDasharray="4 2"
                x={px(topLandL)} y={py(stair2S)}
                width={pf(topLandR - topLandL)} height={pf(SW)} />
              <text className="fp-fixture-lbl"
                x={px((topLandL + topLandR) / 2)} y={py(stair2S + SW / 2)}>
                3RD FL LANDING
              </text>
            </g>
          );
        })()}

        {/* ══ WINDOW SYMBOLS ═══════════════════════════════════════ */}

        {/* South window — three parallel lines */}
        {[0.2, 0.5, 0.8].map((t, i) => (
          <line key={`sw${i}`} className="fp-win"
            x1={px(S2W_L)} y1={py(FN_OUT + t * FR_D)}
            x2={px(S2W_R)} y2={py(FN_OUT + t * FR_D)} />
        ))}

        {/* East window — three parallel lines (vertical) */}
        {[0.2, 0.5, 0.8].map((t, i) => (
          <line key={`ew${i}`} className="fp-win"
            x1={px(FW_OUT + t * FR_D)} y1={py(E2W_T)}
            x2={px(FW_OUT + t * FR_D)} y2={py(E2W_B)} />
        ))}

        {/* West picture window — three parallel lines (vertical) */}
        {[0.2, 0.5, 0.8].map((t, i) => (
          <line key={`ww${i}`} className="fp-win"
            x1={px(FE_IN + t * FR_D)} y1={py(W2D_T)}
            x2={px(FE_IN + t * FR_D)} y2={py(W2D_B)} />
        ))}

        {/* ══ DIMENSION ANNOTATIONS ════════════════════════════════ */}

        {/* Interior width (bottom) */}
        {(() => {
          const yD = AT + pf(CMU_D) + 32;
          const x1 = px(CI_L); const x2 = px(CI_R);
          return (
            <g>
              <line className="fp-dl" x1={x1} y1={yD - 5} x2={x1} y2={yD + 5} />
              <line className="fp-dl" x1={x2} y1={yD - 5} x2={x2} y2={yD + 5} />
              <line className="fp-dl" x1={x1} y1={yD} x2={x2} y2={yD} />
              <text className="fp-dt" x={(x1 + x2) / 2} y={yD + 14}>
                {CMU_INTERIOR_W}&quot; ({fmt(CMU_INTERIOR_W)}) INTERIOR WIDTH
              </text>
            </g>
          );
        })()}

        {/* Interior depth (left) */}
        {(() => {
          const xD = AL - 44;
          const y1 = py(CI_N); const y2 = py(CI_S);
          return (
            <g>
              <line className="fp-dl" x1={xD - 5} y1={y1} x2={xD + 5} y2={y1} />
              <line className="fp-dl" x1={xD - 5} y1={y2} x2={xD + 5} y2={y2} />
              <line className="fp-dl" x1={xD} y1={y1} x2={xD} y2={y2} />
              <text className="fp-dt" transform={`translate(${xD - 13} ${(y1 + y2) / 2}) rotate(-90)`}>
                {CMU_INTERIOR_D}&quot; ({fmt(CMU_INTERIOR_D)}) INTERIOR DEPTH
              </text>
            </g>
          );
        })()}

        {/* Window labels */}
        <text className="fp-olbl" x={px((S2W_L + S2W_R) / 2)} y={AT - 4}>
          {sWin.label || `${fmt(sWin.widthInches)} × ${fmt(sWin.heightInches)}`} WIN
        </text>
        <text className="fp-olbl"
          transform={`translate(${AL - 12} ${py((E2W_T + E2W_B) / 2)}) rotate(-90)`}>
          {eWin.label || `${fmt(eWin.widthInches)} × ${fmt(eWin.heightInches)}`} WIN
        </text>
        <text className="fp-olbl"
          transform={`translate(${AL + pf(CMU_W) + 12} ${py((W2D_T + W2D_B) / 2)}) rotate(90)`}>
          {wWin.openingSubtype || "PICTURE"} {wWin.label || `${fmt(wWin.widthInches)} × ${fmt(wWin.heightInches)}`}
        </text>

        {/* ── WALL LABELS ──────────────────────────────────────────── */}
        <text className="fp-wlbl" x={px(CMU_W / 2)} y={AT - 40}>SOUTH</text>
        <text className="fp-wlbl" x={px(CMU_W / 2)} y={AT + pf(CMU_D) + 58}>NORTH</text>
        <text className="fp-wlbl"
          transform={`translate(${AL - 14} ${AT + pf(CMU_D / 2)}) rotate(-90)`}>EAST</text>
        <text className="fp-wlbl"
          transform={`translate(${AL + pf(CMU_W) + 26} ${AT + pf(CMU_D / 2)}) rotate(90)`}>WEST</text>

        {/* ── ROOM LABEL ───────────────────────────────────────────── */}
        <text style={{ fill: "#999", fontSize: "14px", fontFamily: "ui-monospace, monospace", textAnchor: "middle", letterSpacing: "0.3em" }}
          x={px(CMU_W / 2)} y={py(CMU_D / 2 - 20)}>
          OPEN SECOND FLOOR
        </text>
      </svg>
    </div>
  );
}
