"use client"

import type React from "react"

import { useEffect, useState, useRef } from "react"
import { ConfigManager, type AIModel } from "@/lib/config"
import { ClientAuthManager, type User } from "@/lib/auth-client"
import { ClientStoryEngine, type StoryNode, type GameRecord } from "@/lib/story-engine-client"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import {
  Settings,
  Upload,
  Download,
  GamepadIcon,
  Shield,
  Loader2,
  RefreshCw,
  Play,
  CheckCircle,
  XCircle,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Home,
  History,
  Send,
  Cloud,
} from "lucide-react"

const DEFAULT_GAME_MODES = {
  adventure: { name: "冒险探索", desc: "探索未知世界，发现隐藏秘密", icon: "🗺️" },
  mystery: { name: "悬疑推理", desc: "解开谜团，寻找真相", icon: "🔍" },
  horror: { name: "恐怖惊悚", desc: "在恐怖中生存，面对未知恐惧", icon: "👻" },
  romance: { name: "浪漫爱情", desc: "体验浪漫故事，发展人际关系", icon: "💕" },
  scifi: { name: "科幻未来", desc: "探索未来科技，太空冒险", icon: "🚀" },
  fantasy: { name: "奇幻魔法", desc: "奇幻魔法，神话传说", icon: "🧙‍♂️" },
}

