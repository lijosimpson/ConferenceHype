import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ASCO Hype",
  description: "Interactive AI commentary for people following ASCO 2026.",
  metadataBase: new URL("https://asco-hype.example.com"),
  openGraph: {
    title: "ASCO Hype",
    description:
      "Interactive AI commentary for ASCO 2026 topic suggestions, social buzz, and follow-along listening.",
    type: "website"
  }
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
