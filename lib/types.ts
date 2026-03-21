export type WallId = "north" | "south" | "east" | "west" | "north-2" | "north-3" | "south-2" | "south-3" | "east-2" | "west-2" | "horiz-partition" | "vert-partition" | "bathroom-east";

export interface HeaderSpec {
  depth: number;   // actual lumber depth in inches
  plies: number;   // number of members
  label: string;   // human readable e.g. "(3) 2×8 w/ OSB spacer"
  note?: string;   // engineer flag if needed
  /** Flat 2× plate under the header (spans RO between jack studs) */
  subPlate?: {
    depth: number;   // plate thickness (e.g. 1.5" for a 2× laid flat)
    label: string;   // e.g. "2×6 flat plate under header"
  };
}

export interface Opening {
  type: "window" | "door" | "cmu-only";
  widthInches: number;
  heightInches: number;
  sillHeightInches?: number; // from bottom of wall to bottom of opening
  positionFromLeftInches: number; // left edge of opening from left end of wall
  label?: string;
  openingSubtype?: string; // e.g. "Sliding Door", "Picture Window", "Casement Window"
  headerSpec?: HeaderSpec;
  jackCount?: number; // number of jack studs each side, default 1
}

/** A continuous section of wall (e.g. left of opening, under opening, right of opening) */
export interface Section {
  lengthInches: number;
  label?: string;
}

export interface WallElevation {
  id: WallId;
  name: string;
  totalLengthInches: number;
  wallHeightInches: number;
  studSpacingOC: number;
  /** Sections left-to-right: e.g. [left, underOpening, right] or [left, right] */
  sections: Section[];
  openings: Opening[];
  /** Per-stud position tweaks keyed by generated stud ID (e.g. "south-stud-17") */
  studOverrides?: Record<string, { dx?: number; dy?: number }>;
  anchorBolts?: number[]; // x positions in inches along bottom plate
}

export const PX_PER_INCH = 4;

// ═══ STAIR TYPES ═════════════════════════════════════════════════════════════

export interface Rect {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface StairConfig {
  totalRisers: number;
  treadDepth: number;
  landRisers: number;
  stairWidth: number;
  floor2Height: number;
  stairStartX: number;
  wallHeightInches: number;
  stringerDepth: number;
  stringerFace: number;
  treadThickness: number;
  riserThickness: number;
  nosing: number;
  landJoistDepth: number;
  landJoistFace: number;
  landRimW: number;
  landDeckT: number;
  landPostW: number;
  plateH: number;
}

export interface StairRect {
  id: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  angle?: number;
  pivotX?: number;
  pivotY?: number;
}

// ═══ STRINGER STRUCTURED DATA ════════════════════════════════════════════════
// These types make each stringer notch individually addressable so an AI agent
// (or a human) can edit a single notch without reverse-engineering a polygon.

/** A single notch cut into a stair stringer */
export interface StringerNotch {
  /** Notch index (0 = first notch at stairStartX) */
  index: number;
  /** X of the riser face (right edge of this notch) */
  riserX: number;
  /** Y of the bottom of the riser (below the tread surface) */
  riserBottomY: number;
  /** Y of the tread surface (top of the notch) */
  treadY: number;
  /** X of the left end of the tread */
  treadLeftX: number;
  /** Tread run in inches */
  run: number;
  /** Riser height in inches */
  rise: number;
}

/** Structured stringer profile — all geometry addressable by field */
export interface StringerProfile {
  /** Ordered notch data, one per step (bottom to top) */
  notches: StringerNotch[];
  /** Top edge polygon points (notched profile), as [x, y] tuples */
  topEdge: [number, number][];
  /** Bottom edge points (smooth underside), as [x, y] tuples */
  bottomEdge: [number, number][];
  /** All polygon points combined (topEdge + bottomEdge), ready for SVG */
  allPoints: [number, number][];
  /** Stringer board depth in inches (e.g. 11.25 for 2×12) */
  depth: number;
  /** Throat depth in inches (min remaining wood above notch; IRC min 3.5") */
  throatDepth: number;
}

export interface StairLayout {
  riserHeight: number;
  landingHeight: number;
  totalRun: number;
  totalRise: number;
  stairEndX: number;
  mainRisers: number;
  mainTreads: number;
  stringerLength: number;
  angleDeg: number;

  /** @deprecated Use stringer.allPoints instead — kept for backwards compat */
  stringerPoints: string;
  /** Structured stringer profile with individually editable notches */
  stringer: StringerProfile;
  treads: StairRect[];
  risers: StairRect[];
  landing: StairRect | null;
  landingRisers: StairRect[];
  kickPlate: StairRect;
  topLedger: StairRect;
  soffit: {
    x1: number; y1: number;
    x2: number; y2: number;
    x3: number; y3: number;
    x4: number; y4: number;
  };
}
