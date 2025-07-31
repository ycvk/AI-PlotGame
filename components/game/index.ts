// 游戏组件统一导出
export { GameModeSelector } from './GameModeSelector'
export { StoryDisplay } from './StoryDisplay'
export { ChoicePanel } from './ChoicePanel'
export { GameRecords } from './GameRecords'

// 重新导出相关类型
export type { GameMode } from '@/stores/gameStore'
export type { StoryNode, StoryChoice, GameRecord } from '@/lib/story-engine-client'