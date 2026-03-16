export type WallId = "north" | "south" | "east" | "west";

export interface Opening {
  type: "window" | "door";
  widthInches: number;
  heightInches: number;
  sillHeightInches?: number; // from bottom of wall to bottom of opening
  positionFromLeftInches: number; // left edge of opening from left end of wall
  label?: string;
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
}

export const PX_PER_INCH = 4;
