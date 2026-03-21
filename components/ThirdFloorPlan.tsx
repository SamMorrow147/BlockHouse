"use client";

import React, { useState } from "react";
import { Toggle } from "@/components/ui/toggle";
import {
  CMU_T, CMU_BLOCK_W, CMU_INTERIOR_W, CMU_INTERIOR_D,
  FR_GAP, FR_D,
  THIRD_FLOOR_W,
  STAIR_TREAD_DEPTH, STAIR_WIDTH, STAIR_TOTAL_RISERS,
  STAIR2_START_X, STAIR2_TOTAL_RISERS, STAIR2_LAND_TOP_W,
  TJI_DEPTH, SUBFLOOR_T, TJI_OC,
} from "@/lib/framing-data";
import {
  CMU_W, CMU_D, CI_L, CI_R, CI_N, CI_S,
  FN_OUT, FN_IN, FS_IN, FS_OUT, FW_OUT, FW_IN, FE_IN, FE_OUT,
} from "@/lib/plan-geometry";
// FW_OUT = 9" — used inline in headroom calc to avoid re-import naming conflict

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

export function ThirdFloorPlan() {
  const [showStairwell,  setShowStairwell]  = useState(true);
  const [showHeadroom,   setShowHeadroom]   = useState(true);
  const [showRoofJoists, setShowRoofJoists] = useState(false);
  const [showSubfloor,   setShowSubfloor]   = useState(false);

  const px = (x: number) => AL + pf(x);
  const py = (y: number) => AT + pf(y);
  const svgW = AL + pf(CMU_W) + AR;
  const svgH = AT + pf(CMU_D) + AB;

  // ── Stair headroom triangle (mirrors north-wall elevation geometry) ──────
  // First-floor wall height + joist stack gives floor-to-floor rise
  const WALL_H_1   = 96;                                     // 1st floor wall height (in)
  const FLOOR2_IN  = WALL_H_1 + TJI_DEPTH + SUBFLOOR_T;     // 126.25"
  // Same joist-snap logic as WallElevation.tsx (SW = 1.5" face of a 2×6)
  const SW          = 1.5;
  const joistOff3   = SW / 2;
  const f3XEndElev  = Math.floor((THIRD_FLOOR_W - joistOff3) / TJI_OC) * TJI_OC + joistOff3; // 112.75"
  const nTotalLen   = 286;                                   // north wall interior length
  const FW_OUT_N    = 9;                                     // FW_OUT from plan-geometry
  // Convert elevation x → plan x for north wall: planX = FW_OUT + totalLen - elevX
  const f3XEndPlan  = FW_OUT_N + nTotalLen - f3XEndElev;     // 182.25"
  const slope       = (FLOOR2_IN / STAIR_TOTAL_RISERS) / STAIR_TREAD_DEPTH;
  const xStairTopElev = STAIR2_START_X - (STAIR_TOTAL_RISERS - 1) * STAIR_TREAD_DEPTH;
  const hFull       = (f3XEndElev - xStairTopElev) * slope * 0.45;
  const spanFull    = hFull / slope;
  const f3XFarPlan  = f3XEndPlan - spanFull;                 // east edge of headroom zone

  // In plan view the headroom is a rectangle — the floor opening projection.
  // North wall inner face = FS_IN (large Y = bottom of plan).
  // Rectangle spans f3XFarPlan→f3XEndPlan in X and (FS_IN-STAIR_WIDTH)→FS_IN in Y.

  // ── Third floor extent ────────────────────────────────────────────
  // Partial floor: 120" wide at the WEST end of the building.
  // In plan coordinates (origin at SE exterior corner, X runs west):
  //   West CMU exterior = CMU_W = 304"
  //   The partial floor occupies the western 120" of the interior.
  //   Plan X: from (CI_R - THIRD_FLOOR_W) to CI_R  (east CMU interior)
  //   = from 296 - 120 = 176 to 296
  const f3L = CI_R - THIRD_FLOOR_W;  // 176" — east edge of 3rd floor zone
  const f3R = CI_R;                   // 296" — west CMU interior
  const f3T = CI_N;                   // 8" — south CMU interior (remember: CI_N is actually south in corrected compass)
  const f3B = CI_S;                   // 176" — north CMU interior

  // Inner frame faces for the third floor zone
  const f3FrameL = f3L + FR_GAP + FR_D;  // inner frame face at east edge of 3rd floor
  const f3FrameR = FE_IN;                 // west inner frame face (289.5")

  // ── Stairwell opening (from 2nd floor stair arriving) ─────────────
  const STAIR2_TREADS = STAIR2_TOTAL_RISERS - 1;
  const stair2BotX = FW_OUT + nTotalLen - STAIR2_START_X;
  const stair2TopX = stair2BotX + STAIR2_TREADS * STAIR_TREAD_DEPTH;
  const stairN = FS_IN;
  const stairS = FS_IN - STAIR_WIDTH;
  // The stairwell opening on the 3rd floor covers the upper portion of the stair run
  // (roughly the top half plus the top landing)
  const wellL3 = stair2TopX - 6 * STAIR_TREAD_DEPTH;  // ~6 treads back from top = 205
  const wellR3 = stair2TopX + STAIR2_LAND_TOP_W;        // 295
  const wellT3 = stairS;                                  // 133.5
  const wellB3 = stairN;                                   // 169.5

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 px-3 py-2 bg-zinc-50 border-b border-zinc-200 sticky top-[44px] z-[9]">
        <LayerBtn label="Stairwell"      on={showStairwell}  toggle={() => setShowStairwell(v => !v)} />
        <LayerBtn label="Stair Headroom" on={showHeadroom}   toggle={() => setShowHeadroom(v => !v)} />
        <LayerBtn label="Roof Joists"    on={showRoofJoists} toggle={() => setShowRoofJoists(v => !v)} />
        <LayerBtn label="Subfloor"       on={showSubfloor}   toggle={() => setShowSubfloor(v => !v)} />
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
            .fp-room      { fill: #f9f8f3; stroke: none; }
            .fp-frame     { fill: none; stroke: #111; stroke-width: 1px; stroke-linecap: square; }
            .fp-cmugap    { fill: none; stroke: #bbb; stroke-width: 0.5px; stroke-dasharray: 3 3; }
            .fp-dl        { fill: none; stroke: #1a55bb; stroke-width: 0.8px; }
            .fp-dt        { fill: #1a55bb; font-size: 10.5px; font-family: ui-monospace, monospace; text-anchor: middle; }
            .fp-wlbl      { fill: #555; font-size: 8.5px; font-family: ui-monospace, monospace;
                            text-anchor: middle; letter-spacing: 0.12em; }
            .fp-title     { fill: #111; font-size: 12px; font-family: ui-monospace, monospace; font-weight: 700; }
            .fp-sub       { fill: #666; font-size: 8.5px; font-family: ui-monospace, monospace; }
            .fp-fixture-lbl { fill: #666; font-size: 7.5px; font-family: ui-monospace, monospace; text-anchor: middle; }
            .fp-stairwell   { fill: rgba(255,220,180,0.25); stroke: #c80; stroke-width: 1.2px; stroke-dasharray: 6 3; }
            .fp-void        { fill: rgba(180,210,240,0.13); stroke: #6699bb; stroke-width: 0.8px; stroke-dasharray: 4 3; }
            .fp-f3-edge     { fill: none; stroke: #333; stroke-width: 1.5px; stroke-dasharray: 8 4; }
            .fp-railing       { fill: none; stroke: #555; stroke-width: 2px; }
            .fp-railing-post  { fill: #555; }
            .fp-subfloor      { fill: rgba(210,185,145,0.28); stroke: #a07840; stroke-width: 0.8px; stroke-linejoin: miter; }
            .fp-subfloor-grain{ fill: none; stroke: rgba(160,120,60,0.18); stroke-width: 0.5px; }
          `}</style>
        </defs>

        {/* ── Title ─────────────────────────────────────────────────── */}
        <text className="fp-title" x={AL} y={AT - 28}>03 — THIRD LEVEL FLOOR PLAN</text>
        <text className="fp-sub" x={AL} y={AT - 12}>
          SCALE: 3px = 1&quot;  |  LOFT: {fmt(THIRD_FLOOR_W)} WIDE (WEST END)  |  BALCONY (EAST END)  |  SHED ROOF ABOVE
        </text>

        {/* ══ FULL CMU SHELL (ghost outline for context) ═══════════ */}
        <rect fill="rgba(222,218,212,0.06)" stroke="#ccc" strokeWidth="1" strokeDasharray="6 4"
          x={px(0)} y={py(0)} width={pf(CMU_W)} height={pf(CMU_D)} />

        {/* ── Balcony area (no deck — open interior balcony) ───────── */}
        <rect className="fp-void"
          x={px(CI_L)} y={py(CI_N)}
          width={pf(f3L - CI_L)} height={pf(CMU_INTERIOR_D)} />
        <text style={{ fill: "#5588aa", fontSize: "13px", fontFamily: "ui-monospace, monospace", textAnchor: "middle", letterSpacing: "0.25em", fontWeight: 700 }}
          x={px(CI_L + (f3L - CI_L) / 2)} y={py(CMU_D / 2 - 8)}>
          BALCONY
        </text>
        <text style={{ fill: "#88aabb", fontSize: "8.5px", fontFamily: "ui-monospace, monospace", textAnchor: "middle" }}
          x={px(CI_L + (f3L - CI_L) / 2)} y={py(CMU_D / 2 + 6)}>
          OPEN — OVERLOOKS 2ND FLOOR
        </text>

        {/* ── Balcony railing along the floor edge (east side of loft) ── */}
        {/* Rail cap */}
        <line className="fp-railing"
          x1={px(f3L)} y1={py(FN_IN)} x2={px(f3L)} y2={py(FS_IN)} />
        {/* Balusters every 24" */}
        {Array.from({ length: Math.floor(CMU_INTERIOR_D / 24) + 1 }, (_, i) => {
          const yPos = FN_IN + i * 24;
          if (yPos > FS_IN) return null;
          return <rect key={i} className="fp-railing-post"
            x={px(f3L) - 2} y={py(yPos) - 2} width={4} height={4} />;
        })}

        {/* ══ THIRD FLOOR ZONE — solid CMU + frame ════════════════ */}

        {/* CMU fill for the western portion */}
        <rect className="fp-cmu" style={{ stroke: "none" }}
          x={px(f3L)} y={py(0)} width={pf(CMU_W - f3L)} height={pf(CMU_D)} />

        {/* CMU block pattern — west portion only */}
        {/* South wall (top) — from f3L to CMU_W */}
        {hCMUBlocks(0, f3L, CMU_W, [], px, py)}
        {/* North wall (bottom) */}
        {hCMUBlocks(CI_S, f3L, CMU_W, [], px, py)}
        {/* East edge of 3rd floor zone is NOT a CMU wall — it's an interior floor edge */}
        {/* West wall (right edge) — full height */}
        {vCMUBlocks(CI_R, 0, CMU_D, [], px, py)}

        {/* Interior clear for 3rd floor zone */}
        <rect fill="#fff" stroke="none"
          x={px(f3L)} y={py(CI_N)} width={pf(CI_R - f3L)} height={pf(CMU_INTERIOR_D)} />

        {/* Room fill */}
        <rect className="fp-room"
          x={px(f3FrameL)} y={py(FN_IN)}
          width={pf(f3FrameR - f3FrameL)} height={pf(FS_IN - FN_IN)} />

        {/* ══ SUBFLOOR / ROOF DECK SHEATHING — 3/4" T&G OSB 4×8, full building footprint ══ */}
        {showSubfloor && (() => {
          const SHEET_L = 96;
          const SHEET_W = 48;
          // Roof deck covers the ENTIRE building, not just the loft
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

        {/* CMU interior faces — only the 3 sides that have CMU */}
        {/* South (top) */}
        <line stroke="#555" strokeWidth="0.8"
          x1={px(f3L)} y1={py(CI_N)} x2={px(CI_R)} y2={py(CI_N)} />
        {/* North (bottom) */}
        <line stroke="#555" strokeWidth="0.8"
          x1={px(f3L)} y1={py(CI_S)} x2={px(CI_R)} y2={py(CI_S)} />
        {/* West (right) */}
        <line stroke="#555" strokeWidth="0.8"
          x1={px(CI_R)} y1={py(CI_N)} x2={px(CI_R)} y2={py(CI_S)} />

        {/* CMU outer border — south, north, west segments for 3rd floor */}
        <line stroke="#111" strokeWidth="1.8"
          x1={px(f3L)} y1={py(0)} x2={px(CMU_W)} y2={py(0)} />
        <line stroke="#111" strokeWidth="1.8"
          x1={px(f3L)} y1={py(CMU_D)} x2={px(CMU_W)} y2={py(CMU_D)} />
        <line stroke="#111" strokeWidth="1.8"
          x1={px(CMU_W)} y1={py(0)} x2={px(CMU_W)} y2={py(CMU_D)} />

        {/* ── 3rd floor east edge — dashed line showing floor edge ── */}
        <line className="fp-f3-edge"
          x1={px(f3L)} y1={py(0)} x2={px(f3L)} y2={py(CMU_D)} />
        <text className="fp-fixture-lbl"
          x={px(f3L) - 6} y={py(CMU_D / 2)}
          transform={`rotate(-90, ${px(f3L) - 6}, ${py(CMU_D / 2)})`}>
          FLOOR EDGE — {fmt(THIRD_FLOOR_W)} FROM WEST WALL
        </text>

        {/* ── Air gap */}
        <rect fill="#fff" stroke="none" x={px(f3L)} y={py(CI_N)} width={pf(CI_R - f3L)} height={pf(FR_GAP)} />
        <rect fill="#fff" stroke="none" x={px(f3L)} y={py(FS_OUT)} width={pf(CI_R - f3L)} height={pf(FR_GAP)} />
        <rect fill="#fff" stroke="none" x={px(FE_OUT)} y={py(CI_N)} width={pf(FR_GAP)} height={pf(CMU_INTERIOR_D)} />

        {/* ── Frame outlines — south, north, west + east floor edge ── */}
        {/* South frame (top) */}
        <line className="fp-frame" x1={px(f3FrameL)} y1={py(FN_OUT)} x2={px(FE_OUT)} y2={py(FN_OUT)} />
        <line className="fp-frame" x1={px(f3FrameL)} y1={py(FN_IN)} x2={px(FE_IN)} y2={py(FN_IN)} />
        {/* North frame (bottom) */}
        <line className="fp-frame" x1={px(f3FrameL)} y1={py(FS_OUT)} x2={px(FE_OUT)} y2={py(FS_OUT)} />
        <line className="fp-frame" x1={px(f3FrameL)} y1={py(FS_IN)} x2={px(FE_IN)} y2={py(FS_IN)} />
        {/* West frame (right) — no windows on 3rd floor */}
        <line className="fp-frame" x1={px(FE_OUT)} y1={py(FN_OUT)} x2={px(FE_OUT)} y2={py(FS_OUT)} />
        <line className="fp-frame" x1={px(FE_IN)} y1={py(FN_IN)} x2={px(FE_IN)} y2={py(FS_IN)} />

        {/* ── CMU gap dashed lines ── */}
        <line className="fp-cmugap" x1={px(f3L)} y1={py(CI_N)} x2={px(CI_R)} y2={py(CI_N)} />
        <line className="fp-cmugap" x1={px(f3L)} y1={py(CI_S)} x2={px(CI_R)} y2={py(CI_S)} />
        <line className="fp-cmugap" x1={px(CI_R)} y1={py(CI_N)} x2={px(CI_R)} y2={py(CI_S)} />

        {/* ══ ROOF DECK JOISTS (N-S span, 16" OC, FULL BUILDING) ══ */}
        {showRoofJoists && (() => {
          // Roof deck joists span the ENTIRE building — not just the loft zone.
          // They run N-S (short direction), bearing on south & north walls.
          // In plan: vertical dashed lines at varying X across full interior.
          const joistLines: React.ReactNode[] = [];
          let count = 0;
          for (let x = CI_L + TJI_OC; x < CI_R; x += TJI_OC) {
            joistLines.push(
              <line key={`rj${count++}`}
                x1={px(x)} y1={py(CI_N)} x2={px(x)} y2={py(CI_S)}
                stroke="#996633" strokeWidth="0.6" strokeDasharray="3 5" opacity="0.5" />
            );
          }
          // Rim boards at all four perimeter edges
          return (
            <g>
              {/* South rim */}
              <line key="rim-s" x1={px(CI_L)} y1={py(CI_N)} x2={px(CI_R)} y2={py(CI_N)}
                stroke="#996633" strokeWidth="2" opacity="0.4" />
              {/* North rim */}
              <line key="rim-n" x1={px(CI_L)} y1={py(CI_S)} x2={px(CI_R)} y2={py(CI_S)}
                stroke="#996633" strokeWidth="2" opacity="0.4" />
              {/* East rim */}
              <line key="rim-e" x1={px(CI_L)} y1={py(CI_N)} x2={px(CI_L)} y2={py(CI_S)}
                stroke="#996633" strokeWidth="2" opacity="0.4" />
              {/* West rim */}
              <line key="rim-w" x1={px(CI_R)} y1={py(CI_N)} x2={px(CI_R)} y2={py(CI_S)}
                stroke="#996633" strokeWidth="2" opacity="0.4" />
              {joistLines}
              <text className="fp-fixture-lbl"
                x={px((CI_L + CI_R) / 2)} y={py(CI_N + 14)}>
                ROOF DECK: {count} TJI @ {TJI_OC}&quot; OC · FULL BUILDING · {count * 2} HANGERS
              </text>
            </g>
          );
        })()}

        {/* ══ STAIRWELL OPENING ═══════════════════════════════════ */}
        {showStairwell && (
          <g>
            <rect className="fp-stairwell"
              x={px(wellL3)} y={py(wellT3)}
              width={pf(wellR3 - wellL3)} height={pf(wellB3 - wellT3)} />
            <text className="fp-fixture-lbl"
              x={px((wellL3 + wellR3) / 2)} y={py((wellT3 + wellB3) / 2) - 6}>
              STAIRWELL OPENING
            </text>
            <text className="fp-fixture-lbl"
              x={px((wellL3 + wellR3) / 2)} y={py((wellT3 + wellB3) / 2) + 4}>
              (FROM 2ND FLOOR)
            </text>
            <text className="fp-fixture-lbl"
              x={px((wellL3 + wellR3) / 2)} y={py((wellT3 + wellB3) / 2) + 14}>
              {fmt(wellR3 - wellL3)} × {fmt(wellB3 - wellT3)}
            </text>
          </g>
        )}

        {/* ══ STAIR HEADROOM OPENING (plan view = rectangle) ══════ */}
        {showHeadroom && (() => {
          // Rectangle on the NORTH side (bottom of plan).
          // FS_IN (169.5") = north wall inner frame face (large Y = bottom of SVG).
          // Spans f3XFarPlan → f3XEndPlan in X, (FS_IN - STAIR_WIDTH) → FS_IN in Y.
          const rL  = f3XFarPlan;                  // east X (toward balcony)
          const rR  = f3XEndPlan;                  // west X (floor edge)
          const rT  = FS_IN - STAIR_WIDTH;         // south edge (smaller Y = toward south/top)
          const rB  = FS_IN;                       // north wall inner face
          const midX = (rL + rR) / 2;
          const midY = (rT + rB) / 2;
          const spanIn = Math.round(spanFull);
          return (
            <g>
              {/* Rectangle — floor opening footprint */}
              <rect
                x={px(rL)} y={py(rT)}
                width={pf(rR - rL)} height={pf(rB - rT)}
                fill="rgba(180,210,240,0.22)" stroke="#4477aa" strokeWidth="1.5" strokeDasharray="6 3"
              />
              {/* Dimension: span along north wall (below the rect) */}
              {(() => {
                const yD = py(rB) + 14;
                return <>
                  <line stroke="#4477aa" strokeWidth="0.8"
                    x1={px(rL)} y1={yD - 4} x2={px(rL)} y2={yD + 4} />
                  <line stroke="#4477aa" strokeWidth="0.8"
                    x1={px(rR)} y1={yD - 4} x2={px(rR)} y2={yD + 4} />
                  <line stroke="#4477aa" strokeWidth="0.8"
                    x1={px(rL)} y1={yD} x2={px(rR)} y2={yD} />
                  <text fill="#4477aa" fontSize="8.5" fontFamily="ui-monospace,monospace" textAnchor="middle"
                    x={px(midX)} y={yD + 10}>
                    {spanIn}&quot; ({fmt(spanIn)})
                  </text>
                </>;
              })()}
              {/* Dimension: depth (stair width, to the left of rect) */}
              {(() => {
                const xD = px(rL) - 14;
                return <>
                  <line stroke="#4477aa" strokeWidth="0.8"
                    x1={xD - 4} y1={py(rT)} x2={xD + 4} y2={py(rT)} />
                  <line stroke="#4477aa" strokeWidth="0.8"
                    x1={xD - 4} y1={py(rB)} x2={xD + 4} y2={py(rB)} />
                  <line stroke="#4477aa" strokeWidth="0.8"
                    x1={xD} y1={py(rT)} x2={xD} y2={py(rB)} />
                  <text fill="#4477aa" fontSize="8.5" fontFamily="ui-monospace,monospace" textAnchor="middle"
                    transform={`translate(${xD - 10} ${py(midY)}) rotate(-90)`}>
                    {STAIR_WIDTH}&quot;
                  </text>
                </>;
              })()}
              {/* Label */}
              <text fill="#335588" fontSize="7.5" fontFamily="ui-monospace,monospace"
                fontWeight="700" textAnchor="middle" x={px(midX)} y={py(midY) - 3}>
                STAIR
              </text>
              <text fill="#335588" fontSize="7.5" fontFamily="ui-monospace,monospace"
                fontWeight="700" textAnchor="middle" x={px(midX)} y={py(midY) + 7}>
                HEADROOM
              </text>
            </g>
          );
        })()}

        {/* ══ DIMENSIONS ══════════════════════════════════════════ */}

        {/* 3rd floor width dimension (bottom) */}
        {(() => {
          const yD = AT + pf(CMU_D) + 32;
          const x1 = px(f3L); const x2 = px(CI_R);
          return (
            <g>
              <line className="fp-dl" x1={x1} y1={yD - 5} x2={x1} y2={yD + 5} />
              <line className="fp-dl" x1={x2} y1={yD - 5} x2={x2} y2={yD + 5} />
              <line className="fp-dl" x1={x1} y1={yD} x2={x2} y2={yD} />
              <text className="fp-dt" x={(x1 + x2) / 2} y={yD + 14}>
                {THIRD_FLOOR_W}&quot; ({fmt(THIRD_FLOOR_W)}) THIRD FLOOR WIDTH
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

        {/* ── WALL LABELS ──────────────────────────────────────────── */}
        <text className="fp-wlbl" x={px((f3L + CMU_W) / 2)} y={AT - 40}>SOUTH</text>
        <text className="fp-wlbl" x={px((f3L + CMU_W) / 2)} y={AT + pf(CMU_D) + 58}>NORTH</text>
        <text className="fp-wlbl"
          transform={`translate(${AL + pf(CMU_W) + 26} ${AT + pf(CMU_D / 2)}) rotate(90)`}>WEST</text>

        {/* ── ROOM LABEL ───────────────────────────────────────────── */}
        <text style={{ fill: "#999", fontSize: "14px", fontFamily: "ui-monospace, monospace", textAnchor: "middle", letterSpacing: "0.3em" }}
          x={px((f3L + CMU_W) / 2)} y={py(CMU_D / 2 - 20)}>
          LOFT
        </text>
        <text style={{ fill: "#bbb", fontSize: "9px", fontFamily: "ui-monospace, monospace", textAnchor: "middle" }}
          x={px((f3L + CMU_W) / 2)} y={py(CMU_D / 2 + 5)}>
          SHED ROOF — LOW EAST, HIGH WEST
        </text>
      </svg>
    </div>
  );
}
