import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";
import AuthProvider from "@/components/AuthProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Image Background Remover - AI去除图片背景 | 免费在线工具",
  description: "免费在线AI图片背景去除工具，1秒快速去除图片背景，生成高清透明PNG图片。支持电商、设计、证件照等多种场景，无需注册即可使用。",
  keywords: ["图片背景去除", "AI去背景", "在线抠图", "transparent background", "background remover", "免费抠图", "证件照换底色"],
  openGraph: {
    title: "Image Background Remover - AI去除图片背景",
    description: "免费在线AI图片背景去除工具，1秒快速去除图片背景，生成高清透明PNG图片。",
    url: "https://image-background-remover.space",
    siteName: "Image Background Remover",
    locale: "zh_CN",
    type: "website",
    images: [
      {
        url: "https://image-background-remover.space/og-image.png",
        width: 1200,
        height: 630,
        alt: "Image Background Remover - AI去除图片背景",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Image Background Remover - AI去除图片背景",
    description: "免费在线AI图片背景去除工具，1秒快速去除图片背景，生成高清透明PNG图片。",
    images: ["https://image-background-remover.space/og-image.png"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    google: "your-google-verification-code",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        {/* Google Analytics */}
        <Script
          async
          src="https://www.googletagmanager.com/gtag/js?id=G-RFQSJLSVYJ"
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-RFQSJLSVYJ');
          `}
        </Script>
      </head>
      <body className="min-h-full flex flex-col">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
