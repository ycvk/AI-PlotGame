/**
 * 上下文管理器
 * 负责构建、增强和优化AI故事生成的上下文信息
 */

import type { GameRecord } from './story-engine-client'

// ====== 类型定义 ======
export interface ContextManagerConfig {
  maxHistoryItems: number        // 最大历史项数
  maxChoiceHistory: number       // 最大选择历史数
  enableCompression: boolean     // 启用智能压缩
  compressionThreshold: number   // 压缩阈值（字符数）
}

export interface StoryContext {
  currentScene: string
  playerChoices: string[]
  gameMode: string
  storyHistory: string[]
  playerInventory: string[]
  gameVariables: Record<string, any>
}

export interface EnhancedStoryContext extends StoryContext {
  // 增强字段
  storyArc?: 'beginning' | 'development' | 'climax' | 'resolution'
  emotionalState?: string
  conflictLevel?: 'low' | 'medium' | 'high'
  narrativeThemes?: string[]
  keyEvents?: string[]
  characterRelationships?: Record<string, any>
  worldState?: any
}

export interface GameStatistics {
  totalChoices: number
  gameStartTime: number
  gameUpdateTime: number
  visitedNodes: number
  averageChoiceTime: number
  gameSessionDuration: number
}

// ====== 上下文管理器主类 ======
export class ContextManager {
  private config: ContextManagerConfig
  
  constructor(config?: Partial<ContextManagerConfig>) {
    this.config = {
      maxHistoryItems: 20,
      maxChoiceHistory: 50,
      enableCompression: true,
      compressionThreshold: 1000,
      ...config
    }
  }
  
  // ====== 核心方法：构建基础故事上下文 ======
  public buildStoryContext(gameRecord: GameRecord, currentChoice?: string): StoryContext {
    return {
      currentScene: gameRecord.currentNode || '开始',
      playerChoices: this.buildPlayerChoiceHistory(gameRecord, currentChoice),
      gameMode: gameRecord.gameMode,
      storyHistory: this.processStoryHistory(gameRecord.storyHistory),
      playerInventory: gameRecord.inventory || [],
      gameVariables: this.enhanceGameVariables(gameRecord)
    }
  }
  
  // ====== 增强上下文（为未来扩展预留） ======
  public enhanceContext(context: StoryContext): EnhancedStoryContext {
    return {
      ...context,
      storyArc: this.analyzeStoryArc(context.storyHistory),
      emotionalState: this.analyzeEmotionalState(context),
      conflictLevel: this.analyzeConflictLevel(context),
      narrativeThemes: this.extractNarrativeThemes(context.storyHistory),
      keyEvents: this.identifyKeyEvents(context.storyHistory)
    }
  }
  
  // ====== 智能历史压缩 ======
  public compressHistory(history: string[], maxItems: number): string[] {
    if (history.length <= maxItems) return history
    
    // 保留最近的项目 (70%比例)
    const recentItems = history.slice(-Math.floor(maxItems * 0.7))
    
    // 从早期历史中选择关键项目 (30%比例)
    const earlyHistory = history.slice(0, -Math.floor(maxItems * 0.7))
    const keyEarlyItems = this.selectKeyHistoryItems(earlyHistory, maxItems - recentItems.length)
    
    return [...keyEarlyItems, ...recentItems]
  }
  
  // ====== 私有方法：构建玩家选择历史 ======
  private buildPlayerChoiceHistory(gameRecord: GameRecord, currentChoice?: string): string[] {
    const choices: string[] = []
    
    // 从故事历史中提取选择信息（GameRecord.history 是节点ID数组，不包含选择文本）
    if (gameRecord.storyHistory && gameRecord.storyHistory.length > 0) {
      const extractedChoices = this.extractChoicesFromStoryHistory(gameRecord.storyHistory)
      choices.push(...extractedChoices)
    }
    
    // 添加当前选择
    if (currentChoice && currentChoice.trim()) {
      choices.push(currentChoice)
    }
    
    // 限制选择历史长度
    return choices.slice(-this.config.maxChoiceHistory)
  }
  
  // ====== 从故事历史中提取选择 ======
  private extractChoicesFromStoryHistory(storyHistory: string[]): string[] {
    const choices: string[] = []
    
    storyHistory.forEach(entry => {
      // 尝试解析 "选择: xxxx" 格式
      const choiceMatch = entry.match(/选择[:：]\s*(.+)/)
      if (choiceMatch && choiceMatch[1]) {
        choices.push(choiceMatch[1].trim())
      }
    })
    
    return choices
  }
  
  // ====== 处理故事历史 ======
  private processStoryHistory(storyHistory: string[]): string[] {
    if (!storyHistory || storyHistory.length === 0) return []
    
    // 应用智能压缩
    if (this.config.enableCompression && storyHistory.length > this.config.maxHistoryItems) {
      return this.compressHistory(storyHistory, this.config.maxHistoryItems)
    }
    
    return storyHistory
  }
  
