"use client";

import { useCallback } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";

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

export function DownloadSvgButton({ cardId, filename }: DownloadSvgButtonProps) {
  const handleDownload = useCallback(() => {
    const card = document.getElementById(cardId);
    if (!card) return;

    // Grab the blueprint SVG — skip any icon SVGs inside buttons
    const svgs = card.querySelectorAll("svg");
    const svg = Array.from(svgs).find((s) => !s.closest("button"));
    if (!svg) return;

    // ── Build manifest BEFORE cloning (data-* attrs are on the live DOM) ──
    const manifest = buildManifest(svg);

    // Clone so we don't mutate the live DOM
    const clone = svg.cloneNode(true) as SVGSVGElement;

    // Ensure the clone carries an xmlns so it's a valid standalone SVG
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");

    // Replace CSS system font keywords with real font names that Illustrator recognises
    const serializer = new XMLSerializer();
    const svgString = serializer
      .serializeToString(clone)
      .replace(/ui-monospace/g, "Courier")
      .replace(/ui-sans-serif/g, "Helvetica")
      .replace(/ui-serif/g, "Times");

    // Download the SVG
    downloadBlob(
      new Blob([svgString], { type: "image/svg+xml;charset=utf-8" }),
      `${filename}.svg`
    );

    // Download the companion manifest (same name, .json)
    if (Object.keys(manifest).length > 0) {
      const manifestJson = JSON.stringify(
        { filename: `${filename}.svg`, exported: new Date().toISOString(), elements: manifest },
        null,
        2
      );
      downloadBlob(
        new Blob([manifestJson], { type: "application/json;charset=utf-8" }),
        `${filename}.manifest.json`
      );
    }
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
