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
    "把并发问题、数据流、happens-before 与真实 Java 源码放在同一张可交互学习地图中。";

  return {
    title: "JUC Core Lab · 第一课：Java 内存模型",
    description,
    metadataBase: new URL(origin),
    openGraph: {
      title: "JUC Core Lab · 第一课：Java 内存模型",
      description,
      type: "website",
      locale: "zh_CN",
      url: origin,
      images: [
        {
          url: `${origin}/og.png`,
          width: 1733,
          height: 907,
          alt: "JUC Core Lab 第一课：两个线程读取 0 并写回共享值 1",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: "JUC Core Lab · 第一课：Java 内存模型",
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
