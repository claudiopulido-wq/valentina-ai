import type { Metadata } from "next";
import { Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  weight: ["300", "400", "500", "600", "700", "800"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Valentina AI — Omnichannel Intelligence Platform & Client Hub",
  description:
    "Portal empresarial de gestión de agentes conversacionales multi-tenant, Live Inbox omnicanal (WhatsApp & Web) y telemetría de costos en tiempo real.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={`${jakarta.variable} ${jetbrainsMono.variable} dark`}>
      <body className="min-h-screen bg-[#07080c] text-[#f8fafc] font-sans antialiased selection:bg-purple-500/30 selection:text-white">
        {children}
      </body>
    </html>
  );
}
