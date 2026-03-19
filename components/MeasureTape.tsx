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
    setStart(null);
    setEnd(null);
  }, []);

  /* ── Distance computation ────────────────────────────────────────────── */

  const distInches =
    start && end
      ? Math.sqrt((end.vx - start.vx) ** 2 + (end.vy - start.vy) ** 2) /
        pxPerInch
      : 0;

  const show = !!(start && end && (distInches > 0.25 || dragging));

  /* ── Render ──────────────────────────────────────────────────────────── */

  return (
    <div
      ref={wrapRef}
      style={{ position: "relative", width: "100%" }}
      onMouseDown={handleDown}
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
          <circle cx={start!.sx} cy={start!.sy} r="4.5" fill="#e65100" />
          <circle cx={end!.sx} cy={end!.sy} r="4.5" fill="#e65100" />

          {/* ── Distance label (follows cursor) ── */}
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
        </svg>
      )}
    </div>
  );
}
