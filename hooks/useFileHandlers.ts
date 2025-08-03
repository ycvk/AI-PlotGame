import { useCallback } from 'react'
import { useGameStore, useUIStore } from '@/stores'

export const useFileHandlers = () => {
  const {
    engine: storyEngine,
    setCurrentNode,
    setGameRecords
  } = useGameStore()
  
  const { setShowGameSelectionDialog, setShowGameModeSelect } = useUIStore()

  const exportSave = useCallback(() => {
    if (!storyEngine) return

    const saveData = storyEngine.exportSave()
    const blob = new Blob([saveData], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `game-save-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }, [storyEngine])

  const importSave = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !storyEngine) return

    const reader = new FileReader()
    reader.onload = async (e) => {
      const content = e.target?.result as string
      if (storyEngine.importSave(content)) {
        setCurrentNode(storyEngine.getCurrentNode())
        setGameRecords(storyEngine.getAllGameRecords())
        setShowGameSelectionDialog(false)
        setShowGameModeSelect(false)
        alert("存档导入成功！")
      } else {
        alert("存档导入失败！")
      }
    }
    reader.readAsText(file)
  }, [storyEngine, setCurrentNode, setGameRecords, setShowGameSelectionDialog, setShowGameModeSelect])

  return {
    exportSave,
    importSave
  }
}