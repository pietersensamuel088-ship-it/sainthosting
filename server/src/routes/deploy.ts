import { Router, Request, Response } from 'express';
import { orchestrationEngine } from '../engine/orchestration.js';
import { validateAndCleanGitHubUrl, sanitizeString } from '../middleware/sanitization.js';
import { submissionLimiter } from '../middleware/rateLimiter.js';
import { requireUserAuth } from './auth.js';

const router = Router();

/**
 * Public GitHub Deployment Ingest
 * Requires User Authentication & rate limited to 5 submissions/min
 */
router.post('/', requireUserAuth, submissionLimiter, (req: Request, res: Response): void => {
  const user = (req as any).user;
  const { repoUrl, botName, framework, customization } = req.body;

  if (!repoUrl) {
    res.status(400).json({
      success: false,
      error: 'MISSING_REPO_URL',
      message: 'GitHub repository URL is required.',
    });
    return;
  }

  // Validate GitHub URL
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
  const cleanFramework = sanitizeString(framework || 'Node.js (Auto-detected)');

  // Submit to orchestration engine & save to user's database records
  const deployment = orchestrationEngine.submitGitHubDeployment(user.userId, user.email, {
    repoUrl: validation.cleaned,
    botName: cleanBotName,
    framework: cleanFramework,
    customization,
  });

  res.status(201).json({
    success: true,
    message: `Repository '${validation.cleaned}' submitted. Status: PENDING_APPROVAL.`,
    deployment,
  });
});

/**
 * Query status of a specific deployment
 */
router.get('/:id', (req: Request, res: Response): void => {
  const { id } = req.params;
  const dep = orchestrationEngine.getClusterStatus().containers
    .flatMap(c => c.allocatedBots)
    .includes(id);

  res.json({
    success: true,
    id,
  });
});

export default router;
