"use client";

import { useState, useRef, useCallback } from "react";
import type { WallElevation, WallId } from "@/lib/types";
import { WallElevationView } from "@/components/WallElevation";
import { computeWallLayout, PLATE_H } from "@/lib/layout-calculator";
import { PX_PER_INCH } from "@/lib/types";
import {
  CMU_BLOCK_W, CMU_BLOCK_H, FR_D,
  horizPartition, vertPartition, bathroomEastWall,
  STAIR_TOTAL_RISERS, STAIR_LAND_RISERS, STAIR_TREAD_DEPTH, STAIR_WIDTH,
  STAIR_TREAD_T, STAIR_RISER_T,
  STAIR_LAND_JOIST_W, STAIR_LAND_JOIST_D, STAIR_LAND_RIM_W,
  STAIR_LAND_DECK_T, STAIR_LAND_POST_W, STAIR_LAND_LEDGER_W,
  TJI_DEPTH, SUBFLOOR_T,
  BATH_JOIST_H, BATH_JOIST_OC, BATH_SUBFLOOR_T,
} from "@/lib/framing-data";
import { computeApproachStringer } from "@/lib/stair-calculator";
import { Toggle } from "@/components/ui/toggle";
import { CutList } from "@/components/CutList";

function fmt(inches: number): string {
  const ft = Math.floor(inches / 12);
  const rem = Math.round((inches % 12) * 8) / 8;
  if (ft === 0) return `${rem}"`;
  if (rem === 0) return `${ft}'`;
  return `${ft}'-${rem}"`;
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

const PX = PX_PER_INCH;
const AL = 120; const AR = 140; const AT = 120; const AB = 84;

const WALL_W   = vertPartition.totalLengthInches;
const WALL_H   = vertPartition.wallHeightInches;
const FLOOR2_IN = WALL_H + TJI_DEPTH + SUBFLOOR_T;
const RH       = FLOOR2_IN / STAIR_TOTAL_RISERS;
const PLATE_T  = PLATE_H;
const STUD_HT  = WALL_H - 3 * PLATE_T;

const LAND_TOP   = STAIR_LAND_RISERS * RH;
const LAND_DECK  = LAND_TOP - STAIR_LAND_DECK_T;
const LAND_JOIST = LAND_DECK - STAIR_LAND_JOIST_D;

const steps = [
  { rx: STAIR_WIDTH + STAIR_TREAD_DEPTH,     topY: LAND_TOP - RH,     botY: LAND_TOP - 2 * RH },
  { rx: STAIR_WIDTH + 2 * STAIR_TREAD_DEPTH, topY: LAND_TOP - 2 * RH, botY: 0 },
];

const STAIR_END = STAIR_WIDTH + 2 * STAIR_TREAD_DEPTH + 6;
const TOTAL_W   = STAIR_END;

const svgW = AL + TOTAL_W * PX + AR;
const svgH = AT + WALL_H * PX + AB;
/** Aspect ratio of the door/stair SVG so the bathroom east column can match and align. */
const DOOR_WALL_ASPECT = svgW / svgH;

const wx = (xIn: number) => AL + xIn * PX;
const wy = (yIn: number, hIn = 0) => AT + (WALL_H - yIn - hIn) * PX;
const px = (n: number) => n * PX;

function DoorWallCMULayer() {
  const wall = vertPartition;
  const cmuLeft  = 0;
  const cmuRight = wall.totalLengthInches;
  const cmuTop   = wall.wallHeightInches;
  const numCourses = Math.ceil(cmuTop / CMU_BLOCK_H);

  const voids = wall.openings.map((op) => ({
    left:   op.positionFromLeftInches,
    right:  op.positionFromLeftInches + op.widthInches,
    bottom: op.sillHeightInches ?? 0,
    top:    (op.sillHeightInches ?? 0) + op.heightInches,
  }));

  const blocks: React.ReactNode[] = [];

  for (let course = 0; course < numCourses; course++) {
    const yBot = course * CMU_BLOCK_H;
    const yTop = yBot + CMU_BLOCK_H;
    const startX = course % 2 === 0 ? cmuLeft : cmuLeft + CMU_BLOCK_W / 2;

    for (let bx = startX; bx < cmuRight; bx += CMU_BLOCK_W) {
      const cx1 = Math.max(cmuLeft, bx);
      const cx2 = Math.min(cmuRight, bx + CMU_BLOCK_W);
      if (cx2 <= cx1) continue;

      let segs: { x1: number; x2: number }[] = [{ x1: cx1, x2: cx2 }];
      for (const v of voids) {
        if (yTop <= v.bottom || yBot >= v.top) continue;
        const next: { x1: number; x2: number }[] = [];
        for (const s of segs) {
          if (s.x2 <= v.left || s.x1 >= v.right) {
            next.push(s);
          } else {
            if (s.x1 < v.left)  next.push({ x1: s.x1,   x2: v.left  });
            if (s.x2 > v.right) next.push({ x1: v.right, x2: s.x2   });
          }
        }
        segs = next;
      }

      for (const seg of segs) {
        if (seg.x2 - seg.x1 < 0.25) continue;
        blocks.push(
          <rect
            key={`cmu-${course}-${bx.toFixed(1)}-${seg.x1.toFixed(1)}`}
            className="cmu"
            x={wx(seg.x1)} y={wy(yBot, CMU_BLOCK_H)}
            width={px(seg.x2 - seg.x1)} height={px(CMU_BLOCK_H)}
          />,
        );
      }
    }
  }
  return <>{blocks}</>;
}

const DL = "#1a55bb";
const TK = 5;

function HDim({ x1, x2, y, label }: { x1: number; x2: number; y: number; label: string }) {
  const mid = (x1 + x2) / 2;
  return (
    <g>
      <line stroke={DL} strokeWidth="0.5" opacity="0.55" x1={x1} y1={y - TK * 1.8} x2={x1} y2={y + TK} />
      <line stroke={DL} strokeWidth="0.5" opacity="0.55" x1={x2} y1={y - TK * 1.8} x2={x2} y2={y + TK} />
      <line stroke={DL} strokeWidth="0.8" x1={x1} y1={y} x2={x2} y2={y} />
      <line stroke={DL} strokeWidth="0.8" x1={x1 - TK} y1={y - TK} x2={x1 + TK} y2={y + TK} />
      <line stroke={DL} strokeWidth="0.8" x1={x2 - TK} y1={y - TK} x2={x2 + TK} y2={y + TK} />
      <text x={mid} y={y - 8} fill={DL} fontSize="11" fontFamily="ui-monospace,monospace" textAnchor="middle">{label}</text>
    </g>
  );
}
function VDim({ x, y1, y2, label, anchor = "right" }: { x: number; y1: number; y2: number; label: string; anchor?: "left" | "right" }) {
  const mid = (y1 + y2) / 2;
  const offX = anchor === "right" ? TK * 2.5 : -TK * 2.5;
  const tx = x + offX + (anchor === "right" ? 3 : -3);
  return (
    <g>
      <line stroke={DL} strokeWidth="0.5" opacity="0.55" x1={x - TK} y1={y1} x2={x + offX} y2={y1} />
      <line stroke={DL} strokeWidth="0.5" opacity="0.55" x1={x - TK} y1={y2} x2={x + offX} y2={y2} />
      <line stroke={DL} strokeWidth="0.8" x1={x} y1={y1} x2={x} y2={y2} />
      <line stroke={DL} strokeWidth="0.8" x1={x - TK} y1={y1 - TK} x2={x + TK} y2={y1 + TK} />
      <line stroke={DL} strokeWidth="0.8" x1={x - TK} y1={y2 - TK} x2={x + TK} y2={y2 + TK} />
      <text x={tx} y={mid + 4} fill={DL} fontSize="11" fontFamily="ui-monospace,monospace"
        textAnchor={anchor === "right" ? "start" : "end"}
        transform={`rotate(-90,${tx},${mid + 4})`}
      >{label}</text>
    </g>
  );
}

interface Tip { x: number; y: number; label: string; dims: string; pos: string; }

function fmtDec(n: number) {
  return Math.abs(n - Math.round(n)) < 0.01 ? `${Math.round(n)}` : n.toFixed(2);
}

function DoorWallWithStairs({ showCMU, showStairs }: { showCMU: boolean; showStairs: boolean }) {
  const [tip, setTip] = useState<Tip | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const showTip = useCallback((e: React.MouseEvent, label: string, dims: string, pos: string) => {
    if (!wrapRef.current) return;
    const br = wrapRef.current.getBoundingClientRect();
    setTip({ x: e.clientX - br.left + 16, y: e.clientY - br.top - 10, label, dims, pos });
  }, []);
  const moveTip = useCallback((e: React.MouseEvent) => {
    if (!wrapRef.current) return;
    const br = wrapRef.current.getBoundingClientRect();
    setTip(t => t ? { ...t, x: e.clientX - br.left + 16, y: e.clientY - br.top - 10 } : null);
  }, []);
  const hideTip = useCallback(() => setTip(null), []);

  const layout = computeWallLayout(vertPartition);
  const floorY = AT + WALL_H * PX;

  // ── Stringer profile — computed from structured notch data ──
  // Uses computeApproachStringer() so each notch is individually addressable.
  // approach.notches[0] → first step down from landing
  // approach.allPoints  → ready for SVG <polygon>
  const approach = computeApproachStringer({
    landingWidth: STAIR_WIDTH,
    treadDepth: STAIR_TREAD_DEPTH,
    riserHeight: RH,
    landRisers: STAIR_LAND_RISERS,
  });
  const stringerPts = approach.allPoints;

  // Label positions (callout lines extending to the right margin)
  const callX = wx(STAIR_END) + 8;

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
    <svg
      viewBox={`0 0 ${svgW} ${svgH}`}
      width="100%"
      style={{ maxHeight: 720, display: "block" }}
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <style>{`
          .cmu     { fill: none; stroke: #c8a800; stroke-width: 0.75px; }
          .plate   { fill: #fff; stroke: #010101; stroke-width: 2px;   stroke-linecap: square; }
          .stud    { fill: #fff; stroke: #010101; stroke-width: 1.5px; stroke-linecap: square; }
          .opening { fill: none; stroke: #ababab; stroke-dasharray: 6 4; stroke-width: 0.8px; }
          .header  { fill: #fff; stroke: #010101; stroke-width: 1.5px; stroke-linecap: square; }
          .ct      { fill: #111; font-size: 14px; font-family: sans-serif; font-weight: 700; }
          .s-post  { fill: #e8d8b8; stroke: #8b7348; stroke-width: 1.4px; }
          .s-joist { fill: #f0e8d0; stroke: #8b7348; stroke-width: 1px; }
          .s-rim   { fill: #e0d4b8; stroke: #8b7348; stroke-width: 1.4px; }
          .s-ledgr { fill: #d8ccb0; stroke: #8b7348; stroke-width: 1.4px; }
          .s-deck  { fill: #c8b898; stroke: #555; stroke-width: 1.2px; }
          .s-strg  { fill: #f5ecd8; stroke: #8b7348; stroke-width: 1.4px; stroke-linejoin: miter; }
          .s-tread { fill: #e0d0a8; stroke: #555; stroke-width: 1.2px; }
          .s-riser { fill: #f0ece0; stroke: #666; stroke-width: 1px; }
          .s-lbl   { fill: #444; font-size: 9px; font-family: ui-monospace,monospace; }
          .s-leader { stroke: #888; stroke-width: 0.5px; }
        `}</style>
      </defs>

      {/* ════ NORTH EXTERIOR WALL — 2×6 cross-section at left edge ════ */}
      <rect x={wx(-FR_D)} y={wy(WALL_H, 0)} width={FR_D * PX} height={WALL_H * PX}
        fill="#ede8dc" stroke="none" />
      <g onMouseEnter={e => showTip(e, "Bottom Plate", `${fmtDec(FR_D)}" × ${PLATE_T}"`, `2×6 N. wall — y: 0"`)} onMouseMove={moveTip} onMouseLeave={hideTip} style={{ cursor: "crosshair" }}>
        <rect className="plate" x={wx(-FR_D)} y={wy(0, PLATE_T)} width={FR_D * PX} height={PLATE_T * PX} />
      </g>
      <g onMouseEnter={e => showTip(e, "Lower Top Plate", `${fmtDec(FR_D)}" × ${PLATE_T}"`, `2×6 N. wall — y: ${WALL_H - 2 * PLATE_T}"`)} onMouseMove={moveTip} onMouseLeave={hideTip} style={{ cursor: "crosshair" }}>
        <rect className="plate" x={wx(-FR_D)} y={wy(WALL_H - 2 * PLATE_T, PLATE_T)} width={FR_D * PX} height={PLATE_T * PX} />
      </g>
      <g onMouseEnter={e => showTip(e, "Upper Top Plate", `${fmtDec(FR_D)}" × ${PLATE_T}"`, `2×6 N. wall — y: ${WALL_H - PLATE_T}"`)} onMouseMove={moveTip} onMouseLeave={hideTip} style={{ cursor: "crosshair" }}>
        <rect className="plate" x={wx(-FR_D)} y={wy(WALL_H - PLATE_T, PLATE_T)} width={FR_D * PX} height={PLATE_T * PX} />
      </g>
      <g onMouseEnter={e => showTip(e, "2×6 Stud", `${fmtDec(FR_D)}" × ${fmtDec(STUD_HT)}"`, `N. wall backing stud`)} onMouseMove={moveTip} onMouseLeave={hideTip} style={{ cursor: "crosshair" }}>
        <rect className="stud" x={wx(-FR_D)} y={wy(PLATE_T, STUD_HT)} width={FR_D * PX} height={STUD_HT * PX} />
      </g>
      <rect x={wx(-FR_D)} y={wy(WALL_H, 0)} width={FR_D * PX} height={WALL_H * PX}
        fill="none" stroke="#010101" strokeWidth="1.2" />
      <text fill="#666" fontSize="10" fontFamily="ui-monospace,monospace" fontWeight="600"
        x={wx(-FR_D / 2)} y={wy(WALL_H / 2)}
        textAnchor="middle"
        transform={`rotate(-90,${wx(-FR_D / 2)},${wy(WALL_H / 2)})`}>
        2×6 NORTH WALL
      </text>

      {/* ════ WALL (background) ════ */}
      <rect x={wx(0)} y={wy(WALL_H, 0) + 1} width={WALL_W * PX} height={WALL_H * PX - 1}
        fill="#f7f6f2" stroke="none" />

      {/* ════ CMU BLOCK LAYER (above background, behind framing) ════ */}
      {showCMU && <DoorWallCMULayer />}
      {layout.bottomPlates.map((r) => (
        <g key={r.id} onMouseEnter={e => showTip(e, r.label, `${fmtDec(r.width)}" × ${r.height}"`, `x: ${fmtDec(r.x)}"  y: 0"`)} onMouseMove={moveTip} onMouseLeave={hideTip} style={{ cursor: "crosshair" }}>
          <rect className="plate" x={wx(r.x)} y={wy(r.y, r.height)} width={r.width * PX} height={r.height * PX} />
        </g>
      ))}
      {layout.topPlates.map((r) => (
        <g key={r.id} onMouseEnter={e => showTip(e, r.label, `${fmtDec(r.width)}" × ${r.height}"`, `x: ${fmtDec(r.x)}"  y: ${fmtDec(r.y)}"`)} onMouseMove={moveTip} onMouseLeave={hideTip} style={{ cursor: "crosshair" }}>
          <rect className="plate" x={wx(r.x)} y={wy(r.y, r.height)} width={r.width * PX} height={r.height * PX} />
        </g>
      ))}
      {layout.studs.map((r) => (
        <g key={r.id} onMouseEnter={e => showTip(e, r.label, `1½" × ${fmtDec(r.height)}" (2×6)`, `x: ${fmtDec(r.x)}"  y: ${fmtDec(r.y)}"`)} onMouseMove={moveTip} onMouseLeave={hideTip} style={{ cursor: "crosshair" }}>
          <rect className="stud" x={wx(r.x)} y={wy(r.y, r.height)} width={r.width * PX} height={r.height * PX} />
        </g>
      ))}
      {layout.headers.map((r) => {
        const half = r.height / 2;
        return (
          <g key={r.id} onMouseEnter={e => showTip(e, r.label, `${fmtDec(r.width)}" × ${fmtDec(r.height)}" (doubled 2×6)`, `x: ${fmtDec(r.x)}"  y: ${fmtDec(r.y)}"`)} onMouseMove={moveTip} onMouseLeave={hideTip} style={{ cursor: "crosshair" }}>
            <rect className="header" x={wx(r.x)} y={wy(r.y, r.height)} width={r.width * PX} height={half * PX} />
            <rect className="header" x={wx(r.x)} y={wy(r.y, half)}     width={r.width * PX} height={half * PX} />
          </g>
        );
      })}
      {layout.sills.map((r) => (
        <g key={r.id} onMouseEnter={e => showTip(e, r.label, `${fmtDec(r.width)}" × ${fmtDec(r.height)}"`, `x: ${fmtDec(r.x)}"  y: ${fmtDec(r.y)}"`)} onMouseMove={moveTip} onMouseLeave={hideTip} style={{ cursor: "crosshair" }}>
          <rect className="header" x={wx(r.x)} y={wy(r.y, r.height)} width={r.width * PX} height={r.height * PX} />
        </g>
      ))}
      {layout.openings.map((r) => (
        <rect key={r.id} className="opening"
          x={wx(r.x)} y={wy(r.y, r.height)} width={r.width * PX} height={r.height * PX} />
      ))}
      <rect x={wx(0)} y={wy(WALL_H, 0)} width={WALL_W * PX} height={WALL_H * PX}
        fill="none" stroke="#010101" strokeWidth="1.2" />

      {/* ════ BATHROOM RAISED FLOOR — joists run N-S parallel to this wall ════
          Looking at this wall from the east (bathroom side), the joists
          span from the horizontal partition (right/south, x≈WALL_W) to the
          north wall (left/north, x=0). They appear as a continuous
          horizontal band at the raised floor height. */}
      {(() => {
        const jsfTop = LAND_TOP;                            // raised floor top = landing height
        const jsfBot = jsfTop - BATH_SUBFLOOR_T;            // subfloor bottom
        const jjTop  = jsfBot;                               // joist top
        const jjBot  = jjTop - BATH_JOIST_H;                // joist bottom

        return (
          <g>
            {/* Subfloor — runs full wall length */}
            <rect
              x={wx(0)} y={wy(jsfBot, BATH_SUBFLOOR_T)}
              width={WALL_W * PX} height={BATH_SUBFLOOR_T * PX}
              fill="#c8b898" stroke="#555" strokeWidth="0.8" />

            {/* 2×6 joist profile — shown as a single filled band since
                we're looking at the side face (joists run parallel to view) */}
            <rect
              x={wx(0)} y={wy(jjBot, BATH_JOIST_H)}
              width={WALL_W * PX} height={BATH_JOIST_H * PX}
              fill="rgba(240,232,208,0.5)" stroke="#8b7348" strokeWidth="0.8" />

            {/* Dashed lines showing individual joist spacing (16" OC) */}
            {Array.from({ length: Math.floor(WALL_W / BATH_JOIST_OC) }, (_, i) => {
              const jy = jjBot + (i + 1) * (BATH_JOIST_H / (Math.floor(WALL_W / BATH_JOIST_OC) + 1));
              return null; // joists are parallel; no cross-lines needed
            })}

            {/* Labels */}
            <text x={wx(WALL_W / 2)} y={wy(jsfBot + BATH_SUBFLOOR_T / 2) + 3}
              fontSize="6.5" fill="#555" fontFamily="ui-monospace,monospace"
              textAnchor="middle">¾&quot; SUBFL.</text>
            <text x={wx(WALL_W / 2)} y={wy(jjBot + BATH_JOIST_H / 2) + 3}
              fontSize="7" fill="#8b7348" fontFamily="ui-monospace,monospace"
              textAnchor="middle" fontWeight="600">
              2×6 JOISTS (N-S, PARALLEL)
            </text>
          </g>
        );
      })()}

      {/* ════ LANDING FRAMING + STAIR RUN (toggled) ════ */}
      {showStairs && <>

      {/* Semi-transparent backdrop so landing reads as foreground */}
      <rect x={wx(0)} y={wy(LAND_TOP, 0)} width={STAIR_WIDTH * PX} height={LAND_TOP * PX}
        fill="rgba(255,252,245,0.85)" stroke="none" />

      {/* 4×4 Post */}
      <g onMouseEnter={e => showTip(e, "4×4 Post", `${STAIR_LAND_POST_W}" × ${fmtDec(LAND_JOIST)}"`, `x: ${STAIR_WIDTH - STAIR_LAND_POST_W}"  y: 0"`)} onMouseMove={moveTip} onMouseLeave={hideTip} style={{ cursor: "crosshair" }}>
        <rect className="s-post" x={wx(STAIR_WIDTH - STAIR_LAND_POST_W)} y={wy(0, LAND_JOIST)} width={STAIR_LAND_POST_W * PX} height={LAND_JOIST * PX} />
      </g>

      {/* 2×6 Bearing block — full height from bottom plate to joist bottom */}
      <g onMouseEnter={e => showTip(e, "2×6 Bearing Block", `${fmtDec(FR_D)}" × ${fmtDec(LAND_JOIST - PLATE_T)}"`, `bottom plate → joist bottom (load path)`)} onMouseMove={moveTip} onMouseLeave={hideTip} style={{ cursor: "crosshair" }}>
        <rect className="s-ledgr" x={wx(-FR_D)} y={wy(PLATE_T, LAND_JOIST - PLATE_T)} width={FR_D * PX} height={(LAND_JOIST - PLATE_T) * PX} />
      </g>

      {/* 2×10 Rim header */}
      <g onMouseEnter={e => showTip(e, "2×10 Rim Header", `${STAIR_LAND_RIM_W}" × ${STAIR_LAND_JOIST_D}"`, `x: ${STAIR_WIDTH - STAIR_LAND_RIM_W}"  y: ${fmtDec(LAND_JOIST)}"`)} onMouseMove={moveTip} onMouseLeave={hideTip} style={{ cursor: "crosshair" }}>
        <rect className="s-rim" x={wx(STAIR_WIDTH - STAIR_LAND_RIM_W)} y={wy(LAND_JOIST, STAIR_LAND_JOIST_D)} width={STAIR_LAND_RIM_W * PX} height={STAIR_LAND_JOIST_D * PX} />
      </g>

      {/* 2×10 Joist — N-S profile */}
      <g onMouseEnter={e => showTip(e, "2×10 Joist (N-S, @ 16\" OC)", `${fmtDec(FR_D - 0.5 + STAIR_WIDTH - STAIR_LAND_RIM_W)}" span × ${STAIR_LAND_JOIST_D}"`, `bears on N. wall cleat → rim header`)} onMouseMove={moveTip} onMouseLeave={hideTip} style={{ cursor: "crosshair" }}>
        <rect className="s-joist" x={wx(-FR_D + 0.5)} y={wy(LAND_JOIST, STAIR_LAND_JOIST_D)} width={(FR_D - 0.5 + STAIR_WIDTH - STAIR_LAND_RIM_W) * PX} height={STAIR_LAND_JOIST_D * PX} fillOpacity="0.5" />
      </g>
      <line stroke="#8b7348" strokeWidth="0.6" strokeDasharray="4 3" x1={wx(-FR_D + 0.5)} y1={wy(LAND_JOIST + STAIR_LAND_JOIST_D)} x2={wx(STAIR_WIDTH - STAIR_LAND_RIM_W)} y2={wy(LAND_JOIST + STAIR_LAND_JOIST_D)} />
      <line stroke="#8b7348" strokeWidth="0.6" strokeDasharray="4 3" x1={wx(-FR_D + 0.5)} y1={wy(LAND_JOIST)} x2={wx(STAIR_WIDTH - STAIR_LAND_RIM_W)} y2={wy(LAND_JOIST)} />

      {/* ¾" Plywood deck */}
      <g onMouseEnter={e => showTip(e, "¾\" Plywood Deck", `${STAIR_WIDTH}" × ${STAIR_LAND_DECK_T}"`, `landing surface`)} onMouseMove={moveTip} onMouseLeave={hideTip} style={{ cursor: "crosshair" }}>
        <rect className="s-deck" x={wx(0)} y={wy(LAND_DECK, STAIR_LAND_DECK_T)} width={STAIR_WIDTH * PX} height={STAIR_LAND_DECK_T * PX} />
      </g>

      {/* ════ STAIR RUN ════ */}

      {/* 2×12 Notched stringer */}
      <g onMouseEnter={e => showTip(e, "2×12 Notched Stringer (×2)", `${2 * STAIR_TREAD_DEPTH}" run × ${fmtDec(LAND_TOP - RH)}" rise`, `one of two stringers`)} onMouseMove={moveTip} onMouseLeave={hideTip} style={{ cursor: "crosshair" }}>
        <polygon className="s-strg" points={stringerPts.map(([x, y]) => `${wx(x)},${wy(y)}`).join(" ")} />
      </g>

      {/* Tread boards */}
      {[
        { x: STAIR_WIDTH,      y: LAND_TOP - RH,     label: "Tread 1" },
        { x: STAIR_WIDTH + STAIR_TREAD_DEPTH, y: LAND_TOP - 2 * RH, label: "Tread 2" },
      ].map((t, i) => (
        <g key={`tread${i}`} onMouseEnter={e => showTip(e, `5/4×12 Tread Board — ${t.label}`, `${STAIR_TREAD_DEPTH}" × ${STAIR_TREAD_T}"`, `x: ${t.x}"  y: ${fmtDec(t.y)}"`)} onMouseMove={moveTip} onMouseLeave={hideTip} style={{ cursor: "crosshair" }}>
          <rect className="s-tread" x={wx(t.x)} y={wy(t.y, STAIR_TREAD_T)} width={STAIR_TREAD_DEPTH * PX} height={STAIR_TREAD_T * PX} />
        </g>
      ))}

      {/* Riser boards */}
      {steps.map((step, i) => {
        const riserH = step.topY - step.botY - STAIR_TREAD_T;
        return (
          <g key={`riser${i}`} onMouseEnter={e => showTip(e, `1×8 Riser Board — Riser ${i + 2}`, `${STAIR_RISER_T}" × ${fmtDec(riserH)}"`, `x: ${step.rx}"  y: ${fmtDec(step.botY)}"`)} onMouseMove={moveTip} onMouseLeave={hideTip} style={{ cursor: "crosshair" }}>
            <rect className="s-riser" x={wx(step.rx)} y={wy(step.botY, riserH)} width={STAIR_RISER_T * PX} height={riserH * PX} />
          </g>
        );
      })}

      {/* Main floor line */}
      <line stroke="#333" strokeWidth="1.2"
        x1={wx(0)} y1={floorY} x2={wx(STAIR_END) + 8} y2={floorY} />

      {/* LANDING label */}
      <text fill="#8b7348" fontSize="13" fontFamily="ui-monospace,monospace" fontWeight="bold"
        x={wx(STAIR_WIDTH / 2)} y={wy(LAND_TOP) - 8} textAnchor="middle">
        LANDING (+{+LAND_TOP.toFixed(1)}&quot;)
      </text>

      {/* MAIN FLOOR label */}
      <text fill="#555" fontSize="10" fontFamily="ui-monospace,monospace"
        x={wx(STAIR_END) + 4} y={wy(0) - 4} textAnchor="start">MAIN FLOOR</text>

      {/* Callout labels — stacked vertically in the right margin, with leader lines */}
      {[
        { y: LAND_TOP - STAIR_LAND_DECK_T / 2,        fromX: STAIR_WIDTH / 2,          label: "¾\" PLYWOOD DECK" },
        { y: LAND_JOIST + STAIR_LAND_JOIST_D / 2,      fromX: STAIR_WIDTH / 2,         label: "2×10 JOISTS N-S @ 16\" OC" },
        { y: LAND_JOIST + STAIR_LAND_JOIST_D / 2,      fromX: STAIR_WIDTH - STAIR_LAND_RIM_W / 2, label: "2×10 RIM HEADER" },
        { y: (PLATE_T + LAND_JOIST) / 2,     fromX: -FR_D / 2,      label: "2×6 BEARING BLOCK (full height)" },
        { y: LAND_JOIST / 2,                fromX: STAIR_WIDTH - STAIR_LAND_POST_W / 2,     label: "4×4 POST (south)" },
        { y: (steps[0].topY + steps[0].botY) / 2, fromX: STAIR_WIDTH + STAIR_TREAD_DEPTH / 2, label: "2×12 NOTCHED STRINGER (×2)" },
        { y: LAND_TOP - RH + STAIR_TREAD_T / 2,   fromX: STAIR_WIDTH + STAIR_TREAD_DEPTH / 2,    label: "5/4×12 TREAD BOARDS (×2)" },
        { y: (steps[0].topY + steps[0].botY) / 2, fromX: steps[0].rx,  label: "1×8 RISER BOARDS (×2)" },
        { y: WALL_H / 2,                        fromX: -FR_D / 2, label: "2×6 N. WALL BACKING" },
      ].map(({ y, fromX, label }, i) => {
        const py = wy(y);
        const lx = callX;
        const ly = AT + 20 + i * 16;
        return (
          <g key={`cl${i}`}>
            <line className="s-leader" x1={wx(fromX)} y1={py} x2={lx - 4} y2={ly} />
            <circle cx={wx(fromX)} cy={py} r={2} fill="#888" />
            <text className="s-lbl" x={lx} y={ly + 3} textAnchor="start">{label}</text>
          </g>
        );
      })}

      {/* ════ DIMENSIONS ════ */}

      {/* Wall width */}
      <HDim x1={wx(0)} x2={wx(WALL_W)} y={floorY + 28} label={`${WALL_W}" wall`} />

      {/* Landing */}
      <HDim x1={wx(0)} x2={wx(STAIR_WIDTH)} y={floorY + 54} label={`${STAIR_WIDTH}" landing`} />

      {/* Individual treads */}
      <HDim x1={wx(STAIR_WIDTH)} x2={wx(STAIR_WIDTH + STAIR_TREAD_DEPTH)} y={floorY + 28} label={`${STAIR_TREAD_DEPTH}" run`} />
      <HDim x1={wx(STAIR_WIDTH + STAIR_TREAD_DEPTH)} x2={wx(STAIR_WIDTH + 2 * STAIR_TREAD_DEPTH)} y={floorY + 28} label={`${STAIR_TREAD_DEPTH}" run`} />

      {/* Total stair run */}
      <HDim x1={wx(STAIR_WIDTH)} x2={wx(STAIR_WIDTH + 2 * STAIR_TREAD_DEPTH)} y={floorY + 80} label={`${2 * STAIR_TREAD_DEPTH}" stair run`} />

      {/* Riser heights — landing face + 2 stair risers */}
      <VDim x={wx(STAIR_WIDTH) + 14}
        y1={wy(LAND_TOP)} y2={wy(LAND_TOP - RH)}
        label={`${RH}" (rim)`} anchor="right" />
      {steps.map((step, i) => (
        <VDim key={`rv${i}`}
          x={wx(step.rx) + 14 + i * 4}
          y1={wy(step.topY)} y2={wy(step.botY)}
          label={`${RH}"`} anchor="right" />
      ))}

      {/* North wall depth */}
      <HDim x1={wx(-FR_D)} x2={wx(0)} y={floorY + 54} label={`5½"`} />

      {/* Total rise */}
      <VDim x={wx(-FR_D) - 8} y1={wy(LAND_TOP)} y2={wy(0)} label={`${+LAND_TOP.toFixed(2)}" rise`} anchor="left" />

      {/* Post height */}
      <VDim x={wx(STAIR_WIDTH - STAIR_LAND_POST_W) - 8}
        y1={wy(LAND_JOIST)} y2={wy(0)}
        label={`${LAND_JOIST.toFixed(1)}" post`} anchor="left" />

      </>}

      {/* Wall height — always visible */}
      <VDim x={wx(-FR_D) - 32} y1={wy(0)} y2={wy(WALL_H)} label={`${fmt(WALL_H)} wall`} anchor="left" />
    </svg>

    {tip && (
      <div style={{
        position: "absolute", left: tip.x, top: tip.y,
        background: "rgba(20,20,20,0.92)", color: "#eee",
        padding: "8px 12px", borderRadius: 6,
        fontSize: 12, fontFamily: "ui-monospace, monospace",
        lineHeight: 1.6, pointerEvents: "none",
        zIndex: 100, whiteSpace: "nowrap",
        boxShadow: "0 2px 12px rgba(0,0,0,0.3)",
      }}>
        <div style={{ fontWeight: 700, color: "#fff", marginBottom: 2 }}>{tip.label}</div>
        <div>{tip.dims}</div>
        <div style={{ color: "#aaa" }}>{tip.pos}</div>
      </div>
    )}
    </div>
  );
}

