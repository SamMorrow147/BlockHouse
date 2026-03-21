import type { StairConfig, StairLayout, StairRect, StringerNotch, StringerProfile } from "./types";

export function computeStairLayout(config: StairConfig): StairLayout {
  const {
    totalRisers, treadDepth, landRisers, floor2Height,
    stairStartX, stringerDepth, stringerFace,
    treadThickness, riserThickness, nosing,
    landJoistDepth, plateH,
  } = config;

  // ── Core geometry ──────────────────────────────────────────────────────────
  const riserHeight   = floor2Height / totalRisers;
  const landingHeight = landRisers * riserHeight;
  const mainRisers    = totalRisers - landRisers;
  const mainTreads    = mainRisers - 1;
  const totalRun      = mainTreads * treadDepth;
  const totalRise     = mainRisers * riserHeight;
  const stairEndX     = stairStartX - totalRun;
  const stringerLen   = Math.sqrt(totalRun * totalRun + totalRise * totalRise);
  const angleRad      = Math.atan2(totalRise, totalRun);
  const angleDeg      = angleRad * 180 / Math.PI;

  // ── Stringer — structured notch data ─────────────────────────────────────
  //
  // Each notch is individually addressable:
  //   stringer.notches[5].run   → tread depth of notch 5
  //   stringer.notches[5].rise  → riser height of notch 5
  //   stringer.notches[5].riserX → X position of notch 5's riser face
  //
  // The polygon is derived from notches, not the other way around.
  //
  const notches: StringerNotch[] = [];
  for (let i = 0; i < mainTreads; i++) {
    const riserX      = stairStartX - i * treadDepth;
    const riserBottomY = landingHeight + i * riserHeight;
    const treadY      = riserBottomY + riserHeight;
    const treadLeftX  = riserX - treadDepth;
    notches.push({
      index: i,
      riserX,
      riserBottomY,
      treadY,
      treadLeftX,
      run: treadDepth,
      rise: riserHeight,
    });
  }

  // Top edge: step-notch profile (riser up, then tread across)
  // Point order matches the original polygon exactly (including the
  // harmless duplicate at i=0 where riserBottomY === landingHeight).
  const topEdge: [number, number][] = [];
  topEdge.push([stairStartX, landingHeight]);
  for (const n of notches) {
    topEdge.push([n.riserX, n.riserBottomY]);
    topEdge.push([n.riserX, n.treadY]);
    topEdge.push([n.treadLeftX, n.treadY]);
  }
  topEdge.push([stairEndX, landingHeight + mainRisers * riserHeight]);

  // Bottom edge — perpendicular offset by stringerDepth, then trimmed
  // with proper seat cut (horizontal, at bearing surface) and plumb cut
  // (vertical, at rim/header) so the stringer doesn't extend past the stair.
  const hyp       = Math.sqrt(treadDepth ** 2 + riserHeight ** 2);
  const perpX     = (riserHeight / hyp) * stringerDepth;
  const perpY     = (treadDepth  / hyp) * stringerDepth;

  // Raw perpendicular-offset bottom edge (before trimming)
  // The offset moves LEFT (−X) and DOWN (−Y) from the notch hypotenuse,
  // placing the bottom edge on the soffit side of the stringer.
  const botRightX = stairStartX - perpX;
  const botRightY = landingHeight - perpY;
  const botLeftX  = stairEndX   - perpX;
  const botLeftY  = (landingHeight + mainRisers * riserHeight) - perpY;

  // Plumb cut at top: vertical cut at x = stairEndX
  // (where the bottom edge line crosses x = stairEndX)
  const tPlumb    = (stairEndX - botRightX) / (botLeftX - botRightX);
  const plumbCutY = botRightY + tPlumb * (botLeftY - botRightY);

  // Seat cut at bottom: horizontal cut at y = landingHeight
  // (where the bottom edge line crosses y = landingHeight)
  const tSeat     = (landingHeight - botRightY) / (botLeftY - botRightY);
  const seatCutX  = botRightX + tSeat * (botLeftX - botRightX);

  const bottomEdge: [number, number][] = [
    [stairEndX, plumbCutY],       // plumb cut (top end)
    [seatCutX, landingHeight],    // seat cut (bottom end, at bearing surface)
  ];

  // Combined polygon: topEdge → plumb cut → bottom diagonal → seat cut
  // Plumb cut is a vertical face at stairEndX (the last riser line).
  // Bottom diagonal is the straight bottom edge of the 2×12 board.
  // Seat cut is a horizontal bearing surface back to stairStartX.
  const allPoints: [number, number][] = [
    ...topEdge,
    [stairEndX, plumbCutY],         // plumb cut (vertical drop at last riser)
    [seatCutX, landingHeight],      // bottom diagonal meets landing level
    [stairStartX, landingHeight],   // seat cut (horizontal bearing surface)
  ];

  // Throat depth: perpendicular distance from notch inner corner to bottom edge
  const throatDepth = stringerDepth - (treadDepth * riserHeight / hyp);

  // Legacy string format (backwards compatible)
  const stringerPoints = allPoints.map(([x, y]) => `${x},${y}`).join(" ");

  const stringer: StringerProfile = {
    notches,
    topEdge,
    bottomEdge,
    allPoints,
    depth: stringerDepth,
    throatDepth,
  };

  // ── Treads ─────────────────────────────────────────────────────────────────
  const treads: StairRect[] = [];
  for (let i = 0; i < mainTreads; i++) {
    const treadRightX = stairStartX - i * treadDepth;
    const treadTopY   = landingHeight + (i + 1) * riserHeight;
    treads.push({
      id: `tread-${i}`,
      label: `Tread ${i + 1} — ${(treadDepth + nosing).toFixed(1)}" wide`,
      x: treadRightX - treadDepth - nosing,
      y: treadTopY - treadThickness,
      width: treadDepth + nosing,
      height: treadThickness,
    });
  }

  // ── Risers ─────────────────────────────────────────────────────────────────
  const risers: StairRect[] = [];
  for (let i = 0; i <= mainTreads; i++) {
    const riserX       = stairStartX - i * treadDepth - riserThickness;
    const riserBottomY = landingHeight + i * riserHeight;
    const riserH       = riserHeight - (i < mainTreads ? treadThickness : 0);
    risers.push({
      id: `riser-${i}`,
      label: `Riser ${i + 1} — ${riserH.toFixed(2)}" tall`,
      x: riserX,
      y: riserBottomY,
      width: riserThickness,
      height: riserH,
    });
  }

  // ── Landing (only when landRisers > 0) ─────────────────────────────────────
  let landing: StairRect | null = null;
  const landingRisers: StairRect[] = [];
  if (landRisers > 0) {
    landing = {
      id: "landing",
      label: `Landing — ${landingHeight.toFixed(1)}" high`,
      x: stairStartX,
      y: 0,
      width: 40,
      height: landingHeight,
    };
    for (let i = 0; i < landRisers; i++) {
      landingRisers.push({
        id: `landing-riser-${i}`,
        label: `Landing Riser ${i + 1}`,
        x: stairStartX,
        y: i * riserHeight,
        width: riserThickness,
        height: riserHeight - treadThickness,
      });
    }
  }

  // ── Kick plate (bottom bearing) ────────────────────────────────────────────
  const kickPlate: StairRect = {
    id: "kick-plate",
    label: "2×4 Kick Plate",
    x: stairEndX,
    y: landingHeight + totalRise - plateH,
    width: stringerFace,
    height: plateH,
  };

  // ── Top ledger (bearing at upper floor) ────────────────────────────────────
  const topLedger: StairRect = {
    id: "top-ledger",
    label: "2×10 Top Ledger",
    x: stairEndX - stringerFace,
    y: floor2Height - landJoistDepth,
    width: stringerFace,
    height: landJoistDepth,
  };

  // ── Soffit (quad under stair run — degenerates to triangle when no landing)
  const soffit = {
    x1: stairStartX, y1: 0,
    x2: stairStartX, y2: landingHeight,
    x3: stairEndX,   y3: floor2Height,
    x4: stairEndX,   y4: 0,
  };

  return {
    riserHeight, landingHeight, totalRun, totalRise,
    stairEndX, mainRisers, mainTreads,
    stringerLength: stringerLen, angleDeg,
    stringerPoints, stringer, treads, risers,
    landing, landingRisers,
    kickPlate, topLedger, soffit,
  };
}

