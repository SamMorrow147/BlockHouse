import { initialWalls } from "@/lib/framing-data";
import type { WallId } from "@/lib/types";
import { WallElevationView } from "@/components/WallElevation";
import { FloorPlan } from "@/components/FloorPlan";

const WALL_ORDER: WallId[] = ["north", "south", "west", "east"];

// ── Consistent pixel-per-inch scale across all wall elevations ──────────────
// Each elevation SVG viewBox = ELEV_AL + totalLength×4 + ELEV_AR pixels wide.
// Rendering every wall at 100% width would blow up shorter walls.
// Instead we size each wrapper to (its svgW / maxSvgW) so the CMU block pitch
// stays identical on every wall at every viewport size.
const ELEV_AL = 92;
const ELEV_AR = 80;
const ELEV_PX  = 4;   // PX_PER_INCH from lib/types
const elevSvgW = (len: number) => ELEV_AL + len * ELEV_PX + ELEV_AR;
const maxElevW = Math.max(...WALL_ORDER.map((id) => elevSvgW(initialWalls[id].totalLengthInches)));

function formatInches(n: number): string {
  const ft = Math.floor(n / 12);
  const ins = Math.round((n % 12) * 4) / 4;
  if (ft === 0) return `${ins}"`;
  if (ins === 0) return `${ft}'`;
  return `${ft}'-${ins}"`;
}

export default function Home() {
  return (
    <div className="app">
      <header className="header">
        <h1>Block House — First Floor Framing</h1>
      </header>
      <main className="main">
        {/* ── Floor Plan ── */}
        <div className="wall-card" style={{ marginBottom: "2rem" }}>
          <h3>Main Level — Floor Plan</h3>
          <div className="wall-parametric-wrap">
            <p className="wall-label">Code-generated from framing-data.ts</p>
            <FloorPlan />
          </div>
        </div>

        {/* ── Wall Elevations ── */}
        <div className="walls-grid">
          {WALL_ORDER.map((id) => {
            const wall = initialWalls[id];
            return (
              <div key={id} className="wall-card">
                <h3>
                  {wall.name} — {formatInches(wall.totalLengthInches)} total
                </h3>
                <div className="wall-content">
                  {/* Original SVGs hidden — files kept in /public/frames/ */}
                  <div
                    className="wall-parametric-wrap"
                    style={{ width: `${(elevSvgW(wall.totalLengthInches) / maxElevW * 100).toFixed(2)}%` }}
                  >
                    <p className="wall-label">Code-generated (edit framing-data.ts to update)</p>
                    <WallElevationView wall={wall} interactive={wall.id === "south"} />
                  </div>
                  <div className="wall-data-summary">
                    <strong>Wall data:</strong>
                    <ul>
                      <li>Total: {wall.totalLengthInches.toFixed(1)}" ({formatInches(wall.totalLengthInches)})</li>
                      <li>Height: {wall.wallHeightInches}" | Studs @ {wall.studSpacingOC}" OC</li>
                      {wall.sections.map((s, i) => (
                        <li key={i}>Section {i + 1}: {s.lengthInches.toFixed(1)}" {s.label ? `— ${s.label}` : ""}</li>
                      ))}
                      {wall.openings.map((o, i) => (
                        <li key={i}>
                          Opening: {o.type} {o.widthInches}"×{o.heightInches}"
                          {o.sillHeightInches != null ? ` sill @ ${o.sillHeightInches}"` : ""}
                          {" "}from left {o.positionFromLeftInches}"
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

    </div>
  );
}
