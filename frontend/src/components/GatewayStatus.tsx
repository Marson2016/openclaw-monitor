import type { GatewayStatus as GatewayType } from '@/types'
import { Activity, Globe, Server, Cpu, Clock, Zap } from 'lucide-react'

interface Props {
  gateway: GatewayType | null
  loading: boolean
}

export function GatewayStatus({ gateway, loading }: Props) {
  if (loading || !gateway) {
    return (
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 animate-pulse">
        <div className="h-6 bg-slate-700 rounded w-1/3 mb-4"></div>
        <div className="grid grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-16 bg-slate-700 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  const statusConfig = {
    running: { color: 'bg-green-500', text: '运行中', icon: '🟢' },
    stopped: { color: 'bg-red-500', text: '已停止', icon: '🔴' },
    error: { color: 'bg-yellow-500', text: '异常', icon: '🟡' },
  }

  const status = statusConfig[gateway.status] || statusConfig.error

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Server className="w-5 h-5 text-blue-400" />
          网关状态
        </h2>
        <span className="text-sm text-slate-400">{status.icon} {status.text}</span>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
            <Globe className="w-4 h-4" />
            地址
          </div>
          <div className="font-mono text-sm">{gateway.ip}:{gateway.port}</div>
        </div>
        
        <div className="bg-slate-800/50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
            <Activity className="w-4 h-4" />
            模式
          </div>
          <div className="font-semibold">{gateway.mode}</div>
        </div>
        
        <div className="bg-slate-800/50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
            <Clock className="w-4 h-4" />
            运行时长
          </div>
          <div className="font-semibold">{gateway.uptime}</div>
        </div>
        
        <div className="bg-slate-800/50 rounded-lg p-3">
          <div className="flex items-center gap-2 text-slate-400 text-sm mb-1">
            <Zap className="w-4 h-4" />
            版本
          </div>
          <div className="font-semibold">{gateway.version}</div>
        </div>
      </div>

      {/* 已加载模型 */}
      <div className="mt-4">
        <div className="flex items-center gap-2 text-slate-400 text-sm mb-2">
          <Cpu className="w-4 h-4" />
          已加载模型 ({gateway.models?.length || 0})
        </div>
        <div className="flex flex-wrap gap-2">
          {gateway.models?.map((model) => (
            <span
              key={model.id}
              className={`px-2 py-1 rounded text-xs ${
                model.status === 'active'
                  ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                  : 'bg-slate-700/50 text-slate-400 border border-slate-600'
              }`}
            >
              {model.name}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}
