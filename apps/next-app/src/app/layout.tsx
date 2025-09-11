import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import LayoutWithSidebar from "@/components/LayoutWithSidebar";
import { Analytics } from "@vercel/analytics/react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "QuadroScrap - Avaliação de Professores UFF",
  description:
    "Avalie e encontre os melhores professores da Universidade Federal Fluminense",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Suspense fallback={<div>Loading...</div>}>
          <AuthProvider>
            <LayoutWithSidebar>{children}</LayoutWithSidebar>
          </AuthProvider>
        </Suspense>
        <Analytics />
      </body>
    </html>
  );
}
