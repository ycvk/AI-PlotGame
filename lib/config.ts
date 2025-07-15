export interface AIModel {
  id: string
  name: string
}

export interface CustomGameMode {
  name: string
  description: string
  prompt: string
}

export interface GameConfig {
  aiProvider: "openai" | "anthropic" | "groq" | "custom"
  baseUrl: string
  apiKey: string
  model: string
  modelsPath: string
  chatPath: string
  streamEnabled: boolean
  gameMode: string
  maxChoices: number
  storyLength: "short" | "medium" | "long"
  theme: "light" | "dark" | "system"
  language: "zh" | "en"
  customGameModes: Record<string, CustomGameMode>
}

export interface SystemInfo {
  hasDatabase: boolean
  version: string
}

export class ConfigManager {
  private static instance: ConfigManager
  private config: GameConfig
  private systemInfo: SystemInfo
  private availableModels: AIModel[] = []

  private constructor() {
    this.config = {
      aiProvider: "openai",
      baseUrl: "https://api.openai.com",
      apiKey: "",
      model: "gpt-3.5-turbo",
      modelsPath: "/v1/models",
      chatPath: "/v1/chat/completions",
      streamEnabled: true,
      gameMode: "adventure",
      maxChoices: 4,
      storyLength: "medium",
      theme: "system",
      language: "zh",
      customGameModes: {},
    }

    this.systemInfo = {
      hasDatabase: !!process.env.MYSQL_URL,
      version: "1.0.0",
    }
  }

  static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager()
    }
    return ConfigManager.instance
  }

  async loadConfig(): Promise<void> {
    try {
      // 检查系统信息
      const systemResponse = await fetch("/api/system-info")
      if (systemResponse.ok) {
        const systemData = await systemResponse.json()
        this.systemInfo = systemData
      }

      if (this.systemInfo.hasDatabase) {
        // 从服务器加载用户配置
        const token = localStorage.getItem("auth-token")
        if (token) {
          const response = await fetch("/api/user-config", {
            headers: { Authorization: `Bearer ${token}` },
          })
          if (response.ok) {
            const serverConfig = await response.json()
            this.config = { ...this.config, ...serverConfig }

            // 解析自定义游戏模式
            if (serverConfig.customGameModes) {
              try {
                this.config.customGameModes = JSON.parse(serverConfig.customGameModes)
              } catch (e) {
                this.config.customGameModes = {}
              }
            }
          }
        }
      } else {
        // 从本地存储加载
        const saved = localStorage.getItem("game-config")
        if (saved) {
          try {
            const savedConfig = JSON.parse(saved)
            this.config = { ...this.config, ...savedConfig }
          } catch (error) {
            console.warn("Failed to parse saved config")
          }
        }
      }
    } catch (error) {
      console.warn("Failed to load config from server, using local storage")
    }
  }

  async saveConfig(config: GameConfig): Promise<void> {
    this.config = { ...config }

    if (this.systemInfo.hasDatabase) {
      // 保存到服务器
      const token = localStorage.getItem("auth-token")
      if (token) {
        try {
          const configToSave = {
            ...config,
            customGameModes: JSON.stringify(config.customGameModes),
          }

          const response = await fetch("/api/user-config", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(configToSave),
          })

          if (!response.ok) {
            throw new Error("Failed to save config to server")
          }
        } catch (error) {
          console.error("Failed to save config to server:", error)
          throw error
        }
      }
    } else {
      // 保存到本地存储
      localStorage.setItem("game-config", JSON.stringify(config))
    }
  }

  getConfig(): GameConfig {
    return { ...this.config }
  }

  getSystemInfo(): SystemInfo {
    return { ...this.systemInfo }
  }

  async fetchAvailableModels(config: GameConfig): Promise<{ success: boolean; models: AIModel[]; error?: string }> {
    try {
      const response = await fetch(`${config.baseUrl}${config.modelsPath}`, {
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          "Content-Type": "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      const models: AIModel[] =
        data.data?.map((model: any) => ({
          id: model.id,
          name: model.id,
        })) || []

      this.availableModels = models
      return { success: true, models }
    } catch (error) {
      return {
        success: false,
        models: [],
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  getAvailableModels(): AIModel[] {
    return [...this.availableModels]
  }

  clearAvailableModels(): void {
    this.availableModels = []
  }

  addCustomGameMode(id: string, mode: CustomGameMode): void {
    this.config.customGameModes[id] = mode
  }

  removeCustomGameMode(id: string): void {
    delete this.config.customGameModes[id]
  }
}
