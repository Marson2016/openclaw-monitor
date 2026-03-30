import { Router } from 'express';
import { taskManager } from '../services/task-manager';

const router = Router();

/** GET /api/agents/:agentId/tasks */
router.get('/:agentId/tasks', (req, res) => {
  const tasks = taskManager.getAgentTasks(req.params.agentId);
  res.json({ success: true, data: tasks });
});

/** POST /api/agents/:agentId/tasks */
router.post('/:agentId/tasks', (req, res) => {
  const { agentId } = req.params;
  const data = req.body;

  if (!data || typeof data !== 'object') {
    return res.status(400).json({ success: false, error: 'Invalid request body' });
  }

  const updated = taskManager.updateAgentTasks(agentId, data);
  res.json({ success: true, data: updated });
});

export default router;
