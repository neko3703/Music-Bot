import { ensureMusicAccess } from "../utils/permissions.js";

export default async (client, message, args) => {
  const player = client.playerManager.get(message.guild.id);
  if (!args[0]) {
    return message.reply(`🔊 Current volume: **${Math.round(player.volume * 100)}%**`);
  }
  if (!await ensureMusicAccess(message, client, { djOnly: true })) return;
  try {
    await player.setVolume(Number(args[0]));
    await message.reply(`🔊 Volume set to **${args[0]}%**.`);
  } catch (err) {
    await message.reply(err.message);
  }
};