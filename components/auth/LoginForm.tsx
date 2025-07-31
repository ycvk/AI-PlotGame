'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Loader2 } from 'lucide-react'
import { useAuthStore } from '@/stores'

interface LoginFormProps {
  onSuccess?: () => void
  onError?: (error: string) => void
  onSwitchToRegister?: () => void
  asDialog?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export const LoginForm: React.FC<LoginFormProps> = ({
  onSuccess,
  onError,
  onSwitchToRegister,
  asDialog = false,
  open = false,
  onOpenChange
}) => {
  const { login, isLoading, error, clearError } = useAuthStore()
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()

    if (!formData.username.trim() || !formData.password.trim()) {
      const errorMsg = '请填写完整的用户名和密码'
      onError?.(errorMsg)
      return
    }

    try {
      await login(formData)
      
      // 登录成功
      setFormData({ username: '', password: '' })
      onSuccess?.()
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '登录失败'
      onError?.(errorMsg)
    }
  }

  const handleInputChange = (field: 'username' | 'password') => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }))
    if (error) clearError()
  }

  const FormContent = (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="username">用户名</Label>
        <Input
          id="username"
          type="text"
          value={formData.username}
          onChange={handleInputChange('username')}
          placeholder="请输入用户名"
          disabled={isLoading}
          required
          autoComplete="username"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="password">密码</Label>
        <Input
          id="password"
          type="password"
          value={formData.password}
          onChange={handleInputChange('password')}
          placeholder="请输入密码"
          disabled={isLoading}
          required
          autoComplete="current-password"
        />
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md border border-red-200">
          {error}
        </div>
      )}

      <div className="flex flex-col space-y-3">
        <Button 
          type="submit" 
          disabled={isLoading}
          className="w-full"
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              登录中...
            </>
          ) : (
            '登录'
          )}
        </Button>

        {onSwitchToRegister && (
          <Button
            type="button"
            variant="ghost"
            onClick={onSwitchToRegister}
            disabled={isLoading}
            className="w-full"
          >
            还没有账号？立即注册
          </Button>
        )}
      </div>
    </form>
  )

  if (asDialog) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>用户登录</DialogTitle>
          </DialogHeader>
          {FormContent}
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">欢迎回来</CardTitle>
        <CardDescription className="text-center">
          登录您的账号开始游戏
        </CardDescription>
      </CardHeader>
      <CardContent>
        {FormContent}
      </CardContent>
    </Card>
  )
}