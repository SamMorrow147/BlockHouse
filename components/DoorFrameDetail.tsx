"use client";

import { useState } from "react";
import { Toggle } from "@/components/ui/toggle";
import { CMU_T, CMU_BLOCK_H } from "@/lib/framing-data";

/**
 * DoorFrameDetail — Architectural construction-document-style detail drawings
 * for the front entry storefront glass door with hollow metal (HM) frame
 * set into CMU wall.
 *
 * Style: monochrome line work with proper material hatching, leader-line
 * callouts, detail reference bubbles, and line-weight hierarchy — matching
 * standard A-series architectural detail sheets.
 *
 * Three cross-section details at 3" = 1'-0" (1:4):
 *   1/A-100  HEAD detail
 *   2/A-100  JAMB detail
 *   3/A-100  SILL / THRESHOLD detail
 */

// ── Scale ─────────────────────────────────────────────────────────────────
const S = 4;  // px per real inch at 3"=1'-0"  (we use viewBox so this is logical)
const px = (inches: number) => inches * S;

// ── Dimensions (real inches) ──────────────────────────────────────────────
const CMU_NOMINAL  = CMU_T;         // 8"
const CMU_ACTUAL   = 7.625;
const MORTAR       = 0.375;
const HM_FACE_W   = 2;
const HM_RETURN_D  = 4.875;
const HM_STEEL_T   = 0.0598;       // 16-ga
const DOOR_T       = 1.75;
const GLASS_T      = 1;
const GLAZING_STOP = 0.375;
const SEALANT_W    = 0.375;
const WEATHERSTRIP = 0.25;
const GROUT_FILL   = 1.5;
const THRESHOLD_W  = 5;
const THRESHOLD_H  = 0.5;
const SILL_PAN_H   = 0.375;

// ── Line weights ──────────────────────────────────────────────────────────
const LW = {
  heavy: 0.7,   // cut / profile lines
  medium: 0.4,  // visible edges beyond cut plane
  light: 0.2,   // hatching, patterns
  dim: 0.25,    // dimension & leader lines
};

// ── SVG defs shared across details ────────────────────────────────────────
function SharedDefs() {
  return (
    <defs>
      {/* Arrow marker for dimension lines */}
      <marker id="dim-arrow" markerWidth="8" markerHeight="6" refX="8" refY="3"
        orient="auto-start-reverse">
        <path d="M0,0.5 L8,3 L0,5.5" fill="#000" stroke="none" />
      </marker>
      {/* Slash tick for shorter dims */}
      <marker id="dim-tick" markerWidth="6" markerHeight="10" refX="3" refY="5"
        orient="auto-start-reverse">
        <line x1="0" y1="10" x2="6" y2="0" stroke="#000" strokeWidth={LW.dim} />
      </marker>

      {/* ── Material hatches ── */}
      {/* CMU / masonry — 45° parallel lines */}
      <pattern id="pat-cmu" patternUnits="userSpaceOnUse" width="3" height="3"
        patternTransform="rotate(45)">
        <line x1="0" y1="0" x2="0" y2="3" stroke="#000" strokeWidth="0.15" />
      </pattern>

      {/* Concrete — random stipple dots */}
      <pattern id="pat-conc" patternUnits="userSpaceOnUse" width="6" height="6">
        <circle cx="1" cy="1.5" r="0.25" fill="#000" />
        <circle cx="4" cy="0.8" r="0.2" fill="#000" />
        <circle cx="2.5" cy="4" r="0.25" fill="#000" />
        <circle cx="5" cy="3" r="0.2" fill="#000" />
        <circle cx="0.8" cy="5.5" r="0.15" fill="#000" />
        <circle cx="4.5" cy="5.2" r="0.2" fill="#000" />
      </pattern>

      {/* Insulation — wavy lines */}
      <pattern id="pat-insul" patternUnits="userSpaceOnUse" width="6" height="4">
        <path d="M0,2 Q1.5,0 3,2 Q4.5,4 6,2" fill="none" stroke="#000" strokeWidth="0.2" />
      </pattern>

      {/* Steel (solid fill section) */}
      <pattern id="pat-steel" patternUnits="userSpaceOnUse" width="1" height="1">
        <rect width="1" height="1" fill="#000" />
      </pattern>

      {/* Earth / grout — cross hatch 45 + 135 */}
      <pattern id="pat-grout" patternUnits="userSpaceOnUse" width="4" height="4">
        <line x1="0" y1="0" x2="4" y2="4" stroke="#000" strokeWidth="0.15" />
        <line x1="4" y1="0" x2="0" y2="4" stroke="#000" strokeWidth="0.15" />
      </pattern>

      {/* Sealant — dense diagonal */}
      <pattern id="pat-sealant" patternUnits="userSpaceOnUse" width="2" height="2"
        patternTransform="rotate(45)">
        <line x1="0" y1="0" x2="0" y2="2" stroke="#000" strokeWidth="0.3" />
      </pattern>

      {/* Glass — no hatch, just outlined */}
    </defs>
  );
}

