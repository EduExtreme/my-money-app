import type { Metadata } from "next";
import { AppShell } from "@/components/app-shell";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "My Money App",
  description: "Gestao financeira pessoal com parcelas, KPIs e NeonDB.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="h-full antialiased">
      <body className="min-h-full" style={{ "--font-app-sans": "-apple-system, BlinkMacSystemFont, 'SF Pro Display', Ubuntu, 'Segoe UI', Inter, sans-serif" } as React.CSSProperties}>
        <Providers>
          <AppShell>{children}</AppShell>
        </Providers>
      </body>
    </html>
  );
}
