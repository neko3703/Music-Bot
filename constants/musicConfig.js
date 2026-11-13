export const AUDIO_BITRATE = 192;
export const AUDIO_SAMPLE_RATE = 48000;
export const AUDIO_CHANNELS = 2;
export const DEFAULT_VOLUME = 0.8;
export const MAX_VOLUME = 2.0;

export const IDLE_TIMEOUT = 180_000; // 180 seconds in ms
export const MAX_QUEUE_SIZE = 100;
export const VOTE_SKIP_RATIO = 0.5;

export const FFMPEG_RECONNECT_ARGS = [
  "-reconnect", "1",
  "-reconnect_streamed", "1",
  "-reconnect_delay_max", "5",
];