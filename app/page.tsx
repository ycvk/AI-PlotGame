"use client"

import React, { useEffect, useState, lazy, Suspense } from 'react'
import { useAuthStore, useGameStore, useConfigStore, useUIStore } from '@/stores'
import { useAllHandlers } from '@/hooks'
import { ConfigManager } from '@/lib/config'
import { ClientAuthManager } from '@/lib/auth-client'
import { LazyErrorBoundary } from '@/components/ui/LazyErrorBoundary'
import { DialogSkeleton } from '@/components/ui/DialogSkeleton'
import { getFeatureFlags } from '@/lib/featureFlags'

// Layout Components
import { LoadingScreen } from '@/components/layout/LoadingScreen'
import { WelcomeScreen } from '@/components/layout/WelcomeScreen'
import { GameModeSelection } from '@/components/layout/GameModeSelection'
import { GameInterface } from '@/components/layout/GameInterface'

// Direct imports for fallback
import { AuthDialogs } from '@/components/layout/AuthDialogs'
import { SettingsDialog } from '@/components/layout/SettingsDialog'
import { GameRecordsDialog } from '@/components/layout/GameRecordsDialog'
import { CustomModeDialog } from '@/components/layout/CustomModeDialog'

// Lazy-loaded Dialogs
const LazyAuthDialogs = lazy(() => import('@/components/layout/AuthDialogs').then(m => ({ default: m.AuthDialogs })))
const LazySettingsDialog = lazy(() => import('@/components/layout/SettingsDialog').then(m => ({ default: m.SettingsDialog })))
const LazyGameRecordsDialog = lazy(() => import('@/components/layout/GameRecordsDialog').then(m => ({ default: m.GameRecordsDialog })))
const LazyCustomModeDialog = lazy(() => import('@/components/layout/CustomModeDialog').then(m => ({ default: m.CustomModeDialog })))

export default function GamePage() {
  const [configManager] = useState(() => ConfigManager.getInstance())
  const { initializeStoryEngine } = useAllHandlers()
  
  // State from stores
  const { user, setUser } = useAuthStore()
  const { setEngine, setCurrentNode, setGameRecords } = useGameStore()
  const { systemInfo, setSystemInfo, setConfig, setAvailableModels } = useConfigStore()
  const { 
    isLoading, setIsLoading, showGameModeSelect, setShowGameModeSelect, setShowGameSelectionDialog,
    showLogin, showRegister, showSettings, showGameSelectionDialog: showGameRecordsDialog, showCustomModeDialog
  } = useUIStore()

  useEffect(() => {
    initializeApp()
  }, [])

  const initializeApp = async () => {
    setIsLoading(true)

    await configManager.loadConfig()
    setConfig(() => configManager.getConfig())
    setSystemInfo(configManager.getSystemInfo())
    setAvailableModels(configManager.getAvailableModels())

    const savedToken = localStorage.getItem("auth-token")
    if (savedToken) {
      const savedUser = await ClientAuthManager.verifyToken(savedToken)
      if (savedUser) {
        setUser(savedUser)
        await initializeStoryEngine(savedUser, configManager.getSystemInfo().hasDatabase)
      }
    }

    setIsLoading(false)
  }

  // Determine which component to render
  const renderMainContent = () => {
    if (isLoading) {
      return <LoadingScreen />
    }
    
    if (!user) {
      return <WelcomeScreen />
    }
    
    if (showGameModeSelect) {
      return <GameModeSelection />
    }
    
    return <GameInterface />
  }

  const { lazyLoading } = getFeatureFlags()

  return (
    <>
      {renderMainContent()}
      
      {/* Lazy-loaded Dialogs */}
      {lazyLoading ? (
        <>
          {(showLogin || showRegister) && (
            <LazyErrorBoundary componentName="认证对话框">
              <Suspense fallback={<DialogSkeleton type="auth" />}>
                <LazyAuthDialogs />
              </Suspense>
            </LazyErrorBoundary>
          )}
          
          {showSettings && (
            <LazyErrorBoundary componentName="设置对话框">
              <Suspense fallback={<DialogSkeleton type="settings" />}>
                <LazySettingsDialog />
              </Suspense>
            </LazyErrorBoundary>
          )}
          
          {showGameRecordsDialog && (
            <LazyErrorBoundary componentName="游戏记录对话框">
              <Suspense fallback={<DialogSkeleton type="records" />}>
                <LazyGameRecordsDialog />
              </Suspense>
            </LazyErrorBoundary>
          )}
          
          {showCustomModeDialog && (
            <LazyErrorBoundary componentName="自定义模式对话框">
              <Suspense fallback={<DialogSkeleton type="custom" />}>
                <LazyCustomModeDialog />
              </Suspense>
            </LazyErrorBoundary>
          )}
        </>
      ) : (
        <>
          {/* Fallback to direct imports if lazy loading is disabled */}
          {/* Need to conditionally import these for the fallback case */}
          <AuthDialogs />
          <SettingsDialog />
          <GameRecordsDialog />
          <CustomModeDialog />
        </>
      )}
    </>
  )
}