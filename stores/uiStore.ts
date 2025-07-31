import { create } from 'zustand'
import { devtools, subscribeWithSelector } from 'zustand/middleware'

export type ActiveTab = 'login' | 'register' | 'game' | 'settings' | 'records' | 'system'
export type SettingsTab = 'ai' | 'game' | 'system' | 'about'
export type ModalType = 'none' | 'confirm' | 'alert' | 'prompt' | 'gameMenu' | 'recordDetails'

interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  description?: string
  duration?: number
}

interface Modal {
  type: ModalType
  title?: string
  content?: string
  data?: any
  onConfirm?: () => void
  onCancel?: () => void
}

interface UIStore {
  // 主要视图状态
  activeTab: ActiveTab
  settingsTab: SettingsTab
  
  // 应用程序加载状态
  isLoading: boolean
  
  // 认证对话框状态
  showLogin: boolean
  showRegister: boolean
  
  // 游戏模式选择状态
  showGameModeSelect: boolean
  showGameSelectionDialog: boolean
  showCustomModeDialog: boolean
  
  // 面板显示状态
  showSettings: boolean
  showGameRecords: boolean
  showSystemInfo: boolean
  showGameMenu: boolean
  
  // 侧边栏状态
  sidebarCollapsed: boolean
  sidebarWidth: number
  
  // 模态框状态
  modal: Modal
  
  // Toast 通知
  toasts: Toast[]
  
  // 加载状态
  globalLoading: boolean
  loadingMessage: string
  
  // 响应式状态
  isMobile: boolean
  screenWidth: number
  screenHeight: number
  
  // 游戏UI特定状态
  showChoices: boolean
  showStoryHistory: boolean
  showInventory: boolean
  choicesExpanded: boolean
  
  // 设置面板状态
  settingsExpanded: boolean
  advancedSettingsVisible: boolean
  
  // 动作
  setActiveTab: (tab: ActiveTab) => void
  setSettingsTab: (tab: SettingsTab) => void
  
  // 基础状态控制
  setIsLoading: (loading: boolean) => void
  
  // 认证对话框控制
  setShowLogin: (show: boolean) => void
  setShowRegister: (show: boolean) => void
  
  // 游戏模式选择控制
  setShowGameModeSelect: (show: boolean) => void
  setShowGameSelectionDialog: (show: boolean) => void
  setShowCustomModeDialog: (show: boolean) => void
  
  // 面板控制
  toggleSettings: () => void
  toggleGameRecords: () => void
  toggleSystemInfo: () => void
  toggleGameMenu: () => void
  setShowSettings: (show: boolean) => void
  setShowGameRecords: (show: boolean) => void
  setShowSystemInfo: (show: boolean) => void
  setShowGameMenu: (show: boolean) => void
  
  // 侧边栏控制
  toggleSidebar: () => void
  setSidebarCollapsed: (collapsed: boolean) => void
  setSidebarWidth: (width: number) => void
  
  // 模态框控制
  showModal: (modal: Omit<Modal, 'type'> & { type: ModalType }) => void
  hideModal: () => void
  showConfirmModal: (title: string, content: string, onConfirm: () => void, onCancel?: () => void) => void
  showAlertModal: (title: string, content: string) => void
  
  // Toast 控制
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
  clearToasts: () => void
  
  // 加载状态控制
  setGlobalLoading: (loading: boolean, message?: string) => void
  
  // 响应式状态更新
  updateScreenSize: (width: number, height: number) => void
  setIsMobile: (isMobile: boolean) => void
  
  // 游戏UI控制
  setShowChoices: (show: boolean) => void
  setShowStoryHistory: (show: boolean) => void
  setShowInventory: (show: boolean) => void
  setChoicesExpanded: (expanded: boolean) => void
  toggleChoices: () => void
  toggleStoryHistory: () => void
  toggleInventory: () => void
  
  // 设置面板控制
  setSettingsExpanded: (expanded: boolean) => void
  setAdvancedSettingsVisible: (visible: boolean) => void
  toggleSettingsExpanded: () => void
  toggleAdvancedSettings: () => void
  
  // 重置所有UI状态
  resetUI: () => void
}

