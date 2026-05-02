import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pulse — speak it. ship it. see it.",
  description:
    "AI team collaboration. Voice-first standups, auto tasks, live blocker graph, Slack 2-way.",
  applicationName: "Pulse",
  authors: [{ name: "Pulse Team" }],
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#0a0b0d",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <div id="main">{children}</div>
      </body>
    </html>
  );
}
