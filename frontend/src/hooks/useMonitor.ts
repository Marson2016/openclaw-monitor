import { useState, useEffect, useCallback } from 'react'
import type { DashboardData } from '@/types'
import { fetchDashboard } from '@/lib/api'

export function useMonitor(intervalMs: number = 30000) {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      setLoading(true)
      const result = await fetchDashboard()
      setData(result)
      setLastUpdated(new Date().toLocaleString('zh-CN'))
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取数据失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
    const timer = setInterval(refresh, intervalMs)
    return () => clearInterval(timer)
  }, [intervalMs, refresh])

  return { data, loading, error, lastUpdated, refresh }
}
