// 导出所有 stores
export { useAuthStore, initializeAuth } from './authStore'
export type { LoginCredentials, RegisterData } from './authStore'

export { useGameStore } from './gameStore'
export type { GameMode } from './gameStore'

export { useConfigStore } from './configStore'
export type { GameSettings } from './configStore'

export { useUIStore } from './uiStore'
export type { ActiveTab, SettingsTab, ModalType } from './uiStore'

// 组合 store 的高级 hooks
import { useAuthStore } from './authStore'
import { useGameStore } from './gameStore'
import { useConfigStore } from './configStore'
import { useUIStore } from './uiStore'

// 初始化所有 stores 的函数
export const initializeStores = async () => {
  try {
    // 1. 首先初始化认证状态
    await initializeAuth()
    
    // 2. 初始化配置
    await useConfigStore.getState().initialize()
    
    // 3. 如果用户已登录，初始化游戏引擎
    const user = useAuthStore.getState().user
    if (user) {
      const systemInfo = useConfigStore.getState().systemInfo
      await useGameStore.getState().initializeEngine(systemInfo.hasDatabase, user.id)
    }
    
    // 4. 根据认证状态设置初始UI状态
    const activeTab = user ? 'game' : 'login'
    useUIStore.getState().setActiveTab(activeTab)
    
    return true
  } catch (error) {
    console.error('Failed to initialize stores:', error)
    return false
  }
}

// 清理所有 stores 的函数
export const cleanupStores = () => {
  useAuthStore.getState().logout()
  useGameStore.getState().cleanup()
  useUIStore.getState().resetUI()
}

// 获取所有 stores 状态的工具函数
export const getStoresState = () => ({
  auth: useAuthStore.getState(),
  game: useGameStore.getState(),
  config: useConfigStore.getState(),
  ui: useUIStore.getState()
})

// 订阅认证状态变化，自动处理游戏引擎初始化
useAuthStore.subscribe(
  (state) => state.user,
  async (user, previousUser) => {
    // 用户登录时初始化游戏引擎
    if (user && !previousUser) {
      const systemInfo = useConfigStore.getState().systemInfo
      await useGameStore.getState().initializeEngine(systemInfo.hasDatabase, user.id)
      useUIStore.getState().setActiveTab('game')
    }
    
    // 用户登出时清理游戏引擎
    if (!user && previousUser) {
      useGameStore.getState().cleanup()
      useUIStore.getState().setActiveTab('login')
    }
  }
)

// 订阅配置变化，自动更新游戏引擎配置
useConfigStore.subscribe(
  (state) => state.aiConfig,
  (aiConfig, previousAIConfig) => {
    const engine = useGameStore.getState().engine
    if (engine && JSON.stringify(aiConfig) !== JSON.stringify(previousAIConfig)) {
      // 通知游戏引擎更新AI配置
      engine.updateAIConfig()
    }
  }
)

// 响应式屏幕尺寸监听
if (typeof window !== 'undefined') {
  const updateScreenSize = () => {
    useUIStore.getState().updateScreenSize(window.innerWidth, window.innerHeight)
  }
  
  // 初始化屏幕尺寸
  updateScreenSize()
  
  // 监听窗口尺寸变化
  window.addEventListener('resize', updateScreenSize)
  
}

// 清理函数
export const cleanupEventListeners = () => {
  const updateScreenSize = () => {
    const { useUIStore } = require('./uiStore')
    useUIStore.getState().updateScreenSize(window.innerWidth, window.innerHeight)
    useUIStore.getState().setIsMobile(window.innerWidth < 768)
  }
  
  window.removeEventListener('resize', updateScreenSize)
}