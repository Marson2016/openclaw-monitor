import type { GatewayStatus, Channel, Agent, AgentTaskList, DashboardData } from '@/types'

const API_BASE = '/api'

// 获取Dashboard聚合数据
export async function fetchDashboard(): Promise<DashboardData> {
  const response = await fetch(`${API_BASE}/dashboard`)
  if (!response.ok) throw new Error('获取Dashboard数据失败')
  return response.json()
}

// 获取网关状态
export async function fetchGatewayStatus(): Promise<GatewayStatus> {
  const response = await fetch(`${API_BASE}/gateway/status`)
  if (!response.ok) throw new Error('获取网关状态失败')
  return response.json()
}

// 获取Channel列表
export async function fetchChannels(): Promise<Channel[]> {
  const response = await fetch(`${API_BASE}/channels`)
  if (!response.ok) throw new Error('获取Channel列表失败')
  return response.json()
}

// 获取Agent列表
export async function fetchAgents(): Promise<Agent[]> {
  const response = await fetch(`${API_BASE}/agents`)
  if (!response.ok) throw new Error('获取Agent列表失败')
  return response.json()
}

// 获取Agent任务
export async function fetchAgentTasks(agentId: string): Promise<AgentTaskList> {
  const response = await fetch(`${API_BASE}/agents/${agentId}/tasks`)
  if (!response.ok) throw new Error('获取Agent任务失败')
  return response.json()
}

// 更新Agent任务
export async function updateAgentTask(agentId: string, task: any): Promise<void> {
  const response = await fetch(`${API_BASE}/agents/${agentId}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(task),
  })
  if (!response.ok) throw new Error('更新Agent任务失败')
}
