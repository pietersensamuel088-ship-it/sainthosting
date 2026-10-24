import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { dbStore, UserRecord } from '../db/store.js';
import { config } from '../config.js';
import { sanitizeString } from '../middleware/sanitization.js';
import { submissionLimiter } from '../middleware/rateLimiter.js';

const router = Router();

export interface UserSessionPayload {
  userId: string;
  email: string;
  username: string;
  avatarUrl?: string;
  provider: 'local' | 'discord';
}

export function generateUserToken(user: UserRecord): string {
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      username: user.username,
      avatarUrl: user.avatarUrl,
      provider: user.provider,
    },
    config.jwtSecret,
    { expiresIn: '7d' }
  );
}

export function requireUserAuth(req: Request, res: Response, next: Function): void {
  const token = req.cookies?.saint_user_session || req.headers.authorization?.replace(/^Bearer\s+/i, '');

  if (!token) {
    res.status(401).json({
      success: false,
      error: 'AUTH_REQUIRED',
      message: 'Authentication required. Please sign in with Discord or create an account.',
    });
    return;
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as UserSessionPayload;
    (req as any).user = decoded;
    next();
  } catch (err) {
    res.status(401).json({
      success: false,
      error: 'INVALID_SESSION',
      message: 'Your session has expired. Please log in again.',
    });
  }
}

/**
 * Register with Email & Password
 */
router.post('/register', submissionLimiter, (req: Request, res: Response): void => {
  const { email, username, password } = req.body;

  if (!email || !username || !password) {
    res.status(400).json({
      success: false,
      error: 'MISSING_FIELDS',
      message: 'Email, username, and password are required.',
    });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({
      success: false,
      error: 'WEAK_PASSWORD',
      message: 'Password must be at least 6 characters.',
    });
    return;
  }

  try {
    const cleanEmail = sanitizeString(email).toLowerCase();
    const cleanUsername = sanitizeString(username);

    const newUser = dbStore.createUser({
      email: cleanEmail,
      username: cleanUsername,
      password,
      provider: 'local',
      avatarUrl: `https://api.dicebear.com/7.x/identicon/svg?seed=${cleanUsername}`,
    });

    const token = generateUserToken(newUser);

    res.cookie('saint_user_session', token, {
      httpOnly: true,
      secure: config.nodeEnv === 'production',
      sameSite: config.nodeEnv === 'production' ? 'strict' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    res.status(201).json({
      success: true,
      message: 'Account created successfully.',
      user: {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username,
        avatarUrl: newUser.avatarUrl,
        provider: newUser.provider,
      },
      token,
    });
  } catch (err: any) {
    res.status(400).json({
      success: false,
      error: 'REGISTRATION_FAILED',
      message: err.message || 'Registration failed.',
    });
  }
});

/**
 * Login with Email & Password
 */
router.post('/login', submissionLimiter, (req: Request, res: Response): void => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({
      success: false,
      error: 'MISSING_FIELDS',
      message: 'Email and password are required.',
    });
    return;
  }

  const user = dbStore.findUserByEmail(email);
  if (!user || !user.passwordHash || !user.salt) {
    res.status(401).json({
      success: false,
      error: 'INVALID_CREDENTIALS',
      message: 'Invalid email or password.',
    });
    return;
  }

  const isValid = dbStore.verifyPassword(password, user.passwordHash, user.salt);
  if (!isValid) {
    res.status(401).json({
      success: false,
      error: 'INVALID_CREDENTIALS',
      message: 'Invalid email or password.',
    });
    return;
  }

  const token = generateUserToken(user);

  res.cookie('saint_user_session', token, {
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: config.nodeEnv === 'production' ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });

  res.json({
    success: true,
    message: 'Welcome back.',
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      avatarUrl: user.avatarUrl,
      provider: user.provider,
    },
    token,
  });
});

/**
 * Discord OAuth Sign-In (Direct Discord redirect or simulation)
 */
router.post('/discord', (req: Request, res: Response): void => {
  const { discordId, username, email, avatarUrl } = req.body;

  // Use provided Discord credentials or generate verified Discord profile
  const id = discordId || `discord_${Date.now().toString(36)}`;
  const cleanEmail = (email || `${username || 'user'}@discord.user`).toLowerCase();
  const cleanUsername = username || 'DiscordUser';

  let user = dbStore.findUserByDiscordId(id) || dbStore.findUserByEmail(cleanEmail);

  if (!user) {
    user = dbStore.createUser({
      email: cleanEmail,
      username: cleanUsername,
      provider: 'discord',
      discordId: id,
      avatarUrl: avatarUrl || 'https://cdn.discordapp.com/embed/avatars/1.png',
    });
  }

  const token = generateUserToken(user);

  res.cookie('saint_user_session', token, {
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: config.nodeEnv === 'production' ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/',
  });

  res.json({
    success: true,
    message: 'Connected with Discord.',
    user: {
      id: user.id,
      email: user.email,
      username: user.username,
      avatarUrl: user.avatarUrl,
      provider: user.provider,
    },
    token,
  });
});

/**
 * Get current session
 */
router.get('/me', (req: Request, res: Response): void => {
  const token = req.cookies?.saint_user_session || req.headers.authorization?.replace(/^Bearer\s+/i, '');

  if (!token) {
    res.json({ authenticated: false, user: null });
    return;
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as UserSessionPayload;
    res.json({ authenticated: true, user: decoded });
  } catch {
    res.json({ authenticated: false, user: null });
  }
});

/**
 * Logout
 */
router.post('/logout', (req: Request, res: Response): void => {
  res.clearCookie('saint_user_session', { path: '/' });
  res.json({ success: true, message: 'Logged out successfully.' });
});

export default router;
