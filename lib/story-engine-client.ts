import { AIStoryGenerator, type StoryContext } from "./ai-story-generator"
import { ConfigManager } from "./config"
import { ContextManager, createContextManager } from "./context-manager"

export interface StoryChoice {
  id: string
  text: string
  nextNode?: string
  consequence?: string
}

export interface StoryNode {
  id: string
  title: string
  content: string
  choices: StoryChoice[]
  effects?: Record<string, any>
  isGenerated?: boolean
  timestamp: number
  selectedChoice?: string
}

export interface GameRecord {
  id: string
  name: string
  gameMode: string
  createdAt: number
  updatedAt: number
  currentNode: string
  currentPage: number
  variables: Record<string, any>
  inventory: string[]
  history: string[]
  storyHistory: string[]
  nodes: Array<[string, StoryNode]> // Stores the actual story nodes for this game
  totalPages: number
}

export interface GameState {
  currentGameId: string | null // ID of the currently active game
  gameRecords: Record<string, GameRecord> // All game records by their ID
}

export interface GameSave {
  name: string
  timestamp: number
  currentNode: string
  currentPage: number
  variables: Record<string, any>
  inventory: string[]
  history: string[]
  storyHistory: string[]
  gameMode: string
  nodes: Array<[string, StoryNode]>
}

export class ClientStoryEngine {
  private nodes: Map<string, StoryNode> = new Map() // Nodes for the *currently loaded* game
  private nodeOrder: string[] = [] // Order of nodes for the *currently loaded* game
  private gameState: GameState // Holds all game records and the current game ID
  private currentGameId: string | null = null // The ID of the currently active game
  private hasDatabase: boolean
  private userId?: number
  private aiGenerator: AIStoryGenerator
  private contextManager: ContextManager // 新增：上下文管理器
  private isGenerating = false

  constructor(hasDatabase: boolean, userId?: number) {
    this.hasDatabase = hasDatabase
    this.userId = userId

    const config = ConfigManager.getInstance().getConfig()
    this.aiGenerator = new AIStoryGenerator(config)

    // 初始化上下文管理器
    this.contextManager = createContextManager({
      maxHistoryItems: 20,
      maxChoiceHistory: 50,
      enableCompression: true,
      compressionThreshold: 1000
    })

    this.gameState = {
      currentGameId: null,
      gameRecords: {},
    }
  }

  // Update AI generator config
  updateAIConfig(): void {
    const config = ConfigManager.getInstance().getConfig()
    this.aiGenerator.updateConfig(config)
  }

  // Initializes a new game and sets it as the current game
  async initializeGame(gameMode: string, onStream?: (content: string) => void): Promise<StoryNode | null> {
    this.isGenerating = true
    this.updateAIConfig()

    try {
      const gameId = `game_${Date.now()}`
      const gameName = `${this.getGameModeName(gameMode)} - ${new Date().toLocaleString()}`

      const newGameRecord: GameRecord = {
        id: gameId,
        name: gameName,
        gameMode: gameMode,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        currentNode: "start",
        currentPage: 0,
        variables: {},
        inventory: [],
        history: [],
        storyHistory: [],
        nodes: [],
        totalPages: 0,
      }

      this.gameState.gameRecords[gameId] = newGameRecord
      this.currentGameId = gameId
      this.gameState.currentGameId = gameId

      this.nodes.clear()
      this.nodeOrder = []

      const initialStory = await this.aiGenerator.generateInitialStory(gameMode, onStream)
      if (initialStory) {
        const startNode: StoryNode = {
          id: "start",
          title: initialStory.title,
          content: initialStory.content,
          choices: initialStory.choices.map((choice) => ({
            id: choice.id,
            text: choice.text,
            consequence: choice.consequence,
          })),
          effects: initialStory.effects,
          isGenerated: true,
          timestamp: Date.now(),
        }

        this.nodes.set("start", startNode)
        this.nodeOrder = ["start"]

        newGameRecord.currentNode = "start"
        newGameRecord.currentPage = 0
        newGameRecord.nodes = Array.from(this.nodes.entries())
        newGameRecord.totalPages = 1

        if (startNode.effects) {
          this.applyEffects(startNode.effects, newGameRecord)
        }

        await this._saveGameStateToLocalStorage() // Auto-save to local storage
        await this.saveCurrentGameToCloud() // Save to cloud if database is enabled
        return startNode
      }
    } catch (error) {
      console.error("Failed to initialize game:", error)
    } finally {
      this.isGenerating = false
    }
    return null
  }

