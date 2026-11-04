import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Inter, Oswald } from "next/font/google";
import { liveChatApiBaseFromRuntime } from "@/lib/live-chat/runtime-config";
import Providers from "./providers";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const oswald = Oswald({
  variable: "--font-oswald",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  title: "RDX Sports · Shopping Assistant",
  description: "Instant answers on RDX gear, sizing, orders and returns.",
  icons: { icon: "/chatbot-icon.png" },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${oswald.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col" suppressHydrationWarning>
        <Providers liveChatApiBase={liveChatApiBaseFromRuntime()}>{children}</Providers>
      </body>
    </html>
  );
}
