'use client'

import React from 'react'
import { useGameStore, useConfigStore, useUIStore } from '@/stores'
import { useAllHandlers } from '@/hooks'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trash2 } from 'lucide-react'

const DEFAULT_GAME_MODES = {
  adventure: { name: "冒险探索", desc: "探索未知世界，发现隐藏秘密", icon: "🗺️" },
  mystery: { name: "悬疑推理", desc: "解开谜团，寻找真相", icon: "🔍" },
  horror: { name: "恐怖惊悚", desc: "在恐怖中生存，面对未知恐惧", icon: "👻" },
  romance: { name: "浪漫爱情", desc: "体验浪漫故事，发展人际关系", icon: "💕" },
  scifi: { name: "科幻未来", desc: "探索未来科技，太空冒险", icon: "🚀" },
  fantasy: { name: "奇幻魔法", desc: "奇幻魔法，神话传说", icon: "🧙‍♂️" },
}

export const GameRecordsDialog: React.FC = () => {
  const { currentNode, gameRecords } = useGameStore()
  const { customGameModes } = useConfigStore()
  const { showGameSelectionDialog, setShowGameSelectionDialog, setShowGameModeSelect } = useUIStore()
  const { handleLoadGame, handleDeleteGame } = useAllHandlers()

  const getAllGameModes = () => {
    const allModes: Record<string, { name: string; desc: string; icon: string }> = { ...DEFAULT_GAME_MODES }
    Object.entries(customGameModes).forEach(([id, mode]) => {
      allModes[id] = {
        name: mode.name,
        desc: mode.description,
        icon: "🎭",
      }
    })
    return allModes
  }

  return (
    <Dialog open={showGameSelectionDialog} onOpenChange={setShowGameSelectionDialog}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>游戏记录</DialogTitle>
          <DialogDescription>查看和管理你的游戏历史</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {gameRecords.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">暂无游戏记录</p>
          ) : (
            gameRecords.map((record) => (
              <Card key={record.id} className="cursor-pointer hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1" onClick={() => handleLoadGame(record.id)}>
                      <h3 className="font-semibold text-lg mb-1">{record.name}</h3>
                      <p className="text-sm text-muted-foreground mb-2">
                        {getAllGameModes()[record.gameMode]?.name || record.gameMode}
                      </p>
                      <div className="flex gap-4 text-xs text-muted-foreground">
                        <span>创建: {new Date(record.createdAt).toLocaleString()}</span>
                        <span>更新: {new Date(record.updatedAt).toLocaleString()}</span>
                        <span>进度: {record.totalPages} 页</span>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDeleteGame(record.id)
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
        {/* Only show "Start New Game" button if no game is currently loaded */}
        {!currentNode && (
          <div className="flex justify-end gap-2 mt-4">
            <Button
              onClick={() => {
                setShowGameSelectionDialog(false)
                setShowGameModeSelect(true)
              }}
            >
              开始新游戏
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}