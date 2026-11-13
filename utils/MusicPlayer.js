import {
  createAudioResource,
  createAudioPlayer,
  AudioPlayerStatus,
  StreamType,
  getVoiceConnection,
} from "@discordjs/voice";
import { spawn } from "child_process";
import { Transform } from "stream";
import MusicQueue from "./MusicQueue.js";
import { buildFilter } from "./filters.js";
import { getStreamUrl } from "./extractor.js";
import { findRelatedTrack } from "./autoplay.js";
import {
  IDLE_TIMEOUT,
  AUDIO_SAMPLE_RATE,
  AUDIO_CHANNELS,
  FFMPEG_RECONNECT_ARGS,
} from "../constants/musicConfig.js";

// PCM frame constants for 48kHz stereo 16-bit (20ms frames)
const FRAME_DURATION_MS = 20;
const BYTES_PER_SAMPLE = 2;
const FRAME_SIZE =
  (AUDIO_SAMPLE_RATE * FRAME_DURATION_MS / 1000) * AUDIO_CHANNELS * BYTES_PER_SAMPLE;

/**
 * Transform stream that buffers raw PCM and emits exact frame-sized chunks.
 */
class PCMFramer extends Transform {
  constructor() {
    super();
    this._buffer = Buffer.alloc(0);
  }

  _transform(chunk, encoding, callback) {
    this._buffer = Buffer.concat([this._buffer, chunk]);
    while (this._buffer.length >= FRAME_SIZE) {
      this.push(this._buffer.subarray(0, FRAME_SIZE));
      this._buffer = this._buffer.subarray(FRAME_SIZE);
    }
    callback();
  }

  _flush(callback) {
    if (this._buffer.length > 0) {
      const padded = Buffer.alloc(FRAME_SIZE, 0);
      this._buffer.copy(padded);
      this.push(padded);
    }
    callback();
  }
}

export default class MusicPlayer {
  constructor(client, guildId) {
    this.client = client;
    this.guildId = guildId;
    this.queue = new MusicQueue();
    this.history = [];
    this.current = null;
    this.loopMode = "off"; // off | track | queue
    this.volume = 0.8;
    this.preset = "off";
    this.bass = 0;
    this.treble = 0;
    this.startedAt = null;
    this.positionOffset = 0;
    this._skipRequested = false;
    this._pendingSeek = null;
    this._idleTimer = null;
    this._votes = new Set();
    this._lock = false;
    this._ffmpeg = null;

    this.audioPlayer = createAudioPlayer();
    this.audioPlayer.on(AudioPlayerStatus.Idle, () => this._afterPlayback(null));
    this.audioPlayer.on("error", (err) => {
      console.error(`[MusicPlayer] Playback error in guild ${this.guildId}:`, err.message);
      this._afterPlayback(err);
    });
  }

  get connection() {
    return getVoiceConnection(this.guildId);
  }

  get isPlaying() {
    return this.audioPlayer.state.status === AudioPlayerStatus.Playing;
  }

  get isPaused() {
    return this.audioPlayer.state.status === AudioPlayerStatus.Paused;
  }

  addTrack(track) {
    this.queue.add(track);
  }

  getPosition() {
    if (this.startedAt == null) return Math.max(0, Math.floor(this.positionOffset));
    if (this.isPaused) return Math.max(0, Math.floor(this.positionOffset));
    return Math.max(0, Math.floor(this.positionOffset + (Date.now() - this.startedAt) / 1000));
  }

  _cancelIdle() {
    if (this._idleTimer) {
      clearTimeout(this._idleTimer);
      this._idleTimer = null;
    }
  }

  async start() {
    if (this._lock) return;
    this._lock = true;
    try {
      const conn = this.connection;
      if (!conn) throw new Error("The bot is not connected to voice.");
      if (this.isPlaying || this.isPaused) return;
      this._cancelIdle();
      conn.subscribe(this.audioPlayer);
      await this._playNextLocked();
    } finally {
      this._lock = false;
    }
  }

