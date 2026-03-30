import { useMonitor } from '@/hooks/useMonitor'
import { GatewayStatus } from '@/components/GatewayStatus'
import { ChannelStatus } from '@/components/ChannelStatus'
import { AgentCard } from '@/components/AgentCard'
import { RefreshCw, Settings, Activity } from 'lucide-react'

function App() {
  const { data, loading, error, lastUpdated, refresh } = useMonitor(30000)

  const activeAgents = data?.agents?.filter(a => a.status === 'active').length || 0
  const totalAgents = data?.agents?.length || 0

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 text-slate-100">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-3xl">🦞</div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
                  OpenClaw 运行监控
                </h1>
                <p className="text-xs text-slate-400">实时监控本地OpenClaw运行状态</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-sm text-slate-400">
                {lastUpdated && `更新: ${lastUpdated}`}
              </div>
              <button
                onClick={refresh}
                disabled={loading}
                className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-700 rounded-lg text-sm transition-colors"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                刷新
              </button>
              <button className="p-2 hover:bg-slate-800 rounded-lg transition-colors">
                <Settings className="w-5 h-5 text-slate-400" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* 错误提示 */}
        {error && (
          <div className="mb-6 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300">
            ⚠️ {error}
          </div>
        )}

        {/* 网关状态 */}
        <section className="mb-6">
          <GatewayStatus gateway={data?.gateway || null} loading={loading} />
        </section>

        {/* Channel 状态 */}
        <section className="mb-6">
          <ChannelStatus channels={data?.channels || []} loading={loading} />
        </section>

        {/* Agent 状态 */}
        <section className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Activity className="w-5 h-5 text-green-400" />
              Agent 状态
              <span className="text-sm font-normal text-slate-400">
                (共{totalAgents}个，活跃{activeAgents}个)
              </span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {loading ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="bg-slate-900 border border-slate-700 rounded-xl p-5 animate-pulse">
                  <div className="h-10 bg-slate-700 rounded mb-4"></div>
                  <div className="h-20 bg-slate-700 rounded"></div>
                </div>
              ))
            ) : (
              data?.agents?.map((agent) => {
                const agentTasks = data.agentTasks?.find(t => t.agentId === agent.id)
                return (
                  <AgentCard
                    key={agent.id}
                    agent={agent}
                    task={agentTasks?.currentTask || null}
                  />
                )
              })
            )}
          </div>
        </section>

        {/* 任务历史 */}
        {data?.agentTasks && data.agentTasks.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold mb-4">📋 任务历史 (最近7天)</h2>
            <div className="bg-slate-900 border border-slate-700 rounded-xl p-4">
              <div className="space-y-3">
                {data.agentTasks.map((agentTask) => (
                  <div key={agentTask.agentId} className="border-b border-slate-800 pb-3 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium text-sm">
                        {data.agents?.find(a => a.id === agentTask.agentId)?.name || agentTask.agentId}
                      </span>
                      <span className="text-xs text-slate-500">
                        {agentTask.historicalTasks.length} 个历史任务
                      </span>
                    </div>
                    {agentTask.historicalTasks.slice(0, 3).map((task) => (
                      <div key={task.id} className="flex items-center gap-2 text-sm text-slate-400 mb-1">
                        <span className={`w-1.5 h-1.5 rounded-full ${
                          task.status === 'completed' ? 'bg-green-500' : 
                          task.status === 'in_progress' ? 'bg-blue-500' : 'bg-slate-500'
                        }`}></span>
                        <span className="truncate flex-1">{task.title}</span>
                        <span className="text-xs text-slate-500">
                          {new Date(task.updatedAt).toLocaleString('zh-CN', { month: 'numeric', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 text-center text-sm text-slate-500">
          OpenClaw Monitor v1.0 · 自动刷新: 30秒 · 数据来源: 本地Gateway API
        </div>
      </footer>
    </div>
  )
}

export default App
