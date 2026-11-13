export function formatDuration(seconds) {
  if (seconds == null) return "LIVE";
  try {
    seconds = Math.floor(Number(seconds));
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours) return `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
    return `${minutes}:${String(secs).padStart(2, "0")}`;
  } catch {
    return "Unknown";
  }
}

export function progressBar(current, total, length = 18) {
  if (!total || total <= 0) return "LIVE";
  const ratio = Math.max(0, Math.min(current / total, 1));
  const position = Math.floor(ratio * length);
  return "▬".repeat(position) + "🔘" + "▬".repeat(length - position);
}

export function truncate(text, limit = 100) {
  if (!text) return "Unknown";
  text = String(text);
  return text.length <= limit ? text : text.slice(0, limit - 3) + "...";
}