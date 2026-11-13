import { EmbedBuilder } from "discord.js";

export default async (client, message, args) => {
  const prefix = process.env.COMMAND_PREFIX ?? "!";
  const embed = new EmbedBuilder()
    .setTitle("🎵 Neko Music Commands")
    .setDescription(`Prefix: \`${prefix}\``)
    .setColor(0x5865f2)
    .addFields(
      {
        name: "Playback",
        value: `\`${prefix}play <song/url>\` · \`${prefix}join\` · \`${prefix}pause\` · \`${prefix}resume\` · \`${prefix}skip\` · \`${prefix}previous\`\n\`${prefix}stop\` · \`${prefix}leave\` · \`${prefix}nowplaying\` · \`${prefix}seek <time>\` · \`${prefix}restart\``,
        inline: false,
      },
      {
        name: "Queue",
        value: `\`${prefix}queue [page]\` · \`${prefix}shuffle\` · \`${prefix}remove <pos>\` · \`${prefix}move <from> <to>\`\n\`${prefix}skipto <pos>\` · \`${prefix}clearqueue\``,
        inline: false,
      },
      {
        name: "Audio",
        value: `\`${prefix}volume <0-200>\` · \`${prefix}filter <preset>\` · \`${prefix}bass <dB>\` · \`${prefix}treble <dB>\`\n\`${prefix}loop <off|track|queue>\` · \`${prefix}autoplay <on|off>\``,
        inline: false,
      },
      {
        name: "Server Settings",
        value: `\`${prefix}djrole @role\` · \`${prefix}requestchannel #channel\` · \`${prefix}247 <on|off>\`\nServer managers can configure these settings.`,
        inline: false,
      },
    );

  await message.reply({ embeds: [embed] });
};