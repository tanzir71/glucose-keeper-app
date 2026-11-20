// Optional calendar nudge (03 §8): a daily .ics event at her chosen time. No health details.
import { t } from "@/copy/en";

const pad = (n: number) => String(n).padStart(2, "0");
const stamp = (d: Date) =>
  `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;

export function dailyReminderIcs(timeHM: string, now: Date, uid: string): string {
  const [h, m] = timeHM.split(":").map(Number);
  const start = new Date(now);
  start.setHours(h, m, 0, 0);
  if (start <= now) start.setDate(start.getDate() + 1);
  // Floating local time: the reminder follows the phone's clock wherever she is.
  const local = `${start.getFullYear()}${pad(start.getMonth() + 1)}${pad(start.getDate())}T${pad(h)}${pad(m)}00`;
  return [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Keeper//Gentle reminder//EN",
    "CALSCALE:GREGORIAN",
    "BEGIN:VEVENT",
    `UID:${uid}@keeper.local`,
    `DTSTAMP:${stamp(now)}`,
    `DTSTART:${local}`,
    "DURATION:PT5M",
    "RRULE:FREQ=DAILY",
    `SUMMARY:${t.you.reminderSummary}`,
    "BEGIN:VALARM",
    "ACTION:DISPLAY",
    `DESCRIPTION:${t.you.reminderSummary}`,
    "TRIGGER:PT0M",
    "END:VALARM",
    "END:VEVENT",
    "END:VCALENDAR",
    "",
  ].join("\r\n");
}
