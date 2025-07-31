import { create } from 'zustand'
import { devtools, subscribeWithSelector } from 'zustand/middleware'
import { 
  ClientStoryEngine, 
  type StoryNode, 
  type GameRecord, 
  type StoryChoice 
} from '@/lib/story-engine-client'

export type GameMode = 'adventure' | 'mystery' | 'horror' | 'romance' | 'scifi' | 'fantasy'

interface GameStore {
  // 游戏引擎实例
  engine: ClientStoryEngine | null
  
  // 当前游戏状态
  currentNode: StoryNode | null
  gameMode: GameMode
  isGenerating: boolean
  currentGameId: string | null
  
  // 游戏记录
  gameRecords: GameRecord[]
  
  // 分页状态
  currentPage: number
  totalPages: number
  canGoToPreviousPage: boolean
  canGoToNextPage: boolean
  
  // 流式内容
  streamingContent: string
  isStreaming: boolean
  
  // 用户输入状态
  pageInput: string
  customChoice: string
  
  // 错误状态
  error: string | null
  
  // 初始化方法
  initializeEngine: (hasDatabase: boolean, userId?: number) => Promise<void>
  
  // 游戏管理
  createNewGame: (gameMode: GameMode, gameName?: string) => Promise<string | null>
  loadGame: (gameId: string) => Promise<boolean>
  deleteGame: (gameId: string) => Promise<boolean>
  resetCurrentGame: () => Promise<void>
  
  // 游戏玩法
  startGame: (gameMode: GameMode) => Promise<StoryNode | null>
  makeChoice: (choiceId: string, customChoice?: string) => Promise<StoryNode | null>
  
  // 分页导航
  goToPreviousPage: () => StoryNode | null
  goToNextPage: () => StoryNode | null
  goToPage: (pageNumber: number) => StoryNode | null
  
  // 存档管理
  exportCurrentGame: () => string
  importGame: (saveData: string) => boolean
  
  // 设置方法
  setGameMode: (mode: GameMode) => void
  setCurrentNode: (node: StoryNode | null) => void
  setGenerating: (generating: boolean) => void
  setError: (error: string | null) => void
  setStreamingContent: (content: string) => void
  setIsStreaming: (streaming: boolean) => void
  setPageInput: (input: string) => void
  setCustomChoice: (choice: string) => void
  setEngine: (engine: ClientStoryEngine | null) => void
  setGameRecords: (records: GameRecord[]) => void
  
  // 更新游戏记录列表
  refreshGameRecords: () => void
  
  // 清理方法
  cleanup: () => void
}

