"use client";

import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { formatDateInput, formatMonthInput, parseDateInput, parseMonthInput } from "@/lib/dates";
import { cn } from "@/lib/utils";

type PickerProps = {
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  clearable?: boolean;
};

export function DatePicker({ value, onValueChange, placeholder = "Selecione a data", disabled, className }: PickerProps) {
  const selectedDate = value ? parseDateInput(value) : undefined;
  // The shadcn popover is controlled so it can close immediately after a calendar selection.
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          data-empty={!value}
          disabled={disabled}
          className={cn(
            "field flex min-h-12 justify-start gap-3 text-left font-normal data-[empty=true]:text-[#96a59b]",
            className,
          )}
        >
          <CalendarIcon className="size-4 text-[#39ff14]" />
          {value ? formatDateInput(value) : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto overflow-hidden rounded-2xl border-[#39ff14]/20 bg-[#07100a] p-0 text-[#eefbf1] shadow-2xl shadow-black/60">
        <Calendar
          mode="single"
          selected={selectedDate}
          defaultMonth={selectedDate}
          captionLayout="dropdown"
          locale={ptBR}
          onSelect={(date) => {
            if (!date) {
              return;
            }

            onValueChange(format(date, "yyyy-MM-dd"));
            setOpen(false);
          }}
        />
      </PopoverContent>
    </Popover>
  );
}

export function MonthPicker({
  value,
  onValueChange,
  placeholder = "Selecione o mes",
  disabled,
  className,
  clearable = false,
}: PickerProps) {
  const selectedDate = value ? parseMonthInput(value) : undefined;
  // The shadcn popover is controlled so it can close immediately after a calendar selection.
  const [open, setOpen] = useState(false);
  // Month-only fields need local year navigation without rendering/selecting individual days.
  const [visibleYear, setVisibleYear] = useState(selectedDate ? Number(format(selectedDate, "yyyy")) : Number(format(new Date(), "yyyy")));
  const selectedMonth = value ? Number(value.slice(5, 7)) - 1 : undefined;
  const selectedYear = value ? Number(value.slice(0, 4)) : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          type="button"
          variant="outline"
          data-empty={!value}
          disabled={disabled}
          className={cn(
            "field flex min-h-12 justify-start gap-3 text-left font-normal data-[empty=true]:text-[#96a59b]",
            className,
          )}
        >
          <CalendarIcon className="size-4 text-[#39ff14]" />
          {value ? formatMonthInput(value) : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-72 overflow-hidden rounded-2xl border-[#39ff14]/20 bg-[#07100a] p-3 text-[#eefbf1] shadow-2xl shadow-black/60">
        <div className="mb-3 flex items-center justify-between gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-[#c8d5cc] hover:bg-[#39ff14]/10 hover:text-[#39ff14]"
            onClick={() => setVisibleYear((year) => year - 1)}
          >
            <ChevronLeft className="size-4" />
          </Button>
          <div className="text-sm font-semibold text-white">{visibleYear}</div>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="text-[#c8d5cc] hover:bg-[#39ff14]/10 hover:text-[#39ff14]"
            onClick={() => setVisibleYear((year) => year + 1)}
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 12 }, (_, monthIndex) => {
            const monthDate = new Date(visibleYear, monthIndex, 1);
            const isSelected = selectedYear === visibleYear && selectedMonth === monthIndex;

            return (
              <Button
                key={monthIndex}
                type="button"
                variant={isSelected ? "default" : "ghost"}
                className={cn(
                  "h-10 rounded-xl text-sm capitalize",
                  isSelected
                    ? "bg-[#39ff14] text-[#041006] hover:bg-[#7cff65]"
                    : "text-[#c8d5cc] hover:bg-[#39ff14]/10 hover:text-[#39ff14]",
                )}
                onClick={() => {
                  onValueChange(format(monthDate, "yyyy-MM"));
                  setOpen(false);
                }}
              >
                {format(monthDate, "LLL", { locale: ptBR })}
              </Button>
            );
          })}
        </div>
        {clearable ? (
          <button
            type="button"
            className="flex w-full items-center justify-center gap-2 border-t border-white/10 px-3 py-2 text-sm text-[#c8d5cc] transition hover:bg-white/5"
            onClick={() => {
              onValueChange("");
              setOpen(false);
            }}
          >
            <X className="size-4" />
            Limpar mes
          </button>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
