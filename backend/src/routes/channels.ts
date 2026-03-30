import { Router } from 'express';
import { openclawCLI } from '../services/openclaw-cli';
import { gatewayAPI } from '../services/gateway-api';

const router = Router();

/** GET /api/channels */
router.get('/', async (req, res) => {
  const channels = openclawCLI.getChannels();

  // 补充最后活跃时间
  const sessions = await gatewayAPI.getSessionsFromFS();
  for (const ch of channels) {
    const chSessions = sessions.filter(s =>
      s.channel === ch.id || s.channel.includes(ch.id)
    );
    if (chSessions.length > 0) {
      ch.lastActiveAt = chSessions
        .map(s => s.lastActiveAt)
        .filter(Boolean)
        .sort()
        .pop() || null;
    }
  }

  res.json({ success: true, data: channels });
});

export default router;
