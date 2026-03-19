"use client";

import { useEffect, useState } from "react";

export interface ScrollSection {
  id: string;
  label: string;
}

/**
 * Watches a list of page sections and shows the label of whichever
 * section is currently visible in the header (scroll-spy).
 */
export function ScrollLabel({ sections }: { sections: ScrollSection[] }) {
  const [label, setLabel] = useState(sections[0]?.label ?? "");

  useEffect(() => {
    if (!sections.length) return;

    const HEADER_H = 80; // sticky header + card header combined height

    const update = () => {
      let current = sections[0].label;
      for (const { id, label: sLabel } of sections) {
        const el = document.getElementById(id);
        if (!el) continue;
        // Once this section's top edge scrolls above the fold, it becomes active.
        if (el.getBoundingClientRect().top <= HEADER_H) {
          current = sLabel;
        }
      }
      setLabel(current);
    };

    window.addEventListener("scroll", update, { passive: true });
    update(); // sync on mount

    return () => window.removeEventListener("scroll", update);
  }, [sections]);

  return (
    <span className="text-white/65 text-sm font-mono hidden sm:inline transition-all">
      {label}
    </span>
  );
}