export const useUIStore = create<UIStore>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      // 初始状态
      activeTab: 'login',
      settingsTab: 'ai',
      
      // 应用程序加载状态
      isLoading: true,
      
      // 认证对话框状态
      showLogin: false,
      showRegister: false,
      
      // 游戏模式选择状态
      showGameModeSelect: false,
      showGameSelectionDialog: false,
      showCustomModeDialog: false,
      
      showSettings: false,
      showGameRecords: false,
      showSystemInfo: false,
      showGameMenu: false,
      
      sidebarCollapsed: false,
      sidebarWidth: 280,
      
      modal: {
        type: 'none'
      },
      
      toasts: [],
      
      globalLoading: false,
      loadingMessage: '',
      
      isMobile: false,
      screenWidth: 1920,
      screenHeight: 1080,
      
      showChoices: true,
      showStoryHistory: false,
      showInventory: false,
      choicesExpanded: false,
      
      settingsExpanded: false,
      advancedSettingsVisible: false,
      
      // 主要导航
      setActiveTab: (activeTab: ActiveTab) => {
        set({ activeTab })
      },
      
      setSettingsTab: (settingsTab: SettingsTab) => {
        set({ settingsTab })
      },
      
      // 基础状态控制
      setIsLoading: (isLoading: boolean) => {
        set({ isLoading })
      },
      
      // 认证对话框控制
      setShowLogin: (showLogin: boolean) => {
        set({ showLogin })
      },
      
      setShowRegister: (showRegister: boolean) => {
        set({ showRegister })
      },
      
      // 游戏模式选择控制
      setShowGameModeSelect: (showGameModeSelect: boolean) => {
        set({ showGameModeSelect })
      },
      
      setShowGameSelectionDialog: (showGameSelectionDialog: boolean) => {
        set({ showGameSelectionDialog })
      },
      
      setShowCustomModeDialog: (showCustomModeDialog: boolean) => {
        set({ showCustomModeDialog })
      },
      
      // 面板控制
      toggleSettings: () => {
        set((state) => ({ showSettings: !state.showSettings }))
      },
      
      toggleGameRecords: () => {
        set((state) => ({ showGameRecords: !state.showGameRecords }))
      },
      
      toggleSystemInfo: () => {
        set((state) => ({ showSystemInfo: !state.showSystemInfo }))
      },
      
      toggleGameMenu: () => {
        set((state) => ({ showGameMenu: !state.showGameMenu }))
      },
      
      setShowSettings: (showSettings: boolean) => {
        set({ showSettings })
      },
      
      setShowGameRecords: (showGameRecords: boolean) => {
        set({ showGameRecords })
      },
      
      setShowSystemInfo: (showSystemInfo: boolean) => {
        set({ showSystemInfo })
      },
      
      setShowGameMenu: (showGameMenu: boolean) => {
        set({ showGameMenu })
      },
      
      // 侧边栏控制
      toggleSidebar: () => {
        set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed }))
      },
      
      setSidebarCollapsed: (sidebarCollapsed: boolean) => {
        set({ sidebarCollapsed })
      },
      
      setSidebarWidth: (sidebarWidth: number) => {
        set({ sidebarWidth })
      },
      
      // 模态框控制
      showModal: (modal) => {
        set({ modal })
      },
      
      hideModal: () => {
        set({ modal: { type: 'none' } })
      },
      
      showConfirmModal: (title: string, content: string, onConfirm: () => void, onCancel?: () => void) => {
        set({
          modal: {
            type: 'confirm',
            title,
            content,
            onConfirm,
            onCancel
          }
        })
      },
      
      showAlertModal: (title: string, content: string) => {
        set({
          modal: {
            type: 'alert',
            title,
            content
          }
        })
      },
      
      // Toast 控制
      addToast: (toast) => {
        const id = Date.now().toString()
        const newToast: Toast = { ...toast, id }
        
        set((state) => ({
          toasts: [...state.toasts, newToast]
        }))
        
        // 自动移除 toast
        const duration = toast.duration || 5000
        setTimeout(() => {
          get().removeToast(id)
        }, duration)
      },
      
      removeToast: (id: string) => {
        set((state) => ({
          toasts: state.toasts.filter(toast => toast.id !== id)
        }))
      },
      
      clearToasts: () => {
        set({ toasts: [] })
      },
      
      // 全局加载状态
      setGlobalLoading: (globalLoading: boolean, loadingMessage: string = '') => {
        set({ globalLoading, loadingMessage })
      },
      
      // 响应式状态
      updateScreenSize: (screenWidth: number, screenHeight: number) => {
        const isMobile = screenWidth < 768
        set({ screenWidth, screenHeight, isMobile })
        
        // 移动端自动收起侧边栏
        if (isMobile && !get().sidebarCollapsed) {
          set({ sidebarCollapsed: true })
        }
      },
      
      setIsMobile: (isMobile: boolean) => {
        set({ isMobile })
      },
      
      // 游戏UI控制
      setShowChoices: (showChoices: boolean) => {
        set({ showChoices })
      },
      
      setShowStoryHistory: (showStoryHistory: boolean) => {
        set({ showStoryHistory })
      },
      
      setShowInventory: (showInventory: boolean) => {
        set({ showInventory })
      },
      
      setChoicesExpanded: (choicesExpanded: boolean) => {
        set({ choicesExpanded })
      },
      
      toggleChoices: () => {
        set((state) => ({ showChoices: !state.showChoices }))
      },
      
      toggleStoryHistory: () => {
        set((state) => ({ showStoryHistory: !state.showStoryHistory }))
      },
      
      toggleInventory: () => {
        set((state) => ({ showInventory: !state.showInventory }))
      },
      
      // 设置面板控制
      setSettingsExpanded: (settingsExpanded: boolean) => {
        set({ settingsExpanded })
      },
      
      setAdvancedSettingsVisible: (advancedSettingsVisible: boolean) => {
        set({ advancedSettingsVisible })
      },
      
      toggleSettingsExpanded: () => {
        set((state) => ({ settingsExpanded: !state.settingsExpanded }))
      },
      
      toggleAdvancedSettings: () => {
        set((state) => ({ advancedSettingsVisible: !state.advancedSettingsVisible }))
      },
      
      // 重置UI状态
      resetUI: () => {
        set({
          activeTab: 'login',
          settingsTab: 'ai',
          showSettings: false,
          showGameRecords: false, 
          showSystemInfo: false,
          showGameMenu: false,
          sidebarCollapsed: false,
          modal: { type: 'none' },
          toasts: [],
          globalLoading: false,
          loadingMessage: '',
          showChoices: true,
          showStoryHistory: false,
          showInventory: false,
          choicesExpanded: false,
          settingsExpanded: false,
          advancedSettingsVisible: false
        })
      }
    })),
    {
      name: 'ui-store',
    }
  )
)