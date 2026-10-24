import { Router, Request, Response } from 'express';
import { orchestrationEngine } from '../engine/orchestration.js';

const router = Router();

router.get('/status', (req: Request, res: Response) => {
  const status = orchestrationEngine.getClusterStatus();
  res.json({
    success: true,
    data: status,
    timestamp: new Date().toISOString(),
  });
});

router.get('/telemetry', (req: Request, res: Response) => {
  const telemetry = orchestrationEngine.getProxmoxTelemetry();
  res.json({
    success: true,
    telemetry,
    timestamp: new Date().toISOString(),
  });
});

export default router;
