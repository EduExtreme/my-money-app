import { redirect } from "next/navigation";

import { AuthBackground } from "@/components/auth-background";
import { getCurrentFamily } from "@/lib/auth-session";

export default async function AuthLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const family = await getCurrentFamily();

  if (family) {
    redirect("/");
  }

  return (
    <div className="app-grid relative min-h-screen overflow-hidden text-[#eefbf1]">
      <AuthBackground />
      <main className="relative z-10 flex min-h-screen items-center justify-center px-4 py-10">{children}</main>
    </div>
  );
}
