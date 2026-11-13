import { PermissionFlagsBits } from "discord.js";

export default async (client, message, args) => {
  if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
    return message.reply("You need Manage Server permission.");
  }
  const role = message.mentions.roles.first();
  if (!role) {
    await client.settingsStore.update(message.guild.id, { dj_role_id: null });
    return message.reply("DJ role restriction disabled. Server managers can still control music.");
  }
  await client.settingsStore.update(message.guild.id, { dj_role_id: role.id });
  await message.reply(`🎧 DJ role set to ${role}.`);
};