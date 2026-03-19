"use client";

import React, { useState } from "react";
import { Toggle } from "@/components/ui/toggle";
import {
  CMU_T, CMU_BLOCK_W, CMU_INTERIOR_W, CMU_INTERIOR_D,
  FR_GAP, FR_D,
  THIRD_FLOOR_W,
  STAIR_TREAD_DEPTH, STAIR_WIDTH,
  STAIR2_START_X, STAIR2_TOTAL_RISERS, STAIR2_LAND_TOP_W,
  TJI_DEPTH, SUBFLOOR_T,
} from "@/lib/framing-data";
import {
  CMU_W, CMU_D, CI_L, CI_R, CI_N, CI_S,
  FN_OUT, FN_IN, FS_IN, FS_OUT, FW_OUT, FW_IN, FE_IN, FE_OUT,
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
  const [showStairwell, setShowStairwell] = useState(true);

  const px = (x: number) => AL + pf(x);
  const py = (y: number) => AT + pf(y);
  const svgW = AL + pf(CMU_W) + AR;
  const svgH = AT + pf(CMU_D) + AB;

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
  // Second floor stair top: planX = FW_OUT + 286 - 36 = 259
  // Top landing: from 259 to 259+36 = 295 (at west wall)
  // The stairwell opening is the stair footprint in the 3rd floor deck.
  const nTotalLen = 286;
  const STAIR2_TREADS = STAIR2_TOTAL_RISERS - 1;
  const stair2BotX = FW_OUT + nTotalLen - STAIR2_START_X;  // 115
  const stair2TopX = stair2BotX + STAIR2_TREADS * STAIR_TREAD_DEPTH; // 259
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
      <div className="flex flex-wrap gap-1.5 px-3 py-2 bg-zinc-50 border-b border-zinc-200 sticky top-[40px] z-[9]">
        <LayerBtn label="Stairwell" on={showStairwell} toggle={() => setShowStairwell(v => !v)} />
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
            .fp-void        { fill: rgba(0,0,0,0.04); stroke: #999; stroke-width: 0.8px; stroke-dasharray: 4 3; }
            .fp-f3-edge     { fill: none; stroke: #333; stroke-width: 1.5px; stroke-dasharray: 8 4; }
          `}</style>
        </defs>

        {/* ── Title ─────────────────────────────────────────────────── */}
        <text className="fp-title" x={AL} y={AT - 28}>03 — THIRD LEVEL FLOOR PLAN (PARTIAL — WEST END)</text>
        <text className="fp-sub" x={AL} y={AT - 12}>
          SCALE: 3px = 1&quot;  |  PARTIAL FLOOR: {fmt(THIRD_FLOOR_W)} WIDE (WEST END)  |  SHED ROOF ABOVE
        </text>

        {/* ══ FULL CMU SHELL (ghost outline for context) ═══════════ */}
        <rect fill="rgba(222,218,212,0.06)" stroke="#ccc" strokeWidth="1" strokeDasharray="6 4"
          x={px(0)} y={py(0)} width={pf(CMU_W)} height={pf(CMU_D)} />

        {/* ── Void area (no floor — open to second floor below) ───── */}
        <rect className="fp-void"
          x={px(CI_L)} y={py(CI_N)}
          width={pf(f3L - CI_L)} height={pf(CMU_INTERIOR_D)} />
        <text style={{ fill: "#aaa", fontSize: "12px", fontFamily: "ui-monospace, monospace", textAnchor: "middle", letterSpacing: "0.2em" }}
          x={px(CI_L + (f3L - CI_L) / 2)} y={py(CMU_D / 2 - 10)}>
          OPEN TO BELOW
        </text>
        <text style={{ fill: "#bbb", fontSize: "9px", fontFamily: "ui-monospace, monospace", textAnchor: "middle" }}
          x={px(CI_L + (f3L - CI_L) / 2)} y={py(CMU_D / 2 + 5)}>
          (NO FLOOR — 2ND LEVEL VISIBLE)
        </text>

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
          THIRD FLOOR LOFT
        </text>
        <text style={{ fill: "#bbb", fontSize: "9px", fontFamily: "ui-monospace, monospace", textAnchor: "middle" }}
          x={px((f3L + CMU_W) / 2)} y={py(CMU_D / 2 + 5)}>
          SHED ROOF — LOW SIDE EAST, HIGH SIDE WEST
        </text>
      </svg>
    </div>
  );
}
