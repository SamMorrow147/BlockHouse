import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Block House — First Floor Framing",
  description: "Parametric framing viewer for first floor walls",
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
