import { PermissionFlagsBits } from "discord.js";

export default async (client, message, args) => {
  if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
    return message.reply("You need Manage Server permission to change 24/7 mode.");
  }
  const current = client.settingsStore.get(message.guild.id).always_on;
  if (!args[0]) {
    return message.reply(`24/7 mode is **${current ? "enabled" : "disabled"}**.`);
  }
  if (!["on", "off"].includes(args[0].toLowerCase())) {
    return message.reply("Use `!247 on` or `!247 off`.");
  }
  const enabled = args[0].toLowerCase() === "on";
  await client.settingsStore.update(message.guild.id, { always_on: enabled });
  await message.reply(`24/7 mode **${enabled ? "enabled" : "disabled"}**.`);
};