  async _playNextLocked() {
    const conn = this.connection;
    if (!conn || this.isPlaying || this.isPaused) return;

    const settings = this.client.settingsStore.get(this.guildId);

    while (true) {
      let track;
      let startAt = 0;

      if (this._pendingSeek != null && this.current) {
        track = this.current;
        startAt = this._pendingSeek;
        this._pendingSeek = null;
      } else if (this.loopMode === "track" && this.current && !this._skipRequested) {
        track = this.current;
        startAt = 0;
      } else {
        track = this.queue.getNext();
        startAt = 0;
      }

      if (!track) {
        this.current = null;
        this.startedAt = null;
        this.positionOffset = 0;
        console.log(`[MusicPlayer] Queue finished in guild ${this.guildId}`);

        if (settings.autoplay && this.history.length > 0) {
          try {
            const seed = this.history[this.history.length - 1];
            const related = await findRelatedTrack(seed, this.history);
            if (related) {
              track = related;
            } else {
              this._scheduleIdleDisconnect();
              return;
            }
          } catch (err) {
            console.error(`[MusicPlayer] Autoplay failed in guild ${this.guildId}:`, err);
            this._scheduleIdleDisconnect();
            return;
          }
        } else {
          this._scheduleIdleDisconnect();
          return;
        }
      }

      this.current = track;
      try {
        // Fetch a FRESH stream URL right before playback
        console.log(`[MusicPlayer] Resolving stream URL for '${track.title}'...`);
        const stream = await getStreamUrl(track.webpageUrl);
        track.url = stream.url;
        track.httpHeaders = stream.httpHeaders;

        const resource = this._createAudioResource(track, startAt);
        this.audioPlayer.play(resource);
        this.positionOffset = startAt;
        this.startedAt = Date.now();
        this._votes.clear();
        console.log(`[MusicPlayer] Started '${track.title}' in guild ${this.guildId}`);
        return;
      } catch (err) {
        console.error(`[MusicPlayer] Could not start track '${track.title}':`, err.message);
        this.current = null;
        this.startedAt = null;
        this.positionOffset = 0;
        continue;
      }
    }
  }

  _createAudioResource(track, startAt = 0) {
    this._killFfmpeg();

    const headerArgs = [];
    const headers = track.httpHeaders ?? {};
    if (Object.keys(headers).length > 0) {
      const headerStr = Object.entries(headers)
        .map(([k, v]) => `${k}: ${v}`)
        .join("\r\n");
      headerArgs.push("-headers", headerStr);
    }

    const args = [
      "-loglevel", "error",
      ...FFMPEG_RECONNECT_ARGS,
      ...headerArgs,
      ...(startAt > 0 ? ["-ss", String(startAt)] : []),
      "-i", track.url,
      "-vn",
      "-af", buildFilter(this.volume, this.preset, this.bass, this.treble),
      "-ar", String(AUDIO_SAMPLE_RATE),
      "-ac", String(AUDIO_CHANNELS),
      "-f", "s16le",
      "pipe:1",
    ];

    const ffmpeg = spawn("ffmpeg", args, {
      stdio: ["ignore", "pipe", "pipe"],
    });

    this._ffmpeg = ffmpeg;

    ffmpeg.stderr.on("data", (data) => {
      const msg = data.toString().trim();
      if (msg) console.error(`[FFmpeg] ${msg}`);
    });

    ffmpeg.on("error", (err) => {
      console.error("[MusicPlayer] FFmpeg spawn error:", err.message);
    });

    const framer = new PCMFramer();
    ffmpeg.stdout.pipe(framer);

    return createAudioResource(framer, {
      inputType: StreamType.Raw,
    });
  }

  _killFfmpeg() {
    if (this._ffmpeg) {
      try {
        this._ffmpeg.stdout?.destroy();
        this._ffmpeg.stderr?.destroy();
        this._ffmpeg.kill("SIGKILL");
      } catch { /* ignore */ }
      this._ffmpeg = null;
    }
  }

