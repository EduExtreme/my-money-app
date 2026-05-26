import Link from "next/link";
import { Banknote, BarChart3, CalendarClock, CreditCard, FolderKanban, LayoutDashboard, ListChecks } from "lucide-react";
import { RiMoneyDollarCircleLine } from "react-icons/ri";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transactions", label: "Transacoes", icon: ListChecks },
  { href: "/future-expenses", label: "Gastos Futuros", icon: CalendarClock },
  { href: "/salaries", label: "Salarios", icon: Banknote },
  { href: "/accounts", label: "Contas", icon: CreditCard },
  { href: "/categories", label: "Categorias", icon: FolderKanban },
  { href: "/reports", label: "Relatorios", icon: BarChart3 },
];

export function AppShell({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <div className="app-grid min-h-screen text-[#eefbf1]">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-4 sm:px-6 lg:px-8">
        <header className="glass-panel sticky top-4 z-20 mb-6 rounded-[1.7rem] px-4 py-3 backdrop-blur-xl">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <Link href="/" className="group flex items-center gap-3">
              <span className="neon-glow flex size-12 flex-col items-center justify-center rounded-2xl border border-[#39ff14]/35 bg-[#39ff14]/10 text-[#39ff14]">
                <RiMoneyDollarCircleLine className="size-5" aria-hidden="true" />
                <span className="-mt-1 text-[0.62rem] font-black tracking-tight">MMP</span>
              </span>
              <span>
                <span className="block text-lg font-semibold tracking-tight">My Money App</span>
                <span className="block text-xs uppercase tracking-[0.32em] text-[#39ff14]/70">money control</span>
              </span>
            </Link>

            <nav className="flex gap-2 overflow-x-auto pb-1 lg:pb-0">
              {navItems.map((item) => {
                const Icon = item.icon;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="flex shrink-0 items-center gap-2 rounded-2xl border border-white/8 bg-white/[0.035] px-3 py-2 text-sm text-[#dbe8df] transition hover:border-[#39ff14]/40 hover:bg-[#39ff14]/10 hover:text-white"
                  >
                    <Icon className="size-4 text-[#39ff14]" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

          </div>
        </header>

        <main className="flex-1 pb-10">{children}</main>
      </div>
    </div>
  );
}
