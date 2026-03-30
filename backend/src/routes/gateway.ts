import { Router } from 'express';
import { openclawCLI } from '../services/openclaw-cli';

const router = Router();

/** GET /api/gateway/status */
router.get('/status', (req, res) => {
  const status = openclawCLI.getGatewayStatus();
  res.json({ success: true, data: status });
});

/** GET /api/gateway/models */
router.get('/models', (req, res) => {
  const status = openclawCLI.getGatewayStatus();
  res.json({ success: true, data: status.models });
});

export default router;
