'use client'

import React from 'react'
import { useConfigStore, useUIStore } from '@/stores'
import { useAllHandlers } from '@/hooks'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export const CustomModeDialog: React.FC = () => {
  const { customModeForm, setCustomModeForm } = useConfigStore()
  const { showCustomModeDialog, setShowCustomModeDialog } = useUIStore()
  const { handleAddCustomMode } = useAllHandlers()

  return (
    <Dialog open={showCustomModeDialog} onOpenChange={setShowCustomModeDialog}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>创建自定义游戏模式</DialogTitle>
          <DialogDescription>定义你自己的游戏类型和AI提示词</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="custom-name">模式名称</Label>
            <Input
              id="custom-name"
              value={customModeForm.name}
              onChange={(e) => setCustomModeForm({ name: e.target.value })}
              placeholder="例如：末日生存"
            />
          </div>
          <div>
            <Label htmlFor="custom-desc">模式描述</Label>
            <Input
              id="custom-desc"
              value={customModeForm.description}
              onChange={(e) => setCustomModeForm({ description: e.target.value })}
              placeholder="例如：在末日世界中生存，寻找希望"
            />
          </div>
          <div>
            <Label htmlFor="custom-prompt">AI提示词</Label>
            <Textarea
              id="custom-prompt"
              value={customModeForm.prompt}
              onChange={(e) => setCustomModeForm({ prompt: e.target.value })}
              placeholder="例如：末日生存类游戏，世界已经被病毒感染，玩家需要在危险的环境中寻找食物、武器和安全的避难所..."
              rows={4}
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setShowCustomModeDialog(false)}>
            取消
          </Button>
          <Button onClick={handleAddCustomMode}>创建模式</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}