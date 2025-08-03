'use client'

import React from 'react'
import { useConfigStore, useUIStore } from '@/stores'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { GamepadIcon } from 'lucide-react'

export const WelcomeScreen: React.FC = () => {
  const { systemInfo } = useConfigStore()
  const { setShowLogin, setShowRegister } = useUIStore()

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2">
            <GamepadIcon className="h-6 w-6" />
            AI剧情游戏
          </CardTitle>
          <CardDescription>体验AI驱动的互动故事</CardDescription>
          <div className="flex justify-center">
            <Badge variant={systemInfo.hasDatabase ? "default" : "secondary"}>
              {systemInfo.hasDatabase ? "完整版" : "单机版"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={() => setShowLogin(true)} className="w-full">
              登录
            </Button>
            {systemInfo.hasDatabase && (
              <Button onClick={() => setShowRegister(true)} variant="outline" className="w-full">
                注册
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}