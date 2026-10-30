import type { Currency, DateRange } from "../types";
import { addDays, DAY_MS, HOUR_MS } from "./date";

const LOCALE = "en-GB";

const numberFormat = new Intl.NumberFormat(LOCALE);
const compactFormat = new Intl.NumberFormat(LOCALE, { notation: "compact", maximumFractionDigits: 1 });
const percentFormat = new Intl.NumberFormat(LOCALE, { style: "percent", maximumFractionDigits: 1 });
const dateFormat = new Intl.DateTimeFormat(LOCALE, { day: "numeric", month: "short", year: "numeric" });
const shortDateFormat = new Intl.DateTimeFormat(LOCALE, { day: "numeric", month: "short" });
const dateTimeFormat = new Intl.DateTimeFormat(LOCALE, {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});
const timeFormat = new Intl.DateTimeFormat(LOCALE, { hour: "2-digit", minute: "2-digit" });
const relativeFormat = new Intl.RelativeTimeFormat(LOCALE, { numeric: "auto", style: "short" });
const currencyFormats = new Map<Currency, Intl.NumberFormat>();

export function formatNumber(value: number): string {
  return numberFormat.format(value);
}

export function formatCompact(value: number): string {
  return compactFormat.format(value);
}

/** `share` is a ratio between 0 and 1. */
export function formatPercent(share: number): string {
  return percentFormat.format(share);
}

/** `changePct` is a percentage such as 12.5; null when there is no baseline. */
export function formatChange(changePct: number | null): string {
  if (changePct === null) return "New";
  const sign = changePct > 0 ? "+" : "";
  return `${sign}${changePct.toFixed(1)}%`;
}

export function formatDate(date: Date): string {
  return dateFormat.format(date);
}

export function formatShortDate(date: Date): string {
  return shortDateFormat.format(date);
}

export function formatDateTime(date: Date): string {
  return dateTimeFormat.format(date);
}

export function formatTime(date: Date): string {
  return timeFormat.format(date);
}

export function formatCurrency(amount: number, currency: Currency): string {
  let format = currencyFormats.get(currency);
  if (!format) {
    format = new Intl.NumberFormat(LOCALE, { style: "currency", currency });
    currencyFormats.set(currency, format);
  }
  return format.format(amount);
}

export function formatRelative(date: Date, now: Date): string {
  const diff = date.getTime() - now.getTime();
  const abs = Math.abs(diff);
  if (abs < 60 * 1000) return "just now";
  if (abs < HOUR_MS) return relativeFormat.format(Math.round(diff / 60000), "minute");
  if (abs < DAY_MS) return relativeFormat.format(Math.round(diff / HOUR_MS), "hour");
  if (abs < 7 * DAY_MS) return relativeFormat.format(Math.round(diff / DAY_MS), "day");
  return formatDate(date);
}

/** Formats a half-open range using its inclusive last day. */
export function formatRange(range: DateRange): string {
  const lastDay = new Date(range.end.getTime() - 1);
  const sameDay = range.start.toDateString() === lastDay.toDateString();
  if (sameDay) return formatDate(range.start);
  const sameYear = range.start.getFullYear() === lastDay.getFullYear();
  const startLabel = sameYear ? formatShortDate(range.start) : formatDate(range.start);
  return `${startLabel} – ${formatDate(lastDay)}`;
}

export function formatWeekRange(weekStart: Date): string {
  return `${formatShortDate(weekStart)} – ${formatShortDate(addDays(weekStart, 6))}`;
}
