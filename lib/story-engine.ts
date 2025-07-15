// This file is not used by the client-side game logic (app/page.tsx)
// It seems to be an older server-side story engine.
// No modifications are needed here as the client uses lib/story-engine-client.ts
export interface StoryChoice {
  id: string
  text: string
  nextNode: string
  conditions?: Record<string, any>
}

export interface StoryNode {
  id: string
  title: string
  content: string
  choices: StoryChoice[]
  conditions?: Record<string, any>
  effects?: Record<string, any>
}

export interface GameState {
  currentNode: string
  variables: Record<string, any>
  inventory: string[]
  history: string[]
  saveSlots: Record<string, GameSave>
}

export interface GameSave {
  name: string
  timestamp: number
  currentNode: string
  variables: Record<string, any>
  inventory: string[]
  history: string[]
}

export class StoryEngine {
  private nodes: Map<string, StoryNode> = new Map()
  private gameState: GameState
  private hasDatabase: boolean
  private userId?: number

  constructor(hasDatabase: boolean, userId?: number) {
    this.hasDatabase = hasDatabase
    this.userId = userId
    this.gameState = {
      currentNode: "start",
      variables: {},
      inventory: [],
      history: [],
      saveSlots: {},
    }

    this.initializeDefaultStory()
  }

  private initializeDefaultStory(): void {
    const defaultNodes: StoryNode[] = [
      {
        id: "start",
        title: "开始",
        content: "欢迎来到AI剧情游戏！你发现自己站在一个神秘的十字路口前。",
        choices: [
          { id: "left", text: "向左走", nextNode: "forest" },
          { id: "right", text: "向右走", nextNode: "village" },
          { id: "straight", text: "直走", nextNode: "mountain" },
        ],
      },
      {
        id: "forest",
        title: "神秘森林",
        content: "你进入了一片茂密的森林，阳光透过树叶洒下斑驳的光影。",
        choices: [
          { id: "explore", text: "深入探索", nextNode: "forest_deep" },
          { id: "return", text: "返回路口", nextNode: "start" },
        ],
      },
      {
        id: "village",
        title: "宁静村庄",
        content: "你来到了一个安静的小村庄，村民们友善地向你打招呼。",
        choices: [
          { id: "talk", text: "与村民交谈", nextNode: "village_talk" },
          { id: "return", text: "返回路口", nextNode: "start" },
        ],
      },
      {
        id: "mountain",
        title: "高山之巅",
        content: "你爬上了一座高山，俯瞰着整个世界的美景。",
        choices: [
          { id: "meditate", text: "冥想思考", nextNode: "mountain_wisdom" },
          { id: "return", text: "下山返回", nextNode: "start" },
        ],
      },
    ]

    defaultNodes.forEach((node) => {
      this.nodes.set(node.id, node)
    })
  }

  async loadStory(): Promise<void> {
    if (this.hasDatabase) {
      try {
        const response = await fetch("/api/story/nodes")
        if (response.ok) {
          const nodes = await response.json()
          nodes.forEach((node: StoryNode) => {
            this.nodes.set(node.id, node)
          })
        }
      } catch (error) {
        console.warn("Failed to load story from database, using defaults")
      }
    }
  }

  async loadGameState(): Promise<void> {
    if (this.hasDatabase && this.userId) {
      try {
        const response = await fetch(`/api/saves?userId=${this.userId}`)
        if (response.ok) {
          const saves = await response.json()
          const currentSave = saves.find((save: any) => save.save_name === "current")
          if (currentSave) {
            this.gameState = JSON.parse(currentSave.save_data)
          }
        }
      } catch (error) {
        console.warn("Failed to load game state from database")
      }
    } else {
      const saved = localStorage.getItem("game-state")
      if (saved) {
        try {
          this.gameState = JSON.parse(saved)
        } catch (error) {
          console.warn("Failed to parse saved game state")
        }
      }
    }
  }

