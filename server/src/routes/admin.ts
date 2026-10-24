import { Router, Request, Response } from 'express';
import { orchestrationEngine } from '../engine/orchestration.js';
import { generateAdminToken, requireAdminAuth } from '../middleware/auth.js';
import { config } from '../config.js';
import { sanitizeString } from '../middleware/sanitization.js';

const router = Router();

/**
 * Admin Authentication - Sets HTTP-only Cookie
 */
router.post('/login', (req: Request, res: Response): void => {
  const { password, email } = req.body;

  if (!password || password !== config.adminPassword) {
    res.status(401).json({
      success: false,
      error: '[ACCESS_DENIED]',
      message: 'Invalid administrative security phrase.',
    });
    return;
  }

  const token = generateAdminToken(email || config.adminEmail);

  // Set HTTP-Only Secure Cookie
  res.cookie('saint_admin_token', token, {
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: config.nodeEnv === 'production' ? 'strict' : 'lax',
    maxAge: 8 * 60 * 60 * 1000, // 8 hours
    path: '/',
  });

  res.json({
    success: true,
    message: 'Authentication verified. Administrative clearance granted.',
    admin: {
      email: email || config.adminEmail,
      role: 'admin',
      clusterNode: 'pve-saint-01',
    },
    token, // Also return for non-cookie API testing
  });
});

/**
 * Admin Logout
 */
router.post('/logout', (req: Request, res: Response) => {
  res.clearCookie('saint_admin_token', { path: '/' });
  res.json({
    success: true,
    message: 'Administrative session terminated. Security lock engaged.',
  });
});

/**
 * Check admin session status
 */
router.get('/session', requireAdminAuth, (req: Request, res: Response) => {
  res.json({
    success: true,
    authenticated: true,
    user: (req as any).adminUser,
  });
});

/**
 * Get all deployments (Pending, Running, Rejected)
 */
router.get('/deployments', requireAdminAuth, (req: Request, res: Response) => {
  const { status } = req.query;
  const deployments = orchestrationEngine.getAllDeployments(status as any);
  const cluster = orchestrationEngine.getClusterStatus();

  res.json({
    success: true,
    deployments,
    cluster,
  });
});

/**
 * Admin Verification Gate: Approve Deployment
 * Triggers 5-Bot Physical Ceiling & Proxmox Capacity Trigger
 */
router.post('/approve/:id', requireAdminAuth, (req: Request, res: Response): void => {
  const { id } = req.params;

  const result = orchestrationEngine.approveDeployment(id);

  if (!result.success) {
    res.status(400).json({
      success: false,
      error: result.error,
      capacityAlertTriggered: result.capacityAlertTriggered || false,
      message: result.message,
    });
    return;
  }

  res.json({
    success: true,
    message: result.message,
    deployment: result.deployment,
  });
});

/**
 * Reject Deployment with Reason
 */
router.post('/reject/:id', requireAdminAuth, (req: Request, res: Response): void => {
  const { id } = req.params;
  const { reason } = req.body;

  const cleanReason = sanitizeString(reason || 'Violates repository integrity criteria.');
  const result = orchestrationEngine.rejectDeployment(id, cleanReason);

  if (!result.success) {
    res.status(404).json({
      success: false,
      message: result.message,
    });
    return;
  }

  res.json({
    success: true,
    message: result.message,
    deployment: result.deployment,
  });
});

/**
 * Manually provision an additional Proxmox VM node / LXC container
 * Expands cluster capacity and resolves capacity trigger alert
 */
router.post('/provision-node', requireAdminAuth, (req: Request, res: Response): void => {
  const { label } = req.body;
  const newContainer = orchestrationEngine.provisionProxmoxNode(label);

  res.status(201).json({
    success: true,
    message: `[PROXMOX_PROVISIONED] New virtual container node '${newContainer.label}' (${newContainer.id}) initialized. +5 bot slots added.`,
    container: newContainer,
    clusterStatus: orchestrationEngine.getClusterStatus(),
  });
});

export default router;
