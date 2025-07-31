import { create } from 'zustand'
import { devtools, subscribeWithSelector } from 'zustand/middleware'
import { AuthManager, type User, type AuthResult } from '@/lib/auth'

export interface LoginCredentials {
  username: string
  password: string
}

export interface RegisterData {
  username: string
  password: string
}

interface AuthStore {
  // 状态
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
  error: string | null
  
  // 表单状态
  loginForm: {
    username: string
    password: string
  }
  registerForm: {
    username: string
    password: string
    confirmPassword: string
  }
  
  // 动作
  login: (credentials: LoginCredentials) => Promise<void>
  register: (userData: RegisterData) => Promise<void>
  logout: () => Promise<void>
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
  clearError: () => void
  
  // 表单控制
  setLoginForm: (form: Partial<AuthStore['loginForm']>) => void
  setRegisterForm: (form: Partial<AuthStore['registerForm']>) => void
  resetLoginForm: () => void
  resetRegisterForm: () => void
  
  // 派生状态
  isAdmin: () => boolean
}

export const useAuthStore = create<AuthStore>()(
  devtools(
    subscribeWithSelector((set, get) => ({
      // 初始状态
      user: null,
      isLoading: false,
      isAuthenticated: false,
      error: null,
      
      // 表单状态
      loginForm: {
        username: '',
        password: ''
      },
      registerForm: {
        username: '',
        password: '',
        confirmPassword: ''
      },
      
      // 登录方法
      login: async (credentials: LoginCredentials) => {
        set({ isLoading: true, error: null })
        
        try {
          const result: AuthResult = await AuthManager.login(credentials.username, credentials.password)
          
          if (result.success && result.user && result.token) {
            // 保存token到localStorage
            localStorage.setItem('auth_token', result.token)
            
            set({
              user: result.user,
              isAuthenticated: true,
              isLoading: false,
              error: null
            })
          } else {
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
              error: result.error || '登录失败'
            })
          }
        } catch (error) {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: error instanceof Error ? error.message : '登录失败'
          })
        }
      },
      
      // 注册方法
      register: async (userData: RegisterData) => {
        set({ isLoading: true, error: null })
        
        try {
          const result: AuthResult = await AuthManager.register(userData.username, userData.password)
          
          if (result.success && result.user && result.token) {
            // 保存token到localStorage
            localStorage.setItem('auth_token', result.token)
            
            set({
              user: result.user,
              isAuthenticated: true,
              isLoading: false,
              error: null
            })
          } else {
            set({
              user: null,
              isAuthenticated: false,
              isLoading: false,
              error: result.error || '注册失败'
            })
          }
        } catch (error) {
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: error instanceof Error ? error.message : '注册失败'
          })
        }
      },
      
      // 登出方法
      logout: async () => {
        const { user } = get()
        
        try {
          if (user) {
            await AuthManager.logout(user.id)
          }
        } catch (error) {
          console.error('Logout error:', error)
        } finally {
          // 清理localStorage
          localStorage.removeItem('auth_token')
          
          set({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            error: null
          })
        }
      },
      
      // 设置用户
      setUser: (user: User | null) => {
        set({
          user,
          isAuthenticated: !!user
        })
      },
      
      // 设置加载状态
      setLoading: (isLoading: boolean) => {
        set({ isLoading })
      },
      
      // 设置错误
      setError: (error: string | null) => {
        set({ error })
      },
      
      // 清除错误
      clearError: () => {
        set({ error: null })
      },
      
      // 表单控制
      setLoginForm: (form: Partial<AuthStore['loginForm']>) => {
        set((state) => ({
          loginForm: { ...state.loginForm, ...form }
        }))
      },
      
      setRegisterForm: (form: Partial<AuthStore['registerForm']>) => {
        set((state) => ({
          registerForm: { ...state.registerForm, ...form }
        }))
      },
      
      resetLoginForm: () => {
        set({
          loginForm: {
            username: '',
            password: ''
          }
        })
      },
      
      resetRegisterForm: () => {
        set({
          registerForm: {
            username: '',
            password: '',
            confirmPassword: ''
          }
        })
      },
      
      // 检查是否为管理员
      isAdmin: () => {
        const { user } = get()
        return user?.role === 'admin'
      }
    })),
    {
      name: 'auth-store',
    }
  )
)

// 初始化认证状态的辅助函数
export const initializeAuth = async () => {
  const token = localStorage.getItem('auth_token')
  
  if (token) {
    try {
      const user = await AuthManager.verifyToken(token)
      if (user) {
        useAuthStore.getState().setUser(user)
      } else {
        // token无效，清理
        localStorage.removeItem('auth_token')
      }
    } catch (error) {
      console.error('Auth initialization error:', error)
      localStorage.removeItem('auth_token')
    }
  }
}