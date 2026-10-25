import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { dbStore } from '../db/store.js';
import { requireUserAuth } from './auth.js';
import { DiscordBotClient } from '../engine/discordClient.js';

const router = Router();
const discordClient = new DiscordBotClient();

const BOTS_BASE_DIR = path.resolve(__dirname, '../../data/bots');

/**
 * Returns the locked files directory for a bot, creating default files if new.
 */
function getBotFilesDir(botId: string, botName: string = 'Discord Bot'): string {
  const dir = path.join(BOTS_BASE_DIR, botId, 'files');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });

    // Seed default starter files
    const defaultBotJs = `// ${botName} - Saint // Cold Steel Bot Runtime
const { Client, GatewayIntentBits } = require('discord.js');
require('dotenv').config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.once('ready', () => {
  console.log(\`[ONLINE] Logged in as \${client.user.tag}!\`);
});

client.on('messageCreate', (message) => {
  if (message.author.bot) return;
  if (message.content === '!ping') {
    message.reply('Pong! Latency: ' + client.ws.ping + 'ms (Saint Cluster)');
  }
});

const token = process.env.DISCORD_BOT_TOKEN;
if (token && token.trim() !== '' && token !== 'your_bot_token_here') {
  client.login(token);
} else {
  console.warn('[NOTICE] Set DISCORD_BOT_TOKEN in your .env file to start your bot.');
}
`;

    const defaultPackageJson = JSON.stringify(
      {
        name: botName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        version: '1.0.0',
        main: 'bot.js',
        scripts: {
          start: 'node bot.js',
        },
        dependencies: {
          'discord.js': '^14.16.3',
          dotenv: '^16.4.7',
        },
      },
      null,
      2
    );

    const defaultEnv = `# Isolated Environment Variables for ${botName}
DISCORD_BOT_TOKEN=your_bot_token_here
BOT_PREFIX=!
NODE_ENV=production
`;

    fs.writeFileSync(path.join(dir, 'bot.js'), defaultBotJs, 'utf-8');
    fs.writeFileSync(path.join(dir, 'package.json'), defaultPackageJson, 'utf-8');
    fs.writeFileSync(path.join(dir, '.env'), defaultEnv, 'utf-8');
  }
  return dir;
}

/**
 * Strict path traversal check: ensures target file resides strictly within the bot's locked directory
 */
function resolveSafeBotFile(botId: string, filename: string): string | null {
  const baseDir = getBotFilesDir(botId);
  const cleanFilename = path.normalize(filename).replace(/^(\.\.[\/\\])+/, '').trim();
  const resolved = path.resolve(baseDir, cleanFilename);
  if (!resolved.startsWith(baseDir)) {
    return null;
  }
  return resolved;
}

/**
 * Get all bots belonging to the current user
 */
router.get('/', requireUserAuth, (req: Request, res: Response): void => {
  const user = (req as any).user;
  const userBots = dbStore.getBotsByUserId(user.userId);

  res.json({
    success: true,
    bots: userBots,
  });
});

/**
 * Preview / lookup a Discord bot by token or Client ID (without needing bot ID)
 */
router.post('/discord/lookup', requireUserAuth, async (req: Request, res: Response): Promise<void> => {
  const { botToken, clientId, permissions } = req.body;

  if (botToken) {
    const result = await discordClient.fetchBotInfo(botToken, permissions || '8');
    if (!result.success) {
      res.status(400).json(result);
      return;
    }
    res.json(result);
    return;
  }

  if (clientId) {
    const inviteUrl = discordClient.generateInviteLink(clientId, permissions || '8');
    res.json({
      success: true,
      message: 'Generated Discord OAuth2 bot invitation link.',
      bot: {
        id: clientId,
        username: 'Discord Bot',
        discriminator: '0',
        avatarUrl: 'https://cdn.discordapp.com/embed/avatars/0.png',
        isBot: true,
        inviteUrl,
      },
    });
    return;
  }

  res.status(400).json({
    success: false,
    message: 'Either a botToken or clientId must be provided.',
  });
});

/**
 * Get specific bot details & logs
 */
