import { ensureMusicAccess } from "../utils/permissions.js";

export default async (client, message, args) => {
  if (!await ensureMusicAccess(message, client, { djOnly: true })) return;
  const player = client.playerManager.get(message.guild.id);
  if (await player.restartCurrent()) {
    await message.reply("⏮️ Restarting the current track.");
  } else {
    await message.reply("Nothing is currently playing.");
  }
};