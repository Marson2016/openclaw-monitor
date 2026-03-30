import type { Channel } from '@/types'
import { MessageSquare, Plug, Bot } from 'lucide-react'

interface Props {
  channels: Channel[]
  loading: boolean
}

export function ChannelStatus({ channels, loading }: Props) {
  if (loading || !channels) {
    return (
      <div className="bg-slate-900 border border-slate-700 rounded-xl p-6 animate-pulse">
        <div className="h-6 bg-slate-700 rounded w-1/3 mb-4"></div>
        <div className="h-32 bg-slate-700 rounded"></div>
      </div>
    )
  }

  const typeIcons: Record<string, string> = {
    feishu: '🪶',
    discord: '💬',
    telegram: '✈️',
    webchat: '🌐',
  }

  const statusColors: Record<string, string> = {
    enabled: 'bg-green-500',
    disabled: 'bg-slate-500',
    error: 'bg-red-500',
  }

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <MessageSquare className="w-5 h-5 text-purple-400" />
          Channel 状态
        </h2>
        <span className="text-sm text-slate-400">{channels.length} 个实例</span>
      </div>

      <div className="space-y-4">
        {channels.map((channel) => (
          <div key={channel.id} className="bg-slate-800/50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{typeIcons[channel.type] || '📡'}</span>
                <div>
                  <div className="font-semibold">{channel.name}</div>
                  <div className="text-xs text-slate-400 capitalize">{channel.type}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${statusColors[channel.status]}`}></span>
                <span className="text-sm text-slate-400">
                  {channel.status === 'enabled' ? '已启用' : channel.status === 'disabled' ? '已禁用' : '异常'}
                </span>
              </div>
            </div>

            {/* 插件 */}
            <div className="flex items-center gap-2 mb-2">
              <Plug className="w-3 h-3 text-slate-500" />
              <span className="text-xs text-slate-500">插件:</span>
              <div className="flex flex-wrap gap-1">
                {channel.plugins?.map((plugin) => (
                  <span key={plugin} className="px-1.5 py-0.5 bg-purple-500/20 text-purple-300 text-xs rounded">
                    {plugin}
                  </span>
                ))}
              </div>
            </div>

            {/* 关联Agent */}
            <div className="flex items-center gap-2">
              <Bot className="w-3 h-3 text-slate-500" />
              <span className="text-xs text-slate-500">Agent:</span>
              <div className="flex flex-wrap gap-1">
                {channel.agents?.map((agent) => (
                  <span key={agent} className="px-1.5 py-0.5 bg-blue-500/20 text-blue-300 text-xs rounded">
                    {agent}
                  </span>
                ))}
              </div>
            </div>

            {/* 最后活跃 */}
            <div className="mt-2 text-xs text-slate-500">
              最后活跃: {channel.lastActive}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