  // Loads all game records and the last active game
  async loadGameState(): Promise<void> {
    if (this.hasDatabase && this.userId) {
      try {
        const token = localStorage.getItem("auth-token")
        const response = await fetch(`/api/saves?userId=${this.userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (response.ok) {
          const saves = await response.json()

          this.gameState.gameRecords = {}
          let lastActiveGameId: string | null = null

          saves.forEach((save: any) => {
            try {
              const saveData = JSON.parse(save.save_data) as GameSave
              if (save.save_name === "current_active_game_id") {
                lastActiveGameId = saveData.currentNode // Reusing currentNode field for gameId
              } else {
                const gameRecord: GameRecord = {
                  id: save.save_name, // save_name is the gameId
                  name: saveData.name || save.save_name,
                  gameMode: saveData.gameMode,
                  createdAt: saveData.timestamp,
                  updatedAt: save.updated_at ? new Date(save.updated_at).getTime() : saveData.timestamp,
                  currentNode: saveData.currentNode,
                  currentPage: saveData.currentPage || 0,
                  variables: saveData.variables,
                  inventory: saveData.inventory,
                  history: saveData.history,
                  storyHistory: saveData.storyHistory,
                  nodes: saveData.nodes || [],
                  totalPages: saveData.nodes?.length || 0,
                }
                this.gameState.gameRecords[save.save_name] = gameRecord
              }
            } catch (error) {
              console.warn("Failed to parse save data:", error)
            }
          })

          // Set the last active game if found and exists in records
          if (lastActiveGameId && this.gameState.gameRecords[lastActiveGameId]) {
            this.currentGameId = lastActiveGameId
            this.gameState.currentGameId = lastActiveGameId
            // Load the nodes for the current game
            const currentRecord = this.gameState.gameRecords[lastActiveGameId]
            this.nodes.clear()
            this.nodeOrder = []
            if (currentRecord.nodes) {
              currentRecord.nodes.forEach(([id, node]) => {
                this.nodes.set(id, node)
                this.nodeOrder.push(id)
              })
            }
          } else if (Object.keys(this.gameState.gameRecords).length > 0) {
            // If no specific current game, but records exist, pick the most recent one as current
            const sortedRecords = Object.values(this.gameState.gameRecords).sort((a, b) => b.updatedAt - a.updatedAt)
            if (sortedRecords.length > 0) {
              this.currentGameId = sortedRecords[0].id
              this.gameState.currentGameId = sortedRecords[0].id
              const currentRecord = this.gameState.gameRecords[this.currentGameId]
              this.nodes.clear()
              this.nodeOrder = []
              if (currentRecord.nodes) {
                currentRecord.nodes.forEach(([id, node]) => {
                  this.nodes.set(id, node)
                  this.nodeOrder.push(id)
                })
              }
            }
          }

          this.updateAIConfig()
        }
      } catch (error) {
        console.warn("Failed to load game state from database:", error)
      }
    } else {
      // Local storage loading (for single-player or no-database mode)
      const saved = localStorage.getItem("game-state")
      if (saved) {
        try {
          const gameState = JSON.parse(saved) as GameState
          this.gameState = gameState

          // If there's a current game, load its nodes
          if (gameState.currentGameId && gameState.gameRecords[gameState.currentGameId]) {
            const currentRecord = gameState.gameRecords[gameState.currentGameId]
            this.nodes.clear()
            this.nodeOrder = []
            if (currentRecord.nodes) {
              currentRecord.nodes.forEach(([id, node]) => {
                this.nodes.set(id, node)
                this.nodeOrder.push(id)
              })
            }
          }
          this.updateAIConfig()
        } catch (error) {
          console.warn("Failed to parse saved game state from local storage:", error)
        }
      }
    }
  }

  // Saves the entire gameState object to local storage
  private async _saveGameStateToLocalStorage(): Promise<void> {
    localStorage.setItem("game-state", JSON.stringify(this.gameState))
  }

  // Saves the current game record to the cloud (database)
  async saveCurrentGameToCloud(): Promise<boolean> {
    console.log("saveCurrentGameToCloud called.")
    console.log("  this.hasDatabase:", this.hasDatabase)
    console.log("  this.userId:", this.userId)
    console.log("  this.currentGameId:", this.currentGameId)

    if (!this.hasDatabase || !this.userId || !this.currentGameId) {
      console.warn("Cannot save to cloud: Database not enabled, user not logged in, or no current game.")
      return false
    }

    try {
      const token = localStorage.getItem("auth-token")
      const currentGameRecord = this.gameState.gameRecords[this.currentGameId]

      if (!currentGameRecord) {
        console.error("No current game record found to save to cloud.")
        return false
      }

      // Update the record's nodes and totalPages before saving
      currentGameRecord.nodes = Array.from(this.nodes.entries())
      currentGameRecord.totalPages = this.nodeOrder.length
      currentGameRecord.updatedAt = Date.now()

      const saveData: GameSave = {
        name: currentGameRecord.name,
        timestamp: currentGameRecord.createdAt,
        currentNode: currentGameRecord.currentNode,
        currentPage: currentGameRecord.currentPage,
        variables: currentGameRecord.variables,
        inventory: currentGameRecord.inventory,
        history: currentGameRecord.history,
        storyHistory: currentGameRecord.storyHistory,
        gameMode: currentGameRecord.gameMode,
        nodes: currentGameRecord.nodes, // This is the full story history
      }

      // Save the actual game record
      await fetch("/api/saves", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: this.userId,
          saveName: currentGameRecord.id, // Use gameId as save_name
          saveData: saveData,
        }),
      })

      // Also save the current active game ID
      await fetch("/api/saves", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId: this.userId,
          saveName: "current_active_game_id", // Special save name for current game pointer
          saveData: { currentNode: this.currentGameId }, // Store the ID here
        }),
      })

      console.log(`Game '${currentGameRecord.name}' saved to cloud successfully.`)
      return true
    } catch (error) {
      console.error("Failed to save game state to database:", error)
      return false
    }
  }

  getCurrentNode(): StoryNode | null {
    if (!this.currentGameId) return null
    const gameRecord = this.gameState.gameRecords[this.currentGameId]
    if (!gameRecord) return null

    return this.nodes.get(gameRecord.currentNode) || null
  }

  getGameState(): GameRecord | null {
    if (!this.currentGameId) return null
    return this.gameState.gameRecords[this.currentGameId] || null
  }

  isGeneratingStory(): boolean {
    return this.isGenerating
  }

  getTotalPages(): number {
    return this.nodeOrder.length
  }

  getCurrentPage(): number {
    if (!this.currentGameId) return 1
    const gameRecord = this.gameState.gameRecords[this.currentGameId]
    return (gameRecord?.currentPage || 0) + 1
  }

  canGoToPreviousPage(): boolean {
    if (!this.currentGameId) return false
    const gameRecord = this.gameState.gameRecords[this.currentGameId]
    return (gameRecord?.currentPage || 0) > 0
  }

  canGoToNextPage(): boolean {
    if (!this.currentGameId) return false
    const gameRecord = this.gameState.gameRecords[this.currentGameId]
    return (gameRecord?.currentPage || 0) < this.nodeOrder.length - 1
  }

  goToPreviousPage(): StoryNode | null {
    if (!this.canGoToPreviousPage() || !this.currentGameId) return null

    const gameRecord = this.gameState.gameRecords[this.currentGameId]
    gameRecord.currentPage--
    gameRecord.currentNode = this.nodeOrder[gameRecord.currentPage]
    this.updateCurrentGameRecord()
    this._saveGameStateToLocalStorage() // Auto-save to local storage
    return this.getCurrentNode()
  }

  goToNextPage(): StoryNode | null {
    if (!this.canGoToNextPage() || !this.currentGameId) return null

    const gameRecord = this.gameState.gameRecords[this.currentGameId]
    gameRecord.currentPage++
    gameRecord.currentNode = this.nodeOrder[gameRecord.currentPage]
    this.updateCurrentGameRecord()
    this._saveGameStateToLocalStorage() // Auto-save to local storage
    return this.getCurrentNode()
  }

  goToPage(pageNumber: number): StoryNode | null {
    if (!this.currentGameId) return null

    const pageIndex = pageNumber - 1
    if (pageIndex >= 0 && pageIndex < this.nodeOrder.length) {
      const gameRecord = this.gameState.gameRecords[this.currentGameId]
      gameRecord.currentPage = pageIndex
      gameRecord.currentNode = this.nodeOrder[pageIndex]
      this.updateCurrentGameRecord()
      this._saveGameStateToLocalStorage() // Auto-save to local storage
      return this.getCurrentNode()
    }
    return null
  }

  async makeChoice(
    choiceId: string,
    customChoice?: string,
    onStream?: (content: string) => void,
  ): Promise<StoryNode | null> {
    if (this.isGenerating || !this.currentGameId) return null

    const gameRecord = this.gameState.gameRecords[this.currentGameId]
    if (!gameRecord) return null

    const currentNode = this.nodes.get(gameRecord.currentNode)
    if (!currentNode) return null

    let choice: StoryChoice | undefined
    let choiceText: string

    if (customChoice) {
      choiceText = customChoice
      choice = {
        id: `custom_${Date.now()}`,
        text: customChoice,
      }
    } else {
      choice = currentNode.choices.find((c) => c.id === choiceId)
      if (!choice) return null
      choiceText = choice.text
    }

    this.isGenerating = true
    this.updateAIConfig()

    try {
      gameRecord.history.push(currentNode.id)
      gameRecord.storyHistory.push(`${currentNode.title}: ${choiceText}`)

      // 使用新的上下文管理器构建完整上下文
      const context = this.contextManager.buildStoryContext(gameRecord, choiceText)

      const generatedStory = await this.aiGenerator.generateStoryNode(context, onStream)

      if (generatedStory) {
        const nextNodeId = `node_${Date.now()}`
        const nextNode: StoryNode = {
          id: nextNodeId,
          title: generatedStory.title,
          content: generatedStory.content,
          choices: generatedStory.choices.map((c) => ({
            id: c.id,
            text: c.text,
            consequence: c.consequence,
          })),
          effects: generatedStory.effects,
          isGenerated: true,
          timestamp: Date.now(),
          selectedChoice: choiceText,
        }

        const updatedCurrentNode = { ...currentNode, selectedChoice: choiceText }
        this.nodes.set(currentNode.id, updatedCurrentNode)

        this.nodes.set(nextNodeId, nextNode)
        this.nodeOrder.push(nextNodeId)
        gameRecord.currentPage = this.nodeOrder.length - 1
        gameRecord.currentNode = nextNodeId

        if (nextNode.effects) {
          this.applyEffects(nextNode.effects, gameRecord)
        }

        this.updateCurrentGameRecord()
        await this._saveGameStateToLocalStorage() // Auto-save to local storage
        return nextNode
      }
    } catch (error) {
      console.error("Failed to generate next story node:", error)
    } finally {
      this.isGenerating = false
    }
    return null
  }

  private applyEffects(effects: Record<string, any>, gameRecord: GameRecord): void {
    for (const [key, value] of Object.entries(effects)) {
      if (key.startsWith("var_") || key === "set_variable") {
        if (key === "set_variable" && typeof value === "object") {
          Object.assign(gameRecord.variables, value)
        } else if (key.startsWith("var_")) {
          const varName = key.substring(4)
          gameRecord.variables[varName] = value
        }
      } else if (key === "add_item" && value) {
        if (Array.isArray(value)) {
          gameRecord.inventory.push(...value)
        } else {
          gameRecord.inventory.push(value)
        }
      } else if (key === "remove_item" && value) {
        const items = Array.isArray(value) ? value : [value]
        items.forEach((item) => {
          const index = gameRecord.inventory.indexOf(item)
          if (index > -1) {
            gameRecord.inventory.splice(index, 1)
          }
        })
      } else if (key === "mood") {
        gameRecord.variables.mood = value
      } else if (key === "location") {
        gameRecord.variables.location = value
      }
    }
  }

  async resetGame(): Promise<void> {
    if (!this.currentGameId) return

    const gameRecord = this.gameState.gameRecords[this.currentGameId]
    if (gameRecord) {
      gameRecord.currentNode = "start"
      gameRecord.currentPage = 0
      gameRecord.variables = {}
      gameRecord.inventory = []
      gameRecord.history = []
      gameRecord.storyHistory = []
      gameRecord.nodes = []
      gameRecord.totalPages = 0
      gameRecord.updatedAt = Date.now()
    }

    this.nodes.clear()
    this.nodeOrder = []
    await this._saveGameStateToLocalStorage() // Save reset state to local storage
    await this.saveCurrentGameToCloud() // Sync reset state to cloud
  }

  exportSave(): string {
    if (!this.currentGameId) return "{}"

    const gameRecord = this.gameState.gameRecords[this.currentGameId]
    if (!gameRecord) return "{}"

    const saveData: GameSave = {
      name: gameRecord.name,
      timestamp: Date.now(),
      currentNode: gameRecord.currentNode,
      currentPage: gameRecord.currentPage,
      variables: gameRecord.variables,
      inventory: gameRecord.inventory,
      history: gameRecord.history,
      storyHistory: gameRecord.storyHistory,
      gameMode: gameRecord.gameMode,
      nodes: Array.from(this.nodes.entries()),
    }
    return JSON.stringify(saveData, null, 2)
  }

  importSave(saveData: string): boolean {
    try {
      const imported = JSON.parse(saveData) as GameSave

      // Create a new game record for the imported save
      const gameId = `imported_game_${Date.now()}`
      const newGameRecord: GameRecord = {
        id: gameId,
        name: imported.name || `Imported Game ${new Date().toLocaleString()}`,
        gameMode: imported.gameMode || "adventure",
        createdAt: imported.timestamp || Date.now(),
        updatedAt: Date.now(),
        currentNode: imported.currentNode,
        currentPage: imported.currentPage || 0,
        variables: imported.variables,
        inventory: imported.inventory,
        history: imported.history,
        storyHistory: imported.storyHistory,
        nodes: imported.nodes,
        totalPages: imported.nodes?.length || 0,
      }

      this.gameState.gameRecords[gameId] = newGameRecord
      this.currentGameId = gameId
      this.gameState.currentGameId = gameId

      this.nodes.clear()
      this.nodeOrder = []
      imported.nodes.forEach(([id, node]) => {
        this.nodes.set(id, node)
        this.nodeOrder.push(id)
      })

      this._saveGameStateToLocalStorage() // Save to local storage
      this.saveCurrentGameToCloud() // Save to cloud if enabled
      return true
    } catch (error) {
      console.error("Failed to import save:", error)
      return false
    }
  }

  async createNewGame(gameMode: string, gameName?: string): Promise<string> {
    // This method is now primarily for creating the record, actual game init is in initializeGame
    const gameId = `game_${Date.now()}`
    const name = gameName || `${this.getGameModeName(gameMode)} - ${new Date().toLocaleString()}`

    const gameRecord: GameRecord = {
      id: gameId,
      name,
      gameMode,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      currentNode: "start",
      currentPage: 0,
      variables: {},
      inventory: [],
      history: [],
      storyHistory: [],
      nodes: [],
      totalPages: 0,
    }

    this.gameState.gameRecords[gameId] = gameRecord
    this.gameState.currentGameId = gameId
    this.currentGameId = gameId

    this.nodes.clear()
    this.nodeOrder = []

    await this._saveGameStateToLocalStorage()
    await this.saveCurrentGameToCloud() // Update current game ID in cloud
    return gameId
  }

  async loadGame(gameId: string): Promise<boolean> {
    const gameRecord = this.gameState.gameRecords[gameId]
    if (!gameRecord) return false

    this.currentGameId = gameId
    this.gameState.currentGameId = gameId

    this.nodes.clear()
    this.nodeOrder = []

    if (gameRecord.nodes && gameRecord.nodes.length > 0) {
      gameRecord.nodes.forEach(([id, node]) => {
        this.nodes.set(id, node)
        this.nodeOrder.push(id)
      })
    }

    // Ensure the current node is correctly set based on the loaded record
    const loadedNode = this.nodes.get(gameRecord.currentNode)
    if (!loadedNode && this.nodeOrder.length > 0) {
      // Fallback: if currentNode from record is missing, go to the first node
      gameRecord.currentNode = this.nodeOrder[0]
      gameRecord.currentPage = 0
    } else if (!loadedNode && this.nodeOrder.length === 0) {
      // If no nodes at all, reset to a blank state
      gameRecord.currentNode = "start"
      gameRecord.currentPage = 0
    }

    await this._saveGameStateToLocalStorage() // Save the new current game ID to local storage
    await this.saveCurrentGameToCloud() // Update the 'current_active_game_id' in cloud
    return true
  }

  getCurrentGameRecord(): GameRecord | null {
    if (!this.currentGameId) return null
    return this.gameState.gameRecords[this.currentGameId] || null
  }

  getAllGameRecords(): GameRecord[] {
    // Filter out the special 'current_active_game_id' save if it somehow gets into gameRecords
    return Object.values(this.gameState.gameRecords)
      .filter((record) => record.id !== "current_active_game_id")
      .sort((a, b) => b.updatedAt - a.updatedAt)
  }

  async deleteGame(gameId: string): Promise<boolean> {
    if (this.gameState.gameRecords[gameId]) {
      delete this.gameState.gameRecords[gameId]

      if (this.currentGameId === gameId) {
        this.currentGameId = null
        this.gameState.currentGameId = null
        this.nodes.clear()
        this.nodeOrder = []
      }

      await this._saveGameStateToLocalStorage() // Update local storage after deletion
      if (this.hasDatabase && this.userId) {
        try {
          const token = localStorage.getItem("auth-token")
          await fetch(`/api/user-saves?saveName=${gameId}`, {
            // Use the new endpoint and saveName
            method: "DELETE",
            headers: { Authorization: `Bearer ${token}` },
          })
          // If the deleted game was the current one, also update the current_active_game_id in DB
          if (!this.currentGameId) {
            await fetch("/api/saves", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({
                userId: this.userId,
                saveName: "current_active_game_id",
                saveData: { currentNode: null }, // Set to null if no current game
              }),
            })
          }
          return true
        } catch (error) {
          console.error("Failed to delete game from database:", error)
          return false
        }
      }
      return true
    }
    return false
  }

  private updateCurrentGameRecord(): void {
    if (!this.currentGameId) return

    const gameRecord = this.gameState.gameRecords[this.currentGameId]
    if (gameRecord) {
      gameRecord.updatedAt = Date.now()
      gameRecord.currentNode = this.nodeOrder[gameRecord.currentPage] || "start"
      gameRecord.nodes = Array.from(this.nodes.entries())
      gameRecord.totalPages = this.nodeOrder.length
    }
  }

  private getGameModeName(gameMode: string): string {
    const modes = {
      adventure: "冒险探索",
      mystery: "悬疑推理",
      horror: "恐怖惊悚",
      romance: "浪漫爱情",
      scifi: "科幻未来",
      fantasy: "奇幻魔法",
    }
    return modes[gameMode as keyof typeof modes] || "自定义模式"
  }
}
