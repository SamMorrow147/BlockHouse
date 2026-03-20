"use client";

import { useState } from "react";
import type { WallElevation } from "@/lib/types";
import { computeCutList, type CutLine } from "@/lib/cut-list";

export interface FloorDef {
  label: string;
  wall: WallElevation;
}

/* ═══ Helpers ═════════════════════════════════════════════════════════════ */

/** Format inches as ft'-in" with ¼" fractions */
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

function stockLabel(stockIn?: number): string {
  if (!stockIn) return "";
  const ft = Math.round(stockIn / 12);
  if (Math.abs(stockIn - 92.625) < 0.1) return "pre-cut 92⅝\"";
  return `${ft}' stock`;
}

/* ═══ Category icons (tiny SVG inline) ═══════════════════════════════════ */

function CatIcon({ cat }: { cat: string }) {
  const s = 16;
  if (cat === "Plates") return (
    <svg width={s} height={s} viewBox="0 0 16 16">
      <rect x="1" y="5" width="14" height="6" rx="1" fill="#555" stroke="#333" strokeWidth="1" />
    </svg>
  );
  if (cat === "Full Studs") return (
    <svg width={s} height={s} viewBox="0 0 16 16">
      <rect x="5" y="1" width="6" height="14" rx="1" fill="#fff" stroke="#333" strokeWidth="1" />
    </svg>
  );
  if (cat === "Short Studs") return (
    <svg width={s} height={s} viewBox="0 0 16 16">
      <rect x="5" y="5" width="6" height="10" rx="1" fill="#eee" stroke="#333" strokeWidth="1" />
    </svg>
  );
  if (cat === "Headers") return (
    <svg width={s} height={s} viewBox="0 0 16 16">
      <rect x="1" y="4" width="14" height="4" rx="1" fill="#e8dcc0" stroke="#333" strokeWidth="1" />
      <rect x="1" y="8" width="14" height="4" rx="1" fill="#e8dcc0" stroke="#333" strokeWidth="1" />
    </svg>
  );
  if (cat === "Openings") return (
    <svg width={s} height={s} viewBox="0 0 16 16">
      <rect x="2" y="2" width="12" height="12" rx="1" fill="none" stroke="#4a90d9" strokeWidth="1.5" strokeDasharray="3 2" />
    </svg>
  );
  if (cat === "Hardware") return (
    <svg width={s} height={s} viewBox="0 0 16 16">
      <rect x="1" y="5" width="3" height="6" rx="0.5" fill="#8BA0B4" stroke="#556" strokeWidth="0.8" />
      <rect x="4" y="6" width="8" height="4" rx="0.5" fill="#8BA0B4" stroke="#556" strokeWidth="0.8" />
      <rect x="12" y="5" width="3" height="6" rx="0.5" fill="#8BA0B4" stroke="#556" strokeWidth="0.8" />
    </svg>
  );
  if (cat === "Floor System") return (
    <svg width={s} height={s} viewBox="0 0 16 16">
      <rect x="1" y="3" width="14" height="3" rx="0.5" fill="#92400e" stroke="#333" strokeWidth="0.8" />
      <rect x="1" y="7" width="14" height="3" rx="0.5" fill="#92400e" stroke="#333" strokeWidth="0.8" opacity="0.7" />
      <rect x="1" y="11" width="14" height="2" rx="0.5" fill="#ca8a04" stroke="#333" strokeWidth="0.8" />
    </svg>
  );
  if (cat === "Bathroom Floor") return (
    <svg width={s} height={s} viewBox="0 0 16 16">
      <rect x="2" y="2" width="3" height="8" rx="0.5" fill="#059669" stroke="#333" strokeWidth="0.8" />
      <rect x="6" y="6" width="8" height="3" rx="0.5" fill="#059669" stroke="#333" strokeWidth="0.8" opacity="0.8" />
      <rect x="2" y="11" width="12" height="2" rx="0.5" fill="#059669" stroke="#333" strokeWidth="0.8" opacity="0.5" />
    </svg>
  );
  if (cat === "Stair Lumber") return (
    <svg width={s} height={s} viewBox="0 0 16 16">
      <line x1="2" y1="14" x2="14" y2="2" stroke="#78350f" strokeWidth="2" />
      <rect x="5" y="6" width="4" height="2" rx="0.5" fill="#a08850" stroke="#333" strokeWidth="0.6" />
      <rect x="9" y="3" width="4" height="2" rx="0.5" fill="#a08850" stroke="#333" strokeWidth="0.6" />
    </svg>
  );
  if (cat === "Blocking") return (
    <svg width={s} height={s} viewBox="0 0 16 16">
      <rect x="2" y="4" width="12" height="4" rx="1" fill="#a16207" stroke="#333" strokeWidth="0.8" />
      <rect x="2" y="9" width="12" height="4" rx="1" fill="#a16207" stroke="#333" strokeWidth="0.8" opacity="0.6" />
    </svg>
  );
  if (cat === "Fire Blocking") return (
    <svg width={s} height={s} viewBox="0 0 16 16">
      <rect x="2" y="5" width="12" height="6" rx="1" fill="#dc2626" stroke="#991b1b" strokeWidth="0.8" />
      <line x1="4" y1="7" x2="12" y2="7" stroke="#fff" strokeWidth="0.8" />
      <line x1="4" y1="9" x2="12" y2="9" stroke="#fff" strokeWidth="0.8" />
    </svg>
  );
  if (cat === "Stairwell Framing") return (
    <svg width={s} height={s} viewBox="0 0 16 16">
      <rect x="2" y="2" width="12" height="12" rx="1" fill="none" stroke="#7c3aed" strokeWidth="1.5" />
      <line x1="2" y1="8" x2="14" y2="8" stroke="#7c3aed" strokeWidth="1" />
      <line x1="8" y1="2" x2="8" y2="14" stroke="#7c3aed" strokeWidth="1" />
    </svg>
  );
  if (cat === "Corner Framing") return (
    <svg width={s} height={s} viewBox="0 0 16 16">
      <rect x="2" y="2" width="5" height="12" rx="1" fill="#0d9488" stroke="#333" strokeWidth="0.8" />
      <rect x="8" y="2" width="5" height="12" rx="1" fill="#0d9488" stroke="#333" strokeWidth="0.8" opacity="0.6" />
    </svg>
  );
  if (cat === "Roof Assembly") return (
    <svg width={s} height={s} viewBox="0 0 16 16">
      {/* Layered roof stack: insulation + membrane + coping */}
      <rect x="1" y="9" width="14" height="3" rx="0.5" fill="#6366f1" stroke="#333" strokeWidth="0.7" />
      <rect x="1" y="6" width="14" height="3" rx="0.5" fill="#6366f1" stroke="#333" strokeWidth="0.7" opacity="0.5" />
      <rect x="1" y="4" width="14" height="2" rx="0.5" fill="#1e1b4b" stroke="#333" strokeWidth="0.7" />
      <rect x="0" y="2" width="16" height="2" rx="0.5" fill="#8BA0B4" stroke="#333" strokeWidth="0.7" />
    </svg>
  );
  return null;
}

