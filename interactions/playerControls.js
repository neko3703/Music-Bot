import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  MessageFlags,
} from "discord.js";
import { formatDuration, truncate } from "../utils/formatting.js";

export function buildPlayerControls() {
  const row1 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("music_pause_resume")
      .setLabel("Pause / Resume")
      .setEmoji("⏯️")
      .setStyle(ButtonStyle.Primary),
    new ButtonBuilder()
      .setCustomId("music_skip")
      .setLabel("Skip")
      .setEmoji("⏭️")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("music_stop")
      .setLabel("Stop")
      .setEmoji("⏹️")
      .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
      .setCustomId("music_previous")
      .setLabel("Previous")
      .setEmoji("⏮️")
      .setStyle(ButtonStyle.Secondary),
  );

  const row2 = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("music_shuffle")
      .setLabel("Shuffle")
      .setEmoji("🔀")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("music_loop")
      .setLabel("Loop")
      .setEmoji("🔁")
      .setStyle(ButtonStyle.Secondary),
    new ButtonBuilder()
      .setCustomId("music_refresh")
      .setLabel("Refresh")
      .setEmoji("🔄")
      .setStyle(ButtonStyle.Success),
  );

  return [row1, row2];
}

function buildNowPlayingEmbed(player) {
  const track = player.current;
  if (!track) return null;

  const embed = new EmbedBuilder()
    .setTitle("🎵 Now Playing")
    .setDescription(`**[${truncate(track.title, 200)}](${track.webpageUrl})**`)
    .setColor(0x5865f2)
    .addFields(
      {
        name: "Progress",
        value: `${formatDuration(player.getPosition())} / ${formatDuration(track.duration)}`,
        inline: true,
      },
      {
        name: "Volume",
        value: `${Math.round(player.volume * 100)}%`,
        inline: true,
      },
      {
        name: "Loop",
        value: player.loopMode.charAt(0).toUpperCase() + player.loopMode.slice(1),
        inline: true,
      },
    );

  if (track.uploader) {
    embed.addFields({ name: "Uploader", value: track.uploader, inline: true });
  }
  if (track.requestedBy) {
    embed.addFields({ name: "Requested by", value: String(track.requestedBy), inline: true });
  }
  if (track.thumbnail) {
    embed.setThumbnail(track.thumbnail);
  }

  const queued = player.queue.length;
  if (queued > 0) {
    embed.setFooter({ text: `${queued} track${queued !== 1 ? "s" : ""} in queue` });
  }

  return embed;
}

export default async (client, interaction) => {
  if (!interaction.isButton()) return;
  if (!interaction.customId.startsWith("music_")) return;

  const player = client.playerManager.getExisting(interaction.guild?.id);
  if (!player) {
    return interaction.reply({ content: "No active player in this server.", flags: MessageFlags.Ephemeral });
  }

  const member = interaction.member;
  if (!member?.voice?.channel) {
    return interaction.reply({ content: "Join a voice channel first.", flags: MessageFlags.Ephemeral });
  }

  const conn = player.connection;
  if (!conn || member.voice.channel.id !== conn.joinConfig.channelId) {
    return interaction.reply({ content: "You must be in my voice channel.", flags: MessageFlags.Ephemeral });
  }

  const action = interaction.customId.replace("music_", "");

  try {
    switch (action) {
      case "pause_resume": {
        if (player.isPlaying) {
          player.audioPlayer.pause();
          await interaction.reply({ content: "⏸️ Playback paused.", flags: MessageFlags.Ephemeral });
        } else if (player.isPaused) {
          player.audioPlayer.unpause();
          await interaction.reply({ content: "▶️ Playback resumed.", flags: MessageFlags.Ephemeral });
        } else {
          await interaction.reply({ content: "Nothing is currently playing.", flags: MessageFlags.Ephemeral });
        }
        break;
      }

      case "skip": {
        const ok = await player.skip();
        await interaction.reply({
          content: ok ? "⏭️ Skipped the current track." : "Nothing is playing.",
          flags: MessageFlags.Ephemeral,
        });
        break;
      }

      case "stop": {
        await player.stop();
        await interaction.reply({
          content: "⏹️ Playback stopped and queue cleared.",
          flags: MessageFlags.Ephemeral,
        });
        break;
      }

      case "previous": {
        const ok = await player.previous();
        await interaction.reply({
          content: ok ? "⏮️ Playing the previous track." : "No previous track available.",
          flags: MessageFlags.Ephemeral,
        });
        break;
      }

      case "shuffle": {
        if (player.queue.length < 2) {
          await interaction.reply({
            content: "Need at least two queued tracks to shuffle.",
            flags: MessageFlags.Ephemeral,
          });
        } else {
          player.shuffle();
          await interaction.reply({ content: "🔀 Queue shuffled.", flags: MessageFlags.Ephemeral });
        }
        break;
      }

      case "loop": {
        const modes = ["off", "track", "queue"];
        const currentIndex = modes.indexOf(player.loopMode);
        const nextMode = modes[(currentIndex + 1) % modes.length];
        player.setLoop(nextMode);

        const labels = { off: "🔁 Loop disabled", track: "🔂 Looping current track", queue: "🔁 Looping entire queue" };
        await interaction.reply({ content: labels[nextMode], flags: MessageFlags.Ephemeral });
        break;
      }

      case "refresh": {
        const embed = buildNowPlayingEmbed(player);
        if (!embed) {
          await interaction.reply({ content: "Nothing is currently playing.", flags: MessageFlags.Ephemeral });
        } else {
          await interaction.update({ embeds: [embed], components: buildPlayerControls() });
        }
        break;
      }

      default: {
        await interaction.reply({ content: "Unknown action.", flags: MessageFlags.Ephemeral });
      }
    }
  } catch (err) {
    console.error("[PlayerControls] Button error:", err);
    const reply = interaction.replied || interaction.deferred
      ? interaction.followUp.bind(interaction)
      : interaction.reply.bind(interaction);
    await reply({ content: "Something went wrong.", flags: MessageFlags.Ephemeral }).catch(() => {});
  }
};