import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// ✨ 核心 SEO 魔法：世界真名与宇宙引力
export const metadata: Metadata = {
  title: "EOVO · 采样器",
  description: "人间剪影的数字档案馆。收录文明切片，记录奇物异景，是浩瀚世界的观察者。Earth's Original Visual Observer.",
  keywords: ["EOVO", "采样器", "奇物档案", "文明切片", "地球剪影", "世界观察", "数字档案"],
  icons: {
    // 强制告诉浏览器去哪里找我们的新信物
    icon: "/favicon.ico", 
  },
};
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
