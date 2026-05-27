"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Banknote, BarChart3, CalendarClock, CreditCard, FolderKanban, LayoutDashboard, ListChecks, Users } from "lucide-react";

import { BrandLogo } from "@/components/brand-logo";
import { SignOutButton } from "@/components/sign-out-button";
import { ThemeToggle } from "@/components/theme-toggle";
import type { CurrentFamily } from "@/lib/auth-session";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transactions", label: "Transações", icon: ListChecks },
  { href: "/future-expenses", label: "Gastos Futuros", icon: CalendarClock },
  { href: "/accounts", label: "Contas", icon: CreditCard },
  { href: "/categories", label: "Categorias", icon: FolderKanban },
  { href: "/reports", label: "Relatórios", icon: BarChart3 },
  { href: "/family", label: "Família", icon: Users },
];

export function AppShell({ children, family }: Readonly<{ children: React.ReactNode; family: CurrentFamily }>) {
  // Justificativa técnica para useState/useEffect:
  // Precisamos ler e escutar o evento global de scroll do navegador (objeto 'window')
  // para monitorar o posicionamento de rolagem do usuário em tempo real. Com base
  // na direção do scroll, adicionamos/removemos classes para recolher (esconder)
  // ou exibir o cabeçalho superior de forma fluida.
  const [visible, setVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;

      if (currentScrollY < 60) {
        setVisible(true);
      } else {
        if (currentScrollY > lastScrollY) {
          setVisible(false);
        } else {
          setVisible(true);
        }
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  return (
    <div className="app-grid min-h-screen text-[#eefbf1]">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8">
        <header
          className={`glass-panel sticky top-4 z-20 mb-6 rounded-[1.7rem] px-4 py-3 backdrop-blur-xl transition-all duration-500 ease-in-out ${
            visible ? "translate-y-0 opacity-100" : "-translate-y-28 opacity-0 pointer-events-none"
          }`}
        >
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <Link href="/" className="group flex items-center gap-3">
              <BrandLogo className="h-13 w-[214px]" />
            </Link>

            <div className="flex flex-col gap-3 lg:items-end">
              <nav className="flex gap-2 overflow-x-auto pb-1 lg:pb-0">
                {navItems.map((item) => {
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex shrink-0 items-center gap-2 rounded-2xl border border-white/8 bg-white/[0.035] px-3 py-2 text-sm text-[#dbe8df] transition hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
                    >
                      <Icon className="size-4 text-primary" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
              <div className="flex items-center gap-3 text-sm text-[#96a59b]">
                <span>{family.organizationName}</span>
                <ThemeToggle />
                <SignOutButton />
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 pb-10">{children}</main>
      </div>
    </div>
  );
}
