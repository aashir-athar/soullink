// src/utils/format.ts — Small, pure string/time helpers.

import {
  differenceInYears,
  differenceInSeconds,
  differenceInMinutes,
  differenceInHours,
  differenceInDays,
  format as fmt,
} from 'date-fns';

/** Age from ISO date string. */
export function ageFromDob(dob: string | Date): number {
  const d = typeof dob === 'string' ? new Date(dob) : dob;
  return differenceInYears(new Date(), d);
}

/** "just now" / "3m" / "2h" / "5d" / "12 Jan". */
export function timeAgoShort(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  const now = new Date();
  const s = differenceInSeconds(now, d);
  if (s < 45) return 'just now';
  const m = differenceInMinutes(now, d);
  if (m < 60) return `${m}m`;
  const h = differenceInHours(now, d);
  if (h < 24) return `${h}h`;
  const day = differenceInDays(now, d);
  if (day < 7) return `${day}d`;
  return fmt(d, 'd LLL');
}

/** Chat time — hh:mm. */
export function chatTime(iso: string | Date): string {
  const d = typeof iso === 'string' ? new Date(iso) : iso;
  return fmt(d, 'HH:mm');
}

/** Minutes:seconds countdown from now -> target. */
export function countdownTo(iso: string): string {
  const target = new Date(iso).getTime();
  const now = Date.now();
  const ms = Math.max(0, target - now);
  const totalMin = Math.floor(ms / 60_000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

/** Capitalise first letter of every word. */
export function titleCase(s: string): string {
  return s.replace(
    /\w\S*/g,
    (t) => t.charAt(0).toUpperCase() + t.substring(1).toLowerCase()
  );
}

/** Human-friendly religion label. */
export function religionLabel(v: string): string {
  if (v === 'prefer_not_to_say') return 'Private';
  return titleCase(v);
}

/** "Lahore, Pakistan" */
export function locationLabel(city?: string, country?: string): string {
  return [city, country].filter(Boolean).join(', ');
}
