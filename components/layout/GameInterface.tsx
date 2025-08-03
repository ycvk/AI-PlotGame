'use client'

import React, { useRef } from 'react'
import { useAuthStore, useGameStore, useConfigStore, useUIStore } from '@/stores'
import { useAllHandlers } from '@/hooks'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { StreamingContent } from '@/components/game/StreamingContent'
import { 
  GamepadIcon, Shield, Settings, History, Home, Cloud, Download, Upload, 
  Play, ChevronLeft, ChevronRight, Loader2, Send 
} from 'lucide-react'

const DEFAULT_GAME_MODES = {
  adventure: { name: "冒险探索", desc: "探索未知世界，发现隐藏秘密", icon: "🗺️" },
  mystery: { name: "悬疑推理", desc: "解开谜团，寻找真相", icon: "🔍" },
  horror: { name: "恐怖惊悚", desc: "在恐怖中生存，面对未知恐惧", icon: "👻" },
  romance: { name: "浪漫爱情", desc: "体验浪漫故事，发展人际关系", icon: "💕" },
  scifi: { name: "科幻未来", desc: "探索未来科技，太空冒险", icon: "🚀" },
  fantasy: { name: "奇幻魔法", desc: "奇幻魔法，神话传说", icon: "🧙‍♂️" },
}

