import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { existsSync } from "node:fs";
import { resolve } from "node:path";
import Track from "./Track.js";

const execFileAsync = promisify(execFile);

// Resolve cookies file path (project root)
const COOKIES_PATH = resolve("cookies.txt");
const HAS_COOKIES = existsSync(COOKIES_PATH);

if (HAS_COOKIES) {
  console.log(`[Extractor] Using cookies from ${COOKIES_PATH}`);
} else {
  console.warn("[Extractor] No cookies.txt found. YouTube may block requests.");
  console.warn("[Extractor] Run: yt-dlp --cookies-from-browser edge --cookies cookies.txt \"ytsearch1:test\" --skip-download");
}

function cookieArgs() {
  return HAS_COOKIES ? ["--cookies", COOKIES_PATH] : [];
}

const SEARCH_ARGS = [
  "--format", "bestaudio/best",
  "--no-playlist",
  "--skip-download",
  "--dump-json",
  "--no-warnings",
  "--quiet",
];

/**
 * Phase 1: Search — returns a Track with metadata but NO stream URL.
 */
export async function extractTrack(query, requestedBy = null) {
  if (!query || !query.trim()) throw new Error("Search query cannot be empty.");

  let searchQuery = query.trim();
  if (!searchQuery.startsWith("http://") && !searchQuery.startsWith("https://")) {
    searchQuery = `ytsearch1:${searchQuery}`;
  }

  try {
    const { stdout } = await execFileAsync("yt-dlp", [
      ...SEARCH_ARGS,
      ...cookieArgs(),
      searchQuery,
    ], {
      timeout: 45_000,
      maxBuffer: 1024 * 1024 * 5,
    });

    const info = JSON.parse(stdout.trim());
    if (!info) return null;

    const webpageUrl = info.webpage_url ?? info.original_url;
    if (!webpageUrl) throw new Error("Could not determine the track URL.");

    return new Track({
      title: info.title ?? "Unknown title",
      url: null,
      webpageUrl,
      duration: info.duration ?? null,
      thumbnail: info.thumbnail ?? null,
      uploader: info.uploader ?? null,
      requestedBy,
      httpHeaders: {},
    });
  } catch (error) {
    if (error.killed) throw new Error("yt-dlp search timed out.");
    console.error("[Extractor]", error.message);
    throw error;
  }
}

/**
 * Phase 2: Stream — fetches a FRESH stream URL right before playback.
 */
export async function getStreamUrl(webpageUrl) {
  if (!webpageUrl) throw new Error("No webpage URL to resolve.");

  try {
    const { stdout } = await execFileAsync("yt-dlp", [
      "--format", "bestaudio/best",
      "--no-playlist",
      "--skip-download",
      "--dump-json",
      "--no-warnings",
      "--quiet",
      ...cookieArgs(),
      webpageUrl,
    ], {
      timeout: 30_000,
      maxBuffer: 1024 * 1024 * 5,
    });

    const info = JSON.parse(stdout.trim());
    if (!info?.url) throw new Error("No playable stream URL found.");

    return {
      url: info.url,
      httpHeaders: info.http_headers ?? {},
    };
  } catch (error) {
    if (error.killed) throw new Error("yt-dlp stream resolve timed out.");
    console.error("[Extractor] getStreamUrl error:", error.message);
    throw error;
  }
}