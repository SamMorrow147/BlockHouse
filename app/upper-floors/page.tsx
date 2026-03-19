import { HamburgerMenu } from "@/components/HamburgerMenu";
import { SecondFloorPlan } from "@/components/SecondFloorPlan";
import { ThirdFloorPlan } from "@/components/ThirdFloorPlan";
import { MeasureTape } from "@/components/MeasureTape";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function UpperFloors() {
  return (
    <div className="app">
      <header className="header">
        <HamburgerMenu />
        <div className="flex items-center gap-3">
          <h1 className="text-lg font-semibold tracking-tight text-white m-0">
            Block House
          </h1>
          <span className="text-white/40 text-sm hidden sm:inline">—</span>
          <span className="text-white/65 text-sm font-mono hidden sm:inline">
            Upper Floor Plans
          </span>
        </div>
      </header>

      <main className="main">

        {/* ── Second Floor Plan ── */}
        <Card className="overflow-visible shadow-sm mb-6">
          <CardHeader className="py-2.5 px-4 bg-zinc-100 border-b rounded-t-lg sticky top-[36px] z-10">
            <CardTitle className="text-xs font-semibold text-zinc-600 tracking-widest uppercase m-0">
              Second Level — Floor Plan
            </CardTitle>
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
        <Card className="overflow-visible shadow-sm mb-6">
          <CardHeader className="py-2.5 px-4 bg-zinc-100 border-b rounded-t-lg sticky top-[36px] z-10">
            <CardTitle className="text-xs font-semibold text-zinc-600 tracking-widest uppercase m-0">
              Third Level — Floor Plan (Partial Loft)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <MeasureTape pxPerInch={3}>
              <div className="wall-parametric-wrap px-3 pt-2 pb-1">
                <ThirdFloorPlan />
              </div>
            </MeasureTape>
          </CardContent>
        </Card>

      </main>
    </div>
  );
}
