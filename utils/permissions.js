import { PermissionFlagsBits } from "discord.js";

export function memberInVoiceChannel(member, voiceConnection) {
  if (!member?.voice?.channel || !voiceConnection?.joinConfig?.channelId) return false;
  return member.voice.channel.id === voiceConnection.joinConfig.channelId;
}

export function isDJ(member, settings) {
  if (
    member.permissions.has(PermissionFlagsBits.ManageGuild) ||
    member.permissions.has(PermissionFlagsBits.Administrator)
  ) {
    return true;
  }
  const roleId = settings.dj_role_id;
  if (!roleId) return true; // no DJ role configured → everyone can control
  return member.roles.cache.has(String(roleId));
}

export async function ensureMusicAccess(message, client, { djOnly = false } = {}) {
  if (!message.guild) {
    await message.reply("This command can only be used in a server.");
    return false;
  }
  const connection = client.voiceConnections?.get(message.guild.id);
  if (!memberInVoiceChannel(message.member, connection)) {
    await message.reply("Join my voice channel first to control playback.");
    return false;
  }
  const settings = client.settingsStore.get(message.guild.id);
  if (djOnly && !isDJ(message.member, settings)) {
    await message.reply("This action is restricted to DJs and server managers.");
    return false;
  }
  return true;
}

export async function ensureRequestChannel(message, client) {
  const settings = client.settingsStore.get(message.guild.id);
  const channelId = settings.request_channel_id;
  if (channelId && message.channel.id !== String(channelId)) {
    const channel = message.guild.channels.cache.get(String(channelId));
    const mention = channel ? `<#${channel.id}>` : "the configured music request channel";
    await message.reply(`Please use ${mention} for music requests.`);
    return false;
  }
  return true;
}