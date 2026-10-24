import { Router, Request, Response } from 'express';
import { orchestrationEngine } from '../engine/orchestration.js';
import { validateAndCleanGitHubUrl, sanitizeString } from '../middleware/sanitization.js';
import { submissionLimiter } from '../middleware/rateLimiter.js';

const router = Router();

/**
 * Public GitHub Deployment Ingest
 * Rate-limited to max 5 submissions per minute
 */
router.post('/', submissionLimiter, (req: Request, res: Response): void => {
  const { repoUrl, botName, framework, entrypoint, envVariablesCount } = req.body;

  if (!repoUrl) {
    res.status(400).json({
      success: false,
      error: 'MISSING_REPO_URL',
      message: 'GitHub repository URL is required.',
    });
    return;
  }

  // Deep-clean and validate public GitHub URL
  const validation = validateAndCleanGitHubUrl(repoUrl);
  if (!validation.valid) {
    res.status(400).json({
      success: false,
      error: 'INVALID_GITHUB_URL',
      message: validation.error || 'Invalid GitHub repository format.',
    });
    return;
  }

  const cleanBotName = sanitizeString(botName || '');
  const cleanFramework = sanitizeString(framework || 'Node.js / Discord.js');
  const cleanEntrypoint = sanitizeString(entrypoint || 'index.js');
  const parsedEnvCount = typeof envVariablesCount === 'number' ? Math.max(0, Math.min(50, envVariablesCount)) : 0;

  // Submit to orchestration engine (defaults to pending_approval)
  const deployment = orchestrationEngine.submitGitHubDeployment({
    repoUrl: validation.cleaned,
    botName: cleanBotName,
    framework: cleanFramework,
    entrypoint: cleanEntrypoint,
    envVariablesCount: parsedEnvCount,
  });

  res.status(201).json({
    success: true,
    message: `Repository '${validation.cleaned}' ingested. System status: PENDING_APPROVAL.`,
    deployment,
    nextStep: {
      action: 'ADMIN_GATE_CLEARANCE',
      detail: 'Bot container will spin up inside Proxmox once approved by sysadmin.',
      id: deployment.id,
    },
  });
});

/**
 * Query status and pipeline logs of a specific deployment
 */
router.get('/:id', (req: Request, res: Response): void => {
  const { id } = req.params;
  const dep = orchestrationEngine.getDeploymentById(id);

  if (!dep) {
    res.status(404).json({
      success: false,
      error: 'DEPLOYMENT_NOT_FOUND',
      message: `No active or queued deployment matching '${id}'.`,
    });
    return;
  }

  res.json({
    success: true,
    deployment: dep,
  });
});

export default router;