// ── Dimension line ────────────────────────────────────────────────────────
function DimLine({
  x1, y1, x2, y2, label, offset = 6, side = "right",
}: {
  x1: number; y1: number; x2: number; y2: number;
  label: string; offset?: number; side?: "left" | "right" | "top" | "bottom";
}) {
  const isH = Math.abs(y1 - y2) < 0.5;
  const isV = Math.abs(x1 - x2) < 0.5;

  if (isH) {
    const dy = side === "top" ? -offset : offset;
    return (
      <g stroke="#000" strokeWidth={LW.dim} fill="none">
        <line x1={x1} y1={y1} x2={x1} y2={y1 + dy} strokeDasharray="1 1" />
        <line x1={x2} y1={y2} x2={x2} y2={y2 + dy} strokeDasharray="1 1" />
        <line x1={x1} y1={y1 + dy} x2={x2} y2={y2 + dy}
          markerStart="url(#dim-tick)" markerEnd="url(#dim-tick)" />
        <text x={(x1 + x2) / 2} y={y1 + dy + (side === "top" ? -1.5 : 3.5)}
          fontSize="3" fill="#000" textAnchor="middle"
          fontFamily="'Courier New',monospace">{label}</text>
      </g>
    );
  }
  if (isV) {
    const dx = side === "left" ? -offset : offset;
    return (
      <g stroke="#000" strokeWidth={LW.dim} fill="none">
        <line x1={x1} y1={y1} x2={x1 + dx} y2={y1} strokeDasharray="1 1" />
        <line x1={x2} y1={y2} x2={x2 + dx} y2={y2} strokeDasharray="1 1" />
        <line x1={x1 + dx} y1={y1} x2={x2 + dx} y2={y2}
          markerStart="url(#dim-tick)" markerEnd="url(#dim-tick)" />
        <text x={x1 + dx + (side === "left" ? -1.5 : 1.5)} y={(y1 + y2) / 2 + 1}
          fontSize="3" fill="#000" textAnchor={side === "left" ? "end" : "start"}
          fontFamily="'Courier New',monospace">{label}</text>
      </g>
    );
  }
  return null;
}

// ── Leader-line callout (horizontal text, thin leader) ────────────────────
function Leader({
  x, y, tx, ty, label, align = "left",
}: {
  x: number; y: number; tx: number; ty: number; label: string; align?: "left" | "right";
}) {
  // Horizontal tail length
  const tailLen = align === "left" ? -12 : 12;
  const textAnchor = align === "left" ? "end" : "start";
  const textX = align === "left" ? tx + tailLen - 1 : tx + tailLen + 1;

  return (
    <g>
      {/* Leader line from point to elbow */}
      <line x1={x} y1={y} x2={tx} y2={ty} stroke="#000" strokeWidth={LW.dim} />
      {/* Horizontal tail */}
      <line x1={tx} y1={ty} x2={tx + tailLen} y2={ty} stroke="#000" strokeWidth={LW.dim} />
      {/* Dot at target */}
      <circle cx={x} cy={y} r="0.6" fill="#000" />
      {/* Label text */}
      <text x={textX} y={ty + 1} fontSize="2.4" fill="#000"
        textAnchor={textAnchor} fontFamily="'Courier New',monospace"
        fontWeight="400" letterSpacing="0.03em">{label}</text>
    </g>
  );
}

// ── Detail reference bubble ───────────────────────────────────────────────
function DetailBubble({
  x, y, detailNum, sheetNum = "A-100",
}: {
  x: number; y: number; detailNum: string; sheetNum?: string;
}) {
  const r = 4;
  return (
    <g>
      <circle cx={x} cy={y} r={r} fill="none" stroke="#000" strokeWidth={LW.medium} />
      <line x1={x - r} y1={y} x2={x + r} y2={y} stroke="#000" strokeWidth={LW.dim} />
      <text x={x} y={y - 1} fontSize="2.8" fill="#000" textAnchor="middle"
        fontFamily="'Courier New',monospace" fontWeight="700">{detailNum}</text>
      <text x={x} y={y + 2.8} fontSize="2.2" fill="#000" textAnchor="middle"
        fontFamily="'Courier New',monospace">{sheetNum}</text>
    </g>
  );
}

// ── Break line (wavy cut-off) ─────────────────────────────────────────────
function BreakLine({ x1, y1, x2, y2 }: { x1: number; y1: number; x2: number; y2: number }) {
  const isH = Math.abs(y1 - y2) < 0.5;
  if (isH) {
    const segs = 8;
    const dx = (x2 - x1) / segs;
    let d = `M${x1},${y1}`;
    for (let i = 0; i < segs; i++) {
      const cx = x1 + dx * i + dx / 2;
      const cy = y1 + (i % 2 === 0 ? -1.5 : 1.5);
      d += ` Q${cx},${cy} ${x1 + dx * (i + 1)},${y1}`;
    }
    return <path d={d} fill="none" stroke="#000" strokeWidth={LW.medium} />;
  }
  // vertical break
  const segs = 8;
  const dy = (y2 - y1) / segs;
  let d = `M${x1},${y1}`;
  for (let i = 0; i < segs; i++) {
    const cx = x1 + (i % 2 === 0 ? -1.5 : 1.5);
    const cy = y1 + dy * i + dy / 2;
    d += ` Q${cx},${cy} ${x1},${y1 + dy * (i + 1)}`;
  }
  return <path d={d} fill="none" stroke="#000" strokeWidth={LW.medium} />;
}

