import "dotenv/config";
import { Client, GatewayIntentBits } from "discord.js";
import path from "path";
import { fileURLToPath } from "url";

// ── Core systems ──
import SettingsStore from "./utils/SettingsStore.js";
import PlayerManager from "./utils/PlayerManager.js";

// ── Commands ──
import playCmd from "./commands/play.js";
import joinCmd from "./commands/join.js";
import pauseCmd from "./commands/pause.js";
import resumeCmd from "./commands/resume.js";
import skipCmd from "./commands/skip.js";
import voteskipCmd from "./commands/voteskip.js";
import previousCmd from "./commands/previous.js";
import stopCmd from "./commands/stop.js";
import leaveCmd from "./commands/leave.js";
import nowplayingCmd from "./commands/nowplaying.js";
import seekCmd from "./commands/seek.js";
import restartCmd from "./commands/restart.js";
import volumeCmd from "./commands/volume.js";
import loopCmd from "./commands/loop.js";
import queueCmd from "./commands/queue.js";
import shuffleCmd from "./commands/shuffle.js";
import removeCmd from "./commands/remove.js";
import moveCmd from "./commands/move.js";
import skiptoCmd from "./commands/skipto.js";
import clearqueueCmd from "./commands/clearqueue.js";
import filterCmd from "./commands/filter.js";
import bassCmd from "./commands/bass.js";
import trebleCmd from "./commands/treble.js";
import resetfiltersCmd from "./commands/resetfilters.js";
import djroleCmd from "./commands/djrole.js";
import requestchannelCmd from "./commands/requestchannel.js";
import autoplayCmd from "./commands/autoplay.js";
import alwaysonCmd from "./commands/alwayson.js";
import helpCmd from "./commands/help.js";

// ── Interactions ──
import playerControlsHandler from "./interactions/playerControls.js";

// ── Config ──
const PREFIX = process.env.COMMAND_PREFIX ?? "!";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildVoiceStates,
  ],
});

// ── Attach shared systems to client ──
client.settingsStore = new SettingsStore(path.resolve(__dirname, "..", "settings.json"));
client.playerManager = new PlayerManager(client);
client.voiceConnections = new Map();

// ── Command registry ──
const commands = new Map();
commands.set("play", playCmd);
commands.set("p", playCmd);
commands.set("join", joinCmd);
commands.set("pause", pauseCmd);
commands.set("resume", resumeCmd);
commands.set("skip", skipCmd);
commands.set("s", skipCmd);
commands.set("voteskip", voteskipCmd);
commands.set("vs", voteskipCmd);
commands.set("previous", previousCmd);
commands.set("prev", previousCmd);
commands.set("stop", stopCmd);
commands.set("leave", leaveCmd);
commands.set("disconnect", leaveCmd);
commands.set("dc", leaveCmd);
commands.set("nowplaying", nowplayingCmd);
commands.set("np", nowplayingCmd);
commands.set("seek", seekCmd);
commands.set("restart", restartCmd);
commands.set("volume", volumeCmd);
commands.set("vol", volumeCmd);
commands.set("loop", loopCmd);
commands.set("queue", queueCmd);
commands.set("q", queueCmd);
commands.set("shuffle", shuffleCmd);
commands.set("remove", removeCmd);
commands.set("move", moveCmd);
commands.set("skipto", skiptoCmd);
commands.set("clearqueue", clearqueueCmd);
commands.set("cq", clearqueueCmd);
commands.set("filter", filterCmd);
commands.set("bass", bassCmd);
commands.set("treble", trebleCmd);
commands.set("resetfilters", resetfiltersCmd);
commands.set("rf", resetfiltersCmd);
commands.set("djrole", djroleCmd);
commands.set("requestchannel", requestchannelCmd);
commands.set("autoplay", autoplayCmd);
commands.set("247", alwaysonCmd);
commands.set("alwayson", alwaysonCmd);
commands.set("help", helpCmd);

// ── Message handler (prefix commands) ──
client.on("messageCreate", async (message) => {
  if (message.author.bot || !message.guild) return;
  if (!message.content.startsWith(PREFIX)) return;

  const args = message.content.slice(PREFIX.length).trim().split(/\s+/);
  const commandName = args.shift().toLowerCase();

  const command = commands.get(commandName);
  if (!command) return;

  try {
    await command(client, message, args);
  } catch (error) {
    console.error(`[Command] Error in '${commandName}':`, error);
    message.reply("Something went wrong running that command.").catch(() => {});
  }
});

// ── Interaction handler (buttons) ──
client.on("interactionCreate", async (interaction) => {
  try {
    await playerControlsHandler(client, interaction);
  } catch (error) {
    console.error("[Interaction] Error:", error);
  }
});

// ── Voice state handler (cleanup on disconnect) ──
client.on("voiceStateUpdate", (oldState, newState) => {
  // Bot was disconnected from voice
  if (oldState.id === client.user.id && oldState.channelId && !newState.channelId) {
    const player = client.playerManager.getExisting(oldState.guild.id);
    if (player) {
      player.stop();
      client.playerManager.remove(oldState.guild.id);
    }
    client.voiceConnections.delete(oldState.guild.id);
    console.log(`[Voice] Bot disconnected from guild ${oldState.guild.id}`);
  }
});

// ── Ready ──
client.once("ready", () => {
  console.log(`[Music Bot] Logged in as ${client.user.tag}`);
  console.log(`[Music Bot] Prefix: ${PREFIX}`);
  console.log(`[Music Bot] Commands: ${[...new Set(commands.values())].length} unique (${commands.size} with aliases)`);
  console.log(`[Music Bot] Guilds: ${client.guilds.cache.size}`);
});

client.login(process.env.BOT_TOKEN);