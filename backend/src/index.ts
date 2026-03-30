import express from 'express';
import cors from 'cors';
import cron from 'node-cron';
import { openclawCLI } from './services/openclaw-cli';
import { gatewayAPI } from './services/gateway-api';
import { taskManager } from './services/task-manager';

import gatewayRoutes from './routes/gateway';
import channelRoutes from './routes/channels';
import agentRoutes from './routes/agents';
import taskRoutes from './routes/tasks';

const app = express();
const PORT = process.env.PORT || 3456;

app.use(cors());
app.use(express.json());

// ── API Routes ──

app.use('/api/gateway', gatewayRoutes);
app.use('/api/channels', channelRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/agents', taskRoutes); // tasks mounted under /api/agents/:agentId/tasks

/** GET /api/dashboard - 聚合接口 */
app.get('/api/dashboard', async (req, res) => {
  const gateway = openclawCLI.getGatewayStatus();
  const channels = openclawCLI.getChannels();
  const agents = openclawCLI.getAgents();

  // 补充Agent状态
  const sessions = await gatewayAPI.getSessionsFromFS();
  const enrichedAgents = agents.map(agent => {
    const agentSessions = sessions.filter(s => s.agentId === agent.id);
    const activeSessions = agentSessions.filter(s => s.status === 'active');
    return {
      ...agent,
      status: activeSessions.length > 0 ? 'active' as const :
              agentSessions.length > 0 ? 'idle' as const : 'offline' as const,
      lastActiveAt: agentSessions.map(s => s.lastActiveAt).filter(Boolean).sort().pop() || null,
    };
  });

  const taskSummaries = taskManager.getAllSummaries();
  const recentHistory = taskManager.getRecentHistory(10);

  res.json({
    success: true,
    data: {
      gateway,
      channels,
      agents: enrichedAgents,
      activeAgentCount: enrichedAgents.filter(a => a.status === 'active').length,
      totalAgentCount: enrichedAgents.length,
      taskSummaries,
      recentHistory,
      lastUpdated: new Date().toISOString(),
    },
  });
});

/** GET /api/health */
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    data: {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    },
  });
});

// ── 定时任务：每15分钟自动采集Agent任务状态 ──
cron.schedule('*/15 * * * *', async () => {
  console.log(`[${new Date().toISOString()}] Running auto task detection...`);
  try {
    await taskManager.autoDetectTasks();
    console.log('Task detection completed');
  } catch (err) {
    console.error('Task detection failed:', err);
  }
});

// ── 启动 ──
app.listen(PORT, () => {
  console.log(`🦞 OpenClaw Monitor Backend running on http://localhost:${PORT}`);
  console.log(`📊 Dashboard API: http://localhost:${PORT}/api/dashboard`);
  console.log(`❤️  Health check: http://localhost:${PORT}/api/health`);
});

export default app;
