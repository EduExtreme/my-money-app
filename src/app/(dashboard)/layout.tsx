import { AppShell } from "@/components/app-shell";
import { requireFamily } from "@/lib/auth-session";

export default async function DashboardLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const family = await requireFamily();

  return <AppShell family={family}>{children}</AppShell>;
}
