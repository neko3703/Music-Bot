import { spawn } from "node:child_process";
import {
  createAudioPlayer,
  createAudioResource,
  AudioPlayerStatus,
  NoSubscriberBehavior,
  StreamType,
} from "@discordjs/voice";

const MAX_QUEUE_SIZE = 100;

export class MusicPlayer {
  constructor(guildId) {
    this.guildId = guildId;
    this.queue = [];
    this.current = null;
    this.volume = 0.8;

    this.player = createAudioPlayer({
      behaviors: { noSubscriber: NoSubscriberBehavior.Pause },
    });

    this.player.on(AudioPlayerStatus.Idle, () => {
      this.current = null;
      this._playNext();
    });

    this.player.on("error", (error) => {
      console.error(`[Player] Error in guild ${this.guildId}:`, error.message);
      this.current = null;
      this._playNext();
    });
  }

  addTrack(track) {
    if (this.queue.length >= MAX_QUEUE_SIZE) {
      throw new Error("The music queue is full.");
    }
    this.queue.push(track);
  }

  get isPlaying() {
    return this.player.state.status === AudioPlayerStatus.Playing;
  }

  get isPaused() {
    return this.player.state.status === AudioPlayerStatus.Paused;
  }

  start() {
    if (this.isPlaying || this.isPaused) return;
    this._playNext();
  }

  _playNext() {
    if (this.queue.length === 0) {
      this.current = null;
      console.log(`[Player] Queue finished in guild ${this.guildId}`);
      return;
    }

    const track = this.queue.shift();
    this.current = track;

    try {
      const ffmpegPath = process.env.FFMPEG_PATH || "ffmpeg";

      const inputArgs = [
        "-reconnect", "1",
        "-reconnect_streamed", "1",
        "-reconnect_delay_max", "5",
      ];

      // Inject HTTP headers
      const headers = track.httpHeaders ?? {};
      if (Object.keys(headers).length > 0) {
        const headerStr = Object.entries(headers)
          .map(([k, v]) => `${k}: ${v}`)
          .join("\r\n");
        inputArgs.push("-headers", headerStr);
      }

      inputArgs.push("-i", track.url);

      const outputArgs = [
        "-vn",
        "-af", `volume=${this.volume}`,
        "-ar", "48000",
        "-ac", "2",
        "-f", "opus",
        "pipe:1",
      ];

      const ffmpeg = spawn(ffmpegPath, [...inputArgs, ...outputArgs], {
        stdio: ["ignore", "pipe", "ignore"],
      });

      ffmpeg.on("error", (err) => {
        console.error("[Player] FFmpeg spawn error:", err.message);
      });

      const resource = createAudioResource(ffmpeg.stdout, {
        inputType: StreamType.OggOpus,
      });

      this.player.play(resource);
      console.log(`[Player] Started '${track.title}' in guild ${this.guildId}`);
    } catch (error) {
      console.error(`[Player] Could not start track '${track.title}':`, error.message);
      this.current = null;
      this._playNext();
    }
  }

  skip() {
    if (!this.isPlaying && !this.isPaused) return false;
    this.player.stop(true);
    return true;
  }

  stop() {
    this.queue = [];
    this.current = null;
    this.player.stop(true);
  }

  pause() {
    if (this.isPlaying) {
      this.player.pause();
      return true;
    }
    return false;
  }

  resume() {
    if (this.isPaused) {
      this.player.unpause();
      return true;
    }
    return false;
  }
}

// ── Player Manager ──
const players = new Map();

export function getPlayer(guildId) {
  if (!players.has(guildId)) {
    players.set(guildId, new MusicPlayer(guildId));
  }
  return players.get(guildId);
}

export function removePlayer(guildId) {
  players.delete(guildId);
}