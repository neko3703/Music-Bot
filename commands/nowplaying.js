import { EmbedBuilder } from "discord.js";
import { formatDuration, truncate } from "../utils/formatting.js";
import { buildPlayerControls } from "../interactions/playerControls.js";

export default async (client, message, args) => {
  const player = client.playerManager.get(message.guild.id);
  const track = player.current;
  if (!track) return message.reply("Nothing is currently playing.");

  const embed = new EmbedBuilder()
    .setTitle("🎵 Now Playing")
    .setDescription(`**[${truncate(track.title, 200)}](${track.webpageUrl})**`)
    .setColor(0x5865f2)
    .addFields(
      { name: "Progress", value: `${formatDuration(player.getPosition())} / ${formatDuration(track.duration)}`, inline: true },
      { name: "Volume", value: `${Math.round(player.volume * 100)}%`, inline: true },
      { name: "Loop", value: player.loopMode.charAt(0).toUpperCase() + player.loopMode.slice(1), inline: true },
    );

  if (track.thumbnail) embed.setThumbnail(track.thumbnail);
  await message.reply({ embeds: [embed], components: buildPlayerControls() });
};