import { create } from 'zustand'
import { devtools, subscribeWithSelector } from 'zustand/middleware'
import { 
  ConfigManager, 
  type GameConfig, 
  type SystemInfo, 
  type AIModel, 
  type CustomGameMode 
} from '@/lib/config'

export interface GameSettings {
  autoSave: boolean
  storyLength: 'short' | 'medium' | 'long'
  maxChoices: number
  theme: 'light' | 'dark' | 'system'
  language: 'zh' | 'en'
  streamEnabled: boolean
  gameMode: string
}

interface ConfigStore {
  // 配置管理器实例
  configManager: ConfigManager
  
  // AI配置
  aiConfig: {
    provider: 'openai' | 'anthropic' | 'groq' | 'custom'
    baseUrl: string
    apiKey: string
    model: string
    modelsPath: string
    chatPath: string
  }
  
  // 游戏设置
  gameSettings: GameSettings
  
  // 系统信息
  systemInfo: SystemInfo
  
  // 可用模型列表
  availableModels: AIModel[]
  isLoadingModels: boolean
  
  // 自定义游戏模式
  customGameModes: Record<string, CustomGameMode>
  customModeForm: {
    name: string
    description: string
    prompt: string
  }
  
  // 错误状态
  error: string | null
  isLoading: boolean
  isSaving: boolean
  
  // 模型获取状态
  modelsFetchStatus: {
    type: 'success' | 'error' | null
    message: string
  }
  
  // 初始化
  initialize: () => Promise<void>
  
  // 配置管理
  loadConfig: () => Promise<void>
  saveConfig: () => Promise<void>
  resetConfig: () => void
  setConfig: (updater: (prev: any) => any) => void // 通用配置更新方法
  
  // AI配置更新
  updateAIConfig: (config: Partial<ConfigStore['aiConfig']>) => void
  setAPIKey: (apiKey: string) => void
  setModel: (model: string) => void
  setProvider: (provider: ConfigStore['aiConfig']['provider']) => void
  
  // 游戏设置更新
  updateGameSettings: (settings: Partial<GameSettings>) => void
  setTheme: (theme: GameSettings['theme']) => void
  setLanguage: (language: GameSettings['language']) => void
  setStoryLength: (length: GameSettings['storyLength']) => void
  
  // 模型管理
  fetchAvailableModels: () => Promise<void>
  clearAvailableModels: () => void
  setAvailableModels: (models: AIModel[]) => void
  setIsLoadingModels: (loading: boolean) => void
  setModelsFetchStatus: (status: { type: 'success' | 'error' | null; message: string }) => void
  
  // 自定义游戏模式管理
  addCustomGameMode: (id: string, mode: CustomGameMode) => void
  removeCustomGameMode: (id: string) => void
  updateCustomGameMode: (id: string, mode: Partial<CustomGameMode>) => void
  setCustomModeForm: (form: Partial<ConfigStore['customModeForm']>) => void
  resetCustomModeForm: () => void
  
  // 系统信息更新
  setSystemInfo: (info: SystemInfo) => void
  
  // 错误处理
  setError: (error: string | null) => void
  clearError: () => void
  
  // 获取完整配置对象
  getFullConfig: () => GameConfig
}

