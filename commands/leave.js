import { ensureMusicAccess } from "../utils/permissions.js";

export default async (client, message, args) => {
  if (!await ensureMusicAccess(message, client, { djOnly: true })) return;
  const player = client.playerManager.get(message.guild.id);
  await player.stop();
  try {
    const conn = player.connection;
    if (conn) conn.destroy();
    client.voiceConnections?.delete(message.guild.id);
    await message.reply("👋 Disconnected from voice.");
  } catch {
    await message.reply("Unable to disconnect from voice.");
  }
};