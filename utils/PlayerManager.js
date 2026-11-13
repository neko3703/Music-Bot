import MusicPlayer from "./MusicPlayer.js";

export default class PlayerManager {
  constructor(client) {
    this.client = client;
    this.players = new Map();
  }

  get(guildId) {
    if (!this.players.has(guildId)) {
      this.players.set(guildId, new MusicPlayer(this.client, guildId));
    }
    return this.players.get(guildId);
  }

  remove(guildId) {
    this.players.delete(guildId);
  }

  getExisting(guildId) {
    return this.players.get(guildId) ?? null;
  }
}