// ========================================================================
// 1 / A-100  —  HEAD DETAIL
// ========================================================================
function HeadDetail() {
  const vw = 110;
  const vh = 90;
  const ox = 35;  // drawing origin x
  const oy = 14;  // drawing origin y

  // CMU wall above door (bond beam)
  const cmuL = ox;
  const cmuR = ox + px(CMU_NOMINAL);
  const cmuTop = oy;
  const cmuH = px(CMU_BLOCK_H); // one course

  // HM frame head sits below CMU
  const frameTop = cmuTop + cmuH;
  const faceH = px(HM_FACE_W);
  const steelT = px(0.25); // exaggerated for visibility at this scale
  const frameBot = frameTop + faceH;

  return (
    <svg width="100%" viewBox={`0 0 ${vw} ${vh}`} style={{ display: "block" }}>
      <SharedDefs />

      {/* ── CMU bond beam ── */}
      <rect x={cmuL - px(3)} y={cmuTop} width={px(CMU_NOMINAL + 6)} height={cmuH}
        fill="#fff" stroke="#000" strokeWidth={LW.heavy} />
      <rect x={cmuL - px(3)} y={cmuTop} width={px(CMU_NOMINAL + 6)} height={cmuH}
        fill="url(#pat-cmu)" opacity="0.6" />
      {/* Grout fill in bond beam core */}
      <rect x={cmuL + px(1)} y={cmuTop + px(0.75)} width={px(CMU_NOMINAL - 2)} height={cmuH - px(1.5)}
        fill="url(#pat-grout)" opacity="0.3" />

      {/* ── HM frame head — U-channel ── */}
      {/* Top flange (embedded in CMU) */}
      <rect x={cmuL - px(HM_FACE_W)} y={frameTop}
        width={px(CMU_NOMINAL + HM_FACE_W * 2)} height={steelT}
        fill="#000" stroke="#000" strokeWidth={LW.heavy} />
      {/* Left return */}
      <rect x={cmuL - px(HM_FACE_W)} y={frameTop}
        width={steelT} height={faceH}
        fill="#000" stroke="#000" strokeWidth={LW.heavy} />
      {/* Right return */}
      <rect x={cmuR + px(HM_FACE_W) - steelT} y={frameTop}
        width={steelT} height={faceH}
        fill="#000" stroke="#000" strokeWidth={LW.heavy} />
      {/* Bottom flange (frame face) */}
      <rect x={cmuL - px(HM_FACE_W)} y={frameBot - steelT}
        width={px(CMU_NOMINAL + HM_FACE_W * 2)} height={steelT}
        fill="#000" stroke="#000" strokeWidth={LW.heavy} />

      {/* ── Sealant between frame & CMU (each side) ── */}
      <rect x={cmuL - px(SEALANT_W)} y={frameTop + steelT}
        width={px(SEALANT_W)} height={faceH - steelT * 2}
        fill="url(#pat-sealant)" opacity="0.5" stroke="#000" strokeWidth={LW.light} />
      <rect x={cmuR} y={frameTop + steelT}
        width={px(SEALANT_W)} height={faceH - steelT * 2}
        fill="url(#pat-sealant)" opacity="0.5" stroke="#000" strokeWidth={LW.light} />

      {/* ── Weatherstrip ── */}
      <line x1={cmuL + px(0.5)} y1={frameBot}
        x2={cmuR - px(0.5)} y2={frameBot}
        stroke="#000" strokeWidth={LW.heavy} strokeDasharray="0.8 0.5" />

      {/* ── Door top rail ── */}
      <rect x={cmuL + px(0.75)} y={frameBot + px(0.25)}
        width={px(CMU_NOMINAL - 1.5)} height={px(DOOR_T)}
        fill="#fff" stroke="#000" strokeWidth={LW.heavy} />
      {/* Diagonal cross indicating door rail section */}
      <line x1={cmuL + px(0.75)} y1={frameBot + px(0.25)}
        x2={cmuL + px(CMU_NOMINAL - 0.75)} y2={frameBot + px(0.25 + DOOR_T)}
        stroke="#000" strokeWidth={LW.light} />
      <line x1={cmuL + px(CMU_NOMINAL - 0.75)} y1={frameBot + px(0.25)}
        x2={cmuL + px(0.75)} y2={frameBot + px(0.25 + DOOR_T)}
        stroke="#000" strokeWidth={LW.light} />

      {/* ── Glass (1" IGU) ── */}
      {(() => {
        const glassX = cmuL + px((CMU_NOMINAL - GLASS_T) / 2);
        const glassTop = frameBot + px(0.25 + DOOR_T + 0.25);
        const glassH = px(4);
        return (
          <>
            {/* Outer lite */}
            <rect x={glassX} y={glassTop} width={px(0.25)} height={glassH}
              fill="none" stroke="#000" strokeWidth={LW.heavy} />
            {/* Air gap */}
            <rect x={glassX + px(0.25)} y={glassTop} width={px(0.5)} height={glassH}
              fill="none" stroke="#000" strokeWidth={LW.light} strokeDasharray="0.5 0.5" />
            {/* Inner lite */}
            <rect x={glassX + px(0.75)} y={glassTop} width={px(0.25)} height={glassH}
              fill="none" stroke="#000" strokeWidth={LW.heavy} />
            {/* Glazing stops */}
            <rect x={glassX - px(GLAZING_STOP)} y={glassTop}
              width={px(GLAZING_STOP)} height={glassH}
              fill="#000" stroke="#000" strokeWidth={LW.light} />
            <rect x={glassX + px(GLASS_T)} y={glassTop}
              width={px(GLAZING_STOP)} height={glassH}
              fill="#000" stroke="#000" strokeWidth={LW.light} />
          </>
        );
      })()}

      {/* ── Plywood sheathing above frame ── */}
      <rect x={cmuR + px(0.5)} y={cmuTop - px(0.5)}
        width={px(0.5)} height={cmuH + px(1)}
        fill="none" stroke="#000" strokeWidth={LW.medium} />

      {/* ── Break lines at edges ── */}
      <BreakLine x1={cmuL - px(4)} y1={oy + px(16)} x2={cmuR + px(4)} y2={oy + px(16)} />

      {/* ── Dimension lines ── */}
      <DimLine x1={cmuL} y1={oy + px(14.5)} x2={cmuR} y2={oy + px(14.5)}
        label={`0'-${CMU_NOMINAL}"`} side="bottom" offset={3} />
      <DimLine x1={cmuL - px(HM_FACE_W)} y1={oy + px(14.5)}
        x2={cmuR + px(HM_FACE_W)} y2={oy + px(14.5)}
        label={`0'-${CMU_NOMINAL + HM_FACE_W * 2}"`} side="bottom" offset={8} />

      {/* ── Leader callouts (right side) ── */}
      <Leader x={cmuL + px(2)} y={cmuTop + cmuH / 2}
        tx={cmuR + px(5)} ty={cmuTop + 2} label="8&quot; CMU BOND BEAM" align="right" />
      <Leader x={cmuR + px(HM_FACE_W) - px(0.5)} y={frameTop + faceH / 2}
        tx={cmuR + px(5)} ty={frameTop + 3} label="16-GA H.M. FRAME" align="right" />
      <Leader x={cmuR - px(0.5)} y={frameTop + steelT + px(0.5)}
        tx={cmuR + px(5)} ty={frameTop + 7} label="SEALANT EACH SIDE" align="right" />
      <Leader x={cmuL + px(CMU_NOMINAL / 2)} y={frameBot}
        tx={cmuR + px(5)} ty={frameBot + 2} label="WEATHERSTRIP" align="right" />
      <Leader x={cmuL + px(CMU_NOMINAL / 2)} y={frameBot + px(1)}
        tx={cmuR + px(5)} ty={frameBot + 6} label="DOOR AND FRAME AS SCHED." align="right" />

      {/* ── Leader callouts (left side) ── */}
      <Leader x={cmuL - px(1)} y={cmuTop + px(1)}
        tx={cmuL - px(5)} ty={cmuTop + 2} label="GROUT FILL" align="left" />
      <Leader x={cmuL - px(SEALANT_W / 2)} y={frameTop + faceH / 2}
        tx={cmuL - px(5)} ty={frameTop + 6} label="BACKER ROD &amp; SEALANT" align="left" />

      {/* ── Detail bubble ── */}
      <DetailBubble x={8} y={vh - 10} detailNum="1" sheetNum="A-100" />

      {/* ── Title ── */}
      <text x={18} y={vh - 8} fontSize="3.5" fill="#000" fontWeight="700"
        fontFamily="'Courier New',monospace">H.M. DOOR HEAD</text>
      <text x={18} y={vh - 4.5} fontSize="2.5" fill="#000"
        fontFamily="'Courier New',monospace">@ CMU WALL</text>
    </svg>
  );
}

