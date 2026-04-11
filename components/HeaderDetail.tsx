"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import type { WallElevation, Opening, HeaderSpec } from "@/lib/types";

/* ═══ Assembly recommendation helpers ════════════════════════════════════ */

interface HeaderAssembly {
  opening: Opening;
  spec: HeaderSpec;
  /** Rough-opening width in inches */
  roWidth: number;
  /** Number of jack studs per side */
  jacks: number;
  /** Assembly layers described from face-to-face */
  layers: string[];
  /** Total built-up thickness */
  totalThickness: string;
  /** Whether it needs a plywood/OSB spacer to fill 2×6 wall depth */
  needsSpacer: boolean;
  spacerMaterial: string | null;
  spacerThickness: string | null;
  glue: string;
  screws: string;
  nails: string;
  nailPattern: string;
  notes: string[];
}

/**
 * Derive assembly details from a HeaderSpec + Opening.
 * 2×6 wall depth = 5.5" (actual).  Header must fill the full 5.5" so it
 * sits flush with stud faces on both sides of the wall.
 *
 * Standard 2× lumber face = 1.5".
 * LVL ply = 1.75".
 *
 * Common 2×6 wall header builds:
 *   (3) 2×N  +  (2) ½\" plywood spacers  → 3(1.5) + 2(0.5)  = 5.5\"  ✓
 *   (2) 2×N  +  (2) ½\" ply + 1\" rigid foam  → 2(1.5) + 1.0 + 1.5  = 5.5\"
 *   (2) LVL  +  2\" rigid foam insulation → 2(1.75) + 2.0  = 5.5\"  ✓
 */
