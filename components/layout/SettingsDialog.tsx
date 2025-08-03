'use client'

import React from 'react'
import { useAuthStore, useConfigStore, useUIStore } from '@/stores'
import { useAllHandlers } from '@/hooks'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { 
  Loader2, RefreshCw, RotateCcw, CheckCircle, XCircle, Shield, Trash2 
} from 'lucide-react'

const DEFAULT_GAME_MODES = {
  adventure: { name: "冒险探索", desc: "探索未知世界，发现隐藏秘密", icon: "🗺️" },
  mystery: { name: "悬疑推理", desc: "解开谜团，寻找真相", icon: "🔍" },
  horror: { name: "恐怖惊悚", desc: "在恐怖中生存，面对未知恐惧", icon: "👻" },
  romance: { name: "浪漫爱情", desc: "体验浪漫故事，发展人际关系", icon: "💕" },
  scifi: { name: "科幻未来", desc: "探索未来科技，太空冒险", icon: "🚀" },
  fantasy: { name: "奇幻魔法", desc: "奇幻魔法，神话传说", icon: "🧙‍♂️" },
}

export const SettingsDialog: React.FC = React.memo(() => {
  // 精确订阅状态 - 避免不必要的重渲染
  const user = useAuthStore(state => state.user)
  
  const aiConfig = useConfigStore(state => state.aiConfig)
  const gameSettings = useConfigStore(state => state.gameSettings)
  const customGameModes = useConfigStore(state => state.customGameModes)
  const systemInfo = useConfigStore(state => state.systemInfo)
  const availableModels = useConfigStore(state => state.availableModels)
  const isLoadingModels = useConfigStore(state => state.isLoadingModels)
  const modelsFetchStatus = useConfigStore(state => state.modelsFetchStatus)
  const setConfig = useConfigStore(state => state.setConfig)
  
  const showSettings = useUIStore(state => state.showSettings)
  const setShowSettings = useUIStore(state => state.setShowSettings)
  
  const { handleSaveConfig, handleLoadModels, handleResetModels, handleRemoveCustomMode } = useAllHandlers()

  // 组合配置对象以兼容原有代码
  const config = {
    aiProvider: aiConfig.provider,
    baseUrl: aiConfig.baseUrl,
    apiKey: aiConfig.apiKey,
    model: aiConfig.model,
    modelsPath: aiConfig.modelsPath,
    chatPath: aiConfig.chatPath,
    streamEnabled: gameSettings.streamEnabled,
    gameMode: gameSettings.gameMode,
    maxChoices: gameSettings.maxChoices,
    storyLength: gameSettings.storyLength,
    theme: gameSettings.theme,
    language: gameSettings.language,
    customGameModes
  }

  const useModelDropdown = availableModels.length > 0

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

  return (
    <Dialog open={showSettings} onOpenChange={setShowSettings}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>系统设置</DialogTitle>
          <DialogDescription>配置游戏和AI参数</DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="ai" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="ai">AI设置</TabsTrigger>
            <TabsTrigger value="game">游戏设置</TabsTrigger>
            <TabsTrigger value="system">系统信息</TabsTrigger>
          </TabsList>

          <TabsContent value="ai" className="space-y-4">
            <div>
              <Label htmlFor="aiProvider">AI供应商</Label>
              <Select
                value={config.aiProvider}
                onValueChange={(value: any) => setConfig((prev) => ({ ...prev, aiProvider: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="openai">OpenAI</SelectItem>
                  <SelectItem value="anthropic">Anthropic</SelectItem>
                  <SelectItem value="groq">Groq</SelectItem>
                  <SelectItem value="custom">自定义</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="baseUrl">API基本地址</Label>
              <Input
                id="baseUrl"
                value={config.baseUrl}
                onChange={(e) => setConfig((prev) => ({ ...prev, baseUrl: e.target.value }))}
                placeholder="https://api.openai.com"
              />
            </div>

            <div>
              <Label htmlFor="apiKey">API密钥</Label>
              <Input
                id="apiKey"
                type="password"
                value={config.apiKey}
                onChange={(e) => setConfig((prev) => ({ ...prev, apiKey: e.target.value }))}
                placeholder="请输入API密钥"
              />
            </div>

            <div>
              <Label htmlFor="modelsPath">模型获取路径</Label>
              <Input
                id="modelsPath"
                value={config.modelsPath}
                onChange={(e) => setConfig((prev) => ({ ...prev, modelsPath: e.target.value }))}
                placeholder="/v1/models"
              />
              <p className="text-xs text-muted-foreground mt-1">用于获取可用模型列表的API路径</p>
            </div>

            <div>
              <Label htmlFor="chatPath">模型聊天路径</Label>
              <Input
                id="chatPath"
                value={config.chatPath}
                onChange={(e) => setConfig((prev) => ({ ...prev, chatPath: e.target.value }))}
                placeholder="/v1/chat/completions"
              />
              <p className="text-xs text-muted-foreground mt-1">用于发送聊天请求的API路径</p>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="model">模型</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleLoadModels}
                    disabled={isLoadingModels}
                  >
                    {isLoadingModels ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                    获取模型
                  </Button>
                  <Button type="button" variant="outline" size="sm" onClick={handleResetModels}>
                    <RotateCcw className="h-4 w-4" />
                    重置
                  </Button>
                </div>
              </div>

              {modelsFetchStatus.type && (
                <div
                  className={`flex items-center gap-2 p-2 rounded text-sm ${
                    modelsFetchStatus.type === "success"
                      ? "bg-green-50 text-green-700 border border-green-200"
                      : "bg-red-50 text-red-700 border border-red-200"
                  }`}
                >
                  {modelsFetchStatus.type === "success" ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}
                  {modelsFetchStatus.message}
                </div>
              )}

              {useModelDropdown && availableModels.length > 0 ? (
                <Select
                  value={config.model}
                  onValueChange={(value) => setConfig((prev) => ({ ...prev, model: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableModels.map((model) => (
                      <SelectItem key={model.id} value={model.id}>
                        {model.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  id="model"
                  value={config.model}
                  onChange={(e) => setConfig((prev) => ({ ...prev, model: e.target.value }))}
                  placeholder="gpt-3.5-turbo"
                />
              )}
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="streamEnabled">流式请求</Label>
                <p className="text-xs text-muted-foreground">启用后将实时显示AI生成内容</p>
              </div>
              <Switch
                id="streamEnabled"
                checked={config.streamEnabled}
                onCheckedChange={(checked) => setConfig((prev) => ({ ...prev, streamEnabled: checked }))}
              />
            </div>

            <div className="p-3 bg-muted rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <div
                  className={`w-2 h-2 rounded-full ${config.apiKey && config.baseUrl ? "bg-green-500" : "bg-red-500"}`}
                ></div>
                <span className="text-sm font-medium">配置状态</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {config.apiKey && config.baseUrl ? "✅ AI配置已完成，可以开始游戏" : "❌ 请完善API密钥和基本地址配置"}
              </p>
              <div className="mt-2 text-xs text-muted-foreground">
                <p>
                  模型获取地址: {config.baseUrl}
                  {config.modelsPath}
                </p>
                <p>
                  聊天请求地址: {config.baseUrl}
                  {config.chatPath}
                </p>
                <p>流式请求: {config.streamEnabled ? "启用" : "禁用"}</p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="game" className="space-y-4">
            <div>
              <Label htmlFor="gameMode">默认游戏模式</Label>
              <Select
                value={config.gameMode}
                onValueChange={(value: any) => setConfig((prev) => ({ ...prev, gameMode: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(getAllGameModes()).map(([mode, info]) => (
                    <SelectItem key={mode} value={mode}>
                      {info.icon} {info.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="maxChoices">最大选择数</Label>
              <Select
                value={config.maxChoices.toString()}
                onValueChange={(value) => setConfig((prev) => ({ ...prev, maxChoices: Number.parseInt(value) }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2">2个选择</SelectItem>
                  <SelectItem value="3">3个选择</SelectItem>
                  <SelectItem value="4">4个选择</SelectItem>
                  <SelectItem value="5">5个选择</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="storyLength">故事长度</Label>
              <Select
                value={config.storyLength}
                onValueChange={(value: any) => setConfig((prev) => ({ ...prev, storyLength: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="short">短篇</SelectItem>
                  <SelectItem value="medium">中篇</SelectItem>
                  <SelectItem value="long">长篇</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="theme">主题</Label>
              <Select
                value={config.theme}
                onValueChange={(value: any) => setConfig((prev) => ({ ...prev, theme: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="light">浅色</SelectItem>
                  <SelectItem value="dark">深色</SelectItem>
                  <SelectItem value="system">跟随系统</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="language">语言</Label>
              <Select
                value={config.language}
                onValueChange={(value: any) => setConfig((prev) => ({ ...prev, language: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="zh">中文</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>自定义游戏模式</Label>
              <div className="mt-2 space-y-2">
                {Object.entries(config.customGameModes).map(([id, mode]) => (
                  <div key={id} className="flex items-center justify-between p-2 border rounded">
                    <div>
                      <span className="font-medium">{mode.name}</span>
                      <p className="text-xs text-muted-foreground">{mode.description}</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => handleRemoveCustomMode(id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                {Object.keys(config.customGameModes).length === 0 && (
                  <p className="text-sm text-muted-foreground">暂无自定义游戏模式</p>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="system" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>运行模式</Label>
                <p className="text-sm text-muted-foreground">
                  {systemInfo.hasDatabase ? "完整版（数据库支持）" : "单机版（本地存储）"}
                </p>
              </div>
              <div>
                <Label>版本</Label>
                <p className="text-sm text-muted-foreground">{systemInfo.version}</p>
              </div>
            </div>
            {user && user.role === "admin" && systemInfo.hasDatabase && (
              <div className="mt-4">
                <Button onClick={() => window.open("/admin", "_blank")} variant="outline" className="w-full">
                  <Shield className="h-4 w-4 mr-2" />
                  管理员面板
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setShowSettings(false)}>
            取消
          </Button>
          <Button onClick={handleSaveConfig}>保存设置</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
})