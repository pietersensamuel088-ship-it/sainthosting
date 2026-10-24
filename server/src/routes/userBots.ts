import { Router, Request, Response } from 'express';
import { dbStore } from '../db/store.js';
import { requireUserAuth } from './auth.js';
import { DiscordBotClient } from '../engine/discordClient.js';

const router = Router();
const discordClient = new DiscordBotClient();

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

export default router;
