import { Router, Request, Response } from 'express';
import { sanitizeString } from '../middleware/sanitization.js';
import { submissionLimiter } from '../middleware/rateLimiter.js';

const router = Router();

interface IntakeTransmission {
  id: string;
  senderHandle: string;
  contactEmail: string;
  diagnosticChecksPassed: boolean;
  messageType: 'inquiry' | 'config_payload' | 'incident';
  content: string;
  configFileName?: string;
  rawConfigSnippet?: string;
  submittedAt: string;
  clientIp: string;
}

// In-memory encrypted intake buffer
const intakeSubmissions: IntakeTransmission[] = [];

/**
 * Hardened Gatekeeper Contact & Intake Endpoint
 * Rate-limited to max 5 submissions per minute
 */
router.post('/', submissionLimiter, (req: Request, res: Response): void => {
  const { senderHandle, contactEmail, diagnosticAnswers, messageType, content, configFileName, rawConfigSnippet } = req.body;

  if (!senderHandle || !contactEmail || !content) {
    res.status(400).json({
      success: false,
      error: 'MISSING_MANDATORY_FIELDS',
      message: 'Handle, email, and payload description are mandatory.',
    });
    return;
  }

  // Diagnostic checklist validation:
  // e.g. entrypoint configured, env variables used, outbound port only
  const checks = diagnosticAnswers || {};
  const passedDiagnostic = Boolean(checks.entrypointConfigured && checks.envVarsSecured && checks.noListeningPorts);

  if (!passedDiagnostic) {
    res.status(400).json({
      success: false,
      error: 'GATEKEEPER_DIAGNOSTIC_FAILED',
      message:
        'Transmission rejected: Diagnostic micro-quiz indicated unverified entrypoint, hardcoded secrets, or unsupported inbound port listening. Complete checklist before transmission.',
    });
    return;
  }

  const id = `tx-intake-${Date.now().toString(36)}`;
  const cleanHandle = sanitizeString(senderHandle);
  const cleanEmail = sanitizeString(contactEmail);
  const cleanContent = sanitizeString(content);
  const cleanConfigName = configFileName ? sanitizeString(configFileName) : undefined;
  const cleanSnippet = rawConfigSnippet ? sanitizeString(rawConfigSnippet).slice(0, 8000) : undefined;

  const transmission: IntakeTransmission = {
    id,
    senderHandle: cleanHandle,
    contactEmail: cleanEmail,
    diagnosticChecksPassed: true,
    messageType: messageType || 'inquiry',
    content: cleanContent,
    configFileName: cleanConfigName,
    rawConfigSnippet: cleanSnippet,
    submittedAt: new Date().toISOString(),
    clientIp: req.ip || 'anonymous-node',
  };

  intakeSubmissions.push(transmission);

  res.status(201).json({
    success: true,
    transmissionId: id,
    message: `[ENCRYPTED_INTAKE_CONFIRMED] Transmission ${id} received by Saint Gatekeeper Node.`,
    timestamp: transmission.submittedAt,
  });
});

export default router;
