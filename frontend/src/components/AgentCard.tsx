import type { Agent, Task } from '@/types'
import { TaskProgress } from './TaskProgress'
import { User, Cpu, Zap } from 'lucide-react'

interface Props {
  agent: Agent
  task?: Task | null
}

export function AgentCard({ agent, task }: Props) {
  const statusConfig: Record<string, { bg: string; text: string; dot: string }> = {
    active: { bg: 'bg-green-500/20', text: 'text-green-400', dot: 'bg-green-500' },
    idle: { bg: 'bg-yellow-500/20', text: 'text-yellow-400', dot: 'bg-yellow-500' },
    offline: { bg: 'bg-slate-500/20', text: 'text-slate-400', dot: 'bg-slate-500' },
  }

  const status = statusConfig[agent.status] || statusConfig.offline

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl p-5 hover:border-slate-600 transition-colors">
      {/* 头部 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="text-3xl">{agent.emoji || '🤖'}</div>
          <div>
            <div className="font-semibold text-lg">{agent.name}</div>
            <div className="text-xs text-slate-400 font-mono">{agent.id}</div>
          </div>
        </div>
        <div className={`flex items-center gap-2 px-2 py-1 rounded-full ${status.bg}`}>
          <span className={`w-2 h-2 rounded-full ${status.dot}`}></span>
          <span className={`text-xs ${status.text}`}>
            {agent.status === 'active' ? '活跃' : agent.status === 'idle' ? '空闲' : '离线'}
          </span>
        </div>
      </div>

      {/* 描述 */}
      {agent.description && (
        <p className="text-sm text-slate-400 mb-4">{agent.description}</p>
      )}

      {/* 模型信息 */}
      <div className="flex items-center gap-2 mb-4 px-3 py-2 bg-slate-800/50 rounded-lg">
        <Cpu className="w-4 h-4 text-blue-400" />
        <span className="text-sm text-slate-400">模型:</span>
        <span className="text-sm font-mono text-blue-300">{agent.model}</span>
      </div>

      {/* 当前任务 */}
      <div className="border-t border-slate-700 pt-3">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="w-4 h-4 text-yellow-400" />
          <span className="text-sm font-medium">当前任务</span>
        </div>
        <TaskProgress task={task || agent.currentTask || null} />
      </div>
    </div>
  )
}
