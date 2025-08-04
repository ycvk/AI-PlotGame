/**
 * 专业化提示词引擎
 * 负责生成高质量、游戏模式特定的AI提示词
 */

// ====== 类型定义 ======
export interface PromptTemplate {
  id: string
  name: string
  baseTemplate: string
  contextModifiers: ContextModifier[]
  gameModeVariations: Record<string, string>
}

export interface ContextModifier {
  condition: (context: EnhancedStoryContext) => boolean
  modification: string
  priority: number
}

export interface PromptStrategy {
  gameMode: string
  templates: PromptTemplate[]
  parameters: {
    creativity: number      // 影响temperature
    verbosity: number       // 影响max_tokens
    focus: string[]         // 重点关注的元素
  }
}

export interface WritingTechniques {
  showDontTell: boolean
  sensoryDetails: boolean
  pacing: 'slow' | 'medium' | 'fast'
  emotionalDepth: boolean
  conflictIntensity: 'low' | 'medium' | 'high'
}

// 扩展的故事上下文（为未来集成预留）
export interface EnhancedStoryContext {
  // 基础字段
  currentScene: string
  playerChoices: string[]
  gameMode: string
  storyHistory: string[]
  playerInventory: string[]
  gameVariables: Record<string, any>
  
  // 增强字段
  storyArc?: 'beginning' | 'development' | 'climax' | 'resolution'
  emotionalState?: string
  conflictLevel?: 'low' | 'medium' | 'high'
  narrativeThemes?: string[]
  keyEvents?: string[]
  characterRelationships?: Record<string, any>
  worldState?: any
}

// ====== 核心提示词引擎类 ======
export class PromptEngine {
  private templates: Map<string, PromptTemplate>
  private strategies: Map<string, PromptStrategy>
  private enabled: boolean
  // ====== 专业写作技巧模板 ======
  private readonly NARRATIVE_TECHNIQUES = `
专业写作技巧要求：
1. 展示而非告诉(Show, Don't Tell)：
   - 通过角色的行动、对话和感官细节展现情节
   - 避免直接叙述情感和状态，让读者通过细节自行感受
   - 例：不说"他很害怕"，而是描述"他的手在颤抖，额头渗出冷汗"

2. 多感官描述：
   - 调动视觉、听觉、触觉、嗅觉、味觉等多种感官
   - 创造身临其境的阅读体验
   - 让环境成为故事的有机组成部分

3. 节奏控制：
   - 短句制造紧张感和快节奏
   - 长句用于深度描述和情感铺垫
   - 段落长度变化营造阅读节奏

4. 情感深度：
   - 展现角色的内心冲突和动机
   - 通过细微的动作和表情传达情感
   - 避免脸谱化的角色塑造

5. 冲突升级：
   - 每个场景都要有内在或外在的张力
   - 逐步提升戏剧冲突的强度
   - 选择应该导向有意义的后果

6. 悬念设置：
   - 在关键信息上适当留白
   - 激发读者的好奇心和参与感
   - 预示但不完全揭示未来发展`.trim()
  // ====== 游戏模式特定策略 ======
  private readonly MODE_STRATEGIES = {
    adventure: `
冒险探索类写作要求：
- 营造神秘和未知的氛围，激发探索欲望
- 详细描述环境和地点，让世界观生动立体
- 设置明确的目标和挑战，给予成就感
- 平衡危险与机遇，创造紧张刺激的体验
- 强调发现的喜悦和成长的过程`,

    mystery: `
悬疑推理类写作要求：
- 精心设置谜题和线索，保持逻辑严密
- 营造信息不对称，让读者与主角共同推理
- 使用红鲱鱼（误导线索）增加推理难度
- 控制信息揭示的节奏，保持悬念
- 角色动机要复杂但合理可信`,

    horror: `
恐怖惊悚类写作要求：
- 使用暗示和模糊描述，让恐惧源于想象
- 营造压抑和不安的氛围，逐步积累恐惧
- 关注心理恐惧多于视觉冲击
- 运用环境和声音制造惊悚效果
- 在平静中突然制造恐怖转折`,

    romance: `
浪漫爱情类写作要求：
- 注重角色间的化学反应和情感张力
- 细腻描绘情感变化和内心活动
- 设置合理的情感障碍和冲突
- 平衡甜蜜时刻和戏剧冲突
- 通过对话展现性格和关系发展`,

    scifi: `
科幻未来类写作要求：
- 构建详实可信的科技设定
- 探讨科技对人性和社会的影响
- 保持内在逻辑的一致性
- 平衡科技描述和人物故事
- 创造独特的未来世界观`,

    fantasy: `
奇幻魔法类写作要求：
- 建立完整的魔法体系和世界规则
- 创造独特的种族、文化和历史
- 平衡奇幻元素和角色成长
- 保持魔法规则的内在一致性
- 营造史诗感和冒险氛围`
  }
  
