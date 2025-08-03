import { useCallback } from 'react'
import { useConfigStore, useGameStore, useUIStore } from '@/stores'
import { ConfigManager } from '@/lib/config'

export const useConfigHandlers = () => {
  const {
    customModeForm, setCustomModeForm,
    availableModels, setAvailableModels,
    isLoadingModels, setIsLoadingModels,
    modelsFetchStatus, setModelsFetchStatus,
    saveConfig, fetchAvailableModels,
    customGameModes
  } = useConfigStore()
  
  const { engine } = useGameStore()
  const { setShowSettings, setShowCustomModeDialog } = useUIStore()

  const configManager = ConfigManager.getInstance()

  const handleSaveConfig = useCallback(async () => {
    try {
      await saveConfig()
      
      if (engine) {
        engine.updateAIConfig()
      }

      setShowSettings(false)
      alert("配置保存成功")
    } catch (error) {
      console.error("Failed to save config:", error)
      alert("配置保存失败，请重试")
    }
  }, [saveConfig, engine, setShowSettings])

  const handleLoadModels = useCallback(async () => {
    setIsLoadingModels(true)
    setModelsFetchStatus({ type: null, message: "" })

    try {
      await fetchAvailableModels()
      
      const updatedModels = useConfigStore.getState().availableModels
      
      if (updatedModels.length > 0) {
        setModelsFetchStatus({
          type: "success",
          message: `成功获取到 ${updatedModels.length} 个模型`,
        })
      } else {
        setModelsFetchStatus({
          type: "error",
          message: "未找到可用模型",
        })
      }
    } catch (error) {
      setModelsFetchStatus({
        type: "error",
        message: `获取模型列表失败: ${error instanceof Error ? error.message : "未知错误"}`,
      })
    } finally {
      setIsLoadingModels(false)
    }
  }, [fetchAvailableModels, setIsLoadingModels, setModelsFetchStatus])

  const handleResetModels = useCallback(() => {
    configManager.clearAvailableModels()
    setAvailableModels([])
    setModelsFetchStatus({ type: null, message: "" })
  }, [setAvailableModels, setModelsFetchStatus])

  const handleAddCustomMode = useCallback(() => {
    if (!customModeForm.name || !customModeForm.description || !customModeForm.prompt) {
      alert("请填写完整的自定义模式信息")
      return
    }

    const modeId = `custom_${Date.now()}`
    configManager.addCustomGameMode(modeId, customModeForm)
    
    // 触发配置更新
    const { setConfig } = useConfigStore.getState()
    setConfig(() => configManager.getConfig())
    
    setCustomModeForm({ name: "", description: "", prompt: "" })
    setShowCustomModeDialog(false)
  }, [customModeForm, setCustomModeForm, setShowCustomModeDialog])

  const handleRemoveCustomMode = useCallback((modeId: string) => {
    if (confirm("确定要删除这个自定义模式吗？")) {
      configManager.removeCustomGameMode(modeId)
      
      // 触发配置更新
      const { setConfig } = useConfigStore.getState()
      setConfig(() => configManager.getConfig())
    }
  }, [])

  return {
    handleSaveConfig,
    handleLoadModels,
    handleResetModels,
    handleAddCustomMode,
    handleRemoveCustomMode
  }
}