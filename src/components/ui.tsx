import Link from "next/link";

import { AppButton } from "@/components/app-button";
import { formatCurrency, formatPercent } from "@/lib/money";

type MetricCardProps = {
  title: string;
  value: number;
  kind?: "currency" | "percent" | "number";
  caption?: string;
  tone?: "green" | "red" | "neutral";
};

export function MetricCard({ title, value, kind = "currency", caption, tone = "green" }: MetricCardProps) {
  const formattedValue = kind === "currency" ? formatCurrency(value) : kind === "percent" ? formatPercent(value) : value;
  const toneClass = tone === "red" ? "text-[#ff4d4d]" : tone === "green" ? "text-[#39ff14]" : "text-white";

  return (
    <article className="glass-panel rounded-[1.5rem] p-5">
      <p className="text-sm text-[#96a59b]">{title}</p>
      <strong className={`mt-3 block text-2xl font-semibold tracking-tight sm:text-3xl ${toneClass}`}>{formattedValue}</strong>
      {caption ? <p className="mt-3 text-sm text-[#a7b4ac]">{caption}</p> : null}
    </article>
  );
}

export function SectionHeader({
  eyebrow,
  title,
  children,
}: Readonly<{ eyebrow?: string; title: string; children?: React.ReactNode }>) {
  return (
    <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        {eyebrow ? <p className="text-xs font-bold uppercase tracking-[0.28em] text-[#39ff14]/75">{eyebrow}</p> : null}
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-white sm:text-4xl">{title}</h1>
      </div>
      {children}
    </div>
  );
}

export function DatabaseBanner({ message, mode }: { message: string | null; mode: "database" | "demo" | "error" }) {
  if (!message) {
    return null;
  }

  const isError = mode === "error";

  return (
    <div
      className={`mb-6 rounded-[1.4rem] border px-4 py-3 text-sm ${
        isError
          ? "danger-glow border-[#ff3131]/35 bg-[#ff3131]/10 text-[#ffd6d6]"
          : "neon-glow border-[#39ff14]/30 bg-[#39ff14]/10 text-[#d9ffd4]"
      }`}
    >
      {message} Rode as migrations antes de cadastrar dados reais.
    </div>
  );
}

export function EmptyState({ title, description, href, label }: { title: string; description: string; href?: string; label?: string }) {
  return (
    <div className="glass-panel rounded-[1.5rem] p-8 text-center">
      <h2 className="text-xl font-semibold text-white">{title}</h2>
      <p className="mx-auto mt-2 max-w-lg text-sm text-[#a7b4ac]">{description}</p>
      {href && label ? (
        <Link className="mt-5 inline-flex rounded-2xl bg-[#39ff14] px-4 py-2 text-sm font-bold text-[#041006]" href={href}>
          {label}
        </Link>
      ) : null}
    </div>
  );
}

export function SubmitButton({ disabled, children }: Readonly<{ disabled?: boolean; children: React.ReactNode }>) {
  return (
    <AppButton
      type="submit"
      disabled={disabled}
      className="inline-flex items-center justify-center rounded-2xl bg-[#39ff14] px-5 py-3 text-sm font-bold text-[#041006] transition hover:bg-[#7cff65] disabled:cursor-not-allowed disabled:bg-white/15 disabled:text-white/40"
    >
      {children}
    </AppButton>
  );
}