  // ====== 增强游戏变量 ======
  private enhanceGameVariables(gameRecord: GameRecord): Record<string, any> {
    const enhanced = { ...gameRecord.variables }
    
    // 添加游戏统计信息
    const stats = this.extractGameStatistics(gameRecord)
    enhanced._stats = stats
    
    // 添加会话信息
    enhanced._session = {
      gameId: gameRecord.id,
      gameName: gameRecord.name,
      currentPage: gameRecord.currentPage || 0,
      totalPages: gameRecord.totalPages || 1
    }
    
    return enhanced
  }
  
  // ====== 提取游戏统计信息 ======
  private extractGameStatistics(gameRecord: GameRecord): GameStatistics {
    const now = Date.now()
    const startTime = gameRecord.createdAt || now
    const updateTime = gameRecord.updatedAt || now
    
    return {
      totalChoices: gameRecord.history?.length || 0,
      gameStartTime: startTime,
      gameUpdateTime: updateTime,
      visitedNodes: gameRecord.history?.length || 0,
      averageChoiceTime: this.calculateAverageChoiceTime(gameRecord.history),
      gameSessionDuration: Math.max(0, updateTime - startTime)
    }
  }
  
  // ====== 计算平均选择时间 ======
  private calculateAverageChoiceTime(history?: string[]): number {
    // GameRecord.history 是 string[] 类型，不包含时间戳
    // 这里返回默认值，可以在后续版本中改进
    return 0
  }
  
  // ====== 选择关键历史项目 ======
  private selectKeyHistoryItems(history: string[], maxItems: number): string[] {
    if (history.length <= maxItems) return history
    
    // 简单策略：均匀采样
    const step = Math.ceil(history.length / maxItems)
    const keyItems: string[] = []
    
    for (let i = 0; i < history.length && keyItems.length < maxItems; i += step) {
      keyItems.push(history[i])
    }
    
    return keyItems
  }
  
  // ====== 分析故事发展阶段 ======
  private analyzeStoryArc(storyHistory: string[]): 'beginning' | 'development' | 'climax' | 'resolution' {
    const historyLength = storyHistory.length
    
    if (historyLength < 5) return 'beginning'
    if (historyLength < 15) return 'development'
    if (historyLength < 25) return 'climax'
    return 'resolution'
  }
  
  // ====== 分析情感状态 ======
  private analyzeEmotionalState(context: StoryContext): string {
    // 基于游戏变量推断
    const mood = context.gameVariables.mood || context.gameVariables.atmosphere
    if (mood) return mood as string
    
    // 基于游戏模式的默认情感状态
    const modeEmotions: Record<string, string> = {
      horror: 'tense',
      romance: 'romantic', 
      mystery: 'curious',
      adventure: 'excited',
      scifi: 'wonder',
      fantasy: 'magical'
    }
    
    return modeEmotions[context.gameMode] || 'neutral'
  }
  
  // ====== 分析冲突等级 ======
  private analyzeConflictLevel(context: StoryContext): 'low' | 'medium' | 'high' {
    // 基于故事长度和内容分析冲突等级
    const historyLength = context.storyHistory.length
    
    if (historyLength < 5) return 'low'
    if (historyLength < 15) return 'medium'
    return 'high'
  }
  
  // ====== 提取叙事主题 ======
  private extractNarrativeThemes(storyHistory: string[]): string[] {
    if (storyHistory.length === 0) return []
    
    // 简单的关键词匹配
    const themes: string[] = []
    const content = storyHistory.join(' ')
    
    const themeKeywords = {
      '冒险': ['探索', '发现', '未知', '旅程'],
      '友情': ['朋友', '伙伴', '帮助', '支持'],
      '成长': ['学会', '成长', '变化', '进步'],
      '牺牲': ['牺牲', '代价', '失去', '付出'],
      '爱情': ['爱', '喜欢', '心动', '浪漫']
    }
    
    Object.entries(themeKeywords).forEach(([theme, keywords]) => {
      if (keywords.some(keyword => content.includes(keyword))) {
        themes.push(theme)
      }
    })
    
    return themes
  }
  
  // ====== 识别关键事件 ======
  private identifyKeyEvents(storyHistory: string[]): string[] {
    if (storyHistory.length === 0) return []
    
    const keyEvents: string[] = []
    
    // 识别重要事件标记
    const eventMarkers = ['第一次', '突然', '决定', '发现', '遇到', '选择']
    
    storyHistory.forEach(entry => {
      if (eventMarkers.some(marker => entry.includes(marker))) {
        keyEvents.push(entry)
      }
    })
    
    // 限制关键事件数量
    return keyEvents.slice(-10)
  }
}

// ====== 导出工厂函数 ======
export function createContextManager(config?: Partial<ContextManagerConfig>): ContextManager {
  return new ContextManager(config)
}

// ====== 默认导出 ======
export default ContextManager