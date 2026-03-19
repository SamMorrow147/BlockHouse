"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";

export function HamburgerMenu() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="text-white hover:bg-white/15 hover:text-white"
          aria-label="Open menu"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </SheetTrigger>

      <SheetContent
        side="left"
        className="w-[280px] bg-[#2d2d2d] text-white border-r border-white/10 p-0"
      >
        <SheetHeader className="px-5 pt-5 pb-3">
          <SheetTitle className="text-white text-base font-semibold tracking-tight">
            Block House
          </SheetTitle>
        </SheetHeader>

        <Separator className="bg-white/15" />

        <nav className="flex flex-col gap-0.5 p-2 mt-1">
          <Link
            href="/"
            className="flex items-center px-3 py-2.5 rounded-md text-sm text-white/85 hover:bg-white/10 hover:text-white transition-colors"
          >
            First Floor Framing
          </Link>
          <Link
            href="/upper-floors"
            className="flex items-center px-3 py-2.5 rounded-md text-sm text-white/85 hover:bg-white/10 hover:text-white transition-colors"
          >
            Upper Floor Plans
          </Link>
          <Link
            href="/materials"
            className="flex items-center px-3 py-2.5 rounded-md text-sm text-white/85 hover:bg-white/10 hover:text-white transition-colors"
          >
            Materials List
          </Link>
          <a
            href="/Referances%20/Frankenstein%20house%20-Alex.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center px-3 py-2.5 rounded-md text-sm text-white/85 hover:bg-white/10 hover:text-white transition-colors"
          >
            Original blueprint
          </a>
        </nav>
      </SheetContent>
    </Sheet>
  );
}
