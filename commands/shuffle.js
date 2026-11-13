import { ensureMusicAccess } from "../utils/permissions.js";

export default async (client, message, args) => {
  if (!await ensureMusicAccess(message, client, { djOnly: true })) return;
  const player = client.playerManager.get(message.guild.id);
  if (player.queue.length < 2) return message.reply("You need at least two queued tracks to shuffle.");
  player.shuffle();
  await message.reply("🔀 Queue shuffled.");
};