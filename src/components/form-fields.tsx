"use client";

import { Input } from "@base-ui/react/input";
import { Controller, type FieldPath, type FieldValues, type UseFormReturn } from "react-hook-form";

import { DatePicker, MonthPicker } from "@/components/date-picker";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export type SelectOption = {
  value: string;
  label: string;
};

type BaseFieldProps<T extends FieldValues> = {
  form: UseFormReturn<T>;
  name: FieldPath<T>;
  label: string;
  disabled?: boolean;
};

type TextFieldProps<T extends FieldValues> = BaseFieldProps<T> & {
  type?: React.HTMLInputTypeAttribute;
  placeholder?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  min?: string | number;
  max?: string | number;
  className?: string;
};

export function FormInput<T extends FieldValues>({
  form,
  name,
  label,
  type = "text",
  placeholder,
  inputMode,
  min,
  max,
  disabled,
  className,
}: TextFieldProps<T>) {
  const error = form.formState.errors[name]?.message;

  return (
    <label className={`grid gap-2 text-sm text-[#c8d5cc] ${className ?? ""}`}>
      {label}
      <Input
        className="field"
        type={type}
        placeholder={placeholder}
        inputMode={inputMode}
        min={min}
        max={max}
        disabled={disabled}
        {...form.register(name)}
      />
      {typeof error === "string" ? <span className="text-xs text-[#ff7070]">{error}</span> : null}
    </label>
  );
}

export function FormSelect<T extends FieldValues>({
  form,
  name,
  label,
  options,
  disabled,
  placeholder = "Selecione",
}: BaseFieldProps<T> & { options: SelectOption[]; placeholder?: string }) {
  const error = form.formState.errors[name]?.message;

  return (
    <div className="grid gap-2 text-sm text-[#c8d5cc]">
      <span>{label}</span>
      <Controller
        control={form.control}
        name={name}
        render={({ field }) => (
          <Select
            value={field.value ? String(field.value) : ""}
            onValueChange={field.onChange}
            disabled={disabled}
          >
            <SelectTrigger className="field flex min-h-12 items-center justify-between gap-3 text-left [&_svg]:text-[#39ff14]">
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent position="popper" className="z-[90] max-h-72 rounded-2xl border-[#39ff14]/20 bg-[#07100a] p-2 text-sm text-[#eefbf1] shadow-2xl shadow-black/60">
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
        )}
      />
      {typeof error === "string" ? <span className="text-xs text-[#ff7070]">{error}</span> : null}
    </div>
  );
}

export function FormDatePicker<T extends FieldValues>({
  form,
  name,
  label,
  disabled,
  placeholder,
}: BaseFieldProps<T> & { placeholder?: string }) {
  const error = form.formState.errors[name]?.message;

  return (
    <label className="grid gap-2 text-sm text-[#c8d5cc]">
      {label}
      <Controller
        control={form.control}
        name={name}
        render={({ field }) => (
          <DatePicker value={field.value ? String(field.value) : ""} onValueChange={field.onChange} disabled={disabled} placeholder={placeholder} />
        )}
      />
      {typeof error === "string" ? <span className="text-xs text-[#ff7070]">{error}</span> : null}
    </label>
  );
}

export function FormMonthPicker<T extends FieldValues>({
  form,
  name,
  label,
  disabled,
  placeholder,
  clearable,
}: BaseFieldProps<T> & { placeholder?: string; clearable?: boolean }) {
  const error = form.formState.errors[name]?.message;

  return (
    <label className="grid gap-2 text-sm text-[#c8d5cc]">
      {label}
      <Controller
        control={form.control}
        name={name}
        render={({ field }) => (
          <MonthPicker
            value={field.value ? String(field.value) : ""}
            onValueChange={field.onChange}
            disabled={disabled}
            placeholder={placeholder}
            clearable={clearable}
          />
        )}
      />
      {typeof error === "string" ? <span className="text-xs text-[#ff7070]">{error}</span> : null}
    </label>
  );
}