// ========================================================================
// 2 / A-100  —  JAMB DETAIL
// ========================================================================
function JambDetail() {
  const vw = 110;
  const vh = 90;
  const ox = 8;
  const oy = 14;

  // CMU wall — horizontal section (looking down)
  const cmuL = ox + px(2); // some margin
  const cmuR = cmuL + px(CMU_NOMINAL);
  const cmuTop = oy;
  const cmuBtm = oy + px(12);
  const steelT = px(0.25);

  // Frame at right edge of CMU opening
  const frameL = cmuR; // frame starts at CMU face

  return (
    <svg width="100%" viewBox={`0 0 ${vw} ${vh}`} style={{ display: "block" }}>
      <SharedDefs />

      {/* ── CMU wall section ── */}
      <rect x={cmuL} y={cmuTop} width={px(CMU_NOMINAL)} height={cmuBtm - cmuTop}
        fill="#fff" stroke="#000" strokeWidth={LW.heavy} />
      <rect x={cmuL} y={cmuTop} width={px(CMU_NOMINAL)} height={cmuBtm - cmuTop}
        fill="url(#pat-cmu)" opacity="0.5" />

      {/* CMU cells (two hollow cores) */}
      <rect x={cmuL + px(1)} y={cmuTop + px(1)} width={px(2.25)} height={cmuBtm - cmuTop - px(2)}
        fill="#fff" stroke="#000" strokeWidth={LW.light} />
      <rect x={cmuL + px(4.375)} y={cmuTop + px(1)} width={px(2.25)} height={cmuBtm - cmuTop - px(2)}
        fill="#fff" stroke="#000" strokeWidth={LW.light} />

      {/* Grouted cell adjacent to frame */}
      <rect x={cmuL + px(4.375)} y={cmuTop + px(1)} width={px(2.25)} height={cmuBtm - cmuTop - px(2)}
        fill="url(#pat-grout)" opacity="0.35" stroke="#000" strokeWidth={LW.light} />

      {/* ── HM frame jamb — L-profile ── */}
      {/* Exterior face */}
      <rect x={frameL} y={cmuTop + px(0.5)}
        width={px(HM_FACE_W)} height={steelT}
        fill="#000" stroke="#000" strokeWidth={LW.heavy} />
      {/* Return into wall */}
      <rect x={frameL} y={cmuTop + px(0.5)}
        width={steelT} height={px(HM_RETURN_D)}
        fill="#000" stroke="#000" strokeWidth={LW.heavy} />
      {/* Interior face */}
      <rect x={frameL} y={cmuTop + px(0.5) + px(HM_RETURN_D) - steelT}
        width={px(HM_FACE_W)} height={steelT}
        fill="#000" stroke="#000" strokeWidth={LW.heavy} />

      {/* ── T-anchor tabs (3 locations) ── */}
      {[px(2), px(5), px(8)].map((dy, i) => (
        <g key={i}>
          <rect x={frameL - px(0.75)} y={cmuTop + dy}
            width={px(1)} height={px(0.5)}
            fill="#000" stroke="#000" strokeWidth={LW.medium} />
          {/* Anchor bar into CMU */}
          <rect x={frameL - px(3)} y={cmuTop + dy + px(0.125)}
            width={px(2.25)} height={px(0.25)}
            fill="#000" stroke="#000" strokeWidth={LW.light} />
        </g>
      ))}

      {/* ── Grout between frame return & CMU ── */}
      <rect x={frameL - px(GROUT_FILL)} y={cmuTop + px(1.5)}
        width={px(GROUT_FILL)} height={px(HM_RETURN_D - 1)}
        fill="url(#pat-grout)" opacity="0.25" stroke="#000" strokeWidth={LW.light} />

      {/* ── Sealant at frame/CMU gap ── */}
      <rect x={frameL + steelT} y={cmuTop}
        width={px(SEALANT_W)} height={px(0.5)}
        fill="url(#pat-sealant)" opacity="0.5" stroke="#000" strokeWidth={LW.light} />
      <rect x={frameL + steelT} y={cmuTop + px(0.5 + HM_RETURN_D)}
        width={px(SEALANT_W)} height={px(0.5)}
        fill="url(#pat-sealant)" opacity="0.5" stroke="#000" strokeWidth={LW.light} />

      {/* ── Weatherstrip (compression bulb) ── */}
      <circle cx={frameL + px(HM_FACE_W - 0.25)}
        cy={cmuTop + px(0.5 + HM_RETURN_D / 2)} r={px(WEATHERSTRIP / 2)}
        fill="none" stroke="#000" strokeWidth={LW.medium} />

      {/* ── Door stile ── */}
      <rect x={frameL + px(HM_FACE_W + 0.25)} y={cmuTop + px(2)}
        width={px(DOOR_T)} height={px(8)}
        fill="#fff" stroke="#000" strokeWidth={LW.heavy} />
      {/* X cross-hatch in stile to indicate aluminum section */}
      <line x1={frameL + px(HM_FACE_W + 0.25)} y1={cmuTop + px(2)}
        x2={frameL + px(HM_FACE_W + 0.25 + DOOR_T)} y2={cmuTop + px(10)}
        stroke="#000" strokeWidth={LW.light} />
      <line x1={frameL + px(HM_FACE_W + 0.25 + DOOR_T)} y1={cmuTop + px(2)}
        x2={frameL + px(HM_FACE_W + 0.25)} y2={cmuTop + px(10)}
        stroke="#000" strokeWidth={LW.light} />

      {/* ── Glass in door ── */}
      {(() => {
        const glassX = frameL + px(HM_FACE_W + 0.25 + (DOOR_T - GLASS_T) / 2);
        const glassTop = cmuTop + px(2.5);
        const glassH = px(7);
        return (
          <>
            <rect x={glassX} y={glassTop} width={px(0.25)} height={glassH}
              fill="none" stroke="#000" strokeWidth={LW.heavy} />
            <rect x={glassX + px(0.75)} y={glassTop} width={px(0.25)} height={glassH}
              fill="none" stroke="#000" strokeWidth={LW.heavy} />
            {/* Glazing stops */}
            <rect x={glassX - px(GLAZING_STOP)} y={glassTop}
              width={px(GLAZING_STOP)} height={glassH}
              fill="#000" stroke="#000" strokeWidth={LW.light} />
            <rect x={glassX + px(GLASS_T)} y={glassTop}
              width={px(GLAZING_STOP)} height={glassH}
              fill="#000" stroke="#000" strokeWidth={LW.light} />
          </>
        );
      })()}

      {/* ── Break lines ── */}
      <BreakLine x1={cmuL} y1={cmuBtm} x2={frameL + px(HM_FACE_W + 3)} y2={cmuBtm} />

      {/* ── Dimension lines ── */}
      <DimLine x1={cmuL} y1={cmuBtm + px(1)} x2={cmuR} y2={cmuBtm + px(1)}
        label={`${CMU_NOMINAL}"`} side="bottom" offset={3} />
      <DimLine x1={cmuR} y1={cmuBtm + px(1)}
        x2={cmuR + px(HM_FACE_W)} y2={cmuBtm + px(1)}
        label={`${HM_FACE_W}"`} side="bottom" offset={3} />
      {/* Frame return depth */}
      <DimLine x1={frameL + px(HM_FACE_W + 4)} y1={cmuTop + px(0.5)}
        x2={frameL + px(HM_FACE_W + 4)} y2={cmuTop + px(0.5 + HM_RETURN_D)}
        label={`${HM_RETURN_D}"`} side="right" offset={3} />

      {/* ── Leader callouts (right side) ── */}
      <Leader x={cmuL + px(3)} y={cmuTop + px(5)}
        tx={frameL + px(6)} ty={cmuTop + 2} label="8&quot; CMU (GROUTED CELL AT JAMB)" align="right" />
      <Leader x={frameL + px(1)} y={cmuTop + px(1.5)}
        tx={frameL + px(6)} ty={cmuTop + 6} label="16-GA H.M. FRAME" align="right" />
      <Leader x={frameL + px(HM_FACE_W + 0.25 + DOOR_T / 2)} y={cmuTop + px(5)}
        tx={frameL + px(6)} ty={cmuTop + 10} label="ALUM. STOREFRONT STILE" align="right" />
      <Leader x={frameL + px(HM_FACE_W + 0.25 + DOOR_T / 2)} y={cmuTop + px(7)}
        tx={frameL + px(6)} ty={cmuTop + 14} label="1&quot; INSUL. TEMPERED GLASS" align="right" />

      {/* ── Leader callouts (left side) ── */}
      <Leader x={frameL - px(0.5)} y={cmuTop + px(5)}
        tx={cmuL - px(1)} ty={cmuTop + px(3)} label="GROUT FILL" align="left" />
      <Leader x={frameL - px(2)} y={cmuTop + px(2.5)}
        tx={cmuL - px(1)} ty={cmuTop + px(6)} label="T-ANCHOR (TYP. 3 PER JAMB)" align="left" />
      <Leader x={frameL + px(0.5)} y={cmuTop}
        tx={cmuL - px(1)} ty={cmuTop + px(9)} label="SEALANT EACH SIDE" align="left" />

      {/* Ref schedule note */}
      <text x={cmuL} y={cmuBtm + px(4.5)} fontSize="2" fill="#000"
        fontFamily="'Courier New',monospace">REF. SCHEDULE</text>

      {/* ── Detail bubble ── */}
      <DetailBubble x={8} y={vh - 10} detailNum="2" sheetNum="A-100" />

      {/* ── Title ── */}
      <text x={18} y={vh - 8} fontSize="3.5" fill="#000" fontWeight="700"
        fontFamily="'Courier New',monospace">H.M. DOOR JAMB</text>
      <text x={18} y={vh - 4.5} fontSize="2.5" fill="#000"
        fontFamily="'Courier New',monospace">@ CMU WALL</text>
    </svg>
  );
}

