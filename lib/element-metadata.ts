/**
 * Returns HOUSE.md–style metadata for an element by parsing its ID.
 * Used by the elevation tooltip to show "Connected to" and "Controls" without a lookup table.
 */

import { initialWalls, horizPartition, vertPartition } from "./framing-data";
import type { WallElevation } from "./types";

export interface ElementMetadata {
  connectedTo: string;
  controls: string;
}

const WALL_PREFIX = /^(north|south|east|west|horiz-partition|vert-partition)-/;

function wallForId(wallId: string): WallElevation | null {
  if (wallId === "horiz-partition") return horizPartition;
  if (wallId === "vert-partition") return vertPartition;
  return (initialWalls as Record<string, WallElevation>)[wallId] ?? null;
}

function wallConstant(wallId: string): string {
  if (wallId === "horiz-partition" || wallId === "vert-partition") {
    return `${wallId} (framing-data)`;
  }
  return `initialWalls.${wallId}`;
}

/**
 * Pattern-based metadata for elevation element IDs.
 * Returns null if the ID is not recognized (e.g. CMU blocks have no ID).
 */
export function getElementMetadata(id: string): ElementMetadata | null {
  if (!id || typeof id !== "string") return null;
  const wallMatch = id.match(WALL_PREFIX);
  const wallId = wallMatch ? wallMatch[1] : null;

  // North-only / specific IDs (most specific first)
  if (id === "north-bath-subfloor") {
    return {
      connectedTo: "2×6 joists (face nail)",
      controls: "BATH_SUBFLOOR_T, PARTITION_WALL_R, totalLengthInches",
    };
  }
  if (id === "north-partition-vert") {
    return {
      connectedTo: "north wall (end nail), backing studs (face nail)",
      controls: "PARTITION_WALL_R, INT_D; planPosToElevationX('north', …)",
    };
  }
  if (id === "north-backing-1" || id === "north-backing-2") {
    return {
      connectedTo: "bottom plate (toe nail), top plate (end nail), partition (face nail)",
      controls: "PARTITION_WALL_R, SW",
    };
  }
  if (/^north-bath-cleat-\d+$/.test(id)) {
    return {
      connectedTo: "bottom plate (toe nail), joists bear on cleat",
      controls: "BATH_JOIST_OC, PARTITION_WALL_R, jBot from STAIR_*, BATH_*",
    };
  }
  if (/^north-bath-joist-\d+$/.test(id)) {
    return {
      connectedTo: "ledger cleat (bears on), subfloor (face nail)",
      controls: "BATH_JOIST_H, BATH_JOIST_OC, PARTITION_WALL_R",
    };
  }
  if (id === "north-counter") {
    return {
      connectedTo: "partition / wall (support)",
      controls: "PARTITION_WALL_R, INT_D, FW_IN, COUNTER_H",
    };
  }
  if (id === "north-landing") {
    return {
      connectedTo: "north wall (bearing), main stair (bearing)",
      controls: "STAIR_LAND_RISERS, north opening position/width, FLOOR2_IN",
    };
  }
  if (id === "north-main-stair") {
    return {
      connectedTo: "landing (bearing), stringer",
      controls: "STAIR_TREAD_DEPTH, MAIN_TREADS, MAIN_RISERS",
    };
  }
  if (id === "north-stringer") {
    return {
      connectedTo: "floor (bearing), main stair",
      controls: "STAIR_TREAD_DEPTH, MAIN_TREADS, MAIN_RISERS (same as main-stair)",
    };
  }

  // Wall-prefixed patterns (wallId required)
  if (!wallId) return null;

  if (id.endsWith("-rim-left") || id.endsWith("-rim-right")) {
    return {
      connectedTo: "top plate (bearing), TJI joists (end bearing)",
      controls: "TJI_RIM_T, TJI_DEPTH, wallHeightInches",
    };
  }
  if (id.endsWith("-subfloor")) {
    return {
      connectedTo: "TJI flanges (face nail)",
      controls: "SUBFLOOR_T, totalLengthInches",
    };
  }
  if (/^[a-z-]+-tji-\d+$/.test(id)) {
    return {
      connectedTo: "rim boards, top plate (bearing), subfloor (face nail)",
      controls: "TJI_OC, TJI_RIM_T, totalLengthInches",
    };
  }
  if (/^[a-z-]+-bp-\d+$/.test(id)) {
    return {
      connectedTo: "slab (anchor bolt), studs (toe nail)",
      controls: `${wallConstant(wallId)}.totalLengthInches, openings (if door at floor)`,
    };
  }
  if (/^[a-z-]+-tp-/.test(id)) {
    return {
      connectedTo: "studs (end nail)",
      controls: "totalLengthInches, MAX_PLATE_LENGTH_IN (splice), studSpacingOC (upper stagger)",
    };
  }
  if (/^[a-z-]+-stud-\d+$/.test(id)) {
    const base = wallId && (wallId === "horiz-partition" || wallId === "vert-partition")
      ? `${wallConstant(wallId)}.studSpacingOC, openings, wallHeightInches`
      : `${wallConstant(wallId)}.studSpacingOC, openings, wallHeightInches, studOverrides`;
    return {
      connectedTo: "bottom plate (toe nail), top plate (end nail); kings/jacks also to header (face nail)",
      controls: base,
    };
  }
  if (/^[a-z-]+-hdr-\d+$/.test(id)) {
    const hdrMatch = id.match(/^([a-z-]+)-hdr-(\d+)$/);
    const hdrIdx = hdrMatch ? parseInt(hdrMatch[2], 10) : -1;
    const wall = wallId ? wallForId(wallId) : null;
    const spec = wall?.openings[hdrIdx]?.headerSpec;
    const specStr = spec
      ? `${spec.label}${spec.note ? ` — ${spec.note}` : ""}`
      : "HEADER_D = 5.5 (layout-calculator default)";
    return {
      connectedTo: "king/jack studs (face nail), cripples above (end nail)",
      controls: specStr,
    };
  }
  if (/^[a-z-]+-sill-\d+$/.test(id)) {
    return {
      connectedTo: "jack studs (face nail), cripples below (end nail)",
      controls: "opening position/width, sillHeightInches, SW",
    };
  }
  if (/^[a-z-]+-open-\d+$/.test(id)) {
    return {
      connectedTo: "N/A (void)",
      controls: `${wallConstant(wallId)}.openings[n] (positionFromLeftInches, widthInches, heightInches, sillHeightInches)`,
    };
  }

  return null;
}
