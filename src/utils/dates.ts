export function dateKey(date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseDateKey(key: string): Date {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(date: Date, days: number): Date {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + days);
  return copy;
}

export const DAY_INITIALS = ["D", "L", "M", "X", "J", "V", "S"];

/** Devuelve los últimos 7 días (de hace 6 días hasta hoy). */
export function lastSevenDays(): { key: string; day: string; isToday: boolean }[] {
  const today = new Date();
  return Array.from({ length: 7 }).map((_, i) => {
    const date = addDays(today, i - 6);
    return {
      key: dateKey(date),
      day: DAY_INITIALS[date.getDay()],
      isToday: i === 6,
    };
  });
}

export function humanDate(date: Date): string {
  const months = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  return `${date.getDate()} ${months[date.getMonth()]}`;
}
