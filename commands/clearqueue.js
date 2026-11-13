import { ensureMusicAccess } from "../utils/permissions.js";

export default async (client, message, args) => {
  if (!await ensureMusicAccess(message, client, { djOnly: true })) return;
  client.playerManager.get(message.guild.id).queue.clear();
  await message.reply("🗑️ Upcoming queue cleared.");
};