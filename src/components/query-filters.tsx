"use client";

import { parseAsInteger, parseAsString, parseAsStringEnum, useQueryState, useQueryStates } from "nuqs";

import { MonthPicker } from "@/components/date-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getCurrentMonth, getCurrentYear } from "@/lib/dates";

export function DashboardFilters({ month, year }: { month: string; year: number }) {
  const [filters, setFilters] = useQueryStates({
    month: parseAsString.withDefault(month),
    year: parseAsInteger.withDefault(year),
  });

  return (
    <div className="glass-panel flex flex-col gap-3 rounded-3xl p-3 sm:flex-row">
      <MonthPicker
        value={filters.month}
        onValueChange={(value) => {
          const nextMonth = value || getCurrentMonth();

          void setFilters({ month: nextMonth, year: Number(nextMonth.slice(0, 4)) });
        }}
        className="sm:w-44"
      />
    </div>
  );
}

export function TransactionsFilters({ month, type }: { month: string; type: "all" | "income" | "expense" }) {
  const [filters, setFilters] = useQueryStates({
    month: parseAsString.withDefault(month),
    type: parseAsStringEnum(["all", "income", "expense"] as const).withDefault(type),
  });

  return (
    <div className="mb-5 grid gap-3 sm:grid-cols-[180px_180px]">
      <MonthPicker value={filters.month} onValueChange={(value) => void setFilters({ month: value || getCurrentMonth() })} />
      <UrlSelect
        value={filters.type}
        onValueChange={(value) => void setFilters({ type: value as "all" | "income" | "expense" })}
        options={[
          { value: "all", label: "Todos os tipos" },
          { value: "income", label: "Entradas" },
          { value: "expense", label: "Saídas" },
        ]}
      />
    </div>
  );
}

export function MonthFilter({ month, pathLabel = "Mês" }: { month: string; pathLabel?: string }) {
  const [selectedMonth, setSelectedMonth] = useQueryState("month", parseAsString.withDefault(month));

  return (
    <div className="glass-panel flex gap-3 rounded-3xl p-3">
      <MonthPicker
        value={selectedMonth}
        onValueChange={(value) => void setSelectedMonth(value || getCurrentMonth())}
        placeholder={pathLabel}
        className="w-44"
      />
    </div>
  );
}

export function YearFilter({ year }: { year: number }) {
  const [selectedYear, setSelectedYear] = useQueryState("year", parseAsInteger.withDefault(year));

  return (
    <div className="glass-panel flex gap-3 rounded-3xl p-3">
      <input
        aria-label="Ano"
        className="field w-36"
        type="number"
        min={2000}
        max={2100}
        value={String(selectedYear)}
        onChange={(event) => void setSelectedYear(Number(event.target.value || getCurrentYear()))}
      />
    </div>
  );
}

function UrlSelect({
  value,
  onValueChange,
  options,
}: {
  value: string;
  onValueChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="field flex min-h-12 items-center justify-between gap-3 text-left [&_svg]:text-[#10b981]">
        <SelectValue />
      </SelectTrigger>
      <SelectContent position="popper" className="z-[90] max-h-72 rounded-2xl border-[#10b981]/20 bg-[#07100a] p-2 text-sm text-[#eefbf1] shadow-2xl shadow-black/60">
        {options.map((option) => (
          <SelectItem
            key={option.value}
            value={option.value}
            className="cursor-pointer rounded-xl px-3 py-2 transition"
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
