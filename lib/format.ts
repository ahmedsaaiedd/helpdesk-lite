import { format, formatDistanceToNowStrict } from "date-fns";

export function formatRelative(date: Date) {
  return formatDistanceToNowStrict(date, { addSuffix: true });
}

export function formatElapsed(date: Date) {
  return formatDistanceToNowStrict(date);
}

export function formatExact(date: Date) {
  return format(date, "MMM d, yyyy 'at' h:mm a");
}

export function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}
