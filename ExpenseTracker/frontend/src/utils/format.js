export const CURRENCIES = [
  { code: 'INR', label: 'Indian Rupee (INR)', locale: 'en-IN' },
  { code: 'USD', label: 'US Dollar (USD)', locale: 'en-US' },
  { code: 'EUR', label: 'Euro (EUR)', locale: 'de-DE' },
  { code: 'GBP', label: 'British Pound (GBP)', locale: 'en-GB' },
  { code: 'JPY', label: 'Japanese Yen (JPY)', locale: 'ja-JP' },
];

export const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatCurrency(value, currency = 'INR') {
  const option = CURRENCIES.find((c) => c.code === currency) ?? CURRENCIES[0];
  return new Intl.NumberFormat(option.locale, { style: 'currency', currency: option.code }).format(value);
}

export function monthLabel(year, month) {
  return `${MONTH_NAMES[month - 1]} ${year}`;
}

const pad = (n) => String(n).padStart(2, '0');

/** yyyy-MM-dd in local time (what <input type="date"> expects). */
export function toDateInput(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** yyyy-MM in local time (what <input type="month"> expects). */
export function toMonthInput(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}`;
}

/** Parses "2026-10" into { year, month }; returns null when invalid. */
export function parseMonthInput(value) {
  const match = /^(\d{4})-(\d{2})$/.exec(value);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  return month >= 1 && month <= 12 ? { year, month } : null;
}

export function formatDate(iso) {
  // API returns "2026-10-05T00:00:00" (no zone) -> parsed as local time
  return new Date(iso).toLocaleDateString(undefined, { day: '2-digit', month: 'short', year: 'numeric' });
}

export function toDateOnly(iso) {
  return iso.slice(0, 10);
}
