import { EmbedBuilder } from "discord.js";
import { formatDuration, truncate } from "../utils/formatting.js";

export default async (client, message, args) => {
  const player = client.playerManager.get(message.guild.id);
  const tracks = player.queue.all();
  if (!tracks.length && !player.current) return message.reply("The music queue is empty.");

  const perPage = 10;
  const totalPages = Math.max(1, Math.ceil(tracks.length / perPage));
  const page = Math.max(1, Number(args[0]) || 1);
  if (page > totalPages) return message.reply(`Choose a page between 1 and ${totalPages}.`);

  const embed = new EmbedBuilder().setTitle("🎶 Music Queue").setColor(0x5865f2);

  if (player.current) {
    embed.addFields({
      name: "Now Playing",
      value: `**${truncate(player.current.title, 80)}** · ${formatDuration(player.current.duration)}`,
      inline: false,
    });
  }

  const subset = tracks.slice((page - 1) * perPage, page * perPage);
  if (subset.length) {
    embed.addFields({
      name: "Up Next",
      value: subset
        .map((t, i) => `\`${(page - 1) * perPage + i + 1}.\` **${truncate(t.title, 65)}** · \`${formatDuration(t.duration)}\``)
        .join("\n"),
      inline: false,
    });
  }

  embed.setFooter({ text: `Page ${page}/${totalPages} · ${tracks.length} queued` });
  await message.reply({ embeds: [embed] });
};