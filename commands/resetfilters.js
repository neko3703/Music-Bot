import { ensureMusicAccess } from "../utils/permissions.js";

export default async (client, message, args) => {
  if (!await ensureMusicAccess(message, client, { djOnly: true })) return;
  const player = client.playerManager.get(message.guild.id);
  player.preset = "off";
  player.bass = 0;
  player.treble = 0;
  await player._restartWithSettings();
  await message.reply("🎛️ Audio filters reset.");
};