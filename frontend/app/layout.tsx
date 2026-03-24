import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "SVASA Finances",
  description: "Devotee records and donation tracking for SVASA",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className="min-h-full flex" suppressHydrationWarning>
        <Sidebar />
        <main className="flex-1 ml-20 lg:ml-64 p-4 md:p-6 lg:p-8">
          {children}
        </main>
      </body>
    </html>
  );
}
