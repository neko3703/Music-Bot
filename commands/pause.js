// src/commands/pause.js — Prefix command: !pause

import { memberInVoiceChannel } from "../utils/permissions.js";

export default async (client, message, args) => {
  const player = client.playerManager.get(message.guild.id);
  const conn = player.connection;
  if (!memberInVoiceChannel(message.member, conn)) {
    return message.reply("Join my voice channel first.");
  }
  if (player.isPlaying) {
    player.audioPlayer.pause();
    await message.reply("⏸️ Playback paused.");
  } else {
    await message.reply("Nothing is currently playing.");
  }
};