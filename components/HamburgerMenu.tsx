"use client";

import { useState } from "react";
import Link from "next/link";

export function HamburgerMenu() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="hamburger-trigger"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
      >
        <span className="hamburger-line" />
        <span className="hamburger-line" />
        <span className="hamburger-line" />
      </button>

      <div
        className={`nav-overlay ${open ? "nav-overlay--open" : ""}`}
        onClick={() => setOpen(false)}
        aria-hidden={!open}
      />

      <aside className={`nav-drawer ${open ? "nav-drawer--open" : ""}`}>
        <div className="nav-drawer-header">
          <span className="nav-drawer-title">Menu</span>
          <button
            type="button"
            className="nav-drawer-close"
            onClick={() => setOpen(false)}
            aria-label="Close menu"
          >
            ×
          </button>
        </div>
        <nav className="nav-drawer-links">
          <Link href="/" className="nav-drawer-link" onClick={() => setOpen(false)}>
            First Floor Framing
          </Link>
          {/* Add more links here as you add pages */}
        </nav>
      </aside>
    </>
  );
}