/* ═══ Row component ══════════════════════════════════════════════════════ */

function CutRow({ line, showCat }: { line: CutLine; showCat: boolean }) {
  const isOpening  = line.category === "Openings";
  const isHardware = line.category === "Hardware";

  if (isOpening) {
    // Icon chip scaled to opening aspect ratio (max 24px on longer side)
    const wIn = line.openingW ?? 24;
    const hIn = line.openingH ?? 24;
    const maxPx = 24;
    const ratio = wIn / (hIn || 1);
    const chipW = ratio >= 1 ? maxPx : Math.max(8, maxPx * ratio);
    const chipH = ratio <= 1 ? maxPx : Math.max(8, maxPx / ratio);

    // Openings get a special wider layout: icon | label + dims | sill info
    return (
      <div style={{
        display: "grid",
        gridTemplateColumns: "28px 1fr auto",
        gap: "0 8px",
        alignItems: "center",
        padding: "5px 0",
        borderBottom: "1px solid #eee",
        fontSize: "0.78rem",
        lineHeight: 1.35,
      }}>
        {/* Icon chip — dimensions reflect opening aspect ratio */}
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
          <div style={{
            width: chipW,
            height: chipH,
            borderRadius: 3,
            border: `2px ${line.openingType === "door" ? "solid" : "dashed"} ${line.chip}`,
            background: line.openingType === "door" ? "rgba(139,105,20,0.1)" : "rgba(74,144,217,0.1)",
          }} />
        </div>

        {/* Label + order size */}
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 600 }}>
            {line.openingSubtype ?? (line.openingType === "door" ? "Door" : "Window")}
          </div>
          <div style={{ fontSize: "0.72rem", color: "#666", fontFamily: "ui-monospace, monospace" }}>
            {line.label ? `${line.label} · ` : ""}
            {fmtLen(line.openingW ?? 0)} wide × {fmtLen(line.openingH ?? 0)} tall
            {line.sillHeight != null && line.sillHeight > 0 && (
              <span> · sill @ {fmtLen(line.sillHeight)}</span>
            )}
          </div>
        </div>

        {/* Type badge */}
        <div style={{
          fontSize: "0.68rem",
          fontWeight: 600,
          textTransform: "uppercase",
          letterSpacing: "0.04em",
          color: line.openingType === "door" ? "#8B6914" : "#4a90d9",
          background: line.openingType === "door" ? "rgba(139,105,20,0.08)" : "rgba(74,144,217,0.08)",
          borderRadius: 4,
          padding: "2px 6px",
          whiteSpace: "nowrap",
        }}>
          {line.openingSubtype ?? line.openingType}
        </div>
      </div>
    );
  }

  if (isHardware) {
    const isSillSealer = line.label.toLowerCase().includes("sill sealer");

    // Mini elevation icon for sill sealer — mirrors the green stripe on the wall drawings
    const SillSealerIcon = () => (
      <svg width={28} height={16} viewBox="0 0 28 16" style={{ display: "block" }}>
        {/* Wall bottom plate */}
        <rect x={2} y={1} width={24} height={7} rx={1} fill="#fff" stroke="#222" strokeWidth={1} />
        {/* White gap */}
        <rect x={2} y={8} width={24} height={2} fill="#fff" />
        {/* Green sill sealer stripe */}
        <rect x={2} y={10} width={24} height={4} rx={0.5} fill="#16a34a" opacity={0.9} />
      </svg>
    );

    return (
      <div style={{
        display: "grid",
        gridTemplateColumns: "28px 1fr auto",
        gap: "0 8px",
        alignItems: "center",
        padding: "5px 0",
        borderBottom: "1px solid #eee",
        fontSize: "0.78rem",
        lineHeight: 1.35,
      }}>
        {/* Icon — sill sealer gets its own mini elevation graphic, others get the category icon */}
        <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
          {isSillSealer ? <SillSealerIcon /> : showCat ? <CatIcon cat={line.category} /> : <span style={{ width: 16 }} />}
        </div>

        {/* Label + SKU link */}
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 600, color: isSillSealer ? "#15803d" : undefined }}>
            {line.url ? (
              <a href={line.url} target="_blank" rel="noopener noreferrer"
                style={{ color: "#3d6fa0", textDecoration: "none" }}>
                {line.label}
              </a>
            ) : line.label}
          </div>
          {line.sku && (
            <div style={{ fontSize: "0.72rem", color: "#888", fontFamily: "ui-monospace, monospace" }}>
              SKU: {line.sku}
            </div>
          )}
          {isSillSealer && (
            <div style={{ fontSize: "0.70rem", color: "#16a34a", fontFamily: "ui-monospace, monospace" }}>
              {line.qty} LF total · {Math.ceil(line.qty / 50)} roll{Math.ceil(line.qty / 50) !== 1 ? "s" : ""} @ 50&apos; ea
            </div>
          )}
        </div>

        {/* Quantity badge */}
        <div style={{
          fontFamily: "ui-monospace, monospace",
          fontWeight: 700,
          textAlign: "center",
          background: isSillSealer ? "#dcfce7" : "#dce8f0",
          borderRadius: 4,
          padding: "2px 8px",
          whiteSpace: "nowrap",
          color: isSillSealer ? "#15803d" : "#3a5a72",
        }}>
          {isSillSealer ? `${line.qty} LF` : `× ${line.qty}`}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      display: "grid",
      gridTemplateColumns: "20px 1fr 80px 36px 90px",
      gap: "0 8px",
      alignItems: "center",
      padding: "4px 0",
      borderBottom: "1px solid #eee",
      fontSize: "0.78rem",
      lineHeight: 1.35,
    }}>
      {/* Icon */}
      <div style={{ display: "flex", justifyContent: "center" }}>
        {showCat ? <CatIcon cat={line.category} /> : <span style={{ width: 16 }} />}
      </div>

      {/* Label */}
      <div style={{ minWidth: 0, display: "flex", alignItems: "baseline", gap: 6, flexWrap: "wrap" }}>
        <span style={{ fontWeight: showCat ? 600 : 400 }}>{line.label}</span>
        {line.code && (
          <span style={{
            fontFamily: "ui-monospace, monospace",
            fontSize: "0.68rem",
            color: "#6b7280",
            background: "#f3f4f6",
            border: "1px solid #e5e7eb",
            borderRadius: 3,
            padding: "0 4px",
            lineHeight: 1.5,
            whiteSpace: "nowrap",
          }}>
            {line.code}
          </span>
        )}
      </div>

      {/* Cut length */}
      <div style={{ fontFamily: "ui-monospace, monospace", textAlign: "right", whiteSpace: "nowrap" }}>
        {fmtLen(line.cutLength)}
      </div>

      {/* Quantity */}
      <div style={{
        fontFamily: "ui-monospace, monospace",
        fontWeight: 700,
        textAlign: "center",
        background: "#f0f0f0",
        borderRadius: 4,
        padding: "1px 4px",
      }}>
        ×{line.qty}
      </div>

      {/* Stock / SKU */}
      <div style={{ fontSize: "0.7rem", color: "#888", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
        {line.sku ? (
          line.url ? (
            <a href={line.url} target="_blank" rel="noopener noreferrer"
              style={{ color: "#1a55bb", textDecoration: "none" }}
              onMouseOver={(e) => (e.currentTarget.style.textDecoration = "underline")}
              onMouseOut={(e) => (e.currentTarget.style.textDecoration = "none")}>
              {stockLabel(line.stockLength)}
            </a>
          ) : (
            <span>{stockLabel(line.stockLength)}</span>
          )
        ) : (
          <span>{stockLabel(line.stockLength)}</span>
        )}
      </div>
    </div>
  );
}

