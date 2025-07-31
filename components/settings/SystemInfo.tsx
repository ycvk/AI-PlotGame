'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Database, 
  Server, 
  Cpu, 
  HardDrive, 
  Wifi, 
  Shield, 
  Info,
  CheckCircle,
  XCircle,
  AlertCircle,
  RefreshCw,
  Download,
  Clock,
  Zap
} from 'lucide-react'
import { useConfigStore, useAuthStore, useGameStore } from '@/stores'

interface SystemMetrics {
  cpu: number
  memory: { used: number; total: number }
  storage: { used: number; total: number }
  uptime: number
  connections: number
}

interface PerformanceMetric {
  name: string
  value: number
  timestamp: number
  unit: string
}

export const SystemInfo: React.FC = () => {
  const { systemInfo } = useConfigStore()
  const { user } = useAuthStore()
  const { gameRecords } = useGameStore()
  
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null)
  const [performanceHistory, setPerformanceHistory] = useState<PerformanceMetric[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null)

  // 模拟系统指标数据（在实际应用中这些数据应该从API获取）
  const fetchSystemMetrics = async () => {
    setIsLoading(true)
    
    // 模拟API延迟
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 生成模拟数据
    const mockMetrics: SystemMetrics = {
      cpu: Math.random() * 100,
      memory: {
        used: Math.random() * 8000,
        total: 8000
      },
      storage: {
        used: Math.random() * 100000,
        total: 250000
      },
      uptime: Date.now() - (Math.random() * 7 * 24 * 60 * 60 * 1000), // 最近7天内的随机时间
      connections: Math.floor(Math.random() * 50)
    }
    
    setMetrics(mockMetrics)
    setLastUpdate(new Date())
    setIsLoading(false)
    
    // 添加到性能历史
    const newMetric: PerformanceMetric = {
      name: 'cpu_usage',
      value: mockMetrics.cpu,
      timestamp: Date.now(),
      unit: '%'
    }
    
    setPerformanceHistory(prev => [...prev.slice(-19), newMetric])
  }

  useEffect(() => {
    fetchSystemMetrics()
    
    // 每30秒自动刷新
    const interval = setInterval(fetchSystemMetrics, 30000)
    return () => clearInterval(interval)
  }, [])

  const formatUptime = (timestamp: number) => {
    const diff = Date.now() - timestamp
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    return `${days}天 ${hours}小时 ${minutes}分钟`
  }

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B'
    
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const getStatusColor = (value: number, threshold: { warning: number; danger: number }) => {
    if (value >= threshold.danger) return 'text-red-600'
    if (value >= threshold.warning) return 'text-yellow-600'
    return 'text-green-600'
  }

  const getStatusIcon = (isHealthy: boolean) => {
    return isHealthy ? (
      <CheckCircle className="h-4 w-4 text-green-600" />
    ) : (
      <XCircle className="h-4 w-4 text-red-600" />
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center">
              <Server className="h-5 w-5 mr-2" />
              系统信息
            </CardTitle>
            <CardDescription>
              查看系统状态和性能指标
            </CardDescription>
          </div>
          
          <div className="flex items-center gap-2">
            {lastUpdate && (
              <span className="text-xs text-muted-foreground">
                更新于 {lastUpdate.toLocaleTimeString()}
              </span>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={fetchSystemMetrics}
              disabled={isLoading}
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="overview">概览</TabsTrigger>
            <TabsTrigger value="performance">性能</TabsTrigger>
            <TabsTrigger value="details">详细信息</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-4">
            {/* 系统状态 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center">
                    <Database className="h-4 w-4 mr-2" />
                    数据库连接
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold">
                      {systemInfo.hasDatabase ? '已连接' : '未连接'}
                    </span>
                    {getStatusIcon(systemInfo.hasDatabase)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {systemInfo.hasDatabase ? 'MySQL数据库正常运行' : '使用本地存储模式'}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center">
                    <Shield className="h-4 w-4 mr-2" />
                    用户状态
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold">
                      {user ? '已登录' : '未登录'}
                    </span>
                    {getStatusIcon(!!user)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {user ? `${user.username} (${user.role})` : '当前处于游客模式'}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* 游戏统计 */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">游戏统计</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{gameRecords.length}</div>
                    <p className="text-xs text-muted-foreground">游戏记录</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {gameRecords.reduce((sum, record) => sum + record.totalPages, 0)}
                    </div>
                    <p className="text-xs text-muted-foreground">总页数</p>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {gameRecords.reduce((sum, record) => sum + (record.inventory?.length || 0), 0)}
                    </div>
                    <p className="text-xs text-muted-foreground">收集物品</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 系统性能指标 */}
            {metrics && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center">
                      <Cpu className="h-4 w-4 mr-2" />
                      CPU使用率
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className={`text-2xl font-bold ${getStatusColor(metrics.cpu, { warning: 70, danger: 90 })}`}>
                          {metrics.cpu.toFixed(1)}%
                        </span>
                        <Badge variant={metrics.cpu > 90 ? 'destructive' : metrics.cpu > 70 ? 'secondary' : 'default'}>
                          {metrics.cpu > 90 ? '高负载' : metrics.cpu > 70 ? '中等' : '正常'}
                        </Badge>
                      </div>
                      <Progress value={metrics.cpu} className="h-2" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center">
                      <HardDrive className="h-4 w-4 mr-2" />
                      内存使用
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">
                          {formatBytes(metrics.memory.used * 1024 * 1024)} / {formatBytes(metrics.memory.total * 1024 * 1024)}
                        </span>
                        <span className={`text-lg font-bold ${getStatusColor((metrics.memory.used / metrics.memory.total) * 100, { warning: 70, danger: 90 })}`}>
                          {((metrics.memory.used / metrics.memory.total) * 100).toFixed(1)}%
                        </span>
                      </div>
                      <Progress value={(metrics.memory.used / metrics.memory.total) * 100} className="h-2" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            {/* 性能历史图表 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center">
                  <Zap className="h-4 w-4 mr-2" />
                  性能趋势
                </CardTitle>
              </CardHeader>
              <CardContent>
                {performanceHistory.length > 0 ? (
                  <div className="space-y-4">
                    <div className="h-32 flex items-end justify-between gap-1">
                      {performanceHistory.slice(-10).map((metric, index) => (
                        <div
                          key={index}
                          className="bg-blue-500 opacity-70 hover:opacity-100 transition-opacity rounded-t flex-1 min-w-0"
                          style={{ height: `${(metric.value / 100) * 100}%` }}
                          title={`${metric.value.toFixed(1)}% at ${new Date(metric.timestamp).toLocaleTimeString()}`}
                        />
                      ))}
                    </div>
                    <div className="text-xs text-muted-foreground text-center">
                      CPU使用率趋势（最近10次更新）
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-muted-foreground py-8">
                    <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>收集性能数据中...</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* 实时指标 */}
            {metrics && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">运行时间</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-lg font-mono">
                      {formatUptime(metrics.uptime)}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">活跃连接</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-blue-600">
                      {metrics.connections}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">存储使用</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-1">
                      <div className="text-sm">
                        {formatBytes(metrics.storage.used * 1024 * 1024)} / {formatBytes(metrics.storage.total * 1024 * 1024)}
                      </div>
                      <Progress value={(metrics.storage.used / metrics.storage.total) * 100} className="h-1" />
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          <TabsContent value="details" className="space-y-4">
            {/* 系统详细信息 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center">
                  <Info className="h-4 w-4 mr-2" />
                  系统信息
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm font-medium">版本</span>
                    <Badge variant="outline">{systemInfo.version}</Badge>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm font-medium">数据库</span>
                    <div className="flex items-center">
                      {systemInfo.hasDatabase ? (
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          MySQL 已连接
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          本地存储
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm font-medium">用户角色</span>
                    <Badge variant={user?.role === 'admin' ? 'default' : 'secondary'}>
                      {user?.role || '游客'}
                    </Badge>
                  </div>
                  
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm font-medium">浏览器</span>
                    <span className="text-sm text-muted-foreground">
                      {typeof navigator !== 'undefined' ? navigator.userAgent.split(' ').slice(-2).join(' ') : 'Unknown'}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm font-medium">在线状态</span>
                    <div className="flex items-center">
                      <Wifi className="h-4 w-4 mr-1 text-green-600" />
                      <span className="text-sm text-green-600">在线</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 导出系统信息 */}
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">导出信息</CardTitle>
              </CardHeader>
              <CardContent>
                <Button
                  variant="outline"
                  onClick={() => {
                    const info = {
                      systemInfo,
                      metrics,
                      performanceHistory,
                      timestamp: new Date().toISOString(),
                      user: user ? { username: user.username, role: user.role } : null,
                      gameStats: {
                        totalRecords: gameRecords.length,
                        totalPages: gameRecords.reduce((sum, record) => sum + record.totalPages, 0),
                        totalItems: gameRecords.reduce((sum, record) => sum + (record.inventory?.length || 0), 0)
                      }
                    }
                    
                    const blob = new Blob([JSON.stringify(info, null, 2)], { type: 'application/json' })
                    const url = URL.createObjectURL(blob)
                    const a = document.createElement('a')
                    a.href = url
                    a.download = `system-info-${Date.now()}.json`
                    document.body.appendChild(a)
                    a.click()
                    document.body.removeChild(a)
                    URL.revokeObjectURL(url)
                  }}
                  className="w-full"
                >
                  <Download className="h-4 w-4 mr-2" />
                  导出系统信息
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  )
}