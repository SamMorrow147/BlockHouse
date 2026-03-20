/**
 * cut-list.ts — Aggregates the output of computeWallLayout into a
 * per-wall parts / cut list, grouped by piece type and cut length.
 */

import type { WallElevation } from "./types";
import { computeWallLayout, SW, PLATE_H, TOP_H } from "./layout-calculator";
import {
  TJI_OC, TJI_RIM_T, TJI_DEPTH, SUBFLOOR_T,
  STAIR_WIDTH, STAIR_TREAD_DEPTH, STAIR_MAIN_STEPS, STAIR_LAND_RISERS,
  STAIR_TOTAL_RISERS, STAIR2_TOTAL_RISERS, STAIR_NOSING,
  STAIR_TREAD_T, STAIR_RISER_T, STAIR_STRINGER_DEPTH, STAIR_STRINGER_FACE,
  STAIR_LAND_JOIST_D, STAIR_LAND_JOIST_W, STAIR_LAND_RIM_W, STAIR_LAND_DECK_T, STAIR_LAND_POST_W,
  BATH_JOIST_H, BATH_JOIST_OC, BATH_SUBFLOOR_T,
  PARTITION_WALL_R, CMU_T, CMU_INTERIOR_D, CMU_INTERIOR_W, FR_GAP, FR_D,
  ROOF_EXT_W, ROOF_EXT_D,
  ROOF_BATT_R, ROOF_POLYISO_T, ROOF_POLYISO_R, ROOF_TOTAL_R,
  ROOF_COVERBOARD_T, ROOF_EPDM_T, ROOF_PARAPET_H,
  ROOF_FLASHING_LAP, ROOF_COPING_W, ROOF_SCUPPER_COUNT,
  ROOF_SNOW_LOAD,
} from "./framing-data";

/* ═══ Types ═══════════════════════════════════════════════════════════════ */

export interface CutLine {
  /** Human-readable category: "Plates", "Full Studs", "Short Studs", "Headers" */
  category: string;
  /** Piece description, e.g. "2×6 Stud", "Bottom Plate (left)" */
  label: string;
  /** Short code shown in cut list, e.g. "S TP 1-1" */
  code?: string;
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
  // MiTek IHFL25925 I-joist hanger
  "ihfl25925": {
    sku: "IHFL25925",
    desc: "i-Joist Hanger 2-1/2\" × 9-1/2\" IHFL25925 — MiTek G90 Steel",
    stockIn: 0,
    url: "https://www.mitek-us.com/products/connectors/joist-hangers/ihfl/",
  },
  // Anchor bolts — wedge anchor for treated plate to CMU/slab
  "anchor-bolt": {
    sku: "232-7897",
    desc: "1/2\" × 5-1/2\" HDG Wedge Anchor",
    stockIn: 0,
    url: "https://www.menards.com/main/hardware/fasteners-connectors/anchors/wedge-anchors/grip-rite-reg-1-2-x-5-1-2-hot-dip-galvanized-wedge-anchor/2327897/p-1444442529724.htm",
  },
  // 2×12 stringer stock
  "2x12-10": {
    sku: "102-2155",
    desc: "2×12-10' #2 Fir",
    stockIn: 120,
    url: "https://www.menards.com/main/building-materials/lumber-boards/dimensional-lumber/2-x-12-2-better-construction-framing-lumber/1022155/p-1444422218450-c-13125.htm",
  },
  // 2×4 for blocking / fire stops
  "2x4-8": {
    sku: "102-1101",
    desc: "2×4-8' SPF Stud",
    stockIn: 96,
    url: "https://www.menards.com/main/building-materials/lumber-boards/dimensional-lumber/2-x-4-pre-cut-stud-construction-framing-lumber/1021101/p-1444422441260-c-13125.htm",
  },
};

/* ═══ Helpers ═════════════════════════════════════════════════════════════ */

/** Round to nearest 1/8" for display consistency */
function snap8(n: number): number {
  return Math.round(n * 8) / 8;
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

  // Hardware
  if (lo.includes("ihfl25925")) return SKU["ihfl25925"];
  if (lo.includes("wedge anchor") || lo.includes("anchor bolt")) return SKU["anchor-bolt"];

  // Blocking / fire blocking — cut from 2×4 or 2×6 depending on context
  if (category === "Blocking" || category === "Fire Blocking") {
    if (lo.includes("2×4") || lo.includes("2x4")) return SKU["2x4-8"];
    return cutLen <= 120 ? SKU["2x6-10"] : SKU["2x6-16"];
  }

  // Stairwell framing
  if (category === "Stairwell Framing") {
    if (lo.includes("hanger")) return SKU["ihfl25925"];
    if (lo.includes("trimmer") || lo.includes("header")) return undefined; // TJI or LVL — engineer spec
    return undefined;
  }

  // Corner studs
  if (category === "Corner Framing") return SKU["stud-precut"];

  return undefined;
}

