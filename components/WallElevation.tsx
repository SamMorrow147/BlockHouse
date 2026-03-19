"use client";

import { useState, useRef, useCallback } from "react";
import type { WallElevation } from "@/lib/types";
import { computeWallLayout, type Rect, type HeaderRect, SW, PLATE_H, TOP_H } from "@/lib/layout-calculator";
import { PX_PER_INCH } from "@/lib/types";
import {
  CMU_BLOCK_W, CMU_BLOCK_H, CMU_EXT_TOP, CMU_EXT_SIDE,
  FR_D, INT_D, PARTITION_WALL_R, COUNTER_H,
  STAIR_TOTAL_RISERS, STAIR_TREAD_DEPTH, STAIR_LAND_RISERS,
  STAIR_NOSING, STAIR_TREAD_T, STAIR_RISER_T, STAIR_STRINGER_DEPTH, STAIR_STRINGER_FACE,
  STAIR_WIDTH, STAIR_LAND_JOIST_D, STAIR_LAND_JOIST_W,
  STAIR_LAND_RIM_W, STAIR_LAND_DECK_T, STAIR_LAND_POST_W,
  secondFloorNorthWall, secondFloorSouthWall, secondFloorEastWall, secondFloorWestWall,
  STAIR2_START_X, STAIR2_LAND_TOP_W, STAIR2_LAND_BOT_W,
  thirdFloorNorthWall, thirdFloorSouthWall, THIRD_FLOOR_W, THIRD_FLOOR_H,
  WEST_F3_LOW_H, WEST_F3_HIGH_H,
  TJI_DEPTH, TJI_FLANGE_H, TJI_WEB_W, TJI_RIM_T, TJI_OC, SUBFLOOR_T,
  BATH_JOIST_H, BATH_JOIST_OC, BATH_CLEAT_H, BATH_SUBFLOOR_T, BATH_LEDGER_T,
  BATH_VAN_W, TOILET_W, TOILET_TANK_D, TOILET_BOWL_D,
  FRIDGE_W, SMALL_CTR_W,
  FRIDGE_H,
  WASHER_W, WASHER_H, DRYER_W, DRYER_H, WD_GAP, WD_X, WD_TOTAL_W,
  STANDPIPE_H, DRYER_VENT_D,
  NCAB_MAIN_L, NCAB_FRIDGE_L, NCAB_FRIDGE_R,
  NCAB_SMALL_L, NCAB_SMALL_R,
  NCAB_M1_W, NCAB_M2_W, NCAB_M3_W,
  NCAB_U1_W, NCAB_U2_W, NCAB_U3_W,
  CAB_UPPER_BOT, CAB_UPPER_TOP,
  WCAB_L, WCAB_W1, WCAB_W2,
} from "@/lib/framing-data";
import { computeStairLayout } from "@/lib/stair-calculator";
import { FW_IN, planPosToElevationX } from "@/lib/plan-geometry";
import { Toggle } from "@/components/ui/toggle";
import { getElementMetadata } from "@/lib/element-metadata";

// ── Tooltip type ────────────────────────────────────────────────────────────
interface Tip {
  x: number; y: number;
  id: string; label: string;
  dims: string; pos: string;
  connectedTo?: string;
  controls?: string;
}

// ── CMU block layer ─────────────────────────────────────────────────────────

