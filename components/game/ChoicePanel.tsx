'use client'

import React, { useState, useMemo, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Send, Loader2, Lightbulb, ChevronDown, ChevronUp } from 'lucide-react'
import { useGameStore } from '@/stores'
import type { StoryChoice } from '@/lib/story-engine-client'

interface ChoicePanelProps {
  choices: StoryChoice[]
  onChoiceSelect?: (choice: StoryChoice) => void
  onCustomChoice?: (text: string) => void
  isDisabled?: boolean
  className?: string
}

interface ChoiceButtonProps {
  choice: StoryChoice & { id: string, isSelected?: boolean }
  onSelect: () => void
  disabled: boolean
  index: number
}

const ChoiceButton: React.FC<ChoiceButtonProps> = React.memo(({ 
  choice, 
  onSelect, 
  disabled, 
  index 
}) => {
  const keyboardShortcut = index < 9 ? (index + 1).toString() : null

  return (
    <Button
      variant={choice.isSelected ? "default" : "outline"}
      className={`justify-start h-auto p-4 text-left whitespace-normal relative group ${
        choice.isSelected 
          ? "bg-primary text-primary-foreground border-primary" 
          : "bg-transparent hover:bg-accent"
      }`}
      onClick={onSelect}
      disabled={disabled}
    >
      <div className="w-full text-left">
        <div className="font-medium text-wrap flex items-start justify-between">
          <span className="flex-1">
            {choice.isSelected && "✓ "}
            {choice.text}
          </span>
          {keyboardShortcut && (
            <Badge 
              variant="secondary" 
              className="ml-2 text-xs opacity-60 group-hover:opacity-100"
            >
              {keyboardShortcut}
            </Badge>
          )}
        </div>
        
        {choice.consequence && (
          <div className="text-sm text-muted-foreground mt-2 text-wrap">
            💭 {choice.consequence}
          </div>
        )}
      </div>
    </Button>
  )
})

ChoiceButton.displayName = 'ChoiceButton'

export const ChoicePanel = React.memo<ChoicePanelProps>(({ 
  choices, 
  onChoiceSelect, 
  onCustomChoice,
  isDisabled = false, 
  className 
}) => {
  const { makeChoice, isGenerating, currentNode } = useGameStore()
  const [customChoice, setCustomChoice] = useState('')
  const [showCustomChoice, setShowCustomChoice] = useState(false)
  const [choicesExpanded, setChoicesExpanded] = useState(true)

  // 处理选择项数据
  const memoizedChoices = useMemo(() => {
    return choices.map((choice, index) => ({
      ...choice,
      id: choice.id || `choice-${index}`,
      isSelected: currentNode?.selectedChoice === choice.text
    }))
  }, [choices, currentNode?.selectedChoice])

  // 处理选择点击
  const handleChoiceClick = useCallback(async (choice: StoryChoice) => {
    if (isDisabled || isGenerating) return

    try {
      await makeChoice(choice.id)
      onChoiceSelect?.(choice)
    } catch (error) {
      console.error('Failed to make choice:', error)
    }
  }, [isDisabled, isGenerating, makeChoice, onChoiceSelect])

  // 处理自定义选择
  const handleCustomChoiceSubmit = useCallback(async () => {
    const trimmedChoice = customChoice.trim()
    if (!trimmedChoice || isDisabled || isGenerating) return

    try {
      await makeChoice('', trimmedChoice)
      setCustomChoice('')
      setShowCustomChoice(false)
      onCustomChoice?.(trimmedChoice)
    } catch (error) {
      console.error('Failed to make custom choice:', error)
    }
  }, [customChoice, isDisabled, isGenerating, makeChoice, onCustomChoice])

  // 键盘快捷键支持
  React.useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (isDisabled || isGenerating) return

      // 数字键1-9选择对应选项
      const num = parseInt(e.key)
      if (num >= 1 && num <= 9 && num <= memoizedChoices.length) {
        const choice = memoizedChoices[num - 1]
        handleChoiceClick(choice)
      }

      // Enter键提交自定义选择
      if (e.key === 'Enter' && e.ctrlKey && showCustomChoice) {
        handleCustomChoiceSubmit()
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [isDisabled, isGenerating, memoizedChoices, handleChoiceClick, handleCustomChoiceSubmit, showCustomChoice])

  if (!choices || choices.length === 0) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center text-muted-foreground">
          <div className="space-y-2">
            <div className="text-2xl">🤔</div>
            <p>等待故事生成选择项...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center">
            <span>你的选择</span>
            {memoizedChoices.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {memoizedChoices.length}
              </Badge>
            )}
          </CardTitle>
          
          <div className="flex items-center gap-2">
            {/* 自定义选择开关 */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowCustomChoice(!showCustomChoice)}
              disabled={isDisabled}
            >
              <Lightbulb className="h-4 w-4 mr-1" />
              自定义
            </Button>
            
            {/* 折叠/展开按钮 */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setChoicesExpanded(!choicesExpanded)}
            >
              {choicesExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* 预设选择项 */}
        {choicesExpanded && (
          <div className="space-y-3">
            {memoizedChoices.map((choice, index) => (
              <ChoiceButton
                key={choice.id}
                choice={choice}
                onSelect={() => handleChoiceClick(choice)}
                disabled={isDisabled || isGenerating}
                index={index}
              />
            ))}
          </div>
        )}

        {/* 自定义选择区域 */}
        {showCustomChoice && (
          <div className="mt-4 p-4 border rounded-lg bg-muted/30 space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="custom-choice" className="text-sm font-medium">
                自定义选择
              </Label>
              <span className="text-xs text-muted-foreground">
                Ctrl + Enter 快速提交
              </span>
            </div>
            
            <Textarea
              id="custom-choice"
              value={customChoice}
              onChange={(e) => setCustomChoice(e.target.value)}
              placeholder="描述你想要采取的行动..."
              disabled={isDisabled || isGenerating}
              rows={3}
              maxLength={200}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.ctrlKey) {
                  e.preventDefault()
                  handleCustomChoiceSubmit()
                }
              }}
            />
            
            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                {customChoice.length}/200 字符
              </div>
              
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setCustomChoice('')
                    setShowCustomChoice(false)
                  }}
                  disabled={isGenerating}
                >
                  取消
                </Button>
                
                <Button
                  size="sm"
                  onClick={handleCustomChoiceSubmit}
                  disabled={!customChoice.trim() || isDisabled || isGenerating}
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      处理中...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      提交选择
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* 加载状态提示 */}
        {isGenerating && (
          <div className="text-center py-4">
            <div className="flex items-center justify-center text-muted-foreground">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              <span className="text-sm">正在生成下一章节...</span>
            </div>
          </div>
        )}

        {/* 快捷键提示 */}
        {!isDisabled && !isGenerating && memoizedChoices.length > 0 && (
          <div className="text-xs text-muted-foreground text-center pt-2 border-t">
            💡 提示：按数字键 1-{Math.min(9, memoizedChoices.length)} 快速选择对应选项
          </div>
        )}
      </CardContent>
    </Card>
  )
})

ChoicePanel.displayName = 'ChoicePanel'