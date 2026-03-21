/**
 * SVG Element Inventory Diff
 * ===========================
 * Compares an uploaded (edited) SVG against the app's rendered SVG manifest
 * to detect THREE categories of change:
 *
 *   1. ADDED elements   — IDs in uploaded SVG that don't exist in baseline
 *   2. REMOVED elements  — IDs in baseline that don't exist in uploaded SVG
 *   3. MODIFIED elements — Same ID exists in both, but data-* attributes differ
 *
 * This addresses the gap in the original workflow which ONLY detected
 * positional changes (moved/resized elements) and missed structural
 * additions like doubled jack studs or new blocking.
 *
 * Usage (conceptual — run mentally or adapt to Node):
 *   1. Export the current SVG + manifest from the app (Download button)
 *   2. Receive the edited SVG from the user
 *   3. Parse both, extract element inventories, compare
 */

// ── Types ────────────────────────────────────────────────────────────────────

interface SvgElement {
  id: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  /** Extra attributes like data-name, data-spec, etc. */
  extras: Record<string, string>;
  /** Number of child shape elements (rect, line, path, circle, polygon) */
  childShapeCount: number;
}

interface DiffResult {
  added: SvgElement[];
  removed: SvgElement[];
  modified: {
    id: string;
    label: string;
    changes: { attr: string; old: string | number; new: string | number }[];
  }[];
}

// ── Parsing ──────────────────────────────────────────────────────────────────

/**
 * Parse an SVG string and extract all tagged elements.
 *
 * "Tagged" = has both an `id` attribute and a `data-label` attribute.
 * This matches the convention used by hoverRect() / hoverGroup() in
 * WallElevation.tsx and other rendering components.
 */
function parseSvgElements(svgString: string): Map<string, SvgElement> {
  const elements = new Map<string, SvgElement>();

  // Regex to find <g id="..." data-label="..." ...> elements
  // This is a simplified parser; a DOM parser is more robust but
  // this works for the Illustrator-exported SVGs we receive.
  const groupRegex = /<g\s+([^>]*data-label[^>]*)>/g;
  let match;

  while ((match = groupRegex.exec(svgString)) !== null) {
    const attrs = match[1];

    const id = extractAttr(attrs, "id");
    const label = extractAttr(attrs, "data-label");
    if (!id || !label) continue;

    const el: SvgElement = {
      id,
      label: decodeHtmlEntities(label),
      x: parseFloat(extractAttr(attrs, "data-x") ?? "0"),
      y: parseFloat(extractAttr(attrs, "data-y") ?? "0"),
      w: parseFloat(extractAttr(attrs, "data-w") ?? "0"),
      h: parseFloat(extractAttr(attrs, "data-h") ?? "0"),
      extras: {},
      childShapeCount: 0,
    };

    // Capture any extra data-* attributes beyond the standard set
    const extraRegex = /data-(\w+)="([^"]*)"/g;
    let em;
    while ((em = extraRegex.exec(attrs)) !== null) {
      const key = em[1];
      if (!["label", "x", "y", "w", "h"].includes(key)) {
        el.extras[key] = decodeHtmlEntities(em[2]);
      }
    }

    elements.set(id, el);
  }

  return elements;
}

function extractAttr(attrString: string, name: string): string | undefined {
  const regex = new RegExp(`${name}="([^"]*)"`);
  const m = regex.exec(attrString);
  return m ? m[1] : undefined;
}

function decodeHtmlEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
}

// ── Diffing ──────────────────────────────────────────────────────────────────

/**
 * Compare two SVG element inventories.
 *
 * CRITICAL PRINCIPLE: Compare SVG-to-SVG (baseline export vs. edited upload).
 * NEVER compare SVG data attributes against the TypeScript data model directly,
 * because the data model stores architectural concepts (CMU opening = 40")
 * while the SVG stores rendering geometry (framed RO between jacks = 37").
 * These are different representations of the same thing.
 */
