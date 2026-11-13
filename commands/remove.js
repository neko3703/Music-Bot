import { ensureMusicAccess } from "../utils/permissions.js";
import { truncate } from "../utils/formatting.js";

export default async (client, message, args) => {
  if (!await ensureMusicAccess(message, client, { djOnly: true })) return;
  const pos = Number(args[0]);
  if (!pos) return message.reply("Provide a queue position number.");
  try {
    const track = client.playerManager.get(message.guild.id).queue.remove(pos);
    await message.reply(`Removed **${truncate(track.title, 80)}** from the queue.`);
  } catch {
    await message.reply("That queue position does not exist.");
  }
};