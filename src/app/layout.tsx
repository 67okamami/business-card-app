import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "名刺管理",
  description: "名刺管理Webアプリ",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body className="bg-background text-foreground antialiased">
        <div className="mx-auto max-w-[1200px]">{children}</div>
      </body>
    </html>
  );
}
