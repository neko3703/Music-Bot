import { ensureMusicAccess } from "../utils/permissions.js";

const ALIASES = { none: "off", disable: "off", song: "track", single: "track", all: "queue" };

export default async (client, message, args) => {
  const player = client.playerManager.get(message.guild.id);
  if (!args[0]) {
    return message.reply(`Current loop mode: **${player.loopMode}**`);
  }
  if (!await ensureMusicAccess(message, client, { djOnly: true })) return;
  const mode = ALIASES[args[0].toLowerCase()] ?? args[0].toLowerCase();
  try {
    player.setLoop(mode);
    await message.reply(`🔁 Loop mode set to **${mode}**.`);
  } catch {
    await message.reply("Choose `off`, `track`, or `queue`.");
  }
};