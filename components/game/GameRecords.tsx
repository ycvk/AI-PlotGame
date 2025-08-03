'use client'

import React, { useState, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { 
  Trash2, 
  Download, 
  Upload, 
  Search, 
  Calendar, 
  GamepadIcon,
  Clock,
  Loader2,
  AlertTriangle,
  CheckCircle
} from 'lucide-react'
import { useGameStore, useUIStore } from '@/stores'
import type { GameRecord } from '@/lib/story-engine-client'
import { VirtualizedRecordsList } from './VirtualizedGameRecords'
import { getFeatureFlags } from '@/lib/featureFlags'

const DEFAULT_GAME_MODES = {
  adventure: { name: "冒险探索", icon: "🗺️" },
  mystery: { name: "悬疑推理", icon: "🔍" },
  horror: { name: "恐怖惊悚", icon: "👻" },
  romance: { name: "浪漫爱情", icon: "💕" },
  scifi: { name: "科幻未来", icon: "🚀" },
  fantasy: { name: "奇幻魔法", icon: "🧙‍♂️" },
} as const

interface GameRecordsProps {
  onLoadGame?: (record: GameRecord) => void
  onDeleteGame?: (recordId: string) => void
  onExportGame?: (recordId: string) => void
  onClose?: () => void
  asDialog?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
  className?: string
}

export const GameRecords: React.FC<GameRecordsProps> = ({
  onLoadGame,
  onDeleteGame,
  onExportGame,
  onClose,
  asDialog = false,
  open = false,
  onOpenChange,
  className
}) => {
  // 精确订阅状态 - 避免不必要的重渲染
  const gameRecords = useGameStore(state => state.gameRecords)
  const loadGame = useGameStore(state => state.loadGame)
  const deleteGame = useGameStore(state => state.deleteGame)
  const exportCurrentGame = useGameStore(state => state.exportCurrentGame)
  const importGame = useGameStore(state => state.importGame)
  const isGenerating = useGameStore(state => state.isGenerating)
  
  const showModal = useUIStore(state => state.showModal)
  const hideModal = useUIStore(state => state.hideModal)
  const addToast = useUIStore(state => state.addToast)
  
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'date' | 'title' | 'mode'>('date')
  const [filterMode, setFilterMode] = useState<string>('all')
  const [selectedRecord, setSelectedRecord] = useState<GameRecord | null>(null)

  // 获取游戏模式名称
  const getGameModeName = (mode: string) => {
    return DEFAULT_GAME_MODES[mode as keyof typeof DEFAULT_GAME_MODES]?.name || mode
  }

  // 过滤和排序游戏记录
  const filteredAndSortedRecords = useMemo(() => {
    let filtered = gameRecords.filter(record => {
      const matchesSearch = record.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           getGameModeName(record.gameMode).toLowerCase().includes(searchTerm.toLowerCase())
      const matchesMode = filterMode === 'all' || record.gameMode === filterMode
      
      return matchesSearch && matchesMode
    })

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        case 'title':
          return a.name.localeCompare(b.name)
        case 'mode':
          return getGameModeName(a.gameMode).localeCompare(getGameModeName(b.gameMode))
        default:
          return 0
      }
    })
  }, [gameRecords, searchTerm, sortBy, filterMode])

  // 获取所有游戏模式用于筛选
  const availableModes = useMemo(() => {
    const modes = new Set(gameRecords.map(record => record.gameMode))
    return Array.from(modes)
  }, [gameRecords])

  const handleLoadGame = async (record: GameRecord) => {
    try {
      const success = await loadGame(record.id)
      if (success) {
        onLoadGame?.(record)
        addToast({
          type: 'success',
          title: '游戏加载成功',
          description: `已加载游戏：${record.name}`
        })
        if (asDialog) {
          onOpenChange?.(false)
        }
      } else {
        addToast({
          type: 'error',
          title: '加载失败',
          description: '无法加载选中的游戏记录'
        })
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: '加载失败',
        description: error instanceof Error ? error.message : '加载游戏时发生错误'
      })
    }
  }

  const handleDeleteGame = async (record: GameRecord) => {
    showModal({
      type: 'confirm',
      title: '删除游戏记录',
      content: `确定要删除游戏"${record.name}"吗？此操作不可撤销。`,
      onConfirm: async () => {
        try {
          const success = await deleteGame(record.id)
          if (success) {
            onDeleteGame?.(record.id)
            addToast({
              type: 'success',
              title: '删除成功',
              description: `已删除游戏：${record.name}`
            })
          } else {
            addToast({
              type: 'error',
              title: '删除失败',
              description: '无法删除选中的游戏记录'
            })
          }
        } catch (error) {
          addToast({
            type: 'error',
            title: '删除失败',
            description: error instanceof Error ? error.message : '删除游戏时发生错误'
          })
        }
        hideModal()
      },
      onCancel: hideModal
    })
  }

  const handleExportGame = (record: GameRecord) => {
    try {
      const saveData = exportCurrentGame()
      const blob = new Blob([saveData], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${record.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_save.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)

      onExportGame?.(record.id)
      addToast({
        type: 'success',
        title: '导出成功',
        description: `游戏"${record.name}"已导出到本地`
      })
    } catch (error) {
      addToast({
        type: 'error',
        title: '导出失败',
        description: error instanceof Error ? error.message : '导出游戏时发生错误'
      })
    }
  }

  const handleImportGame = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.json'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      try {
        const text = await file.text()
        const success = importGame(text)
        
        if (success) {
          addToast({
            type: 'success',
            title: '导入成功',
            description: '游戏存档已成功导入'
          })
        } else {
          addToast({
            type: 'error',
            title: '导入失败',
            description: '无效的存档文件或文件已损坏'
          })
        }
      } catch (error) {
        addToast({
          type: 'error',
          title: '导入失败',
          description: error instanceof Error ? error.message : '导入游戏时发生错误'
        })
      }
    }
    input.click()
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const GameRecordItem = ({ record }: { record: GameRecord }) => (
    <Card className="cursor-pointer hover:shadow-md transition-all hover:-translate-y-0.5">
      <CardContent className="p-4">
        <div className="flex justify-between items-start">
          <div 
            className="flex-1 space-y-2" 
            onClick={() => handleLoadGame(record)}
          >
            <div className="flex items-start justify-between">
              <h3 className="font-semibold text-lg leading-tight">{record.name}</h3>
              <Badge variant="outline" className="ml-2 flex-shrink-0">
                {DEFAULT_GAME_MODES[record.gameMode as keyof typeof DEFAULT_GAME_MODES]?.icon} {getGameModeName(record.gameMode)}
              </Badge>
            </div>
            
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <div className="flex items-center">
                <Calendar className="h-3 w-3 mr-1" />
                创建：{formatDate(record.createdAt)}
              </div>
              <div className="flex items-center">
                <Clock className="h-3 w-3 mr-1" />
                更新：{formatDate(record.updatedAt)}
              </div>
              <div className="flex items-center">
                <GamepadIcon className="h-3 w-3 mr-1" />
                {record.totalPages} 页
              </div>
            </div>

            {record.inventory && record.inventory.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {record.inventory.slice(0, 3).map((item, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {item}
                  </Badge>
                ))}
                {record.inventory.length > 3 && (
                  <Badge variant="secondary" className="text-xs">
                    +{record.inventory.length - 3}
                  </Badge>
                )}
              </div>
            )}
          </div>
          
          <div className="flex gap-1 ml-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                handleExportGame(record)
              }}
              title="导出游戏"
            >
              <Download className="h-4 w-4" />
            </Button>
            
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation()
                handleDeleteGame(record)
              }}
              title="删除游戏"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const RecordsContent = (
    <div className="space-y-4">
      {/* 搜索和筛选 */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索游戏记录..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <div className="flex gap-2">
          <Select value={sortBy} onValueChange={(value: 'date' | 'title' | 'mode') => setSortBy(value)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="排序" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">按日期</SelectItem>
              <SelectItem value="title">按标题</SelectItem>
              <SelectItem value="mode">按模式</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={filterMode} onValueChange={setFilterMode}>
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="筛选" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部模式</SelectItem>
              {availableModes.map(mode => (
                <SelectItem key={mode} value={mode}>
                  {getGameModeName(mode)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* 操作按钮 */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          共 {filteredAndSortedRecords.length} 个游戏记录
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={handleImportGame}
          disabled={isGenerating}
        >
          <Upload className="h-4 w-4 mr-2" />
          导入存档
        </Button>
      </div>

      {/* 游戏记录列表 */}
      {(() => {
        const { virtualScroll } = getFeatureFlags()
        
        if (filteredAndSortedRecords.length === 0) {
          return (
            <div className="text-center py-12">
              {gameRecords.length === 0 ? (
                <div className="space-y-3">
                  <div className="text-4xl">🎮</div>
                  <div>
                    <p className="text-lg font-medium text-muted-foreground">还没有游戏记录</p>
                    <p className="text-sm text-muted-foreground">开始一个新游戏来创建你的第一个记录</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="text-4xl">🔍</div>
                  <div>
                    <p className="text-lg font-medium text-muted-foreground">没有找到匹配的记录</p>
                    <p className="text-sm text-muted-foreground">尝试调整搜索条件或筛选器</p>
                  </div>
                </div>
              )}
            </div>
          )
        }
        
        // 使用虚拟滚动
        if (virtualScroll) {
          return (
            <VirtualizedRecordsList 
              records={filteredAndSortedRecords}
              height={600}
              itemHeight={120}
              onLoadGame={handleLoadGame}
              onDeleteGame={handleDeleteGame}
              onExportGame={handleExportGame}
              formatDate={formatDate}
              getGameModeName={getGameModeName}
            />
          )
        }
        
        // 原始渲染方式
        return (
          <div className="space-y-3 max-h-[600px] overflow-y-auto">
            {filteredAndSortedRecords.map((record) => (
              <GameRecordItem key={record.id} record={record} />
            ))}
          </div>
        )
      })()}
    </div>
  )

  if (asDialog) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>游戏记录</DialogTitle>
            <DialogDescription>查看和管理你的游戏历史</DialogDescription>
          </DialogHeader>
          {RecordsContent}
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>游戏记录</CardTitle>
        <CardDescription>查看和管理你的游戏历史</CardDescription>
      </CardHeader>
      <CardContent>
        {RecordsContent}
      </CardContent>
    </Card>
  )
}