"use client";

import React, { useState } from "react";
import { Toggle } from "@/components/ui/toggle";
import {
  CMU_T, CMU_BLOCK_W, CMU_INTERIOR_W, CMU_INTERIOR_D,
  FR_GAP, FR_D,
  VESTIBULE_W, VESTIBULE_D,
  STAIR_TREAD_DEPTH, STAIR_WIDTH, STAIR_TOTAL_RISERS,
  STAIR2_START_X, STAIR2_TOTAL_RISERS, STAIR2_LAND_TOP_W,
  TJI_DEPTH, SUBFLOOR_T, TJI_OC,
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
const SW = 1.5;

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
  const [showRoofJoists, setShowRoofJoists] = useState(false);
  const [showSubfloor,   setShowSubfloor]   = useState(false);

  const px = (x: number) => AL + pf(x);
  const py = (y: number) => AT + pf(y);
  const svgW = AL + pf(CMU_W) + AR;
  const svgH = AT + pf(CMU_D) + AB;

  // ── Structure position (NW corner of interior) ────────────────────────
  // 6' (E-W) × 3' (N-S), tucked against west and north CMU walls
  const vestR  = FE_IN;                    // west inner frame face
  const vestL  = FE_IN - VESTIBULE_W;      // east face of structure
  const vestB  = FS_IN;                    // north inner frame face
  const vestT  = FS_IN - VESTIBULE_D;      // south face of structure

  // ── Stairwell opening (from 2nd floor stair arriving) ─────────────
  const nTotalLen = 286;
  const STAIR2_TREADS = STAIR2_TOTAL_RISERS - 1;
  const stair2BotX = FW_OUT + nTotalLen - STAIR2_START_X;
  const stair2TopX = stair2BotX + STAIR2_TREADS * STAIR_TREAD_DEPTH;
  const wellL3 = stair2TopX - 6 * STAIR_TREAD_DEPTH;
  const wellR3 = stair2TopX + STAIR2_LAND_TOP_W;
  const wellT3 = FS_IN - STAIR_WIDTH;
  const wellB3 = FS_IN;

  // ── Railing post spacing ──────────────────────────────────────────
  const RAILING_SPACING = 36;

  return (
    <div>
      <div className="flex flex-wrap gap-1.5 px-3 py-2 bg-zinc-50 border-b border-zinc-200 sticky top-[44px] z-[9]">
        <LayerBtn label="Stairwell"      on={showStairwell}  toggle={() => setShowStairwell(v => !v)} />
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
            .fp-railing       { fill: none; stroke: #555; stroke-width: 2px; }
            .fp-railing-post  { fill: #555; }
            .fp-vestibule     { fill: #f0ece2; stroke: #333; stroke-width: 1.5px; }
            .fp-vest-wall     { fill: none; stroke: #222; stroke-width: 2px; }
            .fp-deck          { fill: rgba(210,200,175,0.15); stroke: none; }
            .fp-subfloor      { fill: rgba(210,185,145,0.28); stroke: #a07840; stroke-width: 0.8px; stroke-linejoin: miter; }
            .fp-subfloor-grain{ fill: none; stroke: rgba(160,120,60,0.18); stroke-width: 0.5px; }
          `}</style>
        </defs>

        {/* ── Title ─────────────────────────────────────────────────── */}
        <text className="fp-title" x={AL} y={AT - 28}>03 — THIRD LEVEL FLOOR PLAN</text>
        <text className="fp-sub" x={AL} y={AT - 12}>
          SCALE: 3px = 1&quot;  |  OPEN OBSERVATION DECK  |  {fmt(VESTIBULE_W)} × {fmt(VESTIBULE_D)} STAIR STRUCTURE (NW CORNER)
        </text>

        {/* ══ FULL CMU SHELL ═══════════════════════════════════════ */}
        <rect className="fp-cmu" style={{ stroke: "none" }}
          x={px(0)} y={py(0)} width={pf(CMU_W)} height={pf(CMU_D)} />

        {/* CMU block pattern — all four walls */}
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

        {/* CMU outer border */}
        <rect fill="none" stroke="#111" strokeWidth="1.8"
          x={px(0)} y={py(0)} width={pf(CMU_W)} height={pf(CMU_D)} />

        {/* ── Open observation deck fill ──────────────────────────── */}
        <rect className="fp-deck"
          x={px(FW_IN)} y={py(FN_IN)}
          width={pf(FE_IN - FW_IN)} height={pf(FS_IN - FN_IN)} />

        {/* Deck label */}
        <text style={{ fill: "#999", fontSize: "16px", fontFamily: "ui-monospace, monospace", textAnchor: "middle", letterSpacing: "0.35em" }}
          x={px(CMU_W / 2 - 30)} y={py(CMU_D / 2 - 20)}>
          OBSERVATION DECK
        </text>
        <text style={{ fill: "#bbb", fontSize: "9px", fontFamily: "ui-monospace, monospace", textAnchor: "middle" }}
          x={px(CMU_W / 2 - 30)} y={py(CMU_D / 2 - 4)}>
          OPEN — NO WALLS — RAILING AT PERIMETER
        </text>
        <text style={{ fill: "#bbb", fontSize: "9px", fontFamily: "ui-monospace, monospace", textAnchor: "middle" }}
          x={px(CMU_W / 2 - 30)} y={py(CMU_D / 2 + 10)}>
          SHED ROOF ABOVE
        </text>

        {/* ══ SUBFLOOR SHEATHING ═══════════════════════════════════ */}
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

        {/* ── Air gap ─────────────────────────────────────────────── */}
        <rect fill="#fff" stroke="none" x={px(CI_L)} y={py(CI_N)} width={pf(CMU_INTERIOR_W)} height={pf(FR_GAP)} />
        <rect fill="#fff" stroke="none" x={px(CI_L)} y={py(FS_OUT)} width={pf(CMU_INTERIOR_W)} height={pf(FR_GAP)} />
        <rect fill="#fff" stroke="none" x={px(CI_L)} y={py(CI_N)} width={pf(FR_GAP)} height={pf(CMU_INTERIOR_D)} />
        <rect fill="#fff" stroke="none" x={px(FE_OUT)} y={py(CI_N)} width={pf(FR_GAP)} height={pf(CMU_INTERIOR_D)} />

        {/* ── CMU gap dashed lines ──────────────────────────────── */}
        <line className="fp-cmugap" x1={px(CI_L)} y1={py(CI_N)} x2={px(CI_R)} y2={py(CI_N)} />
        <line className="fp-cmugap" x1={px(CI_L)} y1={py(CI_S)} x2={px(CI_R)} y2={py(CI_S)} />
        <line className="fp-cmugap" x1={px(CI_L)} y1={py(CI_N)} x2={px(CI_L)} y2={py(CI_S)} />
        <line className="fp-cmugap" x1={px(CI_R)} y1={py(CI_N)} x2={px(CI_R)} y2={py(CI_S)} />

        {/* ══ PERIMETER RAILING ════════════════════════════════════ */}
        <line className="fp-railing" x1={px(FW_IN)} y1={py(FN_IN)} x2={px(FE_IN)} y2={py(FN_IN)} />
        <line className="fp-railing" x1={px(FW_IN)} y1={py(FS_IN)} x2={px(FE_IN)} y2={py(FS_IN)} />
        <line className="fp-railing" x1={px(FW_IN)} y1={py(FN_IN)} x2={px(FW_IN)} y2={py(FS_IN)} />
        <line className="fp-railing" x1={px(FE_IN)} y1={py(FN_IN)} x2={px(FE_IN)} y2={py(FS_IN)} />

        {/* Railing posts — south */}
        {Array.from({ length: Math.floor((FE_IN - FW_IN) / RAILING_SPACING) + 1 }, (_, i) => {
          const xPos = FW_IN + i * RAILING_SPACING;
          if (xPos > FE_IN) return null;
          return <rect key={`rps${i}`} className="fp-railing-post"
            x={px(xPos) - 2} y={py(FN_IN) - 2} width={4} height={4} />;
        })}
        {/* Railing posts — north */}
        {Array.from({ length: Math.floor((FE_IN - FW_IN) / RAILING_SPACING) + 1 }, (_, i) => {
          const xPos = FW_IN + i * RAILING_SPACING;
          if (xPos > FE_IN) return null;
          return <rect key={`rpn${i}`} className="fp-railing-post"
            x={px(xPos) - 2} y={py(FS_IN) - 2} width={4} height={4} />;
        })}
        {/* Railing posts — east */}
        {Array.from({ length: Math.floor((FS_IN - FN_IN) / RAILING_SPACING) + 1 }, (_, i) => {
          const yPos = FN_IN + i * RAILING_SPACING;
          if (yPos > FS_IN) return null;
          return <rect key={`rpe${i}`} className="fp-railing-post"
            x={px(FW_IN) - 2} y={py(yPos) - 2} width={4} height={4} />;
        })}
        {/* Railing posts — west */}
        {Array.from({ length: Math.floor((FS_IN - FN_IN) / RAILING_SPACING) + 1 }, (_, i) => {
          const yPos = FN_IN + i * RAILING_SPACING;
          if (yPos > FS_IN) return null;
          return <rect key={`rpw${i}`} className="fp-railing-post"
            x={px(FE_IN) - 2} y={py(yPos) - 2} width={4} height={4} />;
        })}

        {/* ══ STAIR STRUCTURE (NW corner, 6'×3') ════════════════════ */}
        <rect className="fp-vestibule"
          x={px(vestL)} y={py(vestT)}
          width={pf(vestR - vestL)} height={pf(vestB - vestT)} />

        {/* Framed walls — south face and east face */}
        <line className="fp-vest-wall"
          x1={px(vestL)} y1={py(vestT)} x2={px(vestR)} y2={py(vestT)} />
        <line className="fp-vest-wall"
          x1={px(vestL)} y1={py(vestT)} x2={px(vestL)} y2={py(vestB)} />

        {/* North and west faces share the CMU perimeter */}
        <line stroke="#222" strokeWidth="2.5"
          x1={px(vestL)} y1={py(vestB)} x2={px(vestR)} y2={py(vestB)} />
        <line stroke="#222" strokeWidth="2.5"
          x1={px(vestR)} y1={py(vestT)} x2={px(vestR)} y2={py(vestB)} />

        {/* Door on south wall — flush against the west CMU wall */}
        {(() => {
          const doorW = 36;
          const doorR = vestR;             // flush to west wall
          const doorL = doorR - doorW;
          const r = pf(doorW);
          return (
            <g>
              {/* Clear the south wall line where the door is */}
              <line stroke="#f0ece2" strokeWidth="3"
                x1={px(doorL)} y1={py(vestT)} x2={px(doorR)} y2={py(vestT)} />
              {/* 90° swing arc — hinge at west (doorR), sweeps outward (south) */}
              <path
                d={`M ${px(doorL)} ${py(vestT)} A ${r} ${r} 0 0 1 ${px(doorR)} ${py(vestT - doorW)}`}
                fill="none" stroke="#888" strokeWidth="0.7" strokeDasharray="3 2" />
              {/* Door leaf — open position */}
              <line stroke="#888" strokeWidth="1"
                x1={px(doorR)} y1={py(vestT)}
                x2={px(doorR)} y2={py(vestT - doorW)} />
            </g>
          );
        })()}

        {/* Structure label — left side to avoid overlap with stairwell */}
        <text style={{ fill: "#555", fontSize: "8px", fontFamily: "ui-monospace, monospace", textAnchor: "middle", fontWeight: 700 }}
          x={px(vestL + 16)} y={py((vestT + vestB) / 2) + 1}>
          STAIR
        </text>
        <text style={{ fill: "#555", fontSize: "8px", fontFamily: "ui-monospace, monospace", textAnchor: "middle", fontWeight: 700 }}
          x={px(vestL + 16)} y={py((vestT + vestB) / 2) + 11}>
          STRUCT.
        </text>

        {/* ══ ROOF DECK JOISTS ═════════════════════════════════════ */}
        {showRoofJoists && (() => {
          const joistLines: React.ReactNode[] = [];
          let count = 0;
          for (let x = CI_L + TJI_OC; x < CI_R; x += TJI_OC) {
            joistLines.push(
              <line key={`rj${count++}`}
                x1={px(x)} y1={py(CI_N)} x2={px(x)} y2={py(CI_S)}
                stroke="#996633" strokeWidth="0.6" strokeDasharray="3 5" opacity="0.5" />
            );
          }
          return (
            <g>
              <line key="rim-s" x1={px(CI_L)} y1={py(CI_N)} x2={px(CI_R)} y2={py(CI_N)}
                stroke="#996633" strokeWidth="2" opacity="0.4" />
              <line key="rim-n" x1={px(CI_L)} y1={py(CI_S)} x2={px(CI_R)} y2={py(CI_S)}
                stroke="#996633" strokeWidth="2" opacity="0.4" />
              <line key="rim-e" x1={px(CI_L)} y1={py(CI_N)} x2={px(CI_L)} y2={py(CI_S)}
                stroke="#996633" strokeWidth="2" opacity="0.4" />
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
              x={px(wellL3 + 24)} y={py((wellT3 + wellB3) / 2) - 4}>
              STAIRWELL
            </text>
            <text className="fp-fixture-lbl"
              x={px(wellL3 + 24)} y={py((wellT3 + wellB3) / 2) + 6}>
              {fmt(wellR3 - wellL3)} × {fmt(wellB3 - wellT3)}
            </text>
          </g>
        )}

        {/* ══ DIMENSIONS ══════════════════════════════════════════ */}

        {/* Full interior width (bottom) */}
        {(() => {
          const yD = AT + pf(CMU_D) + 32;
          const x1 = px(CI_L); const x2 = px(CI_R);
          return (
            <g>
              <line className="fp-dl" x1={x1} y1={yD - 5} x2={x1} y2={yD + 5} />
              <line className="fp-dl" x1={x2} y1={yD - 5} x2={x2} y2={yD + 5} />
              <line className="fp-dl" x1={x1} y1={yD} x2={x2} y2={yD} />
              <text className="fp-dt" x={(x1 + x2) / 2} y={yD + 14}>
                {CMU_INTERIOR_W}&quot; ({fmt(CMU_INTERIOR_W)}) DECK WIDTH
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
                {CMU_INTERIOR_D}&quot; ({fmt(CMU_INTERIOR_D)}) DECK DEPTH
              </text>
            </g>
          );
        })()}

        {/* Structure dimensions (right side) */}
        {(() => {
          const xD = px(vestR) + 16;
          const y1 = py(vestT); const y2 = py(vestB);
          return (
            <g>
              <line className="fp-dl" x1={xD - 4} y1={y1} x2={xD + 4} y2={y1} />
              <line className="fp-dl" x1={xD - 4} y1={y2} x2={xD + 4} y2={y2} />
              <line className="fp-dl" x1={xD} y1={y1} x2={xD} y2={y2} />
              <text className="fp-dt" transform={`translate(${xD + 12} ${(y1 + y2) / 2}) rotate(90)`}>
                {VESTIBULE_D}&quot; ({fmt(VESTIBULE_D)})
              </text>
            </g>
          );
        })()}

        {/* Structure width dimension (below) */}
        {(() => {
          const yD = py(vestB) + 16;
          const x1 = px(vestL); const x2 = px(vestR);
          return (
            <g>
              <line className="fp-dl" x1={x1} y1={yD - 4} x2={x1} y2={yD + 4} />
              <line className="fp-dl" x1={x2} y1={yD - 4} x2={x2} y2={yD + 4} />
              <line className="fp-dl" x1={x1} y1={yD} x2={x2} y2={yD} />
              <text className="fp-dt" x={(x1 + x2) / 2} y={yD + 12}>
                {VESTIBULE_W}&quot; ({fmt(VESTIBULE_W)})
              </text>
            </g>
          );
        })()}

        {/* ── WALL LABELS ──────────────────────────────────────────── */}
        <text className="fp-wlbl" x={px(CMU_W / 2)} y={AT - 40}>SOUTH</text>
        <text className="fp-wlbl" x={px(CMU_W / 2)} y={AT + pf(CMU_D) + 58}>NORTH</text>
        <text className="fp-wlbl"
          transform={`translate(${AL - 14} ${AT + pf(CMU_D / 2)}) rotate(-90)`}>EAST</text>
        <text className="fp-wlbl"
          transform={`translate(${AL + pf(CMU_W) + 26} ${AT + pf(CMU_D / 2)}) rotate(90)`}>WEST</text>
      </svg>
    </div>
  );
}