export const useGameStore = create<GameStore>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      // 初始状态
      engine: null,
      currentNode: null,
      gameMode: 'adventure',
      isGenerating: false,
      currentGameId: null,
      gameRecords: [],
      currentPage: 1,
      totalPages: 0,
      canGoToPreviousPage: false,
      canGoToNextPage: false,
      streamingContent: '',
      isStreaming: false,
      pageInput: '',
      customChoice: '',
      error: null,
      
      // 初始化游戏引擎
      initializeEngine: async (hasDatabase: boolean, userId?: number) => {
        try {
          const engine = new ClientStoryEngine(hasDatabase, userId)
          
          // 加载游戏状态
          await engine.loadGameState()
          
          // 获取当前游戏状态
          const currentGameRecord = engine.getCurrentGameRecord()
          const currentNode = engine.getCurrentNode()
          const gameRecords = engine.getAllGameRecords()
          
          set({
            engine,
            currentNode,
            currentGameId: currentGameRecord?.id || null,
            gameMode: (currentGameRecord?.gameMode as GameMode) || 'adventure',
            gameRecords,
            currentPage: engine.getCurrentPage(),
            totalPages: engine.getTotalPages(),
            canGoToPreviousPage: engine.canGoToPreviousPage(),
            canGoToNextPage: engine.canGoToNextPage(),
            error: null
          })
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : '初始化游戏引擎失败'
          })
        }
      },
      
      // 创建新游戏
      createNewGame: async (gameMode: GameMode, gameName?: string) => {
        const { engine } = get()
        if (!engine) {
          set({ error: '游戏引擎未初始化' })
          return null
        }
        
        try {
          set({ isGenerating: true, error: null })
          const gameId = await engine.createNewGame(gameMode, gameName)
          
          // 更新状态
          const gameRecords = engine.getAllGameRecords()
          set({
            currentGameId: gameId,
            gameMode,
            gameRecords,
            isGenerating: false
          })
          
          return gameId
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : '创建游戏失败',
            isGenerating: false
          })
          return null
        }
      },
      
      // 开始游戏（生成初始故事）
      startGame: async (gameMode: GameMode) => {
        const { engine } = get()
        if (!engine) {
          set({ error: '游戏引擎未初始化' })
          return null
        }
        
        try {
          set({ isGenerating: true, error: null, streamingContent: '' })
          
          // 流式内容处理
          const onStream = (content: string) => {
            set({ streamingContent: content })
          }
          
          const initialNode = await engine.initializeGame(gameMode, onStream)
          
          if (initialNode) {
            const gameRecords = engine.getAllGameRecords()
            const currentGameRecord = engine.getCurrentGameRecord()
            
            set({
              currentNode: initialNode,
              currentGameId: currentGameRecord?.id || null,
              gameMode,
              gameRecords,
              currentPage: engine.getCurrentPage(),
              totalPages: engine.getTotalPages(),
              canGoToPreviousPage: engine.canGoToPreviousPage(),
              canGoToNextPage: engine.canGoToNextPage(),
              isGenerating: false,
              streamingContent: '',
              error: null
            })
          } else {
            set({
              error: '生成初始故事失败',
              isGenerating: false,
              streamingContent: ''
            })
          }
          
          return initialNode
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : '开始游戏失败',
            isGenerating: false,
            streamingContent: ''
          })
          return null
        }
      },
      
      // 做出选择
      makeChoice: async (choiceId: string, customChoice?: string) => {
        const { engine } = get()
        if (!engine || get().isGenerating) {
          return null
        }
        
        try {
          set({ isGenerating: true, error: null, streamingContent: '' })
          
          const onStream = (content: string) => {
            set({ streamingContent: content })
          }
          
          const nextNode = await engine.makeChoice(choiceId, customChoice, onStream)
          
          if (nextNode) {
            set({
              currentNode: nextNode,
              currentPage: engine.getCurrentPage(),
              totalPages: engine.getTotalPages(),
              canGoToPreviousPage: engine.canGoToPreviousPage(),
              canGoToNextPage: engine.canGoToNextPage(),
              isGenerating: false,
              streamingContent: '',
              error: null
            })
          } else {
            set({
              error: '生成下一章节失败',
              isGenerating: false,
              streamingContent: ''
            })
          }
          
          return nextNode
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : '选择失败',
            isGenerating: false,
            streamingContent: ''
          })
          return null
        }
      },
      
      // 加载游戏
      loadGame: async (gameId: string) => {
        const { engine } = get()
        if (!engine) {
          set({ error: '游戏引擎未初始化' })
          return false
        }
        
        try {
          const success = await engine.loadGame(gameId)
          
          if (success) {
            const currentNode = engine.getCurrentNode()
            const currentGameRecord = engine.getCurrentGameRecord()
            
            set({
              currentNode,
              currentGameId: gameId,
              gameMode: (currentGameRecord?.gameMode as GameMode) || 'adventure',
              currentPage: engine.getCurrentPage(),
              totalPages: engine.getTotalPages(),
              canGoToPreviousPage: engine.canGoToPreviousPage(),
              canGoToNextPage: engine.canGoToNextPage(),
              error: null
            })
          } else {
            set({ error: '加载游戏失败' })
          }
          
          return success
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : '加载游戏失败'
          })
          return false
        }
      },
      
      // 删除游戏
      deleteGame: async (gameId: string) => {
        const { engine } = get()
        if (!engine) {
          set({ error: '游戏引擎未初始化' })
          return false
        }
        
        try {
          const success = await engine.deleteGame(gameId)
          
          if (success) {
            // 刷新游戏记录列表
            const gameRecords = engine.getAllGameRecords()
            const currentGameRecord = engine.getCurrentGameRecord()
            
            set({
              gameRecords,
              currentGameId: currentGameRecord?.id || null,
              currentNode: currentGameRecord ? engine.getCurrentNode() : null,
              error: null
            })
          } else {
            set({ error: '删除游戏失败' })
          }
          
          return success
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : '删除游戏失败'
          })
          return false
        }
      },
      
      // 重置当前游戏
      resetCurrentGame: async () => {
        const { engine } = get()
        if (!engine) return
        
        try {
          await engine.resetGame()
          set({
            currentNode: null,
            currentPage: 1,
            totalPages: 0,
            canGoToPreviousPage: false,
            canGoToNextPage: false,
            error: null
          })
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : '重置游戏失败'
          })
        }
      },
      
      // 分页导航
      goToPreviousPage: () => {
        const { engine } = get()
        if (!engine) return null
        
        const node = engine.goToPreviousPage()
        if (node) {
          set({
            currentNode: node,
            currentPage: engine.getCurrentPage(),
            canGoToPreviousPage: engine.canGoToPreviousPage(),
            canGoToNextPage: engine.canGoToNextPage()
          })
        }
        return node
      },
      
      goToNextPage: () => {
        const { engine } = get()
        if (!engine) return null
        
        const node = engine.goToNextPage()
        if (node) {
          set({
            currentNode: node,
            currentPage: engine.getCurrentPage(),
            canGoToPreviousPage: engine.canGoToPreviousPage(),
            canGoToNextPage: engine.canGoToNextPage()
          })
        }
        return node
      },
      
      goToPage: (pageNumber: number) => {
        const { engine } = get()
        if (!engine) return null
        
        const node = engine.goToPage(pageNumber)
        if (node) {
          set({
            currentNode: node,
            currentPage: engine.getCurrentPage(),
            canGoToPreviousPage: engine.canGoToPreviousPage(),
            canGoToNextPage: engine.canGoToNextPage()
          })
        }
        return node
      },
      
      // 存档管理
      exportCurrentGame: () => {
        const { engine } = get()
        if (!engine) return '{}'
        return engine.exportSave()
      },
      
      importGame: (saveData: string) => {
        const { engine } = get()
        if (!engine) {
          set({ error: '游戏引擎未初始化' })
          return false
        }
        
        try {
          const success = engine.importSave(saveData)
          
          if (success) {
            // 刷新状态
            const gameRecords = engine.getAllGameRecords()
            const currentGameRecord = engine.getCurrentGameRecord()
            const currentNode = engine.getCurrentNode()
            
            set({
              gameRecords,
              currentNode,
              currentGameId: currentGameRecord?.id || null,
              gameMode: (currentGameRecord?.gameMode as GameMode) || 'adventure',
              currentPage: engine.getCurrentPage(),
              totalPages: engine.getTotalPages(),
              canGoToPreviousPage: engine.canGoToPreviousPage(),
              canGoToNextPage: engine.canGoToNextPage(),
              error: null
            })
          } else {
            set({ error: '导入游戏失败' })
          }
          
          return success
        } catch (error) {
          set({
            error: error instanceof Error ? error.message : '导入游戏失败'
          })
          return false
        }
      },
      
      // 设置方法
      setGameMode: (gameMode: GameMode) => {
        set({ gameMode })
      },
      
      setCurrentNode: (currentNode: StoryNode | null) => {
        set({ currentNode })
      },
      
      setGenerating: (isGenerating: boolean) => {
        set({ isGenerating })
      },
      
      setError: (error: string | null) => {
        set({ error })
      },
      
      setStreamingContent: (streamingContent: string) => {
        set({ streamingContent })
      },
      
      setIsStreaming: (isStreaming: boolean) => {
        set({ isStreaming })
      },
      
      setPageInput: (pageInput: string) => {
        set({ pageInput })
      },
      
      setCustomChoice: (customChoice: string) => {
        set({ customChoice })
      },
      
      setEngine: (engine: ClientStoryEngine | null) => {
        set({ engine })
      },
      
      setGameRecords: (gameRecords: GameRecord[]) => {
        set({ gameRecords })
      },
      
      // 刷新游戏记录
      refreshGameRecords: () => {
        const { engine } = get()
        if (engine) {
          const gameRecords = engine.getAllGameRecords()
          set({ gameRecords })
        }
      },
      
      // 清理资源
      cleanup: () => {
        set({
          engine: null,
          currentNode: null,
          gameMode: 'adventure',
          isGenerating: false,
          currentGameId: null,
          gameRecords: [],
          currentPage: 1,
          totalPages: 0,
          canGoToPreviousPage: false,
          canGoToNextPage: false,
          streamingContent: '',
          error: null
        })
      }
    })),
    {
      name: 'game-store',
    }
  )
)