import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import AuthProviderWrapper from "@/components/AuthProviderWrapper";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SavolaLab",
  description: "QC Platform for Sugar Industry",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProviderWrapper>{children}</AuthProviderWrapper>
      </body>
    </html>
  );
}