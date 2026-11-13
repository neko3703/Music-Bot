import { PermissionFlagsBits } from "discord.js";

export default async (client, message, args) => {
  if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
    return message.reply("You need Manage Server permission to change autoplay.");
  }
  const current = client.settingsStore.get(message.guild.id).autoplay;
  if (!args[0]) {
    return message.reply(`Autoplay is **${current ? "enabled" : "disabled"}**.`);
  }
  const valid = ["on", "off", "true", "false", "enable", "disable"];
  if (!valid.includes(args[0].toLowerCase())) {
    return message.reply("Use `!autoplay on` or `!autoplay off`.");
  }
  const enabled = ["on", "true", "enable"].includes(args[0].toLowerCase());
  await client.settingsStore.update(message.guild.id, { autoplay: enabled });
  await message.reply(`Autoplay **${enabled ? "enabled" : "disabled"}**.`);
};