function deriveAssembly(opening: Opening, wallDepth: number): HeaderAssembly | null {
  const spec = opening.headerSpec;
  if (!spec) return null;

  const roWidth = opening.widthInches;
  const jacks = opening.jackCount ?? 1;
  const isLVL = spec.label.toLowerCase().includes("lvl");
  const plies = spec.plies;
  const LUMBER_FACE = 1.5;
  const LVL_FACE = 1.75;

  // Figure out layers & spacer to fill the full wallDepth (5.5" for 2×6)
  let layers: string[] = [];
  let needsSpacer = false;
  let spacerMaterial: string | null = null;
  let spacerThickness: string | null = null;
  let totalThickness = "";

  if (isLVL) {
    // Double LVL = 2 × 1.75" = 3.5".  Gap to 5.5" = 2.0".
    // Fill with 2" rigid foam insulation board (XPS or polyiso) — adds R-value
    // and keeps the header flush with stud faces on both sides.
    const lumberTotal = plies * LVL_FACE;
    const gap = Math.round((wallDepth - lumberTotal) * 100) / 100;

    if (gap >= 0.25) {
      needsSpacer = true;
      spacerThickness = `${gap}"`;
      spacerMaterial = `${gap}" rigid foam insulation (XPS or polyiso)`;
      layers = [`1¾\" LVL ply`, `${gap}" rigid foam insulation`, `1¾\" LVL ply`];
      totalThickness = `${wallDepth}" (fills 2×6 wall)`;
    } else {
      for (let i = 0; i < plies; i++) layers.push(`1¾\" LVL ply`);
      totalThickness = `${lumberTotal}"`;
    }
  } else if (plies === 1 && spec.label.includes("(2)")) {
    // Data says plies=1 but label says "(2)" — this is 2 boards face-nailed,
    // rendered as a single solid piece in the elevation drawing.
    // Actual lumber = 2 × 1.5" = 3.0".  Gap to 5.5" = 2.5".
    // Best fill: upgrade to (3) plies + (2) ½" plywood spacers = 4.5 + 1.0 = 5.5"
    const lumberPlies = 3;
    const lumberTotal = lumberPlies * LUMBER_FACE;  // 4.5"
    const spacerCount = 2;
    const spacerEach = (wallDepth - lumberTotal) / spacerCount; // 0.5" each

    needsSpacer = true;
    spacerThickness = `½\" each (×${spacerCount})`;
    spacerMaterial = `(${spacerCount}) ½\" CDX plywood spacers`;
    layers = [
      `1½\" lumber ply`,
      `½\" plywood spacer`,
      `1½\" lumber ply`,
      `½\" plywood spacer`,
      `1½\" lumber ply`,
    ];
    totalThickness = `${wallDepth}" (fills 2×6 wall)`;
  } else if (plies >= 2) {
    // Standard built-up: e.g. (2) 2×6 in a 5.5" wall
    // 2 × 1.5" = 3.0" lumber.  Gap = 2.5".
    // Upgrade to (3) plies + (2) ½" plywood spacers = 4.5 + 1.0 = 5.5"
    const lumberTotal = plies * LUMBER_FACE;
    const gap = Math.round((wallDepth - lumberTotal) * 100) / 100;

    if (gap >= 0.25) {
      needsSpacer = true;

      // Strategy: add 1 extra ply of lumber + plywood spacers between each ply
      // (3) plies + (2) ½" plywood = 4.5 + 1.0 = 5.5" ✓
      const builtPlies = plies + 1; // upgrade from 2→3 plies
      const spacerCount = builtPlies - 1; // spacer between each pair
      const newLumber = builtPlies * LUMBER_FACE;
      const spacerEach = Math.round(((wallDepth - newLumber) / spacerCount) * 100) / 100;

      // Check if the math works out cleanly
      if (spacerEach > 0.05 && spacerEach <= 0.75) {
        spacerThickness = spacerEach === 0.5 ? `½\" each (×${spacerCount})` : `${spacerEach}" each (×${spacerCount})`;
        spacerMaterial = `(${spacerCount}) ${spacerEach === 0.5 ? "½\"" : spacerEach + "\""} CDX plywood spacers`;
        layers = [];
        for (let i = 0; i < builtPlies; i++) {
          layers.push(`1½\" lumber ply`);
          if (i < builtPlies - 1) {
            layers.push(`${spacerEach === 0.5 ? "½" : spacerEach}\" plywood spacer`);
          }
        }
        totalThickness = `${wallDepth}" (fills 2×6 wall)`;
      } else {
        // Fallback: 2 plies + rigid foam center
        spacerThickness = `${gap}"`;
        spacerMaterial = `${gap}" rigid foam insulation (XPS or polyiso)`;
        layers = [];
        for (let i = 0; i < plies; i++) {
          layers.push(`1½\" lumber ply`);
          if (i === 0) layers.push(`${gap}" rigid foam insulation`);
        }
        totalThickness = `${wallDepth}" (fills 2×6 wall)`;
      }
    } else {
      for (let i = 0; i < plies; i++) layers.push(`1½\" lumber ply`);
      totalThickness = `${wallDepth}"`;
    }
  }

  // Fastener recommendations — longer screws needed for 5.5" built-up
  const glue = "Titebond III (waterproof, exterior-rated PVA) — full coverage both faces of each spacer";
  const totalPlies = layers.filter(l => l.includes("lumber") || l.includes("LVL")).length;
  const screws = totalPlies >= 3
    ? "GRK RSS #10 × 5\" structural screws — through all plies, 12\" O.C. staggered"
    : "GRK R4 #9 × 3⅛\" structural screws — through all plies, 12\" O.C. staggered";
  const nails = totalPlies >= 3
    ? "16d sinker (3¼\" × 0.148\") — face-nail each ply through spacer, both sides"
    : "16d sinker (3¼\" × 0.148\") or 10d × 3\" ring-shank";
  const nailPattern = roWidth > 48
    ? "12\" O.C. staggered, 3 rows — top/middle/bottom (per IRC R602.3)"
    : "16\" O.C. staggered, 2 rows — top/bottom";

  // Notes
  const notes: string[] = [];
  if (spec.note) notes.push(spec.note);
  if (spec.subPlate) notes.push(`Sub-plate: ${spec.subPlate.label} (${spec.subPlate.depth}" thick)`);
  if (isLVL) notes.push("LVL — do not field-cut depth. Verify bearing length with engineer.");
  if (roWidth > 60) notes.push("Wide span — verify point loads with structural engineer.");
  if (jacks >= 2) notes.push(`Double jack studs each side (${jacks} per side) for load transfer.`);

  return {
    opening,
    spec,
    roWidth,
    jacks,
    layers,
    totalThickness,
    needsSpacer,
    spacerMaterial,
    spacerThickness,
    glue,
    screws,
    nails,
    nailPattern,
    notes,
  };
}

