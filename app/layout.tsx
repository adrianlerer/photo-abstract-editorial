import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Photo Abstract Editorial",
  description: "Create a photo-faithful editorial composition with an abstract memory panel.",
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
