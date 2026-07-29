import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host")
    ?? requestHeaders.get("host")
    ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto")
    ?? (host.startsWith("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;
  const description =
    "16 课 Java JUC 交互学习站：逐课推演总体流程、数据分布、数据流向，并联动真实源码、练习和面试验收。";

  return {
    title: "JUC Core Lab · 16 课交互学习站",
    description,
    metadataBase: new URL(origin),
    openGraph: {
      title: "JUC Core Lab · 16 课交互学习站",
      description,
      type: "website",
      locale: "zh_CN",
      url: origin,
      images: [
        {
          url: `${origin}/og.png`,
          width: 1731,
          height: 909,
          alt: "JUC Core Lab：16 课 Java 并发系统交互学习地图",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "JUC Core Lab · 16 课交互学习站",
      description,
      images: [`${origin}/og.png`],
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
