import {
  initialWalls, horizPartition,
  secondFloorWestWall, secondFloorEastWall,
  secondFloorSouthWall, secondFloorNorthWall,
  thirdFloorNorthWall,
  STAIR_WIDTH, STAIR_TREAD_DEPTH,
} from "@/lib/framing-data";
import type { WallId } from "@/lib/types";
import { WallElevationView } from "@/components/WallElevation";
import { FloorPlan } from "@/components/FloorPlan";
import { InteriorPartitionDetails } from "@/components/InteriorPartitionDetails";

import { HamburgerMenu } from "@/components/HamburgerMenu";
import { MeasureTape } from "@/components/MeasureTape";
import { CutList, type FloorDef } from "@/components/CutList";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollLabel, type ScrollSection } from "@/components/ScrollLabel";
import { SecondFloorPlan } from "@/components/SecondFloorPlan";
import { ThirdFloorPlan } from "@/components/ThirdFloorPlan";
import { DownloadSvgButton } from "@/components/DownloadSvgButton";

const WALL_ORDER_TOP: WallId[] = ["south", "north"];
const WALL_ORDER_BOTTOM: WallId[] = ["east", "west"];
const WALL_ORDER: WallId[] = [...WALL_ORDER_TOP, ...WALL_ORDER_BOTTOM];

// ── Consistent pixel-per-inch scale across all wall elevations ──────────────
const ELEV_AL = 92;
const ELEV_AR = 80;
const ELEV_PX  = 4;
const elevSvgW = (len: number) => ELEV_AL + len * ELEV_PX + ELEV_AR;
const maxElevW = Math.max(...WALL_ORDER.map((id) => elevSvgW(initialWalls[id].totalLengthInches)));

// Interior partition SVG widths
const STAIR_DETAIL_W    = STAIR_WIDTH + 2 * STAIR_TREAD_DEPTH + 6;
const IPD_AL = 120;
const IPD_AR = 140;
const DOOR_WALL_SVG_W   = IPD_AL + STAIR_DETAIL_W * ELEV_PX + IPD_AR;
const HORIZ_PART_SVG_W  = elevSvgW(horizPartition.totalLengthInches);

import type { WallElevation } from "@/lib/types";

const secondFloorWalls: Partial<Record<string, WallElevation>> = {
  north: secondFloorNorthWall,
  south: secondFloorSouthWall,
  east:  secondFloorEastWall,
  west:  secondFloorWestWall,
};

const northFloors: FloorDef[] = [
  { label: "1st Floor", wall: initialWalls.north },
  { label: "2nd Floor", wall: secondFloorNorthWall },
  { label: "3rd Floor", wall: thirdFloorNorthWall },
];

function formatInches(n: number): string {
  const ft = Math.floor(n / 12);
  const ins = Math.round((n % 12) * 4) / 4;
  if (ft === 0) return `${ins}"`;
  if (ins === 0) return `${ft}'`;
  return `${ft}'-${ins}"`;
}

const SCROLL_SECTIONS: ScrollSection[] = [
  { id: "section-floor-plan",            label: "Main Level — Floor Plan" },
  { id: "section-floor-plan-2",          label: "Second Floor — Floor Plan" },
  { id: "section-floor-plan-3",          label: "Third Floor — Floor Plan" },
  { id: "section-wall-south",            label: "South Wall Elevation" },
  { id: "section-wall-north",            label: "North Wall Elevation" },
  { id: "section-interior-partitions",   label: "Interior Partitions — Kitchen / Bathroom" },
  { id: "section-wall-east",             label: "East Wall Elevation" },
  { id: "section-wall-west",             label: "West Wall Elevation" },
];

