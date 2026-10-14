import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Ubuntu Desk — multilingual municipal AI agent",
  description: "OpenEdge + Progress Agentic RAG demo",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
