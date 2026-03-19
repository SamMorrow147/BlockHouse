import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { HamburgerMenu } from "@/components/HamburgerMenu";

// ── Types ────────────────────────────────────────────────────────────────────
interface MaterialItem {
  sku: string;
  description: string;
  qty: number;
  unit: string;
  notes?: string;
  url?: string;
  /** True when this item's quantity is tracked & auto-calculated in the cut list */
  inCutList?: boolean;
}

interface MaterialSection {
  title: string;
  color: string;   // accent color for the section header
  items: MaterialItem[];
}

// ── Data ─────────────────────────────────────────────────────────────────────
const SECTIONS: MaterialSection[] = [
  {
    title: "Foundation / Sill",
    color: "bg-stone-700",
    items: [
      {
        sku: "161-1605",
        description: "5-1/2\" × 50' Sill Sealer Foam — Pregis",
        qty: 2, unit: "EACH",
        inCutList: true,
        url: "https://www.menards.com/main/building-materials/insulation/insulation-accessories/pregis-foam-sill-sealers/4093767/p-1642874337154227-c-5776.htm",
      },
      {
        sku: "111-1066",
        description: "2×6-16' AC2 Green Treated Ground Contact",
        qty: 2, unit: "EACH",
        inCutList: true,
        url: "https://www.menards.com/main/building-materials/lumber-boards/dimensional-lumber/ac2-reg-2-x-6-2-prime-ground-contact-green-pressure-treated-lumber/1111066/p-1444422767258-c-13125.htm",
      },
      {
        sku: "111-1040",
        description: "2×6-12' AC2 Green Treated Ground Contact",
        qty: 4, unit: "EACH",
        inCutList: true,
        url: "https://www.menards.com/main/building-materials/lumber-boards/dimensional-lumber/ac2-reg-2-x-6-2-prime-ground-contact-green-pressure-treated-lumber/1111040/p-1444422441223-c-13125.htm",
      },
      {
        sku: "102-1790",
        description: "2×6-16' #2 & Better SPF Framing Lumber",
        qty: 10, unit: "EACH",
        inCutList: true,
        url: "https://www.menards.com/main/building-materials/lumber-boards/dimensional-lumber/2-x-6-construction-framing-lumber/1021790/p-1444422746041-c-13125.htm",
      },
      {
        sku: "102-1046",
        description: "2×6-92-5/8\" SPF Stud",
        qty: 80, unit: "EACH",
        inCutList: true,
        url: "https://www.menards.com/main/building-materials/lumber-boards/dimensional-lumber/2-x-6-pre-cut-stud-construction-framing-lumber/1021046/p-1444422687059-c-13125.htm",
      },
      {
        sku: "102-2016",
        description: "2×10-8' #2 & Better Fir Framing Lumber",
        qty: 6, unit: "EACH",
        inCutList: true,
        url: "https://www.menards.com/main/building-materials/lumber-boards/dimensional-lumber/2-x-10-2-better-construction-framing-lumber/1022016/p-1444422197282-c-13125.htm",
      },
      {
        sku: "208-1517",
        description: "3-1/4\" × .131 Round Drive HDG Nails",
        qty: 1, unit: "BOX",
      },
      {
        sku: "232-7897",
        description: "1/2\" × 5-1/2\" HDG Wedge Anchor 10/Box",
        qty: 4, unit: "BOX",
      },
    ],
  },
  {
    title: "Interior Walls",
    color: "bg-amber-800",
    items: [
      {
        sku: "111-1037",
        description: "2×6-10' AC2 Green Treated Ground Contact",
        qty: 1, unit: "EACH",
        url: "https://www.menards.com/main/building-materials/lumber-boards/dimensional-lumber/ac2-reg-2-x-6-2-prime-ground-contact-green-pressure-treated-lumber/1111037/p-1444422251871-c-13125.htm",
      },
      {
        sku: "102-1761",
        description: "2×6-10' Stud / #2 & Better SPF",
        qty: 2, unit: "EACH",
        inCutList: true,
        url: "https://www.menards.com/main/building-materials/lumber-boards/dimensional-lumber/2-x-6-construction-framing-lumber/1021761/p-1444422472610-c-13125.htm",
      },
      {
        sku: "102-1046",
        description: "2×6-92-5/8\" SPF Stud",
        qty: 9, unit: "EACH",
        inCutList: true,
        url: "https://www.menards.com/main/building-materials/lumber-boards/dimensional-lumber/2-x-6-pre-cut-stud-construction-framing-lumber/1021046/p-1444422687059-c-13125.htm",
      },
      {
        sku: "111-0818",
        description: "2×4-8' AC2 Green Treated Ground Contact",
        qty: 1, unit: "EACH",
        notes: "Check for sale pricing",
        url: "https://www.menards.com/main/building-materials/lumber-boards/dimensional-lumber/ac2-reg-2-x-4-2-prime-ground-contact-green-pressure-treated-lumber/1110818/p-1444422742084-c-13125.htm",
      },
      {
        sku: "102-1127",
        description: "2×4-12' #2 & Better SPF",
        qty: 1, unit: "EACH",
        url: "https://www.menards.com/main/building-materials/lumber-boards/dimensional-lumber/2-x-4-construction-framing-lumber/1021127/p-1444422744154-c-13125.htm",
      },
      {
        sku: "102-1101",
        description: "2×4-8' Stud / #2 & Better SPF",
        qty: 8, unit: "EACH",
        url: "https://www.menards.com/main/building-materials/lumber-boards/dimensional-lumber/2-x-4-construction-framing-lumber/1021101/p-1444451086852-c-13125.htm",
      },
    ],
  },
  {
    title: "First Floor Framing",
    color: "bg-blue-800",
    items: [
      {
        sku: "106-5882",
        description: "2-1/2\" × 9-1/2\" × 16' I-Joist PRI-40",
        qty: 14, unit: "EACH",
        notes: "Special Order",
      },
      {
        sku: "106-8025",
        description: "1-1/8\" × 9-1/2\" × 12' Rim Board",
        qty: 7, unit: "EACH",
        notes: "Special Order",
      },
      {
        sku: "228-9267",
        description: "I-Joist Hanger 2-1/2\" × 9-1/2\" IHFL25925 — MiTek G90 Steel",
        qty: 28, unit: "EACH",
        inCutList: true,
        url: "https://www.menards.com/main/hardware/fasteners-connectors/construction-hardware/structural-hangers/mitek-reg-g90-steel-face-mount-i-joist-hanger/ihfl25925/p-1563863247631-c-8843.htm",
      },
      {
        sku: "227-1442",
        description: "1-1/2\" Joist Hanger Nail HDG 5 lb Box",
        qty: 1, unit: "BOX",
      },
      {
        sku: "124-2888",
        description: "3/4\" (23/32 CAT) 4×8 T&G OSB DryMax GP Subfloor",
        qty: 12, unit: "SHEET",
        url: "https://www.menards.com/main/building-materials/panel-products/tongue-groove-subfloor-panels/georgia-pacific-reg-drymax-reg-high-performance-3-4-x-4-x-8-sturd-i-floor-tongue-groove-osb-subfloor/1242888/p-1444431327668-c-13333.htm",
      },
      {
        sku: "520-1944",
        description: "Loctite PL400 Subfloor Adhesive 10 oz",
        qty: 8, unit: "TUBE",
        url: "https://www.menards.com/main/paint/adhesives-glue-tape/adhesive/construction-adhesives/loctite-reg-pl-reg-400-all-weather-subfloor-deck-construction-adhesive/2136216/p-1444432319446-c-7921.htm",
      },
      {
        sku: "208-1509",
        description: "2-3/8\" × .113 Ring Shank Framing Nails 2000 ct — Paslode",
        qty: 1, unit: "BOX",
        url: "https://www.menards.com/main/hardware/fasteners-connectors/collated-nails-screws-staples/collated-nails-cleats/paslode-reg-2-3-8-x-113-paper-brite-ring-shank-full-round-framing-nail-2-000-count/650603/p-1642874314413928-c-19718.htm",
      },
    ],
  },
  {
    title: "Second Floor Walls",
    color: "bg-teal-800",
    items: [
      {
        sku: "102-1790",
        description: "2×6-16' #2 & Better SPF Framing Lumber",
        qty: 15, unit: "EACH",
        inCutList: true,
        url: "https://www.menards.com/main/building-materials/lumber-boards/dimensional-lumber/2-x-6-construction-framing-lumber/1021790/p-1444422746041-c-13125.htm",
      },
      {
        sku: "102-1761",
        description: "2×6-10' Stud / #2 & Better SPF",
        qty: 80, unit: "EACH",
        inCutList: true,
        url: "https://www.menards.com/main/building-materials/lumber-boards/dimensional-lumber/2-x-6-construction-framing-lumber/1021761/p-1444422472610-c-13125.htm",
      },
      {
        sku: "102-2155",
        description: "2×12-10' #2 & Better Fir",
        qty: 6, unit: "EACH",
        url: "https://www.menards.com/main/building-materials/lumber-boards/dimensional-lumber/2-x-12-2-better-construction-framing-lumber/1022155/p-1444422755198-c-13125.htm",
      },
      {
        sku: "102-2016",
        description: "2×10-6' #2 & Better Fir",
        qty: 2, unit: "EACH",
        inCutList: true,
        url: "https://www.menards.com/main/building-materials/lumber-boards/dimensional-lumber/2-x-10-2-better-construction-framing-lumber/1022016/p-1444422197282-c-13125.htm",
      },
      {
        sku: "124-2728",
        description: "7/16\" × 4×8 OSB Sheathing",
        qty: 15, unit: "SHEET",
        url: "https://www.menards.com/main/building-materials/panel-products/osb-sheathing/7-16-x-4-x-8-osb/1242728-2/p-1444422471192-c-13330.htm",
      },
      {
        sku: "161-3015",
        description: "9' × 125' Tamlyn Elite House Wrap",
        qty: 2, unit: "ROLL",
      },
      {
        sku: "124-2823",
        description: "ForceField Premium Tape 3-3/4\" × 90'",
        qty: 2, unit: "ROLL",
        url: "https://www.menards.com/main/building-materials/siding/house-wrap/forcefield-reg-3-3-4-x-90-premium-tape/1366538/p-7429806127320683-c-13381.htm",
      },
      {
        sku: "231-2194",
        description: "5/16\" Staples 5M",
        qty: 1, unit: "BOX",
      },
      {
        sku: "232-7231",
        description: "3/16\" × 2-3/4\" Tapcon Screw Drive 75 pk",
        qty: 2, unit: "BOX",
      },
    ],
  },
  {
    title: "Second Level Floor",
    color: "bg-indigo-800",
    items: [
      {
        sku: "106-5882",
        description: "2-1/2\" × 9-1/2\" × 16' I-Joist PRI-40",
        qty: 14, unit: "EACH",
        notes: "Special Order",
      },
      {
        sku: "106-8025",
        description: "1-1/8\" × 9-1/2\" × 12' Rim Board",
        qty: 7, unit: "EACH",
        notes: "Special Order",
      },
      {
        sku: "228-9267",
        description: "I-Joist Hanger 2-1/2\" × 9-1/2\" IHFL25925 — MiTek G90 Steel",
        qty: 28, unit: "EACH",
        inCutList: true,
        url: "https://www.menards.com/main/hardware/fasteners-connectors/construction-hardware/structural-hangers/mitek-reg-g90-steel-face-mount-i-joist-hanger/ihfl25925/p-1563863247631-c-8843.htm",
      },
      {
        sku: "124-2889",
        description: "3/4\" (23/32 CAT) 4×8 T&G OSB DryMax GP Subfloor",
        qty: 12, unit: "SHEET",
        url: "https://www.menards.com/main/building-materials/panel-products/tongue-groove-subfloor-panels/georgia-pacific-reg-drymax-reg-high-performance-3-4-x-4-x-8-sturd-i-floor-tongue-groove-osb-subfloor/1242888/p-1444431327668-c-13333.htm",
      },
      {
        sku: "520-1944",
        description: "Loctite PL400 Subfloor Adhesive 10 oz",
        qty: 8, unit: "TUBE",
        url: "https://www.menards.com/main/paint/adhesives-glue-tape/adhesive/construction-adhesives/loctite-reg-pl-reg-400-all-weather-subfloor-deck-construction-adhesive/2136216/p-1444432319446-c-7921.htm",
      },
      {
        sku: "208-1509",
        description: "2-3/8\" × .113 Ring Shank Framing Nails 2000 ct — Paslode",
        qty: 1, unit: "BOX",
        url: "https://www.menards.com/main/hardware/fasteners-connectors/collated-nails-screws-staples/collated-nails-cleats/paslode-reg-2-3-8-x-113-paper-brite-ring-shank-full-round-framing-nail-2-000-count/650603/p-1642874314413928-c-19718.htm",
      },
    ],
  },
  {
    title: "Third Level / Roof Deck",
    color: "bg-slate-700",
    items: [
      {
        sku: "102-1774",
        description: "2×6-12' #2 & Better Douglas Fir",
        qty: 4, unit: "EACH",
        url: "https://www.menards.com/main/building-materials/lumber-boards/dimensional-lumber/2-x-6-2-better-douglas-fir-construction-framing-lumber/1021775/p-1444421997502-c-13125.htm",
      },
      {
        sku: "102-1790",
        description: "2×6-16' #2 & Better SPF Framing Lumber",
        qty: 12, unit: "EACH",
        inCutList: true,
        url: "https://www.menards.com/main/building-materials/lumber-boards/dimensional-lumber/2-x-6-construction-framing-lumber/1021790/p-1444422746041-c-13125.htm",
      },
      {
        sku: "102-1046",
        description: "2×6-92-5/8\" SPF Stud",
        qty: 6, unit: "EACH",
        inCutList: true,
        url: "https://www.menards.com/main/building-materials/lumber-boards/dimensional-lumber/2-x-6-pre-cut-stud-construction-framing-lumber/1021046/p-1444422687059-c-13125.htm",
      },
      {
        sku: "102-1758",
        description: "2×6-8' Stud / #2 & Better SPF",
        qty: 12, unit: "EACH",
        url: "https://www.menards.com/main/building-materials/lumber-boards/dimensional-lumber/2-x-6-construction-framing-lumber/1021758/p-1444422369989-c-13125.htm",
      },
      {
        sku: "102-2016",
        description: "2×10-8' #2 & Better Fir",
        qty: 2, unit: "EACH",
        inCutList: true,
        url: "https://www.menards.com/main/building-materials/lumber-boards/dimensional-lumber/2-x-10-2-better-construction-framing-lumber/1022016/p-1444422197282-c-13125.htm",
      },
      {
        sku: "106-5882",
        description: "2-1/2\" × 9-1/2\" × 16' I-Joist PRI-40",
        qty: 16, unit: "EACH",
        notes: "Special Order",
      },
      {
        sku: "106-8025",
        description: "1-1/8\" × 9-1/2\" × 12' Rim Board",
        qty: 8, unit: "EACH",
        notes: "Special Order",
      },
      {
        sku: "228-9267",
        description: "I-Joist Hanger 2-1/2\" × 9-1/2\" IHFL25925 — MiTek G90 Steel",
        qty: 32, unit: "EACH",
        inCutList: true,
        url: "https://www.menards.com/main/hardware/fasteners-connectors/construction-hardware/structural-hangers/mitek-reg-g90-steel-face-mount-i-joist-hanger/ihfl25925/p-1563863247631-c-8843.htm",
      },
      {
        sku: "124-2888",
        description: "3/4\" (23/32 CAT) 4×8 T&G OSB DryMax GP Subfloor",
        qty: 14, unit: "SHEET",
        url: "https://www.menards.com/main/building-materials/panel-products/tongue-groove-subfloor-panels/georgia-pacific-reg-drymax-reg-high-performance-3-4-x-4-x-8-sturd-i-floor-tongue-groove-osb-subfloor/1242888/p-1444431327668-c-13333.htm",
      },
      {
        sku: "520-1944",
        description: "Loctite PL400 Subfloor Adhesive 10 oz",
        qty: 9, unit: "TUBE",
        url: "https://www.menards.com/main/paint/adhesives-glue-tape/adhesive/construction-adhesives/loctite-reg-pl-reg-400-all-weather-subfloor-deck-construction-adhesive/2136216/p-1444432319446-c-7921.htm",
      },
      {
        sku: "124-2728",
        description: "7/16\" × 4×8 OSB Sheathing",
        qty: 7, unit: "SHEET",
        url: "https://www.menards.com/main/building-materials/panel-products/osb-sheathing/7-16-x-4-x-8-osb/1242728-2/p-1444422471192-c-13330.htm",
      },
    ],
  },
];