// ========================================================================
// 3 / A-100  —  SILL / THRESHOLD DETAIL
// ========================================================================
function SillDetail() {
  const vw = 110;
  const vh = 100;
  const ox = 35;
  const oy = 10;

  const cmuL = ox;
  const cmuR = ox + px(CMU_NOMINAL);
  const slabTop = oy + px(12);  // finish floor line

  return (
    <svg width="100%" viewBox={`0 0 ${vw} ${vh}`} style={{ display: "block" }}>
      <SharedDefs />

      {/* ── Concrete slab ── */}
      <rect x={cmuL - px(3)} y={slabTop} width={px(CMU_NOMINAL + 10)} height={px(5)}
        fill="#fff" stroke="#000" strokeWidth={LW.heavy} />
      <rect x={cmuL - px(3)} y={slabTop} width={px(CMU_NOMINAL + 10)} height={px(5)}
        fill="url(#pat-conc)" opacity="0.5" />

      {/* ── CMU wall above slab (left side of opening) ── */}
      <rect x={cmuL} y={oy + px(2)} width={px(CMU_NOMINAL)} height={px(10)}
        fill="#fff" stroke="#000" strokeWidth={LW.heavy} />
      <rect x={cmuL} y={oy + px(2)} width={px(CMU_NOMINAL)} height={px(10)}
        fill="url(#pat-cmu)" opacity="0.5" />

      {/* ── Sill pan flashing ── */}
      <path d={`M${cmuL - px(0.5)} ${slabTop}
        L${cmuR + px(1.5)} ${slabTop}
        L${cmuR + px(1.5)} ${slabTop - px(SILL_PAN_H)}
        L${cmuR + px(2)} ${slabTop - px(SILL_PAN_H)}
        L${cmuR + px(2)} ${slabTop + px(0.125)}
        L${cmuL - px(1)} ${slabTop + px(0.125)}
        L${cmuL - px(1)} ${slabTop - px(SILL_PAN_H)}
        L${cmuL - px(0.5)} ${slabTop - px(SILL_PAN_H)} Z`}
        fill="none" stroke="#000" strokeWidth={LW.heavy} />

      {/* ── Aluminum threshold ── */}
      {(() => {
        const thX = cmuL + px((CMU_NOMINAL - THRESHOLD_W) / 2);
        const thY = slabTop - px(THRESHOLD_H + SILL_PAN_H);
        return (
          <>
            <rect x={thX} y={thY} width={px(THRESHOLD_W)} height={px(THRESHOLD_H)}
              fill="#fff" stroke="#000" strokeWidth={LW.heavy} />
            {/* Profile ridge */}
            <rect x={thX + px(0.5)} y={thY - px(0.2)}
              width={px(THRESHOLD_W - 1)} height={px(0.2)}
              fill="#000" stroke="#000" strokeWidth={LW.light} />
          </>
        );
      })()}

      {/* ── Sealant bed under threshold ── */}
      <rect x={cmuL + px(0.5)} y={slabTop - px(0.125)}
        width={px(CMU_NOMINAL - 1)} height={px(0.125)}
        fill="url(#pat-sealant)" opacity="0.5" stroke="#000" strokeWidth={LW.light} />

      {/* ── Door bottom rail ── */}
      {(() => {
        const railY = slabTop - px(THRESHOLD_H + SILL_PAN_H + 2.5);
        const railW = px(CMU_NOMINAL - 2);
        return (
          <>
            <rect x={cmuL + px(1)} y={railY} width={railW} height={px(DOOR_T)}
              fill="#fff" stroke="#000" strokeWidth={LW.heavy} />
            <line x1={cmuL + px(1)} y1={railY}
              x2={cmuL + px(1) + railW} y2={railY + px(DOOR_T)}
              stroke="#000" strokeWidth={LW.light} />
            <line x1={cmuL + px(1) + railW} y1={railY}
              x2={cmuL + px(1)} y2={railY + px(DOOR_T)}
              stroke="#000" strokeWidth={LW.light} />
          </>
        );
      })()}

      {/* ── Door sweep ── */}
      <rect x={cmuL + px(1)} y={slabTop - px(THRESHOLD_H + SILL_PAN_H + 0.75)}
        width={px(CMU_NOMINAL - 2)} height={px(0.4)}
        fill="#000" stroke="#000" strokeWidth={LW.light} opacity="0.6" />

      {/* ── Glass panel above bottom rail ── */}
      {(() => {
        const glassX = cmuL + px((CMU_NOMINAL - GLASS_T) / 2);
        const glassBot = slabTop - px(THRESHOLD_H + SILL_PAN_H + 2.5);
        const glassH = px(5);
        return (
          <>
            <rect x={glassX} y={glassBot - glassH} width={px(0.25)} height={glassH}
              fill="none" stroke="#000" strokeWidth={LW.heavy} />
            <rect x={glassX + px(0.75)} y={glassBot - glassH} width={px(0.25)} height={glassH}
              fill="none" stroke="#000" strokeWidth={LW.heavy} />
            <rect x={glassX - px(GLAZING_STOP)} y={glassBot - glassH}
              width={px(GLAZING_STOP)} height={glassH}
              fill="#000" stroke="#000" strokeWidth={LW.light} />
            <rect x={glassX + px(GLASS_T)} y={glassBot - glassH}
              width={px(GLAZING_STOP)} height={glassH}
              fill="#000" stroke="#000" strokeWidth={LW.light} />
          </>
        );
      })()}

      {/* ── Finish floor line ── */}
      <line x1={cmuL - px(4)} y1={slabTop} x2={cmuR + px(5)} y2={slabTop}
        stroke="#000" strokeWidth={LW.medium} strokeDasharray="2 1" />
      <text x={cmuR + px(5.5)} y={slabTop + 1.2}
        fontSize="2.2" fill="#000" fontFamily="'Courier New',monospace">F.F.L.</text>

      {/* ── Break lines ── */}
      <BreakLine x1={cmuL - px(2)} y1={oy + px(1)} x2={cmuR + px(3)} y2={oy + px(1)} />

      {/* ── Dimension lines ── */}
      <DimLine x1={cmuL} y1={slabTop + px(3)} x2={cmuR} y2={slabTop + px(3)}
        label={`${CMU_NOMINAL}"`} side="bottom" offset={3} />
      <DimLine x1={cmuR + px(4)} y1={slabTop}
        x2={cmuR + px(4)} y2={slabTop - px(THRESHOLD_H + SILL_PAN_H)}
        label={`${THRESHOLD_H + SILL_PAN_H}"`} side="right" offset={3} />

      {/* ── Leader callouts (right side) ── */}
      <Leader x={cmuL + px(CMU_NOMINAL / 2)} y={slabTop - px(THRESHOLD_H + SILL_PAN_H) + px(0.25)}
        tx={cmuR + px(4)} ty={oy + px(4)} label="ALUM. THRESHOLD (ADA)" align="right" />
      <Leader x={cmuL + px(CMU_NOMINAL / 2)} y={slabTop - px(0.5)}
        tx={cmuR + px(4)} ty={oy + px(7)} label="SILL PAN FLASHING" align="right" />
      <Leader x={cmuR + px(1)} y={slabTop + px(2.5)}
        tx={cmuR + px(4)} ty={slabTop + px(3)} label="CONC. SLAB" align="right" />
      <Leader x={cmuL + px(CMU_NOMINAL / 2)} y={slabTop - px(3)}
        tx={cmuR + px(4)} ty={oy + px(10)} label="1&quot; INSUL. TEMPERED GLASS" align="right" />

      {/* ── Leader callouts (left side) ── */}
      <Leader x={cmuL + px(1)} y={slabTop - px(THRESHOLD_H + SILL_PAN_H + 0.5)}
        tx={cmuL - px(4)} ty={oy + px(4)} label="DOOR SWEEP" align="left" />
      <Leader x={cmuL + px(1)} y={slabTop - px(0.1)}
        tx={cmuL - px(4)} ty={oy + px(7)} label="SEALANT BED" align="left" />
      <Leader x={cmuL + px(3)} y={oy + px(6)}
        tx={cmuL - px(4)} ty={oy + px(10)} label="8&quot; CMU WALL" align="left" />
      <Leader x={cmuL + px(CMU_NOMINAL / 2)} y={slabTop - px(5)}
        tx={cmuL - px(4)} ty={oy + px(2)} label="DOOR AND FRAME AS SCHED." align="left" />

      {/* ── Detail bubble ── */}
      <DetailBubble x={8} y={vh - 10} detailNum="3" sheetNum="A-100" />

      {/* ── Title ── */}
      <text x={18} y={vh - 8} fontSize="3.5" fill="#000" fontWeight="700"
        fontFamily="'Courier New',monospace">H.M. DOOR SILL</text>
      <text x={18} y={vh - 4.5} fontSize="2.5" fill="#000"
        fontFamily="'Courier New',monospace">@ CMU WALL</text>
    </svg>
  );
}

