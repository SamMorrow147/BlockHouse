/**
 * cut-list.ts — Aggregates the output of computeWallLayout into a
 * per-wall parts / cut list, grouped by piece type and cut length.
 */

import type { WallElevation } from "./types";
import { computeWallLayout } from "./layout-calculator";

/* ═══ Types ═══════════════════════════════════════════════════════════════ */

export interface CutLine {
  /** Human-readable category: "Plates", "Full Studs", "Short Studs", "Headers" */
  category: string;
  /** Piece description, e.g. "2×6 Stud", "Bottom Plate (left)" */
  label: string;
  /** Cut length in inches */
  cutLength: number;
  /** How many pieces at this exact length */
  qty: number;
  /** CSS colour chip matching the elevation drawing */
  chip: string;
  /** Optional Menards SKU */
  sku?: string;
  /** Optional stock length the piece comes from (inches) */
  stockLength?: number;
  /** Optional Menards product URL */
  url?: string;
  /** For openings: width × height (both in inches) */
  openingW?: number;
  openingH?: number;
  /** For openings: sill height */
  sillHeight?: number;
  /** For openings: "window" | "door" */
  openingType?: "window" | "door";
  /** For openings: specific subtype e.g. "Sliding Door", "Picture Window" */
  openingSubtype?: string;
}

export interface CutListSummary {
  wallName: string;
  wallId: string;
  totalPieces: number;
  uniqueCuts: number;
  lines: CutLine[];
}

/* ═══ SKU lookup ══════════════════════════════════════════════════════════ */

interface SkuInfo {
  sku: string;
  desc: string;
  stockIn: number;   // stock length in inches
  url?: string;
}

/** Map piece-type keywords → Menards SKU info */
const SKU: Record<string, SkuInfo> = {
  // Pre-cut studs (92-5/8" = first floor full-height studs)
  "stud-precut": {
    sku: "102-1046",
    desc: "2×6-92⅝\" SPF Stud",
    stockIn: 92.625,
    url: "https://www.menards.com/main/building-materials/lumber-boards/dimensional-lumber/2-x-6-pre-cut-stud-construction-framing-lumber/1021046/p-1444422687059-c-13125.htm",
  },
  // 2×6 16' framing lumber (plates, long pieces)
  "2x6-16": {
    sku: "102-1790",
    desc: "2×6-16' #2 SPF",
    stockIn: 192,
    url: "https://www.menards.com/main/building-materials/lumber-boards/dimensional-lumber/2-x-6-construction-framing-lumber/1021790/p-1444422746041-c-13125.htm",
  },
  // 2×6 10' framing lumber (shorter plates, cripples)
  "2x6-10": {
    sku: "102-1761",
    desc: "2×6-10' SPF",
    stockIn: 120,
    url: "https://www.menards.com/main/building-materials/lumber-boards/dimensional-lumber/2-x-6-construction-framing-lumber/1021761/p-1444422472610-c-13125.htm",
  },
  // Treated bottom plate 16'
  "bp-treated-16": {
    sku: "111-1066",
    desc: "2×6-16' AC2 Treated",
    stockIn: 192,
    url: "https://www.menards.com/main/building-materials/lumber-boards/dimensional-lumber/ac2-reg-2-x-6-2-prime-ground-contact-green-pressure-treated-lumber/1111066/p-1444422767258-c-13125.htm",
  },
  // Treated bottom plate 12'
  "bp-treated-12": {
    sku: "111-1040",
    desc: "2×6-12' AC2 Treated",
    stockIn: 144,
    url: "https://www.menards.com/main/building-materials/lumber-boards/dimensional-lumber/ac2-reg-2-x-6-2-prime-ground-contact-green-pressure-treated-lumber/1111040/p-1444422441223-c-13125.htm",
  },
  // 2×10 for headers
  "2x10-8": {
    sku: "102-2016",
    desc: "2×10-8' #2 Fir",
    stockIn: 96,
    url: "https://www.menards.com/main/building-materials/lumber-boards/dimensional-lumber/2-x-10-2-better-construction-framing-lumber/1022016/p-1444422197282-c-13125.htm",
  },
};

/* ═══ Helpers ═════════════════════════════════════════════════════════════ */

/** Round to nearest 1/8" for display consistency */
function snap8(n: number): number {
  return Math.round(n * 8) / 8;
}

function classifyStud(label: string): "king" | "jack" | "cripple" | "stud" {
  const l = label.toLowerCase();
  if (l.includes("king"))    return "king";
  if (l.includes("jack"))    return "jack";
  if (l.includes("cripple")) return "cripple";
  return "stud";
}

function bestSku(category: string, cutLen: number, label: string): SkuInfo | undefined {
  const lo = label.toLowerCase();

  // Bottom plates → treated lumber
  if (lo.includes("bottom plate")) {
    return cutLen <= 144 ? SKU["bp-treated-12"] : SKU["bp-treated-16"];
  }
  // Top plates → standard 16' framing
  if (lo.includes("top plate")) return SKU["2x6-16"];

  // Full-height studs (~111.5") come from pre-cut stock
  if (category === "Full Studs") return SKU["stud-precut"];

  // Short studs / cripples → cut from 10' stock
  if (category === "Short Studs") return cutLen <= 120 ? SKU["2x6-10"] : SKU["2x6-16"];

  // Headers
  if (category === "Headers") return SKU["2x10-8"];

  // Sills
  if (lo.includes("sill")) return cutLen <= 120 ? SKU["2x6-10"] : SKU["2x6-16"];

  return undefined;
}