function CMULayer({
  wall, px, wx, wy,
}: {
  wall: WallElevation;
  px: (n: number) => number;
  wx: (xIn: number) => number;
  wy: (yIn: number, hIn?: number) => number;
}) {
  const cmuLeft  = -CMU_EXT_SIDE;
  const cmuRight = wall.totalLengthInches + CMU_EXT_SIDE;
  const cmuTop   = wall.wallHeightInches  + CMU_EXT_TOP;
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
    const startX = course % 2 === 0 ? cmuLeft : cmuLeft - CMU_BLOCK_W / 2;

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

// ── Annotation margins ──────────────────────────────────────────────────────
const AL = 92;
const AT = 120;
const AR = 80;
const AB = 84;
const TK = 5;

function fmt(inches: number): string {
  const ft = Math.floor(inches / 12);
  const rem = inches % 12;
  const r   = Math.round(rem * 8) / 8;
  if (ft === 0) return `${r}"`;
  if (r  === 0) return `${ft}'`;
  return `${ft}'-${r}"`;
}

function fmtDec(n: number): string {
  return Math.abs(n - Math.round(n)) < 0.01 ? `${Math.round(n)}` : n.toFixed(2);
}

// ── Dimension line components ───────────────────────────────────────────────

function HDim({ x1, x2, y, witnessY, label }: { x1: number; x2: number; y: number; witnessY: number; label: string }) {
  const mid = (x1 + x2) / 2;
  return (
    <g>
      <line className="dw" x1={x1} y1={witnessY + 2} x2={x1} y2={y + TK + 1} />
      <line className="dw" x1={x2} y1={witnessY + 2} x2={x2} y2={y + TK + 1} />
      <line className="dl" x1={x1} y1={y} x2={x2} y2={y} />
      <line className="dl" x1={x1 - TK} y1={y - TK} x2={x1 + TK} y2={y + TK} />
      <line className="dl" x1={x2 - TK} y1={y - TK} x2={x2 + TK} y2={y + TK} />
      <text className="dt" x={mid} y={y - 8} textAnchor="middle">{label}</text>
    </g>
  );
}

function VDim({ x, y1, y2, witnessX, label, side = "left" }: { x: number; y1: number; y2: number; witnessX: number; label: string; side?: "left" | "right" }) {
  const mid  = (y1 + y2) / 2;
  const goLeft = x < witnessX;
  const wx1  = goLeft ? witnessX - 2 : witnessX + 2;
  const wx2  = goLeft ? x + TK + 2   : x - TK - 2;
  const tx   = side === "left" ? x - 14 : x + 14;
  return (
    <g>
      <line className="dw" x1={wx1} y1={y1} x2={wx2} y2={y1} />
      <line className="dw" x1={wx1} y1={y2} x2={wx2} y2={y2} />
      <line className="dl" x1={x} y1={y1} x2={x} y2={y2} />
      <line className="dl" x1={x - TK} y1={y1 - TK} x2={x + TK} y2={y1 + TK} />
      <line className="dl" x1={x - TK} y1={y2 - TK} x2={x + TK} y2={y2 + TK} />
      <text className="dt" x={tx} y={mid} textAnchor="middle" transform={`rotate(-90 ${tx} ${mid})`}>{label}</text>
    </g>
  );
}

// ── LayerBtn ────────────────────────────────────────────────────────────────
function LayerBtn({ label, on, toggle }: { label: string; on: boolean; toggle: () => void }) {
  return (
    <Toggle
      pressed={on}
      onPressedChange={toggle}
      size="sm"
      variant="outline"
      className="h-7 px-3 text-xs font-mono rounded-full
                 bg-white border-2 border-zinc-600 text-zinc-700
                 data-[state=on]:bg-zinc-800 data-[state=on]:text-white
                 data-[state=on]:border-zinc-800 hover:bg-zinc-100 hover:border-zinc-700
                 data-[state=on]:hover:bg-zinc-700 transition-all"
    >
      {label}
    </Toggle>
  );
}

// ── Main component ──────────────────────────────────────────────────────────

export function WallElevationView({
  wall,
  interactive = false,
  forceCMU,
  noLayerBar = false,
  fillParent = false,
}: {
  wall: WallElevation;
  interactive?: boolean;
  forceCMU?: boolean;
  noLayerBar?: boolean;
  /** When true, SVG fills its parent container (useful inside fixed-size wrappers). */
  fillParent?: boolean;
}) {
  // Layer toggle state (only used when interactive)
  const [showCMU,      setShowCMU]      = useState(true);
  const [showFrame,    setShowFrame]    = useState(true);
  const [showDims,     setShowDims]     = useState(true);
  const [showStairs,   setShowStairs]   = useState(true);
  const [showBathroom, setShowBathroom] = useState(interactive);
  const [showInterior, setShowInterior] = useState(wall.id === "south" || wall.id === "east");
  const [showAnchors,  setShowAnchors]  = useState(interactive || wall.id === "south");
  const [showOutlets,  setShowOutlets]  = useState(interactive || wall.id === "south");
  const [showSewer,    setShowSewer]    = useState(interactive);
  const [showPlumbing, setShowPlumbing] = useState(false);
  const [showCounter, setShowCounter] = useState(false);

  const hasAnchors = (wall.anchorBolts?.length ?? 0) > 0;

  // For non-interactive walls, all layers on (no stairs/bathroom/interior by default)
  // forceCMU lets a parent component override the CMU visibility from outside
  const cmu   = forceCMU !== undefined ? forceCMU : showCMU;
  const frame = showFrame;
  const dims  = interactive ? showDims     : true;
  const stairs = interactive ? showStairs  : false;
  const bathroom = interactive ? showBathroom : false;
  const interior = (interactive || wall.id === "south" || wall.id === "east") ? showInterior : false;
  const outlets = wall.id === "south" ? showOutlets : false;
  const sewer   = wall.id === "north" ? showSewer   : false;
  const plumbing = wall.id === "north" ? showPlumbing : false;
  const counter = showCounter;
  const anchors = showAnchors && hasAnchors;

  // Tooltip state
  const [tip, setTip] = useState<Tip | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const showTip = useCallback((e: React.MouseEvent, id: string, label: string, dims: string, pos: string) => {
    if (!wrapRef.current) return;
    const br = wrapRef.current.getBoundingClientRect();
    const meta = getElementMetadata(id);
    setTip({
      x: e.clientX - br.left + 16,
      y: e.clientY - br.top - 10,
      id,
      label,
      dims,
      pos,
      connectedTo: meta?.connectedTo,
      controls: meta?.controls,
    });
  }, []);

  const moveTip = useCallback((e: React.MouseEvent) => {
    if (!wrapRef.current) return;
    const br = wrapRef.current.getBoundingClientRect();
    setTip(t => t ? { ...t, x: e.clientX - br.left + 16, y: e.clientY - br.top - 10 } : null);
  }, []);

  const hideTip = useCallback(() => setTip(null), []);

  // Actual lumber size for 2×6 (nominal); dressed dimensions in inches
  const LUMBER_2x6_FACE = "1½";
  const LUMBER_2x6_DEPTH = "5½";

  // Hover wrapper for layout Rects (optional dimsOverride for e.g. stud material size)
  const hoverRect = (r: Rect, className: string, extra?: React.SVGProps<SVGRectElement>, dimsOverride?: string) => (
    <g key={r.id}
      onMouseEnter={(e) => showTip(e, r.id, r.label,
        dimsOverride ?? `${fmtDec(r.width)}" × ${fmtDec(r.height)}"`,
        `x: ${fmtDec(r.x)}"  y: ${fmtDec(r.y)}"`)}
      onMouseMove={moveTip}
      onMouseLeave={hideTip}
      style={{ cursor: "crosshair" }}
    >
      <rect className={className}
        x={wx(r.x)} y={wy(r.y, r.height)} width={px(r.width)} height={px(r.height)}
        {...extra} />
    </g>
  );

  // Hover wrapper for ad-hoc inline elements
  const hoverGroup = (id: string, label: string, w: number, h: number, xIn: number, yIn: number, children: React.ReactNode) => (
    <g key={id}
      onMouseEnter={(e) => showTip(e, id, label,
        `${fmtDec(w)}" × ${fmtDec(h)}"`,
        `x: ${fmtDec(xIn)}"  y: ${fmtDec(yIn)}"`)}
      onMouseMove={moveTip}
      onMouseLeave={hideTip}
      style={{ cursor: "crosshair" }}
    >
      {children}
    </g>
  );

  const layout = computeWallLayout(wall);
  const px = (n: number) => n * PX_PER_INCH;

  const FLOOR2_IN  = layout.wallHeightInches + TJI_DEPTH + SUBFLOOR_T;
  const FLOOR3_IN  = FLOOR2_IN + layout.wallHeightInches + TJI_DEPTH + SUBFLOOR_T;
  const FLOOR4_TOP = FLOOR3_IN + THIRD_FLOOR_H;
  const isNorth = wall.id === "north";
  const isSouth = wall.id === "south";
  const isEast  = wall.id === "east";
  const isWest  = wall.id === "west";
  const hasSecondFloor = isNorth || isSouth || isEast || isWest;
  const totalDisplayH = (isNorth || isSouth) ? FLOOR4_TOP
    : isWest ? FLOOR3_IN + WEST_F3_HIGH_H
    : hasSecondFloor ? FLOOR3_IN
    : layout.wallHeightInches;

  const W = px(layout.totalLengthInches);
  const H = px(totalDisplayH);

  const svgW = AL + W + AR;
  const svgH = AT + H + AB;

  const wx = (xIn: number)              => AL + px(xIn);
  const wy = (yIn: number, hIn = 0)     => AT + H - px(yIn) - px(hIn);

  const floorY = AT + H;
  const topY   = wy(layout.wallHeightInches);
  const wallL  = AL;
  const wallR  = AL + W;

  const sorted = [...wall.openings]
    .filter(o => o.type !== "cmu-only")
    .sort((a, b) => a.positionFromLeftInches - b.positionFromLeftInches);

  // ── Build horizontal chain dim segments ──────────────────────────────────
  const chain: { x1: number; x2: number; label: string }[] = [];
  let prevIn = 0;
  for (const op of sorted) {
    const oL = op.positionFromLeftInches;
    const oR = oL + op.widthInches;
    if (oL > prevIn + 0.01) chain.push({ x1: wx(prevIn), x2: wx(oL), label: fmt(oL - prevIn) });
    chain.push({ x1: wx(oL), x2: wx(oR), label: `${fmt(op.widthInches)} RO` });
    prevIn = oR;
  }
  if (prevIn < layout.totalLengthInches - 0.01) {
    chain.push({ x1: wx(prevIn), x2: wx(layout.totalLengthInches), label: fmt(layout.totalLengthInches - prevIn) });
  }

  const chainY   = floorY + 30;
  const overallY = floorY + 60;
  const hDimX    = AL - 24;
  const opHDimX  = wallR + 28;
  const sillDimX = wallR + 58;

  return (
    <div ref={wrapRef} style={{ position: "relative", ...(fillParent ? { height: "100%" } : {}) }}>
      {/* Layer toggles */}
      {!noLayerBar && <div className="flex flex-wrap gap-1.5 px-3 py-2 bg-zinc-50 border-b border-zinc-200 sticky top-[76px] z-[9] items-center">
        <LayerBtn label="CMU Bricks" on={showCMU}   toggle={() => setShowCMU(v => !v)} />
        <LayerBtn label="Frame"      on={showFrame}  toggle={() => setShowFrame(v => !v)} />
        {interactive && <>
          <LayerBtn label="Dimensions" on={showDims}     toggle={() => setShowDims(v => !v)} />
          <LayerBtn label="Stairs"     on={showStairs}   toggle={() => setShowStairs(v => !v)} />
          <LayerBtn label="Bathroom"   on={showBathroom} toggle={() => setShowBathroom(v => !v)} />
        </>}
        {wall.id === "south" && (
          <LayerBtn label="Outlets" on={showOutlets} toggle={() => setShowOutlets(v => !v)} />
        )}
        {wall.id === "north" && (
          <LayerBtn label="Sewer Outlet" on={showSewer} toggle={() => setShowSewer(v => !v)} />
        )}
        {hasAnchors && (
          <LayerBtn label="Anchor Bolts" on={showAnchors} toggle={() => setShowAnchors(v => !v)} />
        )}
        {/* Off-by-default toggles — left-aligned but last (foremost right in the row) */}
        {(interactive || wall.id === "south" || wall.id === "east") && (
          <LayerBtn label="Cabinets" on={showInterior} toggle={() => setShowInterior(v => !v)} />
        )}
        {wall.id === "north" && (
          <LayerBtn label="Plumbing" on={showPlumbing} toggle={() => setShowPlumbing(v => !v)} />
        )}
      </div>}

      <svg
        viewBox={`0 0 ${svgW} ${svgH}`}
        width="100%"
        preserveAspectRatio="xMidYMid meet"
        style={fillParent ? { display: "block", height: "100%" } : undefined}
      >
        <defs>
          <style>{`
            .cmu    { fill: none;  stroke: #c8a800; stroke-width: 0.75px; }
            .plate  { fill: #fff;  stroke: #010101; stroke-width: 2px;   stroke-linecap: square; }
            .stud   { fill: #fff;  stroke: #010101; stroke-width: 1.5px; stroke-linecap: square; }
            .opening{ fill: none;  stroke: #ababab; stroke-dasharray: 6 4; stroke-width: 0.8px; }
            .header { fill: #fff;  stroke: #010101; stroke-width: 1.5px; stroke-linecap: square; }
            .dl  { stroke: #1a55bb; stroke-width: 0.8px; }
            .dw  { stroke: #1a55bb; stroke-width: 0.5px; opacity: 0.55; }
            .dt  { fill: #1a55bb; font-size: 12px; font-family: ui-monospace, monospace; }
            .ct  { fill: #111;    font-size: 14px; font-family: sans-serif; font-weight: 700; }
            .cd  { fill: #444;    font-size: 12px; font-family: sans-serif; }
            .cbg { fill: rgba(255,255,255,0.9); }
            .stair-fill   { fill: #ede8da; stroke: none; }
            .stair-stroke { fill: none; stroke: #8b7348; stroke-width: 1.5px; stroke-linejoin: miter; }
            .stair-tread   { fill: none; stroke: #a08850; stroke-width: 0.7px; }
            .stair-label   { fill: #8b7348; font-size: 11px; font-family: ui-monospace, monospace; }
          `}</style>
        </defs>

        {/* ── CMU block layer ── */}
        {cmu && <CMULayer wall={wall} px={px} wx={wx} wy={wy} />}

        {/* ── Framing elements ── */}
        {frame && <>
          {layout.bottomPlates.map((r) => hoverRect(r, "plate"))}
          {layout.topPlates.map((r) => hoverRect(r, "plate"))}
          {layout.studs.map((r) => hoverRect(r, "stud", undefined,
            `Lumber: ${LUMBER_2x6_FACE}" × ${LUMBER_2x6_DEPTH}" (2×6)  ·  Length: ${fmtDec(r.height)}"`))}
          {layout.headers.map((r: HeaderRect) => {
            const spec = r.headerSpec;
            const isLVL = spec && spec.label.includes("LVL");
            const isBuiltUp = spec && spec.plies >= 3;
            const isSolid = spec && spec.plies === 1;

            if (isLVL) {
              return hoverGroup(r.id, "LVL Beam", r.width, r.height, r.x, r.y,
                <rect
                  x={wx(r.x)} y={wy(r.y, r.height)} width={px(r.width)} height={px(r.height)}
                  fill="#d4c9a8" stroke="#333" strokeWidth="1.5" strokeLinecap="square"
                />
              );
            }

            if (isBuiltUp) {
              const plies = spec.plies;
              const plyH  = r.height / plies;
              return hoverGroup(r.id, r.label, r.width, r.height, r.x, r.y,
                <>
                  {Array.from({ length: plies }, (_, i) => (
                    <rect key={i}
                      x={wx(r.x)} y={wy(r.y + (i + 1) * plyH, 0)}
                      width={px(r.width)} height={px(plyH)}
                      fill="#fff" stroke="#010101" strokeWidth="1.5" strokeLinecap="square"
                    />
                  ))}
                </>
              );
            }

            if (isSolid) {
              return hoverGroup(r.id, r.label, r.width, r.height, r.x, r.y,
                <rect
                  x={wx(r.x)} y={wy(r.y, r.height)} width={px(r.width)} height={px(r.height)}
                  fill="#fff" stroke="#010101" strokeWidth="1.5" strokeLinecap="square"
                />
              );
            }

            // Fallback — default doubled 2×6 (two equal stacked rects)
            const pieceH = r.height / 2;
            return hoverGroup(r.id, r.label, r.width, r.height, r.x, r.y,
              <>
                <rect className="header"
                  x={wx(r.x)} y={wy(r.y, r.height)} width={px(r.width)} height={px(pieceH)} />
                <rect className="header"
                  x={wx(r.x)} y={wy(r.y, pieceH)}   width={px(r.width)} height={px(pieceH)} />
              </>
            );
          })}
          {layout.sills.map((r) => hoverRect(r, "header"))}
          {layout.openings.map((r) => hoverRect(r, "opening"))}
        </>}

        {/* ── Anchor bolt markers ── */}
        {anchors && (() => {
          const wallLen = wall.totalLengthInches;
          const dirs: Record<string, [string, string]> = {
            south: ["W", "E"], north: ["E", "W"],
            west: ["N", "S"],  east: ["S", "N"],
          };
          const [leftDir, rightDir] = dirs[wall.id] ?? ["L", "R"];
          const plateBot = wy(0, 0);

          return wall.anchorBolts!.map((bx, i) => {
            const cx = wx(bx);
            const cy = wy(0, PLATE_H / 2);
            const fromRight = +(wallLen - bx).toFixed(1);
            const useRight = fromRight < bx;
            const dim = useRight ? fromRight : bx;
            const dir = useRight ? rightDir : leftDir;
            const dimLabel = `${dim}" from ${dir}`;
            const leaderEnd = plateBot + 70;
            const textY = leaderEnd + 3;

            return hoverGroup(
              `${wall.id}-ab-${i}`, "Anchor Bolt",
              0.5, 7, bx, 0,
              <g key={i}>
                <line x1={cx} y1={wy(0, PLATE_H)} x2={cx} y2={plateBot}
                  stroke="#1a55bb" strokeWidth="1.5" />
                <circle cx={cx} cy={cy} r={3}
                  fill="none" stroke="#1a55bb" strokeWidth="1.5" />
                <line x1={cx} y1={plateBot + 2} x2={cx} y2={leaderEnd}
                  stroke="#1a55bb" strokeWidth="0.5" strokeDasharray="2 2" />
                <text x={cx} y={textY}
                  fontSize="9" fill="#1a55bb" textAnchor="end"
                  transform={`rotate(-55, ${cx}, ${textY})`}>
                  {dimLabel}
                </text>
              </g>
            );
          });
        })()}

        {/* ── Floor joists above top plate (South & North walls only) ── */}
        {frame && (wall.id === "south" || wall.id === "north") && (() => {
          const JOIST_W     = SW;
          const wallLen     = layout.totalLengthInches;

          const jBase = layout.wallHeightInches;
          const jTop  = jBase + TJI_DEPTH;

          const joistOffset = JOIST_W / 2;
          const lastJoistX  = wallLen - TJI_RIM_T - JOIST_W;
          const positions: number[] = [];
          for (let x = TJI_OC + joistOffset; x <= lastJoistX; x += TJI_OC) positions.push(x);

          const jFill   = "#e8e4dc";
          const jStroke = "#444";
          const jSW     = 0.7;

          return (
            <g>
              {/* Rim board — left end (closes joist bays) */}
              {hoverGroup(`${wall.id}-rim-left`, "Rim Board (1⅛\" × 9½\")", TJI_RIM_T, TJI_DEPTH, 0, jBase,
                <rect x={wx(0)} y={wy(jBase, TJI_DEPTH)} width={px(TJI_RIM_T)} height={px(TJI_DEPTH)}
                  fill={jFill} stroke={jStroke} strokeWidth={jSW} />
              )}
              {/* Rim board — right end */}
              {hoverGroup(`${wall.id}-rim-right`, "Rim Board (1⅛\" × 9½\")", TJI_RIM_T, TJI_DEPTH, wallLen - TJI_RIM_T, jBase,
                <rect x={wx(wallLen - TJI_RIM_T)} y={wy(jBase, TJI_DEPTH)} width={px(TJI_RIM_T)} height={px(TJI_DEPTH)}
                  fill={jFill} stroke={jStroke} strokeWidth={jSW} />
              )}
              {positions.map((x, i) => {
                const cx = Math.max(TJI_OC + joistOffset, Math.min(lastJoistX, x));
                const jId = `${wall.id}-tji-${i}`;
                return hoverGroup(jId, `TJI Joist #${i}`, JOIST_W * 2, TJI_DEPTH, cx - JOIST_W, jBase,
                  <g>
                    <rect x={wx(cx - JOIST_W)} y={wy(jBase, TJI_FLANGE_H)}
                      width={px(JOIST_W * 2)} height={px(TJI_FLANGE_H)}
                      fill={jFill} stroke={jStroke} strokeWidth={jSW} />
                    <rect x={wx(cx - TJI_WEB_W / 2)} y={wy(jBase + TJI_FLANGE_H, TJI_DEPTH - TJI_FLANGE_H * 2)}
                      width={px(TJI_WEB_W)} height={px(TJI_DEPTH - TJI_FLANGE_H * 2)}
                      fill={jFill} stroke={jStroke} strokeWidth={jSW} />
                    <rect x={wx(cx - JOIST_W)} y={wy(jTop - TJI_FLANGE_H, TJI_FLANGE_H)}
                      width={px(JOIST_W * 2)} height={px(TJI_FLANGE_H)}
                      fill={jFill} stroke={jStroke} strokeWidth={jSW} />
                  </g>
                );
              })}
              {hoverGroup(`${wall.id}-subfloor`, "Subfloor (3/4\" OSB)", wallLen, SUBFLOOR_T, 0, jTop,
                <rect x={wx(0)} y={wy(jTop, SUBFLOOR_T)}
                  width={px(wallLen)} height={px(SUBFLOOR_T)}
                  fill="#c8c0a8" stroke="#444" strokeWidth="0.8" />
              )}
              <line x1={wx(wallLen) + 12} y1={wy(jBase)} x2={wx(wallLen) + 12} y2={wy(jTop)} stroke="#88a" strokeWidth="0.8" />
              <line x1={wx(wallLen) + 8} y1={wy(jBase)} x2={wx(wallLen) + 16} y2={wy(jBase)} stroke="#88a" strokeWidth="0.8" />
              <line x1={wx(wallLen) + 8} y1={wy(jTop)}  x2={wx(wallLen) + 16} y2={wy(jTop)}  stroke="#88a" strokeWidth="0.8" />
              <text x={wx(wallLen) + 20} y={(wy(jBase) + wy(jTop)) / 2 + 3}
                fontSize="7" fill="#88a" fontFamily="ui-monospace,monospace" textAnchor="start">9½″ TJI</text>
            </g>
          );
        })()}

        {/* ── Shared interior constants (north wall) ── */}
        {wall.id === "north" && (() => {
          const SC        = "#555";
          const WL        = "#fff";
          const BKW       = 3;
          const WHW       = 1.2;

          const vwL   = planPosToElevationX("north", PARTITION_WALL_R + INT_D);
          const vwR   = planPosToElevationX("north", PARTITION_WALL_R);
          const vwW   = vwR - vwL;
          const ctrL  = planPosToElevationX("north", PARTITION_WALL_R + INT_D);
          const ctrR  = planPosToElevationX("north", FW_IN);
          const bathL = planPosToElevationX("north", PARTITION_WALL_R);
          const bathR = planPosToElevationX("north", FW_IN);

          return (
            <>
              {/* ── Bathroom layer ── */}
              {bathroom && (
                <g>
                  {hoverGroup(`${wall.id}-partition-vert`, "2×4 Partition Wall (vertical)", vwW, layout.wallHeightInches, vwL, 0,
                    <>
                      <rect x={wx(vwL)} y={wy(0, layout.wallHeightInches)} width={px(vwW)} height={px(layout.wallHeightInches)}
                        fill="rgba(200,195,185,0.5)" stroke={SC} strokeWidth={BKW} />
                      <rect x={wx(vwL)} y={wy(0, layout.wallHeightInches)} width={px(vwW)} height={px(layout.wallHeightInches)}
                        fill="none" stroke={WL} strokeWidth={WHW} />
                    </>
                  )}

                  {/* Backing studs rendered after partition rect so they're visible on top */}
                  {frame && (() => {
                    const bH = layout.wallHeightInches - PLATE_H - TOP_H;
                    const bs: Rect[] = [
                      { id: `${wall.id}-backing-1`, label: "2×6 Backing Stud (T-junction)", x: planPosToElevationX("north", PARTITION_WALL_R + SW), y: PLATE_H, width: SW, height: bH },
                      { id: `${wall.id}-backing-2`, label: "2×6 Backing Stud (T-junction)", x: planPosToElevationX("north", PARTITION_WALL_R + 2 * SW), y: PLATE_H, width: SW, height: bH },
                    ];
                    return <>{bs.map(r => hoverRect(r, "stud", undefined,
                      `Lumber: ${LUMBER_2x6_FACE}" × ${LUMBER_2x6_DEPTH}" (2×6)  ·  Length: ${fmtDec(bH)}"`))}
                    </>;
                  })()}

                  <line x1={wx(bathR)} y1={wy(0)} x2={wx(bathR)} y2={wy(layout.wallHeightInches)}
                    stroke={SC} strokeWidth="1" strokeDasharray="6 4" opacity="0.6" />

                  {/* Raised bathroom floor */}
                  {(() => {
                    const PLAT_H     = STAIR_LAND_RISERS * (FLOOR2_IN / STAIR_TOTAL_RISERS);
                    const jBot       = PLAT_H - BATH_SUBFLOOR_T - BATH_JOIST_H;
                    const jTop       = jBot + BATH_JOIST_H;
                    const sfBot      = jTop;
                    const ledgerH    = jBot - PLATE_H;
                    const platR      = wall.totalLengthInches;

                    const studXs: number[] = [bathL - 1.5];
                    for (let sx = 0; sx <= platR; sx += BATH_JOIST_OC) {
                      if (sx >= bathL - 0.5 && sx <= platR + 0.5) studXs.push(sx);
                    }
                    const rightBound = platR - SW - SW - SW;
                    if (studXs[studXs.length - 1] < rightBound - 0.5) studXs.push(rightBound);

                    return (
                      <g>
                        <rect x={wx(bathL)} y={wy(0, PLATE_H)}
                          width={px(platR - bathL)} height={px(PLATE_H)}
                          fill="rgba(210,200,180,0.10)" stroke="none" />

                        {studXs.map((sx, i) => {
                          const lx = sx + SW;
                          return (
                            <g key={`seat${i}`}>
                              {hoverGroup(`${wall.id}-bath-cleat-${i}`, `Ledger Cleat #${i}`, 1.5, jBot - PLATE_H, sx + SW, PLATE_H,
                                <rect x={wx(sx + SW)} y={wy(PLATE_H, jBot - PLATE_H)} width={px(1.5)} height={px(jBot - PLATE_H)}
                                  fill="#fff" stroke={SC} strokeWidth="0.7" />
                              )}
                              {hoverGroup(`${wall.id}-bath-joist-${i}`, `2×6 Floor Joist #${i}`, SW, BATH_JOIST_H, sx + SW, jBot,
                                <rect x={wx(sx + SW)} y={wy(jBot, BATH_JOIST_H)} width={px(SW)} height={px(BATH_JOIST_H)}
                                  fill="#d8d0bc" stroke={SC} strokeWidth="0.7" />
                              )}
                            </g>
                          );
                        })}

                        {hoverGroup(`${wall.id}-bath-subfloor`, "Bath Subfloor (3/4\" OSB)", platR - bathL, BATH_SUBFLOOR_T, bathL, sfBot,
                          <rect x={wx(bathL)} y={wy(sfBot, BATH_SUBFLOOR_T)}
                            width={px(platR - bathL)} height={px(BATH_SUBFLOOR_T)}
                            fill="#bbb49e" stroke={SC} strokeWidth="0.8" />
                        )}

                        <line x1={wx(bathL)} y1={wy(PLAT_H)} x2={wx(platR)} y2={wy(PLAT_H)}
                          stroke={SC} strokeWidth="1.4" />

                        <line x1={wx(platR) + 6} y1={wy(0)} x2={wx(platR) + 6} y2={wy(PLAT_H)} stroke="#88a" strokeWidth="0.8" />
                        <line x1={wx(platR) + 3} y1={wy(0)}      x2={wx(platR) + 9} y2={wy(0)}      stroke="#88a" strokeWidth="0.8" />
                        <line x1={wx(platR) + 3} y1={wy(PLAT_H)} x2={wx(platR) + 9} y2={wy(PLAT_H)} stroke="#88a" strokeWidth="0.8" />
                        <text x={wx(platR) + 12} y={wy(PLAT_H / 2) + 3}
                          fontSize="7" fill="#88a" fontFamily="ui-monospace,monospace" textAnchor="start">+21¾&quot;</text>
                        <text className="stair-label" textAnchor="middle" fill={SC} fontSize="7"
                          x={wx((bathL + platR) / 2)} y={wy(PLAT_H / 2) + 3}>RAISED FLOOR</text>
                      </g>
                    );
                  })()}

                  {/* ── Bathroom fixtures (vanity + toilet) ── */}
                  {(() => {
                    const PLAT_H = STAIR_LAND_RISERS * (FLOOR2_IN / STAIR_TOTAL_RISERS);
                    const CAB_FILL = "rgba(210,195,170,0.45)";
                    const CS = "#333";
                    const VAN_H = 34.5;
                    const CTR_SLAB = 1.5;

                    const vanL = planPosToElevationX("north", PARTITION_WALL_R);
                    const vanR = planPosToElevationX("north", PARTITION_WALL_R - BATH_VAN_W);
                    const vanW = vanR - vanL;

                    const TS = "#555";
                    const toiletCenterX = vanR + 15.5;
                    const TK_W = TOILET_W;
                    const TK_H = 19;
                    const SEAT_H = 1.5;
                    const LID_H = 1.5;
                    const DRAIN_W = 3;
                    const DRAIN_H = 6;
                    const BOWL_DIA = 14;
                    const STEM_H = 4;
                    const STEM_W = 8;
                    const BOWL_FULL_W = 18;

                    return (
                      <g>
                        {/* Vanity cabinet */}
                        {hoverGroup("north-bath-vanity", `Vanity Cabinet ${BATH_VAN_W}"`, vanW, VAN_H, vanL, PLAT_H,
                          <g>
                            <rect x={wx(vanL)} y={wy(PLAT_H, VAN_H)} width={px(vanW)} height={px(VAN_H)}
                              fill={CAB_FILL} stroke={CS} strokeWidth={1} />
                            <line x1={wx(vanL + vanW / 2)} y1={wy(PLAT_H)} x2={wx(vanL + vanW / 2)} y2={wy(PLAT_H + VAN_H)}
                              stroke={CS} strokeWidth="0.5" strokeDasharray="3 2" />
                          </g>
                        )}
                        {/* Vanity countertop */}
                        <rect x={wx(vanL)} y={wy(PLAT_H + VAN_H, CTR_SLAB)} width={px(vanW)} height={px(CTR_SLAB)}
                          fill="#8B7355" stroke={CS} strokeWidth={1} />
                        {/* Basin inset */}
                        {(() => {
                          const rim = 2;
                          const basinL = vanL + rim;
                          const basinW = vanW - rim * 2;
                          const basinH = 6;
                          const basinBot = PLAT_H + VAN_H - 1;
                          return <>
                            <rect x={wx(basinL)} y={wy(basinBot - basinH, basinH)} width={px(basinW)} height={px(basinH)}
                              fill="#c8dce8" stroke="#336" strokeWidth="0.8" rx="1" />
                            <circle cx={wx(vanL + vanW / 2)} cy={wy(basinBot - basinH / 2)} r={px(1.5)}
                              fill="#aac" stroke="#336" strokeWidth="0.6" />
                          </>;
                        })()}
                        <text x={wx(vanL + vanW / 2)} y={wy(PLAT_H + VAN_H / 3) + 3}
                          fontSize="7" fill={CS} textAnchor="middle" fontFamily="ui-monospace,monospace">VANITY {BATH_VAN_W}&quot;</text>

                        {/* Toilet — side-profile elevation */}
                        {(() => {
                          const cx = toiletCenterX;
                          const stemBot = PLAT_H;
                          const stemTop = stemBot + STEM_H;
                          const bowlBot = stemTop;
                          const bowlTop = bowlBot + BOWL_DIA;
                          const seatY = bowlTop;
                          const tankY = seatY + SEAT_H;
                          const lidY = tankY + TK_H;
                          const totalH = STEM_H + BOWL_DIA + SEAT_H + TK_H + LID_H;

                          const bowlR = BOWL_DIA / 2;
                          const bowlCY = bowlBot + bowlR;

                          const stemPath = [
                            `M ${wx(cx - STEM_W / 2)} ${wy(stemBot)}`,
                            `L ${wx(cx + STEM_W / 2)} ${wy(stemBot)}`,
                            `L ${wx(cx + BOWL_FULL_W / 2)} ${wy(stemTop)}`,
                            `L ${wx(cx - BOWL_FULL_W / 2)} ${wy(stemTop)}`,
                            `Z`,
                          ].join(" ");

                          return hoverGroup("north-bath-toilet", `Toilet ${TK_W}" wide × ${totalH.toFixed(0)}" tall`, BOWL_FULL_W, totalH, cx - BOWL_FULL_W / 2, PLAT_H,
                            <g>
                              {/* Drain pipe (below floor) */}
                              <rect x={wx(cx - DRAIN_W / 2)} y={wy(PLAT_H - DRAIN_H, DRAIN_H)}
                                width={px(DRAIN_W)} height={px(DRAIN_H)}
                                fill="none" stroke={TS} strokeWidth={1} />
                              {/* Stem / pedestal (trapezoid: narrow at floor, widens to bowl) */}
                              <path d={stemPath} fill="rgba(220,230,240,0.6)" stroke={TS} strokeWidth="1" />
                              {/* Bowl (circle) */}
                              <ellipse cx={wx(cx)} cy={wy(bowlCY)}
                                rx={px(BOWL_FULL_W / 2)} ry={px(bowlR)}
                                fill="rgba(220,230,240,0.6)" stroke={TS} strokeWidth="1" />
                              {/* Water line inside bowl */}
                              <ellipse cx={wx(cx)} cy={wy(bowlBot + 4)}
                                rx={px(5)} ry={px(1.5)}
                                fill="rgba(180,210,230,0.5)" stroke="#88a" strokeWidth="0.5" />
                              {/* Seat */}
                              <rect x={wx(cx - BOWL_FULL_W / 2)} y={wy(seatY, SEAT_H)} width={px(BOWL_FULL_W)} height={px(SEAT_H)}
                                fill="rgba(190,200,215,0.7)" stroke={TS} strokeWidth={1} />
                              {/* Tank */}
                              <rect x={wx(cx - TK_W / 2)} y={wy(tankY, TK_H)} width={px(TK_W)} height={px(TK_H)}
                                fill="rgba(220,230,240,0.6)" stroke={TS} strokeWidth={1} />
                              {/* Lid */}
                              <rect x={wx(cx - TK_W / 2)} y={wy(lidY, LID_H)} width={px(TK_W)} height={px(LID_H)}
                                fill="rgba(190,200,215,0.7)" stroke={TS} strokeWidth={1} />
                            </g>
                          );
                        })()}
                        <text x={wx(toiletCenterX)} y={wy(PLAT_H + STEM_H + BOWL_DIA / 2) + 3}
                          fontSize="7" fill={TS} textAnchor="middle" fontFamily="ui-monospace,monospace">WC</text>
                      </g>
                    );
                  })()}

                  {/* ── Shower enclosure (far right / east end of bathroom) ── */}
                  {(() => {
                    const PLAT_H2 = STAIR_LAND_RISERS * (FLOOR2_IN / STAIR_TOTAL_RISERS);
                    const SH_W    = 36;
                    const SH_H    = 80;
                    const CURB_HH = 4;
                    const CURB_WW = 2;
                    const shL     = planPosToElevationX("north", FW_IN + SH_W);
                    const shR     = planPosToElevationX("north", FW_IN);
                    const shW     = shR - shL;
                    const shBase  = PLAT_H2;

                    return (
                      <g>
                        <rect x={wx(shL)} y={wy(shBase, 2)} width={px(shW)} height={px(2)}
                          fill="rgba(180,200,220,0.3)" stroke="#668" strokeWidth="1" />
                        <rect x={wx(shL)} y={wy(shBase, CURB_HH)} width={px(CURB_WW)} height={px(CURB_HH)}
                          fill="rgba(200,200,190,0.5)" stroke="#668" strokeWidth="0.8" />
                        <line x1={wx(shR)} y1={wy(shBase)} x2={wx(shR)} y2={wy(shBase + SH_H)}
                          stroke="#668" strokeWidth="1.5" />
                        <line x1={wx(shL)} y1={wy(shBase + CURB_HH)} x2={wx(shL)} y2={wy(shBase + SH_H)}
                          stroke="#668" strokeWidth="1" strokeDasharray="6 3" />
                        <circle cx={wx(shR - 6)} cy={wy(shBase + SH_H - 6)} r="3"
                          fill="none" stroke="#668" strokeWidth="1" />
                        <line x1={wx(shR - 6)} y1={wy(shBase + SH_H - 6)} x2={wx(shR - 6)} y2={wy(shBase + SH_H - 2)}
                          stroke="#668" strokeWidth="1" />
                        <text x={wx(shL + shW / 2)} y={wy(shBase + SH_H / 2) + 3}
                          fontSize="7" fill="#668" textAnchor="middle" fontFamily="ui-monospace,monospace">SHOWER</text>
                        <text x={wx(shL + shW / 2)} y={wy(shBase + SH_H / 2) + 12}
                          fontSize="6" fill="#668" textAnchor="middle" fontFamily="ui-monospace,monospace">
                          {SH_W}&quot; × {SH_H}&quot;</text>
                      </g>
                    );
                  })()}

                  {/* ── Concrete Slab + DWV Plumbing (routed through raised floor cavity) ── */}
                  {plumbing && (() => {
                    const PLAT_H2   = STAIR_LAND_RISERS * (FLOOR2_IN / STAIR_TOTAL_RISERS);
                    const wallLen   = wall.totalLengthInches;
                    const cmuExt    = CMU_EXT_SIDE;

                    // ── Slab geometry ──
                    const SLAB_RIM    = 12;
                    const SLAB_INT    = 4;
                    const SLAB_RIM_W  = 12;
                    const slabLeft    = -cmuExt;
                    const slabRight   = wallLen + cmuExt;
                    const SC_SL       = "#8a8070";

                    // ── Pipe colours ──
                    const PC        = "#2a7a4a";
                    const VC        = "#6a4aaa";
                    const PW_3      = 3;
                    const PW_2      = 2.375;
                    const PW_15     = 1.9;
                    const PITCH     = 0.25 / 12;

                    // ── Fixture positions ──
                    const SEW_X     = planPosToElevationX("north", FW_IN + 12);
                    const vanCX     = planPosToElevationX("north", PARTITION_WALL_R - BATH_VAN_W / 2);
                    const vanR2     = planPosToElevationX("north", PARTITION_WALL_R - BATH_VAN_W);
                    const toiletCX  = vanR2 + 15.5;
                    const showerCX  = planPosToElevationX("north", FW_IN + 18);
                    const washerSP  = WD_X + WASHER_W / 2;
                    const ventX     = toiletCX + 8;

                    // ── Main drain runs ON TOP of slab, inside the raised floor / landing cavity ──
                    const mainY     = SLAB_INT + 2;  // 6" above floor — sits on slab surface inside raised floor cavity
                    const mainLeft  = washerSP - 5;
                    const mainRight = SEW_X + 3;
                    const mainRun   = mainRight - mainLeft;
                    const mainDrop  = mainRun * PITCH;

                    // Trap heights — all within the raised floor cavity above slab
                    const trapY_vanity  = 14;
                    const trapY_toilet  = 10;
                    const trapY_shower  = 12;
                    const trapY_washer  = 8;

                    return (
                      <g>
                        {/* ═══ CONCRETE SLAB ═══ */}
                        <rect x={wx(slabLeft + SLAB_RIM_W)} y={wy(0)}
                          width={px(slabRight - slabLeft - 2 * SLAB_RIM_W)} height={px(SLAB_INT)}
                          fill="rgba(180,175,165,0.35)" stroke={SC_SL} strokeWidth="1" />
                        <rect x={wx(slabLeft)} y={wy(0)}
                          width={px(SLAB_RIM_W)} height={px(SLAB_RIM)}
                          fill="rgba(180,175,165,0.45)" stroke={SC_SL} strokeWidth="1.2" />
                        <rect x={wx(slabRight - SLAB_RIM_W)} y={wy(0)}
                          width={px(SLAB_RIM_W)} height={px(SLAB_RIM)}
                          fill="rgba(180,175,165,0.45)" stroke={SC_SL} strokeWidth="1.2" />
                        <text x={wx(slabLeft + SLAB_RIM_W / 2)} y={wy(-SLAB_RIM / 2) + 3}
                          fontSize="5" fill={SC_SL} fontFamily="ui-monospace,monospace" textAnchor="middle">12&quot; RIM</text>
                        <text x={wx(wallLen / 2)} y={wy(-SLAB_INT / 2) + 3}
                          fontSize="5.5" fill={SC_SL} fontFamily="ui-monospace,monospace" textAnchor="middle">4&quot; CONCRETE SLAB</text>
                        <text x={wx(slabRight - SLAB_RIM_W / 2)} y={wy(-SLAB_RIM / 2) + 3}
                          fontSize="5" fill={SC_SL} fontFamily="ui-monospace,monospace" textAnchor="middle">12&quot; RIM</text>
                        <line x1={wx(slabLeft) - 6} y1={wy(0)} x2={wx(slabLeft) - 6} y2={wy(-SLAB_RIM)}
                          stroke={SC_SL} strokeWidth="0.6" />
                        <line x1={wx(slabLeft) - 9} y1={wy(0)} x2={wx(slabLeft) - 3} y2={wy(0)}
                          stroke={SC_SL} strokeWidth="0.6" />
                        <line x1={wx(slabLeft) - 9} y1={wy(-SLAB_RIM)} x2={wx(slabLeft) - 3} y2={wy(-SLAB_RIM)}
                          stroke={SC_SL} strokeWidth="0.6" />

                        {/* ═══ PIPE CAVITY — tinted zone above slab, below raised floor ═══ */}
                        <rect x={wx(mainLeft - 5)} y={wy(0, PLAT_H2)}
                          width={px(mainRight - mainLeft + 10)} height={px(PLAT_H2)}
                          fill="rgba(42,122,74,0.04)" stroke="none" />
                        <text x={wx(mainLeft)} y={wy(PLAT_H2 - 2)}
                          fontSize="4.5" fill={PC} fontFamily="ui-monospace,monospace" opacity="0.5">
                          PIPE CAVITY (above slab, below raised floor / landing)</text>

                        {/* ═══ 3" MAIN DRAIN — sloped pipe shape ═══ */}
                        <polygon
                          points={[
                            `${wx(mainLeft)},${wy(mainY + PW_3 / 2)}`,
                            `${wx(mainRight)},${wy(mainY - mainDrop + PW_3 / 2)}`,
                            `${wx(mainRight)},${wy(mainY - mainDrop - PW_3 / 2)}`,
                            `${wx(mainLeft)},${wy(mainY - PW_3 / 2)}`,
                          ].join(" ")}
                          fill="rgba(42,122,74,0.18)" stroke={PC} strokeWidth="1.2" />
                        <line x1={wx(mainLeft)} y1={wy(mainY)}
                          x2={wx(mainRight)} y2={wy(mainY - mainDrop)}
                          stroke={PC} strokeWidth="0.5" strokeDasharray="4 2" />
                        <text x={wx((mainLeft + mainRight) / 2)} y={wy(mainY + PW_3 / 2 + 1) - 4}
                          fontSize="5" fill={PC} fontFamily="ui-monospace,monospace" textAnchor="middle">
                          3&quot; SCH40 PVC · ¼&quot;/ft · {Math.round(mainRun / 12)}&apos; run · {mainDrop.toFixed(1)}&quot; drop</text>

                        {/* ═══ BRANCH PIPES — filled rects from fixture drain to main ═══ */}
                        {/* Each branch: vertical pipe from raised floor down to main drain */}
                        {/* P-trap shown as a U-bend partway down */}

                        {/* ── VANITY 1½" — from sink drain at raised floor down to main ── */}
                        <rect x={wx(vanCX - PW_15 / 2)} y={wy(mainY + PW_3 / 2, PLAT_H2 - mainY - PW_3 / 2)}
                          width={px(PW_15)} height={px(PLAT_H2 - mainY - PW_3 / 2)}
                          fill="rgba(42,122,74,0.2)" stroke={PC} strokeWidth="0.8" />
                        <path d={`M ${wx(vanCX - 4)},${wy(trapY_vanity + 3)} Q ${wx(vanCX)},${wy(trapY_vanity - 3)} ${wx(vanCX + 4)},${wy(trapY_vanity + 3)}`}
                          fill="none" stroke={PC} strokeWidth="2" />
                        <text x={wx(vanCX) - px(PW_15 / 2) - 4} y={wy(PLAT_H2 / 2 + 2) + 3}
                          fontSize="5" fill={PC} fontFamily="ui-monospace,monospace" textAnchor="end"
                          writingMode="tb">1½&quot; SINK</text>

                        {/* ── TOILET 3" — closet bend (no separate trap, toilet has built-in) ── */}
                        <rect x={wx(toiletCX - PW_3 / 2)} y={wy(mainY + PW_3 / 2, PLAT_H2 - mainY - PW_3 / 2)}
                          width={px(PW_3)} height={px(PLAT_H2 - mainY - PW_3 / 2)}
                          fill="rgba(42,122,74,0.2)" stroke={PC} strokeWidth="0.8" />
                        {/* Closet flange at floor level */}
                        <rect x={wx(toiletCX - PW_3)} y={wy(PLAT_H2 - 1, 1)}
                          width={px(PW_3 * 2)} height={px(1)}
                          fill={PC} stroke={PC} strokeWidth="0.5" opacity="0.5" />
                        <text x={wx(toiletCX) + px(PW_3 / 2) + 4} y={wy(PLAT_H2 / 2 + 2) + 3}
                          fontSize="5" fill={PC} fontFamily="ui-monospace,monospace"
                          writingMode="tb">3&quot; CLOSET</text>

                        {/* ── SHOWER 2" — from shower drain at raised floor down to main ── */}
                        <rect x={wx(showerCX - PW_2 / 2)} y={wy(mainY + PW_3 / 2, PLAT_H2 - mainY - PW_3 / 2)}
                          width={px(PW_2)} height={px(PLAT_H2 - mainY - PW_3 / 2)}
                          fill="rgba(42,122,74,0.2)" stroke={PC} strokeWidth="0.8" />
                        <path d={`M ${wx(showerCX - 4)},${wy(trapY_shower + 3)} Q ${wx(showerCX)},${wy(trapY_shower - 3)} ${wx(showerCX + 4)},${wy(trapY_shower + 3)}`}
                          fill="none" stroke={PC} strokeWidth="2" />
                        <text x={wx(showerCX) - px(PW_2 / 2) - 4} y={wy(PLAT_H2 / 2 + 2) + 3}
                          fontSize="5" fill={PC} fontFamily="ui-monospace,monospace" textAnchor="end"
                          writingMode="tb">2&quot; SHOWER</text>

                        {/* ── WASHER 2" — from standpipe trap down to main ── */}
                        <rect x={wx(washerSP - PW_2 / 2)} y={wy(mainY + PW_3 / 2, trapY_washer + 4 - mainY - PW_3 / 2)}
                          width={px(PW_2)} height={px(trapY_washer + 4 - mainY - PW_3 / 2)}
                          fill="rgba(42,122,74,0.2)" stroke={PC} strokeWidth="0.8" />
                        <path d={`M ${wx(washerSP - 4)},${wy(trapY_washer + 3)} Q ${wx(washerSP)},${wy(trapY_washer - 3)} ${wx(washerSP + 4)},${wy(trapY_washer + 3)}`}
                          fill="none" stroke={PC} strokeWidth="2" />
                        <text x={wx(washerSP) + px(PW_2 / 2) + 3} y={wy(trapY_washer - 1)}
                          fontSize="5" fill={PC} fontFamily="ui-monospace,monospace">2&quot; W/TRAP</text>

                        {/* ═══ SEWER STUB — vertical pipe from main down through slab ═══ */}
                        <rect x={wx(SEW_X - PW_3 / 2)} y={wy(-SLAB_RIM, mainY + PW_3 / 2 + SLAB_RIM)}
                          width={px(PW_3)} height={px(mainY + PW_3 / 2 + SLAB_RIM)}
                          fill="rgba(42,122,74,0.25)" stroke={PC} strokeWidth="1" />
                        <text x={wx(SEW_X) + px(PW_3 / 2) + 4} y={wy(-SLAB_INT / 2) + 3}
                          fontSize="5" fill={PC} fontFamily="ui-monospace,monospace">
                          SEWER STUB</text>
                        <text x={wx(SEW_X) + px(PW_3 / 2) + 4} y={wy(-SLAB_INT / 2) + 11}
                          fontSize="4.5" fill={PC} fontFamily="ui-monospace,monospace">
                          (thru slab)</text>
                        {/* Flow arrow pointing down into ground */}
                        <polygon points={[
                          `${wx(SEW_X)},${wy(-SLAB_RIM - 3)}`,
                          `${wx(SEW_X - 2)},${wy(-SLAB_RIM)}`,
                          `${wx(SEW_X + 2)},${wy(-SLAB_RIM)}`,
                        ].join(" ")} fill={PC} />
                        <text x={wx(SEW_X)} y={wy(-SLAB_RIM - 4)}
                          fontSize="4.5" fill={PC} fontFamily="ui-monospace,monospace" textAnchor="middle">
                          → TO SEPTIC</text>

                        {/* ═══ 2" VENT STACK — through wall to roof ═══ */}
                        <line x1={wx(ventX)} y1={wy(mainY + PW_3 / 2)}
                          x2={wx(ventX)} y2={wy(layout.wallHeightInches + 8)}
                          stroke={VC} strokeWidth="1.5" strokeDasharray="4 2" />
                        <text x={wx(ventX) + 6} y={wy(layout.wallHeightInches - 20)}
                          fontSize="5" fill={VC} fontFamily="ui-monospace,monospace">2&quot; VENT</text>
                        <text x={wx(ventX) + 6} y={wy(layout.wallHeightInches - 20) + 7}
                          fontSize="5" fill={VC} fontFamily="ui-monospace,monospace">STACK</text>
                        <polygon points={[
                          `${wx(ventX)},${wy(layout.wallHeightInches + 8)}`,
                          `${wx(ventX) - 3},${wy(layout.wallHeightInches + 5)}`,
                          `${wx(ventX) + 3},${wy(layout.wallHeightInches + 5)}`,
                        ].join(" ")} fill={VC} />
                        <text x={wx(ventX)} y={wy(layout.wallHeightInches + 10)}
                          fontSize="4.5" fill={VC} fontFamily="ui-monospace,monospace" textAnchor="middle">→ THRU ROOF</text>

                        {/* ═══ AAV at washer standpipe ═══ */}
                        <circle cx={wx(washerSP)} cy={wy(STANDPIPE_H + PLATE_H)} r="3"
                          fill="rgba(106,74,170,0.2)" stroke={VC} strokeWidth="1" />
                        <text x={wx(washerSP) + 6} y={wy(STANDPIPE_H + PLATE_H) + 3}
                          fontSize="4.5" fill={VC} fontFamily="ui-monospace,monospace">AAV</text>
                      </g>
                    );
                  })()}

                  <text className="stair-label" textAnchor="middle" fill={SC}
                    x={wx((bathL + bathR) / 2)} y={wy(layout.wallHeightInches - 10)}>BATH</text>
                </g>
              )}

              {/* ── Cabinets layer ── */}
              {interior && (
                <g>
                  {hoverGroup(`${wall.id}-counter`, "Kitchen Counter", ctrR - ctrL, COUNTER_H, ctrL, 0,
                    <>
                      <rect x={wx(ctrL)} y={wy(0, COUNTER_H)} width={px(ctrR - ctrL)} height={px(COUNTER_H)}
                        fill="rgba(220,210,190,0.35)" stroke={SC} strokeWidth={BKW} />
                      <rect x={wx(ctrL)} y={wy(0, COUNTER_H)} width={px(ctrR - ctrL)} height={px(COUNTER_H)}
                        fill="none" stroke={WL} strokeWidth={WHW} />
                    </>
                  )}
                  {hoverGroup(`${wall.id}-countertop`, "Countertop 1.5\" thick", ctrR - ctrL, 1.5, ctrL, COUNTER_H,
                    <rect x={wx(ctrL)} y={wy(COUNTER_H, 1.5)} width={px(ctrR - ctrL)} height={px(1.5)}
                      fill="#8B7355" stroke="#333" strokeWidth={1} />
                  )}
                  <text className="stair-label" textAnchor="middle" fill={SC}
                    x={wx(vwR + 50)} y={wy(layout.wallHeightInches - 6)}>KITCHEN</text>
                  <text className="stair-label" textAnchor="middle" fill={SC} fontSize="8"
                    x={wx((ctrL + ctrR) / 2)} y={wy(COUNTER_H / 2) + 3}>COUNTER {COUNTER_H}&quot;</text>
                </g>
              )}

              {/* ── Washer / Dryer (far left = west end of north wall) ── */}
              {interior && (() => {
                const WD_FILL     = "rgba(170,190,220,0.4)";
                const WD_STROKE   = "#556";
                const WD_SW       = 1.5;
                const wBase       = PLATE_H;     // sit on bottom plate
                const washerL     = WD_X;
                const washerR     = washerL + WASHER_W;
                const dryerL      = washerR + WD_GAP;
                const dryerR      = dryerL + DRYER_W;

                // Standpipe behind washer (visible as a vertical line)
                const spX         = washerL + WASHER_W / 2;
                const spBot       = wBase + 6;           // P-trap ~6" above floor
                const spTop       = wBase + STANDPIPE_H;

                // Dryer vent — small circle on the wall behind dryer
                const ventX       = dryerL + DRYER_W / 2;
                const ventY       = wBase + DRYER_H * 0.6;  // roughly 60% up the dryer

                // Drain pipe run — dashed line from standpipe base toward sewer stub
                const sewX        = planPosToElevationX("north", FW_IN + 12);

                return (
                  <g>
                    {/* ── Washer ── */}
                    {hoverGroup("north-washer", "Front-Load Washer 27\" × 39\"", WASHER_W, WASHER_H, washerL, wBase,
                      <>
                        <rect x={wx(washerL)} y={wy(wBase, WASHER_H)}
                          width={px(WASHER_W)} height={px(WASHER_H)}
                          fill={WD_FILL} stroke={WD_STROKE} strokeWidth={WD_SW} rx="2" />
                        {/* Door circle */}
                        <circle cx={wx(washerL + WASHER_W / 2)} cy={wy(wBase + WASHER_H * 0.45)}
                          r={px(8)} fill="none" stroke={WD_STROKE} strokeWidth="0.8" />
                        <text x={wx(washerL + WASHER_W / 2)} y={wy(wBase + WASHER_H - 4)}
                          fontSize="7" fill={WD_STROKE} textAnchor="middle" fontFamily="ui-monospace,monospace">
                          WASHER
                        </text>
                      </>
                    )}

                    {/* ── Dryer ── */}
                    {hoverGroup("north-dryer", "Front-Load Dryer 27\" × 39\"", DRYER_W, DRYER_H, dryerL, wBase,
                      <>
                        <rect x={wx(dryerL)} y={wy(wBase, DRYER_H)}
                          width={px(DRYER_W)} height={px(DRYER_H)}
                          fill={WD_FILL} stroke={WD_STROKE} strokeWidth={WD_SW} rx="2" />
                        {/* Lint trap line */}
                        <line x1={wx(dryerL + DRYER_W * 0.3)} y1={wy(wBase + DRYER_H * 0.35)}
                          x2={wx(dryerL + DRYER_W * 0.7)} y2={wy(wBase + DRYER_H * 0.35)}
                          stroke={WD_STROKE} strokeWidth="0.6" />
                        <text x={wx(dryerL + DRYER_W / 2)} y={wy(wBase + DRYER_H - 4)}
                          fontSize="7" fill={WD_STROKE} textAnchor="middle" fontFamily="ui-monospace,monospace">
                          DRYER
                        </text>
                      </>
                    )}

                    {/* ── Standpipe (2" PVC, behind washer) ── */}
                    <line x1={wx(spX)} y1={wy(spBot)} x2={wx(spX)} y2={wy(spTop)}
                      stroke="#4a8" strokeWidth="2.5" />
                    <line x1={wx(spX)} y1={wy(spTop)} x2={wx(spX)} y2={wy(spTop)}
                      stroke="#4a8" strokeWidth="2.5" strokeLinecap="round" />
                    {/* P-trap indicator */}
                    <path d={`M ${wx(spX - 3)},${wy(spBot + 2)} Q ${wx(spX)},${wy(spBot - 2)} ${wx(spX + 3)},${wy(spBot + 2)}`}
                      fill="none" stroke="#4a8" strokeWidth="1.5" />
                    <text x={wx(spX) + 8} y={wy(spTop) - 2}
                      fontSize="6" fill="#4a8" fontFamily="ui-monospace,monospace">
                      2&quot; STANDPIPE
                    </text>

                    {/* ── Dryer vent (4" rigid duct, through north wall) ── */}
                    <circle cx={wx(ventX)} cy={wy(ventY)} r={px(DRYER_VENT_D / 2)}
                      fill="none" stroke="#c55" strokeWidth="1.5" />
                    <line x1={wx(ventX)} y1={wy(ventY) - px(DRYER_VENT_D / 2)}
                      x2={wx(ventX)} y2={wy(ventY) + px(DRYER_VENT_D / 2)}
                      stroke="#c55" strokeWidth="0.8" />
                    <line x1={wx(ventX) - px(DRYER_VENT_D / 2)} y1={wy(ventY)}
                      x2={wx(ventX) + px(DRYER_VENT_D / 2)} y2={wy(ventY)}
                      stroke="#c55" strokeWidth="0.8" />
                    <text x={wx(ventX) + px(DRYER_VENT_D / 2) + 4} y={wy(ventY) + 3}
                      fontSize="6" fill="#c55" fontFamily="ui-monospace,monospace">
                      4&quot; VENT
                    </text>

                    {/* Washer drain connects to DWV main in raised floor cavity — see bathroom DWV system */}
                    <text x={wx(spX)} y={wy(spBot - 5)}
                      fontSize="5" fill="#2a7a4a" fontFamily="ui-monospace,monospace" textAnchor="middle">
                      → TO 3&quot; MAIN
                    </text>

                    {/* ── "LAUNDRY" zone label ── */}
                    <text x={wx(WD_X + WD_TOTAL_W / 2)} y={wy(layout.wallHeightInches - 6)}
                      className="stair-label" textAnchor="middle" fill={SC}>
                      LAUNDRY
                    </text>
                  </g>
                );
              })()}
            </>
          );
        })()}

        {/* ── South wall cabinets (toggle) ── */}
        {wall.id === "south" && interior && (() => {
          const CS = "#333";
          const CSW = 1;
          const UH = CAB_UPPER_TOP - CAB_UPPER_BOT;
          const CAB_FILL = "rgba(210,195,170,0.45)";
          const FRIDGE_FILL = "rgba(140,170,210,0.5)";
          const baseCabs: { id: string; label: string; x: number; w: number }[] = [
            { id: "south-cab-base-1", label: `Base Cabinet 36"`, x: NCAB_MAIN_L, w: NCAB_M1_W },
            { id: "south-cab-base-2", label: `Base Cabinet 33"`, x: NCAB_MAIN_L + NCAB_M1_W, w: NCAB_M2_W },
            { id: "south-cab-base-3", label: `Base Cabinet 9"`,  x: NCAB_MAIN_L + NCAB_M1_W + NCAB_M2_W, w: NCAB_M3_W },
          ];
          const upperCabs: { id: string; label: string; x: number; w: number }[] = [
            { id: "south-cab-upper-1", label: `Upper Cabinet 36"`, x: NCAB_MAIN_L, w: NCAB_U1_W },
            { id: "south-cab-upper-2", label: `Upper Cabinet 30"`, x: NCAB_MAIN_L + NCAB_U1_W, w: NCAB_U2_W },
            { id: "south-cab-upper-3", label: `Upper Cabinet 12"`, x: NCAB_MAIN_L + NCAB_U1_W + NCAB_U2_W, w: NCAB_U3_W },
          ];
          return (
            <g>
              {/* Countertop slab */}
              {hoverGroup("south-countertop", "Countertop 1.5\" thick", NCAB_SMALL_R - NCAB_MAIN_L, 1.5, NCAB_MAIN_L, COUNTER_H,
                <rect x={wx(NCAB_MAIN_L)} y={wy(COUNTER_H, 1.5)} width={px(NCAB_SMALL_R - NCAB_MAIN_L)} height={px(1.5)}
                  fill="#8B7355" stroke={CS} strokeWidth={CSW} />
              )}

              {/* Base cabinets — main run */}
              {baseCabs.map(c => hoverGroup(c.id, c.label, c.w, COUNTER_H, c.x, 0,
                <g key={c.id}>
                  <rect x={wx(c.x)} y={wy(0, COUNTER_H)} width={px(c.w)} height={px(COUNTER_H)}
                    fill={CAB_FILL} stroke={CS} strokeWidth={CSW} />
                  <line x1={wx(c.x + c.w / 2)} y1={wy(0)} x2={wx(c.x + c.w / 2)} y2={wy(COUNTER_H)}
                    stroke={CS} strokeWidth="0.5" strokeDasharray="3 2" />
                  <text x={wx(c.x + c.w / 2)} y={wy(COUNTER_H / 2) + 3}
                    fontSize="7" fill={CS} textAnchor="middle" fontFamily="ui-monospace,monospace">{c.w}&quot;</text>
                </g>
              ))}

              {/* Fridge */}
              {hoverGroup("south-cab-fridge", `Refrigerator ${FRIDGE_W}" × ${FRIDGE_H}"`, FRIDGE_W, FRIDGE_H, NCAB_FRIDGE_L, 0,
                <g>
                  <rect x={wx(NCAB_FRIDGE_L)} y={wy(0, FRIDGE_H)} width={px(FRIDGE_W)} height={px(FRIDGE_H)}
                    fill={FRIDGE_FILL} stroke={CS} strokeWidth={CSW} />
                  <line x1={wx(NCAB_FRIDGE_L + FRIDGE_W / 2)} y1={wy(0, FRIDGE_H)} x2={wx(NCAB_FRIDGE_L + FRIDGE_W / 2)} y2={wy(0)}
                    stroke={CS} strokeWidth="0.5" />
                  <line x1={wx(NCAB_FRIDGE_L + FRIDGE_W / 2 - 2)} y1={wy(FRIDGE_H * 0.35)} x2={wx(NCAB_FRIDGE_L + FRIDGE_W / 2 - 2)} y2={wy(FRIDGE_H * 0.65)}
                    stroke={CS} strokeWidth="1.5" strokeLinecap="round" />
                  <line x1={wx(NCAB_FRIDGE_L + FRIDGE_W / 2 + 2)} y1={wy(FRIDGE_H * 0.35)} x2={wx(NCAB_FRIDGE_L + FRIDGE_W / 2 + 2)} y2={wy(FRIDGE_H * 0.65)}
                    stroke={CS} strokeWidth="1.5" strokeLinecap="round" />
                  <text x={wx(NCAB_FRIDGE_L + FRIDGE_W / 2)} y={wy(FRIDGE_H / 2) + 3}
                    fontSize="7" fill={CS} textAnchor="middle" fontFamily="ui-monospace,monospace">FRIDGE {FRIDGE_W}&quot;</text>
                </g>
              )}

              {/* Small counter */}
              {hoverGroup("south-cab-small", `Base Cabinet ${SMALL_CTR_W}"`, SMALL_CTR_W, COUNTER_H, NCAB_SMALL_L, 0,
                <g>
                  <rect x={wx(NCAB_SMALL_L)} y={wy(0, COUNTER_H)} width={px(SMALL_CTR_W)} height={px(COUNTER_H)}
                    fill={CAB_FILL} stroke={CS} strokeWidth={CSW} />
                  <text x={wx(NCAB_SMALL_L + SMALL_CTR_W / 2)} y={wy(COUNTER_H / 2) + 3}
                    fontSize="7" fill={CS} textAnchor="middle" fontFamily="ui-monospace,monospace">{SMALL_CTR_W}&quot;</text>
                </g>
              )}

              {/* Upper cabinets — main run */}
              {upperCabs.map(c => hoverGroup(c.id, c.label, c.w, UH, c.x, CAB_UPPER_BOT,
                <g key={c.id}>
                  <rect x={wx(c.x)} y={wy(CAB_UPPER_BOT, UH)} width={px(c.w)} height={px(UH)}
                    fill={CAB_FILL} stroke={CS} strokeWidth={CSW} />
                  <line x1={wx(c.x + c.w / 2)} y1={wy(CAB_UPPER_BOT)} x2={wx(c.x + c.w / 2)} y2={wy(CAB_UPPER_TOP)}
                    stroke={CS} strokeWidth="0.5" strokeDasharray="3 2" />
                  <text x={wx(c.x + c.w / 2)} y={wy(CAB_UPPER_BOT + UH / 2) + 3}
                    fontSize="7" fill={CS} textAnchor="middle" fontFamily="ui-monospace,monospace">{c.w}&quot;</text>
                </g>
              ))}

              {/* Upper over fridge */}
              {hoverGroup("south-cab-upper-fridge", `Upper Cabinet ${FRIDGE_W}" (over fridge)`, FRIDGE_W, CAB_UPPER_TOP - FRIDGE_H, NCAB_FRIDGE_L, FRIDGE_H,
                <g>
                  <rect x={wx(NCAB_FRIDGE_L)} y={wy(FRIDGE_H, CAB_UPPER_TOP - FRIDGE_H)} width={px(FRIDGE_W)} height={px(CAB_UPPER_TOP - FRIDGE_H)}
                    fill={CAB_FILL} stroke={CS} strokeWidth={CSW} />
                  <text x={wx(NCAB_FRIDGE_L + FRIDGE_W / 2)} y={wy(FRIDGE_H + (CAB_UPPER_TOP - FRIDGE_H) / 2) + 3}
                    fontSize="7" fill={CS} textAnchor="middle" fontFamily="ui-monospace,monospace">{FRIDGE_W}&quot;</text>
                </g>
              )}

              {/* Upper small */}
              {hoverGroup("south-cab-upper-small", `Upper Cabinet ${SMALL_CTR_W}"`, SMALL_CTR_W, UH, NCAB_SMALL_L, CAB_UPPER_BOT,
                <g>
                  <rect x={wx(NCAB_SMALL_L)} y={wy(CAB_UPPER_BOT, UH)} width={px(SMALL_CTR_W)} height={px(UH)}
                    fill={CAB_FILL} stroke={CS} strokeWidth={CSW} />
                  <text x={wx(NCAB_SMALL_L + SMALL_CTR_W / 2)} y={wy(CAB_UPPER_BOT + UH / 2) + 3}
                    fontSize="6" fill={CS} textAnchor="middle" fontFamily="ui-monospace,monospace">{SMALL_CTR_W}&quot;</text>
                </g>
              )}

            </g>
          );
        })()}

        {/* ── South wall outlets (toggle) ── */}
        {wall.id === "south" && outlets && (() => {
          const OW = 4;
          const OH = 4;
          const OY = COUNTER_H + 8;
          const OS = "#555";
          const outletPositions = [
            { id: "south-outlet-ctr-1", label: "Duplex Outlet", x: NCAB_MAIN_L + (NCAB_FRIDGE_L - NCAB_MAIN_L) * 0.3 - OW / 2 },
            { id: "south-outlet-ctr-2", label: "Duplex Outlet", x: NCAB_MAIN_L + (NCAB_FRIDGE_L - NCAB_MAIN_L) * 0.7 - OW / 2 },
            { id: "south-outlet-fridge", label: "Fridge Outlet (20A dedicated)", x: NCAB_FRIDGE_L + FRIDGE_W / 2 - OW / 2 },
            { id: "south-outlet-fridge-r", label: "Duplex Outlet", x: NCAB_FRIDGE_R + 4 },
          ];
          return (
            <g>
              {outletPositions.map(o => hoverGroup(o.id, o.label, OW, OH, o.x, OY,
                <g key={o.id}>
                  {/* Box */}
                  <rect x={wx(o.x)} y={wy(OY, OH)} width={px(OW)} height={px(OH)}
                    fill="#f0f0e8" stroke={OS} strokeWidth="0.8" />
                  {/* Top socket slot */}
                  <rect x={wx(o.x + OW / 2 - 0.5)} y={wy(OY + OH * 0.65, OH * 0.2)}
                    width={px(1)} height={px(OH * 0.2)}
                    fill="#888" stroke="none" />
                  {/* Bottom socket slot */}
                  <rect x={wx(o.x + OW / 2 - 0.5)} y={wy(OY + OH * 0.2, OH * 0.2)}
                    width={px(1)} height={px(OH * 0.2)}
                    fill="#888" stroke="none" />
                </g>
              ))}
            </g>
          );
        })()}

        {/* ── East wall cabinets (toggle) ── */}
        {wall.id === "east" && interior && (() => {
          const CS = "#333";
          const CSW = 1;
          const CAB_FILL = "rgba(210,195,170,0.45)";
          const eastCabs: { id: string; label: string; x: number; w: number }[] = [
            { id: "east-cab-base-1", label: `Base Cabinet ${WCAB_W1}"`, x: WCAB_L, w: WCAB_W1 },
            { id: "east-cab-base-2", label: `Base Cabinet ${WCAB_W2}"`, x: WCAB_L + WCAB_W1, w: WCAB_W2 },
          ];
          return (
            <g>
              {hoverGroup("east-countertop", "Countertop 1.5\" thick", WCAB_W1 + WCAB_W2, 1.5, WCAB_L, COUNTER_H,
                <rect x={wx(WCAB_L)} y={wy(COUNTER_H, 1.5)} width={px(WCAB_W1 + WCAB_W2)} height={px(1.5)}
                  fill="#8B7355" stroke={CS} strokeWidth={CSW} />
              )}
              {eastCabs.map(c => hoverGroup(c.id, c.label, c.w, COUNTER_H, c.x, 0,
                <g key={c.id}>
                  <rect x={wx(c.x)} y={wy(0, COUNTER_H)} width={px(c.w)} height={px(COUNTER_H)}
                    fill={CAB_FILL} stroke={CS} strokeWidth={CSW} />
                  <line x1={wx(c.x + c.w / 2)} y1={wy(0)} x2={wx(c.x + c.w / 2)} y2={wy(COUNTER_H)}
                    stroke={CS} strokeWidth="0.5" strokeDasharray="3 2" />
                  <text x={wx(c.x + c.w / 2)} y={wy(COUNTER_H / 2) + 3}
                    fontSize="7" fill={CS} textAnchor="middle" fontFamily="ui-monospace,monospace">{c.w}&quot;</text>
                </g>
              ))}
            </g>
          );
        })()}

        {/* ── Staircase section (north wall only) — driven by computeStairLayout ── */}
        {stairs && (() => {
          const sWin  = wall.openings[0];
          const landL = sWin.positionFromLeftInches;
          const landR = sWin.positionFromLeftInches + sWin.widthInches;

          const sl = computeStairLayout({
            totalRisers: STAIR_TOTAL_RISERS,
            treadDepth: STAIR_TREAD_DEPTH,
            landRisers: STAIR_LAND_RISERS,
            stairWidth: STAIR_WIDTH,
            floor2Height: FLOOR2_IN,
            stairStartX: landL,
            wallHeightInches: wall.wallHeightInches,
            stringerDepth: STAIR_STRINGER_DEPTH,
            stringerFace: STAIR_STRINGER_FACE,
            treadThickness: STAIR_TREAD_T,
            riserThickness: STAIR_RISER_T,
            nosing: STAIR_NOSING,
            landJoistDepth: STAIR_LAND_JOIST_D,
            landJoistFace: STAIR_LAND_JOIST_W,
            landRimW: STAIR_LAND_RIM_W,
            landDeckT: STAIR_LAND_DECK_T,
            landPostW: STAIR_LAND_POST_W,
            plateH: PLATE_H,
          });

          const FILL = "rgba(220,210,190,0.45)";
          const BK = "#222";
          const WH = "#fff";
          const BK_W = 3.5;
          const WH_W = 1.5;

          // Soffit polygon: fills the enclosed area under the stringer.
          // Point order traces the shape without crossing:
          //   plumb-cut corner → down to floor → across floor → up to landing → seat cut
          // The polygon auto-closes back to the plumb-cut via the diagonal stringer bottom edge.
          const sBottomEdge = sl.stringer.bottomEdge;  // [[stairEndX, plumbCutY], [seatCutX, landH]]
          const soffitPts = [
            `${wx(sBottomEdge[0][0] - 4)},${wy(sBottomEdge[0][1] + 3)}`, // plumb-cut corner (left 4", up 4")
            `${wx(sBottomEdge[0][0] - 24)},${wy(126)}`,             // step point — left 24", up to 126"
            `${wx(sBottomEdge[0][0] - 26)},${wy(114)}`,             // step left 26", up to 114"
            `${wx(sl.soffit.x1)},${wy(0)}`,                       // floor across to landing
            `${wx(sl.soffit.x1)},${wy(sl.soffit.y2)}`,            // up to landing height
            `${wx(sBottomEdge[1][0])},${wy(sBottomEdge[1][1])}`,  // seat cut (stringer base)
          ].join(" ");

          return (
            <g>
              {/* Soffit fill — area under stringer bottom edge to floor */}
              <polygon points={soffitPts} fill={FILL} stroke="none" />

              {/* Stringer — notched 2×12 board (driven by sl.stringer.allPoints) */}
              <polygon
                points={sl.stringer.allPoints.map(([x, y]) => `${wx(x)},${wy(y)}`).join(" ")}
                fill={FILL}
                stroke="none"
              />

              {/* Risers */}
              <g>
                {sl.risers.map(r =>
                  hoverGroup(r.id, r.label, r.width, r.height, r.x, r.y,
                    <rect x={wx(r.x)} y={wy(r.y, r.height)}
                      width={px(r.width)} height={px(r.height)}
                      fill="rgba(240,230,210,0.95)" stroke="#444" strokeWidth="0.9" />
                  )
                )}
              </g>

              {/* Treads */}
              <g>
                {sl.treads.map(r =>
                  hoverGroup(r.id, r.label, r.width, r.height, r.x, r.y,
                    <rect x={wx(r.x)} y={wy(r.y, r.height)}
                      width={px(r.width)} height={px(r.height)}
                      fill="rgba(255,248,235,0.98)" stroke="#444" strokeWidth="1.2" />
                  )
                )}
              </g>

              {/* Stringer bottom edge — hoverable line showing board sizing */}
              <g
                onMouseEnter={(e) => showTip(e, `${wall.id}-stringer-line`, "2×12 Stringer Board",
                  `${fmtDec(STAIR_STRINGER_FACE)}" × ${fmtDec(STAIR_STRINGER_DEPTH)}" (face × depth)  ·  Length: ${fmtDec(sl.stringerLength)}"`,
                  `Angle: ${sl.angleDeg.toFixed(1)}°`
                )}
                onMouseMove={moveTip}
                onMouseLeave={hideTip}
                style={{ cursor: "crosshair" }}
              >
                <line
                  x1={wx(sBottomEdge[0][0] - 22)} y1={wy(sBottomEdge[0][1] - 12)}
                  x2={wx(sl.soffit.x1)} y2={wy(0)}
                  stroke="#8b7348" strokeWidth="2" strokeLinecap="square"
                />
              </g>

              {/* Landing */}
              {sl.landing && hoverGroup(`${wall.id}-landing`, "Landing", landR - landL, sl.landingHeight, landL, 0,
                <>
                  <rect x={wx(landL)} y={wy(sl.landingHeight)} width={px(landR - landL)} height={px(sl.landingHeight)}
                    fill="none" stroke={BK} strokeWidth={BK_W} />
                  {Array.from({ length: STAIR_LAND_RISERS - 1 }, (_, i) => {
                    const y = (i + 1) * sl.riserHeight;
                    return <line key={`apb${i}`} x1={wx(landL)} y1={wy(y)} x2={wx(landR)} y2={wy(y)} stroke={BK} strokeWidth={BK_W} />;
                  })}
                  <rect x={wx(landL)} y={wy(sl.landingHeight)} width={px(landR - landL)} height={px(sl.landingHeight)} fill={FILL} stroke="none" />
                  <rect x={wx(landL)} y={wy(sl.landingHeight)} width={px(landR - landL)} height={px(sl.landingHeight)} fill="none" stroke={WH} strokeWidth={WH_W} />
                  {Array.from({ length: STAIR_LAND_RISERS - 1 }, (_, i) => {
                    const y = (i + 1) * sl.riserHeight;
                    return <line key={`apw${i}`} x1={wx(landL)} y1={wy(y)} x2={wx(landR)} y2={wy(y)} stroke={WH} strokeWidth={WH_W} />;
                  })}
                </>
              )}

              {/* 2nd floor dashed line */}
              <line x1={wx(sl.stairEndX - 6)} y1={wy(FLOOR2_IN)} x2={wx(landR)} y2={wy(FLOOR2_IN)}
                stroke={BK} strokeWidth="1.2" strokeDasharray="5 3" />
              <text className="stair-label" x={wx(sl.stairEndX - 10)} y={wy(FLOOR2_IN) + 4}
                textAnchor="end" fontSize="9" fill={BK}>2ND FLOOR</text>

              {/* Top-of-stair landing indicator — 36" landing at 2nd floor level */}
              <rect x={wx(SW)} y={wy(FLOOR2_IN, 4)}
                width={px(STAIR_WIDTH)} height={px(4)}
                fill="none" stroke="#1a55bb" strokeWidth="0.8" strokeDasharray="6 3" />
              <text fill="#1a55bb" fontSize="9" fontFamily="ui-monospace,monospace"
                x={wx(SW + STAIR_WIDTH / 2)} y={wy(FLOOR2_IN) + 16} textAnchor="middle">
                {STAIR_WIDTH}" LANDING
              </text>

              <text className="stair-label" textAnchor="middle" fill={BK}
                x={wx((landL + landR) / 2)} y={wy(sl.landingHeight / 2) + 4}>LANDING</text>
              <text className="stair-label" textAnchor="middle" fill={BK} fontSize="8"
                x={wx((landL + landR) / 2)} y={wy(sl.landingHeight / 2) + 14}>
                {`${STAIR_LAND_RISERS}R @ ${sl.riserHeight.toFixed(2)}\u2033`}
              </text>
              <text className="stair-label" textAnchor="middle" fill={BK}
                x={wx(landL - (sl.mainTreads * STAIR_TREAD_DEPTH) / 2)} y={wy(sl.landingHeight + sl.totalRise * 0.35)}>
                {sl.mainRisers}R UP
              </text>
              <text className="stair-label" textAnchor="middle" fill={BK} fontSize="8"
                x={wx(landL - (sl.mainTreads * STAIR_TREAD_DEPTH) / 2)} y={wy(sl.landingHeight + sl.totalRise * 0.35) + 12}>
                {`@ ${sl.riserHeight.toFixed(2)}\u2033 ea`}
              </text>
            </g>
          );
        })()}

        {/* ── Sewer outlet (north wall only) ── */}
        {wall.id === "north" && sewer && (() => {
          const SEW_PLAN_X = FW_IN + 12;
          const sewX = planPosToElevationX("north", SEW_PLAN_X);
          const PIPE_W = 4;
          const PIPE_STUB = 10;
          const OPEN_W = 14;
          return (
            <g>
              {/* Pipe stub protruding up from slab — sits below bottom plate */}
              <rect x={wx(sewX - PIPE_W / 2)} y={wy(0, PIPE_STUB)}
                width={px(PIPE_W)} height={px(PIPE_STUB)}
                fill="rgba(220,220,210,0.9)" stroke="#555" strokeWidth="1" />
              {/* Cap/collar at top of stub (at slab surface, y=0) */}
              <rect x={wx(sewX - PIPE_W / 2 - 1)} y={wy(0, 1.5)}
                width={px(PIPE_W + 2)} height={px(1.5)}
                fill="#bbb" stroke="#555" strokeWidth="0.8" />
              {/* Cut opening in slab (dashed) */}
              <rect x={wx(sewX - OPEN_W / 2)} y={wy(0, 2)}
                width={px(OPEN_W)} height={px(2)}
                fill="rgba(80,60,40,0.1)" stroke="#888" strokeWidth="0.8"
                strokeDasharray="4 2" />
              {/* Label — below the wall */}
              <text x={wx(sewX)} y={wy(-PIPE_STUB) + 10}
                fontSize="7" fill="#555" textAnchor="middle" fontFamily="ui-monospace,monospace">
                SEWER STUB
              </text>
            </g>
          );
        })()}


        {/* ── Second floor (north wall only) ── */}
        {isNorth && (() => {
          const f2y          = FLOOR2_IN;
          const f2Layout     = computeWallLayout(secondFloorNorthWall);
          const CMU_TOTAL_H  = 23 * CMU_BLOCK_H;
          const F2_FILL      = "rgba(220,210,190,0.45)";
          const F2_BK        = "#222";
          const offsetRect   = (r: Rect): Rect => ({ ...r, y: r.y + f2y });

          const f2sl = computeStairLayout({
            totalRisers:    STAIR_TOTAL_RISERS,
            treadDepth:     STAIR_TREAD_DEPTH,
            landRisers:     0,
            stairWidth:     STAIR_WIDTH,
            floor2Height:   FLOOR2_IN,
            stairStartX:    STAIR2_START_X,
            wallHeightInches: 116,
            stringerDepth:  STAIR_STRINGER_DEPTH,
            stringerFace:   STAIR_STRINGER_FACE,
            treadThickness: STAIR_TREAD_T,
            riserThickness: STAIR_RISER_T,
            nosing:         STAIR_NOSING,
            landJoistDepth: STAIR_LAND_JOIST_D,
            landJoistFace:  STAIR_LAND_JOIST_W,
            landRimW:       STAIR_LAND_RIM_W,
            landDeckT:      STAIR_LAND_DECK_T,
            landPostW:      STAIR_LAND_POST_W,
            plateH:         PLATE_H,
          });

          // Shift all stringer points up by f2y for the combined coordinate system
          const f2StringerPts = f2sl.stringer.allPoints.map(([x, y]): [number, number] => [x, y + f2y]);

          const wallLen2   = f2Layout.totalLengthInches;
          const JOIST_W2   = SW;
          const jBase2     = f2y + secondFloorNorthWall.wallHeightInches;
          const jTop2      = jBase2 + TJI_DEPTH;
          const joistOff2  = JOIST_W2 / 2;
          const lastJoist2 = wallLen2 - TJI_RIM_T - JOIST_W2;
          const jPos2: number[] = [];
          for (let x = TJI_OC + joistOff2; x <= lastJoist2; x += TJI_OC) jPos2.push(x);
          const jFill2   = "#e8e4dc";
          const jStroke2 = "#444";
          const jSW2     = 0.7;

          return (
            <g>
              {/* CMU continuation above second floor deck */}
              {cmu && (() => {
                const cmuLeft  = -CMU_EXT_SIDE;
                const cmuRight = wall.totalLengthInches + CMU_EXT_SIDE;
                const blocks: React.ReactNode[] = [];
                const firstCourse = Math.floor(FLOOR2_IN / CMU_BLOCK_H);
                const lastCourse  = Math.ceil(CMU_TOTAL_H / CMU_BLOCK_H) - 1;
                for (let course = firstCourse; course <= lastCourse; course++) {
                  const courseBot = course * CMU_BLOCK_H;
                  const courseTop = Math.min(courseBot + CMU_BLOCK_H, CMU_TOTAL_H);
                  const visBot    = Math.max(courseBot, FLOOR2_IN);
                  const blockH    = courseTop - visBot;
                  if (blockH <= 0) continue;
                  const halfOffset = course % 2 === 1 ? CMU_BLOCK_W / 2 : 0;
                  const startX     = cmuLeft - halfOffset;
                  const numBlocks  = Math.ceil((cmuRight - startX) / CMU_BLOCK_W) + 1;
                  for (let b = 0; b < numBlocks; b++) {
                    const bx    = startX + b * CMU_BLOCK_W;
                    const left  = Math.max(bx, cmuLeft);
                    const right = Math.min(bx + CMU_BLOCK_W, cmuRight);
                    if (right <= left) continue;
                    blocks.push(
                      <rect key={`f2cmu-${course}-${b}`}
                        x={wx(left)} y={wy(visBot, blockH)}
                        width={px(right - left)} height={px(blockH)}
                        fill="none" stroke="#c8a800" strokeWidth="0.75" />,
                    );
                  }
                }
                return (
                  <g>
                    {blocks}
                    <line x1={wx(cmuLeft)} y1={wy(CMU_TOTAL_H)} x2={wx(cmuRight)} y2={wy(CMU_TOTAL_H)}
                      stroke="#8B7348" strokeWidth="1.2" strokeDasharray="6 3" />
                    <text x={wx(cmuRight) + 4} y={wy(CMU_TOTAL_H) + 4}
                      fontSize="8" fill="#8B7348" fontFamily="ui-monospace,monospace">T.O. CMU</text>
                  </g>
                );
              })()}

              {/* Second floor frame — plates, studs, TJI joists, subfloor */}
              {frame && (
                <g>
                  {f2Layout.bottomPlates.map(r => hoverRect(offsetRect(r), "plate"))}
                  {f2Layout.topPlates.map(r => hoverRect(offsetRect(r), "plate"))}
                  {f2Layout.studs.map(r => {
                    const or = offsetRect(r);
                    const isKing = r.label.includes("king");
                    const isJack = r.label.includes("jack");
                    return hoverRect(or, isKing ? "stud king" : isJack ? "stud jack" : "stud",
                      undefined, `1½" × 5½" (2×6) — ${fmtDec(r.height)}" tall`);
                  })}
                  {hoverGroup(`${secondFloorNorthWall.id}-rim-left`, "Rim Board (1⅛\" × 9½\")", TJI_RIM_T, TJI_DEPTH, 0, jBase2,
                    <rect x={wx(0)} y={wy(jBase2, TJI_DEPTH)} width={px(TJI_RIM_T)} height={px(TJI_DEPTH)}
                      fill={jFill2} stroke={jStroke2} strokeWidth={jSW2} />
                  )}
                  {hoverGroup(`${secondFloorNorthWall.id}-rim-right`, "Rim Board (1⅛\" × 9½\")", TJI_RIM_T, TJI_DEPTH, wallLen2 - TJI_RIM_T, jBase2,
                    <rect x={wx(wallLen2 - TJI_RIM_T)} y={wy(jBase2, TJI_DEPTH)} width={px(TJI_RIM_T)} height={px(TJI_DEPTH)}
                      fill={jFill2} stroke={jStroke2} strokeWidth={jSW2} />
                  )}
                  {jPos2.map((x, i) => {
                    const cx  = Math.max(TJI_OC + joistOff2, Math.min(lastJoist2, x));
                    const jId = `${secondFloorNorthWall.id}-tji-${i}`;
                    return hoverGroup(jId, `TJI Joist #${i}`, JOIST_W2 * 2, TJI_DEPTH, cx - JOIST_W2, jBase2,
                      <g key={jId}>
                        <rect x={wx(cx - JOIST_W2)} y={wy(jBase2, TJI_FLANGE_H)}
                          width={px(JOIST_W2 * 2)} height={px(TJI_FLANGE_H)}
                          fill={jFill2} stroke={jStroke2} strokeWidth={jSW2} />
                        <rect x={wx(cx - TJI_WEB_W / 2)} y={wy(jBase2 + TJI_FLANGE_H, TJI_DEPTH - TJI_FLANGE_H * 2)}
                          width={px(TJI_WEB_W)} height={px(TJI_DEPTH - TJI_FLANGE_H * 2)}
                          fill={jFill2} stroke={jStroke2} strokeWidth={jSW2} />
                        <rect x={wx(cx - JOIST_W2)} y={wy(jTop2 - TJI_FLANGE_H, TJI_FLANGE_H)}
                          width={px(JOIST_W2 * 2)} height={px(TJI_FLANGE_H)}
                          fill={jFill2} stroke={jStroke2} strokeWidth={jSW2} />
                      </g>
                    );
                  })}
                  {hoverGroup(`${secondFloorNorthWall.id}-subfloor`, "Subfloor (3/4\" OSB — 3rd floor)", wallLen2, SUBFLOOR_T, 0, jTop2,
                    <rect x={wx(0)} y={wy(jTop2, SUBFLOOR_T)}
                      width={px(wallLen2)} height={px(SUBFLOOR_T)}
                      fill="#c8c0a8" stroke="#444" strokeWidth="0.8" />
                  )}
                  <line x1={wx(wallLen2) + 12} y1={wy(jBase2)} x2={wx(wallLen2) + 12} y2={wy(jTop2)} stroke="#88a" strokeWidth="0.8" />
                  <line x1={wx(wallLen2) + 8}  y1={wy(jBase2)} x2={wx(wallLen2) + 16}  y2={wy(jBase2)} stroke="#88a" strokeWidth="0.8" />
                  <line x1={wx(wallLen2) + 8}  y1={wy(jTop2)}  x2={wx(wallLen2) + 16}  y2={wy(jTop2)}  stroke="#88a" strokeWidth="0.8" />
                  <text x={wx(wallLen2) + 20} y={(wy(jBase2) + wy(jTop2)) / 2 + 3}
                    fontSize="7" fill="#88a" fontFamily="ui-monospace,monospace" textAnchor="start">9½″ TJI</text>
                </g>
              )}

              {/* Second floor stair run */}
              {stairs && (
                <g>
                  {/* Soffit fill — area under second floor stringer bottom edge to deck */}
                  {(() => {
                    const f2Bottom = f2sl.stringer.bottomEdge.map(([x, y]): [number, number] => [x, y + f2y]);
                    const f2SoffitPts = [
                      `${wx(f2Bottom[0][0] - 4)},${wy(f2Bottom[0][1] + 3)}`,  // plumb-cut corner (left 4", up 4")
                      `${wx(f2Bottom[0][0] - 24)},${wy(f2y + 126)}`,           // step point — left 24", up to f2y+126"
                      `${wx(f2Bottom[0][0] - 26)},${wy(f2y + 114)}`,           // step left 26", up to f2y+114"
                      `${wx(f2Bottom[0][0] + 109)},${wy(f2y + 2)}`,             // right 135", down 102" → f2y+2"
                      `${wx(f2sl.soffit.x1)},${wy(f2y)}`,                      // deck across to landing
                      `${wx(f2sl.soffit.x1)},${wy(f2sl.soffit.y2 + f2y)}`,    // up to landing height
                      `${wx(f2Bottom[1][0])},${wy(f2Bottom[1][1])}`,           // seat cut (stringer base)
                    ].join(" ");
                    return <polygon points={f2SoffitPts} fill={F2_FILL} stroke="none" />;
                  })()}

                  {/* Stringer — notched 2×12 board */}
                  <polygon
                    points={f2StringerPts.map(([x, y]) => `${wx(x)},${wy(y)}`).join(" ")}
                    fill={F2_FILL}
                    stroke="none"
                  />

                  {/* Risers */}
                  {f2sl.risers.map(r =>
                    hoverGroup(`f2-${r.id}`, r.label, r.width, r.height, r.x, r.y + f2y,
                      <rect x={wx(r.x)} y={wy(r.y + f2y, r.height)}
                        width={px(r.width)} height={px(r.height)}
                        fill="rgba(240,230,210,0.95)" stroke="#444" strokeWidth="0.9" />
                    )
                  )}

                  {/* Treads */}
                  {f2sl.treads.map(r =>
                    hoverGroup(`f2-${r.id}`, r.label, r.width, r.height, r.x, r.y + f2y,
                      <rect x={wx(r.x)} y={wy(r.y + f2y, r.height)}
                        width={px(r.width)} height={px(r.height)}
                        fill="rgba(255,248,235,0.98)" stroke="#444" strokeWidth="1.2" />
                    )
                  )}

                  {/* Stringer bottom edge — hoverable line showing board sizing */}
                  {(() => {
                    const f2Bottom = f2sl.stringer.bottomEdge.map(([x, y]): [number, number] => [x, y + f2y]);
                    return (
                      <g
                        onMouseEnter={(e) => showTip(e, "f2-stringer-line", "2×12 Stringer Board",
                          `${fmtDec(STAIR_STRINGER_FACE)}" × ${fmtDec(STAIR_STRINGER_DEPTH)}" (face × depth)  ·  Length: ${fmtDec(f2sl.stringerLength)}"`,
                          `Angle: ${f2sl.angleDeg.toFixed(1)}°`
                        )}
                        onMouseMove={moveTip}
                        onMouseLeave={hideTip}
                        style={{ cursor: "crosshair" }}
                      >
                        <line
                          x1={wx(f2Bottom[0][0] - 34)} y1={wy(f2Bottom[0][1])}
                          x2={wx(f2Bottom[1][0] - 24)} y2={wy(f2Bottom[1][1])}
                          stroke="#8b7348" strokeWidth="2" strokeLinecap="square"
                        />
                      </g>
                    );
                  })()}

                  {/* Bottom landing indicator */}
                  <rect x={wx(STAIR2_START_X)} y={wy(f2y, 4)}
                    width={px(STAIR2_LAND_BOT_W)} height={px(4)}
                    fill="none" stroke="#1a55bb" strokeWidth="0.8" strokeDasharray="6 3" />
                  <text fill="#1a55bb" fontSize="9" fontFamily="ui-monospace,monospace"
                    x={wx(STAIR2_START_X + STAIR2_LAND_BOT_W / 2)} y={wy(f2y) + 16} textAnchor="middle">
                    {STAIR2_LAND_BOT_W}&quot; LANDING
                  </text>

                  {/* Top landing indicator — left-anchored, mirrors first-floor indicator */}
                  <rect x={wx(SW)} y={wy(FLOOR3_IN, 4)}
                    width={px(STAIR2_LAND_TOP_W)} height={px(4)}
                    fill="none" stroke="#1a55bb" strokeWidth="0.8" strokeDasharray="6 3" />
                  <text fill="#1a55bb" fontSize="9" fontFamily="ui-monospace,monospace"
                    x={wx(SW + STAIR2_LAND_TOP_W / 2)} y={wy(FLOOR3_IN) + 16} textAnchor="middle">
                    {STAIR2_LAND_TOP_W}&quot; LANDING
                  </text>

                  {/* Third floor line */}
                  <line x1={wx(0)} y1={wy(FLOOR3_IN)} x2={wx(wall.totalLengthInches)} y2={wy(FLOOR3_IN)}
                    stroke={F2_BK} strokeWidth="1.2" strokeDasharray="5 3" />
                  <text x={wx(0) - 4} y={wy(FLOOR3_IN) + 4} fill={F2_BK} fontSize="9"
                    fontFamily="ui-monospace,monospace" textAnchor="end">3RD FLOOR</text>

                  {/* Stair labels */}
                  <text className="stair-label" textAnchor="middle" fill={F2_BK}
                    x={wx(STAIR2_START_X - (f2sl.mainTreads * STAIR_TREAD_DEPTH) / 2)}
                    y={wy(f2y + f2sl.totalRise * 0.35)}>
                    {f2sl.mainRisers}R UP
                  </text>
                  <text className="stair-label" textAnchor="middle" fill={F2_BK} fontSize="8"
                    x={wx(STAIR2_START_X - (f2sl.mainTreads * STAIR_TREAD_DEPTH) / 2)}
                    y={wy(f2y + f2sl.totalRise * 0.35) + 12}>
                    {`@ ${f2sl.riserHeight.toFixed(2)}\u2033 ea`}
                  </text>
                </g>
              )}

            </g>
          );
        })()}

        {/* ── South wall — second floor ── */}
        {isSouth && (() => {
          const f2y        = FLOOR2_IN;
          const s2Layout   = computeWallLayout(secondFloorSouthWall);
          const wallLen2   = s2Layout.totalLengthInches;
          const s2Offset   = (r: Rect): Rect => ({ ...r, y: r.y + f2y });
          const CMU_TOTAL_H = 23 * CMU_BLOCK_H;
          const jBase2     = f2y + secondFloorSouthWall.wallHeightInches;
          const jTop2      = jBase2 + TJI_DEPTH;
          const JOIST_W2   = SW;
          const joistOff2  = JOIST_W2 / 2;
          const lastJoist2 = wallLen2 - TJI_RIM_T - JOIST_W2;
          const jPos2: number[] = [];
          for (let x = TJI_OC + joistOff2; x <= lastJoist2; x += TJI_OC) jPos2.push(x);
          const jFill2   = "#e8e4dc";
          const jStroke2 = "#444";
          const jSW2     = 0.7;
          const S2_BK    = "#222";

          return (
            <g>
              {/* CMU continuation */}
              {cmu && (() => {
                const cmuLeft  = -CMU_EXT_SIDE;
                const cmuRight = wall.totalLengthInches + CMU_EXT_SIDE;
                const voids    = wall.openings.map(op => ({
                  left:   op.positionFromLeftInches,
                  right:  op.positionFromLeftInches + op.widthInches,
                  bottom: op.sillHeightInches ?? 0,
                  top:    (op.sillHeightInches ?? 0) + op.heightInches,
                }));
                const blocks: React.ReactNode[] = [];
                const firstCourse = Math.floor(FLOOR2_IN / CMU_BLOCK_H);
                const lastCourse  = Math.ceil(CMU_TOTAL_H / CMU_BLOCK_H) - 1;
                for (let course = firstCourse; course <= lastCourse; course++) {
                  const courseBot  = course * CMU_BLOCK_H;
                  const courseTop  = Math.min(courseBot + CMU_BLOCK_H, CMU_TOTAL_H);
                  const visBot     = Math.max(courseBot, FLOOR2_IN);
                  const blockH     = courseTop - visBot;
                  if (blockH <= 0) continue;
                  const halfOffset = course % 2 === 1 ? CMU_BLOCK_W / 2 : 0;
                  const startX     = cmuLeft - halfOffset;
                  const numBlocks  = Math.ceil((cmuRight - startX) / CMU_BLOCK_W) + 1;
                  for (let b = 0; b < numBlocks; b++) {
                    const bx    = startX + b * CMU_BLOCK_W;
                    const left  = Math.max(bx, cmuLeft);
                    const right = Math.min(bx + CMU_BLOCK_W, cmuRight);
                    if (right <= left) continue;
                    // Clip segments around any voids (windows/openings in CMU)
                    let segs: { x1: number; x2: number }[] = [{ x1: left, x2: right }];
                    for (const v of voids) {
                      if (courseTop <= v.bottom || courseBot >= v.top) continue;
                      const next: { x1: number; x2: number }[] = [];
                      for (const s of segs) {
                        if (s.x2 <= v.left || s.x1 >= v.right) { next.push(s); }
                        else {
                          if (s.x1 < v.left)  next.push({ x1: s.x1,   x2: v.left  });
                          if (s.x2 > v.right) next.push({ x1: v.right, x2: s.x2   });
                        }
                      }
                      segs = next;
                    }
                    for (const seg of segs) {
                      if (seg.x2 - seg.x1 < 0.25) continue;
                      blocks.push(
                        <rect key={`s2cmu-${course}-${b}-${seg.x1.toFixed(1)}`}
                          x={wx(seg.x1)} y={wy(visBot, blockH)}
                          width={px(seg.x2 - seg.x1)} height={px(blockH)}
                          fill="none" stroke="#c8a800" strokeWidth="0.75" />,
                      );
                    }
                  }
                }
                return (
                  <g>
                    {blocks}
                    <line x1={wx(cmuLeft)} y1={wy(CMU_TOTAL_H)} x2={wx(cmuRight)} y2={wy(CMU_TOTAL_H)}
                      stroke="#8B7348" strokeWidth="1.2" strokeDasharray="6 3" />
                    <text x={wx(cmuRight) + 4} y={wy(CMU_TOTAL_H) + 4}
                      fontSize="8" fill="#8B7348" fontFamily="ui-monospace,monospace">T.O. CMU</text>
                  </g>
                );
              })()}

              {/* Second floor frame — plates, studs, headers, sills, TJI joists, subfloor */}
              {frame && (
                <g>
                  {s2Layout.bottomPlates.map(r => hoverRect(s2Offset(r), "plate"))}
                  {s2Layout.topPlates.map(r => hoverRect(s2Offset(r), "plate"))}
                  {s2Layout.studs.map(r =>
                    hoverRect(s2Offset(r), "stud", undefined, `1½" × 5½" (2×6) — ${fmtDec(r.height)}" tall`)
                  )}
                  {/* Headers */}
                  {s2Layout.headers.map((r) => {
                    const or2 = s2Offset(r);
                    const pieceH = or2.height / 2;
                    return hoverGroup(or2.id, or2.label, or2.width, or2.height, or2.x, or2.y,
                      <>
                        <rect className="header"
                          x={wx(or2.x)} y={wy(or2.y, or2.height)} width={px(or2.width)} height={px(pieceH)} />
                        <rect className="header"
                          x={wx(or2.x)} y={wy(or2.y, pieceH)}   width={px(or2.width)} height={px(pieceH)} />
                      </>
                    );
                  })}
                  {/* Sills */}
                  {s2Layout.sills.map(r => hoverRect(s2Offset(r), "header"))}
                  {/* Opening outlines */}
                  {s2Layout.openings.map(r => hoverRect(s2Offset(r), "opening"))}
                  {hoverGroup("south-2-rim-left", "Rim Board (1⅛\" × 9½\")", TJI_RIM_T, TJI_DEPTH, 0, jBase2,
                    <rect x={wx(0)} y={wy(jBase2, TJI_DEPTH)} width={px(TJI_RIM_T)} height={px(TJI_DEPTH)}
                      fill={jFill2} stroke={jStroke2} strokeWidth={jSW2} />
                  )}
                  {hoverGroup("south-2-rim-right", "Rim Board (1⅛\" × 9½\")", TJI_RIM_T, TJI_DEPTH, wallLen2 - TJI_RIM_T, jBase2,
                    <rect x={wx(wallLen2 - TJI_RIM_T)} y={wy(jBase2, TJI_DEPTH)} width={px(TJI_RIM_T)} height={px(TJI_DEPTH)}
                      fill={jFill2} stroke={jStroke2} strokeWidth={jSW2} />
                  )}
                  {jPos2.map((x, i) => {
                    const cx  = Math.max(TJI_OC + joistOff2, Math.min(lastJoist2, x));
                    const jId = `south-2-tji-${i}`;
                    return hoverGroup(jId, `TJI Joist #${i}`, JOIST_W2 * 2, TJI_DEPTH, cx - JOIST_W2, jBase2,
                      <g key={jId}>
                        <rect x={wx(cx - JOIST_W2)} y={wy(jBase2, TJI_FLANGE_H)}
                          width={px(JOIST_W2 * 2)} height={px(TJI_FLANGE_H)}
                          fill={jFill2} stroke={jStroke2} strokeWidth={jSW2} />
                        <rect x={wx(cx - TJI_WEB_W / 2)} y={wy(jBase2 + TJI_FLANGE_H, TJI_DEPTH - TJI_FLANGE_H * 2)}
                          width={px(TJI_WEB_W)} height={px(TJI_DEPTH - TJI_FLANGE_H * 2)}
                          fill={jFill2} stroke={jStroke2} strokeWidth={jSW2} />
                        <rect x={wx(cx - JOIST_W2)} y={wy(jTop2 - TJI_FLANGE_H, TJI_FLANGE_H)}
                          width={px(JOIST_W2 * 2)} height={px(TJI_FLANGE_H)}
                          fill={jFill2} stroke={jStroke2} strokeWidth={jSW2} />
                      </g>
                    );
                  })}
                  {hoverGroup("south-2-subfloor", "Subfloor (3/4\" OSB — 3rd floor)", wallLen2, SUBFLOOR_T, 0, jTop2,
                    <rect x={wx(0)} y={wy(jTop2, SUBFLOOR_T)}
                      width={px(wallLen2)} height={px(SUBFLOOR_T)}
                      fill="#c8c0a8" stroke="#444" strokeWidth="0.8" />
                  )}
                  <line x1={wx(wallLen2) + 12} y1={wy(jBase2)} x2={wx(wallLen2) + 12} y2={wy(jTop2)} stroke="#88a" strokeWidth="0.8" />
                  <line x1={wx(wallLen2) + 8}  y1={wy(jBase2)} x2={wx(wallLen2) + 16} y2={wy(jBase2)} stroke="#88a" strokeWidth="0.8" />
                  <line x1={wx(wallLen2) + 8}  y1={wy(jTop2)}  x2={wx(wallLen2) + 16} y2={wy(jTop2)}  stroke="#88a" strokeWidth="0.8" />
                  <text x={wx(wallLen2) + 20} y={(wy(jBase2) + wy(jTop2)) / 2 + 3}
                    fontSize="7" fill="#88a" fontFamily="ui-monospace,monospace" textAnchor="start">9½″ TJI</text>
                </g>
              )}

              {/* Second floor deck level line + label */}
              <line x1={wx(0)} y1={wy(f2y)} x2={wx(wallLen2)} y2={wy(f2y)}
                stroke={S2_BK} strokeWidth="1.2" strokeDasharray="5 3" />
              <text x={wx(0) - 4} y={wy(f2y) + 4} fill={S2_BK} fontSize="9"
                fontFamily="ui-monospace,monospace" textAnchor="end">2ND FLOOR</text>
            </g>
          );
        })()}

        {/* ── South wall — third floor (partial, right/west end) ── */}
        {isSouth && (() => {
          const f3y        = FLOOR3_IN;
          const f3Layout   = computeWallLayout(thirdFloorSouthWall);
          // On the south elevation, west end = RIGHT side
          // Third floor starts at totalLength - THIRD_FLOOR_W from left
          const f3XOffset  = wall.totalLengthInches - THIRD_FLOOR_W;
          const f3Offset   = (r: Rect): Rect => ({ ...r, x: r.x + f3XOffset, y: r.y + f3y });
          const F3_BK      = "#222";
          const F3_FILL    = "rgba(220,210,190,0.45)";

          // Align third-floor studs with second-floor joists below (same grid as jPos2)
          const wallLen2   = secondFloorSouthWall.totalLengthInches;
          const JOIST_W2   = SW;
          const joistOff2  = JOIST_W2 / 2;
          const lastJoist2 = wallLen2 - TJI_RIM_T - JOIST_W2;
          const f3StudXs: number[] = [];
          for (let x = TJI_OC + joistOff2; x <= lastJoist2; x += TJI_OC) {
            if (x >= f3XOffset && x <= f3XOffset + THIRD_FLOOR_W)
              f3StudXs.push(x - SW / 2); // stud left edge = joist center - half stud width
          }
          // End studs at left and right of third-floor section
          if (f3StudXs.length === 0 || f3StudXs[0] > f3XOffset + 0.5) f3StudXs.unshift(f3XOffset);
          const rightStudX = f3XOffset + THIRD_FLOOR_W - SW;
          if (f3StudXs[f3StudXs.length - 1] < rightStudX - 0.5) f3StudXs.push(rightStudX);
          f3StudXs.sort((a, b) => a - b);
          const f3StudH = THIRD_FLOOR_H - PLATE_H - TOP_H;

          return (
            <g>
              {/* Third floor frame — plates & studs (studs aligned to joists below) */}
              {frame && (
                <g>
                  {f3Layout.bottomPlates.map(r => hoverRect(f3Offset(r), "plate"))}
                  {f3Layout.topPlates.map(r => hoverRect(f3Offset(r), "plate"))}
                  {f3StudXs.map((studX, i) => {
                    const r: Rect = { id: `south-3-stud-${i}`, label: "2×6 Stud", x: studX, y: f3y + PLATE_H, width: SW, height: f3StudH };
                    return hoverRect(r, "stud", undefined, `1½" × 5½" (2×6) — ${fmtDec(f3StudH)}" tall`);
                  })}
                </g>
              )}

              {/* Balcony edge — dashed vertical where partial floor ends */}
              <line x1={wx(f3XOffset)} y1={wy(f3y)} x2={wx(f3XOffset)} y2={wy(f3y + THIRD_FLOOR_H)}
                stroke={F3_BK} strokeWidth="1.5" strokeDasharray="8 4" />
              <text x={wx(f3XOffset) - 5} y={wy(f3y + THIRD_FLOOR_H / 2) + 4}
                fill={F3_BK} fontSize="9" fontFamily="ui-monospace,monospace" textAnchor="end">
                OPEN BALCONY →
              </text>

              {/* Third floor deck line */}
              <line x1={wx(f3XOffset)} y1={wy(f3y)} x2={wx(f3XOffset + THIRD_FLOOR_W)} y2={wy(f3y)}
                stroke={F3_BK} strokeWidth="1.2" />

              {/* Top-plate line (roof line) */}
              <line x1={wx(f3XOffset)} y1={wy(f3y + THIRD_FLOOR_H)} x2={wx(f3XOffset + THIRD_FLOOR_W)} y2={wy(f3y + THIRD_FLOOR_H)}
                stroke={F3_BK} strokeWidth="1.5" />

              {/* Wall-height dimension on left side */}
              <line x1={wx(f3XOffset) - 18} y1={wy(f3y)} x2={wx(f3XOffset) - 18} y2={wy(f3y + THIRD_FLOOR_H)}
                stroke="#88a" strokeWidth="0.8" />
              <line x1={wx(f3XOffset) - 22} y1={wy(f3y)} x2={wx(f3XOffset) - 14} y2={wy(f3y)}
                stroke="#88a" strokeWidth="0.8" />
              <line x1={wx(f3XOffset) - 22} y1={wy(f3y + THIRD_FLOOR_H)} x2={wx(f3XOffset) - 14} y2={wy(f3y + THIRD_FLOOR_H)}
                stroke="#88a" strokeWidth="0.8" />
              <text x={wx(f3XOffset) - 24} y={(wy(f3y) + wy(f3y + THIRD_FLOOR_H)) / 2 + 3}
                fontSize="7" fill="#88a" fontFamily="ui-monospace,monospace" textAnchor="end">
                {THIRD_FLOOR_H}&quot;
              </text>

              {/* "3RD FLOOR" label */}
              <text x={wx(f3XOffset + THIRD_FLOOR_W) + 4} y={wy(f3y) + 4} fill={F3_BK} fontSize="9"
                fontFamily="ui-monospace,monospace" textAnchor="start">3RD FLOOR</text>
            </g>
          );
        })()}

        {/* ── East / West walls — second floor (shared helper) ── */}
        {(isEast || isWest) && (() => {
          const f2Wall   = isEast ? secondFloorEastWall : secondFloorWestWall;
          const wallId   = isEast ? "east-2" : "west-2";
          const f2y      = FLOOR2_IN;
          const f2Layout = computeWallLayout(f2Wall);
          const wallLen2 = f2Layout.totalLengthInches;
          const f2Offset = (r: Rect): Rect => ({ ...r, y: r.y + f2y });
          const CMU_TOTAL_H = 23 * CMU_BLOCK_H;
          const jBase2   = f2y + f2Wall.wallHeightInches;
          const jTop2    = jBase2 + TJI_DEPTH;
          const JOIST_W2 = SW;
          const joistOff2  = JOIST_W2 / 2;
          const lastJoist2 = wallLen2 - TJI_RIM_T - JOIST_W2;
          const jPos2: number[] = [];
          for (let x = TJI_OC + joistOff2; x <= lastJoist2; x += TJI_OC) jPos2.push(x);
          const jFill2   = "#e8e4dc";
          const jStroke2 = "#444";
          const jSW2     = 0.7;
          const EW_BK    = "#222";

          return (
            <g>
              {/* CMU continuation */}
              {cmu && (() => {
                const cmuLeft  = -CMU_EXT_SIDE;
                const cmuRight = wall.totalLengthInches + CMU_EXT_SIDE;
                const voids    = wall.openings.map(op => ({
                  left:   op.positionFromLeftInches,
                  right:  op.positionFromLeftInches + op.widthInches,
                  bottom: op.sillHeightInches ?? 0,
                  top:    (op.sillHeightInches ?? 0) + op.heightInches,
                }));
                const blocks: React.ReactNode[] = [];
                const firstCourse = Math.floor(FLOOR2_IN / CMU_BLOCK_H);
                const lastCourse  = Math.ceil(CMU_TOTAL_H / CMU_BLOCK_H) - 1;
                for (let course = firstCourse; course <= lastCourse; course++) {
                  const courseBot  = course * CMU_BLOCK_H;
                  const courseTop  = Math.min(courseBot + CMU_BLOCK_H, CMU_TOTAL_H);
                  const visBot     = Math.max(courseBot, FLOOR2_IN);
                  const blockH     = courseTop - visBot;
                  if (blockH <= 0) continue;
                  const halfOffset = course % 2 === 1 ? CMU_BLOCK_W / 2 : 0;
                  const startX     = cmuLeft - halfOffset;
                  const numBlocks  = Math.ceil((cmuRight - startX) / CMU_BLOCK_W) + 1;
                  for (let b = 0; b < numBlocks; b++) {
                    const bx    = startX + b * CMU_BLOCK_W;
                    const left  = Math.max(bx, cmuLeft);
                    const right = Math.min(bx + CMU_BLOCK_W, cmuRight);
                    if (right <= left) continue;
                    let segs: { x1: number; x2: number }[] = [{ x1: left, x2: right }];
                    for (const v of voids) {
                      if (courseTop <= v.bottom || courseBot >= v.top) continue;
                      const next: { x1: number; x2: number }[] = [];
                      for (const s of segs) {
                        if (s.x2 <= v.left || s.x1 >= v.right) { next.push(s); }
                        else {
                          if (s.x1 < v.left)  next.push({ x1: s.x1,   x2: v.left  });
                          if (s.x2 > v.right) next.push({ x1: v.right, x2: s.x2   });
                        }
                      }
                      segs = next;
                    }
                    for (const seg of segs) {
                      if (seg.x2 - seg.x1 < 0.25) continue;
                      blocks.push(
                        <rect key={`${wallId}-cmu-${course}-${b}-${seg.x1.toFixed(1)}`}
                          x={wx(seg.x1)} y={wy(visBot, blockH)}
                          width={px(seg.x2 - seg.x1)} height={px(blockH)}
                          fill="none" stroke="#c8a800" strokeWidth="0.75" />,
                      );
                    }
                  }
                }
                return (
                  <g>
                    {blocks}
                    <line x1={wx(cmuLeft)} y1={wy(CMU_TOTAL_H)} x2={wx(cmuRight)} y2={wy(CMU_TOTAL_H)}
                      stroke="#8B7348" strokeWidth="1.2" strokeDasharray="6 3" />
                    <text x={wx(cmuRight) + 4} y={wy(CMU_TOTAL_H) + 4}
                      fontSize="8" fill="#8B7348" fontFamily="ui-monospace,monospace">T.O. CMU</text>
                  </g>
                );
              })()}

              {/* Second floor frame */}
              {frame && (
                <g>
                  {f2Layout.bottomPlates.map(r => hoverRect(f2Offset(r), "plate"))}
                  {f2Layout.topPlates.map(r => hoverRect(f2Offset(r), "plate"))}
                  {f2Layout.studs.map(r =>
                    hoverRect(f2Offset(r), "stud", undefined, `1½" × 5½" (2×6) — ${fmtDec(r.height)}" tall`)
                  )}
                  {/* Second floor — headers */}
                  {f2Layout.headers.map((r) => {
                    const or2 = f2Offset(r);
                    const pieceH = or2.height / 2;
                    return hoverGroup(or2.id, or2.label, or2.width, or2.height, or2.x, or2.y,
                      <>
                        <rect className="header"
                          x={wx(or2.x)} y={wy(or2.y, or2.height)} width={px(or2.width)} height={px(pieceH)} />
                        <rect className="header"
                          x={wx(or2.x)} y={wy(or2.y, pieceH)}   width={px(or2.width)} height={px(pieceH)} />
                      </>
                    );
                  })}
                  {/* Second floor — sills */}
                  {f2Layout.sills.map(r => hoverRect(f2Offset(r), "header"))}
                  {/* Second floor — opening outlines (dashed) */}
                  {f2Layout.openings.map(r => hoverRect(f2Offset(r), "opening"))}
                  {/* Window subtype labels inside opening voids */}
                  {f2Layout.openings.map((r, i) => {
                    const srcOp = f2Wall.openings.filter(o => o.type !== "cmu-only")[i];
                    if (!srcOp?.openingSubtype) return null;
                    const or2 = f2Offset(r);
                    const cx = wx(or2.x + or2.width / 2);
                    const cy = wy(or2.y + or2.height / 2);
                    return (
                      <g key={`${r.id}-label`}>
                        <text x={cx} y={cy - 5} textAnchor="middle"
                          fontSize="8" fill="#4a90d9" fontFamily="ui-monospace,monospace"
                          fontWeight="600" letterSpacing="0.04em">
                          {srcOp.openingSubtype.toUpperCase()}
                        </text>
                        <text x={cx} y={cy + 7} textAnchor="middle"
                          fontSize="7" fill="#888" fontFamily="ui-monospace,monospace">
                          {fmtDec(r.width)}&quot; × {fmtDec(r.height)}&quot;
                        </text>
                      </g>
                    );
                  })}
                  {hoverGroup(`${wallId}-rim-left`, "Rim Board (1⅛\" × 9½\")", TJI_RIM_T, TJI_DEPTH, 0, jBase2,
                    <rect x={wx(0)} y={wy(jBase2, TJI_DEPTH)} width={px(TJI_RIM_T)} height={px(TJI_DEPTH)}
                      fill={jFill2} stroke={jStroke2} strokeWidth={jSW2} />
                  )}
                  {hoverGroup(`${wallId}-rim-right`, "Rim Board (1⅛\" × 9½\")", TJI_RIM_T, TJI_DEPTH, wallLen2 - TJI_RIM_T, jBase2,
                    <rect x={wx(wallLen2 - TJI_RIM_T)} y={wy(jBase2, TJI_DEPTH)} width={px(TJI_RIM_T)} height={px(TJI_DEPTH)}
                      fill={jFill2} stroke={jStroke2} strokeWidth={jSW2} />
                  )}
                  {jPos2.map((x, i) => {
                    const cx  = Math.max(TJI_OC + joistOff2, Math.min(lastJoist2, x));
                    const jId = `${wallId}-tji-${i}`;
                    return hoverGroup(jId, `TJI Joist #${i}`, JOIST_W2 * 2, TJI_DEPTH, cx - JOIST_W2, jBase2,
                      <g key={jId}>
                        <rect x={wx(cx - JOIST_W2)} y={wy(jBase2, TJI_FLANGE_H)}
                          width={px(JOIST_W2 * 2)} height={px(TJI_FLANGE_H)}
                          fill={jFill2} stroke={jStroke2} strokeWidth={jSW2} />
                        <rect x={wx(cx - TJI_WEB_W / 2)} y={wy(jBase2 + TJI_FLANGE_H, TJI_DEPTH - TJI_FLANGE_H * 2)}
                          width={px(TJI_WEB_W)} height={px(TJI_DEPTH - TJI_FLANGE_H * 2)}
                          fill={jFill2} stroke={jStroke2} strokeWidth={jSW2} />
                        <rect x={wx(cx - JOIST_W2)} y={wy(jTop2 - TJI_FLANGE_H, TJI_FLANGE_H)}
                          width={px(JOIST_W2 * 2)} height={px(TJI_FLANGE_H)}
                          fill={jFill2} stroke={jStroke2} strokeWidth={jSW2} />
                      </g>
                    );
                  })}
                  {hoverGroup(`${wallId}-subfloor`, "Subfloor (3/4\" OSB — 3rd floor)", wallLen2, SUBFLOOR_T, 0, jTop2,
                    <rect x={wx(0)} y={wy(jTop2, SUBFLOOR_T)}
                      width={px(wallLen2)} height={px(SUBFLOOR_T)}
                      fill="#c8c0a8" stroke="#444" strokeWidth="0.8" />
                  )}
                  <line x1={wx(wallLen2) + 12} y1={wy(jBase2)} x2={wx(wallLen2) + 12} y2={wy(jTop2)} stroke="#88a" strokeWidth="0.8" />
                  <line x1={wx(wallLen2) + 8}  y1={wy(jBase2)} x2={wx(wallLen2) + 16} y2={wy(jBase2)} stroke="#88a" strokeWidth="0.8" />
                  <line x1={wx(wallLen2) + 8}  y1={wy(jTop2)}  x2={wx(wallLen2) + 16} y2={wy(jTop2)}  stroke="#88a" strokeWidth="0.8" />
                  <text x={wx(wallLen2) + 20} y={(wy(jBase2) + wy(jTop2)) / 2 + 3}
                    fontSize="7" fill="#88a" fontFamily="ui-monospace,monospace" textAnchor="start">9½″ TJI</text>
                </g>
              )}

              {/* Second floor deck level line + label */}
              <line x1={wx(0)} y1={wy(f2y)} x2={wx(wallLen2)} y2={wy(f2y)}
                stroke={EW_BK} strokeWidth="1.2" strokeDasharray="5 3" />
              <text x={wx(0) - 4} y={wy(f2y) + 4} fill={EW_BK} fontSize="9"
                fontFamily="ui-monospace,monospace" textAnchor="end">2ND FLOOR</text>
            </g>
          );
        })()}

        {/* ── Third floor — west wall shed roof ── */}
        {isWest && (() => {
          const f3y   = FLOOR3_IN;
          const W3    = wall.totalLengthInches; // 166"
          const BK    = "#222";
          const OC    = wall.studSpacingOC;     // 16"

          // Height at any x position along the shed slope
          const shedH = (x: number) =>
            WEST_F3_LOW_H + (WEST_F3_HIGH_H - WEST_F3_LOW_H) * (x / W3);

          // Generate studs: full-width bottom plate, each stud trimmed to slope
          const studs: { x: number; h: number }[] = [];
          for (let x = SW; x <= W3 - SW - OC / 2; x += OC) studs.push({ x, h: shedH(x) - PLATE_H * 2 });
          // King studs at each end
          const leftH  = shedH(0);
          const rightH = shedH(W3);

          // Roof slope polygon outline (trapezoid): bottom-left → top-left → top-right → bottom-right
          const roofPts = [
            `${wx(0)},${wy(f3y)}`,
            `${wx(0)},${wy(f3y + leftH)}`,
            `${wx(W3)},${wy(f3y + rightH)}`,
            `${wx(W3)},${wy(f3y)}`,
          ].join(" ");

          return (
            <g>
              {/* Shed roof wall outline */}
              <polygon points={roofPts} fill="none" stroke={BK} strokeWidth="1.5" />

              {frame && (
                <g>
                  {/* Bottom plate */}
                  <rect x={wx(0)} y={wy(f3y, PLATE_H)} width={px(W3)} height={px(PLATE_H)}
                    fill="#fff" stroke="#010101" strokeWidth="1.2" />

                  {/* Left king stud */}
                  <rect x={wx(0)} y={wy(f3y + PLATE_H, leftH - PLATE_H * 2)} width={px(SW)} height={px(leftH - PLATE_H * 2)}
                    fill="#fff" stroke="#010101" strokeWidth="1.2" />

                  {/* Field studs — each trimmed to slope */}
                  {studs.map((s, i) => (
                    <rect key={i}
                      x={wx(s.x)} y={wy(f3y + PLATE_H, s.h)} width={px(SW)} height={px(s.h)}
                      fill="#fff" stroke="#010101" strokeWidth="1" />
                  ))}

                  {/* Right king stud */}
                  <rect x={wx(W3 - SW)} y={wy(f3y + PLATE_H, rightH - PLATE_H * 2)} width={px(SW)} height={px(rightH - PLATE_H * 2)}
                    fill="#fff" stroke="#010101" strokeWidth="1.2" />

                  {/* Top plate — follows slope (rendered as a line) */}
                  <line
                    x1={wx(0)}  y1={wy(f3y + leftH  - PLATE_H)}
                    x2={wx(W3)} y2={wy(f3y + rightH - PLATE_H)}
                    stroke="#010101" strokeWidth="1.5" />
                  <line
                    x1={wx(0)}  y1={wy(f3y + leftH)}
                    x2={wx(W3)} y2={wy(f3y + rightH)}
                    stroke="#010101" strokeWidth="1.5" />
                </g>
              )}

              {/* Roof line label */}
              <text x={wx(W3 / 2)} y={wy(f3y + shedH(W3 / 2)) - 6}
                fill={BK} fontSize="8" fontFamily="ui-monospace,monospace" textAnchor="middle">
                SHED ROOF — {WEST_F3_LOW_H}&quot; low · {WEST_F3_HIGH_H}&quot; high
              </text>

              {/* 3rd floor deck line */}
              <line x1={wx(0)} y1={wy(f3y)} x2={wx(W3)} y2={wy(f3y)}
                stroke={BK} strokeWidth="1.2" strokeDasharray="5 3" />
              <text x={wx(0) - 4} y={wy(f3y) + 4} fill={BK} fontSize="9"
                fontFamily="ui-monospace,monospace" textAnchor="end">3RD FLOOR</text>

              {/* Height dimensions — left and right ends */}
              <line x1={wx(0) - 10} y1={wy(f3y)} x2={wx(0) - 10} y2={wy(f3y + leftH)} stroke="#88a" strokeWidth="0.8" />
              <line x1={wx(0) - 14} y1={wy(f3y)} x2={wx(0) - 6}  y2={wy(f3y)} stroke="#88a" strokeWidth="0.8" />
              <line x1={wx(0) - 14} y1={wy(f3y + leftH)} x2={wx(0) - 6} y2={wy(f3y + leftH)} stroke="#88a" strokeWidth="0.8" />
              <text x={wx(0) - 18} y={(wy(f3y) + wy(f3y + leftH)) / 2 + 3}
                fill="#88a" fontSize="7" fontFamily="ui-monospace,monospace" textAnchor="end">{WEST_F3_LOW_H}&quot;</text>

              <line x1={wx(W3) + 10} y1={wy(f3y)} x2={wx(W3) + 10} y2={wy(f3y + rightH)} stroke="#88a" strokeWidth="0.8" />
              <line x1={wx(W3) + 6}  y1={wy(f3y)} x2={wx(W3) + 14} y2={wy(f3y)} stroke="#88a" strokeWidth="0.8" />
              <line x1={wx(W3) + 6}  y1={wy(f3y + rightH)} x2={wx(W3) + 14} y2={wy(f3y + rightH)} stroke="#88a" strokeWidth="0.8" />
              <text x={wx(W3) + 18} y={(wy(f3y) + wy(f3y + rightH)) / 2 + 3}
                fill="#88a" fontSize="7" fontFamily="ui-monospace,monospace" textAnchor="start">{WEST_F3_HIGH_H}&quot;</text>
            </g>
          );
        })()}

        {/* ── Third floor partial wall ── */}
        {isNorth && (() => {
          const f3y       = FLOOR3_IN;
          const f3XStart  = 0;  // left edge stays at west end of north wall
          // Snap right edge to the last joist center at or before THIRD_FLOOR_W
          // Joists are at TJI_OC + SW/2, TJI_OC*2 + SW/2, ... (same grid as second-floor joists)
          const joistOff3 = SW / 2;
          const f3XEnd    = Math.floor((THIRD_FLOOR_W - joistOff3) / TJI_OC) * TJI_OC + joistOff3; // → 112.75"
          const f3Layout  = computeWallLayout({ ...thirdFloorNorthWall, totalLengthInches: f3XEnd });
          const f3Offset  = (r: Rect): Rect => ({ ...r, y: r.y + f3y });
          const F3_BK     = "#222";
          const F3_FILL   = "rgba(220,210,190,0.45)";

          return (
            <g>
              {/* Partial third-floor wall — studs & plates */}
              {frame && (
                <g>
                  {f3Layout.bottomPlates.map(r => hoverRect(f3Offset(r), "plate"))}
                  {f3Layout.topPlates.map(r => hoverRect(f3Offset(r), "plate"))}
                  {f3Layout.studs.map(r =>
                    hoverRect(f3Offset(r), "stud", undefined, `1½" × 5½" (2×6) — ${fmtDec(r.height)}" tall`)
                  )}
                </g>
              )}


              {/* ── Stair headroom opening — framed triangular cut at third-floor corner ── *
               *  Right angle at (f3XEnd, f3y).  Triangle extends RIGHT into the
               *  open balcony zone.  Wall aligned over joist at f3XStart.
               *    • bottom plate along the deck
               *    • angled cripple studs at 16" OC (each with a slope-cut top)
               *    • doubled 2×6 diagonal header along the hypotenuse              */}
              {(() => {
                const slope     = (FLOOR2_IN / STAIR_TOTAL_RISERS) / STAIR_TREAD_DEPTH;
                const xStairTop = STAIR2_START_X - (STAIR_TOTAL_RISERS - 1) * STAIR_TREAD_DEPTH;
                const xRight    = f3XEnd;
                const hFull     = (xRight - xStairTop) * slope * 0.45;
                const spanFull  = hFull / slope;
                const xFar      = xRight + spanFull;
                const yBot      = f3y;
                const yTop      = f3y + hFull;

                // Diagonal geometry
                const hypLen   = Math.sqrt(spanFull * spanFull + hFull * hFull);
                const angleDeg = Math.atan2(hFull, spanFull) * 180 / Math.PI;
                // Normal perpendicular to slope (into solid area — below the hypotenuse)
                const nx = -(hFull / hypLen);
                const ny = -(spanFull / hypLen);
                const beamW  = SW;                 // face width of one 2×6
                const beamW2 = SW * 2;             // doubled header total width

                // Diagonal header — 4 corners of the doubled 2×6 beam
                // Hypotenuse runs from A (top-left) to B (bottom-right)
                const ax = xRight, ay = yTop;
                const bx = xFar,   by = yBot;
                // Outer edge (void side = hypotenuse line)
                // Inner edge (solid side = offset by beamW2 perpendicular)
                const hdrPts = [
                  { x: ax,                y: ay                },
                  { x: bx,                y: by                },
                  { x: bx + beamW2 * nx,  y: by + beamW2 * ny },
                  { x: ax + beamW2 * nx,  y: ay + beamW2 * ny },
                ];

                // Height of the bottom (inner) beam edge at any x position:
                // beamBottomY(x) = slope*(xFar - x) + beamW2 * (hypLen / spanFull) offset
                // Simplified: beam inner edge y above floor at x =
                //   hFull*(xFar-x)/spanFull - beamW2*(hypLen/spanFull)
                const beamVertProj = beamW2 * hypLen / spanFull; // vertical projection of beam width
                const beamBotY = (x: number) =>
                  yBot + hFull * (xFar - x) / spanFull - beamVertProj;

                // Cripple studs — from bottom plate to bottom edge of diagonal header
                const OC       = 16;
                const cripBase = yBot + PLATE_H;  // sit on bottom plate
                const cripples: { x: number; h: number }[] = [];
                for (let cx = xRight + OC; cx < xFar - SW * 2; cx += OC) {
                  const hAtX = beamBotY(cx) - cripBase;
                  if (hAtX > 2) cripples.push({ x: cx, h: hAtX });
                }

                // Mid-line of diagonal header (for the split line between the two plies)
                const midPts = [
                  { x: ax + beamW * nx,  y: ay + beamW * ny },
                  { x: bx + beamW * nx,  y: by + beamW * ny },
                ];

                return (
                  <g>
                    {/* Light void fill so the opening reads as open air */}
                    <polygon
                      points={[
                        `${wx(xRight)},${wy(yBot)}`,
                        `${wx(xRight)},${wy(yTop)}`,
                        `${wx(xFar)},${wy(yBot)}`,
                      ].join(" ")}
                      fill="rgba(200,230,255,0.08)"
                    />

                    {/* ── Bottom plate (along floor deck) ── */}
                    {hoverGroup("stair-open-bp", "Bottom Plate — stair opening", spanFull, PLATE_H, xRight, yBot,
                      <rect className="plate"
                        x={wx(xRight)} y={wy(yBot, PLATE_H)}
                        width={px(spanFull)} height={px(PLATE_H)} />
                    )}

                    {/* ── Angled cripple studs ── */}
                    {cripples.map((c, i) => {
                      // Each cripple has an angled top cut matching the diagonal slope
                      const topY      = cripBase + c.h;
                      const topYRight = cripBase + c.h - SW * slope; // slope cut across stud width
                      return (
                        <g key={`stair-crip-${i}`}
                          onMouseEnter={(e) => showTip(e, `stair-crip-${i}`,
                            "2×6 Cripple (angled top)",
                            `1½" × ${fmtDec(c.h)}" — top cut ${angleDeg.toFixed(1)}°`,
                            `x: ${fmtDec(c.x)}"  y: ${fmtDec(cripBase)}"`)}
                          onMouseMove={moveTip}
                          onMouseLeave={hideTip}
                          style={{ cursor: "crosshair" }}
                        >
                          <polygon
                            points={[
                              `${wx(c.x)},${wy(cripBase)}`,
                              `${wx(c.x)},${wy(topY)}`,
                              `${wx(c.x + SW)},${wy(topYRight)}`,
                              `${wx(c.x + SW)},${wy(cripBase)}`,
                            ].join(" ")}
                            fill="#fff" stroke="#010101" strokeWidth="1.5" strokeLinecap="square"
                          />
                        </g>
                      );
                    })}

                    {/* ── Doubled 2×6 diagonal header ── */}
                    <g
                      onMouseEnter={(e) => showTip(e, "stair-open-hdr",
                        "(2) 2×6 Diagonal Header",
                        `${fmtDec(hypLen)}" long — ${angleDeg.toFixed(1)}° from horizontal`,
                        `Doubled 2×6, each end beveled`)}
                      onMouseMove={moveTip}
                      onMouseLeave={hideTip}
                      style={{ cursor: "crosshair" }}
                    >
                      {/* Full beam outline */}
                      <polygon
                        points={hdrPts.map(p => `${wx(p.x)},${wy(p.y)}`).join(" ")}
                        fill="#fff" stroke="#010101" strokeWidth="1.5" strokeLinecap="square"
                      />
                      {/* Center split line (shows doubled plies) */}
                      <line
                        x1={wx(midPts[0].x)} y1={wy(midPts[0].y)}
                        x2={wx(midPts[1].x)} y2={wy(midPts[1].y)}
                        stroke="#010101" strokeWidth="0.8"
                      />
                    </g>

                    {/* ── Label in void area ── */}
                    <text
                      x={wx(xRight + spanFull * 0.42)}
                      y={wy(yBot + hFull * 0.18)}
                      fontSize="7.5" fill="#446" fontWeight="600"
                      fontFamily="ui-monospace,monospace" textAnchor="middle">
                      STAIR HEADROOM
                    </text>
                    <text
                      x={wx(xRight + spanFull * 0.42)}
                      y={wy(yBot + hFull * 0.18) + 10}
                      fontSize="6.5" fill="#668"
                      fontFamily="ui-monospace,monospace" textAnchor="middle">
                      OPENING
                    </text>

                    {/* ── Dimensions ── */}
                    {/* Vertical height on wall face */}
                    <line x1={wx(xRight) - 10} y1={wy(yBot)} x2={wx(xRight) - 10} y2={wy(yTop)} stroke="#446" strokeWidth="0.7" />
                    <line x1={wx(xRight) - 14} y1={wy(yBot)} x2={wx(xRight) -  6} y2={wy(yBot)} stroke="#446" strokeWidth="0.7" />
                    <line x1={wx(xRight) - 14} y1={wy(yTop)} x2={wx(xRight) -  6} y2={wy(yTop)} stroke="#446" strokeWidth="0.7" />
                    <text x={wx(xRight) - 16} y={(wy(yBot) + wy(yTop)) / 2 + 3}
                      fontSize="7" fill="#446" fontFamily="ui-monospace,monospace" textAnchor="end">
                      {Math.round(hFull)}&quot;
                    </text>
                    {/* Horizontal span along floor */}
                    <line x1={wx(xRight)} y1={wy(yBot) + 10} x2={wx(xFar)} y2={wy(yBot) + 10} stroke="#446" strokeWidth="0.7" />
                    <line x1={wx(xRight)} y1={wy(yBot) +  6} x2={wx(xRight)} y2={wy(yBot) + 14} stroke="#446" strokeWidth="0.7" />
                    <line x1={wx(xFar)}   y1={wy(yBot) +  6} x2={wx(xFar)}   y2={wy(yBot) + 14} stroke="#446" strokeWidth="0.7" />
                    <text x={(wx(xRight) + wx(xFar)) / 2} y={wy(yBot) + 22}
                      fontSize="7" fill="#446" fontFamily="ui-monospace,monospace" textAnchor="middle">
                      {Math.round(spanFull)}&quot;
                    </text>
                    {/* Diagonal length + angle along the header */}
                    <text
                      x={(wx(ax) + wx(bx)) / 2 - 8}
                      y={(wy(ay) + wy(by)) / 2 - 6}
                      fontSize="6.5" fill="#444" fontFamily="ui-monospace,monospace"
                      textAnchor="middle"
                      transform={`rotate(${angleDeg}, ${(wx(ax) + wx(bx)) / 2 - 8}, ${(wy(ay) + wy(by)) / 2 - 6})`}>
                      {Math.round(hypLen)}&quot; @ {angleDeg.toFixed(1)}°
                    </text>
                  </g>
                );
              })()}

              {/* Balcony edge — dashed vertical where partial floor ends */}
              <line x1={wx(f3XEnd)} y1={wy(f3y)} x2={wx(f3XEnd)} y2={wy(f3y + THIRD_FLOOR_H)}
                stroke={F3_BK} strokeWidth="1.5" strokeDasharray="8 4" />
              <text x={wx(f3XEnd) + 5} y={wy(f3y + THIRD_FLOOR_H / 2) + 4}
                fill={F3_BK} fontSize="9" fontFamily="ui-monospace,monospace">
                ← OPEN BALCONY
              </text>

              {/* Third floor deck line (bottom edge of partial wall) */}
              <line x1={wx(f3XStart)} y1={wy(f3y)} x2={wx(f3XEnd)} y2={wy(f3y)}
                stroke={F3_BK} strokeWidth="1.2" />

              {/* Top-plate line (roof line for partial wall) */}
              <line x1={wx(f3XStart)} y1={wy(f3y + THIRD_FLOOR_H)} x2={wx(f3XEnd)} y2={wy(f3y + THIRD_FLOOR_H)}
                stroke={F3_BK} strokeWidth="1.5" />

              {/* Wall-height dimension on right side */}
              <line x1={wx(f3XEnd) + 12} y1={wy(f3y)} x2={wx(f3XEnd) + 12} y2={wy(f3y + THIRD_FLOOR_H)}
                stroke="#88a" strokeWidth="0.8" />
              <line x1={wx(f3XEnd) + 8} y1={wy(f3y)} x2={wx(f3XEnd) + 16} y2={wy(f3y)}
                stroke="#88a" strokeWidth="0.8" />
              <line x1={wx(f3XEnd) + 8} y1={wy(f3y + THIRD_FLOOR_H)} x2={wx(f3XEnd) + 16} y2={wy(f3y + THIRD_FLOOR_H)}
                stroke="#88a" strokeWidth="0.8" />
              <text x={wx(f3XEnd) + 20} y={(wy(f3y) + wy(f3y + THIRD_FLOOR_H)) / 2 + 3}
                fontSize="7" fill="#88a" fontFamily="ui-monospace,monospace" textAnchor="start">
                {THIRD_FLOOR_H}&quot; wall
              </text>

              {/* Width label across partial floor */}
              <line x1={wx(f3XStart)} y1={wy(f3y + THIRD_FLOOR_H) - 14} x2={wx(f3XEnd)} y2={wy(f3y + THIRD_FLOOR_H) - 14}
                stroke="#88a" strokeWidth="0.8" strokeDasharray="3 2" />
              <text x={wx(f3XStart + THIRD_FLOOR_W / 2)} y={wy(f3y + THIRD_FLOOR_H) - 18}
                fill="#88a" fontSize="8" fontFamily="ui-monospace,monospace" textAnchor="middle">
                {THIRD_FLOOR_W}&quot; ({Math.floor(THIRD_FLOOR_W / 12)}&apos;{THIRD_FLOOR_W % 12 > 0 ? `${THIRD_FLOOR_W % 12}"` : ""}) PARTIAL 3RD FLOOR
              </text>
            </g>
          );
        })()}

        {/* ── Annotations ── */}
        {dims && <>
          <VDim x={hDimX} y1={topY} y2={floorY} witnessX={wallL} label={fmt(layout.wallHeightInches)} side="left" />

          {sorted.map((op, i) => {
            const oL    = wx(op.positionFromLeftInches);
            const oR    = wx(op.positionFromLeftInches + op.widthInches);
            const oBotIn = op.sillHeightInches ?? 0;
            const oTopIn = oBotIn + op.heightInches;
            const oTopY  = wy(oTopIn);
            const oBotY  = wy(oBotIn);
            const midX   = (oL + oR) / 2;
            const midY   = (oTopY + oBotY) / 2;

            const hasSill = op.type === "window" && (op.sillHeightInches ?? 0) > 0;
            const dimStr  = op.label ?? `${fmt(op.widthInches)} × ${fmt(op.heightInches)}`;
            const rows    = hasSill ? 3 : 2;
            const bH      = rows * 17 + 8;
            const bW      = Math.max(px(op.widthInches) * 0.72, 80);

            return (
              <g key={i}>
                <rect className="cbg" x={midX - bW / 2} y={midY - bH / 2} width={bW} height={bH} rx={3} />
                <text className="ct" x={midX} y={midY - bH / 2 + 18} textAnchor="middle">{op.type.toUpperCase()}</text>
                <text className="cd" x={midX} y={midY - bH / 2 + 35} textAnchor="middle">{dimStr}</text>
                {hasSill && (
                  <text className="cd" x={midX} y={midY - bH / 2 + 51} textAnchor="middle">
                    {`sill @ ${fmt(op.sillHeightInches!)}`}
                  </text>
                )}
                <VDim x={opHDimX} y1={oTopY} y2={oBotY} witnessX={oR} label={fmt(op.heightInches)} side="right" />
                {hasSill && (
                  <VDim x={sillDimX} y1={oBotY} y2={floorY} witnessX={oR} label={`${fmt(op.sillHeightInches!)} sill`} side="right" />
                )}
              </g>
            );
          })}

          {chain.map((seg, i) => (
            <HDim key={i} x1={seg.x1} x2={seg.x2} y={chainY} witnessY={floorY} label={seg.label} />
          ))}
          <HDim x1={wallL} x2={wallR} y={overallY} witnessY={floorY} label={`${fmt(layout.totalLengthInches)} total`} />
        </>}
      </svg>

      {/* ── Floating tooltip ── */}
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
          <div style={{ color: "#aaa" }}>{tip.id}</div>
          <div>{tip.dims}</div>
          <div>{tip.pos}</div>
          {tip.connectedTo != null && (
            <div style={{
              marginTop: 6, paddingTop: 6, borderTop: "1px solid #444",
              color: "#b8d4a8", whiteSpace: "normal", maxWidth: 340,
            }}>
              <span style={{ color: "#888" }}>Connected to: </span>{tip.connectedTo}
            </div>
          )}
          {tip.controls != null && (
            <div style={{
              marginTop: 4, color: "#8ab4f0",
              whiteSpace: "normal", maxWidth: 340,
            }}>
              <span style={{ color: "#888" }}>Controls: </span>{tip.controls}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