// ── Hardware Schedule ────────────────────────────────────────────────────
function HardwareSchedule() {
  const items = [
    { mark: "HW-1", item: "Hinges", spec: '4-1/2" × 4-1/2" Heavy-Weight Ball Bearing, US26D (satin chrome)', qty: "3 EA", notes: "BHMA A156.1, Grade 1. Full mortise, non-removable pin (NRP) for exterior." },
    { mark: "HW-2", item: "Lockset", spec: "Mortise Lock, Storeroom Function (F07)", qty: "1 EA", notes: "BHMA A156.13, Grade 1. Schlage L9080 or equal." },
    { mark: "HW-3", item: "Cylinder", spec: '1-1/4" Mortise Cylinder, 6-pin, Satin Chrome', qty: "1 EA", notes: "Schlage Primus or equal. Master-keyed to building system." },
    { mark: "HW-4", item: "Thumbturn", spec: "Thumbturn for interior side of mortise lock", qty: "1 EA", notes: "Matches lockset manufacturer." },
    { mark: "HW-5", item: "Door Closer", spec: "Surface-Mounted Closer, Size 4, Aluminum Finish", qty: "1 EA", notes: "BHMA A156.4, Grade 1. Norton 7500 or LCN 4040XP." },
    { mark: "HW-6", item: "Threshold", spec: 'Aluminum Saddle Threshold, 1/2" height, 5" wide', qty: "1 EA", notes: "ADA compliant. Pemko 272A or equal." },
    { mark: "HW-7", item: "Weatherstrip", spec: "Compression Weatherstrip (head & jambs), EPDM bulb", qty: "1 SET", notes: "Pemko S773 or equal. Kerf-installed in HM frame rabbet." },
    { mark: "HW-8", item: "Door Sweep", spec: "Automatic Door Bottom, Aluminum w/ Neoprene Seal", qty: "1 EA", notes: "Pemko 411 or equal. Surface-mounted." },
    { mark: "HW-9", item: "Panic Hardware", spec: "Rim Exit Device (if required by code)", qty: "1 EA", notes: "Von Duprin 99 series or equal. Verify with AHJ." },
    { mark: "HW-10", item: "Door Pull", spec: '12" CTC Back-to-Back Pull, Stainless Steel', qty: "1 SET", notes: "For storefront glass door exterior." },
    { mark: "HW-11", item: "Glass Stop", spec: '3/8" Snap-In Aluminum Glazing Stop', qty: "1 SET", notes: "For field-glazing 1\" IGU into storefront stile." },
    { mark: "HW-12", item: "Glazing", spec: '1" Insulated Tempered Glass Unit (low-E, argon)', qty: "1 EA", notes: "U-factor ≤ 0.30, SHGC ≤ 0.25. Safety tempered per IBC 2406." },
    { mark: "HW-13", item: "Frame Anchors", spec: "T-Strap Masonry Anchors, 16-GA Steel", qty: "6 EA", notes: "3 per jamb. Grouted into CMU cells." },
    { mark: "HW-14", item: "Silicone Sealant", spec: "DOW 795 or Pecora 895, Black", qty: "4 TUBES", notes: "Structural silicone at glass-to-frame joint." },
  ];

  return (
    <div style={{ padding: "16px 20px", fontFamily: "'Courier New', monospace", fontSize: 11, color: "#000" }}>
      <h3 style={{ fontSize: 13, fontWeight: 700, marginBottom: 4, letterSpacing: "0.08em", borderBottom: "2px solid #000", paddingBottom: 4 }}>
        HARDWARE SCHEDULE — FRONT ENTRY STOREFRONT DOOR
      </h3>
      <p style={{ fontSize: 10, color: "#333", marginBottom: 12 }}>
        Door: 4&apos;-0&quot; × 6&apos;-8&quot; Single Storefront Glass Door — Aluminum Frame in 16-GA Hollow Metal Sub-Frame — Set in 8&quot; CMU Wall
      </p>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 10 }}>
        <thead>
          <tr style={{ borderBottom: "2px solid #000" }}>
            <th style={{ padding: "4px 6px", textAlign: "left", width: "7%", borderBottom: "1px solid #000" }}>MARK</th>
            <th style={{ padding: "4px 6px", textAlign: "left", width: "11%", borderBottom: "1px solid #000" }}>ITEM</th>
            <th style={{ padding: "4px 6px", textAlign: "left", width: "36%", borderBottom: "1px solid #000" }}>SPECIFICATION</th>
            <th style={{ padding: "4px 6px", textAlign: "center", width: "6%", borderBottom: "1px solid #000" }}>QTY</th>
            <th style={{ padding: "4px 6px", textAlign: "left", width: "40%", borderBottom: "1px solid #000" }}>NOTES</th>
          </tr>
        </thead>
        <tbody>
          {items.map((hw) => (
            <tr key={hw.mark} style={{ borderBottom: "0.5px solid #999" }}>
              <td style={{ padding: "3px 6px", fontWeight: 700 }}>{hw.mark}</td>
              <td style={{ padding: "3px 6px", fontWeight: 600 }}>{hw.item}</td>
              <td style={{ padding: "3px 6px" }}>{hw.spec}</td>
              <td style={{ padding: "3px 6px", textAlign: "center" }}>{hw.qty}</td>
              <td style={{ padding: "3px 6px", color: "#333" }}>{hw.notes}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p style={{ fontSize: 9, color: "#666", marginTop: 8, borderTop: "1px solid #000", paddingTop: 4 }}>
        All hardware to be commercial grade. Verify occupancy classification with AHJ for panic hardware requirement.
        Coordinate keying with owner. All finishes: satin chrome (US26D) unless noted.
      </p>
    </div>
  );
}

// ── Main Export ──────────────────────────────────────────────────────────
export function DoorFrameDetail() {
  const [showHardware, setShowHardware] = useState(true);

  return (
    <div style={{ padding: "8px 12px" }}>
      {/* Layer toggle */}
      <div className="flex flex-wrap gap-1.5 px-3 py-2 bg-zinc-50 border-b border-zinc-200 items-center mb-4 rounded">
        <Toggle
          pressed={showHardware}
          onPressedChange={() => setShowHardware((v) => !v)}
          size="sm"
          variant="outline"
          className="h-7 px-3 text-xs font-mono rounded-full
                     bg-white border-2 border-zinc-600 text-zinc-700
                     data-[state=on]:bg-zinc-800 data-[state=on]:text-white
                     data-[state=on]:border-zinc-800 hover:bg-zinc-100 hover:border-zinc-700
                     data-[state=on]:hover:bg-zinc-700 transition-all"
        >
          Hardware Schedule
        </Toggle>
      </div>

      {/* Detail drawings — stacked vertically, white background like a print sheet */}
      <div style={{ display: "flex", flexDirection: "column", gap: 20, marginBottom: 16 }}>
        <div style={{ border: "1px solid #000", background: "#fff", padding: "8px 0" }}>
          <HeadDetail />
        </div>
        <div style={{ border: "1px solid #000", background: "#fff", padding: "8px 0" }}>
          <JambDetail />
        </div>
        <div style={{ border: "1px solid #000", background: "#fff", padding: "8px 0" }}>
          <SillDetail />
        </div>
      </div>

      {/* Hardware schedule */}
      {showHardware && (
        <div style={{ border: "1px solid #000", background: "#fff" }}>
          <HardwareSchedule />
        </div>
      )}
    </div>
  );
}