  constructor(enabled: boolean = true) {
    this.enabled = enabled
    this.templates = new Map()
    this.strategies = new Map()

    if (this.enabled) {
      this.initializeTemplates()
      this.initializeStrategies()
    }
  }
  
  // ====== 核心方法：生成提示词 ======
  public generatePrompt(context: EnhancedStoryContext, type: 'initial' | 'continuation' = 'continuation'): string {
    if (!this.enabled) {
      return this.generateLegacyPrompt(context, type)
    }

    const strategy = this.getPromptStrategy(context.gameMode)
    const template = type === 'initial'
      ? this.templates.get('opening')!
      : this.templates.get('continuation')!

    let prompt = this.fillTemplate(template.baseTemplate, context, strategy)
    prompt = this.applyContextModifiers(prompt, context, template.contextModifiers)
    prompt = this.addQualityRequirements(prompt, context)

    return prompt
  }
  
  // ====== 获取游戏模式策略 ======
  public getPromptStrategy(gameMode: string): PromptStrategy {
    return this.strategies.get(gameMode) || this.strategies.get('adventure')!
  }
  
  // ====== 获取推荐的AI参数 ======
  public getRecommendedParameters(gameMode: string): { temperature: number; max_tokens: number } {
    const strategy = this.getPromptStrategy(gameMode)
    return {
      temperature: strategy.parameters.creativity,
      max_tokens: strategy.parameters.verbosity
    }
  }
  
  // ====== 公共方法：分析提示词质量 ======
  public analyzePromptQuality(prompt: string): { score: number; suggestions: string[] } {
    const suggestions: string[] = []
    let score = 0.5  // 基础分数

    // 检查是否包含写作技巧指导
    if (prompt.includes('展示而非告诉')) score += 0.1
    if (prompt.includes('多感官描述')) score += 0.1
    if (prompt.includes('节奏控制')) score += 0.05

    // 检查是否有明确的要求
    if (prompt.includes('JSON')) score += 0.1
    if (prompt.includes('choices') || prompt.includes('选择')) score += 0.1

    // 检查是否有上下文信息
    if (prompt.includes('当前场景') || prompt.includes('currentScene')) score += 0.05

    // 生成改进建议
    if (score < 0.7) {
      if (!prompt.includes('展示而非告诉')) {
        suggestions.push('添加"展示而非告诉"的写作技巧指导')
      }
      if (!prompt.includes('多感官')) {
        suggestions.push('加入多感官描述要求')
      }
      if (!prompt.includes('JSON')) {
        suggestions.push('明确要求JSON格式输出')
      }
    }

    return { score: Math.min(score, 1.0), suggestions }
  }
  
