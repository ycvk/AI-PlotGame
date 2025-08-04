/**
 * 提示词引擎测试
 * 验证不同游戏模式生成的提示词质量
 */

import { PromptEngine, EnhancedStoryContext } from '../prompt-engine'

// 测试用例：验证不同游戏模式的提示词生成
export function testPromptEngine() {
  console.log('=== 测试提示词引擎 ===\n')
  
  const engine = new PromptEngine(true)
  
  // 测试游戏模式列表
  const gameModes = ['adventure', 'mystery', 'horror', 'romance', 'scifi', 'fantasy']
  
  // 测试初始故事生成
  console.log('1. 测试初始故事提示词生成:\n')
  
  gameModes.forEach(mode => {
    const context: EnhancedStoryContext = {
      currentScene: '开始',
      playerChoices: [],
      gameMode: mode,
      storyHistory: [],
      playerInventory: [],
      gameVariables: {},
      storyArc: 'beginning',
      emotionalState: 'neutral'
    }
    
    const prompt = engine.generatePrompt(context, 'initial')
    const strategy = engine.getPromptStrategy(mode)
    const quality = engine.analyzePromptQuality(prompt)
    
    console.log(`游戏模式: ${mode}`)
    console.log(`推荐参数: temperature=${strategy.parameters.creativity}, max_tokens=${strategy.parameters.verbosity}`)
    console.log(`关注要素: ${strategy.parameters.focus.join(', ')}`)
    console.log(`提示词质量评分: ${quality.score.toFixed(2)}`)
    console.log(`改进建议: ${quality.suggestions.length > 0 ? quality.suggestions.join('; ') : '无'}`)
    console.log(`提示词预览 (前200字符): ${prompt.substring(0, 200)}...`)
    console.log('---\n')
  })
  
  // 测试故事延续生成
  console.log('2. 测试故事延续提示词生成:\n')
  
  const continuationContext: EnhancedStoryContext = {
    currentScene: '神秘的森林深处',
    playerChoices: ['进入森林探索'],
    gameMode: 'adventure',
    storyHistory: [
      '你来到了一个神秘的森林入口',
      '森林中传来奇怪的声音',
      '你决定进入森林探索'
    ],
    playerInventory: ['手电筒', '地图'],
    gameVariables: { courage: 5, exploration: 3 },
    storyArc: 'development',
    emotionalState: 'curious',
    conflictLevel: 'medium',
    keyEvents: ['发现神秘符号', '遇到奇怪声音']
  }
  
  const continuationPrompt = engine.generatePrompt(continuationContext, 'continuation')
  const continuationQuality = engine.analyzePromptQuality(continuationPrompt)
  
  console.log('延续故事上下文:')
  console.log(`- 当前场景: ${continuationContext.currentScene}`)
  console.log(`- 故事阶段: ${continuationContext.storyArc}`)
  console.log(`- 冲突等级: ${continuationContext.conflictLevel}`)
  console.log(`- 提示词质量评分: ${continuationQuality.score.toFixed(2)}`)
  console.log(`提示词预览 (前300字符): ${continuationPrompt.substring(0, 300)}...`)
  console.log('\n')
  
  // 测试高冲突场景
  console.log('3. 测试高冲突场景提示词:\n')
  
  const highConflictContext: EnhancedStoryContext = {
    ...continuationContext,
    gameMode: 'horror',
    currentScene: '废弃医院的手术室',
    storyArc: 'climax',
    conflictLevel: 'high',
    emotionalState: 'terrified'
  }
  
  const horrorPrompt = engine.generatePrompt(highConflictContext, 'continuation')
  const horrorParams = engine.getRecommendedParameters('horror')
  
  console.log('恐怖场景参数:')
  console.log(`- 推荐temperature: ${horrorParams.temperature}`)
  console.log(`- 推荐max_tokens: ${horrorParams.max_tokens}`)
  console.log(`提示词包含的特殊要求:`)
  if (horrorPrompt.includes('高冲突场景要求')) console.log('✓ 包含高冲突场景要求')
  if (horrorPrompt.includes('恐怖惊悚类写作要求')) console.log('✓ 包含恐怖类型特定要求')
  if (horrorPrompt.includes('展示而非告诉')) console.log('✓ 包含专业写作技巧')
  
  console.log('\n=== 测试完成 ===')
}

// 运行测试
if (require.main === module) {
  testPromptEngine()
}