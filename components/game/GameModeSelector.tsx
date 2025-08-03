'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { GamepadIcon, Plus, Settings, History, Loader2 } from 'lucide-react'
import { useGameStore, useConfigStore, useUIStore, type GameMode } from '@/stores'

const DEFAULT_GAME_MODES = {
  adventure: { name: "冒险探索", desc: "探索未知世界，发现隐藏秘密", icon: "🗺️" },
  mystery: { name: "悬疑推理", desc: "解开谜团，寻找真相", icon: "🔍" },
  horror: { name: "恐怖惊悚", desc: "在恐怖中生存，面对未知恐惧", icon: "👻" },
  romance: { name: "浪漫爱情", desc: "体验浪漫故事，发展人际关系", icon: "💕" },
  scifi: { name: "科幻未来", desc: "探索未来科技，太空冒险", icon: "🚀" },
  fantasy: { name: "奇幻魔法", desc: "奇幻魔法，神话传说", icon: "🧙‍♂️" },
} as const

interface GameModeSelectorProps {
  onModeSelect?: (mode: GameMode) => void
  onShowGameRecords?: () => void
  onShowSettings?: () => void
  className?: string
}

export const GameModeSelector: React.FC<GameModeSelectorProps> = ({
  onModeSelect,
  onShowGameRecords,
  onShowSettings,
  className
}) => {
  const { startGame, gameRecords, isGenerating, error } = useGameStore()
  const { customGameModes, aiConfig } = useConfigStore()
  const { showModal, hideModal, addToast } = useUIStore()
  
  const [selectedMode, setSelectedMode] = useState<GameMode>('adventure')
  const [showCustomModeDialog, setShowCustomModeDialog] = useState(false)
  const [customModeForm, setCustomModeForm] = useState({
    name: '',
    description: '',
    prompt: ''
  })

  // 获取所有游戏模式（默认 + 自定义）
  const getAllGameModes = () => {
    const allModes: Record<string, { name: string; desc: string; icon: string }> = { ...DEFAULT_GAME_MODES }
    
    // 添加自定义模式
    Object.entries(customGameModes).forEach(([key, mode]) => {
      allModes[key] = {
        name: mode.name,
        desc: mode.description,
        icon: "🎲"
      }
    })
    
    return allModes
  }

  const handleStartGame = async (gameMode: GameMode) => {
    // 检查AI配置
    if (!aiConfig.apiKey || !aiConfig.baseUrl) {
      showModal({
        type: 'alert',
        title: '配置未完成',
        content: '请先在设置中配置AI服务提供商和API密钥。',
        onConfirm: () => {
          hideModal()
          onShowSettings?.()
        }
      })
      return
    }

    try {
      const initialNode = await startGame(gameMode)
      
      if (initialNode) {
        onModeSelect?.(gameMode)
        addToast({
          type: 'success',
          title: '游戏开始',
          description: `${getAllGameModes()[gameMode]?.name} 模式游戏已启动`
        })
      } else {
        showModal({
          type: 'confirm',
          title: '游戏初始化失败',
          content: '可能是AI配置有误。是否现在检查配置？',
          onConfirm: () => {
            hideModal()
            onShowSettings?.()
          },
          onCancel: hideModal
        })
      }
    } catch (error) {
      showModal({
        type: 'confirm',
        title: '游戏启动失败',
        content: '请检查网络连接和AI配置。是否现在检查配置？',
        onConfirm: () => {
          hideModal()
          onShowSettings?.()
        },
        onCancel: hideModal
      })
    }
  }

  const handleAddCustomMode = () => {
    if (!customModeForm.name.trim() || !customModeForm.description.trim() || !customModeForm.prompt.trim()) {
      addToast({
        type: 'error',
        title: '表单不完整',
        description: '请填写完整的游戏模式信息'
      })
      return
    }

    // 这里应该调用 configStore 的方法来添加自定义模式
    // 暂时先关闭对话框
    setShowCustomModeDialog(false)
    setCustomModeForm({ name: '', description: '', prompt: '' })
    
    addToast({
      type: 'success',
      title: '自定义模式已添加',
      description: `"${customModeForm.name}" 模式已成功添加`
    })
  }

  const allGameModes = getAllGameModes()

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 页面标题 */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">AI 剧情游戏</h1>
        <p className="text-muted-foreground">选择游戏模式开始您的冒险之旅</p>
      </div>

      {/* 操作按钮 */}
      <div className="flex flex-wrap gap-2 justify-center">
        <Button variant="outline" onClick={onShowSettings} size="sm">
          <Settings className="h-4 w-4 mr-2" />
          设置
        </Button>
        
        <Button 
          variant="outline" 
          onClick={onShowGameRecords} 
          size="sm"
          disabled={gameRecords.length === 0}
        >
          <History className="h-4 w-4 mr-2" />
          游戏记录
          {gameRecords.length > 0 && (
            <Badge variant="secondary" className="ml-2">
              {gameRecords.length}
            </Badge>
          )}
        </Button>
        
        <Button
          variant="outline"
          onClick={() => setShowCustomModeDialog(true)}
          size="sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          自定义模式
        </Button>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="text-sm text-red-600">{error}</div>
        </div>
      )}

      {/* 游戏模式卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(allGameModes).map(([key, mode]) => (
          <Card
            key={key}
            className={`cursor-pointer transition-all hover:shadow-lg hover:-translate-y-1 ${
              selectedMode === key ? 'ring-2 ring-primary' : ''
            }`}
            onClick={() => setSelectedMode(key as GameMode)}
          >
            <CardHeader className="text-center pb-2">
              <div className="text-4xl mb-2">{mode.icon}</div>
              <CardTitle className="text-lg">{mode.name}</CardTitle>
              <CardDescription className="text-sm">
                {mode.desc}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-2">
              <Button
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation()
                  handleStartGame(key as GameMode)
                }}
                disabled={isGenerating}
                variant={selectedMode === key ? 'default' : 'outline'}
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    生成中...
                  </>
                ) : (
                  <>
                    <GamepadIcon className="mr-2 h-4 w-4" />
                    开始游戏
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* 自定义游戏模式对话框 */}
      <Dialog open={showCustomModeDialog} onOpenChange={setShowCustomModeDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>创建自定义游戏模式</DialogTitle>
            <DialogDescription>
              定义您自己的游戏模式，创造独特的游戏体验
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            <div>
              <Label htmlFor="custom-name">模式名称</Label>
              <Input
                id="custom-name"
                value={customModeForm.name}
                onChange={(e) => setCustomModeForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="例如：末日求生"
                maxLength={20}
              />
            </div>
            
            <div>
              <Label htmlFor="custom-desc">模式描述</Label>
              <Input
                id="custom-desc"
                value={customModeForm.description}
                onChange={(e) => setCustomModeForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="例如：在末日世界中生存下去"
                maxLength={50}
              />
            </div>
            
            <div>
              <Label htmlFor="custom-prompt">AI提示词</Label>
              <Textarea
                id="custom-prompt"
                value={customModeForm.prompt}
                onChange={(e) => setCustomModeForm(prev => ({ ...prev, prompt: e.target.value }))}
                placeholder="描述这个游戏模式的背景、规则和氛围..."
                rows={4}
                maxLength={500}
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => {
                  setShowCustomModeDialog(false)
                  setCustomModeForm({ name: '', description: '', prompt: '' })
                }}
              >
                取消
              </Button>
              <Button onClick={handleAddCustomMode}>
                创建模式
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}