/* ═══ Main function ══════════════════════════════════════════════════════ */

export function computeCutList(wall: WallElevation): CutListSummary {
  const layout = computeWallLayout(wall);

  // Collect every piece into a flat array of {label, length, category, chip}
  interface RawPiece { label: string; length: number; category: string; chip: string; }
  const pieces: RawPiece[] = [];

  // ── Plates ──
  for (const p of layout.bottomPlates) {
    pieces.push({ label: p.label, length: snap8(p.width), category: "Plates", chip: "#010101" });
  }
  for (const p of layout.topPlates) {
    pieces.push({ label: p.label, length: snap8(p.width), category: "Plates", chip: "#010101" });
  }
  for (const s of layout.sills) {
    pieces.push({ label: s.label, length: snap8(s.width), category: "Plates", chip: "#010101" });
  }

  // ── Studs ──
  const FULL_H = snap8(layout.wallHeightInches - 1.5 - 3.0); // plate-to-plate = H - bp - dtp
  for (const s of layout.studs) {
    const h = snap8(s.height);
    const type = classifyStud(s.label);

    if (Math.abs(h - FULL_H) < 0.5) {
      // Full-height stud (regular, king, or end)
      pieces.push({ label: s.label, length: h, category: "Full Studs", chip: "#fff" });
    } else {
      pieces.push({ label: s.label, length: h, category: "Short Studs", chip: "#f0f0f0" });
    }
  }

  // ── Headers ──
  for (const h of layout.headers) {
    const spec = h.headerSpec;
    const desc = spec ? spec.label : `Header ${snap8(h.width)}"`;
    pieces.push({ label: desc, length: snap8(h.width), category: "Headers", chip: "#e8e0d0" });
  }

  // ── Openings (windows / doors) — not cut pieces, but order items ──
  interface OpeningPiece extends RawPiece {
    openingW: number; openingH: number; sillHeight?: number;
    openingType: "window" | "door"; openingLabel?: string;
    openingSubtype?: string;
  }
  const openingPieces: OpeningPiece[] = [];
  for (const op of wall.openings) {
    if (op.type === "cmu-only") continue;
    const desc = op.label ?? `${op.type === "door" ? "Door" : "Window"} ${op.widthInches}" × ${op.heightInches}"`;
    openingPieces.push({
      label: desc,
      length: 0, // not a cut piece
      category: "Openings",
      chip: op.type === "door" ? "#8B6914" : "#4a90d9",
      openingW: op.widthInches,
      openingH: op.heightInches,
      sillHeight: op.sillHeightInches,
      openingType: op.type as "window" | "door",
      openingLabel: op.label,
      openingSubtype: op.openingSubtype,
    });
  }

  // ── Aggregate by category + label + length ──
  const key = (p: RawPiece) => `${p.category}|${p.label}|${p.length}`;
  const map = new Map<string, { piece: RawPiece; qty: number }>();
  for (const p of pieces) {
    const k = key(p);
    const existing = map.get(k);
    if (existing) {
      existing.qty++;
    } else {
      map.set(k, { piece: p, qty: 1 });
    }
  }

  // ── Build sorted cut lines ──
  const catOrder: Record<string, number> = { "Plates": 0, "Full Studs": 1, "Short Studs": 2, "Headers": 3, "Openings": 4 };
  const entries = Array.from(map.values()).sort((a, b) => {
    const ca = catOrder[a.piece.category] ?? 9;
    const cb = catOrder[b.piece.category] ?? 9;
    if (ca !== cb) return ca - cb;
    return b.piece.length - a.piece.length; // longest first within category
  });

  const lines: CutLine[] = entries.map(({ piece, qty }) => {
    const skuInfo = bestSku(piece.category, piece.length, piece.label);
    return {
      category: piece.category,
      label: piece.label,
      cutLength: piece.length,
      qty,
      chip: piece.chip,
      sku: skuInfo?.sku,
      stockLength: skuInfo?.stockIn,
      url: skuInfo?.url,
    };
  });

  // ── Append opening lines (not aggregated — each is unique) ──
  for (const op of openingPieces) {
    lines.push({
      category: "Openings",
      label: op.label,
      cutLength: 0,
      qty: 1,
      chip: op.chip,
      openingW: op.openingW,
      openingH: op.openingH,
      sillHeight: op.sillHeight,
      openingType: op.openingType,
      openingSubtype: op.openingSubtype,
    });
  }

  return {
    wallName: wall.name,
    wallId: wall.id,
    totalPieces: pieces.length + openingPieces.length,
    uniqueCuts: lines.filter(l => l.category !== "Openings").length,
    lines,
  };
}
