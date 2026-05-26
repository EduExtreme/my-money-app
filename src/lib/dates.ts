import { addMonths, format, getDaysInMonth, isValid, parse, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export function getCurrentMonth() {
  return format(new Date(), "yyyy-MM");
}

export function getCurrentDateInput() {
  return format(new Date(), "yyyy-MM-dd");
}

export function getCurrentYear() {
  return Number(format(new Date(), "yyyy"));
}

export function getMonthLabel(month: string) {
  return format(parseMonth(month), "LLLL 'de' yyyy", { locale: ptBR });
}

export function getShortMonthLabel(month: string) {
  return format(parseMonth(month), "LLL", { locale: ptBR });
}

export function formatDateInput(dateInput: string) {
  return format(parseDateInput(dateInput), "dd/MM/yyyy", { locale: ptBR });
}

export function formatMonthInput(month: string) {
  return format(parseMonth(month), "MM/yyyy", { locale: ptBR });
}

export function getYearMonths(year: number) {
  return Array.from({ length: 12 }, (_, index) => {
    return `${year}-${String(index + 1).padStart(2, "0")}`;
  });
}

export function addMonthsToDateInput(dateInput: string, monthsToAdd: number) {
  const parsedDate = parseISO(dateInput);
  const sourceDate = isValid(parsedDate) ? parsedDate : new Date();
  const targetMonth = addMonths(sourceDate, monthsToAdd);
  const targetDay = Math.min(sourceDate.getDate(), getDaysInMonth(targetMonth));
  const normalizedDate = new Date(targetMonth);

  normalizedDate.setDate(targetDay);

  return format(normalizedDate, "yyyy-MM-dd");
}

export function getCompetencyMonth(dateInput: string) {
  return dateInput.slice(0, 7);
}

export function createDateInputFromMonthDay(month: string, day: number) {
  const monthDate = parseMonth(month);
  const safeDay = Math.min(Math.max(day, 1), getDaysInMonth(monthDate));
  const date = new Date(monthDate);

  date.setDate(safeDay);

  return format(date, "yyyy-MM-dd");
}

export function parseDateInput(dateInput: string) {
  const parsedDate = parse(dateInput, "yyyy-MM-dd", new Date());

  return isValid(parsedDate) ? parsedDate : new Date();
}

export function parseMonthInput(month: string) {
  return parseMonth(month);
}

function parseMonth(month: string) {
  const parsedDate = parse(month, "yyyy-MM", new Date());

  return isValid(parsedDate) ? parsedDate : new Date();
}
