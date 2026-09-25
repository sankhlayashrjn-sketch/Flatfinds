import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { HouseLogoIcon } from "@/components/icons";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "FlatFinds",
  description: "Shortlist apartments as a group, without dealbreakers surfacing too late.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
        <header className="brand-bg shadow-sm">
          <nav className="mx-auto flex w-full max-w-6xl items-center gap-6 px-6 py-4">
            <Link
              href="/"
              className="flex items-center gap-2 text-base font-extrabold tracking-tight text-white drop-shadow-sm"
            >
              <HouseLogoIcon className="h-6 w-6" />
              FlatFinds
            </Link>
          </nav>
        </header>
        <main className="flex-1">{children}</main>
      </body>
    </html>
  );
}
