/**
 * Gateway WebSocket API 对接
 * 用于获取Gateway实时数据（Session、Agent状态等）
 */

export interface SessionInfo {
  key: string;
  agentId: string;
  channel: string;
  lastMessage: string | null;
  lastActiveAt: string | null;
  status: 'active' | 'idle' | 'expired';
}

export class GatewayAPI {
  private gatewayHost: string;
  private gatewayPort: number;

  constructor(host = 'localhost', port = 18789) {
    this.gatewayHost = host;
    this.gatewayPort = port;
  }

  private async fetchJSON(path: string): Promise<any> {
    try {
      const res = await fetch(`http://${this.gatewayHost}:${this.gatewayPort}${path}`, {
        signal: AbortSignal.timeout(5000),
      });
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  /** 从文件系统获取Session列表（替代方案） */
  async getSessionsFromFS(): Promise<SessionInfo[]> {
    const fs = require('fs');
    const path = require('path');
    const sessionDir = path.join(process.env.HOME!, '.openclaw');
    const sessions: SessionInfo[] = [];

    // Scan agent session directories
    const agentsDir = path.join(sessionDir, 'agents');
    if (!fs.existsSync(agentsDir)) return sessions;

    for (const agentDir of fs.readdirSync(agentsDir)) {
      const agentPath = path.join(agentsDir, agentDir, 'sessions');
      if (!fs.existsSync(agentPath)) continue;

      for (const file of fs.readdirSync(agentPath)) {
        if (!file.endsWith('.jsonl')) continue;

        const sessionKey = file.replace('.jsonl', '');
        const filePath = path.join(agentPath, file);
        const stat = fs.statSync(filePath);

        // Extract agent ID from session key
        const agentId = sessionKey.split(':')[1] || agentDir;
        const channel = sessionKey.split(':')[2] || 'unknown';

        // Check last modification time
        const lastActiveAt = stat.mtime.toISOString();
        const minutesAgo = (Date.now() - stat.mtimeMs) / 60000;

        sessions.push({
          key: sessionKey,
          agentId,
          channel,
          lastMessage: null,
          lastActiveAt,
          status: minutesAgo < 5 ? 'active' : minutesAgo < 30 ? 'idle' : 'expired',
        });
      }
    }

    return sessions;
  }

  /** 获取Agent的Session状态 */
  async getAgentSessions(agentId: string): Promise<SessionInfo[]> {
    const allSessions = await this.getSessionsFromFS();
    return allSessions.filter(s => s.agentId === agentId);
  }
}

export const gatewayAPI = new GatewayAPI();
