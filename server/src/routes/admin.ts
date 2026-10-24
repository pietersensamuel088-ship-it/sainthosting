import { Router, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { orchestrationEngine } from '../engine/orchestration.js';
import { generateAdminToken, requireAdminAuth } from '../middleware/auth.js';
import { config } from '../config.js';
import { sanitizeString } from '../middleware/sanitization.js';
import { proxmoxClient } from '../engine/proxmoxClient.js';

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

/**
 * Test Connection to Proxmox VE API using API Token
 */
router.post('/proxmox/test', requireAdminAuth, async (req: Request, res: Response): Promise<void> => {
  const { host, port, tokenId, tokenSecret, nodeName } = req.body;

  const targetHost = host || config.proxmox.host;
  const targetPort = port ? parseInt(port, 10) : config.proxmox.port;
  const targetTokenId = tokenId || config.proxmox.tokenId;
  const targetTokenSecret = tokenSecret || config.proxmox.tokenSecret;
  const targetNodeName = nodeName || config.proxmox.nodeName;

  const result = await proxmoxClient.testConnection({
    host: targetHost,
    port: targetPort,
    tokenId: targetTokenId,
    tokenSecret: targetTokenSecret,
    nodeName: targetNodeName,
  });

  if (!result.success) {
    res.status(400).json(result);
    return;
  }

  res.json(result);
});

/**
 * Save and activate verified Proxmox VE API credentials
 */
router.post('/proxmox/save', requireAdminAuth, async (req: Request, res: Response): Promise<void> => {
  const { host, port, tokenId, tokenSecret, nodeName } = req.body;

  if (!host || !tokenId || !tokenSecret) {
    res.status(400).json({
      success: false,
      message: 'Host, API Token ID, and Token Secret are required to establish the bridge.',
    });
    return;
  }

  // Update in-memory configuration
  config.proxmox.host = host.trim();
  config.proxmox.port = port ? parseInt(port, 10) : 8006;
  config.proxmox.tokenId = tokenId.trim();
  config.proxmox.tokenSecret = tokenSecret.trim();
  config.proxmox.nodeName = (nodeName || 'pve').trim();

  // Persist to .env file if available
  try {
    const envPath = path.resolve(__dirname, '../../../.env');
    if (fs.existsSync(envPath)) {
      let envContent = fs.readFileSync(envPath, 'utf-8');
      
      const updateOrAppend = (key: string, value: string) => {
        const regex = new RegExp(`^${key}=.*$`, 'm');
        if (regex.test(envContent)) {
          envContent = envContent.replace(regex, `${key}=${value}`);
        } else {
          envContent += `\n${key}=${value}`;
        }
      };

      updateOrAppend('PROXMOX_HOST', config.proxmox.host);
      updateOrAppend('PROXMOX_PORT', config.proxmox.port.toString());
      updateOrAppend('PROXMOX_API_TOKEN_ID', config.proxmox.tokenId);
      updateOrAppend('PROXMOX_API_TOKEN_SECRET', config.proxmox.tokenSecret);
      updateOrAppend('PROXMOX_NODE_NAME', config.proxmox.nodeName);

      fs.writeFileSync(envPath, envContent.trim() + '\n', 'utf-8');
    }
  } catch (err) {
    console.warn('[ENV_WRITE_WARNING] Could not write to .env, in-memory updated:', err);
  }

  res.json({
    success: true,
    message: 'Proxmox VE bridge activated. Real hypervisor telemetry is now online.',
    config: {
      host: config.proxmox.host,
      port: config.proxmox.port,
      tokenId: config.proxmox.tokenId,
      nodeName: config.proxmox.nodeName,
      status: 'CONNECTED',
    },
  });
});

/**
 * Get Proxmox VE connection status & hypervisor telemetry
 */
router.get('/proxmox/status', requireAdminAuth, async (req: Request, res: Response): Promise<void> => {
  const isConfigured = Boolean(config.proxmox.host && config.proxmox.tokenId);
  let liveNodeStatus = null;

  if (isConfigured) {
    liveNodeStatus = await proxmoxClient.fetchRealNodeStatus();
  }

  res.json({
    success: true,
    configured: isConfigured,
    config: {
      host: config.proxmox.host || '',
      port: config.proxmox.port || 8006,
      tokenId: config.proxmox.tokenId || '',
      nodeName: config.proxmox.nodeName || 'pve',
    },
    liveNodeStatus,
  });
});

export default router;