  // ====== 初始化模板 ======
  private initializeTemplates(): void {
    // 通用开场模板
    const openingTemplate: PromptTemplate = {
      id: 'universal_opening',
      name: '通用开场模板',
      baseTemplate: `
你是一位资深的互动小说作家，精通各类型文学创作。
请为玩家创作一个引人入胜的{gameMode}故事开场。

${this.NARRATIVE_TECHNIQUES}

{modeSpecificGuidance}

创作要求：
- 字数：{wordCount}字左右
- 创造一个吸引人的开场场景
- 介绍主要角色或情境
- 设置初始冲突或谜题
- 提供{choiceCount}个有意义且影响剧情走向的选择
- 每个选择都要有独特的后果暗示

输出格式要求：
必须返回严格的JSON格式，包含以下字段：
{
  "title": "场景标题",
  "content": "详细的故事内容，使用丰富的感官描述和情感细节",
  "choices": [
    {
      "id": "choice1",
      "text": "选择描述",
      "consequence": "这个选择可能导致的后果暗示"
    }
  ],
  "mood": "场景的情感基调",
  "location": "当前位置"
}`,
      contextModifiers: [],
      gameModeVariations: {}
    }

    // 延续故事模板
    const continuationTemplate: PromptTemplate = {
      id: 'story_continuation',
      name: '故事延续模板',
      baseTemplate: `
你是一位资深的互动小说作家，正在创作一个{gameMode}类型的互动故事。

${this.NARRATIVE_TECHNIQUES}

{modeSpecificGuidance}

故事背景：
当前场景：{currentScene}
玩家选择：{playerChoice}
历史摘要：{storyHistory}
角色关系：{characterRelationships}
世界状态：{worldState}

创作要求：
- 基于玩家的选择，自然延续故事发展
- 保持与之前剧情的连贯性和一致性
- 深化角色发展和关系变化
- 推进主要剧情线索
- 提供{choiceCount}个富有深度的选择选项
- 字数：{wordCount}字左右

特别注意：
{contextSpecificRequirements}

输出格式要求：
必须返回严格的JSON格式，包含以下字段：
{
  "title": "场景标题",
  "content": "详细的故事内容",
  "choices": [
    {
      "id": "choice_id",
      "text": "选择描述",
      "consequence": "可能的后果暗示"
    }
  ],
  "effects": {
    "add_item": ["物品名称"],
    "set_variable": {"变量名": "值"},
    "mood": "情感变化",
    "location": "位置变化"
  }
}`,
      contextModifiers: [
        {
          condition: (ctx) => ctx.storyHistory.length > 10,
          modification: '\n\n长篇故事要求：\n- 注意保持角色性格的一致性\n- 回应之前埋下的伏笔\n- 适当加快故事节奏',
          priority: 1
        },
        {
          condition: (ctx) => ctx.conflictLevel === 'high',
          modification: '\n\n高冲突场景要求：\n- 增加紧张感和戏剧性\n- 使用更短促的句子\n- 强调时间紧迫性',
          priority: 2
        }
      ],
      gameModeVariations: {}
    }

    this.templates.set('opening', openingTemplate)
    this.templates.set('continuation', continuationTemplate)
  }
  
  // ====== 初始化游戏模式策略 ======
  private initializeStrategies(): void {
    // 冒险探索策略
    this.strategies.set('adventure', {
      gameMode: 'adventure',
      templates: [this.templates.get('opening')!, this.templates.get('continuation')!],
      parameters: {
        creativity: 0.8,
        verbosity: 1000,
        focus: ['exploration', 'discovery', 'challenge', 'growth']
      }
    })

    // 悬疑推理策略
    this.strategies.set('mystery', {
      gameMode: 'mystery',
      templates: [this.templates.get('opening')!, this.templates.get('continuation')!],
      parameters: {
        creativity: 0.7,  // 较低创意度保持逻辑性
        verbosity: 1200,  // 更多细节描述
        focus: ['clues', 'deduction', 'suspense', 'revelation']
      }
    })

    // 恐怖惊悚策略
    this.strategies.set('horror', {
      gameMode: 'horror',
      templates: [this.templates.get('opening')!, this.templates.get('continuation')!],
      parameters: {
        creativity: 0.85,
        verbosity: 1100,
        focus: ['atmosphere', 'fear', 'tension', 'unknown']
      }
    })

    // 浪漫爱情策略
    this.strategies.set('romance', {
      gameMode: 'romance',
      templates: [this.templates.get('opening')!, this.templates.get('continuation')!],
      parameters: {
        creativity: 0.75,
        verbosity: 1150,
        focus: ['emotion', 'relationship', 'chemistry', 'conflict']
      }
    })

    // 科幻未来策略
    this.strategies.set('scifi', {
      gameMode: 'scifi',
      templates: [this.templates.get('opening')!, this.templates.get('continuation')!],
      parameters: {
        creativity: 0.85,
        verbosity: 1200,
        focus: ['technology', 'future', 'humanity', 'exploration']
      }
    })

    // 奇幻魔法策略
    this.strategies.set('fantasy', {
      gameMode: 'fantasy',
      templates: [this.templates.get('opening')!, this.templates.get('continuation')!],
      parameters: {
        creativity: 0.9,
        verbosity: 1250,
        focus: ['magic', 'adventure', 'mythology', 'heroism']
      }
    })
  }
  
  // ====== 私有辅助方法 ======
  private fillTemplate(template: string, context: EnhancedStoryContext, strategy: PromptStrategy): string {
    const modeGuidance = this.MODE_STRATEGIES[context.gameMode as keyof typeof this.MODE_STRATEGIES] || ''

    return template
      .replace('{gameMode}', this.getGameModeDescription(context.gameMode))
      .replace('{modeSpecificGuidance}', modeGuidance)
      .replace('{currentScene}', context.currentScene || '开始')
      .replace('{playerChoice}', context.playerChoices[context.playerChoices.length - 1] || '')
      .replace('{storyHistory}', this.formatStoryHistory(context.storyHistory))
      .replace('{characterRelationships}', this.formatCharacterRelationships(context.characterRelationships))
      .replace('{worldState}', this.formatWorldState(context.worldState))
      .replace('{choiceCount}', '3')
      .replace('{wordCount}', strategy.parameters.verbosity.toString())
      .replace('{contextSpecificRequirements}', this.getContextSpecificRequirements(context))
  }
  
