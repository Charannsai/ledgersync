import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  title: "LedgerSync AI - QuickBooks & Banking COA Parser",
  description: "AI-powered transaction parser mapping bank exports to standard Chart of Accounts with anomaly flagging and client email drafting.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} h-full antialiased`}>
      <body className={`${inter.className} min-h-full flex flex-col font-sans`}>
        {children}
      </body>
    </html>
  );
}
