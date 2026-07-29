import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";

const themeInitScript = `
  try {
    var savedTheme = window.localStorage.getItem("juc-course.theme.v1");
    var theme = savedTheme === "dark" ? "dark" : "light";
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
  } catch (error) {
    document.documentElement.dataset.theme = "light";
    document.documentElement.style.colorScheme = "light";
  }
`;

export async function generateMetadata(): Promise<Metadata> {
  const requestHeaders = await headers();
  const host = requestHeaders.get("x-forwarded-host")
    ?? requestHeaders.get("host")
    ?? "localhost:3000";
  const protocol = requestHeaders.get("x-forwarded-proto")
    ?? (host.startsWith("localhost") ? "http" : "https");
  const origin = `${protocol}://${host}`;
  const description =
    "6 课 Java JUC 快速面试学习站：一份讲义、5 项 Todo、简明内存图、真实源码和 3 道面试题。";

  return {
    title: "JUC 快速面试课 · 6 课精简版",
    description,
    metadataBase: new URL(origin),
    openGraph: {
      title: "JUC 快速面试课 · 6 课精简版",
      description,
      type: "website",
      locale: "zh_CN",
      url: origin,
    },
    twitter: {
      card: "summary",
      title: "JUC 快速面试课 · 6 课精简版",
      description,
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" data-theme="light" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
