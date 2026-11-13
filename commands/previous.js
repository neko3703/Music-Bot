import { ensureMusicAccess } from "../utils/permissions.js";

export default async (client, message, args) => {
  if (!await ensureMusicAccess(message, client)) return;
  const player = client.playerManager.get(message.guild.id);
  if (await player.previous()) {
    await message.reply("⏮️ Playing the previous track.");
  } else {
    await message.reply("There is no previous track.");
  }
};