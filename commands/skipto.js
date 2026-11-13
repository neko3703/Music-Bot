import { ensureMusicAccess } from "../utils/permissions.js";
import { truncate } from "../utils/formatting.js";

export default async (client, message, args) => {
  if (!await ensureMusicAccess(message, client, { djOnly: true })) return;
  const pos = Number(args[0]);
  if (!pos) return message.reply("Provide a queue position number.");
  const player = client.playerManager.get(message.guild.id);
  try {
    const track = player.queue.remove(pos);
    player.queue.addFront(track);
    if (player.isPlaying || player.isPaused) {
      await player.skip();
    } else {
      await player.start();
    }
    await message.reply(`⏭️ Skipping to **${truncate(track.title, 80)}**.`);
  } catch {
    await message.reply("That queue position does not exist.");
  }
};