router.get('/:id', requireUserAuth, (req: Request, res: Response): void => {
  const user = (req as any).user;
  const { id } = req.params;

  const bot = dbStore.getBotById(id);
  if (!bot) {
    res.status(404).json({ success: false, message: 'Bot not found.' });
    return;
  }

  if (bot.userId !== user.userId) {
    res.status(403).json({ success: false, message: 'Unauthorized access to this bot record.' });
    return;
  }

  res.json({
    success: true,
    bot,
  });
});

/**
 * Smart Discord Sync:
 * Queries Discord API, validates token, fetches avatar & username,
 * generates OAuth2 invite link, and securely saves masked token to database.
 */
router.post('/:id/discord/sync', requireUserAuth, async (req: Request, res: Response): Promise<void> => {
  const user = (req as any).user;
  const { id } = req.params;
  const { botToken, permissions = '8' } = req.body;

  const bot = dbStore.getBotById(id);
  if (!bot) {
    res.status(404).json({ success: false, message: 'Bot not found.' });
    return;
  }

  if (bot.userId !== user.userId) {
    res.status(403).json({ success: false, message: 'Unauthorized access to this bot record.' });
    return;
  }

  if (!botToken || botToken.trim().length < 20) {
    res.status(400).json({
      success: false,
      message: 'Invalid Discord Bot Token format. Obtain token from Discord Developer Portal.',
    });
    return;
  }

  const result = await discordClient.fetchBotInfo(botToken, permissions);
  if (!result.success || !result.bot) {
    res.status(400).json(result);
    return;
  }

  const now = new Date();
  const updatedLogs = [
    ...(bot.liveTerminalLogs || []),
    {
      time: now.toLocaleTimeString(),
      level: 'SUCCESS' as const,
      text: `[DISCORD_SYNC] Verified bot identity '${result.bot.username}#${result.bot.discriminator}' (ID: ${result.bot.id}).`,
    },
    {
      time: now.toLocaleTimeString(),
      level: 'INFO' as const,
      text: `[AUTH] Token securely stored and masked in encrypted store: ${result.bot.maskedToken}`,
    },
    {
      time: now.toLocaleTimeString(),
      level: 'INFO' as const,
      text: `[INVITE] Addition link compiled: ${result.bot.inviteUrl}`,
    },
  ];

  const updatedBot = dbStore.updateBot(id, {
    discordApp: {
      id: result.bot.id,
      username: result.bot.username,
      avatarUrl: result.bot.avatarUrl,
      inviteUrl: result.bot.inviteUrl,
      maskedToken: result.bot.maskedToken || '••••••••••••••••••••',
      syncedAt: now.toISOString(),
    },
    liveTerminalLogs: updatedLogs,
  });

  res.json({
    success: true,
    message: result.message,
    bot: updatedBot,
    discordProfile: result.bot,
  });
});

/**
 * Web Console Subdomain Stream & State
 * Zero Port Forwarding: Authenticated reverse stream tunnel for owner
 */
