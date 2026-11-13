import { memberInVoiceChannel } from "../utils/permissions.js";

export default async (client, message, args) => {
  const player = client.playerManager.get(message.guild.id);
  const conn = player.connection;
  if (!memberInVoiceChannel(message.member, conn)) {
    return message.reply("Join my voice channel first.");
  }
  if (player.isPaused) {
    player.audioPlayer.unpause();
    await message.reply("▶️ Playback resumed.");
  } else {
    await message.reply("There is no paused track.");
  }
};