export default function GamePage() {
  const [configManager] = useState(() => ConfigManager.getInstance())
  const [systemInfo, setSystemInfo] = useState(configManager.getSystemInfo())
  const [user, setUser] = useState<User | null>(null)
  const [storyEngine, setStoryEngine] = useState<ClientStoryEngine | null>(null)
  const [currentNode, setCurrentNode] = useState<StoryNode | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showLogin, setShowLogin] = useState(false)
  const [showRegister, setShowRegister] = useState(false)
  const [showGameModeSelect, setShowGameModeSelect] = useState(false)
  const [showGameSelectionDialog, setShowGameSelectionDialog] = useState(false)
  const [loginForm, setLoginForm] = useState({ username: "", password: "" })
  const [registerForm, setRegisterForm] = useState({ username: "", password: "", confirmPassword: "" })
  const [showSettings, setShowSettings] = useState(false)
  const [config, setConfig] = useState(configManager.getConfig())
  const [availableModels, setAvailableModels] = useState<AIModel[]>([])
  const [isLoadingModels, setIsLoadingModels] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [modelsFetchStatus, setModelsFetchStatus] = useState<{ type: "success" | "error" | null; message: string }>({
    type: null,
    message: "",
  })
  const [useModelDropdown, setUseModelDropdown] = useState(false)
  const [streamingContent, setStreamingContent] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)
  const [showCustomModeDialog, setShowCustomModeDialog] = useState(false)
  const [customModeForm, setCustomModeForm] = useState({ name: "", description: "", prompt: "" })
  const [pageInput, setPageInput] = useState("")
  const [customChoice, setCustomChoice] = useState("")
  const [gameRecords, setGameRecords] = useState<GameRecord[]>([])

  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    initializeApp()
  }, [])

  useEffect(() => {
    setUseModelDropdown(availableModels.length > 0)
  }, [availableModels])

  const initializeApp = async () => {
    setIsLoading(true)

    await configManager.loadConfig()
    // After loadConfig, configManager's internal systemInfo is up-to-date
    setConfig(configManager.getConfig())
    setSystemInfo(configManager.getSystemInfo()) // Update React state

    setAvailableModels(configManager.getAvailableModels())

    const savedToken = localStorage.getItem("auth-token")
    if (savedToken) {
      const savedUser = await ClientAuthManager.verifyToken(savedToken)
      if (savedUser) {
        setUser(savedUser)
        // Pass the directly retrieved systemInfo.hasDatabase from configManager
        await initializeStoryEngine(savedUser, configManager.getSystemInfo().hasDatabase)
      }
    }

    setIsLoading(false)
  }

  const initializeStoryEngine = async (currentUser: User, hasDatabase: boolean) => {
    // Use the passed hasDatabase value directly
    const engine = new ClientStoryEngine(hasDatabase, currentUser.id)
    await engine.loadGameState() // This will load all records and set currentGameId if found
    setStoryEngine(engine)

    const allRecords = engine.getAllGameRecords()
    setGameRecords(allRecords) // Update game records state

    // Check if a current game was loaded by loadGameState
    const loadedCurrentNode = engine.getCurrentNode()
    if (loadedCurrentNode) {
      setCurrentNode(loadedCurrentNode)
      setShowGameModeSelect(false) // Hide game mode selection if a game is loaded
    } else if (allRecords.length > 0) {
      // If there are existing games but no current game loaded, show the selection dialog
      setShowGameSelectionDialog(true)
      setShowGameModeSelect(false) // Hide game mode selection
    } else {
      // No existing games, prompt to start a new one
      setShowGameModeSelect(true)
    }
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    const result = await ClientAuthManager.login(loginForm.username, loginForm.password)

    if (result.success && result.user) {
      setUser(result.user)
      localStorage.setItem("auth-token", result.token!)
      setShowLogin(false)
      // Pass the directly retrieved systemInfo.hasDatabase from configManager
      await initializeStoryEngine(result.user, configManager.getSystemInfo().hasDatabase)
    } else {
      alert(result.error)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()

    if (registerForm.password !== registerForm.confirmPassword) {
      alert("密码确认不匹配")
      return
    }

    const result = await ClientAuthManager.register(registerForm.username, registerForm.password)

    if (result.success && result.user) {
      setUser(result.user)
      localStorage.setItem("auth-token", result.token!)
      setShowRegister(false)
      // Pass the directly retrieved systemInfo.hasDatabase from configManager
      await initializeStoryEngine(result.user, configManager.getSystemInfo().hasDatabase)
    } else {
      alert(result.error)
    }
  }

  const handleLogout = async () => {
    if (user) {
      await ClientAuthManager.logout()
      setUser(null)
      setStoryEngine(null)
      setCurrentNode(null)
      localStorage.removeItem("auth-token")
      // Reset UI to login/game mode select
      setShowGameModeSelect(false)
      setShowGameSelectionDialog(false)
      setShowLogin(true)
    }
  }

  const handleStartGame = async (gameMode: string) => {
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
    setShowGameSelectionDialog(false) // Ensure game selection dialog is closed when starting a new game

    const handleStream = (content: string) => {
      setStreamingContent((prev) => prev + content)
    }

    try {
      const initialNode = await storyEngine.initializeGame(gameMode, config.streamEnabled ? handleStream : undefined)
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
  }

  const handleChoice = async (choiceId: string) => {
    if (!storyEngine || isGenerating) return

    setIsGenerating(true)
    setIsStreaming(config.streamEnabled)
    setStreamingContent("")

    const handleStream = (content: string) => {
      setStreamingContent((prev) => prev + content)
    }

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
  }

  const handleCustomChoice = async () => {
    if (!storyEngine || isGenerating || !customChoice.trim()) return

    setIsGenerating(true)
    setIsStreaming(config.streamEnabled)
    setStreamingContent("")

    const handleStream = (content: string) => {
      setStreamingContent((prev) => prev + content)
    }

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
  }

  const handleSaveConfig = async () => {
    try {
      await configManager.saveConfig(config)
      setAvailableModels(configManager.getAvailableModels())

      if (storyEngine) {
        storyEngine.updateAIConfig()
      }

      setShowSettings(false)
      alert("配置保存成功")
    } catch (error) {
      console.error("Failed to save config:", error)
      alert("配置保存失败，请重试")
    }
  }

  const handleLoadModels = async () => {
    setIsLoadingModels(true)
    setModelsFetchStatus({ type: null, message: "" })

    try {
      const result = await configManager.fetchAvailableModels(config)

      if (result.success) {
        setAvailableModels(result.models)
        setUseModelDropdown(true)
        setModelsFetchStatus({
          type: "success",
          message: `成功获取到 ${result.models.length} 个模型`,
        })
      } else {
        setModelsFetchStatus({
          type: "error",
          message: result.error || "获取模型列表失败",
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
  }

  const handleResetModels = () => {
    configManager.clearAvailableModels()
    setAvailableModels([])
    setUseModelDropdown(false)
    setModelsFetchStatus({ type: null, message: "" })
  }

  const handleResetGame = async () => {
    if (!storyEngine) return

    if (confirm("确定要重新开始游戏吗？当前进度将会丢失。")) {
      await storyEngine.resetGame()
      setCurrentNode(null)
      setShowGameModeSelect(true)
      setGameRecords(storyEngine.getAllGameRecords())
    }
  }

  const handleAddCustomMode = () => {
    if (!customModeForm.name || !customModeForm.description || !customModeForm.prompt) {
      alert("请填写完整的自定义模式信息")
      return
    }

    const modeId = `custom_${Date.now()}`
    configManager.addCustomGameMode(modeId, customModeForm)
    setConfig(configManager.getConfig())
    setCustomModeForm({ name: "", description: "", prompt: "" })
    setShowCustomModeDialog(false)
  }

  const handleRemoveCustomMode = (modeId: string) => {
    if (confirm("确定要删除这个自定义模式吗？")) {
      configManager.removeCustomGameMode(modeId)
      setConfig(configManager.getConfig())
    }
  }

  const handlePageNavigation = (action: "prev" | "next" | "goto") => {
    if (!storyEngine) return

    let newNode: StoryNode | null = null

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
  }

  const handleLoadGame = async (gameId: string) => {
    if (!storyEngine) return

    console.log("handleLoadGame: Attempting to load game", gameId)
    const success = await storyEngine.loadGame(gameId)
    if (success) {
      const node = storyEngine.getCurrentNode()
      console.log("handleLoadGame: Game loaded successfully. New current node:", node)
      setCurrentNode(node)
      setShowGameSelectionDialog(false) // Close game selection dialog
      setShowGameModeSelect(false) // Ensure game mode select is hidden
      setGameRecords(storyEngine.getAllGameRecords())
    } else {
      alert("加载游戏失败")
      console.error("handleLoadGame: Failed to load game", gameId)
    }
  }

  const handleDeleteGame = async (gameId: string) => {
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
  }

  const handleBackToHome = () => {
    setCurrentNode(null)
    setShowGameModeSelect(true)
    setShowGameSelectionDialog(false) // Ensure game selection dialog is closed
  }

  const handleSaveProgressToCloud = async () => {
    console.log("Attempting to save progress to cloud...")
    console.log("systemInfo.hasDatabase:", systemInfo.hasDatabase) // This is the React state
    console.log("configManager.getSystemInfo().hasDatabase:", configManager.getSystemInfo().hasDatabase) // This is the direct value from configManager
    console.log("user:", user)
    console.log("storyEngine?.getCurrentGameRecord()?.id:", storyEngine?.getCurrentGameRecord()?.id)

    if (!storyEngine || !configManager.getSystemInfo().hasDatabase || !user || !storyEngine.getCurrentGameRecord()) {
      console.error("Cannot save to cloud: Database not enabled, user not logged in, or no current game.")
      alert("保存进度到云端失败：请确保已登录并有正在进行的游戏。")
      return
    }
    setIsGenerating(true) // Use isGenerating to show a saving indicator
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
  }

  const exportSave = () => {
    if (!storyEngine) return

    const saveData = storyEngine.exportSave()
    const blob = new Blob([saveData], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `game-save-${Date.now()}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  const importSave = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !storyEngine) return

    const reader = new FileReader()
    reader.onload = async (e) => {
      const content = e.target?.result as string
      if (storyEngine.importSave(content)) {
        setCurrentNode(storyEngine.getCurrentNode())
        setGameRecords(storyEngine.getAllGameRecords()) // Refresh records after import
        setShowGameSelectionDialog(false) // Close dialog after import
        setShowGameModeSelect(false) // Hide game mode select if a game is imported
        alert("存档导入成功！")
      } else {
        alert("存档导入失败！")
      }
    }
    reader.readAsText(file)
  }

  const getAllGameModes = () => {
    const allModes = { ...DEFAULT_GAME_MODES }
    Object.entries(config.customGameModes).forEach(([id, mode]) => {
      allModes[id] = {
        name: mode.name,
        desc: mode.description,
        icon: "🎭",
      }
    })
    return allModes
  }

  // Determine main content to display based on state
  let mainContent

  if (isLoading) {
    mainContent = (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg">正在初始化游戏...</p>
        </div>
      </div>
    )
  } else if (!user) {
    mainContent = (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="flex items-center justify-center gap-2">
              <GamepadIcon className="h-6 w-6" />
              AI剧情游戏
            </CardTitle>
            <CardDescription>体验AI驱动的互动故事</CardDescription>
            <div className="flex justify-center">
              <Badge variant={systemInfo.hasDatabase ? "default" : "secondary"}>
                {systemInfo.hasDatabase ? "完整版" : "单机版"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
              <Button onClick={() => setShowLogin(true)} className="w-full">
                登录
              </Button>
              {systemInfo.hasDatabase && (
                <Button onClick={() => setShowRegister(true)} variant="outline" className="w-full">
                  注册
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  } else if (showGameModeSelect) {
    const allGameModes = getAllGameModes()
    mainContent = (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4">
        <div className="max-w-4xl mx-auto">
          <Card className="mb-6">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">选择游戏模式</CardTitle>
              <CardDescription>选择你想要体验的故事类型</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap justify-between items-center mb-6 gap-2">
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={() => setShowCustomModeDialog(true)} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    自定义模式
                  </Button>
                  <Button variant="outline" onClick={() => setShowGameSelectionDialog(true)} size="sm">
                    <History className="h-4 w-4 mr-2" />
                    游戏记录
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setShowSettings(true)} size="sm">
                    <Settings className="h-4 w-4 mr-2" />
                    设置
                  </Button>
                  {user.role === "admin" && (
                    <Button variant="outline" onClick={() => window.open("/admin", "_blank")} size="sm">
                      <Shield className="h-4 w-4 mr-2" />
                      管理
                    </Button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(allGameModes).map(([mode, info]) => (
                  <Card key={mode} className="cursor-pointer hover:shadow-lg transition-shadow relative">
                    <CardContent className="p-4 text-center" onClick={() => handleStartGame(mode)}>
                      <div className="text-4xl mb-2">{info.icon}</div>
                      <h3 className="font-semibold text-lg mb-2">{info.name}</h3>
                      <p className="text-sm text-muted-foreground">{info.desc}</p>
                    </CardContent>
                    {mode.startsWith("custom_") && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute top-2 right-2 h-6 w-6 p-0"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleRemoveCustomMode(mode)
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </Card>
                ))}
              </div>

              {isGenerating && (
                <div className="text-center mt-6">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                  <p className="text-lg">AI正在为你创造独特的故事...</p>
                  {isStreaming && streamingContent && (
                    <div className="mt-4 p-4 bg-white rounded-lg text-left max-w-2xl mx-auto">
                      <div className="text-sm text-muted-foreground mb-2">实时生成预览：</div>
                      <div className="whitespace-pre-wrap">{streamingContent}</div>
                    </div>
                  )}
                </div>
              )}

              {(!config.apiKey || !config.baseUrl) && (
                <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-yellow-500 mt-2 flex-shrink-0"></div>
                    <div>
                      <p className="text-sm font-medium text-yellow-800">AI配置未完成</p>
                      <p className="text-xs text-yellow-700 mt-1">
                        请先在设置中配置API密钥和基本地址，否则无法开始游戏
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  } else {
    // Default: Game playing or no game selected but already logged in
    mainContent = (
      <>
        <header className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-2">
              <div className="flex items-center gap-2 sm:gap-3">
                <GamepadIcon className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
                <h1 className="text-base sm:text-lg md:text-xl font-bold">AI剧情游戏</h1>
                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
                  <Badge variant={systemInfo.hasDatabase ? "default" : "secondary"} className="text-xs">
                    {systemInfo.hasDatabase ? "完整版" : "单机版"}
                  </Badge>
                </div>
              </div>

              <div className="flex items-center flex-wrap gap-1 sm:gap-2 justify-end">
                <div className="hidden md:flex items-center gap-2">
                  {user && user.role === "admin" && <Shield className="h-4 w-4 text-amber-500" />}
                  {user && <span className="text-sm font-medium">{user.username}</span>}
                </div>

                <Button variant="outline" size="sm" onClick={handleBackToHome}>
                  <Home className="h-4 w-4" />
                  <span className="hidden sm:inline ml-1">首页</span>
                </Button>

                <Button variant="outline" size="sm" onClick={() => setShowGameSelectionDialog(true)}>
                  <History className="h-4 w-4" />
                  <span className="hidden sm:inline ml-1">游戏记录</span>
                </Button>

                <Button variant="outline" size="sm" onClick={() => setShowSettings(true)}>
                  <Settings className="h-4 w-4" />
                  <span className="hidden sm:inline ml-1">设置</span>
                </Button>

                {user && user.role === "admin" && (
                  <Button variant="outline" size="sm" onClick={() => window.open("/admin", "_blank")}>
                    <Shield className="h-4 w-4" />
                    <span className="hidden sm:inline ml-1">管理</span>
                  </Button>
                )}

                {systemInfo.hasDatabase && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSaveProgressToCloud}
                    disabled={isGenerating || !storyEngine?.getCurrentGameRecord()} // Disabled if no game or generating
                  >
                    {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Cloud className="h-4 w-4" />}
                    <span className="hidden sm:inline ml-1">保存进度</span>
                  </Button>
                )}

                <Button variant="outline" size="sm" onClick={exportSave}>
                  <Download className="h-4 w-4" />
                  <span className="hidden sm:inline ml-1">导出</span>
                </Button>

                <Button variant="outline" size="sm" asChild>
                  <label>
                    <Upload className="h-4 w-4" />
                    <span className="hidden sm:inline ml-1">导入</span>
                    <input type="file" accept=".json" onChange={importSave} className="hidden" />
                  </label>
                </Button>

                <Button variant="outline" size="sm" onClick={handleResetGame}>
                  <Play className="h-4 w-4" />
                  <span className="hidden sm:inline ml-1">重开</span>
                </Button>

                <Button variant="outline" size="sm" onClick={handleLogout}>
                  <span className="text-xs sm:text-sm">退出</span>
                </Button>
              </div>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto px-4 py-8">
          {currentNode ? (
            <div className="space-y-6">
              {storyEngine && storyEngine.getTotalPages() > 1 && (
                <Card>
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageNavigation("prev")}
                          disabled={!storyEngine.canGoToPreviousPage()}
                        >
                          <ChevronLeft className="h-4 w-4" />
                          <span className="hidden sm:inline">上一页</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePageNavigation("next")}
                          disabled={!storyEngine.canGoToNextPage()}
                        >
                          <span className="hidden sm:inline">下一页</span>
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </div>

                      <div className="flex flex-col sm:flex-row items-center gap-2">
                        <span className="text-sm text-muted-foreground whitespace-nowrap">
                          第 {storyEngine.getCurrentPage()} / {storyEngine.getTotalPages()} 页
                        </span>
                        <div className="flex items-center gap-1">
                          <Input
                            type="number"
                            placeholder="页码"
                            value={pageInput}
                            onChange={(e) => setPageInput(e.target.value)}
                            className="w-16 h-8"
                            min={1}
                            max={storyEngine.getTotalPages()}
                          />
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePageNavigation("goto")}
                            disabled={!pageInput}
                          >
                            跳转
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="text-xl sm:text-2xl">{currentNode.title}</CardTitle>
                  {storyEngine?.getGameState()?.variables?.location && (
                    <Badge variant="outline">📍 {storyEngine.getGameState()?.variables.location}</Badge>
                  )}
                  {currentNode.selectedChoice && (
                    <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
                      <p className="text-sm text-blue-700">
                        <strong>之前的选择:</strong> {currentNode.selectedChoice}
                      </p>
                    </div>
                  )}
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="prose max-w-none" ref={contentRef}>
                    <p className="text-base sm:text-lg leading-relaxed whitespace-pre-wrap">{currentNode.content}</p>

                    {isStreaming && streamingContent && (
                      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="text-sm text-blue-700 mb-2">AI正在生成...</div>
                        <div className="whitespace-pre-wrap text-blue-800">{streamingContent}</div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-3">
                    <h3 className="font-semibold text-lg">你的选择：</h3>
                    <div className="grid gap-3">
                      {currentNode.choices.map((choice) => {
                        const isSelected = currentNode.selectedChoice === choice.text
                        return (
                          <Button
                            key={choice.id}
                            variant={isSelected ? "default" : "outline"}
                            className={`justify-start h-auto p-4 text-left whitespace-normal ${
                              isSelected ? "bg-primary text-primary-foreground border-primary" : "bg-transparent"
                            }`}
                            onClick={() => handleChoice(choice.id)}
                            disabled={isGenerating}
                          >
                            <div className="w-full">
                              <div className="font-medium text-wrap">
                                {isSelected && "✓ "}
                                {choice.text}
                              </div>
                              {choice.consequence && (
                                <div className="text-sm text-muted-foreground mt-1 text-wrap">
                                  💭 {choice.consequence}
                                </div>
                              )}
                            </div>
                          </Button>
                        )
                      })}
                    </div>

                    <div className="mt-4 p-4 border rounded-lg bg-gray-50">
                      <Label htmlFor="custom-choice" className="text-sm font-medium">
                        自定义选择：
                      </Label>
                      <div className="flex gap-2 mt-2">
                        <Input
                          id="custom-choice"
                          value={customChoice}
                          onChange={(e) => setCustomChoice(e.target.value)}
                          placeholder="输入你的自定义选择..."
                          disabled={isGenerating}
                          onKeyPress={(e) => {
                            if (e.key === "Enter" && !isGenerating && customChoice.trim()) {
                              handleCustomChoice()
                            }
                          }}
                        />
                        <Button onClick={handleCustomChoice} disabled={isGenerating || !customChoice.trim()} size="sm">
                          <Send className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {isGenerating && (
                      <div className="text-center py-4">
                        <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">AI正在生成下一段故事...</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-lg text-muted-foreground">
                  {isGenerating ? "AI正在为你创造独特的故事..." : "请选择一个游戏模式或加载历史记录开始游戏。"}
                </p>
                {isGenerating && (
                  <div className="mt-4">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                    {isStreaming && streamingContent && (
                      <div className="mt-4 p-4 bg-white rounded-lg text-left max-w-2xl mx-auto">
                        <div className="text-sm text-muted-foreground mb-2">实时生成预览：</div>
                        <div className="whitespace-pre-wrap">{streamingContent}</div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {storyEngine && storyEngine.getCurrentGameRecord() && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">游戏状态</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                  <div>
                    <Label>游戏模式</Label>
                    <p className="text-muted-foreground">
                      {getAllGameModes()[storyEngine.getGameState()?.gameMode || ""]?.name || "未知"}
                    </p>
                  </div>
                  <div>
                    <Label>故事进度</Label>
                    <p className="text-muted-foreground">{storyEngine.getTotalPages()} 页</p>
                  </div>
                  <div>
                    <Label>背包物品</Label>
                    <p className="text-muted-foreground">{storyEngine.getGameState()?.inventory?.length || 0} 个</p>
                  </div>
                </div>

                {storyEngine.getGameState()?.inventory?.length > 0 && (
                  <div className="mt-4">
                    <Label>物品清单</Label>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {storyEngine.getGameState()?.inventory.map((item: string, index: number) => (
                        <Badge key={index} variant="secondary">
                          {item}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </main>
      </>
    )
  }

  return (
    <>
      {mainContent}

      {/* Login Dialog (Always mounted) */}
      <Dialog open={showLogin} onOpenChange={setShowLogin}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>用户登录</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="username">用户名</Label>
              <Input
                id="username"
                type="text"
                value={loginForm.username}
                onChange={(e) => setLoginForm((prev) => ({ ...prev, username: e.target.value }))}
                placeholder="请输入用户名"
                required
              />
            </div>
            <div>
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                type="password"
                value={loginForm.password}
                onChange={(e) => setLoginForm((prev) => ({ ...prev, password: e.target.value }))}
                placeholder="请输入密码"
                required
              />
            </div>
            <Button type="submit" className="w-full">
              登录
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Register Dialog (Always mounted) */}
      <Dialog open={showRegister} onOpenChange={setShowRegister}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>用户注册</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <Label htmlFor="reg-username">用户名</Label>
              <Input
                id="reg-username"
                type="text"
                value={registerForm.username}
                onChange={(e) => setRegisterForm((prev) => ({ ...prev, username: e.target.value }))}
                placeholder="请输入用户名"
                required
              />
            </div>
            <div>
              <Label htmlFor="reg-password">密码</Label>
              <Input
                id="reg-password"
                type="password"
                value={registerForm.password}
                onChange={(e) => setRegisterForm((prev) => ({ ...prev, password: e.target.value }))}
                placeholder="请输入密码"
                required
              />
            </div>
            <div>
              <Label htmlFor="reg-confirm">确认密码</Label>
              <Input
                id="reg-confirm"
                type="password"
                value={registerForm.confirmPassword}
                onChange={(e) => setRegisterForm((prev) => ({ ...prev, confirmPassword: e.target.value }))}
                placeholder="请再次输入密码"
                required
              />
            </div>
            <Button type="submit" className="w-full">
              注册
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Custom Mode Dialog (Always mounted) */}
      <Dialog open={showCustomModeDialog} onOpenChange={setShowCustomModeDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>创建自定义游戏模式</DialogTitle>
            <DialogDescription>定义你自己的游戏类型和AI提示词</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="custom-name">模式名称</Label>
              <Input
                id="custom-name"
                value={customModeForm.name}
                onChange={(e) => setCustomModeForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="例如：末日生存"
              />
            </div>
            <div>
              <Label htmlFor="custom-desc">模式描述</Label>
              <Input
                id="custom-desc"
                value={customModeForm.description}
                onChange={(e) => setCustomModeForm((prev) => ({ ...prev, description: e.target.value }))}
                placeholder="例如：在末日世界中生存，寻找希望"
              />
            </div>
            <div>
              <Label htmlFor="custom-prompt">AI提示词</Label>
              <Textarea
                id="custom-prompt"
                value={customModeForm.prompt}
                onChange={(e) => setCustomModeForm((prev) => ({ ...prev, prompt: e.target.value }))}
                placeholder="例如：末日生存类游戏，世界已经被病毒感染，玩家需要在危险的环境中寻找食物、武器和安全的避难所..."
                rows={4}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowCustomModeDialog(false)}>
              取消
            </Button>
            <Button onClick={handleAddCustomMode}>创建模式</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Consolidated Game Records Dialog (Always mounted) */}
      <Dialog open={showGameSelectionDialog} onOpenChange={setShowGameSelectionDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>游戏记录</DialogTitle>
            <DialogDescription>查看和管理你的游戏历史</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {gameRecords.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">暂无游戏记录</p>
            ) : (
              gameRecords.map((record) => (
                <Card key={record.id} className="cursor-pointer hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1" onClick={() => handleLoadGame(record.id)}>
                        <h3 className="font-semibold text-lg mb-1">{record.name}</h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          {getAllGameModes()[record.gameMode]?.name || record.gameMode}
                        </p>
                        <div className="flex gap-4 text-xs text-muted-foreground">
                          <span>创建: {new Date(record.createdAt).toLocaleString()}</span>
                          <span>更新: {new Date(record.updatedAt).toLocaleString()}</span>
                          <span>进度: {record.totalPages} 页</span>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteGame(record.id)
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
          {/* Only show "Start New Game" button if no game is currently loaded */}
          {!currentNode && (
            <div className="flex justify-end gap-2 mt-4">
              <Button
                onClick={() => {
                  setShowGameSelectionDialog(false)
                  setShowGameModeSelect(true)
                }}
              >
                开始新游戏
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Settings Dialog (Always mounted) */}
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
    </>
  )
}
