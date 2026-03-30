import { Router } from 'express';
import { openclawCLI } from '../services/openclaw-cli';
import { gatewayAPI } from '../services/gateway-api';

const router = Router();

/** GET /api/agents */
router.get('/', async (req, res) => {
  const agents = openclawCLI.getAgents();
  const sessions = await gatewayAPI.getSessionsFromFS();

  // 补充Agent状态
  const enrichedAgents = agents.map(agent => {
    const agentSessions = sessions.filter(s => s.agentId === agent.id);
    const activeSessions = agentSessions.filter(s => s.status === 'active');

    return {
      ...agent,
      status: activeSessions.length > 0 ? 'active' as const :
              agentSessions.length > 0 ? 'idle' as const : 'offline' as const,
      lastActiveAt: agentSessions
        .map(s => s.lastActiveAt)
        .filter(Boolean)
        .sort()
        .pop() || null,
    };
  });

  res.json({ success: true, data: enrichedAgents });
});

/** GET /api/agents/:id */
router.get('/:id', async (req, res) => {
  const agents = openclawCLI.getAgents();
  const agent = agents.find(a => a.id === req.params.id);

  if (!agent) {
    return res.status(404).json({ success: false, error: 'Agent not found' });
  }

  const sessions = await gatewayAPI.getAgentSessions(agent.id);
  const activeSessions = sessions.filter(s => s.status === 'active');

  res.json({
    success: true,
    data: {
      ...agent,
      status: activeSessions.length > 0 ? 'active' : 'idle',
      sessions,
    },
  });
});

export default router;
