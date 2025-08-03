'use client'

import React from 'react'
import { useAuthStore, useGameStore, useConfigStore, useUIStore } from '@/stores'
import { useAllHandlers } from '@/hooks'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { StreamingContent } from '@/components/game/StreamingContent'
import { Loader2, Plus, History, Settings, Shield, Trash2 } from 'lucide-react'

const DEFAULT_GAME_MODES = {
  adventure: { name: "冒险探索", desc: "探索未知世界，发现隐藏秘密", icon: "🗺️" },
  mystery: { name: "悬疑推理", desc: "解开谜团，寻找真相", icon: "🔍" },
  horror: { name: "恐怖惊悚", desc: "在恐怖中生存，面对未知恐惧", icon: "👻" },
  romance: { name: "浪漫爱情", desc: "体验浪漫故事，发展人际关系", icon: "💕" },
  scifi: { name: "科幻未来", desc: "探索未来科技，太空冒险", icon: "🚀" },
  fantasy: { name: "奇幻魔法", desc: "奇幻魔法，神话传说", icon: "🧙‍♂️" },
}

export const GameModeSelection: React.FC = React.memo(() => {
  // 精确订阅状态 - 避免不必要的重渲染
  const user = useAuthStore(state => state.user)
  const isGenerating = useGameStore(state => state.isGenerating)
  
  const aiConfig = useConfigStore(state => state.aiConfig)
  const streamEnabled = useConfigStore(state => state.gameSettings.streamEnabled)
  const customGameModes = useConfigStore(state => state.customGameModes)
  
  const setShowCustomModeDialog = useUIStore(state => state.setShowCustomModeDialog)
  const setShowGameSelectionDialog = useUIStore(state => state.setShowGameSelectionDialog)
  const setShowSettings = useUIStore(state => state.setShowSettings)
  
  const { handleStartGame, handleRemoveCustomMode } = useAllHandlers()

  // 组合配置对象
  const config = {
    apiKey: aiConfig.apiKey,
    baseUrl: aiConfig.baseUrl,
    streamEnabled,
    customGameModes
  }

  const getAllGameModes = () => {
    const allModes: Record<string, { name: string; desc: string; icon: string }> = { ...DEFAULT_GAME_MODES }
    Object.entries(config.customGameModes).forEach(([id, mode]) => {
      allModes[id] = {
        name: mode.name,
        desc: mode.description,
        icon: "🎭",
      }
    })
    return allModes
  }

  const allGameModes = getAllGameModes()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
      <div className="max-w-4xl mx-auto">
        <Card className="mb-6">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">选择游戏模式</CardTitle>
            <CardDescription>选择你想要体验的故事类型</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap justify-between items-center mb-6 gap-2">
              <div className="flex flex-wrap gap-2">
                <Button variant="outline" onClick={() => setShowCustomModeDialog(true)} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  自定义模式
                </Button>
                <Button variant="outline" onClick={() => setShowGameSelectionDialog(true)} size="sm">
                  <History className="h-4 w-4 mr-2" />
                  游戏记录
                </Button>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowSettings(true)} size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  设置
                </Button>
                {user?.role === "admin" && (
                  <Button variant="outline" onClick={() => window.open("/admin", "_blank")} size="sm">
                    <Shield className="h-4 w-4 mr-2" />
                    管理
                  </Button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(allGameModes).map(([mode, info]) => (
                <Card key={mode} className="cursor-pointer hover:shadow-lg transition-shadow relative">
                  <CardContent className="p-4 text-center" onClick={() => handleStartGame(mode)}>
                    <div className="text-4xl mb-2">{info.icon}</div>
                    <h3 className="font-semibold text-lg mb-2">{info.name}</h3>
                    <p className="text-sm text-muted-foreground">{info.desc}</p>
                  </CardContent>
                  {mode.startsWith("custom_") && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-2 right-2 h-6 w-6 p-0"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleRemoveCustomMode(mode)
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </Card>
              ))}
            </div>

            {isGenerating && (
              <div className="text-center mt-6">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                <p className="text-lg">AI正在为你创造独特的故事...</p>
                {/* 流式内容独立组件 - 隔离高频更新 */}
                <div className="max-w-2xl mx-auto mt-4">
                  <StreamingContent />
                </div>
              </div>
            )}

            {(!config.apiKey || !config.baseUrl) && (
              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 rounded-full bg-yellow-500 mt-2 flex-shrink-0"></div>
                  <div>
                    <p className="text-sm font-medium text-yellow-800">AI配置未完成</p>
                    <p className="text-xs text-yellow-700 mt-1">
                      请先在设置中配置API密钥和基本地址，否则无法开始游戏
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
})