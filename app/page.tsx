import { initialWalls } from "@/lib/framing-data";
import type { WallId } from "@/lib/types";
import { WallElevationView } from "@/components/WallElevation";
import { FloorPlan } from "@/components/FloorPlan";

const WALL_ORDER: WallId[] = ["north", "south", "west", "east"];
const eastSlidingDoor = initialWalls.east.openings.find((o) => o.type === "door");
const westAwningWindow = initialWalls.west.openings.find((o) => o.type === "window");
const southWindow = initialWalls.south.openings.find((o) => o.type === "window");
const northDoor = initialWalls.north.openings.find((o) => o.type === "door");

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
                  <div
                    className="wall-parametric-wrap"
                    style={{ width: `${(elevSvgW(wall.totalLengthInches) / maxElevW * 100).toFixed(2)}%` }}
                  >
                    <p className="wall-label">Code-generated (edit framing-data.ts to update)</p>
                    <WallElevationView wall={wall} interactive={wall.id === "south"} />
                  </div>
                  <div className="wall-data-row">
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
                    {wall.id === "north" && northDoor && (
                      <div className="opening-diagram-column">
                        <strong style={{ display: "block", marginBottom: "0.35rem" }}>Entry door — order size</strong>
                        <div className="sliding-door-wrap">
                          <svg
                            viewBox={`0 0 ${northDoor.widthInches * 1.4 + 100} ${northDoor.heightInches * 1.4 + 68}`}
                            width="140"
                            height="110"
                            style={{ display: "block", maxWidth: "100%", height: "auto" }}
                            preserveAspectRatio="xMinYMin meet"
                          >
                            <rect x={20} y={20} width={northDoor.widthInches * 1.4} height={northDoor.heightInches * 1.4} fill="none" stroke="#333" strokeWidth="1.5" />
                            <line x1={20} y1={20 + northDoor.heightInches * 1.4 + 10} x2={20 + northDoor.widthInches * 1.4} y2={20 + northDoor.heightInches * 1.4 + 10} stroke="#1a55bb" strokeWidth="0.8" />
                            <line x1={20} y1={20 + northDoor.heightInches * 1.4 + 6} x2={20} y2={20 + northDoor.heightInches * 1.4 + 14} stroke="#1a55bb" strokeWidth="0.8" />
                            <line x1={20 + northDoor.widthInches * 1.4} y1={20 + northDoor.heightInches * 1.4 + 6} x2={20 + northDoor.widthInches * 1.4} y2={20 + northDoor.heightInches * 1.4 + 14} stroke="#1a55bb" strokeWidth="0.8" />
                            <text x={20 + northDoor.widthInches * 0.7} y={20 + northDoor.heightInches * 1.4 + 22} fill="#1a55bb" fontSize="10" fontFamily="ui-monospace, monospace" textAnchor="middle">
                              {northDoor.widthInches}" ({formatInches(northDoor.widthInches)}) — width
                            </text>
                            <line x1={20 + northDoor.widthInches * 1.4 + 10} y1={20} x2={20 + northDoor.widthInches * 1.4 + 10} y2={20 + northDoor.heightInches * 1.4} stroke="#1a55bb" strokeWidth="0.8" />
                            <line x1={20 + northDoor.widthInches * 1.4 + 6} y1={20} x2={20 + northDoor.widthInches * 1.4 + 14} y2={20} stroke="#1a55bb" strokeWidth="0.8" />
                            <line x1={20 + northDoor.widthInches * 1.4 + 6} y1={20 + northDoor.heightInches * 1.4} x2={20 + northDoor.widthInches * 1.4 + 14} y2={20 + northDoor.heightInches * 1.4} stroke="#1a55bb" strokeWidth="0.8" />
                            <text x={20 + northDoor.widthInches * 1.4 + 18} y={20 + northDoor.heightInches * 0.7} fill="#1a55bb" fontSize="10" fontFamily="ui-monospace, monospace" textAnchor="middle" transform={`rotate(90, ${20 + northDoor.widthInches * 1.4 + 18}, ${20 + northDoor.heightInches * 0.7})`}>
                              {northDoor.heightInches}" ({formatInches(northDoor.heightInches)}) — height
                            </text>
                            <text x={20 + northDoor.widthInches * 0.7} y={20 + northDoor.heightInches * 0.7 - 6} fill="#555" fontSize="9" fontFamily="ui-monospace, monospace" textAnchor="middle">Entry door</text>
                            <text x={20 + northDoor.widthInches * 0.7} y={20 + northDoor.heightInches * 0.7 + 6} fill="#555" fontSize="9" fontFamily="ui-monospace, monospace" textAnchor="middle">(north)</text>
                          </svg>
                        </div>
                      </div>
                    )}
                    {wall.id === "south" && southWindow && (
                      <div className="opening-diagram-column">
                        <strong style={{ display: "block", marginBottom: "0.35rem" }}>South window — order size</strong>
                        <div className="sliding-door-wrap">
                          <svg
                            viewBox={`0 0 ${southWindow.widthInches * 1.4 + 100} ${southWindow.heightInches * 1.4 + 88}`}
                            width="140"
                            height="120"
                            style={{ display: "block", maxWidth: "100%", height: "auto" }}
                            preserveAspectRatio="xMinYMin meet"
                          >
                            <rect x={20} y={20} width={southWindow.widthInches * 1.4} height={southWindow.heightInches * 1.4} fill="none" stroke="#333" strokeWidth="1.5" />
                            <line x1={20} y1={20 + southWindow.heightInches * 1.4 + 10} x2={20 + southWindow.widthInches * 1.4} y2={20 + southWindow.heightInches * 1.4 + 10} stroke="#1a55bb" strokeWidth="0.8" />
                            <line x1={20} y1={20 + southWindow.heightInches * 1.4 + 6} x2={20} y2={20 + southWindow.heightInches * 1.4 + 14} stroke="#1a55bb" strokeWidth="0.8" />
                            <line x1={20 + southWindow.widthInches * 1.4} y1={20 + southWindow.heightInches * 1.4 + 6} x2={20 + southWindow.widthInches * 1.4} y2={20 + southWindow.heightInches * 1.4 + 14} stroke="#1a55bb" strokeWidth="0.8" />
                            <text x={20 + southWindow.widthInches * 0.7} y={20 + southWindow.heightInches * 1.4 + 22} fill="#1a55bb" fontSize="10" fontFamily="ui-monospace, monospace" textAnchor="middle">
                              {southWindow.widthInches}" ({formatInches(southWindow.widthInches)}) — width
                            </text>
                            <line x1={20 + southWindow.widthInches * 1.4 + 10} y1={20} x2={20 + southWindow.widthInches * 1.4 + 10} y2={20 + southWindow.heightInches * 1.4} stroke="#1a55bb" strokeWidth="0.8" />
                            <line x1={20 + southWindow.widthInches * 1.4 + 6} y1={20} x2={20 + southWindow.widthInches * 1.4 + 14} y2={20} stroke="#1a55bb" strokeWidth="0.8" />
                            <line x1={20 + southWindow.widthInches * 1.4 + 6} y1={20 + southWindow.heightInches * 1.4} x2={20 + southWindow.widthInches * 1.4 + 14} y2={20 + southWindow.heightInches * 1.4} stroke="#1a55bb" strokeWidth="0.8" />
                            <text x={20 + southWindow.widthInches * 1.4 + 18} y={20 + southWindow.heightInches * 0.7} fill="#1a55bb" fontSize="10" fontFamily="ui-monospace, monospace" textAnchor="middle" transform={`rotate(90, ${20 + southWindow.widthInches * 1.4 + 18}, ${20 + southWindow.heightInches * 0.7})`}>
                              {southWindow.heightInches}" ({formatInches(southWindow.heightInches)}) — height
                            </text>
                            <text x={20 + southWindow.widthInches * 0.7} y={20 + southWindow.heightInches * 0.7 - 6} fill="#555" fontSize="9" fontFamily="ui-monospace, monospace" textAnchor="middle">Window</text>
                            <text x={20 + southWindow.widthInches * 0.7} y={20 + southWindow.heightInches * 0.7 + 6} fill="#555" fontSize="9" fontFamily="ui-monospace, monospace" textAnchor="middle">(south)</text>
                            {southWindow.sillHeightInches != null && (
                              <text x={20 + southWindow.widthInches * 0.7} y={20 + southWindow.heightInches * 1.4 + 42} fill="#666" fontSize="9" fontFamily="ui-monospace, monospace" textAnchor="middle">
                                Sill @ {southWindow.sillHeightInches}" ({formatInches(southWindow.sillHeightInches)})
                              </text>
                            )}
                          </svg>
                        </div>
                      </div>
                    )}
                    {wall.id === "west" && westAwningWindow && (
                      <div className="opening-diagram-column">
                        <strong style={{ display: "block", marginBottom: "0.35rem" }}>Awning window — order size</strong>
                        <div className="sliding-door-wrap">
                          <svg
                            viewBox={`0 0 ${westAwningWindow.widthInches * 1.4 + 100} ${westAwningWindow.heightInches * 1.4 + 88}`}
                            width="140"
                            height="120"
                            style={{ display: "block", maxWidth: "100%", height: "auto" }}
                            preserveAspectRatio="xMinYMin meet"
                          >
                            <rect x={20} y={20} width={westAwningWindow.widthInches * 1.4} height={westAwningWindow.heightInches * 1.4} fill="none" stroke="#333" strokeWidth="1.5" />
                            <line x1={20} y1={20 + westAwningWindow.heightInches * 1.4 + 10} x2={20 + westAwningWindow.widthInches * 1.4} y2={20 + westAwningWindow.heightInches * 1.4 + 10} stroke="#1a55bb" strokeWidth="0.8" />
                            <line x1={20} y1={20 + westAwningWindow.heightInches * 1.4 + 6} x2={20} y2={20 + westAwningWindow.heightInches * 1.4 + 14} stroke="#1a55bb" strokeWidth="0.8" />
                            <line x1={20 + westAwningWindow.widthInches * 1.4} y1={20 + westAwningWindow.heightInches * 1.4 + 6} x2={20 + westAwningWindow.widthInches * 1.4} y2={20 + westAwningWindow.heightInches * 1.4 + 14} stroke="#1a55bb" strokeWidth="0.8" />
                            <text x={20 + westAwningWindow.widthInches * 0.7} y={20 + westAwningWindow.heightInches * 1.4 + 22} fill="#1a55bb" fontSize="10" fontFamily="ui-monospace, monospace" textAnchor="middle">
                              {westAwningWindow.widthInches}" ({formatInches(westAwningWindow.widthInches)}) — width
                            </text>
                            <line x1={20 + westAwningWindow.widthInches * 1.4 + 10} y1={20} x2={20 + westAwningWindow.widthInches * 1.4 + 10} y2={20 + westAwningWindow.heightInches * 1.4} stroke="#1a55bb" strokeWidth="0.8" />
                            <line x1={20 + westAwningWindow.widthInches * 1.4 + 6} y1={20} x2={20 + westAwningWindow.widthInches * 1.4 + 14} y2={20} stroke="#1a55bb" strokeWidth="0.8" />
                            <line x1={20 + westAwningWindow.widthInches * 1.4 + 6} y1={20 + westAwningWindow.heightInches * 1.4} x2={20 + westAwningWindow.widthInches * 1.4 + 14} y2={20 + westAwningWindow.heightInches * 1.4} stroke="#1a55bb" strokeWidth="0.8" />
                            <text x={20 + westAwningWindow.widthInches * 1.4 + 18} y={20 + westAwningWindow.heightInches * 0.7} fill="#1a55bb" fontSize="10" fontFamily="ui-monospace, monospace" textAnchor="middle" transform={`rotate(90, ${20 + westAwningWindow.widthInches * 1.4 + 18}, ${20 + westAwningWindow.heightInches * 0.7})`}>
                              {westAwningWindow.heightInches}" ({formatInches(westAwningWindow.heightInches)}) — height
                            </text>
                            <text x={20 + westAwningWindow.widthInches * 0.7} y={20 + westAwningWindow.heightInches * 0.7 - 6} fill="#555" fontSize="9" fontFamily="ui-monospace, monospace" textAnchor="middle">Awning</text>
                            <text x={20 + westAwningWindow.widthInches * 0.7} y={20 + westAwningWindow.heightInches * 0.7 + 6} fill="#555" fontSize="9" fontFamily="ui-monospace, monospace" textAnchor="middle">window</text>
                            {westAwningWindow.sillHeightInches != null && (
                              <text x={20 + westAwningWindow.widthInches * 0.7} y={20 + westAwningWindow.heightInches * 1.4 + 42} fill="#666" fontSize="9" fontFamily="ui-monospace, monospace" textAnchor="middle">
                                Sill @ {westAwningWindow.sillHeightInches}" ({formatInches(westAwningWindow.sillHeightInches)})
                              </text>
                            )}
                          </svg>
                        </div>
                      </div>
                    )}
                    {wall.id === "east" && eastSlidingDoor && (
                      <div className="opening-diagram-column">
                        <strong style={{ display: "block", marginBottom: "0.35rem" }}>Sliding door — order size</strong>
                        <div className="sliding-door-wrap">
                          <svg
                            viewBox={`0 0 ${eastSlidingDoor.widthInches * 1.4 + 100} ${eastSlidingDoor.heightInches * 1.4 + 68}`}
                            width="140"
                            height="110"
                            style={{ display: "block", maxWidth: "100%", height: "auto" }}
                            preserveAspectRatio="xMinYMin meet"
                          >
                            <rect x={20} y={20} width={eastSlidingDoor.widthInches * 1.4} height={eastSlidingDoor.heightInches * 1.4} fill="none" stroke="#333" strokeWidth="1.5" />
                            <line x1={20 + eastSlidingDoor.widthInches * 0.7} y1={20} x2={20 + eastSlidingDoor.widthInches * 0.7} y2={20 + eastSlidingDoor.heightInches * 1.4} stroke="#333" strokeWidth="1" strokeDasharray="4 2" />
                            <line x1={20} y1={20 + eastSlidingDoor.heightInches * 1.4 + 10} x2={20 + eastSlidingDoor.widthInches * 1.4} y2={20 + eastSlidingDoor.heightInches * 1.4 + 10} stroke="#1a55bb" strokeWidth="0.8" />
                            <line x1={20} y1={20 + eastSlidingDoor.heightInches * 1.4 + 6} x2={20} y2={20 + eastSlidingDoor.heightInches * 1.4 + 14} stroke="#1a55bb" strokeWidth="0.8" />
                            <line x1={20 + eastSlidingDoor.widthInches * 1.4} y1={20 + eastSlidingDoor.heightInches * 1.4 + 6} x2={20 + eastSlidingDoor.widthInches * 1.4} y2={20 + eastSlidingDoor.heightInches * 1.4 + 14} stroke="#1a55bb" strokeWidth="0.8" />
                            <text x={20 + eastSlidingDoor.widthInches * 0.7} y={20 + eastSlidingDoor.heightInches * 1.4 + 22} fill="#1a55bb" fontSize="10" fontFamily="ui-monospace, monospace" textAnchor="middle">
                              {eastSlidingDoor.widthInches}" ({formatInches(eastSlidingDoor.widthInches)}) — width
                            </text>
                            <line x1={20 + eastSlidingDoor.widthInches * 1.4 + 10} y1={20} x2={20 + eastSlidingDoor.widthInches * 1.4 + 10} y2={20 + eastSlidingDoor.heightInches * 1.4} stroke="#1a55bb" strokeWidth="0.8" />
                            <line x1={20 + eastSlidingDoor.widthInches * 1.4 + 6} y1={20} x2={20 + eastSlidingDoor.widthInches * 1.4 + 14} y2={20} stroke="#1a55bb" strokeWidth="0.8" />
                            <line x1={20 + eastSlidingDoor.widthInches * 1.4 + 6} y1={20 + eastSlidingDoor.heightInches * 1.4} x2={20 + eastSlidingDoor.widthInches * 1.4 + 14} y2={20 + eastSlidingDoor.heightInches * 1.4} stroke="#1a55bb" strokeWidth="0.8" />
                            <text x={20 + eastSlidingDoor.widthInches * 1.4 + 18} y={20 + eastSlidingDoor.heightInches * 0.7} fill="#1a55bb" fontSize="10" fontFamily="ui-monospace, monospace" textAnchor="middle" transform={`rotate(90, ${20 + eastSlidingDoor.widthInches * 1.4 + 18}, ${20 + eastSlidingDoor.heightInches * 0.7})`}>
                              {eastSlidingDoor.heightInches}" ({formatInches(eastSlidingDoor.heightInches)}) — height
                            </text>
                            <text x={20 + eastSlidingDoor.widthInches * 0.7} y={20 + eastSlidingDoor.heightInches * 0.7 - 6} fill="#555" fontSize="9" fontFamily="ui-monospace, monospace" textAnchor="middle">Sliding door</text>
                            <text x={20 + eastSlidingDoor.widthInches * 0.7} y={20 + eastSlidingDoor.heightInches * 0.7 + 6} fill="#555" fontSize="9" fontFamily="ui-monospace, monospace" textAnchor="middle">(2 panels)</text>
                          </svg>
                        </div>
                      </div>
                    )}
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
