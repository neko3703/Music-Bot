import { PermissionFlagsBits } from "discord.js";

export default async (client, message, args) => {
  if (!message.member.permissions.has(PermissionFlagsBits.ManageGuild)) {
    return message.reply("You need Manage Server permission.");
  }
  const channel = message.mentions.channels.first();
  if (!channel) {
    await client.settingsStore.update(message.guild.id, { request_channel_id: null });
    return message.reply("Music request channel restriction disabled.");
  }
  await client.settingsStore.update(message.guild.id, { request_channel_id: channel.id });
  await message.reply(`🎵 Music requests are now restricted to ${channel}.`);
};