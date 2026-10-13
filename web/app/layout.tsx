import type { Metadata, Viewport } from "next";
import { Inter_Tight, JetBrains_Mono } from "next/font/google";
import { SessionProvider } from "@/lib/session";
import "./globals.css";

const interTight = Inter_Tight({ variable: "--font-inter-tight", subsets: ["latin"] });
const jetbrains = JetBrains_Mono({ variable: "--font-jetbrains", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Tally",
  description: "Pocket money that can't be talked into the wrong purchase.",
  manifest: "/manifest.webmanifest",
  icons: { icon: "/icon-192.png", apple: "/icon-192.png" },
};

export const viewport: Viewport = { themeColor: "#03060f", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body className={`${interTight.variable} ${jetbrains.variable} antialiased sky`}>
        <SessionProvider>
          <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col overflow-x-clip px-4 pb-10 pt-5">{children}</main>
        </SessionProvider>
      </body>
    </html>
  );
}
