import { ensureMusicAccess } from "../utils/permissions.js";

export default async (client, message, args) => {
  const player = client.playerManager.get(message.guild.id);
  if (!args[0]) return message.reply(`Current treble level: **${player.treble} dB**`);
  if (!await ensureMusicAccess(message, client, { djOnly: true })) return;
  try {
    await player.setTreble(Number(args[0]));
    await message.reply(`🎵 Treble set to **${args[0]} dB**.`);
  } catch (err) {
    await message.reply(err.message);
  }
};