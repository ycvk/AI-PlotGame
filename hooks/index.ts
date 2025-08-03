// 导出所有自定义hooks
export { useAuthHandlers } from './useAuthHandlers'
export { useGameHandlers } from './useGameHandlers'
export { useConfigHandlers } from './useConfigHandlers'
export { useGameRecordHandlers } from './useGameRecordHandlers'
export { useFileHandlers } from './useFileHandlers'

// 组合所有handlers的主hook
import { useAuthHandlers } from './useAuthHandlers'
import { useGameHandlers } from './useGameHandlers'
import { useConfigHandlers } from './useConfigHandlers'
import { useGameRecordHandlers } from './useGameRecordHandlers'
import { useFileHandlers } from './useFileHandlers'

export const useAllHandlers = () => {
  const auth = useAuthHandlers()
  const game = useGameHandlers()
  const config = useConfigHandlers()
  const gameRecord = useGameRecordHandlers()
  const file = useFileHandlers()

  return {
    // 认证相关
    handleLogin: auth.handleLogin,
    handleRegister: auth.handleRegister,
    handleLogout: auth.handleLogout,
    initializeStoryEngine: auth.initializeStoryEngine,

    // 游戏操作
    handleStartGame: game.handleStartGame,
    handleChoice: game.handleChoice,
    handleCustomChoice: game.handleCustomChoice,
    handleResetGame: game.handleResetGame,
    handlePageNavigation: game.handlePageNavigation,

    // 配置管理
    handleSaveConfig: config.handleSaveConfig,
    handleLoadModels: config.handleLoadModels,
    handleResetModels: config.handleResetModels,
    handleAddCustomMode: config.handleAddCustomMode,
    handleRemoveCustomMode: config.handleRemoveCustomMode,

    // 游戏记录
    handleLoadGame: gameRecord.handleLoadGame,
    handleDeleteGame: gameRecord.handleDeleteGame,
    handleSaveProgressToCloud: gameRecord.handleSaveProgressToCloud,
    handleBackToHome: gameRecord.handleBackToHome,

    // 文件操作
    exportSave: file.exportSave,
    importSave: file.importSave
  }
}