/* ═══ Plate code helper ══════════════════════════════════════════════════ */

const WALL_ABBR: Record<string, string> = {
  south: "S", north: "N", east: "E", west: "W",
  "south-2": "S2", "north-2": "N2", "east-2": "E2", "west-2": "W2",
  "south-3": "S3", "north-3": "N3",
};

/** Derive a short code like "S TP 1-1" from a wall id + plate label. */
function plateCode(wallId: string, label: string): string {
  const w  = WALL_ABBR[wallId] ?? wallId.slice(0, 2).toUpperCase();
  const lo = label.toLowerCase();
  const seg = label.match(/#(\d+)/)?.[1];  // segment suffix, e.g. #2 → "2"

  if (lo.includes("bottom plate")) {
    const side = lo.includes("(left)") ? "L" : lo.includes("(right)") ? "R" : "";
    return [w, "BP", side, seg].filter(Boolean).join(" ").replace(/ (\d)$/, "-$1");
  }
  if (lo.includes("top plate (upper)") || lo.includes("double top")) {
    return seg ? `${w} TP 2-${seg}` : `${w} TP 2`;
  }
  if (lo.includes("top plate")) {
    return seg ? `${w} TP 1-${seg}` : `${w} TP 1`;
  }
  return "";
}

/* ═══ Main function ══════════════════════════════════════════════════════ */

export function computeCutList(wall: WallElevation): CutListSummary {
  const layout = computeWallLayout(wall);

  // Collect every piece into a flat array of {label, length, category, chip}
  // qty > 1 allows hardware/bulk items to be pushed once with their full count.
  interface RawPiece { label: string; length: number; category: string; chip: string; qty?: number; code?: string; }
  const pieces: RawPiece[] = [];

  // ── Plates ──
  for (const p of layout.bottomPlates) {
    pieces.push({ label: p.label, length: snap8(p.width), category: "Plates", chip: "#010101", code: plateCode(wall.id, p.label) });
  }
  for (const p of layout.topPlates) {
    pieces.push({ label: p.label, length: snap8(p.width), category: "Plates", chip: "#010101", code: plateCode(wall.id, p.label) });
  }
  // Wall abbreviation for short codes (used across all categories)
  const w = WALL_ABBR[wall.id] ?? wall.id.slice(0, 2).toUpperCase();

  for (let si = 0; si < layout.sills.length; si++) {
    const s = layout.sills[si];
    pieces.push({ label: s.label, length: snap8(s.width), category: "Plates", chip: "#010101", code: `${w} SIL-${si}` });
  }

  // ── Studs ──
  const FULL_H = snap8(layout.wallHeightInches - 1.5 - 3.0); // plate-to-plate = H - bp - dtp
  for (const s of layout.studs) {
    const h = snap8(s.height);

    if (Math.abs(h - FULL_H) < 0.5) {
      pieces.push({ label: "2×6 Full Stud", length: h, category: "Full Studs", chip: "#fff", code: `${w} FS` });
    } else {
      pieces.push({ label: "2×6 Short Stud", length: h, category: "Short Studs", chip: "#f0f0f0", code: `${w} SS` });
    }
  }

  // ── Headers ──
  for (let hi = 0; hi < layout.headers.length; hi++) {
    const h = layout.headers[hi];
    const spec = h.headerSpec;
    const desc = spec ? spec.label : `Header ${snap8(h.width)}"`;
    pieces.push({ label: desc, length: snap8(h.width), category: "Headers", chip: "#e8e0d0", code: `${w} HDR-${hi}` });
  }

  // ── Floor System: TJI Joists, Rim Boards, Subfloor (CT-009, CT-010, CT-011) ──
  // Rendered on south and north wall elevations (bearing walls for N-S joist span).
  // Joists sit on top plate; rim boards close bays at east/west ends.
  // Joist span = E/W wall length = CMU_INTERIOR_D − 2×FR_GAP = 166".
  const JOIST_SPAN = CMU_INTERIOR_D - 2 * FR_GAP; // 166"
  if (wall.id === "south" || wall.id === "north") {
    const wallLen  = layout.totalLengthInches;
    const joistOff = SW / 2;
    const lastX    = wallLen - TJI_RIM_T - SW;
    let joistCount = 0;
    for (let x = TJI_OC + joistOff; x <= lastX; x += TJI_OC) joistCount++;

    // TJI joists — span N-S = 166"
    if (joistCount > 0) {
      pieces.push({
        label: `TJI I-Joist PRI-40 (${snap8(TJI_DEPTH)}" depth, 16" OC)`,
        length: snap8(JOIST_SPAN),
        category: "Floor System",
        chip: "#92400e",
        qty: joistCount,
        code: `${w} TJI`,
      });
    }

    // Rim boards — 2 per wall (left and right ends), height = TJI depth
    pieces.push({
      label: `Rim Board (${snap8(TJI_RIM_T)}" × ${snap8(TJI_DEPTH)}")`,
      length: snap8(TJI_DEPTH),
      category: "Floor System",
      chip: "#92400e",
      qty: 2,
      code: `${w} RIM`,
    });

    // Subfloor — 3/4" T&G OSB panels, length = wall span
    pieces.push({
      label: `3/4" T&G OSB Subfloor (${wallLen}" × ${JOIST_SPAN}" span)`,
      length: snap8(wallLen),
      category: "Floor System",
      chip: "#ca8a04",
      qty: 1,
      code: `${w} SFL`,
    });
  }

  // ── Bathroom Raised Floor (CT-012) — north wall only ──
  // Ledger cleats (2×4 on edge), 2×6 floor joists, and 3/4" OSB subfloor
  // for the raised bathroom platform. Rendered in the Bathroom layer.
  if (wall.id === "north") {
    const FLOOR2_IN = layout.wallHeightInches + TJI_DEPTH + SUBFLOOR_T;
    const PLAT_H = STAIR_LAND_RISERS * (FLOOR2_IN / STAIR_TOTAL_RISERS);
    const jBot = PLAT_H - BATH_SUBFLOOR_T - BATH_JOIST_H;

    // Bathroom zone spans from partition to wall end (in elevation x-coordinates)
    const bathL = layout.totalLengthInches - (PARTITION_WALL_R - (CMU_T + FR_GAP + FR_D));
    const bathW = layout.totalLengthInches - bathL;

    // Count joists at BATH_JOIST_OC within the bathroom zone
    let bathJoistCount = 0;
    for (let x = 0; x <= bathW - SW + 0.01; x += BATH_JOIST_OC) bathJoistCount++;
    // Add end joist if needed
    const rightEnd = bathW - SW;
    if (bathJoistCount > 0) {
      const lastPos = (bathJoistCount - 1) * BATH_JOIST_OC;
      if (rightEnd - lastPos > 0.01) bathJoistCount++;
    }

    const cleatHeight = snap8(jBot - PLATE_H);

    // Ledger cleats — one per joist position
    if (bathJoistCount > 0 && cleatHeight > 0) {
      pieces.push({
        label: `2×4 Ledger Cleat (${cleatHeight}" tall)`,
        length: cleatHeight,
        category: "Bathroom Floor",
        chip: "#059669",
        qty: bathJoistCount,
        code: "N BCLT",
      });
    }

    // 2×6 floor joists — span from north wall inner face to horizontal partition
    const bathJoistSpan = snap8((CMU_INTERIOR_D - CMU_T - FR_GAP - FR_D) - PARTITION_WALL_R);
    if (bathJoistCount > 0) {
      pieces.push({
        label: `2×6 Bath Floor Joist (${snap8(BATH_JOIST_H)}" depth, ${bathJoistSpan}" span)`,
        length: bathJoistSpan,
        category: "Bathroom Floor",
        chip: "#059669",
        qty: bathJoistCount,
        code: "N BJT",
      });
    }

    // Bath subfloor — 3/4" OSB across bathroom zone
    pieces.push({
      label: `3/4" OSB Bath Subfloor (${snap8(bathW)}" long)`,
      length: snap8(bathW),
      category: "Bathroom Floor",
      chip: "#059669",
      qty: 1,
      code: "N BSFL",
    });
  }

  // ── Stair Lumber (CT-013) — north wall only ──
  // Stringers, treads, risers, landing joists, rim header, deck, post.
  if (wall.id === "north") {
    const FLOOR2_IN = layout.wallHeightInches + TJI_DEPTH + SUBFLOOR_T;
    const riserH = FLOOR2_IN / STAIR_TOTAL_RISERS;
    const mainRisers = STAIR_TOTAL_RISERS - STAIR_LAND_RISERS;
    const mainTreads = mainRisers - 1;

    // Stringer diagonal: sqrt(totalRun² + totalRise²) + extra for seat/plumb cuts
    const mainRun  = mainTreads * STAIR_TREAD_DEPTH;
    const mainRise = mainRisers * riserH;
    const stringerDiag1F = snap8(Math.sqrt(mainRun * mainRun + mainRise * mainRise) + 12); // +12" margin for cuts

    // Landing height for post calculation
    const landH = STAIR_LAND_RISERS * riserH;
    const postHeight = snap8(landH - PLATE_H - STAIR_LAND_DECK_T - STAIR_LAND_JOIST_D);

    // 2×12 notched stringers (2 per stair run)
    pieces.push({
      label: `2×12 Notched Stringer (1F main run, ${snap8(STAIR_STRINGER_DEPTH)}" depth)`,
      length: stringerDiag1F,
      category: "Stair Lumber",
      chip: "#78350f",
      qty: 2,
      code: "N STR-1F",
    });

    // Treads — 5/4×12 tread boards (1" thick × stair width)
    pieces.push({
      label: `5/4×12 Tread Board (${snap8(STAIR_TREAD_DEPTH + STAIR_NOSING)}" deep × ${STAIR_WIDTH}" wide)`,
      length: snap8(STAIR_WIDTH),
      category: "Stair Lumber",
      chip: "#a08850",
      qty: mainTreads,
      code: "N TRD-1F",
    });

    // Risers — 1×8 riser boards
    pieces.push({
      label: `1×8 Riser Board (${snap8(STAIR_RISER_T)}" thick)`,
      length: snap8(STAIR_WIDTH),
      category: "Stair Lumber",
      chip: "#a08850",
      qty: mainRisers,
      code: "N RSR-1F",
    });

    // Approach treads + risers (landing zone)
    const approachTreads = STAIR_LAND_RISERS - 1;
    if (approachTreads > 0) {
      pieces.push({
        label: `5/4×12 Approach Tread (landing zone)`,
        length: snap8(STAIR_WIDTH),
        category: "Stair Lumber",
        chip: "#a08850",
        qty: approachTreads,
        code: "N ATRD",
      });
      pieces.push({
        label: `1×8 Approach Riser (landing zone)`,
        length: snap8(STAIR_WIDTH),
        category: "Stair Lumber",
        chip: "#a08850",
        qty: STAIR_LAND_RISERS,
        code: "N ARSR",
      });
    }

    // Landing joists — 2×10, span = stair width
    pieces.push({
      label: `2×10 Landing Joist (${snap8(STAIR_LAND_JOIST_D)}" depth)`,
      length: snap8(STAIR_WIDTH),
      category: "Stair Lumber",
      chip: "#78350f",
      qty: 2,
      code: "N LJT",
    });

    // Landing rim header — 2×10, span = stair width
    pieces.push({
      label: `2×10 Landing Rim Header`,
      length: snap8(STAIR_WIDTH),
      category: "Stair Lumber",
      chip: "#78350f",
      qty: 1,
      code: "N LRIM",
    });

    // Landing plywood deck
    const landingDepth = snap8(STAIR_LAND_RISERS * STAIR_TREAD_DEPTH);
    pieces.push({
      label: `3/4" Plywood Landing Deck (${STAIR_WIDTH}" × ${landingDepth}")`,
      length: snap8(STAIR_WIDTH),
      category: "Stair Lumber",
      chip: "#ca8a04",
      qty: 1,
      code: "N LDCK",
    });

    // 4×4 post
    if (postHeight > 0) {
      pieces.push({
        label: `4×4 Landing Post (${snap8(STAIR_LAND_POST_W)}" sq)`,
        length: snap8(postHeight),
        category: "Stair Lumber",
        chip: "#78350f",
        qty: 1,
        code: "N LPST",
      });
    }

    // Second floor stair stringers
    const main2FRisers = STAIR2_TOTAL_RISERS;
    const main2FTreads = main2FRisers - 1;
    const run2F  = main2FTreads * STAIR_TREAD_DEPTH;
    const rise2F = main2FRisers * riserH;
    const stringerDiag2F = snap8(Math.sqrt(run2F * run2F + rise2F * rise2F) + 12);

    pieces.push({
      label: `2×12 Notched Stringer (2F straight run)`,
      length: stringerDiag2F,
      category: "Stair Lumber",
      chip: "#78350f",
      qty: 2,
      code: "N STR-2F",
    });

    // 2F treads + risers
    pieces.push({
      label: `5/4×12 Tread Board (2F stair)`,
      length: snap8(STAIR_WIDTH),
      category: "Stair Lumber",
      chip: "#a08850",
      qty: main2FTreads,
      code: "N TRD-2F",
    });
    pieces.push({
      label: `1×8 Riser Board (2F stair)`,
      length: snap8(STAIR_WIDTH),
      category: "Stair Lumber",
      chip: "#a08850",
      qty: main2FRisers,
      code: "N RSR-2F",
    });
  }

  // ── Backing Studs at Partition T-Junction (CT-006) — north wall only ──
  // Two 2×6 studs side-by-side where the horizontal partition meets the north wall.
  if (wall.id === "north") {
    const backingH = snap8(layout.wallHeightInches - PLATE_H - TOP_H);
    pieces.push({
      label: "2×6 Partition Backing Stud (T-junction)",
      length: backingH,
      category: "Full Studs",
      chip: "#fff",
      code: `${w} BS`,
      qty: 2,
    });
  }

  // ── Hardware (sill sealer, joist hangers, etc.) ──

  // Sill sealer runs along the bottom of every exterior wall (plate-to-concrete interface).
  // Reported in lineal feet so the combined total across all walls = total LF to order.
  if (wall.id === "south" || wall.id === "north" || wall.id === "east" || wall.id === "west") {
    const lfNeeded = Math.ceil(layout.totalLengthInches / 12);
    pieces.push({
      label: 'Sill Sealer Foam 5-1/2" × 50\' — Pregis (161-1605)',
      length: 0,
      category: "Hardware",
      chip: "#16a34a",
      qty: lfNeeded,
      code: `${w} SEAL`,
    });
  }

  // Joists run N-S bearing on the south and north walls. Count hangers per bearing wall end.
  if (wall.id === "south" || wall.id === "north") {
    const wallLen  = layout.totalLengthInches;
    const joistOff = SW / 2;
    const lastX    = wallLen - TJI_RIM_T - SW;
    let hangerCount = 0;
    for (let x = TJI_OC + joistOff; x <= lastX; x += TJI_OC) hangerCount++;
    if (hangerCount > 0) {
      pieces.push({
        label: 'i-Joist Hanger 2-1/2" × 9-1/2" IHFL25925 — MiTek G90 Steel',
        length: 0,
        category: "Hardware",
        chip: "#8BA0B4",
        qty: hangerCount,
        code: `${w} HGR`,
      });
    }
  }

  // ── Anchor Bolts ──
  // CT-008: Wedge anchors securing bottom plate to CMU slab.
  // Only on exterior first-floor walls (upper floor walls anchor to subfloor, not slab).
  const isFirstFloorExterior = ["south", "north", "east", "west"].includes(wall.id);
  if (isFirstFloorExterior && wall.anchorBolts && wall.anchorBolts.length > 0) {
    pieces.push({
      label: '½" × 5-½" HDG Wedge Anchor — Grip-Rite (232-7897)',
      length: 0,
      category: "Hardware",
      chip: "#b45309",
      qty: wall.anchorBolts.length,
      code: `${w} AB`,
    });
  }

  // ── Joist Blocking (CT-021) ──
  // Solid blocking between TJI joists at bearing walls. Required at every joist bay
  // for lateral restraint (IRC R502.7) and TJI manufacturer warranty.
  // Blocking depth = TJI_DEPTH; cut length = joist spacing − joist flange width.
  if (wall.id === "south" || wall.id === "north") {
    const wallLen  = layout.totalLengthInches;
    const joistOff = SW / 2;
    const lastX    = wallLen - TJI_RIM_T - SW;
    let blockCount = 0;
    for (let x = TJI_OC + joistOff; x <= lastX; x += TJI_OC) blockCount++;
    // One block between each pair of adjacent joists, plus blocks at rim ends = blockCount + 1
    const totalBlocks = blockCount + 1;
    const blockLength = snap8(TJI_OC - SW); // space between joist flanges
    if (totalBlocks > 0) {
      pieces.push({
        label: `2×10 Joist Blocking (${snap8(TJI_DEPTH)}" depth)`,
        length: blockLength,
        category: "Blocking",
        chip: "#a16207",
        qty: totalBlocks,
        code: `${w} JBLK`,
      });
    }
  }

  // ── Fire Blocking (CT-022) ──
  // Required at floor/ceiling transitions in concealed stud cavities (IRC R602.8).
  // One piece per stud bay at floor line. Cut from 2×6 to fill stud bay width.
  // Applied to exterior walls at each floor transition.
  if (isFirstFloorExterior) {
    const studH = snap8(layout.wallHeightInches - PLATE_H - TOP_H);
    const studCount = layout.studs.filter(s => Math.abs(snap8(s.height) - studH) < 0.5).length;
    // Fire blocks fill between studs at floor line: count = number of bays = studs − 1
    const fireBays = Math.max(0, studCount - 1);
    if (fireBays > 0) {
      const fireBlockLen = snap8(wall.studSpacingOC - SW); // stud bay clear width
      pieces.push({
        label: "2×6 Fire Block (floor transition, IRC R602.8)",
        length: fireBlockLen,
        category: "Fire Blocking",
        chip: "#dc2626",
        qty: fireBays,
        code: `${w} FBLK`,
      });
    }
  }

  // ── Stairwell Floor Opening Framing (CT-020) ──
  // When stairs pass through the floor above, the TJI joist system has a rectangular
  // opening that must be framed with doubled trimmer joists and doubled headers.
  // This applies to south and north walls (bearing walls for N-S joists).
  // First floor stair (north wall): opening width = STAIR_WIDTH, length = main treads × tread depth.
  // Second floor stair uses STAIR2 constants.
  if (wall.id === "north") {
    // First floor stairwell opening (1→2 transition)
    const openingLength1F = STAIR_MAIN_STEPS * STAIR_TREAD_DEPTH; // horizontal run
    const openingWidth1F  = STAIR_WIDTH;
    // Joists interrupted within the opening width at 16" OC
    const tailJoists1F = Math.max(0, Math.floor(openingWidth1F / TJI_OC));

    // Doubled trimmer joists: 2 on each side of opening = 4 TJI, full N-S span
    pieces.push({
      label: `TJI Doubled Trimmer Joist (1F stairwell, full span)`,
      length: snap8(JOIST_SPAN),
      category: "Stairwell Framing",
      chip: "#7c3aed",
      qty: 4,
      code: "N STRIM-1F",
    });
    // Doubled headers: 2 headers (north end + south end of opening)
    // Each header spans between trimmers = opening width
    pieces.push({
      label: `Stairwell Header (1F, ${snap8(openingWidth1F)}" span — engineer to size)`,
      length: snap8(openingWidth1F),
      category: "Stairwell Framing",
      chip: "#7c3aed",
      qty: 4,
      code: "N SHDR-1F",
    });
    // Tail joists: shortened joists north and south of the opening
    // North tails: from north wall bearing to north header
    // South tails: from south header to south wall bearing
    // Approximate: (full span − opening length) / 2 per side
    const tailLen1F = snap8((JOIST_SPAN - openingLength1F) / 2);
    if (tailJoists1F > 0) {
      pieces.push({
        label: `TJI Tail Joist (1F stairwell, ~${tailLen1F}" each)`,
        length: tailLen1F,
        category: "Stairwell Framing",
        chip: "#7c3aed",
        qty: tailJoists1F * 2,
        code: "N STAIL-1F",
      });
    }
    // Joist hangers for tail-to-header and header-to-trimmer connections
    const hangerCount1F = (tailJoists1F * 2) + 4;
    pieces.push({
      label: `i-Joist Hanger IHFL25925 (1F stairwell, ${hangerCount1F} connections)`,
      length: snap8(TJI_DEPTH),
      category: "Stairwell Framing",
      chip: "#8BA0B4",
      qty: hangerCount1F,
      code: "N SHGR-1F",
    });

    // Second floor stairwell opening (2→3 transition)
    const mainRisers2F = STAIR2_TOTAL_RISERS;
    const mainTreads2F = mainRisers2F - 1; // straight run, no landing
    const openingLength2F = mainTreads2F * STAIR_TREAD_DEPTH;
    const tailJoists2F = Math.max(0, Math.floor(STAIR_WIDTH / TJI_OC));

    pieces.push({
      label: `TJI Doubled Trimmer Joist (2F stairwell, full span)`,
      length: snap8(JOIST_SPAN),
      category: "Stairwell Framing",
      chip: "#7c3aed",
      qty: 4,
      code: "N STRIM-2F",
    });
    pieces.push({
      label: `Stairwell Header (2F, ${snap8(STAIR_WIDTH)}" span — engineer to size)`,
      length: snap8(STAIR_WIDTH),
      category: "Stairwell Framing",
      chip: "#7c3aed",
      qty: 4,
      code: "N SHDR-2F",
    });
    const tailLen2F = snap8((JOIST_SPAN - openingLength2F) / 2);
    if (tailJoists2F > 0) {
      pieces.push({
        label: `TJI Tail Joist (2F stairwell, ~${tailLen2F}" each)`,
        length: tailLen2F,
        category: "Stairwell Framing",
        chip: "#7c3aed",
        qty: tailJoists2F * 2,
        code: "N STAIL-2F",
      });
    }
    const hangerCount2F = (tailJoists2F * 2) + 4;
    pieces.push({
      label: `i-Joist Hanger IHFL25925 (2F stairwell, ${hangerCount2F} connections)`,
      length: snap8(TJI_DEPTH),
      category: "Stairwell Framing",
      chip: "#8BA0B4",
      qty: hangerCount2F,
      code: "N SHGR-2F",
    });
  }

  // ── Corner Framing (CT-019) ──
  // At each end of a wall, the corner needs additional studs for drywall backing
  // and load transfer. Two extra studs per corner (beyond the end king already counted).
  // Only on first-floor exterior walls (upper floors would add their own).
  if (isFirstFloorExterior) {
    const cornerStudH = snap8(layout.wallHeightInches - PLATE_H - TOP_H);
    pieces.push({
      label: "2×6 Corner Backing Stud",
      length: cornerStudH,
      category: "Corner Framing",
      chip: "#0d9488",
      qty: 4,
      code: `${w} CNR`,
    });
  }

  // ── Roof Assembly ──
  // Full roof material quantities shown on south wall (first bearing wall in display order).
  // Roof area = CMU exterior footprint. Hybrid insulation: batts in joist bays + rigid on top.
  if (wall.id === "south") {
    const roofAreaSqIn = ROOF_EXT_W * ROOF_EXT_D;       // 304 × 184 = 55,936 sq in
    const roofAreaSqFt = Math.ceil(roofAreaSqIn / 144);  // ~389 sq ft
    const perimeterIn  = 2 * (ROOF_EXT_W + ROOF_EXT_D); // 976"
    const perimeterLF  = Math.ceil(perimeterIn / 12);    // ~82 LF
    const isoSheetSqFt = 32; // 4×8 sheet = 32 SF

    // ── Between-joist insulation: R-38 mineral wool batts ──
    // Chip color matches elevation stroke: #eab308 (yellow)
    const battSqFtCoverage = (15 * 48) / 144; // 5 SF per batt piece
    const battCount = Math.ceil(roofAreaSqFt / battSqFtCoverage * 1.10);
    pieces.push({
      label: `R-${ROOF_BATT_R} Mineral Wool Batt (9.5" thick, 15" wide for 16" OC bays)`,
      length: snap8(48),
      category: "Roof Assembly",
      chip: "#eab308",
      qty: battCount,
      code: "RF BATT",
    });

    // ── Vapor retarder ──
    pieces.push({
      label: `6-mil Poly Vapor Retarder (${roofAreaSqFt} SF)`,
      length: 0,
      category: "Roof Assembly",
      chip: "#a78bfa",
      qty: roofAreaSqFt,
      code: "RF VPR",
    });

    // ── Continuous rigid polyiso ──
    const rValue = snap8(ROOF_POLYISO_T * ROOF_POLYISO_R);
    const isoSheets = Math.ceil(roofAreaSqFt / isoSheetSqFt * 1.05);
    pieces.push({
      label: `2" Polyiso Rigid Insulation 4×8 (R-${rValue}, continuous over joist flanges)`,
      length: snap8(96),
      category: "Roof Assembly",
      chip: "#6366f1",
      qty: isoSheets,
      code: "RF ISO",
    });

    // ── Tapered polyiso ──
    const taperSheets = Math.ceil(roofAreaSqFt / isoSheetSqFt * 1.10);
    pieces.push({
      label: `Tapered Polyiso (1/4"/ft slope to scuppers)`,
      length: snap8(96),
      category: "Roof Assembly",
      chip: "#818cf8",
      qty: taperSheets,
      code: "RF TPR",
    });

    // ── Cover board ──
    const coverSheets = Math.ceil(roofAreaSqFt / isoSheetSqFt * 1.05);
    pieces.push({
      label: `High-Density Cover Board (${snap8(ROOF_COVERBOARD_T)}" thick, 4×8 sheets)`,
      length: snap8(96),
      category: "Roof Assembly",
      chip: "#4338ca",
      qty: coverSheets,
      code: "RF CVR",
    });

    // Total R-value note
    pieces.push({
      label: `── Combined R-value: R-${ROOF_TOTAL_R} (R-${ROOF_BATT_R} batts + R-${rValue} polyiso) ──`,
      length: 0,
      category: "Roof Assembly",
      chip: "#6366f1",
      qty: 1,
      code: "RF R-VAL",
    });

    // EPDM membrane
    const epdmSqFt = Math.ceil(roofAreaSqFt * 1.15);
    pieces.push({
      label: `60-mil EPDM Membrane — Fully Adhered (${epdmSqFt} SF)`,
      length: 0,
      category: "Roof Assembly",
      chip: "#1e1b4b",
      qty: epdmSqFt,
      code: "RF EPDM",
    });

    // EPDM bonding adhesive
    const adhesiveGal = Math.ceil(roofAreaSqFt / 60 * 2);
    pieces.push({
      label: `EPDM Bonding Adhesive (${adhesiveGal} gal)`,
      length: 0,
      category: "Roof Assembly",
      chip: "#1e1b4b",
      qty: adhesiveGal,
      code: "RF ADH",
    });

    // Seam tape
    const seamTapeLF = Math.ceil(epdmSqFt / 10);
    pieces.push({
      label: `3" EPDM Seam Tape (${seamTapeLF} LF)`,
      length: 0,
      category: "Roof Assembly",
      chip: "#1e1b4b",
      qty: seamTapeLF,
      code: "RF TAPE",
    });

    // Parapet flashing
    const flashingLF = perimeterLF;
    pieces.push({
      label: `EPDM Parapet Flashing (${ROOF_FLASHING_LAP}" lap, ${flashingLF} LF perimeter)`,
      length: snap8(ROOF_FLASHING_LAP),
      category: "Roof Assembly",
      chip: "#1e1b4b",
      qty: flashingLF,
      code: "RF FLSH",
    });

    // Termination bar
    const termBarCount = Math.ceil(perimeterLF / 10);
    pieces.push({
      label: `Aluminum Termination Bar (10' lengths)`,
      length: snap8(120),
      category: "Roof Assembly",
      chip: "#8BA0B4",
      qty: termBarCount,
      code: "RF TBAR",
    });

    // Metal coping cap
    pieces.push({
      label: `Aluminum Coping Cap (${snap8(ROOF_COPING_W)}" wide, ${perimeterLF} LF)`,
      length: 0,
      category: "Roof Assembly",
      chip: "#8BA0B4",
      qty: perimeterLF,
      code: "RF COP",
    });

    // Scuppers — through-wall drainage, 2 primary + 2 overflow
    pieces.push({
      label: `Through-Wall Scupper (8"×4" galv., primary)`,
      length: snap8(CMU_T),
      category: "Roof Assembly",
      chip: "#0284c7",
      qty: ROOF_SCUPPER_COUNT,
      code: "RF SCUP",
    });
    pieces.push({
      label: `Through-Wall Scupper (8"×4" galv., overflow — 2" higher)`,
      length: snap8(CMU_T),
      category: "Roof Assembly",
      chip: "#0284c7",
      qty: ROOF_SCUPPER_COUNT,
      code: "RF SCOV",
    });

    // Downspouts
    pieces.push({
      label: `3"×4" Aluminum Downspout (exterior, per scupper)`,
      length: 0,
      category: "Roof Assembly",
      chip: "#0284c7",
      qty: ROOF_SCUPPER_COUNT * 2,
      code: "RF DNSP",
    });

    // Heat cable
    pieces.push({
      label: `Self-Regulating Heat Cable (at scuppers, ~6' per opening)`,
      length: snap8(72),
      category: "Roof Assembly",
      chip: "#dc2626",
      qty: ROOF_SCUPPER_COUNT * 2,
      code: "RF HTCB",
    });
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
      existing.qty += p.qty ?? 1;
    } else {
      map.set(k, { piece: p, qty: p.qty ?? 1 });
    }
  }

  // ── Build sorted cut lines ──
  const catOrder: Record<string, number> = {
    "Plates": 0, "Full Studs": 1, "Short Studs": 2, "Headers": 3,
    "Corner Framing": 4, "Floor System": 5, "Bathroom Floor": 6,
    "Stair Lumber": 7, "Blocking": 8, "Fire Blocking": 9,
    "Stairwell Framing": 10, "Roof Assembly": 11, "Openings": 12, "Hardware": 13,
  };
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
      code: piece.code,
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
