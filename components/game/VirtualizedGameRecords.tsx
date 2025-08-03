'use client'

import React, { forwardRef } from 'react'
import { FixedSizeList as List, ListChildComponentProps } from 'react-window'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { 
  Trash2, 
  Download, 
  Upload, 
  Calendar, 
  GamepadIcon,
  Clock
} from 'lucide-react'
import type { GameRecord } from '@/lib/story-engine-client'

const DEFAULT_GAME_MODES = {
  adventure: { name: "冒险探索", icon: "🗺️" },
  mystery: { name: "悬疑推理", icon: "🔍" },
  horror: { name: "恐怖惊悚", icon: "👻" },
  romance: { name: "浪漫爱情", icon: "💕" },
  scifi: { name: "科幻未来", icon: "🚀" },
  fantasy: { name: "奇幻魔法", icon: "🧙‍♂️" },
} as const

interface VirtualizedItemData {
  records: GameRecord[]
  onLoadGame: (record: GameRecord) => void
  onDeleteGame: (record: GameRecord) => void
  onExportGame: (record: GameRecord) => void
  formatDate: (timestamp: number) => string
  getGameModeName: (mode: string) => string
}

interface VirtualizedItemProps extends ListChildComponentProps {
  data: VirtualizedItemData
}

const VirtualizedGameRecordItem: React.FC<VirtualizedItemProps> = ({ 
  index, 
  style, 
  data 
}) => {
  const { 
    records, 
    onLoadGame, 
    onDeleteGame, 
    onExportGame, 
    formatDate, 
    getGameModeName 
  } = data
  const record = records[index]
  
  if (!record) return null
  
  return (
    <div style={style} className="px-3 py-1.5">
      <Card className="cursor-pointer hover:shadow-md transition-all hover:-translate-y-0.5">
        <CardContent className="p-4">
          <div className="flex justify-between items-start">
            <div 
              className="flex-1 space-y-2" 
              onClick={() => onLoadGame(record)}
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
                  onExportGame(record)
                }}
                title="导出存档"
              >
                <Download className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation()
                  onDeleteGame(record)
                }}
                title="删除记录"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

interface VirtualizedRecordsListProps {
  records: GameRecord[]
  height?: number
  itemHeight?: number
  onLoadGame: (record: GameRecord) => void
  onDeleteGame: (record: GameRecord) => void
  onExportGame: (record: GameRecord) => void
  formatDate: (timestamp: number) => string
  getGameModeName: (mode: string) => string
}

export const VirtualizedRecordsList = forwardRef<
  List,
  VirtualizedRecordsListProps
>(({ 
  records, 
  height = 600, 
  itemHeight = 120,
  onLoadGame,
  onDeleteGame,
  onExportGame,
  formatDate,
  getGameModeName
}, ref) => {
  if (records.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="space-y-3">
          <div className="text-4xl">🔍</div>
          <div>
            <p className="text-lg font-medium text-muted-foreground">没有找到匹配的记录</p>
            <p className="text-sm text-muted-foreground">尝试调整搜索条件或筛选器</p>
          </div>
        </div>
      </div>
    )
  }

  const itemData: VirtualizedItemData = {
    records,
    onLoadGame,
    onDeleteGame,
    onExportGame,
    formatDate,
    getGameModeName
  }

  return (
    <List
      ref={ref}
      height={height}
      width="100%"
      itemCount={records.length}
      itemSize={itemHeight}
      itemData={itemData}
      className="scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
      overscanCount={3}
    >
      {VirtualizedGameRecordItem}
    </List>
  )
})

VirtualizedRecordsList.displayName = 'VirtualizedRecordsList'