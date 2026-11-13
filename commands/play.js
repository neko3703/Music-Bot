import { EmbedBuilder } from "discord.js";
import { joinVoiceChannel } from "@discordjs/voice";
import { extractTrack } from "../utils/extractor.js";
import { formatDuration, truncate } from "../utils/formatting.js";
import { ensureRequestChannel } from "../utils/permissions.js";
import { buildPlayerControls } from "../interactions/playerControls.js";

export default async (client, message, args) => {
  const query = args.join(" ");
  if (!query) return message.reply("Provide a song name or URL.");
  if (!await ensureRequestChannel(message, client)) return;

  const member = message.member;
  if (!member?.voice?.channel) return message.reply("Join a voice channel first.");

  const channel = member.voice.channel;
  let connection = client.voiceConnections?.get(message.guild.id);

  try {
    const { joinVoiceChannel: jvc } = await import("@discordjs/voice");
    connection = jvc({
      channelId: channel.id,
      guildId: message.guild.id,
      adapterCreator: message.guild.voiceAdapterCreator,
      selfDeaf: true,
    });
    if (!client.voiceConnections) client.voiceConnections = new Map();
    client.voiceConnections.set(message.guild.id, connection);
  } catch {
    return message.reply("I couldn't connect to that voice channel.");
  }

  const status = await message.reply(`🔎 Searching for **${truncate(query, 80)}**...`);

  try {
    const track = await extractTrack(query, member.displayName);
    if (!track) return status.edit("I couldn't find a playable track.");

    const player = client.playerManager.get(message.guild.id);
    player.addTrack(track);

    if (!player.isPlaying && !player.isPaused) {
      await player.start();
    }

    const position = player.current === track ? "Now playing" : String(player.queue.length);

    const embed = new EmbedBuilder()
      .setTitle("Added to Queue")
      .setDescription(`**[${truncate(track.title, 200)}](${track.webpageUrl})**`)
      .setColor(0x5865f2)
      .addFields(
        { name: "Duration", value: formatDuration(track.duration), inline: true },
        { name: "Requested by", value: `<@${member.id}>`, inline: true },
        { name: "Position", value: position, inline: true },
      );

    if (track.thumbnail) embed.setThumbnail(track.thumbnail);

    await status.edit({ content: null, embeds: [embed], components: buildPlayerControls() });
  } catch (err) {
    console.error("[Play]", err);
    await status.edit("Unable to play that track.").catch(() => {});
  }
};