"use client"

import React, { useEffect, useState } from 'react'
import { useAuthStore, useGameStore, useConfigStore, useUIStore } from '@/stores'
import { useAllHandlers } from '@/hooks'
import { ConfigManager } from '@/lib/config'
import { ClientAuthManager } from '@/lib/auth-client'

// Layout Components
import { LoadingScreen } from '@/components/layout/LoadingScreen'
import { WelcomeScreen } from '@/components/layout/WelcomeScreen'
import { GameModeSelection } from '@/components/layout/GameModeSelection'
import { GameInterface } from '@/components/layout/GameInterface'
import { AuthDialogs } from '@/components/layout/AuthDialogs'
import { SettingsDialog } from '@/components/layout/SettingsDialog'
import { GameRecordsDialog } from '@/components/layout/GameRecordsDialog'
import { CustomModeDialog } from '@/components/layout/CustomModeDialog'

export default function GamePage() {
  const [configManager] = useState(() => ConfigManager.getInstance())
  const { initializeStoryEngine } = useAllHandlers()
  
  // State from stores
  const { user, setUser } = useAuthStore()
  const { setEngine, setCurrentNode, setGameRecords } = useGameStore()
  const { systemInfo, setSystemInfo, setConfig, setAvailableModels } = useConfigStore()
  const { isLoading, setIsLoading, showGameModeSelect, setShowGameModeSelect, setShowGameSelectionDialog } = useUIStore()

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

  return (
    <>
      {renderMainContent()}
      
      {/* Dialogs */}
      <AuthDialogs />
      <SettingsDialog />
      <GameRecordsDialog />
      <CustomModeDialog />
    </>
  )
}