export default function Home() {
  return (
    <div className="app">

      {/* ── Header ── */}
      <header className="header">
        <HamburgerMenu />
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold tracking-tight text-white m-0">
            Block House
          </h1>
          <span className="text-white/40 text-sm hidden sm:inline">—</span>
          <ScrollLabel sections={SCROLL_SECTIONS} />
        </div>
      </header>

      <main className="main">

        {/* ── Floor Plan ── */}
        <Card id="section-floor-plan" className="overflow-visible shadow-sm mb-6">
          <CardHeader className="py-2.5 px-4 bg-zinc-100 border-b rounded-t-lg flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-semibold text-zinc-600 tracking-widest uppercase m-0">
              Main Level — Floor Plan
            </CardTitle>
            <DownloadSvgButton cardId="section-floor-plan" filename="Main-Level-Floor-Plan" />
          </CardHeader>
          <CardContent className="p-0">
            <MeasureTape pxPerInch={3}>
              <div className="wall-parametric-wrap px-3 pt-2 pb-1">
                <FloorPlan />
              </div>
            </MeasureTape>
          </CardContent>
        </Card>

        {/* ── Second Floor Plan ── */}
        <Card id="section-floor-plan-2" className="overflow-visible shadow-sm mb-6">
          <CardHeader className="py-2.5 px-4 bg-zinc-100 border-b rounded-t-lg flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-semibold text-zinc-600 tracking-widest uppercase m-0">
              Second Floor — Floor Plan
            </CardTitle>
            <DownloadSvgButton cardId="section-floor-plan-2" filename="Second-Floor-Plan" />
          </CardHeader>
          <CardContent className="p-0">
            <MeasureTape pxPerInch={3}>
              <div className="wall-parametric-wrap px-3 pt-2 pb-1">
                <SecondFloorPlan />
              </div>
            </MeasureTape>
          </CardContent>
        </Card>

        {/* ── Third Floor Plan ── */}
        <Card id="section-floor-plan-3" className="overflow-visible shadow-sm mb-6">
          <CardHeader className="py-2.5 px-4 bg-zinc-100 border-b rounded-t-lg flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-semibold text-zinc-600 tracking-widest uppercase m-0">
              Third Floor — Floor Plan
            </CardTitle>
            <DownloadSvgButton cardId="section-floor-plan-3" filename="Third-Floor-Plan" />
          </CardHeader>
          <CardContent className="p-0">
            <MeasureTape pxPerInch={3}>
              <div className="wall-parametric-wrap px-3 pt-2 pb-1">
                <ThirdFloorPlan />
              </div>
            </MeasureTape>
          </CardContent>
        </Card>

        {/* ── Wall Elevations — South + North ── */}
        <div className="walls-grid">
          {WALL_ORDER_TOP.map((id) => {
            const wall = initialWalls[id];
            return (
              <Card key={id} id={`section-wall-${id}`} className="overflow-visible shadow-sm">
                <CardHeader className="py-2.5 px-4 bg-zinc-100 border-b rounded-t-lg flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-xs font-semibold text-zinc-600 tracking-widest uppercase m-0">
                    {wall.name}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className="font-mono text-xs font-normal text-zinc-500 bg-zinc-200 border-0"
                    >
                      {formatInches(wall.totalLengthInches)}
                    </Badge>
                    <DownloadSvgButton cardId={`section-wall-${id}`} filename={`${wall.name.replace(/\s+/g, "-")}-Elevation`} />
                  </div>
                </CardHeader>
                <CardContent className="p-3">
                  <MeasureTape pxPerInch={4}>
                    <WallElevationView
                      wall={wall}
                      interactive={wall.id === "north"}
                      svgWidthPct={`${(elevSvgW(wall.totalLengthInches) / maxElevW * 100).toFixed(2)}%`}
                    />
                  </MeasureTape>
                  <div className="wall-data-row">
                    <div className="wall-data-summary">
                      {id === "north"
                        ? <CutList wall={wall} floors={northFloors} />
                        : <CutList wall={wall} openingsFrom={secondFloorWalls[id]} />
                      }
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* ── Interior Partitions ── */}
        <Card id="section-interior-partitions" className="overflow-hidden shadow-sm mt-6">
          <CardHeader className="py-2.5 px-4 bg-zinc-100 border-b rounded-t-lg flex-row items-center justify-between space-y-0">
            <CardTitle className="text-xs font-semibold text-zinc-600 tracking-widest uppercase m-0">
              Interior Partitions — Kitchen / Bathroom
            </CardTitle>
            <DownloadSvgButton cardId="section-interior-partitions" filename="Interior-Partitions" />
          </CardHeader>
          <CardContent className="p-0">
            <div style={{ overflowX: "auto", width: "100%", minWidth: 0 }}>
              <MeasureTape pxPerInch={4}>
                <InteriorPartitionDetails
                  stairWidthPct={`${(DOOR_WALL_SVG_W / maxElevW * 100).toFixed(2)}%`}
                  partitionWidthPct={`${(HORIZ_PART_SVG_W / maxElevW * 100).toFixed(2)}%`}
                />
              </MeasureTape>
            </div>
          </CardContent>
        </Card>

        {/* ── Wall Elevations — East + West ── */}
        <div className="walls-grid mt-6">
          {WALL_ORDER_BOTTOM.map((id) => {
            const wall = initialWalls[id];
            return (
              <Card key={id} id={`section-wall-${id}`} className="overflow-visible shadow-sm">
                <CardHeader className="py-2.5 px-4 bg-zinc-100 border-b rounded-t-lg flex-row items-center justify-between space-y-0">
                  <CardTitle className="text-xs font-semibold text-zinc-600 tracking-widest uppercase m-0">
                    {wall.name}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="secondary"
                      className="font-mono text-xs font-normal text-zinc-500 bg-zinc-200 border-0"
                    >
                      {formatInches(wall.totalLengthInches)}
                    </Badge>
                    <DownloadSvgButton cardId={`section-wall-${id}`} filename={`${wall.name.replace(/\s+/g, "-")}-Elevation`} />
                  </div>
                </CardHeader>
                <CardContent className="p-3">
                  <MeasureTape pxPerInch={4}>
                    <WallElevationView
                      wall={wall}
                      interactive={wall.id === "north"}
                      svgWidthPct={`${(elevSvgW(wall.totalLengthInches) / maxElevW * 100).toFixed(2)}%`}
                    />
                  </MeasureTape>
                  <div className="wall-data-row">
                    <div className="wall-data-summary">
                      <CutList wall={wall} openingsFrom={secondFloorWalls[id]} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>


      </main>
    </div>
  );
}