export const useConfigStore = create<ConfigStore>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      // 初始状态
      configManager: ConfigManager.getInstance(),
      
      aiConfig: {
        provider: 'openai',
        baseUrl: 'https://api.openai.com',
        apiKey: '',
        model: 'gpt-3.5-turbo',
        modelsPath: '/v1/models',
        chatPath: '/v1/chat/completions'
      },
      
      gameSettings: {
        autoSave: true,
        storyLength: 'medium',
        maxChoices: 4,
        theme: 'system',
        language: 'zh',
        streamEnabled: true,
        gameMode: 'adventure'
      },
      
      systemInfo: {
        hasDatabase: false,
        version: '1.0.0'
      },
      
      availableModels: [],
      isLoadingModels: false,
      
      customGameModes: {},
      customModeForm: {
        name: '',
        description: '',
        prompt: ''
      },
      
      error: null,
      isLoading: false,
      isSaving: false,
      
      modelsFetchStatus: {
        type: null,
        message: ''
      },
      
      // 初始化
      initialize: async () => {
        const { configManager } = get()
        
        try {
          set({ isLoading: true, error: null })
          
          await configManager.loadConfig()
          
          const config = configManager.getConfig()
          const systemInfo = configManager.getSystemInfo()
          
          set({
            aiConfig: {
              provider: config.aiProvider,
              baseUrl: config.baseUrl,
              apiKey: config.apiKey,
              model: config.model,
              modelsPath: config.modelsPath,
              chatPath: config.chatPath
            },
            gameSettings: {
              autoSave: true, // 默认开启自动保存
              storyLength: config.storyLength,
              maxChoices: config.maxChoices,
              theme: config.theme,
              language: config.language,
              streamEnabled: config.streamEnabled,
              gameMode: config.gameMode || 'adventure'
            },
            systemInfo,
            customGameModes: config.customGameModes,
            isLoading: false,
            error: null
          })
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : '初始化配置失败',
            isLoading: false
          })
        }
      },
      
      // 加载配置
      loadConfig: async () => {
        const { configManager } = get()
        
        try {
          set({ isLoading: true, error: null })
          
          await configManager.loadConfig()
          
          const config = configManager.getConfig()
          const systemInfo = configManager.getSystemInfo()
          
          set({
            aiConfig: {
              provider: config.aiProvider,
              baseUrl: config.baseUrl,
              apiKey: config.apiKey,
              model: config.model,
              modelsPath: config.modelsPath,
              chatPath: config.chatPath
            },
            gameSettings: {
              autoSave: true,
              storyLength: config.storyLength,
              maxChoices: config.maxChoices,
              theme: config.theme,
              language: config.language,
              streamEnabled: config.streamEnabled,
              gameMode: config.gameMode || 'adventure'
            },
            systemInfo,
            customGameModes: config.customGameModes,
            isLoading: false,
            error: null
          })
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : '加载配置失败',
            isLoading: false
          })
        }
      },
      
      // 保存配置
      saveConfig: async () => {
        const { configManager } = get()
        
        try {
          set({ isSaving: true, error: null })
          
          const fullConfig = get().getFullConfig()
          await configManager.saveConfig(fullConfig)
          
          set({
            isSaving: false,
            error: null
          })
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : '保存配置失败',
            isSaving: false
          })
        }
      },
      
      // 重置配置
      resetConfig: () => {
        set({
          aiConfig: {
            provider: 'openai',
            baseUrl: 'https://api.openai.com',
            apiKey: '',
            model: 'gpt-3.5-turbo',
            modelsPath: '/v1/models',
            chatPath: '/v1/chat/completions'
          },
          gameSettings: {
            autoSave: true,
            storyLength: 'medium',
            maxChoices: 4,
            theme: 'system',
            language: 'zh',
            streamEnabled: true,
            gameMode: 'adventure'
          },
          customGameModes: {},
          error: null
        })
      },
      
      // 通用配置更新方法（为兼容性）
      setConfig: (updater: (prev: any) => any) => {
        const currentState = get()
        const combinedConfig = {
          ...currentState.aiConfig,
          ...currentState.gameSettings,
          customGameModes: currentState.customGameModes
        }
        const newConfig = updater(combinedConfig)
        
        // 分发更新到适当的状态分片
        const aiConfigKeys = ['provider', 'baseUrl', 'apiKey', 'model', 'modelsPath', 'chatPath']
        const gameSettingsKeys = ['autoSave', 'storyLength', 'maxChoices', 'theme', 'language', 'streamEnabled', 'gameMode']
        
        const aiConfigUpdates: any = {}
        const gameSettingsUpdates: any = {}
        
        Object.keys(newConfig).forEach(key => {
          if (aiConfigKeys.includes(key)) {
            aiConfigUpdates[key] = newConfig[key]
          } else if (gameSettingsKeys.includes(key)) {
            gameSettingsUpdates[key] = newConfig[key]
          }
        })
        
        if (Object.keys(aiConfigUpdates).length > 0) {
          currentState.updateAIConfig(aiConfigUpdates)
        }
        if (Object.keys(gameSettingsUpdates).length > 0) {
          currentState.updateGameSettings(gameSettingsUpdates)
        }
        if (newConfig.customGameModes) {
          set({ customGameModes: newConfig.customGameModes })
        }
      },
      
      // AI配置更新
      updateAIConfig: (newConfig) => {
        set((state) => ({
          aiConfig: { ...state.aiConfig, ...newConfig }
        }))
      },
      
      setAPIKey: (apiKey: string) => {
        set((state) => ({
          aiConfig: { ...state.aiConfig, apiKey }
        }))
      },
      
      setModel: (model: string) => {
        set((state) => ({
          aiConfig: { ...state.aiConfig, model }
        }))
      },
      
      setProvider: (provider) => {
        // 根据提供商设置默认URL
        const providerDefaults = {
          openai: 'https://api.openai.com',
          anthropic: 'https://api.anthropic.com',
          groq: 'https://api.groq.com/openai',
          custom: ''
        }
        
        set((state) => ({
          aiConfig: { 
            ...state.aiConfig, 
            provider,
            baseUrl: providerDefaults[provider]
          }
        }))
      },
      
      // 游戏设置更新
      updateGameSettings: (newSettings) => {
        set((state) => ({
          gameSettings: { ...state.gameSettings, ...newSettings }
        }))
      },
      
      setTheme: (theme) => {
        set((state) => ({
          gameSettings: { ...state.gameSettings, theme }
        }))
      },
      
      setLanguage: (language) => {
        set((state) => ({
          gameSettings: { ...state.gameSettings, language }
        }))
      },
      
      setStoryLength: (storyLength) => {
        set((state) => ({
          gameSettings: { ...state.gameSettings, storyLength }
        }))
      },
      
      // 获取可用模型
      fetchAvailableModels: async () => {
        const { configManager, aiConfig } = get()
        
        if (!aiConfig.apiKey) {
          set({ error: '请先设置API密钥' })
          return
        }
        
        try {
          set({ isLoadingModels: true, error: null })
          
          const fullConfig = get().getFullConfig()
          const result = await configManager.fetchAvailableModels(fullConfig)
          
          if (result.success) {
            set({
              availableModels: result.models,
              isLoadingModels: false,
              error: null
            })
          } else {
            set({
              error: result.error || '获取模型列表失败',
              isLoadingModels: false
            })
          }
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : '获取模型列表失败',
            isLoadingModels: false
          })
        }
      },
      
      clearAvailableModels: () => {
        const { configManager } = get()
        configManager.clearAvailableModels()
        set({ availableModels: [] })
      },
      
      setAvailableModels: (availableModels: AIModel[]) => {
        set({ availableModels })
      },
      
      setIsLoadingModels: (isLoadingModels: boolean) => {
        set({ isLoadingModels })
      },
      
      setModelsFetchStatus: (modelsFetchStatus: { type: 'success' | 'error' | null; message: string }) => {
        set({ modelsFetchStatus })
      },
      
      // 自定义游戏模式管理
      addCustomGameMode: (id: string, mode: CustomGameMode) => {
        const { configManager } = get()
        configManager.addCustomGameMode(id, mode)
        
        set((state) => ({
          customGameModes: { ...state.customGameModes, [id]: mode }
        }))
      },
      
      removeCustomGameMode: (id: string) => {
        const { configManager } = get()
        configManager.removeCustomGameMode(id)
        
        set((state) => {
          const { [id]: removed, ...rest } = state.customGameModes
          return { customGameModes: rest }
        })
      },
      
      updateCustomGameMode: (id: string, mode: Partial<CustomGameMode>) => {
        set((state) => ({
          customGameModes: {
            ...state.customGameModes,
            [id]: { ...state.customGameModes[id], ...mode }
          }
        }))
      },
      
      setCustomModeForm: (form: Partial<ConfigStore['customModeForm']>) => {
        set((state) => ({
          customModeForm: { ...state.customModeForm, ...form }
        }))
      },
      
      resetCustomModeForm: () => {
        set({
          customModeForm: {
            name: '',
            description: '',
            prompt: ''
          }
        })
      },
      
      // 系统信息更新
      setSystemInfo: (systemInfo: SystemInfo) => {
        set({ systemInfo })
      },
      
      // 错误处理
      setError: (error: string | null) => {
        set({ error })
      },
      
      clearError: () => {
        set({ error: null })
      },
      
      // 获取完整配置对象
      getFullConfig: (): GameConfig => {
        const { aiConfig, gameSettings, customGameModes } = get()
        
        return {
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
      }
    })),
    {
      name: 'config-store',
    }
  )
)