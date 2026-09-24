const AVATAR_COLORS = [
  "bg-indigo-100 text-indigo-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-800",
  "bg-rose-100 text-rose-700",
  "bg-sky-100 text-sky-700",
  "bg-violet-100 text-violet-700",
];

export function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function avatarColor(name: string) {
  const sum = [...name].reduce((total, char) => total + char.charCodeAt(0), 0);
  return AVATAR_COLORS[sum % AVATAR_COLORS.length];
}

export function formatQueueTime(iso: string, now = Date.now()) {
  const diff = Math.max(0, now - new Date(iso).getTime());
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export function formatQueueTimeLabel(iso: string, now = Date.now()) {
  const short = formatQueueTime(iso, now);
  if (short === "now") return "just now";
  const amount = Number(short.slice(0, -1));
  if (short.endsWith("m")) return `${amount} ${amount === 1 ? "minute" : "minutes"} ago`;
  if (short.endsWith("h")) return `${amount} ${amount === 1 ? "hour" : "hours"} ago`;
  return `${amount} ${amount === 1 ? "day" : "days"} ago`;
}

export function formatMessageTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
  });
}