/* ═══ Category header ════════════════════════════════════════════════════ */

function CatHeader({ cat, count }: { cat: string; count: number }) {
  return (
    <div style={{
      display: "flex",
      alignItems: "center",
      gap: 6,
      padding: "6px 0 2px",
      borderBottom: "2px solid #ddd",
      marginTop: 6,
    }}>
      <CatIcon cat={cat} />
      <span style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "#555" }}>
        {cat}
      </span>
      <span style={{ fontSize: "0.68rem", color: "#999", marginLeft: "auto" }}>
        {count} {cat === "Hardware" ? (count === 1 ? "item" : "items") : (count === 1 ? "piece" : "pieces")}
      </span>
    </div>
  );
}

/* ═══ Floor toggle pill ══════════════════════════════════════════════════ */

function FloorBtn({ label, on, toggle }: { label: string; on: boolean; toggle: () => void }) {
  return (
    <button
      onClick={toggle}
      style={{
        padding: "2px 9px",
        fontSize: "0.69rem",
        fontFamily: "ui-monospace, monospace",
        fontWeight: on ? 700 : 400,
        borderRadius: 99,
        border: `1.5px solid ${on ? "#3d3d3d" : "#ccc"}`,
        background: on ? "#3d3d3d" : "#fff",
        color: on ? "#fff" : "#666",
        cursor: "pointer",
        whiteSpace: "nowrap",
        transition: "all 0.12s",
      }}
    >
      {label}
    </button>
  );
}