export function InteriorPartitionDetails({
  stairWidthPct,
  partitionWidthPct,
}: {
  stairWidthPct?: string;
  partitionWidthPct?: string;
}) {
  const [showCMU, setShowCMU] = useState(true);
  const [showStairs, setShowStairs] = useState(true);
  const [showSewer, setShowSewer] = useState(false);

  return (
    <div>
      {/* Toggle bar */}
      <div className="flex flex-wrap gap-1.5 px-3 py-2 bg-zinc-50 border-b border-t border-zinc-200">
        <LayerBtn label="CMU Bricks" on={showCMU} toggle={() => setShowCMU(v => !v)} />
        <LayerBtn label="Landing & Stairs" on={showStairs} toggle={() => setShowStairs(v => !v)} />
        <LayerBtn label="Sewer Outlet" on={showSewer} toggle={() => setShowSewer(v => !v)} />
      </div>

      {/* Drawings row — 3 columns. minWidth forces horizontal scroll inside the card. */}
      <div style={{
        display: "grid",
        gridTemplateColumns: `${stairWidthPct ?? "1fr"} ${partitionWidthPct ?? "1fr"} ${stairWidthPct ?? "1fr"}`,
        gap: "1.5rem",
        alignItems: "start",
        padding: "0.75rem 0.75rem 0",
        minWidth: 960,
      }}>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <p className="wall-label" style={{ marginBottom: "0.35rem" }}>
            <strong>{vertPartition.name}</strong>
          </p>
          {/* Container height fixed by aspect ratio; DoorWallWithStairs SVG matches exactly */}
          <div style={{ aspectRatio: DOOR_WALL_ASPECT, width: "100%", overflow: "hidden" }}>
            <DoorWallWithStairs showCMU={showCMU} showStairs={showStairs} />
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <p className="wall-label" style={{ marginBottom: "0.35rem" }}>
            <strong>{horizPartition.name}</strong>
          </p>
          {/* fillParent + height:100% on SVG letterboxes it to match container height */}
          <div style={{ aspectRatio: DOOR_WALL_ASPECT, width: "100%", overflow: "hidden" }}>
            <WallElevationView wall={horizPartition} forceCMU={showCMU} forceSewer={showSewer} noLayerBar fillParent />
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <p className="wall-label" style={{ marginBottom: "0.35rem" }}>
            <strong>{bathroomEastWall.name}</strong>
          </p>
          <div style={{ aspectRatio: DOOR_WALL_ASPECT, width: "100%", overflow: "hidden" }}>
            <WallElevationView wall={bathroomEastWall} forceCMU={showCMU} forceSewer={showSewer} noLayerBar fillParent
              forceViewBox={`0 0 ${svgW} ${svgH}`} />
          </div>
        </div>
      </div>

      {/* Cut lists row — top-aligned, three columns */}
      <div style={{
        display: "grid",
        gridTemplateColumns: `${stairWidthPct ?? "1fr"} ${partitionWidthPct ?? "1fr"} ${stairWidthPct ?? "1fr"}`,
        gap: "1.5rem",
        alignItems: "start",
        padding: "0.5rem 0.75rem 0.75rem",
        minWidth: 960,
      }}>
        <div className="wall-data-summary">
          <CutList wall={vertPartition} />
        </div>
        <div className="wall-data-summary">
          <CutList wall={horizPartition} />
        </div>
        <div className="wall-data-summary">
          <CutList wall={bathroomEastWall} />
        </div>
      </div>
    </div>
  );
}
