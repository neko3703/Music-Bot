import { ensureMusicAccess } from "../utils/permissions.js";

export default async (client, message, args) => {
  if (!await ensureMusicAccess(message, client)) return;
  const player = client.playerManager.get(message.guild.id);
  if (await player.skip()) {
    await message.reply("⏭️ Skipped the current track.");
  } else {
    await message.reply("Nothing is currently playing.");
  }
};