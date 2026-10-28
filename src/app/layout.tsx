import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ubuntu Desk — municipal services demo",
  description: "Simulated multilingual municipal assistant. Not a live municipal connection.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-canvas font-sans text-ink antialiased">{children}</body>
    </html>
  );
}
