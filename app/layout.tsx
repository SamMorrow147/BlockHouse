import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Block House Frame",
  description: "Parametric framing viewer — floor plans, wall elevations, cut list, and materials for the Block House build.",
  icons: {
    icon: [
      { url: "/SVG/Logo@8x.svg", type: "image/svg+xml" },
    ],
  },
  openGraph: {
    title: "Block House Frame",
    description: "Parametric framing viewer — floor plans, wall elevations, cut list, and materials for the Block House build.",
    images: [
      {
        url: "/SVG/Logo@8x.svg",
        width: 1339,
        height: 907,
        alt: "Block House Frame logo",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Block House Frame",
    description: "Parametric framing viewer — floor plans, wall elevations, cut list, and materials for the Block House build.",
    images: ["/SVG/Logo@8x.svg"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