// ── Approach stringer (landing → floor) ─────────────────────────────────────
//
// Used in InteriorPartitionDetails for the approach steps going DOWN from the
// landing to the main floor. This is a simpler stringer with a flat bottom
// at y=0 (no perpendicular offset).
//
// Usage:
//   const approach = computeApproachStringer({ ... });
//   approach.notches[0]  → first step down from landing
//   approach.allPoints   → ready for SVG <polygon>
//
export function computeApproachStringer(config: {
  landingWidth: number;    // stair width (= landing width along wall)
  treadDepth: number;      // run per step
  riserHeight: number;     // rise per step
  landRisers: number;      // total risers in landing zone (approach treads = landRisers - 1)
}): { notches: StringerNotch[]; allPoints: [number, number][] } {
  const { landingWidth, treadDepth, riserHeight, landRisers } = config;
  const landingTop     = landRisers * riserHeight;
  const approachTreads = landRisers - 1;

  // Build structured notch data (stepping down from landing)
  const notches: StringerNotch[] = [];
  for (let i = 0; i < approachTreads; i++) {
    const riserX      = landingWidth + i * treadDepth;
    const treadY      = landingTop - (i + 1) * riserHeight;
    notches.push({
      index: i,
      riserX,
      riserBottomY: treadY,
      treadY: landingTop - i * riserHeight,        // top of this notch = previous level
      treadLeftX: riserX,
      run: treadDepth,
      rise: riserHeight,
    });
  }

  // Polygon points — notched top edge with flat bottom at y=0
  const allPoints: [number, number][] = [];

  // Start at top-left: first tread level
  allPoints.push([landingWidth, landingTop - riserHeight]);

  for (let i = 0; i < approachTreads; i++) {
    const treadRight = landingWidth + (i + 1) * treadDepth;
    const treadLevel = landingTop - (i + 1) * riserHeight;

    // End of this tread (horizontal)
    allPoints.push([treadRight, treadLevel]);

    if (i < approachTreads - 1) {
      // Riser down to next tread level
      allPoints.push([treadRight, landingTop - (i + 2) * riserHeight]);
    } else {
      // Last riser goes to floor (y=0)
      allPoints.push([treadRight, 0]);
    }
  }

  // Flat bottom back to start
  allPoints.push([landingWidth, 0]);

  return { notches, allPoints };
}
