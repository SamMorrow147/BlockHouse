"use client";

import {
  useState,
  useRef,
  useCallback,
  type ReactNode,
  type MouseEvent as ReactMouseEvent,
} from "react";

/* ─── Types ──────────────────────────────────────────────────────────────── */

interface MeasurePoint {
  /** Position relative to the wrapper div (for drawing the overlay line) */
  sx: number;
  sy: number;
  /** Position in SVG viewBox units (for computing real-world distance) */
  vx: number;
  vy: number;
}

interface Props {
  children: ReactNode;
  /** SVG-units-per-inch scale factor (4 for elevations, 3 for floor plan) */
  pxPerInch: number;
}

/* ─── Fraction helpers ───────────────────────────────────────────────────── */

const FRAC: Record<number, string> = {
  0.25: "¼",
  0.5: "½",
  0.75: "¾",
};

function formatFtIn(totalInches: number): string {
  if (totalInches < 0.25) return '0"';

  const ft = Math.floor(totalInches / 12);
  const rem = totalInches % 12;
  const q = Math.round(rem * 4) / 4; // nearest ¼″

  const whole = Math.floor(q);
  const frac = +(q - whole).toFixed(2);
  const fracStr = FRAC[frac] ?? "";

  // Build inches string
  let inStr: string;
  if (whole > 0 && fracStr) inStr = `${whole}${fracStr}"`;
  else if (whole > 0) inStr = `${whole}"`;
  else if (fracStr) inStr = `${fracStr}"`;
  else inStr = '0"';

  if (ft === 0) return inStr;
  return `${ft}'-${inStr}`;
}

/* ─── Coordinate label helper ────────────────────────────────────────────── */

function formatCoord(vx: number, vy: number, pxPerInch: number): string {
  const xIn = vx / pxPerInch;
  const yIn = vy / pxPerInch;
  return `(${formatFtIn(Math.abs(xIn))}, ${formatFtIn(Math.abs(yIn))})`;
}

function formatCoordCompact(vx: number, vy: number, pxPerInch: number): string {
  const xIn = vx / pxPerInch;
  const yIn = vy / pxPerInch;
  return `${formatFtIn(Math.abs(xIn))}, ${formatFtIn(Math.abs(yIn))}`;
}

/* ─── Pill label sub-component ──────────────────────────────────────────── */

interface PillProps {
  x: number; y: number;
  label: string;
  color: string;
  anchor?: "start" | "end" | "middle";
}

function Pill({ x, y, label, color, anchor = "middle" }: PillProps) {
  const charW = 7.2;
  const padX = 8;
  const lw = label.length * charW + padX * 2;
  const lh = 20;
  const lx = anchor === "end" ? x - lw : anchor === "start" ? x : x - lw / 2;
  const ly = y - lh / 2;

  return (
    <g>
      <rect x={lx} y={ly} width={lw} height={lh} rx="4"
        fill="rgba(20,20,20,0.88)" stroke={color} strokeWidth="1" />
      <text x={lx + lw / 2} y={ly + lh / 2 + 0.5}
        fill="white" fontSize="11" fontWeight="600"
        fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
        textAnchor="middle" dominantBaseline="middle">
        {label}
      </text>
    </g>
  );
}

/* ─── Component ──────────────────────────────────────────────────────────── */

