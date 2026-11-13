import { ensureMusicAccess } from "../utils/permissions.js";
import { formatDuration } from "../utils/formatting.js";

function parseTimestamp(value) {
  const parts = value.split(":");
  if (parts.length > 3 || !parts.every((p) => /^\d+$/.test(p))) {
    throw new Error("Use seconds, `m:ss`, or `h:mm:ss`.");
  }
  return parts.reduce((total, part) => total * 60 + Number(part), 0);
}

export default async (client, message, args) => {
  if (!args[0]) return message.reply("Provide a timestamp like `1:35` or `95`.");
  if (!await ensureMusicAccess(message, client, { djOnly: true })) return;

  try {
    const seconds = parseTimestamp(args[0]);
    const player = client.playerManager.get(message.guild.id);
    if (await player.seek(seconds)) {
      await message.reply(`⏩ Seeking to **${formatDuration(seconds)}**.`);
    } else {
      await message.reply("Nothing is currently playing.");
    }
  } catch (err) {
    await message.reply(err.message);
  }
};