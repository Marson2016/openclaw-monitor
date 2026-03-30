export interface GatewayStatus {
  status: 'running' | 'stopped' | 'error';
  ip: string;
  port: number;
  mode: 'local' | 'remote' | 'dev';
  version: string;
  uptime: string;
  models: string[];
  pid: number | null;
}

export interface Channel {
  id: string;
  name: string;
  status: 'enabled' | 'disabled' | 'error';
  plugins: string[];
  agents: string[];
  lastActiveAt: string | null;
}

export interface Agent {
  id: string;
  name: string;
  model: string;
  status: 'active' | 'idle' | 'offline';
  workspace: string;
  lastActiveAt: string | null;
  sessionKey: string | null;
}

export interface Task {
  id: string;
  title: string;
  status: 'completed' | 'in_progress' | 'pending';
  progress: number;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
}

export interface AgentTaskList {
  agentId: string;
  historicalTasks: Task[];
  currentTask: Task | null;
  pendingTasks: Task[];
}

export interface DashboardData {
  gateway: GatewayStatus;
  channels: Channel[];
  agents: Agent[];
  activeAgentCount: number;
  totalAgentCount: number;
  taskSummaries: Array<{
    agentId: string;
    agentName: string;
    currentTask: Task | null;
    progress: number;
  }>;
  recentHistory: Array<{
    agentId: string;
    agentName: string;
    taskTitle: string;
    completedAt: string;
  }>;
  lastUpdated: string;
}
