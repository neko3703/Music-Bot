import { joinVoiceChannel } from "@discordjs/voice";

export default async (client, message, args) => {
  const member = message.member;
  if (!member?.voice?.channel) return message.reply("Join a voice channel first.");

  const channel = member.voice.channel;
  try {
    const connection = joinVoiceChannel({
      channelId: channel.id,
      guildId: message.guild.id,
      adapterCreator: message.guild.voiceAdapterCreator,
      selfDeaf: true,
    });
    if (!client.voiceConnections) client.voiceConnections = new Map();
    client.voiceConnections.set(message.guild.id, connection);
    await message.reply(`Connected to **${channel.name}**.`);
  } catch {
    await message.reply("I couldn't connect to that voice channel.");
  }
};