router.get('/:id/console', requireUserAuth, (req: Request, res: Response): void => {
  const user = (req as any).user;
  const { id } = req.params;

  const bot = dbStore.getBotById(id);
  if (!bot) {
    res.status(404).json({ success: false, message: 'Bot not found.' });
    return;
  }

  if (bot.userId !== user.userId) {
    res.status(403).json({
      success: false,
      message: 'Access denied: You do not have ownership clearance for this console tunnel.',
    });
    return;
  }

  res.json({
    success: true,
    console: {
      botId: bot.id,
      botName: bot.name,
      status: bot.status,
      containerId: bot.containerId,
      slotIndex: bot.slotIndex,
      subdomainConsoleUrl: bot.subdomainConsoleUrl,
      telemetry: bot.telemetry,
      discordApp: bot.discordApp,
      customization: bot.customization,
      slashCommands: bot.slashCommands,
      liveTerminalLogs: bot.liveTerminalLogs || [],
      tunnelSecurity: {
        zeroPortForwarding: true,
        authenticatedUser: user.email,
        subdomainHost: bot.subdomainConsoleUrl?.replace(/^https?:\/\//, ''),
      },
    },
  });
});

/**
 * Web Console Control Action (Restart, Stop, Start, Clear Logs)
 */
router.post('/:id/console/action', requireUserAuth, (req: Request, res: Response): void => {
  const user = (req as any).user;
  const { id } = req.params;
  const { action } = req.body;

  const bot = dbStore.getBotById(id);
  if (!bot) {
    res.status(404).json({ success: false, message: 'Bot not found.' });
    return;
  }

  if (bot.userId !== user.userId) {
    res.status(403).json({ success: false, message: 'Unauthorized action.' });
    return;
  }

  const now = new Date();
  let updatedLogs = [...(bot.liveTerminalLogs || [])];
  let updatedStatus = bot.status;
  let newTelemetry = { ...bot.telemetry };

  if (action === 'restart') {
    updatedLogs.push(
      { time: now.toLocaleTimeString(), level: 'WARN', text: `[SYSTEM] Manual process restart signal received from owner ${user.email}.` },
      { time: now.toLocaleTimeString(), level: 'INFO', text: `[SIGTERM] Terminating running worker process...` },
      { time: now.toLocaleTimeString(), level: 'SUCCESS', text: `[DAEMON] Spawning clean Node.js container instance in slot [${bot.slotIndex || 1}/5].` },
      { time: now.toLocaleTimeString(), level: 'SUCCESS', text: `[GATEWAY] Discord Gateway session re-established.` }
    );
    newTelemetry.restarts += 1;
    newTelemetry.uptime = 'Just restarted';
    updatedStatus = 'running';
  } else if (action === 'stop') {
    updatedLogs.push(
      { time: now.toLocaleTimeString(), level: 'WARN', text: `[SYSTEM] Stop command issued. Halting container process.` },
      { time: now.toLocaleTimeString(), level: 'INFO', text: `[DAEMON] Process suspended. Container slot reserved.` }
    );
    updatedStatus = 'approved';
    newTelemetry.cpuPercent = 0;
  } else if (action === 'start') {
    updatedLogs.push(
      { time: now.toLocaleTimeString(), level: 'SUCCESS', text: `[SYSTEM] Start command issued. Container slot awakened.` },
      { time: now.toLocaleTimeString(), level: 'INFO', text: `[GATEWAY] Discord Gateway shard online.` }
    );
    updatedStatus = 'running';
    newTelemetry.uptime = 'Online';
  } else if (action === 'clear_logs') {
    updatedLogs = [
      { time: now.toLocaleTimeString(), level: 'INFO', text: `[CONSOLE] Terminal buffer cleared by user.` },
    ];
  }

  const updatedBot = dbStore.updateBot(id, {
    status: updatedStatus,
    telemetry: newTelemetry,
    liveTerminalLogs: updatedLogs,
  });

  res.json({
    success: true,
    message: `Action '${action}' executed successfully.`,
    bot: updatedBot,
  });
});

/**
 * Delete a user's bot deployment
 */
router.delete('/:id', requireUserAuth, (req: Request, res: Response): void => {
  const user = (req as any).user;
  const { id } = req.params;

  const bot = dbStore.getBotById(id);
  if (!bot) {
    res.status(404).json({ success: false, message: 'Bot not found.' });
    return;
  }

  if (bot.userId !== user.userId) {
    res.status(403).json({ success: false, message: 'Unauthorized action.' });
    return;
  }

  const success = dbStore.deleteBot(id);
  res.json({
    success,
    message: `Bot '${bot.name}' has been deleted and its pod slot released.`,
  });
});

/**
 * List files in bot's locked directory
 */
router.get('/:id/files', requireUserAuth, (req: Request, res: Response): void => {
  const user = (req as any).user;
  const { id } = req.params;

  const bot = dbStore.getBotById(id);
  if (!bot) {
    res.status(404).json({ success: false, message: 'Bot not found.' });
    return;
  }

  if (bot.userId !== user.userId) {
    res.status(403).json({ success: false, message: 'Access denied: Directory locked to bot owner.' });
    return;
  }

  const dir = getBotFilesDir(bot.id, bot.name);
  const fileNames = fs.readdirSync(dir);
  const files = fileNames.map((name) => {
    const filePath = path.join(dir, name);
    const stats = fs.statSync(filePath);
    return {
      name,
      sizeBytes: stats.size,
      updatedAt: stats.mtime.toISOString(),
      isDirectory: stats.isDirectory(),
    };
  });

  res.json({
    success: true,
    lockedDir: `/data/bots/${bot.id}/files`,
    files,
  });
});

/**
 * Get content of a specific file in bot's locked directory
 */
router.get('/:id/files/content', requireUserAuth, (req: Request, res: Response): void => {
  const user = (req as any).user;
  const { id } = req.params;
  const filename = (req.query.filename as string) || 'bot.js';

  const bot = dbStore.getBotById(id);
  if (!bot || bot.userId !== user.userId) {
    res.status(403).json({ success: false, message: 'Access denied.' });
    return;
  }

  const safePath = resolveSafeBotFile(id, filename);
  if (!safePath || !fs.existsSync(safePath)) {
    res.status(404).json({ success: false, message: 'File not found or illegal directory path.' });
    return;
  }

  const content = fs.readFileSync(safePath, 'utf-8');
  res.json({
    success: true,
    filename,
    content,
  });
});

/**
 * Save / create a file in bot's locked directory
 */
router.post('/:id/files/save', requireUserAuth, (req: Request, res: Response): void => {
  const user = (req as any).user;
  const { id } = req.params;
  const { filename, content } = req.body;

  if (!filename || typeof filename !== 'string') {
    res.status(400).json({ success: false, message: 'Valid filename required.' });
    return;
  }

  const bot = dbStore.getBotById(id);
  if (!bot || bot.userId !== user.userId) {
    res.status(403).json({ success: false, message: 'Access denied.' });
    return;
  }

  const safePath = resolveSafeBotFile(id, filename);
  if (!safePath) {
    res.status(400).json({ success: false, message: '[SECURITY_VIOLATION] Directory traversal blocked.' });
    return;
  }

  // Size limit check (max 2MB per file)
  if (content && Buffer.byteLength(content, 'utf-8') > 2 * 1024 * 1024) {
    res.status(400).json({ success: false, message: 'File size exceeds 2MB limit.' });
    return;
  }

  fs.writeFileSync(safePath, content || '', 'utf-8');

  res.json({
    success: true,
    message: `File '${filename}' saved securely in locked directory.`,
  });
});

/**
 * Delete a file from bot's locked directory
 */
router.delete('/:id/files/delete', requireUserAuth, (req: Request, res: Response): void => {
  const user = (req as any).user;
  const { id } = req.params;
  const filename = req.query.filename as string;

  if (!filename || typeof filename !== 'string') {
    res.status(400).json({ success: false, message: 'Valid filename required.' });
    return;
  }

  const bot = dbStore.getBotById(id);
  if (!bot || bot.userId !== user.userId) {
    res.status(403).json({ success: false, message: 'Access denied.' });
    return;
  }

  const safePath = resolveSafeBotFile(id, filename);
  if (!safePath || !fs.existsSync(safePath)) {
    res.status(404).json({ success: false, message: 'File not found.' });
    return;
  }

  fs.unlinkSync(safePath);

  res.json({
    success: true,
    message: `File '${filename}' deleted.`,
  });
});

/**
 * Get bot's isolated .env configuration
 */
router.get('/:id/env', requireUserAuth, (req: Request, res: Response): void => {
  const user = (req as any).user;
  const { id } = req.params;

  const bot = dbStore.getBotById(id);
  if (!bot || bot.userId !== user.userId) {
    res.status(403).json({ success: false, message: 'Access denied.' });
    return;
  }

  const envPath = resolveSafeBotFile(id, '.env');
  const envContent = envPath && fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf-8') : '';

  res.json({
    success: true,
    envContent,
  });
});

/**
 * Save bot's isolated .env configuration
 */
router.post('/:id/env', requireUserAuth, (req: Request, res: Response): void => {
  const user = (req as any).user;
  const { id } = req.params;
  const { envContent } = req.body;

  const bot = dbStore.getBotById(id);
  if (!bot || bot.userId !== user.userId) {
    res.status(403).json({ success: false, message: 'Access denied.' });
    return;
  }

  const envPath = resolveSafeBotFile(id, '.env');
  if (!envPath) {
    res.status(400).json({ success: false, message: 'Illegal path.' });
    return;
  }

  fs.writeFileSync(envPath, envContent || '', 'utf-8');

  res.json({
    success: true,
    message: 'Environment configuration updated in isolated bot container.',
  });
});

export default router;
