import { Router, Request, Response } from 'express';
import { orchestrationEngine } from '../engine/orchestration.js';
import { sanitizeSlashCommand, sanitizeString } from '../middleware/sanitization.js';
import { submissionLimiter } from '../middleware/rateLimiter.js';
import { requireUserAuth } from './auth.js';
import { DiscordCustomization, SlashCommandDef } from '../db/store.js';

const router = Router();

/**
 * AI Bot Blueprint Studio Ingest
 * Requires User Authentication & rate limited to 5 submissions/min
 */
router.post('/', requireUserAuth, submissionLimiter, (req: Request, res: Response): void => {
  const user = (req as any).user;
  const { botName, framework, scopeSummary, slashCommands, customization } = req.body;

  if (!botName || !scopeSummary) {
    res.status(400).json({
      success: false,
      error: 'MISSING_FIELDS',
      message: 'Both bot name and scope summary are required.',
    });
    return;
  }

  // Validate and sanitize slash commands
  const sanitizedCommands: SlashCommandDef[] = [];
  if (Array.isArray(slashCommands)) {
    for (const cmd of slashCommands) {
      if (!cmd || typeof cmd !== 'object') continue;
      const cleanCmd = sanitizeSlashCommand(cmd.name, cmd.description, cmd.parameters, cmd.ephemeral);
      if (cleanCmd.valid) {
        sanitizedCommands.push({
          name: cleanCmd.name,
          description: cleanCmd.description,
          parameters: cleanCmd.parameters,
          ephemeral: cleanCmd.ephemeral,
        });
      }
    }
  }

  const cleanName = sanitizeString(botName);
  const cleanFramework = 'Discord.js v14';
  const cleanScope = sanitizeString(scopeSummary);

  // Validate Discord Customization
  const cleanCustomization: DiscordCustomization = {
    statusMode: ['online', 'idle', 'dnd', 'invisible'].includes(customization?.statusMode)
      ? customization.statusMode
      : 'online',
    activityType: ['Playing', 'Streaming', 'Listening to', 'Watching', 'Competing in', 'Custom'].includes(customization?.activityType)
      ? customization.activityType
      : 'Listening to',
    activityText: sanitizeString(customization?.activityText || '/help | Saint Hosting'),
    streamUrl: customization?.streamUrl ? sanitizeString(customization.streamUrl) : undefined,
    embedColor: customization?.embedColor && /^#[0-9A-Fa-f]{6}$/.test(customization.embedColor)
      ? customization.embedColor
      : '#FF0000',
    embedAuthorName: customization?.embedAuthorName ? sanitizeString(customization.embedAuthorName) : undefined,
    embedFooterText: customization?.embedFooterText ? sanitizeString(customization.embedFooterText) : 'Powered by Saint Hosting',
    enableTimestamps: Boolean(customization?.enableTimestamps ?? true),
    intents: {
      messageContent: Boolean(customization?.intents?.messageContent ?? true),
      guildMembers: Boolean(customization?.intents?.guildMembers ?? false),
      guildPresences: Boolean(customization?.intents?.guildPresences ?? false),
    },
    ephemeralReplies: Boolean(customization?.ephemeralReplies ?? false),
    defaultAdminOnly: Boolean(customization?.defaultAdminOnly ?? false),
  };

  const blueprint = orchestrationEngine.submitBotBlueprint(user.userId, user.email, {
    botName: cleanName,
    framework: cleanFramework,
    scopeSummary: cleanScope,
    customization: cleanCustomization,
    slashCommands: sanitizedCommands,
  });

  res.status(201).json({
    success: true,
    message: `Bot '${cleanName}' created and queued. Status: PENDING_APPROVAL.`,
    blueprint,
  });
});

export default router;
