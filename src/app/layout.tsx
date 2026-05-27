import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "My Money App",
  description: "Gestão financeira pessoal com parcelas, KPIs e NeonDB.",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const cookieStore = await cookies();
  const theme = cookieStore.get("theme")?.value || "dark";

  return (
    <html lang="pt-BR" className={`h-full antialiased ${theme === "light" ? "light" : ""}`}>
      <body className="min-h-full" style={{ "--font-app-sans": "-apple-system, BlinkMacSystemFont, 'SF Pro Display', Ubuntu, 'Segoe UI', Inter, sans-serif" } as React.CSSProperties}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
