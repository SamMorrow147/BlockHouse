import type { WallElevation } from "./types";

/**
 * Wall dimensions based on CMU shell with wood frame built 1" off the interior CMU face.
 * CMU block module: 16" nominal (incl. mortar).
 *
 * CMU exterior: 304" E-W (19 blocks) × 184" N-S (11.5 blocks)
 * CMU interior: 288" E-W × 168" N-S
 *
 * Corner framing convention (1" standoff on all wall faces from CMU):
 *   E/W walls: 166" = 168" CMU depth − 2 × 1" gap  (plate ends meet N/S outer faces)
 *   N/S walls: 275" = 288" CMU width  − 2 × (1" gap + 5.5" frame depth)  (butt into E/W inner faces)
 *
 * North = South length ✓   East = West length ✓
 */
export const initialWalls: Record<string, WallElevation> = {
  north: {
    id: "north",
    name: "North Wall",
    totalLengthInches: 275,
    wallHeightInches: 96,
    studSpacingOC: 16,
    sections: [
      { lengthInches: 128, label: "128\" / 8 bays" },
      { lengthInches: 39,  label: "39\" door RO" },
      { lengthInches: 108, label: "108\" / right section" },
    ],
    openings: [
      {
        type: "door",
        widthInches: 39,
        heightInches: 80,
        positionFromLeftInches: 128,
        label: "3'-3\" × 6'-8\"",
      },
    ],
  },

  south: {
    id: "south",
    name: "South Wall",
    totalLengthInches: 275,
    wallHeightInches: 96,
    studSpacingOC: 16,
    sections: [
      { lengthInches: 139, label: "139\"" },
      { lengthInches: 40,  label: "40\" window RO (2.5 blocks)" },
      { lengthInches: 96,  label: "96\" / 6 bays" },
    ],
    openings: [
      {
        type: "window",
        widthInches: 40,
        heightInches: 48,
        sillHeightInches: 36,
        positionFromLeftInches: 139,
        label: "3'-4\" × 4'",
      },
    ],
  },

  east: {
    id: "east",
    name: "East Wall",
    totalLengthInches: 166,
    wallHeightInches: 96,
    studSpacingOC: 16,
    sections: [
      { lengthInches: 40, label: "40\" / 2.5 bays" },
      { lengthInches: 79, label: "79\" sliding door RO" },
      { lengthInches: 47, label: "47\" / right section" },
    ],
    openings: [
      {
        type: "door",
        widthInches: 79,
        heightInches: 80,
        positionFromLeftInches: 40,
        label: "6'7\" × 6'-8\"",
      },
    ],
  },

  west: {
    id: "west",
    name: "West Wall",
    totalLengthInches: 166,
    wallHeightInches: 96,
    studSpacingOC: 16,
    sections: [
      { lengthInches: 72, label: "72\" / 4.5 bays" },
      { lengthInches: 72, label: "72\" window RO" },
      { lengthInches: 22, label: "22\" / right section" },
    ],
    openings: [
      {
        type: "window",
        widthInches: 72,
        heightInches: 48,
        sillHeightInches: 36,
        positionFromLeftInches: 72,
        label: "6' × 4'",
      },
    ],
  },
};
