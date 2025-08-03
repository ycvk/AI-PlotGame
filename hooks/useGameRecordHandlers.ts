import { useCallback } from 'react'
import { useGameStore, useAuthStore, useConfigStore, useUIStore } from '@/stores'

export const useGameRecordHandlers = () => {
  const {
    engine: storyEngine,
    setCurrentNode,
    gameRecords, setGameRecords,
    isGenerating, setGenerating: setIsGenerating
  } = useGameStore()
  
  const { user } = useAuthStore()
  const { systemInfo } = useConfigStore()
  const { setShowGameModeSelect, setShowGameSelectionDialog } = useUIStore()

  const handleLoadGame = useCallback(async (gameId: string) => {
    if (!storyEngine) return

    console.log("handleLoadGame: Attempting to load game", gameId)
    const success = await storyEngine.loadGame(gameId)
    if (success) {
      const node = storyEngine.getCurrentNode()
      console.log("handleLoadGame: Game loaded successfully. New current node:", node)
      setCurrentNode(node)
      setShowGameSelectionDialog(false)
      setShowGameModeSelect(false)
      setGameRecords(storyEngine.getAllGameRecords())
    } else {
      alert("加载游戏失败")
      console.error("handleLoadGame: Failed to load game", gameId)
    }
  }, [storyEngine, setCurrentNode, setShowGameSelectionDialog, setShowGameModeSelect, setGameRecords])

  const handleDeleteGame = useCallback(async (gameId: string) => {
    if (!storyEngine) return

    if (confirm("确定要删除这个游戏记录吗？")) {
      const success = await storyEngine.deleteGame(gameId)
      if (success) {
        setGameRecords(storyEngine.getAllGameRecords())
        if (storyEngine.getCurrentGameRecord() === null) {
          setCurrentNode(null)
          setShowGameModeSelect(true)
        }
      }
    }
  }, [storyEngine, setGameRecords, setCurrentNode, setShowGameModeSelect])

  const handleSaveProgressToCloud = useCallback(async () => {
    console.log("Attempting to save progress to cloud...")
    console.log("systemInfo.hasDatabase:", systemInfo.hasDatabase)
    console.log("user:", user)
    console.log("storyEngine?.getCurrentGameRecord()?.id:", storyEngine?.getCurrentGameRecord()?.id)

    if (!storyEngine || !systemInfo.hasDatabase || !user || !storyEngine.getCurrentGameRecord()) {
      console.error("Cannot save to cloud: Database not enabled, user not logged in, or no current game.")
      alert("保存进度到云端失败：请确保已登录并有正在进行的游戏。")
      return
    }
    
    setIsGenerating(true)
    try {
      const success = await storyEngine.saveCurrentGameToCloud()
      if (success) {
        alert("游戏进度已保存到云端！")
      } else {
        alert("保存进度到云端失败。")
      }
    } catch (error) {
      console.error("Error saving to cloud:", error)
      alert("保存进度到云端时发生错误。")
    } finally {
      setIsGenerating(false)
    }
  }, [storyEngine, systemInfo.hasDatabase, user, setIsGenerating])

  const handleBackToHome = useCallback(() => {
    setCurrentNode(null)
    setShowGameModeSelect(true)
    setShowGameSelectionDialog(false)
  }, [setCurrentNode, setShowGameModeSelect, setShowGameSelectionDialog])

  return {
    handleLoadGame,
    handleDeleteGame,
    handleSaveProgressToCloud,
    handleBackToHome
  }
}