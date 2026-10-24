import { Router, Request, Response } from 'express';
import { dbStore } from '../db/store.js';
import { requireUserAuth } from './auth.js';

const router = Router();

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

export default router;
