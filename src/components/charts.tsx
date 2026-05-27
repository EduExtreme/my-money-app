"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatCurrency } from "@/lib/money";

type TrendItem = {
  month: string;
  income: number;
  expense: number;
  balance: number;
};

type BreakdownItem = {
  name: string;
  value: number;
};

export function AnnualTrendChart({ data }: { data: TrendItem[] }) {
  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ left: 0, right: 8, top: 12, bottom: 0 }}>
          <defs>
            <linearGradient id="income" x1="0" x2="0" y1="0" y2="1">
              <stop offset="5%" stopColor="#10b981" stopOpacity={0.46} />
              <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="expense" x1="0" x2="0" y1="0" y2="1">
              <stop offset="5%" stopColor="#ff3131" stopOpacity={0.42} />
              <stop offset="95%" stopColor="#ff3131" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="var(--border)" vertical={false} />
          <XAxis dataKey="month" stroke="var(--muted-foreground)" tickLine={false} axisLine={false} />
          <YAxis stroke="var(--muted-foreground)" tickLine={false} axisLine={false} tickFormatter={(value) => `${Number(value) / 1000}k`} />
          <Tooltip
            contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 16 }}
            formatter={(value, name) => [formatCurrency(Number(value ?? 0)), labelMap[String(name)] ?? String(name)]}
            labelStyle={{ color: "var(--foreground)" }}
            itemStyle={{ color: "var(--foreground)" }}
            cursor={{ stroke: "var(--chart-cursor-stroke)", strokeWidth: 2 }}
          />
          <Area type="monotone" dataKey="income" stroke="#10b981" strokeWidth={2} fill="url(#income)" />
          <Area type="monotone" dataKey="expense" stroke="#ff3131" strokeWidth={2} fill="url(#expense)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function BreakdownChart({ data }: { data: BreakdownItem[] }) {
  const safeData = data.length ? data.slice(0, 6) : [{ name: "Sem dados", value: 0 }];

  return (
    <div className="h-[320px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={safeData} layout="vertical" margin={{ left: 8, right: 20, top: 12, bottom: 0 }}>
          <CartesianGrid stroke="var(--border)" horizontal={false} />
          <XAxis type="number" stroke="var(--muted-foreground)" tickLine={false} axisLine={false} tickFormatter={(value) => `${Number(value) / 1000}k`} />
          <YAxis type="category" dataKey="name" width={92} stroke="var(--muted-foreground)" tickLine={false} axisLine={false} />
          <Tooltip
            contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 16 }}
            formatter={(value) => [formatCurrency(Number(value ?? 0)), "Total"]}
            labelStyle={{ color: "var(--foreground)" }}
            itemStyle={{ color: "var(--foreground)" }}
            cursor={{ fill: "var(--chart-hover)" }}
          />
          <Bar dataKey="value" fill="#10b981" radius={[0, 12, 12, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

const labelMap: Record<string, string> = {
  income: "Entradas",
  expense: "Saídas",
  balance: "Saldo",
};
