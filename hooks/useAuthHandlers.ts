import { useCallback } from 'react'
import { useAuthStore, useConfigStore, useGameStore, useUIStore } from '@/stores'
import { ClientAuthManager } from '@/lib/auth-client'
import { ClientStoryEngine } from '@/lib/story-engine-client'

export const useAuthHandlers = () => {
  const { 
    user, setUser, 
    loginForm, setLoginForm,
    registerForm, setRegisterForm
  } = useAuthStore()
  const { systemInfo } = useConfigStore()
  const { setEngine, setCurrentNode, setGameRecords } = useGameStore()
  const { 
    setShowLogin, setShowRegister, setShowGameModeSelect, setShowGameSelectionDialog 
  } = useUIStore()

  const initializeStoryEngine = useCallback(async (currentUser: typeof user, hasDatabase: boolean) => {
    if (!currentUser) return
    
    const engine = new ClientStoryEngine(hasDatabase, currentUser.id)
    await engine.loadGameState()
    setEngine(engine)

    const allRecords = engine.getAllGameRecords()
    setGameRecords(allRecords)

    const loadedCurrentNode = engine.getCurrentNode()
    if (loadedCurrentNode) {
      setCurrentNode(loadedCurrentNode)
      setShowGameModeSelect(false)
    } else if (allRecords.length > 0) {
      setShowGameSelectionDialog(true)
      setShowGameModeSelect(false)
    } else {
      setShowGameModeSelect(true)
    }
  }, [setEngine, setCurrentNode, setGameRecords, setShowGameModeSelect, setShowGameSelectionDialog])

  const handleLogin = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()
    const result = await ClientAuthManager.login(loginForm.username, loginForm.password)

    if (result.success && result.user) {
      setUser(result.user)
      localStorage.setItem("auth-token", result.token!)
      setShowLogin(false)
      await initializeStoryEngine(result.user, systemInfo.hasDatabase)
    } else {
      alert(result.error)
    }
  }, [loginForm, setUser, setShowLogin, initializeStoryEngine, systemInfo.hasDatabase])

  const handleRegister = useCallback(async (e: React.FormEvent) => {
    e.preventDefault()

    if (registerForm.password !== registerForm.confirmPassword) {
      alert("密码确认不匹配")
      return
    }

    const result = await ClientAuthManager.register(registerForm.username, registerForm.password)

    if (result.success && result.user) {
      setUser(result.user)
      localStorage.setItem("auth-token", result.token!)
      setShowRegister(false)
      await initializeStoryEngine(result.user, systemInfo.hasDatabase)
    } else {
      alert(result.error)
    }
  }, [registerForm, setUser, setShowRegister, initializeStoryEngine, systemInfo.hasDatabase])

  const handleLogout = useCallback(async () => {
    if (user) {
      await ClientAuthManager.logout()
      setUser(null)
      setEngine(null)
      setCurrentNode(null)
      localStorage.removeItem("auth-token")
      setShowGameModeSelect(false)
      setShowGameSelectionDialog(false)
      setShowLogin(true)
    }
  }, [user, setUser, setEngine, setCurrentNode, setShowGameModeSelect, setShowGameSelectionDialog, setShowLogin])

  return {
    handleLogin,
    handleRegister,
    handleLogout,
    initializeStoryEngine
  }
}