  async saveGameState(): Promise<void> {
    if (this.hasDatabase && this.userId) {
      try {
        await fetch("/api/saves", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: this.userId,
            saveName: "current",
            saveData: this.gameState,
          }),
        })
      } catch (error) {
        console.error("Failed to save game state to database")
      }
    } else {
      localStorage.setItem("game-state", JSON.stringify(this.gameState))
    }
  }

  getCurrentNode(): StoryNode | null {
    return this.nodes.get(this.gameState.currentNode) || null
  }

  getGameState(): GameState {
    return { ...this.gameState }
  }

  async makeChoice(choiceId: string): Promise<StoryNode | null> {
    const currentNode = this.getCurrentNode()
    if (!currentNode) return null

    const choice = currentNode.choices.find((c) => c.id === choiceId)
    if (!choice) return null

    if (choice.conditions && !this.checkConditions(choice.conditions)) {
      return null
    }

    this.gameState.history.push(this.gameState.currentNode)
    this.gameState.currentNode = choice.nextNode

    const nextNode = this.nodes.get(choice.nextNode)
    if (nextNode?.effects) {
      this.applyEffects(nextNode.effects)
    }

    await this.saveGameState()
    return nextNode || null
  }

  private checkConditions(conditions: Record<string, any>): boolean {
    for (const [key, value] of Object.entries(conditions)) {
      if (this.gameState.variables[key] !== value) {
        return false
      }
    }
    return true
  }

  private applyEffects(effects: Record<string, any>): void {
    for (const [key, value] of Object.entries(effects)) {
      if (key.startsWith("var_")) {
        const varName = key.substring(4)
        this.gameState.variables[varName] = value
      } else if (key === "add_item") {
        this.gameState.inventory.push(value)
      } else if (key === "remove_item") {
        const index = this.gameState.inventory.indexOf(value)
        if (index > -1) {
          this.gameState.inventory.splice(index, 1)
        }
      }
    }
  }

  async createSave(saveName: string): Promise<boolean> {
    const save: GameSave = {
      name: saveName,
      timestamp: Date.now(),
      currentNode: this.gameState.currentNode,
      variables: { ...this.gameState.variables },
      inventory: [...this.gameState.inventory],
      history: [...this.gameState.history],
    }

    this.gameState.saveSlots[saveName] = save

    if (this.hasDatabase && this.userId) {
      try {
        await fetch("/api/saves", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: this.userId,
            saveName,
            saveData: save,
          }),
        })
        return true
      } catch (error) {
        console.error("Failed to create save in database")
        return false
      }
    } else {
      localStorage.setItem("game-state", JSON.stringify(this.gameState))
      return true
    }
  }

  async loadSave(saveName: string): Promise<boolean> {
    if (this.hasDatabase && this.userId) {
      try {
        const response = await fetch(`/api/saves?userId=${this.userId}&saveName=${saveName}`)
        if (response.ok) {
          const saves = await response.json()
          if (saves.length > 0) {
            const saveData = JSON.parse(saves[0].save_data)
            this.gameState.currentNode = saveData.currentNode
            this.gameState.variables = saveData.variables
            this.gameState.inventory = saveData.inventory
            this.gameState.history = saveData.history
            await this.saveGameState()
            return true
          }
        }
      } catch (error) {
        console.error("Failed to load save from database")
      }
    } else {
      const save = this.gameState.saveSlots[saveName]
      if (save) {
        this.gameState.currentNode = save.currentNode
        this.gameState.variables = { ...save.variables }
        this.gameState.inventory = [...save.inventory]
        this.gameState.history = [...save.history]
        localStorage.setItem("game-state", JSON.stringify(this.gameState))
        return true
      }
    }
    return false
  }

  exportSave(): string {
    return JSON.stringify(this.gameState, null, 2)
  }

  importSave(saveData: string): boolean {
    try {
      const imported = JSON.parse(saveData)
      this.gameState = imported
      this.saveGameState()
      return true
    } catch (error) {
      return false
    }
  }
}
