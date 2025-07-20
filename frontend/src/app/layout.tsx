import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import AuthProviderWrapper from "@/components/AuthProviderWrapper";
import clsx from "clsx";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "SavolaLab",
  description: "QC Platform for the Sugar Industry",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "SavolaLab",
    description: "QC Platform for the Sugar Industry",
    type: "website",
    locale: "en_US",
    siteName: "SavolaLab",
  },
  twitter: {
    card: "summary_large_image",
    title: "SavolaLab",
    description: "QC Platform for the Sugar Industry",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="scroll-smooth antialiased">
      <body
        className={clsx(
          inter.variable,
          "min-h-screen bg-gray-50 text-gray-900 transition-colors duration-300"
        )}
      >
        <AuthProviderWrapper>
          {/* App Wrapper */}
          <div className="relative flex flex-col min-h-screen">
            {children}
          </div>
        </AuthProviderWrapper>
      </body>
    </html>
  );
}
