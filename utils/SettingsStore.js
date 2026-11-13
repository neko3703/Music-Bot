import fs from "fs";
import path from "path";

const DEFAULTS = {
  dj_role_id: null,
  request_channel_id: null,
  autoplay: false,
  always_on: false,
};

export default class SettingsStore {
  constructor(filePath) {
    this.filePath = filePath;
    this._data = {};
    this._load();
  }

  _load() {
    try {
      if (fs.existsSync(this.filePath)) {
        const raw = fs.readFileSync(this.filePath, "utf-8");
        const parsed = JSON.parse(raw);
        this._data = typeof parsed === "object" && parsed !== null ? parsed : {};
      }
    } catch (err) {
      console.error("[SettingsStore] Could not load settings:", err);
      this._data = {};
    }
  }

  get(guildId) {
    const stored = this._data[String(guildId)] ?? {};
    return { ...DEFAULTS, ...stored };
  }

  async update(guildId, changes) {
    const key = String(guildId);
    if (!this._data[key]) this._data[key] = {};
    Object.assign(this._data[key], changes);
    try {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      const tmp = this.filePath + ".tmp";
      fs.writeFileSync(tmp, JSON.stringify(this._data, null, 2), "utf-8");
      fs.renameSync(tmp, this.filePath);
    } catch (err) {
      console.error(`[SettingsStore] Could not persist settings for guild ${guildId}:`, err);
    }
  }
}