// ── Helpers ──────────────────────────────────────────────────────────────────
const totalItems    = SECTIONS.reduce((sum, s) => sum + s.items.length, 0);
const totalQty      = SECTIONS.reduce((sum, s) => sum + s.items.reduce((q, i) => q + i.qty, 0), 0);
const specialOrders = SECTIONS.flatMap(s => s.items).filter(i => i.notes?.toLowerCase().includes("special order")).length;
const inCutListCount = SECTIONS.flatMap(s => s.items).filter(i => i.inCutList).length;

// ── Page ─────────────────────────────────────────────────────────────────────
export default function MaterialsPage() {
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
          <span className="text-white/65 text-sm font-mono hidden sm:inline">
            Materials List
          </span>
        </div>
      </header>

      <main className="main max-w-5xl mx-auto">

        {/* ── Summary row ── */}
        <div className="flex flex-wrap gap-3 mb-5">
          <div className="flex items-center gap-2 bg-white border border-zinc-200 rounded-lg px-4 py-2 shadow-sm">
            <span className="text-2xl font-bold text-zinc-800">{SECTIONS.length}</span>
            <span className="text-xs text-zinc-500 font-mono uppercase tracking-wide">Sections</span>
          </div>
          <div className="flex items-center gap-2 bg-white border border-zinc-200 rounded-lg px-4 py-2 shadow-sm">
            <span className="text-2xl font-bold text-zinc-800">{totalItems}</span>
            <span className="text-xs text-zinc-500 font-mono uppercase tracking-wide">Line Items</span>
          </div>
          <div className="flex items-center gap-2 bg-white border border-zinc-200 rounded-lg px-4 py-2 shadow-sm">
            <span className="text-2xl font-bold text-zinc-800">{totalQty}</span>
            <span className="text-xs text-zinc-500 font-mono uppercase tracking-wide">Total Units</span>
          </div>
          <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-lg px-4 py-2 shadow-sm">
            <span className="text-2xl font-bold text-amber-700">{specialOrders}</span>
            <span className="text-xs text-amber-600 font-mono uppercase tracking-wide">Special Orders</span>
          </div>
          <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2 shadow-sm">
            <span className="text-2xl font-bold text-emerald-700">{inCutListCount}</span>
            <span className="text-xs text-emerald-600 font-mono uppercase tracking-wide">In Cut List</span>
          </div>
          <div className="flex items-center gap-2 ml-auto bg-white border border-zinc-200 rounded-lg px-4 py-2 shadow-sm">
            <span className="text-xs text-zinc-500 font-mono">Source:</span>
            <span className="text-xs font-semibold text-zinc-700">Menards® — Block House Build Data Sheet</span>
          </div>
        </div>

        {/* ── Sections ── */}
        <div className="flex flex-col gap-5">
          {SECTIONS.map((section) => (
            <Card key={section.title} className="overflow-visible shadow-sm">
              <CardHeader className={`py-2.5 px-4 ${section.color} rounded-t-lg flex-row items-center justify-between space-y-0`}>
                <CardTitle className="text-sm font-semibold text-white tracking-wide uppercase m-0">
                  {section.title}
                </CardTitle>
                <Badge className="bg-white/20 text-white border-0 font-mono text-xs">
                  {section.items.length} items · {section.items.reduce((s, i) => s + i.qty, 0)} units
                </Badge>
              </CardHeader>
              <CardContent className="p-0">
                <div className="divide-y divide-zinc-100">
                  {section.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 px-4 py-3 hover:bg-zinc-50 transition-colors"
                    >
                      {/* SKU */}
                      <div className="flex-none w-[88px] pt-0.5">
                        <span className="text-[11px] font-mono text-zinc-400 bg-zinc-100 px-1.5 py-0.5 rounded">
                          {item.sku}
                        </span>
                      </div>

                      {/* Description + notes */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-zinc-800 leading-snug m-0">
                          {item.description}
                          {item.inCutList && (
                            <span
                              title="Quantity tracked in the cut list"
                              className="inline-flex items-center gap-0.5 ml-2 text-[10px] font-semibold font-mono text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded align-middle"
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                              </svg>
                              Cut List
                            </span>
                          )}
                        </p>
                        {item.notes && (
                          <span className="inline-block mt-1 text-[11px] font-mono text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                            {item.notes}
                          </span>
                        )}
                      </div>

                      {/* Qty */}
                      <div className="flex-none text-right w-16">
                        <span className="text-sm font-semibold text-zinc-700">{item.qty}</span>
                        <span className="text-[11px] text-zinc-400 ml-1 font-mono">{item.unit}</span>
                      </div>

                      {/* Link */}
                      <div className="flex-none w-20 text-right">
                        {item.url ? (
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-mono text-blue-600 hover:text-blue-800 hover:underline transition-colors"
                          >
                            Menards
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                          </a>
                        ) : (
                          <span className="text-[11px] font-mono text-zinc-300">—</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* ── Footer note ── */}
        <p className="mt-6 text-xs text-zinc-400 font-mono text-center pb-4">
          Source data: Block House Build Data Sheet · Supplier: Menards® · Special Order items require advance notice
        </p>

      </main>
    </div>
  );
}