export function MeasureTape({ children, pxPerInch }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const activeSvg = useRef<SVGSVGElement | null>(null);

  const [start, setStart] = useState<MeasurePoint | null>(null);
  const [end, setEnd] = useState<MeasurePoint | null>(null);
  const [dragging, setDragging] = useState(false);

  /* Convert a browser mouse event into a MeasurePoint */
  const toPoint = useCallback(
    (e: ReactMouseEvent, svg: SVGSVGElement): MeasurePoint | null => {
      const wrap = wrapRef.current;
      if (!wrap) return null;

      // Screen-relative to wrapper
      const wr = wrap.getBoundingClientRect();
      const sx = e.clientX - wr.left;
      const sy = e.clientY - wr.top;

      // SVG viewBox coords via inverse CTM
      const ctm = svg.getScreenCTM();
      if (!ctm) return null;
      const pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const vp = pt.matrixTransform(ctm.inverse());

      return { sx, sy, vx: vp.x, vy: vp.y };
    },
    [],
  );

  /* ── Mouse handlers ──────────────────────────────────────────────────── */

  const handleDown = useCallback(
    (e: ReactMouseEvent) => {
      if (e.button !== 0) return;
      // Don't steal clicks from buttons / toggles / inputs
      const t = e.target as Element;
      if (t.closest("button, [role=button], input, label, a")) return;

      // Find the SVG that contains the click target
      const svg = t.closest("svg") as SVGSVGElement | null;
      if (!svg || !wrapRef.current?.contains(svg)) return;

      const pt = toPoint(e, svg);
      if (!pt) return;

      // Prevent the browser from starting a native image / element drag
      e.preventDefault();

      activeSvg.current = svg;
      setStart(pt);
      setEnd(pt);
      setDragging(true);
    },
    [toPoint],
  );

  const handleMove = useCallback(
    (e: ReactMouseEvent) => {
      if (!dragging || !activeSvg.current || !start) return;
      const pt = toPoint(e, activeSvg.current);
      if (!pt) return;

      // Shift held → snap to horizontal or vertical
      if (e.shiftKey) {
        const dx = Math.abs(pt.vx - start.vx);
        const dy = Math.abs(pt.vy - start.vy);
        if (dx >= dy) {
          // Lock horizontal: keep start's Y
          pt.sy = start.sy;
          pt.vy = start.vy;
        } else {
          // Lock vertical: keep start's X
          pt.sx = start.sx;
          pt.vx = start.vx;
        }
      }

      setEnd(pt);
    },
    [dragging, start, toPoint],
  );

  const handleUp = useCallback(() => {
    setDragging(false);
    // Keep start/end visible so user can screenshot — clear on next mousedown
  }, []);

  // Clear previous measurement when starting a new drag
  const handleDownWrapped = useCallback(
    (e: ReactMouseEvent) => {
      // If there's a stale measurement, clear it first
      if (!dragging && start && end) {
        setStart(null);
        setEnd(null);
      }
      handleDown(e);
    },
    [dragging, start, end, handleDown],
  );

  /* ── Distance computation ────────────────────────────────────────────── */

  const distInches =
    start && end
      ? Math.sqrt((end.vx - start.vx) ** 2 + (end.vy - start.vy) ** 2) /
        pxPerInch
      : 0;

  const show = !!(start && end && (distInches > 0.25 || dragging));

  /* ── Bounding rect (screen coords) ──────────────────────────────────── */

  const rectX = start && end ? Math.min(start.sx, end.sx) : 0;
  const rectY = start && end ? Math.min(start.sy, end.sy) : 0;
  const rectW = start && end ? Math.abs(end.sx - start.sx) : 0;
  const rectH = start && end ? Math.abs(end.sy - start.sy) : 0;

  /* ── Render ──────────────────────────────────────────────────────────── */

  return (
    <div
      ref={wrapRef}
      style={{ position: "relative", width: "100%" }}
      onMouseDown={handleDownWrapped}
      onMouseMove={handleMove}
      onMouseUp={handleUp}
      onMouseLeave={handleUp}
    >
      {children}

      {show && (
        <svg
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
            zIndex: 20,
            overflow: "visible",
          }}
        >
          {/* ── Bounding rectangle ── */}
          {rectW > 2 && rectH > 2 && (
            <rect
              x={rectX}
              y={rectY}
              width={rectW}
              height={rectH}
              fill="rgba(230,81,0,0.06)"
              stroke="#e65100"
              strokeWidth="1.2"
              strokeDasharray="4 3"
            />
          )}

          {/* ── Measurement line ── */}
          <line
            x1={start!.sx}
            y1={start!.sy}
            x2={end!.sx}
            y2={end!.sy}
            stroke="#e65100"
            strokeWidth="2"
            strokeDasharray="6 3"
          />

          {/* ── Endpoint dots ── */}
          <circle cx={start!.sx} cy={start!.sy} r="5" fill="#e65100" />
          <circle cx={end!.sx} cy={end!.sy} r="5" fill="#e65100" />

          {/* ── Start coordinate label ── */}
          <Pill
            x={start!.sx}
            y={start!.sy - 16}
            label={`A ${formatCoordCompact(start!.vx, start!.vy, pxPerInch)}`}
            color="#e65100"
          />

          {/* ── End coordinate label ── */}
          <Pill
            x={end!.sx}
            y={end!.sy + 18}
            label={`B ${formatCoordCompact(end!.vx, end!.vy, pxPerInch)}`}
            color="#e65100"
          />

          {/* ── Distance label (at midpoint of line) ── */}
          {distInches > 0.25 &&
            (() => {
              const label = formatFtIn(distInches);
              const charW = 8.5;
              const padX = 12;
              const lw = label.length * charW + padX * 2;
              const lh = 28;
              const gap = 14;

              // Position label above-right of cursor; flip if near right edge
              const wrapW = wrapRef.current?.offsetWidth ?? 9999;
              const flipX = end!.sx + gap + lw > wrapW;
              const lx = flipX ? end!.sx - gap - lw : end!.sx + gap;
              const ly = end!.sy - lh - 6;

              return (
                <g>
                  {/* Shadow */}
                  <rect
                    x={lx + 1}
                    y={ly + 2}
                    width={lw}
                    height={lh}
                    rx="5"
                    fill="rgba(0,0,0,0.25)"
                  />
                  {/* Background */}
                  <rect
                    x={lx}
                    y={ly}
                    width={lw}
                    height={lh}
                    rx="5"
                    fill="rgba(20,20,20,0.9)"
                    stroke="#e65100"
                    strokeWidth="1.2"
                  />
                  {/* Text */}
                  <text
                    x={lx + lw / 2}
                    y={ly + lh / 2 + 1}
                    fill="white"
                    fontSize="13.5"
                    fontWeight="600"
                    fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace"
                    textAnchor="middle"
                    dominantBaseline="middle"
                  >
                    {label}
                  </text>
                </g>
              );
            })()}

          {/* ── Coordinate info panel (bottom-left of bounding box) ── */}
          {distInches > 0.25 && (() => {
            const panelW = 220;
            const panelH = 58;
            const px = rectX;
            const py = rectY + rectH + 8;

            const startCoord = formatCoord(start!.vx, start!.vy, pxPerInch);
            const endCoord = formatCoord(end!.vx, end!.vy, pxPerInch);
            const widthIn = Math.abs(end!.vx - start!.vx) / pxPerInch;
            const heightIn = Math.abs(end!.vy - start!.vy) / pxPerInch;

            return (
              <g>
                <rect x={px} y={py} width={panelW} height={panelH} rx="6"
                  fill="rgba(10,10,10,0.92)" stroke="#e65100" strokeWidth="1" />
                <text x={px + 8} y={py + 16}
                  fill="#ffab40" fontSize="10.5" fontWeight="700"
                  fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace">
                  A: {startCoord}
                </text>
                <text x={px + 8} y={py + 30}
                  fill="#ffab40" fontSize="10.5" fontWeight="700"
                  fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace">
                  B: {endCoord}
                </text>
                <text x={px + 8} y={py + 46}
                  fill="rgba(255,255,255,0.7)" fontSize="10" fontWeight="500"
                  fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace">
                  W: {formatFtIn(widthIn)}  H: {formatFtIn(heightIn)}  D: {formatFtIn(distInches)}
                </text>
              </g>
            );
          })()}
        </svg>
      )}
    </div>
  );
}
