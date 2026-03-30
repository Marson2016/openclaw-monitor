// 网关状态
export interface GatewayStatus {
  ip: string
  status: 'running' | 'stopped' | 'error'
  mode: 'local' | 'remote' | 'dev'
  port: number
  version: string
  uptime: string
  models: Model[]
}

export interface Model {
  id: string
  name: string
  provider: string
  status: 'active' | 'inactive'
}

// Channel 状态
export interface Channel {
  id: string
  name: string
  type: 'feishu' | 'discord' | 'telegram' | 'webchat'
  status: 'enabled' | 'disabled' | 'error'
  plugins: string[]
  agents: string[]
  lastActive: string
}

// Agent 状态
export interface Agent {
  id: string
  name: string
  description?: string
  model: string
  status: 'active' | 'idle' | 'offline'
  emoji?: string
  currentTask?: Task | null
}

// 任务
export interface Task {
  id: string
  title: string
  status: 'completed' | 'in_progress' | 'pending'
  progress: number
  createdAt: string
  updatedAt: string
  completedAt?: string
}

export interface AgentTaskList {
  agentId: string
  historicalTasks: Task[]
  currentTask: Task | null
  pendingTasks: Task[]
}

// Dashboard 聚合数据
export interface DashboardData {
  gateway: GatewayStatus
  channels: Channel[]
  agents: Agent[]
  agentTasks: AgentTaskList[]
  lastUpdated: string
}