  _scheduleIdleDisconnect() {
    this._cancelIdle();
    this._idleTimer = setTimeout(async () => {
      try {
        const settings = this.client.settingsStore.get(this.guildId);
        if (settings.always_on || this.queue.length > 0 || this.current) return;
        const conn = this.connection;
        if (conn) {
          conn.destroy();
          console.log(`[MusicPlayer] Idle-disconnected from guild ${this.guildId}.`);
        }
      } catch (err) {
        console.error(`[MusicPlayer] Idle disconnect failed for guild ${this.guildId}:`, err);
      }
    }, IDLE_TIMEOUT);
  }

  async _afterPlayback(error) {
    if (this._lock) return;
    this._lock = true;
    try {
      if (error) {
        console.error(`[MusicPlayer] Playback error in guild ${this.guildId}:`, error.message);
      }
      if (this._skipRequested) {
        this._skipRequested = false;
      } else if (this.current) {
        if (this.loopMode === "queue") {
          try {
            this.queue.add(this.current);
          } catch {
            console.warn("[MusicPlayer] Queue loop skipped because queue is full.");
          }
        } else {
          this.history.push(this.current);
          if (this.history.length > 50) this.history.shift();
        }
      }
      this.startedAt = null;
      this.positionOffset = 0;
      await this._playNextLocked();
    } finally {
      this._lock = false;
    }
  }

  async skip() {
    if (!this.isPlaying && !this.isPaused) return false;
    this._skipRequested = true;
    this._killFfmpeg();
    this.audioPlayer.stop(true);
    return true;
  }

  async previous() {
    if (this.history.length === 0) return false;
    const previousTrack = this.history.pop();
    if (this.isPlaying || this.isPaused) {
      if (this.current) this.queue.addFront(this.current);
      this.queue.addFront(previousTrack);
      this._skipRequested = true;
      this._killFfmpeg();
      this.audioPlayer.stop(true);
    } else {
      this.queue.addFront(previousTrack);
      await this.start();
    }
    return true;
  }

  async stop() {
    this._cancelIdle();
    this.queue.clear();
    this.loopMode = "off";
    this._pendingSeek = null;
    this._skipRequested = true;
    if (this.isPlaying || this.isPaused) {
      this._killFfmpeg();
      this.audioPlayer.stop(true);
    } else {
      this.current = null;
      this.startedAt = null;
      this.positionOffset = 0;
      this._skipRequested = false;
    }
  }

  async seek(seconds) {
    if (!this.current) return false;
    if (this.current.duration && (seconds < 0 || seconds >= this.current.duration)) {
      throw new Error(`Choose a position between 0 and ${this.current.duration - 1} seconds.`);
    }
    if (seconds < 0) throw new Error("Seek position cannot be negative.");
    if (!this.isPlaying && !this.isPaused) return false;
    this._pendingSeek = Math.floor(seconds);
    this._skipRequested = true;
    this._killFfmpeg();
    this.audioPlayer.stop(true);
    return true;
  }

  async restartCurrent() {
    return this.seek(0);
  }

  async _restartWithSettings() {
    if (this.current && (this.isPlaying || this.isPaused)) {
      return this.seek(this.getPosition());
    }
    return false;
  }

  async setVolume(amount) {
    const vol = Number(amount);
    if (vol < 0 || vol > 200) throw new Error("Volume must be between 0 and 200.");
    this.volume = vol / 100;
    await this._restartWithSettings();
  }

  async setFilter(preset) {
    this.preset = preset;
    await this._restartWithSettings();
  }

  async setBass(value) {
    const v = Number(value);
    if (v < -10 || v > 15) throw new Error("Bass must be between -10 and 15.");
    this.bass = v;
    await this._restartWithSettings();
  }

  async setTreble(value) {
    const v = Number(value);
    if (v < -10 || v > 10) throw new Error("Treble must be between -10 and 10.");
    this.treble = v;
    await this._restartWithSettings();
  }

  setLoop(mode) {
    if (!["off", "track", "queue"].includes(mode)) throw new Error("Invalid loop mode.");
    this.loopMode = mode;
  }

  shuffle() {
    this.queue.shuffle();
  }
}