/* ═══ Format helpers ════════════════════════════════════════════════════ */

function fmtLen(inches: number): string {
  const ft = Math.floor(inches / 12);
  const rem = inches % 12;
  const whole = Math.floor(rem);
  const frac = Math.round((rem - whole) * 8) / 8;
  const FRAC: Record<number, string> = {
    0.125: "⅛", 0.25: "¼", 0.375: "⅜", 0.5: "½",
    0.625: "⅝", 0.75: "¾", 0.875: "⅞",
  };
  const fracStr = FRAC[frac] ?? "";
  const inPart =
    whole > 0 && fracStr ? `${whole}${fracStr}`
    : whole > 0          ? `${whole}`
    : fracStr            ? fracStr
    :                      "0";
  if (ft === 0) return `${inPart}"`;
  if (rem < 0.0625) return `${ft}'-0"`;
  return `${ft}'-${inPart}"`;
}

function depthLabel(depth: number): string {
  // Convert actual depth to nominal lumber size
  const map: Record<number, string> = {
    3.5: "2×4", 5.5: "2×6", 7.25: "2×8", 9.25: "2×10", 11.25: "2×12",
  };
  return map[depth] ?? `${depth}" deep`;
}

/* ═══ Layer sandwich diagram (inline SVG) ═══════════════════════════════ */

