import { ensureMusicAccess } from "../utils/permissions.js";
import { PRESETS } from "../utils/filters.js";

export default async (client, message, args) => {
  const player = client.playerManager.get(message.guild.id);
  if (!args[0]) {
    const available = Object.keys(PRESETS).map((k) => `\`${k}\``).join(", ");
    return message.reply(`**Current preset:** \`${player.preset}\`\n**Available:** ${available}`);
  }
  if (!await ensureMusicAccess(message, client, { djOnly: true })) return;
  const preset = args[0].toLowerCase();
  if (!(preset in PRESETS)) {
    return message.reply("Unknown preset. Available: " + Object.keys(PRESETS).join(", "));
  }
  await player.setFilter(preset);
  await message.reply(`🎛️ Audio preset changed to **${preset}**.`);
};