"use client";

import type { WallElevation } from "@/lib/types";

function formatInches(n: number): string {
  const ft = Math.floor(n / 12);
  const ins = Math.round((n % 12) * 4) / 4;
  if (ft === 0) return `${ins}"`;
  if (ins === 0) return `${ft}'`;
  return `${ft}'-${ins}"`;
}

export function AssessmentPanel({
  north,
  south,
  east,
  west,
}: {
  north: WallElevation;
  south: WallElevation;
  east: WallElevation;
  west: WallElevation;
}) {
  const nTotal = north.totalLengthInches;
  const sTotal = south.totalLengthInches;
  const eTotal = east.totalLengthInches;
  const wTotal = west.totalLengthInches;
  const nsMatch = Math.abs(nTotal - sTotal) < 0.01;
  const ewMatch = Math.abs(eTotal - wTotal) < 0.01;

  return (
    <aside className="assessment">
      <h2>Dimensions</h2>
      <div className="dimension-row">
        <span>North total</span>
        <span>{formatInches(nTotal)} ({nTotal.toFixed(1)}")</span>
      </div>
      <div className="dimension-row">
        <span>South total</span>
        <span>{formatInches(sTotal)} ({sTotal.toFixed(1)}")</span>
      </div>
      <div className={`dimension-row ${nsMatch ? "match" : "mismatch"}`}>
        <span>North = South</span>
        <span>{nsMatch ? "✓ Match" : "✗ Mismatch"}</span>
      </div>
      <div className="dimension-row" style={{ marginTop: "0.5rem" }}>
        <span>East total</span>
        <span>{formatInches(eTotal)} ({eTotal.toFixed(1)}")</span>
      </div>
      <div className="dimension-row">
        <span>West total</span>
        <span>{formatInches(wTotal)} ({wTotal.toFixed(1)}")</span>
      </div>
      <div className={`dimension-row ${ewMatch ? "match" : "mismatch"}`}>
        <span>East = West</span>
        <span>{ewMatch ? "✓ Match" : "✗ Mismatch"}</span>
      </div>
    </aside>
  );
}
