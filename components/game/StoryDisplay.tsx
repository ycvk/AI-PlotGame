'use client'

import React, { useMemo, useRef, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ChevronLeft, ChevronRight, RotateCcw, Loader2 } from 'lucide-react'
import { useGameStore } from '@/stores'
import type { StoryNode } from '@/lib/story-engine-client'

interface StoryDisplayProps {
  story: StoryNode | null
  isLoading?: boolean
  streamingContent?: string
  onRegenerate?: () => void
  className?: string
}

const StoryLoadingSkeleton = () => (
  <div className="space-y-4 animate-pulse">
    <div className="h-6 bg-gray-200 rounded w-3/4"></div>
    <div className="space-y-2">
      <div className="h-4 bg-gray-200 rounded"></div>
      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
      <div className="h-4 bg-gray-200 rounded w-4/6"></div>
    </div>
  </div>
)

export const StoryDisplay = React.memo<StoryDisplayProps>(({ 
  story, 
  isLoading = false, 
  streamingContent = '',
  onRegenerate,
  className 
}) => {
  const { 
    engine,
    currentPage, 
    totalPages, 
    canGoToPreviousPage, 
    canGoToNextPage,
    goToPreviousPage,
    goToNextPage,
    goToPage 
  } = useGameStore()
  
  const contentRef = useRef<HTMLDivElement>(null)
  const [pageInput, setPageInput] = React.useState('')

  // 处理故事内容格式化
  const processedContent = useMemo(() => {
    if (streamingContent) {
      return formatStoryContent(streamingContent)
    }
    
    if (!story?.content) return ''
    
    return formatStoryContent(story.content)
  }, [story?.content, streamingContent])

  // 格式化故事内容
  const formatStoryContent = (content: string) => {
    if (!content) return ''
    
    // 基本的文本格式化
    return content
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // 粗体
      .replace(/\*(.*?)\*/g, '<em>$1</em>') // 斜体
      .replace(/\n\n/g, '</p><p>') // 段落分隔
      .replace(/\n/g, '<br>') // 换行
      .replace(/^/, '<p>') // 开始段落
      .replace(/$/, '</p>') // 结束段落
  }

  // 自动滚动到内容顶部
  useEffect(() => {
    if (contentRef.current && story) {
      contentRef.current.scrollTop = 0
    }
  }, [story?.id])

  const handlePageNavigation = (action: 'prev' | 'next' | 'goto') => {
    let newNode = null
    
    switch (action) {
      case 'prev':
        newNode = goToPreviousPage()
        break
      case 'next':
        newNode = goToNextPage()
        break
      case 'goto':
        const pageNum = parseInt(pageInput)
        if (pageNum && pageNum > 0 && totalPages && pageNum <= totalPages) {
          newNode = goToPage(pageNum)
          setPageInput('')
        }
        break
    }
  }

  // 获取当前游戏状态信息
  const gameState = engine?.getGameState()
  const currentLocation = gameState?.variables?.location

  if (isLoading && !streamingContent) {
    return (
      <Card className={className}>
        <CardContent className="p-6">
          <StoryLoadingSkeleton />
        </CardContent>
      </Card>
    )
  }

  if (!story && !streamingContent) {
    return (
      <Card className={className}>
        <CardContent className="p-6 text-center text-muted-foreground">
          <div className="space-y-2">
            <div className="text-2xl">📖</div>
            <p>准备开始您的冒险...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 分页导航 */}
      {totalPages > 1 && (
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageNavigation('prev')}
                  disabled={!canGoToPreviousPage || isLoading}
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="hidden sm:inline">上一页</span>
                </Button>
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handlePageNavigation('next')}
                  disabled={!canGoToNextPage || isLoading}
                >
                  <span className="hidden sm:inline">下一页</span>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <span className="text-sm text-muted-foreground whitespace-nowrap">
                  第 {currentPage} / {totalPages} 页
                </span>
                <div className="flex items-center gap-1">
                  <Input
                    type="number"
                    placeholder="页码"
                    value={pageInput}
                    onChange={(e) => setPageInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handlePageNavigation('goto')
                      }
                    }}
                    className="w-16 h-8"
                    min={1}
                    max={totalPages}
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageNavigation('goto')}
                    disabled={!pageInput || isLoading}
                  >
                    跳转
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 故事内容 */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-xl sm:text-2xl mb-2">
                {story?.title || '故事生成中...'}
              </CardTitle>
              
              {/* 位置信息 */}
              {currentLocation && (
                <Badge variant="outline" className="mb-2">
                  📍 {currentLocation}
                </Badge>
              )}
              
              {/* 上次选择显示 */}
              {story?.selectedChoice && (
                <Badge variant="secondary" className="mb-2">
                  上次选择：{story.selectedChoice}
                </Badge>
              )}
            </div>
            
            {/* 重新生成按钮 */}
            {onRegenerate && story && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRegenerate}
                disabled={isLoading}
                className="ml-4"
              >
                <RotateCcw className="h-4 w-4" />
                <span className="hidden sm:inline ml-2">重新生成</span>
              </Button>
            )}
          </div>
        </CardHeader>
        
        <CardContent>
          <div 
            ref={contentRef}
            className="prose prose-sm sm:prose max-w-none"
          >
            {streamingContent ? (
              <div className="space-y-4">
                <div 
                  dangerouslySetInnerHTML={{ __html: processedContent }}
                  className="story-content"
                />
                <div className="flex items-center text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  <span className="text-sm">故事生成中...</span>
                </div>
              </div>
            ) : (
              <div 
                dangerouslySetInnerHTML={{ __html: processedContent }}
                className="story-content"
              />
            )}
          </div>
        </CardContent>
      </Card>

      {/* 游戏状态信息 */}
      {gameState && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">游戏状态</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
              <div>
                <Label>游戏模式</Label>
                <p className="text-muted-foreground">
                  {/* 这里需要从配置或常量中获取模式名称 */}
                  {gameState.gameMode || '未知'}
                </p>
              </div>
              <div>
                <Label>故事进度</Label>
                <p className="text-muted-foreground">{totalPages} 页</p>
              </div>
              <div>
                <Label>背包物品</Label>
                <p className="text-muted-foreground">
                  {gameState.inventory?.length || 0} 个
                </p>
              </div>
            </div>

            {/* 物品清单 */}
            {gameState.inventory && gameState.inventory.length > 0 && (
              <div className="mt-4">
                <Label>物品清单</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {gameState.inventory.map((item: string, index: number) => (
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
    </div>
  )
})

StoryDisplay.displayName = 'StoryDisplay'