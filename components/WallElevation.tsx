"use client";

import { useState, useRef, useCallback } from "react";
import type { WallElevation } from "@/lib/types";
import { computeWallLayout, type Rect } from "@/lib/layout-calculator";
import { PX_PER_INCH } from "@/lib/types";

// ── Tooltip type ────────────────────────────────────────────────────────────
interface Tip {
  x: number; y: number;
  id: string; label: string;
  dims: string; pos: string;
}

// ── CMU block layer ─────────────────────────────────────────────────────────
const CMU_W        = 16;
const CMU_H        = 8;
const CMU_EXT_SIDE = 8;
const CMU_EXT_TOP  = 8;

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
  const numCourses = Math.ceil(cmuTop / CMU_H);

  const voids = wall.openings.map((op) => ({
    left:   op.positionFromLeftInches,
    right:  op.positionFromLeftInches + op.widthInches,
    bottom: op.sillHeightInches ?? 0,
    top:    (op.sillHeightInches ?? 0) + op.heightInches,
  }));

  const blocks: React.ReactNode[] = [];

  for (let course = 0; course < numCourses; course++) {
    const yBot = course * CMU_H;
    const yTop = yBot + CMU_H;
    const startX = course % 2 === 0 ? cmuLeft : cmuLeft + CMU_W / 2;

    for (let bx = startX; bx < cmuRight; bx += CMU_W) {
      const cx1 = Math.max(cmuLeft, bx);
      const cx2 = Math.min(cmuRight, bx + CMU_W);
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
            x={wx(seg.x1)} y={wy(yBot, CMU_H)}
            width={px(seg.x2 - seg.x1)} height={px(CMU_H)}
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
    <button
      onClick={toggle}
      style={{
        padding: "4px 14px", borderRadius: 20, border: "1px solid #bbb",
        background: on ? "#222" : "#fff", color: on ? "#fff" : "#555",
        fontSize: 12, fontFamily: "ui-monospace, monospace",
        cursor: "pointer", letterSpacing: "0.04em",
        transition: "background 0.15s, color 0.15s",
      }}
    >
      {on ? "● " : "○ "}{label}
    </button>
  );
}

// ── Main component ──────────────────────────────────────────────────────────

