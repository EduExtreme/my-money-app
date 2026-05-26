"use client";

import { Input } from "@base-ui/react/input";
import { Select } from "@base-ui/react/select";
import { Check, ChevronDown } from "lucide-react";
import { parseAsInteger, parseAsString, parseAsStringEnum, useQueryState, useQueryStates } from "nuqs";

import { getCurrentMonth, getCurrentYear } from "@/lib/dates";

export function DashboardFilters({ month, year }: { month: string; year: number }) {
  const [filters, setFilters] = useQueryStates({
    month: parseAsString.withDefault(month),
    year: parseAsInteger.withDefault(year),
  });

  return (
    <div className="glass-panel flex flex-col gap-3 rounded-3xl p-3 sm:flex-row">
      <Input
        aria-label="Mes"
        className="field sm:w-44"
        type="month"
        value={filters.month}
        onValueChange={(value) => void setFilters({ month: value || getCurrentMonth() })}
      />
      <Input
        aria-label="Ano"
        className="field sm:w-32"
        type="number"
        min={2000}
        max={2100}
        value={String(filters.year)}
        onValueChange={(value) => void setFilters({ year: Number(value || getCurrentYear()) })}
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
      <Input
        aria-label="Mes"
        className="field"
        type="month"
        value={filters.month}
        onValueChange={(value) => void setFilters({ month: value || getCurrentMonth() })}
      />
      <UrlSelect
        value={filters.type}
        onValueChange={(value) => void setFilters({ type: value as "all" | "income" | "expense" })}
        options={[
          { value: "all", label: "Todos os tipos" },
          { value: "income", label: "Entradas" },
          { value: "expense", label: "Saidas" },
        ]}
      />
    </div>
  );
}

export function MonthFilter({ month, pathLabel = "Mes" }: { month: string; pathLabel?: string }) {
  const [selectedMonth, setSelectedMonth] = useQueryState("month", parseAsString.withDefault(month));

  return (
    <div className="glass-panel flex gap-3 rounded-3xl p-3">
      <Input
        aria-label={pathLabel}
        className="field w-44"
        type="month"
        value={selectedMonth}
        onValueChange={(value) => void setSelectedMonth(value || getCurrentMonth())}
      />
    </div>
  );
}

export function YearFilter({ year }: { year: number }) {
  const [selectedYear, setSelectedYear] = useQueryState("year", parseAsInteger.withDefault(year));

  return (
    <div className="glass-panel flex gap-3 rounded-3xl p-3">
      <Input
        aria-label="Ano"
        className="field w-36"
        type="number"
        min={2000}
        max={2100}
        value={String(selectedYear)}
        onValueChange={(value) => void setSelectedYear(Number(value || getCurrentYear()))}
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
    <Select.Root value={value} onValueChange={(nextValue) => onValueChange(nextValue ?? value)}>
      <Select.Trigger className="field flex min-h-12 items-center justify-between gap-3 text-left">
        <Select.Value />
        <Select.Icon>
          <ChevronDown className="size-4 text-[#39ff14]" />
        </Select.Icon>
      </Select.Trigger>
      <Select.Portal>
        <Select.Positioner sideOffset={8} className="z-[80]">
          <Select.Popup className="max-h-72 min-w-[var(--anchor-width)] overflow-y-auto rounded-2xl border border-[#39ff14]/20 bg-[#07100a] p-2 text-sm text-[#eefbf1] shadow-2xl shadow-black/60">
            <Select.List>
              {options.map((option) => (
                <Select.Item
                  key={option.value}
                  value={option.value}
                  className="flex cursor-pointer items-center justify-between gap-3 rounded-xl px-3 py-2 outline-none transition hover:bg-[#39ff14]/10 data-[highlighted]:bg-[#39ff14]/10"
                >
                  <Select.ItemText>{option.label}</Select.ItemText>
                  <Select.ItemIndicator>
                    <Check className="size-4 text-[#39ff14]" />
                  </Select.ItemIndicator>
                </Select.Item>
              ))}
            </Select.List>
          </Select.Popup>
        </Select.Positioner>
      </Select.Portal>
    </Select.Root>
  );
}
