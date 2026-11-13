import { ensureMusicAccess } from "../utils/permissions.js";

export default async (client, message, args) => {
  if (!await ensureMusicAccess(message, client, { djOnly: true })) return;
  const from = Number(args[0]);
  const to = Number(args[1]);
  if (!from || !to) return message.reply("Usage: `!move <from> <to>`");
  try {
    client.playerManager.get(message.guild.id).queue.move(from, to);
    await message.reply(`Moved track \`${from}\` to position \`${to}\`.`);
  } catch (err) {
    await message.reply(err.message);
  }
};