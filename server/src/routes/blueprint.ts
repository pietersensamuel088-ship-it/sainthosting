import { Router, Request, Response } from 'express';
import { orchestrationEngine, SlashCommandDef } from '../engine/orchestration.js';
import { sanitizeSlashCommand, sanitizeString } from '../middleware/sanitization.js';
import { submissionLimiter } from '../middleware/rateLimiter.js';

const router = Router();

/**
 * AI Bot Blueprint Studio Ingest
 * Rate-limited to max 5 submissions per minute
 */
router.post('/', submissionLimiter, (req: Request, res: Response): void => {
  const { botName, framework, scopeSummary, slashCommands, databaseRequirement } = req.body;

  if (!botName || !scopeSummary) {
    res.status(400).json({
      success: false,
      error: 'MISSING_BLUEPRINT_FIELDS',
      message: 'Both bot name and scope summary are mandatory for blueprint synthesis.',
    });
    return;
  }

  // Validate and sanitize slash commands list
  const sanitizedCommands: SlashCommandDef[] = [];
  if (Array.isArray(slashCommands)) {
    for (const cmd of slashCommands) {
      if (!cmd || typeof cmd !== 'object') continue;
      const cleanCmd = sanitizeSlashCommand(cmd.name, cmd.description, cmd.parameters);
      if (cleanCmd.valid) {
        sanitizedCommands.push({
          name: cleanCmd.name,
          description: cleanCmd.description,
          parameters: cleanCmd.parameters,
        });
      }
    }
  }

  const cleanName = sanitizeString(botName);
  const cleanFramework = sanitizeString(framework || 'TypeScript / Discord.js');
  const cleanScope = sanitizeString(scopeSummary);
  const cleanDb = sanitizeString(databaseRequirement || 'None');

  const blueprint = orchestrationEngine.submitBotBlueprint({
    botName: cleanName,
    framework: cleanFramework,
    scopeSummary: cleanScope,
    slashCommands: sanitizedCommands,
    databaseRequirement: cleanDb,
  });

  res.status(201).json({
    success: true,
    message: `AI Blueprint '${cleanName}' compiled and queued. Status: PENDING_APPROVAL.`,
    blueprint,
  });
});

export default router;
