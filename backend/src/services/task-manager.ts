import { Task, AgentTaskList } from '../types';
import { gatewayAPI } from './gateway-api';
import { openclawCLI } from './openclaw-cli';

const fs = require('fs');
const path = require('path');

/** 内存存储 + 文件持久化 */
class TaskManager {
  private taskFile: string;
  private agentTasks: Map<string, AgentTaskList> = new Map();

  constructor() {
    this.taskFile = path.join(__dirname, '../../data/tasks.json');
    this.ensureDir();
    this.load();
  }

  private ensureDir() {
    const dir = path.dirname(this.taskFile);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  }

  private load() {
    if (fs.existsSync(this.taskFile)) {
      try {
        const data = JSON.parse(fs.readFileSync(this.taskFile, 'utf-8'));
        for (const [k, v] of Object.entries(data)) {
          this.agentTasks.set(k, v as AgentTaskList);
        }
      } catch {}
    }
  }

  private save() {
    const obj: Record<string, AgentTaskList> = {};
    for (const [k, v] of this.agentTasks) obj[k] = v;
    fs.writeFileSync(this.taskFile, JSON.stringify(obj, null, 2));
  }

  /** 获取Agent任务列表 */
  getAgentTasks(agentId: string): AgentTaskList {
    return this.agentTasks.get(agentId) || {
      agentId,
      historicalTasks: [],
      currentTask: null,
      pendingTasks: [],
    };
  }

  /** 更新Agent任务 */
  updateAgentTasks(agentId: string, data: Partial<AgentTaskList>): AgentTaskList {
    const existing = this.getAgentTasks(agentId);

    if (data.currentTask) {
      data.currentTask.updatedAt = new Date().toISOString();
      if (data.currentTask.status === 'completed' && !data.currentTask.completedAt) {
        data.currentTask.completedAt = new Date().toISOString();
      }
    }

    const updated: AgentTaskList = {
      ...existing,
      ...data,
      agentId,
    };

    this.agentTasks.set(agentId, updated);
    this.save();
    return updated;
  }

  /** 从Session文件自动解析任务 */
  async autoDetectTasks(): Promise<void> {
    const agents = openclawCLI.getAgents();

    for (const agent of agents) {
      const sessions = await gatewayAPI.getAgentSessions(agent.id);

      for (const session of sessions) {
        if (session.status !== 'active') continue;

        // 尝试从jsonl文件最后一条消息提取任务信息
        try {
          const fs = require('fs');
          const sessionDir = path.join(
            process.env.HOME!, '.openclaw', 'agents', agent.id, 'sessions'
          );
          const filePath = path.join(sessionDir, `${session.key}.jsonl`);

          if (!fs.existsSync(filePath)) continue;
          const content = fs.readFileSync(filePath, 'utf-8');
          const lines = content.trim().split('\n');

          // 读取最后几行找最近的用户消息
          for (let i = lines.length - 1; i >= Math.max(0, lines.length - 10); i--) {
            try {
              const entry = JSON.parse(lines[i]);
              if (entry.role === 'user' && entry.content) {
                const text = typeof entry.content === 'string'
                  ? entry.content
                  : entry.content?.[0]?.text || '';

                if (text && !text.startsWith('[') && text.length > 10 && text.length < 200) {
                  const existing = this.getAgentTasks(agent.id);
                  if (!existing.currentTask || existing.currentTask.status === 'completed') {
                    this.updateAgentTasks(agent.id, {
                      currentTask: {
                        id: `auto-${Date.now()}`,
                        title: text.slice(0, 80),
                        status: 'in_progress',
                        progress: 50,
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString(),
                      },
                    });
                  }
                  break;
                }
              }
            } catch {}
          }
        } catch {}
      }
    }
  }

  /** 获取所有Agent任务汇总 */
  getAllSummaries() {
    const agents = openclawCLI.getAgents();
    return agents.map(agent => {
      const tasks = this.getAgentTasks(agent.id);
      return {
        agentId: agent.id,
        agentName: agent.name,
        currentTask: tasks.currentTask,
        progress: tasks.currentTask?.progress || 0,
      };
    });
  }

  /** 获取最近完成的历史任务 */
  getRecentHistory(limit = 20) {
    const history: Array<{
      agentId: string;
      agentName: string;
      taskTitle: string;
      completedAt: string;
    }> = [];

    const agents = openclawCLI.getAgents();
    for (const agent of agents) {
      const tasks = this.getAgentTasks(agent.id);
      for (const task of tasks.historicalTasks) {
        if (task.status === 'completed' && task.completedAt) {
          history.push({
            agentId: agent.id,
            agentName: agent.name,
            taskTitle: task.title,
            completedAt: task.completedAt,
          });
        }
      }
    }

    return history
      .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime())
      .slice(0, limit);
  }
}

export const taskManager = new TaskManager();
