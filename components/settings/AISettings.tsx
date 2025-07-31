'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  RefreshCw, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Eye, 
  EyeOff,
  AlertCircle,
  Settings,
  Zap
} from 'lucide-react'
import { useConfigStore, useUIStore } from '@/stores'

const AI_PROVIDERS = {
  openai: {
    name: 'OpenAI',
    baseUrl: 'https://api.openai.com',
    models: ['gpt-3.5-turbo', 'gpt-4', 'gpt-4-turbo-preview'],
    requiresKey: true
  },
  anthropic: {
    name: 'Anthropic',
    baseUrl: 'https://api.anthropic.com',
    models: ['claude-3-haiku-20240307', 'claude-3-sonnet-20240229', 'claude-3-opus-20240229'],
    requiresKey: true
  },
  groq: {
    name: 'Groq',
    baseUrl: 'https://api.groq.com/openai',
    models: ['llama2-70b-4096', 'mixtral-8x7b-32768'],
    requiresKey: true
  },
  custom: {
    name: 'Custom',
    baseUrl: '',
    models: [],
    requiresKey: false
  }
} as const

export const AISettings: React.FC = () => {
  const { 
    aiConfig, 
    availableModels, 
    isLoadingModels, 
    error,
    updateAIConfig,
    setAPIKey,
    setModel,
    setProvider,
    fetchAvailableModels,
    clearAvailableModels,
    saveConfig,
    isSaving,
    clearError
  } = useConfigStore()
  
  const { addToast } = useUIStore()
  
  const [localConfig, setLocalConfig] = useState(aiConfig)
  const [showAPIKey, setShowAPIKey] = useState(false)
  const [testStatus, setTestStatus] = useState<{
    type: 'success' | 'error' | null
    message: string
  }>({ type: null, message: '' })

  // 同步本地配置与store
  useEffect(() => {
    setLocalConfig(aiConfig)
  }, [aiConfig])

  // 清理错误状态
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        clearError()
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [error, clearError])

  const handleProviderChange = (provider: keyof typeof AI_PROVIDERS) => {
    const providerConfig = AI_PROVIDERS[provider]
    const newConfig = {
      ...localConfig,
      provider,
      baseUrl: providerConfig.baseUrl,
      model: providerConfig.models[0] || ''
    }
    
    setLocalConfig(newConfig)
    setProvider(provider)
    clearAvailableModels()
    setTestStatus({ type: null, message: '' })
  }

  const handleConfigChange = (field: keyof typeof localConfig, value: string) => {
    const newConfig = { ...localConfig, [field]: value }
    setLocalConfig(newConfig)
    
    if (field === 'apiKey' || field === 'baseUrl') {
      setTestStatus({ type: null, message: '' })
    }
  }

  const handleTestConnection = async () => {
    if (!localConfig.apiKey && AI_PROVIDERS[localConfig.provider].requiresKey) {
      setTestStatus({
        type: 'error',
        message: '请先设置API密钥'
      })
      return
    }

    if (!localConfig.baseUrl) {
      setTestStatus({
        type: 'error',
        message: '请设置API基础URL'
      })
      return
    }

    setTestStatus({ type: null, message: '' })
    
    try {
      // 更新配置到store
      updateAIConfig(localConfig)
      
      // 测试连接并获取模型列表
      await fetchAvailableModels()
      
      if (availableModels.length > 0) {
        setTestStatus({
          type: 'success',
          message: `连接成功！发现 ${availableModels.length} 个可用模型`
        })
      } else {
        setTestStatus({
          type: 'error',
          message: '连接成功但未找到可用模型'
        })
      }
    } catch (error) {
      setTestStatus({
        type: 'error',
        message: error instanceof Error ? error.message : '连接测试失败'
      })
    }
  }

  const handleSaveConfig = async () => {
    try {
      // 验证必要字段
      if (!localConfig.baseUrl) {
        addToast({
          type: 'error',
          title: '配置不完整',
          description: '请设置API基础URL'
        })
        return
      }

      if (AI_PROVIDERS[localConfig.provider].requiresKey && !localConfig.apiKey) {
        addToast({
          type: 'error',
          title: '配置不完整',
          description: '请设置API密钥'
        })
        return
      }

      // 更新配置到store
      updateAIConfig(localConfig)
      
      // 保存配置
      await saveConfig()
      
      addToast({
        type: 'success',
        title: '配置已保存',
        description: 'AI设置已成功保存'
      })
    } catch (error) {
      addToast({
        type: 'error',
        title: '保存失败',
        description: error instanceof Error ? error.message : '保存配置时发生错误'
      })
    }
  }

  const resetToDefaults = () => {
    const defaultConfig = {
      provider: 'openai' as const,
      baseUrl: AI_PROVIDERS.openai.baseUrl,
      apiKey: '',
      model: AI_PROVIDERS.openai.models[0],
      modelsPath: '/v1/models',
      chatPath: '/v1/chat/completions'
    }
    
    setLocalConfig(defaultConfig)
    clearAvailableModels()
    setTestStatus({ type: null, message: '' })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Zap className="h-5 w-5 mr-2" />
          AI 服务设置
        </CardTitle>
        <CardDescription>
          配置AI服务提供商和模型参数
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="basic">基础设置</TabsTrigger>
            <TabsTrigger value="advanced">高级设置</TabsTrigger>
          </TabsList>
          
          <TabsContent value="basic" className="space-y-4">
            {/* 服务提供商选择 */}
            <div className="space-y-2">
              <Label htmlFor="provider">服务提供商</Label>
              <Select
                value={localConfig.provider}
                onValueChange={handleProviderChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择AI服务提供商" />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(AI_PROVIDERS).map(([key, provider]) => (
                    <SelectItem key={key} value={key}>
                      {provider.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* API基础URL */}
            <div className="space-y-2">
              <Label htmlFor="baseUrl">API基础URL</Label>
              <Input
                id="baseUrl"
                value={localConfig.baseUrl}
                onChange={(e) => handleConfigChange('baseUrl', e.target.value)}
                placeholder="https://api.openai.com"
                disabled={localConfig.provider !== 'custom'}
              />
              {localConfig.provider !== 'custom' && (
                <p className="text-xs text-muted-foreground">
                  选择预设提供商时将自动设置
                </p>
              )}
            </div>

            {/* API密钥 */}
            {AI_PROVIDERS[localConfig.provider].requiresKey && (
              <div className="space-y-2">
                <Label htmlFor="apiKey">API密钥</Label>
                <div className="relative">
                  <Input
                    id="apiKey"
                    type={showAPIKey ? 'text' : 'password'}
                    value={localConfig.apiKey}
                    onChange={(e) => handleConfigChange('apiKey', e.target.value)}
                    placeholder="输入你的API密钥"
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                    onClick={() => setShowAPIKey(!showAPIKey)}
                  >
                    {showAPIKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </div>
            )}

            {/* 连接测试 */}
            <div className="space-y-3">
              <div className="flex gap-2">
                <Button
                  onClick={handleTestConnection}
                  disabled={isLoadingModels}
                  variant="outline"
                  className="flex-1"
                >
                  {isLoadingModels ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      测试连接中...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      测试连接
                    </>
                  )}
                </Button>
                
                <Button
                  onClick={clearAvailableModels}
                  variant="ghost"
                  size="sm"
                  disabled={availableModels.length === 0}
                >
                  清除
                </Button>
              </div>

              {/* 测试结果 */}
              {testStatus.type && (
                <div className={`flex items-center p-3 rounded-lg ${
                  testStatus.type === 'success' 
                    ? 'bg-green-50 text-green-700 border border-green-200' 
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  {testStatus.type === 'success' ? (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  ) : (
                    <XCircle className="h-4 w-4 mr-2" />
                  )}
                  <span className="text-sm">{testStatus.message}</span>
                </div>
              )}

              {error && (
                <div className="flex items-center p-3 rounded-lg bg-red-50 text-red-700 border border-red-200">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  <span className="text-sm">{error}</span>
                </div>
              )}
            </div>

            {/* 模型选择 */}
            <div className="space-y-2">
              <Label htmlFor="model">模型</Label>
              {availableModels.length > 0 ? (
                <Select
                  value={localConfig.model}
                  onValueChange={(value) => handleConfigChange('model', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="选择模型" />
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
                <div className="space-y-2">
                  <Input
                    id="model"
                    value={localConfig.model}
                    onChange={(e) => handleConfigChange('model', e.target.value)}
                    placeholder="输入模型名称，如 gpt-3.5-turbo"
                  />
                  <p className="text-xs text-muted-foreground">
                    请先测试连接以获取可用模型列表，或手动输入模型名称
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-4">
            {/* 模型API路径 */}
            <div className="space-y-2">
              <Label htmlFor="modelsPath">模型列表API路径</Label>
              <Input
                id="modelsPath"
                value={localConfig.modelsPath}
                onChange={(e) => handleConfigChange('modelsPath', e.target.value)}
                placeholder="/v1/models"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="chatPath">聊天API路径</Label>
              <Input
                id="chatPath"
                value={localConfig.chatPath}
                onChange={(e) => handleConfigChange('chatPath', e.target.value)}
                placeholder="/v1/chat/completions"
              />
            </div>

            {/* 重置按钮 */}
            <div className="pt-4 border-t">
              <Button
                onClick={resetToDefaults}
                variant="outline"
                className="w-full"
              >
                重置为默认设置
              </Button>
            </div>
          </TabsContent>
        </Tabs>

        {/* 保存按钮 */}
        <div className="flex gap-2 pt-4 border-t">
          <Button
            onClick={handleSaveConfig}
            disabled={isSaving}
            className="flex-1"
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                保存中...
              </>
            ) : (
              '保存配置'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}