import { ensureMusicAccess } from "../utils/permissions.js";

export default async (client, message, args) => {
  if (!await ensureMusicAccess(message, client, { djOnly: true })) return;
  const player = client.playerManager.get(message.guild.id);
  await player.stop();
  await message.reply("⏹️ Playback stopped and queue cleared.");
};