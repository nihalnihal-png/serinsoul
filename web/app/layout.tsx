import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SerinSoul — Your health, in rhythm",
  description: "A personal fitness and recovery dashboard.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
