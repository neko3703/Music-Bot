import { execFile } from "child_process";
import { promisify } from "util";
import Track from "./Track.js";

const execFileAsync = promisify(execFile);

const YTDLP_ARGS = [
  "--format", "bestaudio/best",
  "--no-playlist",
  "--quiet",
  "--no-warnings",
  "--skip-download",
  "--dump-json",
];

export async function findRelatedTrack(seed, history) {
  if (!seed) return null;

  const query = `ytsearch8:${seed.uploader ?? ""} ${seed.title} similar songs`;
  const played = new Set(history.map((t) => t.webpageUrl).filter(Boolean));

  try {
    const { stdout } = await execFileAsync("yt-dlp", [...YTDLP_ARGS, query], {
      timeout: 30_000,
      maxBuffer: 10 * 1024 * 1024,
    });

    const lines = stdout.trim().split("\n").filter(Boolean);

    for (const line of lines) {
      try {
        const item = JSON.parse(line);
        const pageUrl = item.webpage_url ?? item.original_url;
        if (!pageUrl || played.has(pageUrl)) continue;
        if (!item.url) continue;

        return new Track({
          title: item.title ?? "Unknown title",
          url: item.url,
          webpageUrl: pageUrl,
          duration: item.duration ?? null,
          thumbnail: item.thumbnail ?? null,
          uploader: item.uploader ?? null,
          requestedBy: "Autoplay",
          httpHeaders: item.http_headers ?? {},
        });
      } catch {
        continue;
      }
    }
  } catch (err) {
    console.error("[Autoplay] Could not find an autoplay recommendation:", err.message);
  }

  return null;
}