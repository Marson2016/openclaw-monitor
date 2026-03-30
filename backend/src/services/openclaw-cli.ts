import { execSync } from 'child_process';
import { GatewayStatus, Agent, Channel } from '../types';

export class OpenClawCLI {
  private exec(cmd: string): string {
    try {
      // 过滤掉 [plugins] 开头的日志行
      const raw = execSync(cmd, { encoding: 'utf-8', timeout: 10000 }).trim();
      return raw
        .split('\n')
        .filter(l => !l.startsWith('[plugins]'))
        .join('\n')
        .trim();
    } catch {
      return '';
    }
  }

  getVersion(): string {
    // openclaw --version 输出可能有plugins前缀，过滤后只取版本行
    try {
      const raw = execSync('openclaw --version 2>&1', { encoding: 'utf-8', timeout: 5000 });
      const lines = raw.split('\n').filter(l => !l.startsWith('[plugins]'));
      for (const line of lines) {
        const m = line.match(/OpenClaw\s+([\d.]+(?:\s*\([^)]*\))?)/i);
        if (m) return m[0].trim();
      }
      return lines[lines.length - 1]?.trim() || 'unknown';
    } catch {
      return 'unknown';
    }
  }

  getGatewayStatus(): GatewayStatus {
    const raw = execSync('openclaw gateway status 2>&1', { encoding: 'utf-8', timeout: 10000 });
    const lines = raw.split('\n').filter(l => !l.startsWith('[plugins]'));
    const statusText = lines.join('\n');

    // 判断状态：如果有 "Service:" 或 "Command:" 行说明在运行
    const isRunning = statusText.includes('Service:') || statusText.includes('Command:');

    // 提取端口
    const portMatch = statusText.match(/--port\s+(\d+)/);
    const port = portMatch ? parseInt(portMatch[1]) : 18789;

    // 获取本地IP
    let ip = '127.0.0.1';
    try {
      ip = execSync("hostname -I | awk '{print $1}'", { encoding: 'utf-8', timeout: 5000 }).trim();
    } catch {}

    // PID
    let pid: number | null = null;
    try {
      const pidOut = execSync("pgrep -f 'openclaw.*gateway' | head -1", { encoding: 'utf-8', timeout: 5000 }).trim();
      if (pidOut) pid = parseInt(pidOut);
    } catch {}

    return {
      status: isRunning ? 'running' : 'stopped',
      ip,
      port,
      mode: 'local',
      version: this.getVersion(),
      uptime: this.getUptime(),
      models: this.getLoadedModels(),
      pid,
    };
  }

  private getUptime(): string {
    try {
      const pidOut = execSync("pgrep -f 'openclaw.*gateway' | head -1", { encoding: 'utf-8', timeout: 5000 }).trim();
      if (pidOut) {
        const psOut = execSync(`ps -p ${pidOut} -o etime=`, { encoding: 'utf-8', timeout: 5000 }).trim();
        return psOut || 'unknown';
      }
    } catch {}
    return 'unknown';
  }

  private getLoadedModels(): string[] {
    try {
      const raw = execSync('openclaw models list 2>&1', { encoding: 'utf-8', timeout: 10000 });
      const lines = raw.split('\n').filter(l => !l.startsWith('[plugins]'));

      const models: string[] = [];
      for (const line of lines) {
        // 格式: "bailian/kimi-k2.5                          text+image 256k     no    yes   ..."
        const match = line.match(/^(\S+\/\S+)\s+/);
        if (match) {
          // 提取模型名（去掉alias部分）
          const fullModel = match[1];
          models.push(fullModel);
        }
      }
      return models;
    } catch {
      return [];
    }
  }

  getChannels(): Channel[] {
    try {
      const raw = execSync('openclaw channels list 2>&1', { encoding: 'utf-8', timeout: 10000 });
      const lines = raw.split('\n').filter(l => !l.startsWith('[plugins]'));

      const channels: Channel[] = [];
      for (const line of lines) {
        // 格式: "- Feishu boy: configured, enabled"
        const match = line.match(/^-\s+(\w+)\s+(\w+):\s*(.*)/);
        if (match) {
          const platform = match[1];
          const instance = match[2];
          const details = match[3];

          channels.push({
            id: `${platform.toLowerCase()}_${instance.toLowerCase()}`,
            name: `${platform} ${instance}`,
            status: details.includes('enabled') ? 'enabled' :
                    details.includes('error') ? 'error' : 'disabled',
            plugins: this.getPluginsForChannel(platform),
            agents: [instance.toLowerCase()],
            lastActiveAt: null,
          });
        }
      }
      return channels;
    } catch {
      return [];
    }
  }

  private getPluginsForChannel(platform: string): string[] {
    const pluginMap: Record<string, string[]> = {
      feishu: ['doc', 'chat', 'wiki', 'drive', 'bitable'],
      discord: ['chat'],
      telegram: ['chat'],
    };
    return pluginMap[platform.toLowerCase()] || [];
  }

  getAgents(): Agent[] {
    try {
      const raw = execSync('openclaw agents list 2>&1', { encoding: 'utf-8', timeout: 10000 });
      const lines = raw.split('\n').filter(l => !l.startsWith('[plugins]'));

      const agents: Agent[] = [];
      let currentAgent: Partial<Agent> | null = null;

      for (const line of lines) {
        // 顶级agent: "- tom (default)" 或 "- ken"
        const agentMatch = line.match(/^-\s+(\w+)(?:\s*\((\w+)\))?/);
        if (agentMatch) {
          if (currentAgent && currentAgent.id) {
            agents.push(currentAgent as Agent);
          }
          currentAgent = {
            id: agentMatch[1],
            name: agentMatch[1],
            model: 'unknown',
            status: 'idle',
            workspace: '',
            lastActiveAt: null,
            sessionKey: null,
          };
          continue;
        }

        // 子属性: "  Identity: 💻 tom (IDENTITY.md)"
        if (currentAgent) {
          const identityMatch = line.match(/Identity:\s*(.+)/);
          if (identityMatch) {
            const raw = identityMatch[1].trim();
            // 提取emoji后面的名称，去掉emoji和(IDENTITY.md)
            const nameOnly = raw
              .replace(/\p{Extended_Pictographic}/gu, '')
              .replace(/\(IDENTITY\.md\)/i, '')
              .replace(/IDENTITY\.md/i, '')
              .trim();
            if (nameOnly) currentAgent.name = nameOnly;
          }

          const modelMatch = line.match(/Model:\s*(\S+)/);
          if (modelMatch) currentAgent.model = modelMatch[1];

          const wsMatch = line.match(/Workspace:\s*(\S+)/);
          if (wsMatch) currentAgent.workspace = wsMatch[1].replace('~', process.env.HOME || '');
        }
      }

      // 最后一个agent
      if (currentAgent && currentAgent.id) {
        agents.push(currentAgent as Agent);
      }

      return agents;
    } catch {
      return [];
    }
  }
}

export const openclawCLI = new OpenClawCLI();