function diffElements(
  baseline: Map<string, SvgElement>,
  edited: Map<string, SvgElement>
): DiffResult {
  const result: DiffResult = { added: [], removed: [], modified: [] };

  // ── Step 0a: Find ADDED elements ──────────────────────────────────────
  for (const [id, el] of Array.from(edited.entries())) {
    if (!baseline.has(id)) {
      result.added.push(el);
    }
  }

  // ── Step 0b: Find REMOVED elements ────────────────────────────────────
  for (const [id, el] of Array.from(baseline.entries())) {
    if (!edited.has(id)) {
      result.removed.push(el);
    }
  }

  // ── Step 0c: Find MODIFIED elements ───────────────────────────────────
  // (data-label, data-x, data-y, data-w, data-h changed)
  for (const [id, baseEl] of Array.from(baseline.entries())) {
    const editEl = edited.get(id);
    if (!editEl) continue;

    const changes: { attr: string; old: string | number; new: string | number }[] = [];

    if (baseEl.label !== editEl.label) {
      changes.push({ attr: "label", old: baseEl.label, new: editEl.label });
    }
    // Position/size: use tolerance of 0.5" for Illustrator rounding
    const tolerance = 0.5;
    for (const key of ["x", "y", "w", "h"] as const) {
      if (Math.abs(baseEl[key] - editEl[key]) > tolerance) {
        changes.push({ attr: key, old: baseEl[key], new: editEl[key] });
      }
    }
    // Check extra attributes
    const allExtraKeys = new Set([
      ...Object.keys(baseEl.extras),
      ...Object.keys(editEl.extras),
    ]);
    for (const key of Array.from(allExtraKeys)) {
      const oldVal = baseEl.extras[key] ?? "(absent)";
      const newVal = editEl.extras[key] ?? "(absent)";
      if (oldVal !== newVal) {
        changes.push({ attr: `data-${key}`, old: oldVal, new: newVal });
      }
    }

    if (changes.length > 0) {
      result.modified.push({ id, label: editEl.label, changes });
    }
  }

  return result;
}

// ── Classification ───────────────────────────────────────────────────────────

/**
 * Classify what a structural change MEANS architecturally.
 *
 * A new jack stud next to a header → "header construction change"
 * A new blocking element → "blocking added"
 * A changed data-label on a header → "header spec change"
 *
 * This is the step the original workflow was missing entirely.
 */
function classifyChanges(diff: DiffResult): string[] {
  const insights: string[] = [];

  for (const el of diff.added) {
    const idLower = el.id.toLowerCase();
    const labelLower = el.label.toLowerCase();

    // Doubled stud detection
    if (labelLower.includes("jack stud")) {
      // Find the header in the same wall zone
      const wallPrefix = el.id.split("-stud")[0]; // e.g. "north"
      insights.push(
        `HEADER CONSTRUCTION CHANGE: Added doubled jack stud "${el.id}" ` +
        `(${el.label}) at x=${el.x}". This changes how the header on the ` +
        `${wallPrefix} wall is supported. Look for a matching header element ` +
        `(${wallPrefix}-hdr-*) and update its support configuration.`
      );
    } else if (labelLower.includes("blocking") || labelLower.includes("nailer")) {
      insights.push(
        `BLOCKING ADDED: New blocking/nailer "${el.id}" (${el.label}) ` +
        `at x=${el.x}", y=${el.y}", ${el.w}"×${el.h}".`
      );
    } else if (labelLower.includes("stud")) {
      insights.push(
        `STUD ADDED: New stud "${el.id}" (${el.label}) at x=${el.x}".`
      );
    } else {
      insights.push(
        `NEW ELEMENT: "${el.id}" (${el.label}) at x=${el.x}", y=${el.y}", ` +
        `${el.w}"×${el.h}".`
      );
    }
  }

  for (const el of diff.removed) {
    insights.push(
      `ELEMENT REMOVED: "${el.id}" (${el.label}) was in baseline but ` +
      `not in edited SVG.`
    );
  }

  for (const mod of diff.modified) {
    const labelChange = mod.changes.find(c => c.attr === "label");
    if (labelChange) {
      insights.push(
        `SPEC CHANGE on "${mod.id}": label changed from ` +
        `"${labelChange.old}" → "${labelChange.new}". ` +
        `This likely indicates a material or construction method change.`
      );
    }

    const posChanges = mod.changes.filter(c => ["x", "y", "w", "h"].includes(c.attr));
    if (posChanges.length > 0) {
      const summary = posChanges.map(c => `${c.attr}: ${c.old}→${c.new}`).join(", ");
      insights.push(
        `POSITION/SIZE CHANGE on "${mod.id}" (${mod.label}): ${summary}`
      );
    }
  }

  return insights;
}

// ── Exports ──────────────────────────────────────────────────────────────────

export { parseSvgElements, diffElements, classifyChanges };
export type { SvgElement, DiffResult };
