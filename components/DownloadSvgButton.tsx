"use client";

import { useCallback, useState } from "react";
import JSZip from "jszip";
import { Download, FolderDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { initialWalls } from "@/lib/framing-data";

interface DownloadSvgButtonProps {
  /** The DOM id of the card element containing the SVG */
  cardId: string;
  /** Filename (without extension) for the downloaded file */
  filename: string;
}

/** Extract a manifest of every tagged element (those with id) from the SVG */
function buildManifest(svg: SVGSVGElement) {
  const entries: Record<string, {
    label: string; x: number; y: number; w: number; h: number;
    bbox?: { x: number; y: number; w: number; h: number };
  }> = {};

  svg.querySelectorAll("[id]").forEach((el) => {
    const id = el.id;
    if (!id) return;
    const label = el.getAttribute("data-label");
    if (!label) return;

    const entry: typeof entries[string] = {
      label,
      x: parseFloat(el.getAttribute("data-x") ?? "0"),
      y: parseFloat(el.getAttribute("data-y") ?? "0"),
      w: parseFloat(el.getAttribute("data-w") ?? "0"),
      h: parseFloat(el.getAttribute("data-h") ?? "0"),
    };

    // For groups with multiple child shapes, compute pixel bounding box
    // so the diff algorithm doesn't rely on just the first child rect
    if (el instanceof SVGGraphicsElement) {
      try {
        const bb = el.getBBox();
        if (bb.width > 0 && bb.height > 0) {
          entry.bbox = { x: Math.round(bb.x * 100) / 100, y: Math.round(bb.y * 100) / 100,
                         w: Math.round(bb.width * 100) / 100, h: Math.round(bb.height * 100) / 100 };
        }
      } catch { /* getBBox can throw on hidden elements */ }
    }

    entries[id] = entry;
  });
  return entries;
}

function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Collect SVG string (+ optional manifest JSON) for one card — used for single downloads and ZIP. */
function collectSvgExportFromCard(cardId: string, filename: string): { name: string; content: string }[] {
  const out: { name: string; content: string }[] = [];
  const card = document.getElementById(cardId);
  if (!card) return out;

  const svgs = card.querySelectorAll("svg");
  const svg = Array.from(svgs).find((s) => !s.closest("button"));
  if (!svg) return out;

  const manifest = buildManifest(svg);
  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  const serializer = new XMLSerializer();
  const svgString = serializer
    .serializeToString(clone)
    .replace(/ui-monospace/g, "Courier")
    .replace(/ui-sans-serif/g, "Helvetica")
    .replace(/ui-serif/g, "Times");

  out.push({ name: `${filename}.svg`, content: svgString });

  if (Object.keys(manifest).length > 0) {
    const manifestJson = JSON.stringify(
      { filename: `${filename}.svg`, exported: new Date().toISOString(), elements: manifest },
      null,
      2
    );
    out.push({ name: `${filename}.manifest.json`, content: manifestJson });
  }
  return out;
}

/**
 * Export one drawing card’s main SVG (+ optional manifest). Same behavior as each per-card SVG button.
 */
export function downloadSvgFromCard(cardId: string, filename: string): void {
  for (const { name, content } of collectSvgExportFromCard(cardId, filename)) {
    const type = name.endsWith(".json")
      ? "application/json;charset=utf-8"
      : "image/svg+xml;charset=utf-8";
    downloadBlob(new Blob([content], { type }), name);
  }
}

/** Card ids + filenames — same order as page / scroll nav (`app/page.tsx`). */
const ALL_SVG_EXPORTS: { cardId: string; filename: string }[] = [
  { cardId: "section-floor-plan", filename: "Main-Level-Floor-Plan" },
  { cardId: "section-floor-plan-2", filename: "Second-Floor-Plan" },
  { cardId: "section-floor-plan-3", filename: "Third-Floor-Plan" },
  { cardId: "section-wall-south", filename: `${initialWalls.south.name.replace(/\s+/g, "-")}-Elevation` },
  { cardId: "section-wall-north", filename: `${initialWalls.north.name.replace(/\s+/g, "-")}-Elevation` },
  { cardId: "section-interior-partitions", filename: "Interior-Partitions" },
  { cardId: "section-wall-east", filename: `${initialWalls.east.name.replace(/\s+/g, "-")}-Elevation` },
  { cardId: "section-wall-west", filename: `${initialWalls.west.name.replace(/\s+/g, "-")}-Elevation` },
];

export function DownloadAllSvgsButton() {
  const [busy, setBusy] = useState(false);

  const handleDownloadAll = useCallback(async () => {
    setBusy(true);
    try {
      const zip = new JSZip();
      for (const { cardId, filename } of ALL_SVG_EXPORTS) {
        for (const { name, content } of collectSvgExportFromCard(cardId, filename)) {
          zip.file(name, content);
        }
      }
      const blob = await zip.generateAsync({ type: "blob", compression: "DEFLATE" });
      downloadBlob(blob, "Block-House-SVGs.zip");
    } finally {
      setBusy(false);
    }
  }, []);

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleDownloadAll}
      disabled={busy}
      className="h-8 px-2.5 gap-1.5 border-white/25 bg-white/10 text-white hover:bg-white/20 hover:text-white disabled:opacity-50"
      title="Download all drawings as one ZIP (SVG + manifest JSON per sheet). Browsers only allow one file per click without a zip."
    >
      <FolderDown className="h-3.5 w-3.5 shrink-0" />
      <span className="text-[11px] font-medium hidden sm:inline">{busy ? "…" : "All SVGs"}</span>
    </Button>
  );
}

export function DownloadSvgButton({ cardId, filename }: DownloadSvgButtonProps) {
  const handleDownload = useCallback(() => {
    downloadSvgFromCard(cardId, filename);
  }, [cardId, filename]);

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleDownload}
      className="h-7 px-2 text-zinc-400 hover:text-zinc-700"
      title={`Download ${filename}.svg`}
    >
      <Download className="h-3.5 w-3.5 mr-1" />
      <span className="text-[10px] uppercase tracking-wide font-medium">SVG</span>
    </Button>
  );
}