/* ═══ Main component ═════════════════════════════════════════════════════ */

export function CutList({
  wall,
  openingsFrom,
  floors,
}: {
  wall: WallElevation;
  openingsFrom?: WallElevation;
  floors?: FloorDef[];
}) {
  // When `floors` is provided, manage per-floor toggles (all on by default)
  const [activeFloors, setActiveFloors] = useState<boolean[]>(
    () => floors ? floors.map(() => true) : []
  );

  const toggleFloor = (i: number) =>
    setActiveFloors(prev => prev.map((v, idx) => idx === i ? !v : v));

  // Determine which walls to compute based on floor toggles
  const wallsToShow: WallElevation[] = floors
    ? floors.filter((_, i) => activeFloors[i]).map(f => f.wall)
    : [wall];

  // Build combined lines from all active floors
  const allLines: CutLine[] = [];
  for (const w of wallsToShow) {
    allLines.push(...computeCutList(w).lines);
  }

  // When no `floors` prop, also merge legacy openingsFrom
  if (!floors && openingsFrom) {
    allLines.push(...computeCutList(openingsFrom).lines.filter(l => l.category === "Openings"));
  }

  // Totals for header
  const totalPieces = allLines.reduce((s, l) => s + l.qty, 0);
  const uniqueCuts  = new Set(allLines.map(l => `${l.label}|${l.cutLength}`)).size;

  // Sort all lines by canonical category order before grouping so that
  // repeated categories across floors (Plates → Openings → Plates …) merge correctly.
  const CAT_ORDER: Record<string, number> = {
    "Plates": 0, "Full Studs": 1, "Short Studs": 2, "Headers": 3,
    "Corner Framing": 4, "Floor System": 5, "Bathroom Floor": 6,
    "Stair Lumber": 7, "Blocking": 8, "Fire Blocking": 9,
    "Stairwell Framing": 10, "Roof Assembly": 11, "Openings": 12, "Hardware": 13,
  };
  allLines.sort((a, b) => (CAT_ORDER[a.category] ?? 9) - (CAT_ORDER[b.category] ?? 9));

  // Group lines by category
  const groups: { cat: string; lines: CutLine[]; total: number }[] = [];
  let currentCat = "";
  for (const line of allLines) {
    if (line.category !== currentCat) {
      currentCat = line.category;
      groups.push({ cat: currentCat, lines: [], total: 0 });
    }
    const g = groups[groups.length - 1];
    g.lines.push(line);
    g.total += line.qty;
  }

  return (
    <div style={{ width: "100%" }}>
      {/* Header row: title + floor toggles */}
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        marginBottom: 6,
        flexWrap: "wrap",
      }}>
        <strong style={{ fontSize: "0.82rem" }}>Cut list</strong>
        <span style={{
          fontSize: "0.72rem",
          color: "#666",
          fontFamily: "ui-monospace, monospace",
          marginRight: "auto",
        }}>
          {totalPieces} pieces &middot; {uniqueCuts} unique cuts
        </span>
        {floors && floors.map((f, i) => (
          <FloorBtn key={f.label} label={f.label} on={activeFloors[i]} toggle={() => toggleFloor(i)} />
        ))}
      </div>

      {/* Category groups */}
      {groups.length === 0 ? (
        <div style={{ fontSize: "0.75rem", color: "#aaa", padding: "8px 0" }}>No floor selected.</div>
      ) : groups.map((g) => (
        <div key={g.cat}>
          <CatHeader cat={g.cat} count={g.total} />
          {g.lines.map((line, i) => (
            <CutRow key={`${line.label}-${line.cutLength}-${i}`} line={line} showCat={i === 0} />
          ))}
        </div>
      ))}
    </div>
  );
}
