'use client'

import React, { useEffect, useState } from 'react'
import { useAuthStore, useConfigStore, useGameStore, useUIStore } from '@/stores'
import { Loader2 } from 'lucide-react'

interface AuthProviderProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ 
  children, 
  fallback 
}) => {
  const { user, isLoading: authLoading } = useAuthStore()
  const { systemInfo } = useConfigStore()
  const { initializeEngine } = useGameStore()
  const { setActiveTab, setGlobalLoading } = useUIStore()
  
  const [isInitializing, setIsInitializing] = useState(true)
  const [initError, setInitError] = useState<string | null>(null)

  useEffect(() => {
    initializeAuth()
  }, [])

  useEffect(() => {
    // 当用户状态改变时，更新UI状态
    if (!isInitializing) {
      if (user) {
        setActiveTab('game')
        initializeGameEngine()
      } else {
        setActiveTab('login')
      }
    }
  }, [user, isInitializing])

  const initializeAuth = async () => {
    try {
      setIsInitializing(true)
      setGlobalLoading(true, '正在初始化...')
      setInitError(null)

      // 1. 初始化配置管理器
      await useConfigStore.getState().initialize()

      // 2. 初始化认证状态（从localStorage恢复token）
      const token = localStorage.getItem('auth_token')
      if (token) {
        try {
          // 验证token的有效性
          const { verifyToken } = await import('@/lib/auth')
          const userData = await verifyToken(token)
          
          if (userData) {
            useAuthStore.getState().setUser(userData)
          } else {
            // Token无效，清理
            localStorage.removeItem('auth_token')
          }
        } catch (error) {
          console.error('Token verification failed:', error)
          localStorage.removeItem('auth_token')
        }
      }

    } catch (error) {
      console.error('Auth initialization failed:', error)
      setInitError(error instanceof Error ? error.message : '初始化失败')
    } finally {
      setIsInitializing(false)
      setGlobalLoading(false)
    }
  }

  const initializeGameEngine = async () => {
    const currentUser = useAuthStore.getState().user
    if (!currentUser) return

    try {
      const currentSystemInfo = useConfigStore.getState().systemInfo
      await initializeEngine(currentSystemInfo.hasDatabase, currentUser.id)
    } catch (error) {
      console.error('Game engine initialization failed:', error)
      // 不阻止用户使用，只是记录错误
    }
  }

  // 显示初始化加载状态
  if (isInitializing || authLoading) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <div className="text-sm text-muted-foreground">
            正在初始化应用...
          </div>
        </div>
      </div>
    )
  }

  // 显示初始化错误
  if (initError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="max-w-md w-full mx-auto p-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  初始化失败
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  {initError}
                </div>
                <div className="mt-4">
                  <button
                    onClick={() => window.location.reload()}
                    className="bg-red-100 px-3 py-2 text-sm text-red-800 rounded-md hover:bg-red-200 transition-colors"
                  >
                    重新加载
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return <>{children}</>
}

// 认证状态检查Hook
export const useAuthCheck = () => {
  const { user, isAuthenticated } = useAuthStore()
  
  return {
    user,
    isAuthenticated,
    isAdmin: user?.role === 'admin',
    isPlayer: user?.role === 'player'
  }
}

// 需要认证的路由保护组件
export const ProtectedRoute: React.FC<{ 
  children: React.ReactNode
  fallback?: React.ReactNode
  requireAdmin?: boolean
}> = ({ 
  children, 
  fallback,
  requireAdmin = false 
}) => {
  const { user, isAuthenticated } = useAuthCheck()

  if (!isAuthenticated) {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-semibold mb-2">需要登录</h2>
          <p className="text-muted-foreground">请先登录您的账号</p>
        </div>
      </div>
    )
  }

  if (requireAdmin && user?.role !== 'admin') {
    return fallback || (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-lg font-semibold mb-2">权限不足</h2>
          <p className="text-muted-foreground">您没有访问此页面的权限</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}