function SandwichDiagram({ layers }: { layers: string[] }) {
  const totalH = Math.max(60, layers.length * 18);
  const layerH = totalH / layers.length;
  const w = 200;

  return (
    <svg width={w} height={totalH + 4} viewBox={`0 0 ${w} ${totalH + 4}`} style={{ display: "block" }}>
      {layers.map((layer, i) => {
        const isFoam = layer.toLowerCase().includes("foam") || layer.toLowerCase().includes("insulation");
        const isPlywood = layer.toLowerCase().includes("plywood") || layer.toLowerCase().includes("osb");
        const isSpacer = isFoam || isPlywood;
        const isLVL = layer.toLowerCase().includes("lvl");
        const y = 2 + i * layerH;

        const fill = isFoam ? "#a8d8ea" : isPlywood ? "#d4c5a0" : isLVL ? "#c4a862" : "#f5eedc";
        const stroke = isFoam ? "#5ba3c4" : "#8b7d6b";

        return (
          <g key={i}>
            <rect
              x={2} y={y}
              width={w - 4} height={layerH - 2}
              rx={2}
              fill={fill}
              stroke={stroke}
              strokeWidth={1}
            />
            {/* Crosshatch for plywood */}
            {isPlywood && (
              <>
                <line x1={20} y1={y + 2} x2={w - 20} y2={y + layerH - 4} stroke="#a09070" strokeWidth={0.5} opacity={0.5} />
                <line x1={20} y1={y + layerH - 4} x2={w - 20} y2={y + 2} stroke="#a09070" strokeWidth={0.5} opacity={0.5} />
              </>
            )}
            {/* Stipple for foam insulation */}
            {isFoam && (
              <>
                {[0.2, 0.35, 0.5, 0.65, 0.8].map(pct => (
                  <circle key={pct} cx={w * pct} cy={y + layerH / 2 - 1} r={1.2} fill="#5ba3c4" opacity={0.3} />
                ))}
              </>
            )}
            <text
              x={w / 2} y={y + layerH / 2}
              textAnchor="middle" dominantBaseline="central"
              fontSize={9} fontFamily="ui-monospace, monospace"
              fill="#3d3528"
            >
              {layer}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/* ═══ Single header card ════════════════════════════════════════════════ */

function HeaderCard({ assembly, index }: { assembly: HeaderAssembly; index: number }) {
  const [open, setOpen] = useState(true);
  const o = assembly.opening;
  const s = assembly.spec;
  const typeLabel = o.openingSubtype ?? (o.type === "door" ? "Door" : "Window");

  return (
    <div style={{
      border: "1px solid #e0dbd3",
      borderRadius: 8,
      marginBottom: 8,
      background: "#fdfcf9",
      overflow: "hidden",
    }}>
      {/* Header bar */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          width: "100%",
          padding: "8px 10px",
          textAlign: "left",
          background: "#f7f3eb",
          border: "none",
          borderBottom: open ? "1px solid #e0dbd3" : "none",
          cursor: "pointer",
          font: "inherit",
          color: "inherit",
        }}
      >
        <ChevronDown
          aria-hidden
          size={14}
          strokeWidth={2.5}
          style={{
            flexShrink: 0,
            color: "#8b7d6b",
            transition: "transform 0.15s ease",
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
          }}
        />
        {/* Mini header icon */}
        <svg width={20} height={14} viewBox="0 0 20 14" style={{ flexShrink: 0 }}>
          <rect x={0} y={0} width={20} height={6} rx={1} fill="#e8d8b8" stroke="#8b7d6b" strokeWidth={0.8} />
          <rect x={0} y={7} width={20} height={6} rx={1} fill="#e8d8b8" stroke="#8b7d6b" strokeWidth={0.8} />
        </svg>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: "0.8rem", fontWeight: 700, color: "#4a3f30" }}>
            Header #{index + 1} — {typeLabel}
          </span>
          <span style={{
            fontSize: "0.7rem", color: "#8b7d6b", marginLeft: 8,
            fontFamily: "ui-monospace, monospace",
          }}>
            {fmtLen(assembly.roWidth)} span · {depthLabel(s.depth)}
          </span>
        </div>
        <span style={{
          fontSize: "0.66rem", fontWeight: 600,
          color: "#8b6914",
          background: "rgba(139,105,20,0.08)",
          borderRadius: 4, padding: "2px 6px",
          whiteSpace: "nowrap",
        }}>
          {(() => {
            const lumberCount = assembly.layers.filter(l => l.includes("lumber") || l.includes("LVL")).length;
            return lumberCount > 1 ? `${lumberCount}-ply` : "solid";
          })()}
          {assembly.needsSpacer ? " + spacer" : ""}
        </span>
      </button>

      {/* Expanded detail */}
      {open && (
        <div style={{ padding: "10px 12px", fontSize: "0.78rem", lineHeight: 1.55, color: "#3d3528" }}>
          {/* Spec summary */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "auto 1fr",
            gap: "3px 12px",
            marginBottom: 10,
            fontSize: "0.75rem",
          }}>
            <span style={{ color: "#8b7d6b", fontWeight: 600 }}>Spec:</span>
            <span style={{ fontFamily: "ui-monospace, monospace" }}>{s.label}</span>

            <span style={{ color: "#8b7d6b", fontWeight: 600 }}>Rough opening:</span>
            <span style={{ fontFamily: "ui-monospace, monospace" }}>
              {fmtLen(assembly.roWidth)} wide × {fmtLen(o.heightInches)} tall
            </span>

            <span style={{ color: "#8b7d6b", fontWeight: 600 }}>Header depth:</span>
            <span style={{ fontFamily: "ui-monospace, monospace" }}>{s.depth}" ({depthLabel(s.depth)})</span>

            <span style={{ color: "#8b7d6b", fontWeight: 600 }}>Built-up thickness:</span>
            <span style={{ fontFamily: "ui-monospace, monospace" }}>{assembly.totalThickness}</span>

            <span style={{ color: "#8b7d6b", fontWeight: 600 }}>Jack studs:</span>
            <span style={{ fontFamily: "ui-monospace, monospace" }}>{assembly.jacks} per side</span>
          </div>

          {/* Sandwich layers */}
          {assembly.layers.length > 0 && (
            <div style={{ marginBottom: 10 }}>
              <div style={{
                fontSize: "0.7rem", fontWeight: 700, textTransform: "uppercase",
                letterSpacing: "0.05em", color: "#8b7d6b", marginBottom: 4,
              }}>
                Sandwich Assembly
              </div>
              <SandwichDiagram layers={assembly.layers} />
            </div>
          )}

          {/* Spacer detail */}
          {assembly.needsSpacer && (
            <div style={{
              background: "#f0ead8", borderRadius: 6, padding: "6px 10px",
              marginBottom: 8, border: "1px solid #ddd3b8",
            }}>
              <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "#6b5d28", marginBottom: 2 }}>
                Spacer
              </div>
              <div style={{ fontSize: "0.73rem", fontFamily: "ui-monospace, monospace" }}>
                {assembly.spacerMaterial} — cut to {fmtLen(assembly.roWidth)} × {s.depth}"
              </div>
            </div>
          )}

          {/* Fasteners */}
          <div style={{
            display: "grid",
            gridTemplateColumns: "auto 1fr",
            gap: "3px 12px",
            marginBottom: 8,
            fontSize: "0.73rem",
          }}>
            <span style={{ color: "#8b7d6b", fontWeight: 600 }}>Glue:</span>
            <span>{assembly.glue}</span>

            <span style={{ color: "#8b7d6b", fontWeight: 600 }}>Screws:</span>
            <span style={{ fontFamily: "ui-monospace, monospace" }}>{assembly.screws}</span>

            <span style={{ color: "#8b7d6b", fontWeight: 600 }}>Nails:</span>
            <span style={{ fontFamily: "ui-monospace, monospace" }}>{assembly.nails}</span>

            <span style={{ color: "#8b7d6b", fontWeight: 600 }}>Nail pattern:</span>
            <span style={{ fontFamily: "ui-monospace, monospace" }}>{assembly.nailPattern}</span>
          </div>

          {/* Sub-plate detail */}
          {s.subPlate && (
            <div style={{
              background: "#e8f4ea", borderRadius: 6, padding: "6px 10px",
              marginBottom: 8, border: "1px solid #c8e0cc",
            }}>
              <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "#2d6b3f", marginBottom: 2 }}>
                Sub-Plate (flat under header)
              </div>
              <div style={{ fontSize: "0.73rem", fontFamily: "ui-monospace, monospace" }}>
                {s.subPlate.label} — {s.subPlate.depth}" thick × {fmtLen(assembly.roWidth)} long
              </div>
            </div>
          )}

          {/* Notes */}
          {assembly.notes.length > 0 && (
            <div style={{
              background: "#fef9e7", borderRadius: 6, padding: "6px 10px",
              border: "1px solid #f0e4b8", fontSize: "0.72rem", color: "#6b5d28",
            }}>
              {assembly.notes.map((n, i) => (
                <div key={i} style={{ marginBottom: i < assembly.notes.length - 1 ? 3 : 0 }}>
                  ⚠ {n}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ═══ Main HeaderDetail drawer ══════════════════════════════════════════ */

export interface HeaderFloorDef {
  label: string;
  wall: WallElevation;
}

export function HeaderDetail({
  wall,
  floors,
  wallDepth = 5.5,
}: {
  wall: WallElevation;
  floors?: HeaderFloorDef[];
  wallDepth?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const [activeFloors, setActiveFloors] = useState<boolean[]>(
    () => floors ? floors.map(() => true) : []
  );

  const toggleFloor = (i: number) =>
    setActiveFloors(prev => prev.map((v, idx) => idx === i ? !v : v));

  // Collect all walls to scan
  const wallsToScan: WallElevation[] = floors
    ? floors.filter((_, i) => activeFloors[i]).map(f => f.wall)
    : [wall];

  // Build assemblies from all openings with headerSpecs
  const assemblies: HeaderAssembly[] = [];
  for (const w of wallsToScan) {
    for (const op of w.openings) {
      if (op.headerSpec && op.type !== "cmu-only") {
        const a = deriveAssembly(op, wallDepth);
        if (a) assemblies.push(a);
      }
    }
  }

  // Nothing to show if no headers
  if (assemblies.length === 0) return null;

  const panelId = `header-detail-panel-${wall.id}`;

  return (
    <div style={{ width: "100%" }}>
      <button
        type="button"
        id={`${panelId}-trigger`}
        aria-expanded={expanded}
        aria-controls={panelId}
        onClick={() => setExpanded(v => !v)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          width: "100%",
          padding: "6px 8px",
          marginBottom: expanded ? 8 : 0,
          textAlign: "left",
          background: "#faf8f3",
          border: "1px solid #e0dbd3",
          borderRadius: 8,
          cursor: "pointer",
          font: "inherit",
          color: "inherit",
        }}
      >
        <ChevronDown
          aria-hidden
          size={18}
          strokeWidth={2}
          style={{
            flexShrink: 0,
            color: "#8b7d6b",
            transition: "transform 0.15s ease",
            transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
          }}
        />
        {/* Header icon — matches CutList category icon style */}
        <svg width={18} height={16} viewBox="0 0 16 16" style={{ flexShrink: 0 }}>
          <rect x="1" y="4" width="14" height="4" rx="1" fill="#e8dcc0" stroke="#8b7d6b" strokeWidth="1" />
          <rect x="1" y="8" width="14" height="4" rx="1" fill="#e8dcc0" stroke="#8b7d6b" strokeWidth="1" />
        </svg>
        <strong style={{ fontSize: "0.82rem", color: "#4a3f30" }}>Headers</strong>
        <span style={{
          fontSize: "0.72rem",
          color: "#8b7d6b",
          fontFamily: "ui-monospace, monospace",
          marginLeft: "auto",
        }}>
          {assemblies.length} header{assemblies.length !== 1 ? "s" : ""} &middot; assembly details
        </span>
      </button>

      {expanded && (
        <div id={panelId} role="region" aria-labelledby={`${panelId}-trigger`}>
          {/* Floor toggles (same pattern as CutList) */}
          {floors && floors.length > 0 && (
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginBottom: 8,
              flexWrap: "wrap",
            }}>
              <span style={{ fontSize: "0.68rem", color: "#888", marginRight: 4 }}>Floors:</span>
              {floors.map((f, i) => (
                <button
                  key={f.label}
                  onClick={() => toggleFloor(i)}
                  style={{
                    padding: "2px 9px",
                    fontSize: "0.69rem",
                    fontFamily: "ui-monospace, monospace",
                    fontWeight: activeFloors[i] ? 700 : 400,
                    borderRadius: 99,
                    border: `1.5px solid ${activeFloors[i] ? "#4a3f30" : "#ccc"}`,
                    background: activeFloors[i] ? "#4a3f30" : "#fff",
                    color: activeFloors[i] ? "#fff" : "#666",
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    transition: "all 0.12s",
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>
          )}

          {assemblies.length === 0 ? (
            <div style={{ fontSize: "0.75rem", color: "#aaa", padding: "8px 0" }}>No floor selected.</div>
          ) : (
            assemblies.map((a, i) => (
              <HeaderCard key={`${a.opening.label}-${a.spec.label}-${i}`} assembly={a} index={i} />
            ))
          )}
        </div>
      )}
    </div>
  );
}
