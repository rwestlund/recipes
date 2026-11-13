import type { Metadata, Viewport } from "next";
import { Header } from "@/components/header";
import { isEditor } from "@/lib/auth";
import "./globals.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: { default: "Recipes", template: "%s · Recipes" },
  description: "A household recipe book.",
  appleWebApp: { capable: true, title: "Recipes" },
};

export const viewport: Viewport = {
  themeColor: "#f4f0e6",
  width: "device-width",
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const editor = await isEditor();
  return (
    <html lang="en">
      <body>
        <a className="skip" href="#content">
          Skip to content
        </a>
        <div className="wrap">
          <Header editor={editor} />
          <main id="content">{children}</main>
        </div>
      </body>
    </html>
  );
}
