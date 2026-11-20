// Locale-aware date/time formatting (device locale; the app ships `en`).
const loc = undefined;

export const fmtTime = (d: Date | string) =>
  new Date(d).toLocaleTimeString(loc, { hour: "numeric", minute: "2-digit" }).replace(" AM", " am").replace(" PM", " pm");

export const fmtDayOverline = (d: Date) => d.toLocaleDateString(loc, { weekday: "long", day: "numeric", month: "short" });

export const fmtShortDay = (d: Date | string) => new Date(d).toLocaleDateString(loc, { weekday: "short" });

export const fmtDayTime = (d: Date | string) => `${fmtShortDay(d)} ${fmtTime(d)}`;

export const fmtDate = (d: Date | string) => new Date(d).toLocaleDateString(loc, { day: "numeric", month: "short", year: "numeric" });

/** "14–20 November" (en-GB) / "November 14 – 20" (en-US): the device locale's own range format. */
export function fmtDayRange(a: Date, b: Date): string {
  const f = new Intl.DateTimeFormat(loc, { day: "numeric", month: "long" }) as Intl.DateTimeFormat & {
    formatRange?: (a: Date, b: Date) => string;
  };
  return f.formatRange ? f.formatRange(a, b) : `${f.format(a)} – ${f.format(b)}`;
}

export const weekdayInitial = (d: Date) => d.toLocaleDateString(loc, { weekday: "narrow" });

/** "2 hours", "1 h 40 min" etc. for headers like "2 hours after lunch". */
export function fmtDuration(mins: number): string {
  const m = Math.round(mins);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const r = m % 60;
  if (r < 10) return `${h} ${h === 1 ? "hour" : "hours"}`;
  return `${h} h ${r} min`;
}

/** "HH:mm" for <input type="time"> values. */
export const toTimeInput = (d: Date) => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

/** Display "HH:mm" as the device would show a clock time. */
export function fmtHM(hm: string): string {
  const [h, m] = hm.split(":").map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return fmtTime(d);
}
