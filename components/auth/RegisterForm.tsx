'use client'

import React, { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'
import { useAuthStore } from '@/stores'

interface RegisterFormProps {
  onSuccess?: () => void
  onError?: (error: string) => void
  onSwitchToLogin?: () => void
  asDialog?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
  onSuccess,
  onError,
  onSwitchToLogin,
  asDialog = false,
  open = false,
  onOpenChange
}) => {
  const { register, isLoading, error, clearError } = useAuthStore()
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: ''
  })
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const errors: Record<string, string> = {}

    // 用户名验证
    if (!formData.username.trim()) {
      errors.username = '请输入用户名'
    } else if (formData.username.length < 3) {
      errors.username = '用户名至少需要3个字符'
    } else if (formData.username.length > 20) {
      errors.username = '用户名不能超过20个字符'
    } else if (!/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/.test(formData.username)) {
      errors.username = '用户名只能包含字母、数字、下划线和中文'
    }

    // 密码验证
    if (!formData.password) {
      errors.password = '请输入密码'
    } else if (formData.password.length < 6) {
      errors.password = '密码至少需要6个字符'
    } else if (formData.password.length > 50) {
      errors.password = '密码不能超过50个字符'
    }

    // 确认密码验证
    if (!formData.confirmPassword) {
      errors.confirmPassword = '请确认密码'
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = '两次输入的密码不一致'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    clearError()
    setValidationErrors({})

    if (!validateForm()) {
      return
    }

    try {
      await register({
        username: formData.username.trim(),
        password: formData.password
      })
      
      // 注册成功
      setFormData({ username: '', password: '', confirmPassword: '' })
      onSuccess?.()
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : '注册失败'
      onError?.(errorMsg)
    }
  }

  const handleInputChange = (field: keyof typeof formData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }))
    
    // 清除相关验证错误
    if (validationErrors[field]) {
      setValidationErrors(prev => {
        const { [field]: _, ...rest } = prev
        return rest
      })
    }
    
    if (error) clearError()
  }

  const getPasswordStrength = (password: string) => {
    let strength = 0
    if (password.length >= 8) strength++
    if (/[a-z]/.test(password)) strength++
    if (/[A-Z]/.test(password)) strength++
    if (/[0-9]/.test(password)) strength++
    if (/[^a-zA-Z0-9]/.test(password)) strength++
    return strength
  }

  const passwordStrength = getPasswordStrength(formData.password)
  const strengthLabels = ['很弱', '弱', '一般', '强', '很强']
  const strengthColors = ['text-red-500', 'text-orange-500', 'text-yellow-500', 'text-blue-500', 'text-green-500']

  const FormContent = (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="reg-username">用户名</Label>
        <Input
          id="reg-username"
          type="text"
          value={formData.username}
          onChange={handleInputChange('username')}
          placeholder="请输入用户名（3-20个字符）"
          disabled={isLoading}
          required
          autoComplete="username"
          className={validationErrors.username ? 'border-red-500' : ''}
        />
        {validationErrors.username && (
          <div className="flex items-center text-sm text-red-600">
            <XCircle className="mr-1 h-3 w-3" />
            {validationErrors.username}
          </div>
        )}
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="reg-password">密码</Label>
        <Input
          id="reg-password"
          type="password"
          value={formData.password}
          onChange={handleInputChange('password')}
          placeholder="请输入密码（至少6个字符）"
          disabled={isLoading}
          required
          autoComplete="new-password"
          className={validationErrors.password ? 'border-red-500' : ''}
        />
        {formData.password && (
          <div className="flex items-center justify-between text-sm">
            <span className="text-gray-600">密码强度：</span>
            <span className={strengthColors[passwordStrength - 1] || 'text-gray-400'}>
              {strengthLabels[passwordStrength - 1] || '无'}
            </span>
          </div>
        )}
        {validationErrors.password && (
          <div className="flex items-center text-sm text-red-600">
            <XCircle className="mr-1 h-3 w-3" />
            {validationErrors.password}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="reg-confirm">确认密码</Label>
        <Input
          id="reg-confirm"
          type="password"
          value={formData.confirmPassword}
          onChange={handleInputChange('confirmPassword')}
          placeholder="请再次输入密码"
          disabled={isLoading}
          required
          autoComplete="new-password"
          className={validationErrors.confirmPassword ? 'border-red-500' : ''}
        />
        {formData.confirmPassword && formData.password === formData.confirmPassword && (
          <div className="flex items-center text-sm text-green-600">
            <CheckCircle className="mr-1 h-3 w-3" />
            密码确认匹配
          </div>
        )}
        {validationErrors.confirmPassword && (
          <div className="flex items-center text-sm text-red-600">
            <XCircle className="mr-1 h-3 w-3" />
            {validationErrors.confirmPassword}
          </div>
        )}
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
              注册中...
            </>
          ) : (
            '注册账号'
          )}
        </Button>

        {onSwitchToLogin && (
          <Button
            type="button"
            variant="ghost"
            onClick={onSwitchToLogin}
            disabled={isLoading}
            className="w-full"
          >
            已有账号？立即登录
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
            <DialogTitle>用户注册</DialogTitle>
          </DialogHeader>
          {FormContent}
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl text-center">创建账号</CardTitle>
        <CardDescription className="text-center">
          注册新账号开始您的冒险之旅
        </CardDescription>
      </CardHeader>
      <CardContent>
        {FormContent}
      </CardContent>
    </Card>
  )
}