import type { Task } from '@/types'

interface Props {
  task: Task | null
  compact?: boolean
}

export function TaskProgress({ task, compact = false }: Props) {
  if (!task) {
    return (
      <div className={`flex items-center gap-2 ${compact ? '' : 'p-3 bg-slate-800/50 rounded-lg'}`}>
        <span className="w-2 h-2 rounded-full bg-slate-500"></span>
        <span className="text-sm text-slate-400">待分配任务</span>
      </div>
    )
  }

  const statusConfig = {
    completed: { color: 'bg-green-500', label: '已完成', textColor: 'text-green-400' },
    in_progress: { color: 'bg-blue-500', label: '进行中', textColor: 'text-blue-400' },
    pending: { color: 'bg-slate-500', label: '待执行', textColor: 'text-slate-400' },
  }

  const status = statusConfig[task.status] || statusConfig.pending

  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${status.color}`}></span>
        <span className="text-sm truncate max-w-[200px]">{task.title}</span>
        <span className={`text-xs ${status.textColor}`}>{task.progress}%</span>
      </div>
    )
  }

  return (
    <div className="p-3 bg-slate-800/50 rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${status.color}`}></span>
          <span className="text-sm font-medium">{task.title}</span>
        </div>
        <span className={`text-xs ${status.textColor}`}>{status.label}</span>
      </div>
      
      {/* 进度条 */}
      <div className="w-full bg-slate-700 rounded-full h-2">
        <div
          className={`h-2 rounded-full transition-all duration-500 ${
            task.status === 'completed' ? 'bg-green-500' : 'bg-blue-500'
          }`}
          style={{ width: `${task.progress}%` }}
        ></div>
      </div>
      
      <div className="flex justify-between mt-2 text-xs text-slate-500">
        <span>更新: {new Date(task.updatedAt).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
        <span>{task.progress}%</span>
      </div>
    </div>
  )
}
