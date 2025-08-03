import { useCallback } from 'react'
import { useGameStore, useConfigStore, useUIStore } from '@/stores'

export const useGameHandlers = () => {
  const {
    engine: storyEngine,
    currentNode, setCurrentNode,
    isGenerating, setGenerating: setIsGenerating,
    streamingContent, setStreamingContent,
    isStreaming, setIsStreaming,
    pageInput, setPageInput,
    customChoice, setCustomChoice,
    gameRecords, setGameRecords
  } = useGameStore()
  
  const { aiConfig, gameSettings } = useConfigStore()
  const { setShowGameModeSelect, setShowGameSelectionDialog, setShowSettings } = useUIStore()

  // 组合配置对象
  const config = {
    apiKey: aiConfig.apiKey,
    baseUrl: aiConfig.baseUrl,
    streamEnabled: gameSettings.streamEnabled
  }

  const createStreamHandler = useCallback((currentStreamingContent: string) => {
    return (content: string) => {
      setStreamingContent(currentStreamingContent + content)
    }
  }, [setStreamingContent])

  const handleStartGame = useCallback(async (gameMode: string) => {
    if (!storyEngine) return

    if (!config.apiKey || !config.baseUrl) {
      if (confirm("AI配置未完成，是否现在进行配置？")) {
        setShowSettings(true)
      }
      return
    }

    setIsGenerating(true)
    setIsStreaming(config.streamEnabled)
    setStreamingContent("")
    setShowGameModeSelect(false)
    setShowGameSelectionDialog(false)

    const handleStream = createStreamHandler(streamingContent)

    try {
      const initialNode = await storyEngine.initializeGame(
        gameMode, 
        config.streamEnabled ? handleStream : undefined
      )
      if (initialNode) {
        setCurrentNode(initialNode)
        setGameRecords(storyEngine.getAllGameRecords())
      } else {
        setIsGenerating(false)
        setShowGameModeSelect(true)
        if (confirm("游戏初始化失败，可能是AI配置有误。是否现在检查配置？")) {
          setShowSettings(true)
        }
      }
    } catch (error) {
      console.error("Failed to start game:", error)
      setIsGenerating(false)
      setShowGameModeSelect(true)
      if (confirm("游戏启动失败，请检查网络连接和AI配置。是否现在检查配置？")) {
        setShowSettings(true)
      }
    } finally {
      setIsGenerating(false)
      setIsStreaming(false)
      setStreamingContent("")
    }
  }, [
    storyEngine, config, streamingContent, setIsGenerating, setIsStreaming, 
    setStreamingContent, setShowGameModeSelect, setShowGameSelectionDialog, 
    setShowSettings, setCurrentNode, setGameRecords, createStreamHandler
  ])

  const handleChoice = useCallback(async (choiceId: string) => {
    if (!storyEngine || isGenerating) return

    setIsGenerating(true)
    setIsStreaming(config.streamEnabled)
    setStreamingContent("")

    const handleStream = createStreamHandler(streamingContent)

    try {
      const nextNode = await storyEngine.makeChoice(
        choiceId,
        undefined,
        config.streamEnabled ? handleStream : undefined,
      )
      if (nextNode) {
        setCurrentNode(nextNode)
        setGameRecords(storyEngine.getAllGameRecords())
      } else {
        alert("故事生成失败，请重试")
      }
    } catch (error) {
      console.error("Failed to make choice:", error)
      alert("选择处理失败，请重试")
    } finally {
      setIsGenerating(false)
      setIsStreaming(false)
      setStreamingContent("")
    }
  }, [
    storyEngine, isGenerating, config, streamingContent, setIsGenerating, 
    setIsStreaming, setStreamingContent, setCurrentNode, setGameRecords, createStreamHandler
  ])

  const handleCustomChoice = useCallback(async () => {
    if (!storyEngine || isGenerating || !customChoice.trim()) return

    setIsGenerating(true)
    setIsStreaming(config.streamEnabled)
    setStreamingContent("")

    const handleStream = createStreamHandler(streamingContent)

    try {
      const nextNode = await storyEngine.makeChoice(
        "",
        customChoice.trim(),
        config.streamEnabled ? handleStream : undefined,
      )
      if (nextNode) {
        setCurrentNode(nextNode)
        setCustomChoice("")
        setGameRecords(storyEngine.getAllGameRecords())
      } else {
        alert("故事生成失败，请重试")
      }
    } catch (error) {
      console.error("Failed to make custom choice:", error)
      alert("自定义选择处理失败，请重试")
    } finally {
      setIsGenerating(false)
      setIsStreaming(false)
      setStreamingContent("")
    }
  }, [
    storyEngine, isGenerating, customChoice, config, streamingContent, 
    setIsGenerating, setIsStreaming, setStreamingContent, setCurrentNode, 
    setCustomChoice, setGameRecords, createStreamHandler
  ])

  const handleResetGame = useCallback(async () => {
    if (!storyEngine) return

    if (confirm("确定要重新开始游戏吗？当前进度将会丢失。")) {
      await storyEngine.resetGame()
      setCurrentNode(null)
      setShowGameModeSelect(true)
      setGameRecords(storyEngine.getAllGameRecords())
    }
  }, [storyEngine, setCurrentNode, setShowGameModeSelect, setGameRecords])

  const handlePageNavigation = useCallback((action: "prev" | "next" | "goto") => {
    if (!storyEngine) return

    let newNode = null

    switch (action) {
      case "prev":
        newNode = storyEngine.goToPreviousPage()
        break
      case "next":
        newNode = storyEngine.goToNextPage()
        break
      case "goto":
        const pageNum = Number.parseInt(pageInput)
        if (pageNum && pageNum > 0 && storyEngine.getTotalPages() && pageNum <= storyEngine.getTotalPages()) {
          newNode = storyEngine.goToPage(pageNum)
          setPageInput("")
        }
        break
    }

    if (newNode) {
      setCurrentNode(newNode)
      setGameRecords(storyEngine.getAllGameRecords())
    }
  }, [storyEngine, pageInput, setPageInput, setCurrentNode, setGameRecords])

  return {
    handleStartGame,
    handleChoice,
    handleCustomChoice,
    handleResetGame,
    handlePageNavigation
  }
}