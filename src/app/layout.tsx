import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Mac App Admin - 管理面板",
  description: "Mac App 资源管理系统 - 高效管理您的应用资源、分类和用户",
  keywords: ["Mac App", "管理面板", "资源管理", "分类管理"],
  authors: [{ name: "Mac App Admin Team" }],
  viewport: "width=device-width, initial-scale=1",
  robots: "noindex, nofollow", // 管理系统不需要被搜索引擎索引
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        suppressHydrationWarning
        className={`${inter.variable} ${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
