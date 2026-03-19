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
  return null;
}

/* ═══ Row component ══════════════════════════════════════════════════════ */

function CutRow({ line, showCat }: { line: CutLine; showCat: boolean }) {
  const isOpening = line.category === "Openings";

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
      <div style={{ minWidth: 0 }}>
        <span style={{ fontWeight: showCat ? 600 : 400 }}>{line.label}</span>
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
        {count} {count === 1 ? "piece" : "pieces"}
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

  // Group lines by category, merging duplicate category runs
  const groups: { cat: string; lines: CutLine[]; total: number }[] = [];
  let currentCat = "";
  for (const line of allLines) {
    if (line.category !== currentCat) {
      currentCat = line.category;
      const existing = groups.find(g => g.cat === currentCat);
      if (existing) {
        existing.lines.push(line);
        existing.total += line.qty;
        continue;
      }
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