export function WallElevationView({
  wall,
  interactive = false,
}: {
  wall: WallElevation;
  interactive?: boolean;
}) {
  // Layer toggle state (only used when interactive)
  const [showCMU,      setShowCMU]      = useState(true);
  const [showFrame,    setShowFrame]    = useState(true);
  const [showDims,     setShowDims]     = useState(true);
  const [showStairs,   setShowStairs]   = useState(true);
  const [showBathroom, setShowBathroom] = useState(false);
  const [showInterior, setShowInterior] = useState(false);

  // For non-interactive walls, all layers on (no stairs/bathroom/interior by default)
  const cmu   = interactive ? showCMU      : true;
  const frame = interactive ? showFrame    : true;
  const dims  = interactive ? showDims     : true;
  const stairs = interactive ? showStairs  : false;
  const bathroom = interactive ? showBathroom : false;
  const interior = interactive ? showInterior : false;

  // Tooltip state
  const [tip, setTip] = useState<Tip | null>(null);
  const wrapRef = useRef<HTMLDivElement>(null);

  const showTip = useCallback((e: React.MouseEvent, id: string, label: string, dims: string, pos: string) => {
    if (!wrapRef.current) return;
    const br = wrapRef.current.getBoundingClientRect();
    setTip({ x: e.clientX - br.left + 16, y: e.clientY - br.top - 10, id, label, dims, pos });
  }, []);

  const moveTip = useCallback((e: React.MouseEvent) => {
    if (!wrapRef.current) return;
    const br = wrapRef.current.getBoundingClientRect();
    setTip(t => t ? { ...t, x: e.clientX - br.left + 16, y: e.clientY - br.top - 10 } : null);
  }, []);

  const hideTip = useCallback(() => setTip(null), []);

  // Hover wrapper for layout Rects
  const hoverRect = (r: Rect, className: string, extra?: React.SVGProps<SVGRectElement>) => (
    <g key={r.id}
      onMouseEnter={(e) => showTip(e, r.id, r.label,
        `${fmtDec(r.width)}" × ${fmtDec(r.height)}"`,
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

  const W = px(layout.totalLengthInches);
  const H = px(layout.wallHeightInches);

  const svgW = AL + W + AR;
  const svgH = AT + H + AB;

  const wx = (xIn: number)              => AL + px(xIn);
  const wy = (yIn: number, hIn = 0)     => AT + H - px(yIn) - px(hIn);

  const JOIST_D_IN   = 11.875;
  const SUBFLOOR_IN  = 0.75;
  const FLOOR2_IN    = layout.wallHeightInches + JOIST_D_IN + SUBFLOOR_IN;

  const floorY = AT + H;
  const topY   = AT;
  const wallL  = AL;
  const wallR  = AL + W;

  const sorted = [...wall.openings].sort(
    (a, b) => a.positionFromLeftInches - b.positionFromLeftInches,
  );

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
    <div ref={wrapRef} style={{ position: "relative" }}>
      {/* Layer toggles (interactive mode only) */}
      {interactive && (
        <div style={{
          display: "flex", gap: 8, padding: "8px 12px",
          background: "#f5f4f0", borderBottom: "1px solid #ddd", flexWrap: "wrap",
        }}>
          <LayerBtn label="CMU Bricks" on={showCMU}      toggle={() => setShowCMU(v => !v)} />
          <LayerBtn label="Frame"      on={showFrame}     toggle={() => setShowFrame(v => !v)} />
          <LayerBtn label="Dimensions" on={showDims}      toggle={() => setShowDims(v => !v)} />
          <LayerBtn label="Stairs"     on={showStairs}    toggle={() => setShowStairs(v => !v)} />
          <LayerBtn label="Bathroom"   on={showBathroom}  toggle={() => setShowBathroom(v => !v)} />
          <LayerBtn label="Cabinets"   on={showInterior}  toggle={() => setShowInterior(v => !v)} />
        </div>
      )}

      <svg
        viewBox={`0 0 ${svgW} ${svgH}`}
        width="100%"
        style={{ maxHeight: 720 }}
        preserveAspectRatio="xMidYMid meet"
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
          {layout.studs.map((r) => hoverRect(r, "stud"))}
          {layout.headers.map((r) => {
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

        {/* ── Floor joists above top plate (North & South walls only) ── */}
        {frame && (wall.id === "north" || wall.id === "south") && (() => {
          const JOIST_D     = JOIST_D_IN;
          const JOIST_W     = 1.5;
          const FLANGE_H    = 1.5;
          const WEB_W       = 0.75;
          const OC          = 16;
          const wallLen     = layout.totalLengthInches;

          const jBase = layout.wallHeightInches;
          const jTop  = jBase + JOIST_D;

          const positions: number[] = [];
          for (let x = 0; x <= wallLen; x += OC) positions.push(x);
          if (wallLen - positions[positions.length - 1] > JOIST_W * 2) positions.push(wallLen);

          const jFill   = "#e8e4dc";
          const jStroke = "#444";
          const jSW     = 0.7;

          return (
            <g>
              {positions.map((x, i) => {
                const cx = Math.max(JOIST_W, Math.min(wallLen - JOIST_W, x));
                const jId = `${wall.id}-tji-${i}`;
                return hoverGroup(jId, `TJI Joist #${i}`, JOIST_W * 2, JOIST_D, cx - JOIST_W, jBase,
                  <g>
                    <rect x={wx(cx - JOIST_W)} y={wy(jBase, FLANGE_H)}
                      width={px(JOIST_W * 2)} height={px(FLANGE_H)}
                      fill={jFill} stroke={jStroke} strokeWidth={jSW} />
                    <rect x={wx(cx - WEB_W / 2)} y={wy(jBase + FLANGE_H, JOIST_D - FLANGE_H * 2)}
                      width={px(WEB_W)} height={px(JOIST_D - FLANGE_H * 2)}
                      fill={jFill} stroke={jStroke} strokeWidth={jSW} />
                    <rect x={wx(cx - JOIST_W)} y={wy(jTop - FLANGE_H, FLANGE_H)}
                      width={px(JOIST_W * 2)} height={px(FLANGE_H)}
                      fill={jFill} stroke={jStroke} strokeWidth={jSW} />
                  </g>
                );
              })}
              {hoverGroup(`${wall.id}-subfloor`, "Subfloor (3/4\" OSB)", wallLen, SUBFLOOR_IN, 0, jTop,
                <rect x={wx(0)} y={wy(jTop, SUBFLOOR_IN)}
                  width={px(wallLen)} height={px(SUBFLOOR_IN)}
                  fill="#c8c0a8" stroke="#444" strokeWidth="0.8" />
              )}
              <line x1={wx(wallLen) + 12} y1={wy(jBase)} x2={wx(wallLen) + 12} y2={wy(jTop)} stroke="#88a" strokeWidth="0.8" />
              <line x1={wx(wallLen) + 8} y1={wy(jBase)} x2={wx(wallLen) + 16} y2={wy(jBase)} stroke="#88a" strokeWidth="0.8" />
              <line x1={wx(wallLen) + 8} y1={wy(jTop)}  x2={wx(wallLen) + 16} y2={wy(jTop)}  stroke="#88a" strokeWidth="0.8" />
              <text x={wx(wallLen) + 20} y={(wy(jBase) + wy(jTop)) / 2 + 3}
                fontSize="7" fill="#88a" fontFamily="ui-monospace,monospace" textAnchor="start">11⅞″ TJI</text>
            </g>
          );
        })()}

        {/* ── Shared interior constants (south wall) ── */}
        {wall.id === "south" && (() => {
          const CI_L      = 8;
          const toElev    = (planX: number) => wall.totalLengthInches + CI_L - planX;
          const FW_IN     = 14.5;
          const INT_D     = 3.5;
          const partWallR = 96;
          const COUNTER_H = 36;
          const SC        = "#555";
          const WL        = "#fff";
          const BKW       = 3;
          const WHW       = 1.2;

          const vwL   = toElev(partWallR + INT_D);
          const vwR   = toElev(partWallR);
          const vwW   = vwR - vwL;
          const ctrL  = toElev(partWallR + INT_D);
          const ctrR  = toElev(FW_IN);
          const bathL = toElev(partWallR);
          const bathR = toElev(FW_IN);

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

                  <line x1={wx(bathR)} y1={wy(0)} x2={wx(bathR)} y2={wy(layout.wallHeightInches)}
                    stroke={SC} strokeWidth="1" strokeDasharray="6 4" opacity="0.6" />

                  {/* Raised bathroom floor */}
                  {(() => {
                    const PLAT_H     = 3 * (FLOOR2_IN / 15);
                    const SUBFLOOR_T = 0.75;
                    const JOIST_H    = 5.5;
                    const JOIST_W    = 1.5;
                    const CLEAT_H    = 3.5;
                    const JOIST_OC   = 16;

                    const cleatBot = PLAT_H - SUBFLOOR_T - JOIST_H - CLEAT_H;
                    const jBot     = cleatBot + CLEAT_H;
                    const jTop     = jBot + JOIST_H;
                    const sfBot    = jTop;
                    const STUD_W   = 1.5;
                    const platR    = wall.totalLengthInches;

                    const studXs: number[] = [];
                    for (let sx = 0; sx <= platR; sx += JOIST_OC) {
                      if (sx >= bathL - 0.5 && sx <= platR + 0.5) studXs.push(sx);
                    }

                    return (
                      <g>
                        <rect x={wx(bathL)} y={wy(0, cleatBot)}
                          width={px(platR - bathL)} height={px(cleatBot)}
                          fill="rgba(210,200,180,0.10)" stroke="none" />

                        {studXs.map((sx, i) => {
                          const jx = sx + STUD_W / 2;
                          return (
                            <g key={`seat${i}`}>
                              {hoverGroup(`${wall.id}-bath-cleat-${i}`, `Ledger Cleat #${i}`, STUD_W, jBot, jx, 0,
                                <rect x={wx(jx)} y={wy(0, jBot)} width={px(STUD_W)} height={px(jBot)}
                                  fill="#fff" stroke={SC} strokeWidth="0.7" />
                              )}
                              {hoverGroup(`${wall.id}-bath-joist-${i}`, `2×6 Floor Joist #${i}`, STUD_W, JOIST_H, jx, jBot,
                                <rect x={wx(jx)} y={wy(jBot, JOIST_H)} width={px(STUD_W)} height={px(JOIST_H)}
                                  fill="#d8d0bc" stroke={SC} strokeWidth="0.7" />
                              )}
                            </g>
                          );
                        })}

                        {hoverGroup(`${wall.id}-bath-subfloor`, "Bath Subfloor (3/4\" OSB)", platR - bathL, SUBFLOOR_T, bathL, sfBot,
                          <rect x={wx(bathL)} y={wy(sfBot, SUBFLOOR_T)}
                            width={px(platR - bathL)} height={px(SUBFLOOR_T)}
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
                  <text className="stair-label" textAnchor="middle" fill={SC}
                    x={wx(vwR + 50)} y={wy(layout.wallHeightInches - 6)}>KITCHEN</text>
                  <text className="stair-label" textAnchor="middle" fill={SC} fontSize="8"
                    x={wx((ctrL + ctrR) / 2)} y={wy(COUNTER_H / 2) + 3}>COUNTER 36&quot;</text>
                </g>
              )}
            </>
          );
        })()}

        {/* ── Staircase section (south wall only) ── */}
        {stairs && (() => {
          const TOTAL_RISERS = 15;
          const RISER       = FLOOR2_IN / TOTAL_RISERS;
          const TREAD       = 10;
          const LAND_W      = 36;
          const LAND_RISERS = 3;
          const LAND_H      = LAND_RISERS * RISER;

          const MAIN_RISERS = TOTAL_RISERS - LAND_RISERS;
          const MAIN_TREADS = MAIN_RISERS - 1;
          const MAIN_RISE   = MAIN_RISERS * RISER;

          const winCenter = 139 + 40 / 2;
          const landL = winCenter - LAND_W / 2;
          const landR = wall.totalLengthInches + 8 - (96 + 3.5);

          const stairStartX = landL;
          const stairEndX = stairStartX - MAIN_TREADS * TREAD;

          const pts: string[] = [];
          pts.push(`${wx(stairStartX)},${wy(LAND_H)}`);
          for (let i = 1; i <= MAIN_RISERS; i++) {
            const y = LAND_H + i * RISER;
            const treadR = stairStartX - (i - 1) * TREAD;
            pts.push(`${wx(treadR)},${wy(y)}`);
            if (i < MAIN_RISERS) pts.push(`${wx(treadR - TREAD)},${wy(y)}`);
          }

          const stairTopY = FLOOR2_IN;
          const FILL = "rgba(220,210,190,0.35)";
          const BK = "#222";
          const WH = "#fff";
          const BK_W = 3.5;
          const WH_W = 1.5;
          const openPts = pts.join(" ");

          return (
            <g>
              {/* Landing */}
              {hoverGroup(`${wall.id}-landing`, "Landing", landR - landL, LAND_H, landL, 0,
                <>
                  <rect x={wx(landL)} y={wy(LAND_H)} width={px(landR - landL)} height={px(LAND_H)}
                    fill="none" stroke={BK} strokeWidth={BK_W} />
                  {Array.from({ length: LAND_RISERS - 1 }, (_, i) => {
                    const y = (i + 1) * RISER;
                    return <line key={`apb${i}`} x1={wx(landL)} y1={wy(y)} x2={wx(landR)} y2={wy(y)} stroke={BK} strokeWidth={BK_W} />;
                  })}
                  <rect x={wx(landL)} y={wy(LAND_H)} width={px(landR - landL)} height={px(LAND_H)} fill={FILL} stroke="none" />
                  <rect x={wx(landL)} y={wy(LAND_H)} width={px(landR - landL)} height={px(LAND_H)} fill="none" stroke={WH} strokeWidth={WH_W} />
                  {Array.from({ length: LAND_RISERS - 1 }, (_, i) => {
                    const y = (i + 1) * RISER;
                    return <line key={`apw${i}`} x1={wx(landL)} y1={wy(y)} x2={wx(landR)} y2={wy(y)} stroke={WH} strokeWidth={WH_W} />;
                  })}
                </>
              )}

              {/* Main stair run */}
              {hoverGroup(`${wall.id}-main-stair`, "Main Stair Run", stairStartX - stairEndX, MAIN_RISE, stairEndX, LAND_H,
                <>
                  <polyline points={openPts} fill="none" stroke={BK} strokeWidth={BK_W} strokeLinejoin="miter" />
                  {Array.from({ length: MAIN_TREADS }, (_, i) => {
                    const y = LAND_H + (i + 1) * RISER;
                    const tL = stairStartX - (i + 1) * TREAD;
                    const tR = stairStartX - i * TREAD;
                    return <line key={`mtb${i}`} x1={wx(tR)} y1={wy(y)} x2={wx(tL)} y2={wy(y)} stroke={BK} strokeWidth={BK_W} />;
                  })}
                  <polyline points={openPts} fill="none" stroke={WH} strokeWidth={WH_W} strokeLinejoin="miter" />
                  {Array.from({ length: MAIN_TREADS }, (_, i) => {
                    const y = LAND_H + (i + 1) * RISER;
                    const tL = stairStartX - (i + 1) * TREAD;
                    const tR = stairStartX - i * TREAD;
                    return <line key={`mtw${i}`} x1={wx(tR)} y1={wy(y)} x2={wx(tL)} y2={wy(y)} stroke={WH} strokeWidth={WH_W} />;
                  })}
                </>
              )}

              {/* Stringer + soffit fill */}
              {(() => {
                const strStartX = stairStartX;
                const strEndX2  = stairEndX;
                const strEndY   = (MAIN_RISE / (MAIN_TREADS * TREAD)) * (strStartX - strEndX2);

                const soffit = [
                  `${wx(strStartX)},${wy(0)}`,
                  `${wx(strEndX2)},${wy(strEndY)}`,
                  `${wx(strEndX2)},${wy(0)}`,
                ].join(" ");

                const strPts = [
                  `${wx(strStartX)},${wy(0)}`,
                  `${wx(strEndX2)},${wy(strEndY)}`,
                  `${wx(strEndX2)},${wy(stairTopY)}`,
                ].join(" ");

                return hoverGroup(`${wall.id}-stringer`, "Stringer / Soffit", strStartX - strEndX2, strEndY, strEndX2, 0,
                  <>
                    <polygon points={soffit} fill={FILL} stroke="none" />
                    <polyline points={strPts} fill="none" stroke={BK} strokeWidth={BK_W} strokeLinejoin="miter" />
                    <polyline points={strPts} fill="none" stroke={WH} strokeWidth={WH_W} strokeLinejoin="miter" />
                  </>
                );
              })()}

              {/* 2nd floor dashed line */}
              <line x1={wx(stairEndX - 6)} y1={wy(stairTopY)} x2={wx(landR + 6)} y2={wy(stairTopY)}
                stroke={BK} strokeWidth="1.2" strokeDasharray="5 3" />
              <text className="stair-label" x={wx(landR + 10)} y={wy(stairTopY) + 4}
                textAnchor="start" fontSize="9" fill={BK}>2ND FLOOR</text>

              <text className="stair-label" textAnchor="middle" fill={BK}
                x={wx(winCenter)} y={wy(LAND_H / 2) + 4}>LANDING</text>
              <text className="stair-label" textAnchor="middle" fill={BK} fontSize="8"
                x={wx(winCenter)} y={wy(LAND_H / 2) + 14}>
                {`${LAND_RISERS}R @ ${RISER.toFixed(2)}\u2033`}
              </text>
              <text className="stair-label" textAnchor="middle" fill={BK}
                x={wx(stairStartX - (MAIN_TREADS * TREAD) / 2)} y={wy(LAND_H + MAIN_RISE * 0.35)}>
                {MAIN_RISERS}R UP
              </text>
              <text className="stair-label" textAnchor="middle" fill={BK} fontSize="8"
                x={wx(stairStartX - (MAIN_TREADS * TREAD) / 2)} y={wy(LAND_H + MAIN_RISE * 0.35) + 12}>
                {`@ ${RISER.toFixed(2)}\u2033 ea`}
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
        </div>
      )}
    </div>
  );
}
