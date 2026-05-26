"use client";

import { Input } from "@base-ui/react/input";
import { Select } from "@base-ui/react/select";
import { Check, ChevronDown } from "lucide-react";
import { Controller, type FieldPath, type FieldValues, type UseFormReturn } from "react-hook-form";

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
    <label className="grid gap-2 text-sm text-[#c8d5cc]">
      {label}
      <Controller
        control={form.control}
        name={name}
        render={({ field }) => (
          <Select.Root
            value={field.value ? String(field.value) : null}
            onValueChange={(value) => field.onChange(value ?? "")}
            disabled={disabled}
          >
            <Select.Trigger className="field flex min-h-12 items-center justify-between gap-3 text-left">
              <Select.Value placeholder={placeholder} />
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
        )}
      />
      {typeof error === "string" ? <span className="text-xs text-[#ff7070]">{error}</span> : null}
    </label>
  );
}