export const GameInterface: React.FC = React.memo(() => {
  // 精确订阅状态 - 避免不必要的重渲染
  const user = useAuthStore(state => state.user)
  const storyEngine = useGameStore(state => state.engine)
  const currentNode = useGameStore(state => state.currentNode)
  const isGenerating = useGameStore(state => state.isGenerating)
  const pageInput = useGameStore(state => state.pageInput)
  const setPageInput = useGameStore(state => state.setPageInput)
  const customChoice = useGameStore(state => state.customChoice)
  const setCustomChoice = useGameStore(state => state.setCustomChoice)
  
  const systemInfo = useConfigStore(state => state.systemInfo)
  const customGameModes = useConfigStore(state => state.customGameModes)
  
  const setShowGameSelectionDialog = useUIStore(state => state.setShowGameSelectionDialog)
  const setShowSettings = useUIStore(state => state.setShowSettings)
  
  const {
    handleBackToHome, handleLogout, handleSaveProgressToCloud, exportSave, importSave,
    handleResetGame, handlePageNavigation, handleChoice, handleCustomChoice
  } = useAllHandlers()

  const contentRef = useRef<HTMLDivElement>(null)

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
    <>
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-2">
            <div className="flex items-center gap-2 sm:gap-3">
              <GamepadIcon className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
              <h1 className="text-base sm:text-lg md:text-xl font-bold">AI剧情游戏</h1>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                <Badge variant={systemInfo.hasDatabase ? "default" : "secondary"} className="text-xs">
                  {systemInfo.hasDatabase ? "完整版" : "单机版"}
                </Badge>
              </div>
            </div>

            <div className="flex items-center flex-wrap gap-1 sm:gap-2 justify-end">
              <div className="hidden md:flex items-center gap-2">
                {user && user.role === "admin" && <Shield className="h-4 w-4 text-amber-500" />}
                {user && <span className="text-sm font-medium">{user.username}</span>}
              </div>

              <Button variant="outline" size="sm" onClick={handleBackToHome}>
                <Home className="h-4 w-4" />
                <span className="hidden sm:inline ml-1">首页</span>
              </Button>

              <Button variant="outline" size="sm" onClick={() => setShowGameSelectionDialog(true)}>
                <History className="h-4 w-4" />
                <span className="hidden sm:inline ml-1">游戏记录</span>
              </Button>

              <Button variant="outline" size="sm" onClick={() => setShowSettings(true)}>
                <Settings className="h-4 w-4" />
                <span className="hidden sm:inline ml-1">设置</span>
              </Button>

              {user && user.role === "admin" && (
                <Button variant="outline" size="sm" onClick={() => window.open("/admin", "_blank")}>
                  <Shield className="h-4 w-4" />
                  <span className="hidden sm:inline ml-1">管理</span>
                </Button>
              )}

              {systemInfo.hasDatabase && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleSaveProgressToCloud}
                  disabled={isGenerating || !storyEngine?.getCurrentGameRecord()}
                >
                  {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Cloud className="h-4 w-4" />}
                  <span className="hidden sm:inline ml-1">保存进度</span>
                </Button>
              )}

              <Button variant="outline" size="sm" onClick={exportSave}>
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline ml-1">导出</span>
              </Button>

              <Button variant="outline" size="sm" asChild>
                <label>
                  <Upload className="h-4 w-4" />
                  <span className="hidden sm:inline ml-1">导入</span>
                  <input type="file" accept=".json" onChange={importSave} className="hidden" />
                </label>
              </Button>

              <Button variant="outline" size="sm" onClick={handleResetGame}>
                <Play className="h-4 w-4" />
                <span className="hidden sm:inline ml-1">重开</span>
              </Button>

              <Button variant="outline" size="sm" onClick={handleLogout}>
                <span className="text-xs sm:text-sm">退出</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {currentNode ? (
          <div className="space-y-6">
            {storyEngine && storyEngine.getTotalPages() > 1 && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageNavigation("prev")}
                        disabled={!storyEngine.canGoToPreviousPage()}
                      >
                        <ChevronLeft className="h-4 w-4" />
                        <span className="hidden sm:inline">上一页</span>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePageNavigation("next")}
                        disabled={!storyEngine.canGoToNextPage()}
                      >
                        <span className="hidden sm:inline">下一页</span>
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex flex-col sm:flex-row items-center gap-2">
                      <span className="text-sm text-muted-foreground whitespace-nowrap">
                        第 {storyEngine.getCurrentPage()} / {storyEngine.getTotalPages()} 页
                      </span>
                      <div className="flex items-center gap-1">
                        <Input
                          type="number"
                          placeholder="页码"
                          value={pageInput}
                          onChange={(e) => setPageInput(e.target.value)}
                          className="w-16 h-8"
                          min={1}
                          max={storyEngine.getTotalPages()}
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageNavigation("goto")}
                          disabled={!pageInput}
                        >
                          跳转
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-xl sm:text-2xl">{currentNode.title}</CardTitle>
                {storyEngine?.getGameState()?.variables?.location && (
                  <Badge variant="outline">📍 {storyEngine?.getGameState()?.variables?.location}</Badge>
                )}
                {currentNode.selectedChoice && (
                  <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
                    <p className="text-sm text-blue-700">
                      <strong>之前的选择:</strong> {currentNode.selectedChoice}
                    </p>
                  </div>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="prose max-w-none" ref={contentRef}>
                  <p className="text-base sm:text-lg leading-relaxed whitespace-pre-wrap">{currentNode.content}</p>
                </div>
                
                {/* 流式内容独立组件 - 隔离高频更新 */}
                <StreamingContent />

                <div className="space-y-3">
                  <h3 className="font-semibold text-lg">你的选择：</h3>
                  <div className="grid gap-3">
                    {currentNode.choices.map((choice) => {
                      const isSelected = currentNode.selectedChoice === choice.text
                      return (
                        <Button
                          key={choice.id}
                          variant={isSelected ? "default" : "outline"}
                          className={`justify-start h-auto p-4 text-left whitespace-normal ${
                            isSelected ? "bg-primary text-primary-foreground border-primary" : "bg-transparent"
                          }`}
                          onClick={() => handleChoice(choice.id)}
                          disabled={isGenerating}
                        >
                          <div className="w-full">
                            <div className="font-medium text-wrap">
                              {isSelected && "✓ "}
                              {choice.text}
                            </div>
                            {choice.consequence && (
                              <div className="text-sm text-muted-foreground mt-1 text-wrap">
                                💭 {choice.consequence}
                              </div>
                            )}
                          </div>
                        </Button>
                      )
                    })}
                  </div>

                  <div className="mt-4 p-4 border rounded-lg bg-gray-50">
                    <Label htmlFor="custom-choice" className="text-sm font-medium">
                      自定义选择：
                    </Label>
                    <div className="flex gap-2 mt-2">
                      <Input
                        id="custom-choice"
                        value={customChoice}
                        onChange={(e) => setCustomChoice(e.target.value)}
                        placeholder="输入你的自定义选择..."
                        disabled={isGenerating}
                        onKeyPress={(e) => {
                          if (e.key === "Enter" && !isGenerating && customChoice.trim()) {
                            handleCustomChoice()
                          }
                        }}
                      />
                      <Button onClick={handleCustomChoice} disabled={isGenerating || !customChoice.trim()} size="sm">
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {isGenerating && (
                    <div className="text-center py-4">
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">AI正在生成下一段故事...</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-lg text-muted-foreground">
                {isGenerating ? "AI正在为你创造独特的故事..." : "请选择一个游戏模式或加载历史记录开始游戏。"}
              </p>
              {isGenerating && (
                <div className="mt-4">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                  {/* 流式内容独立组件 - 隔离高频更新 */}
                  <div className="max-w-2xl mx-auto">
                    <StreamingContent />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {storyEngine && storyEngine.getCurrentGameRecord() && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="text-lg">游戏状态</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                <div>
                  <Label>游戏模式</Label>
                  <p className="text-muted-foreground">
                    {getAllGameModes()[storyEngine?.getGameState()?.gameMode || ""]?.name || "未知"}
                  </p>
                </div>
                <div>
                  <Label>故事进度</Label>
                  <p className="text-muted-foreground">{storyEngine.getTotalPages()} 页</p>
                </div>
                <div>
                  <Label>背包物品</Label>
                  <p className="text-muted-foreground">{storyEngine?.getGameState()?.inventory?.length || 0} 个</p>
                </div>
              </div>

              {(() => {
                const gameState = storyEngine?.getGameState()
                const inventory = gameState?.inventory
                return inventory && inventory.length > 0 ? (
                  <div className="mt-4">
                    <Label>物品清单</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {inventory.map((item: string, index: number) => (
                        <Badge key={index} variant="secondary">
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </div>
                ) : null
              })()}
            </CardContent>
          </Card>
        )}
      </main>
    </>
  )
})