  private applyContextModifiers(
    basePrompt: string,
    context: EnhancedStoryContext,
    modifiers: ContextModifier[]
  ): string {
    let modifiedPrompt = basePrompt

    const applicableModifiers = modifiers
      .filter(mod => mod.condition(context))
      .sort((a, b) => b.priority - a.priority)

    for (const modifier of applicableModifiers) {
      modifiedPrompt += modifier.modification
    }

    return modifiedPrompt
  }
  
  private addQualityRequirements(prompt: string, context: EnhancedStoryContext): string {
    const qualityRequirements = `

质量保证要求：
1. 内容必须符合${context.gameMode}类型的特征和氛围
2. 确保叙事的连贯性和逻辑性
3. 角色行为必须符合已建立的性格特征
4. 选择必须有实质性的区别和后果
5. 避免陈词滥调和过度使用的情节
6. 保持适当的悬念和吸引力`

    return prompt + qualityRequirements
  }
  
  private getGameModeDescription(gameMode: string): string {
    const descriptions: Record<string, string> = {
      adventure: '冒险探索',
      mystery: '悬疑推理',
      horror: '恐怖惊悚',
      romance: '浪漫爱情',
      scifi: '科幻未来',
      fantasy: '奇幻魔法'
    }
    return descriptions[gameMode] || '冒险探索'
  }
  
  private formatStoryHistory(history: string[]): string {
    if (history.length === 0) return '故事刚刚开始'

    // 智能摘要历史，保留关键信息
    const recentHistory = history.slice(-5)
    const summary = recentHistory.join(' → ')

    if (history.length > 5) {
      return `[早期事件摘要] ... → ${summary}`
    }

    return summary
  }
  
  private formatCharacterRelationships(relationships?: Record<string, any>): string {
    if (!relationships || Object.keys(relationships).length === 0) {
      return '暂无建立的角色关系'
    }

    return Object.entries(relationships)
      .map(([character, relation]) => `${character}: ${JSON.stringify(relation)}`)
      .join(', ')
  }
  
  private formatWorldState(worldState?: any): string {
    if (!worldState) return '世界状态正常'

    return JSON.stringify(worldState, null, 2)
  }
  
  private getContextSpecificRequirements(context: EnhancedStoryContext): string {
    const requirements: string[] = []

    if (context.storyArc === 'climax') {
      requirements.push('- 这是故事的高潮部分，需要更强的戏剧冲突')
    }

    if (context.emotionalState) {
      requirements.push(`- 当前情感基调：${context.emotionalState}`)
    }

    if (context.conflictLevel === 'high') {
      requirements.push('- 保持高度的紧张感和冲突强度')
    }

    if (context.narrativeThemes && context.narrativeThemes.length > 0) {
      requirements.push(`- 强调主题：${context.narrativeThemes.join(', ')}`)
    }

    return requirements.join('\n')
  }
  
  // ====== 降级到传统提示词 ======
  private generateLegacyPrompt(context: EnhancedStoryContext, type: 'initial' | 'continuation'): string {
    const gameModeDesc = this.getGameModeDescription(context.gameMode)

    if (type === 'initial') {
      return `你是一个专业的互动小说作家。请创建一个${gameModeDesc}的开场剧情。

要求：
1. 创建引人入胜的开场情节
2. 提供3个有意义的选择
3. 每个选择都应该导向不同的故事发展
4. 保持适当的悬念和吸引力

请以JSON格式返回结果。`
    }

    return `你是一个专业的互动小说作家。基于以下游戏状态继续故事：

当前场景：${context.currentScene}
游戏模式：${gameModeDesc}
玩家选择：${context.playerChoices[context.playerChoices.length - 1] || ''}
故事历史：${context.storyHistory.slice(-3).join(' -> ') || '刚开始'}

请以JSON格式返回结果。`
  }
}

// ====== 导出工厂函数 ======
export function createPromptEngine(enabled: boolean = true): PromptEngine {
  return new PromptEngine(enabled)
}

// ====== 默认导出 ======
export default PromptEngine