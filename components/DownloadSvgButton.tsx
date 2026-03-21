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

export function DownloadSvgButton({ cardId, filename }: DownloadSvgButtonProps) {
  const handleDownload = useCallback(() => {
    const card = document.getElementById(cardId);
    if (!card) return;

    // Grab the blueprint SVG — skip any icon SVGs inside buttons
    const svgs = card.querySelectorAll("svg");
    const svg = Array.from(svgs).find((s) => !s.closest("button"));
    if (!svg) return;

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

    const blob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.svg`;
    document.body.appendChild(a);
    a.click();

    // Cleanup
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
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
