// 认证组件统一导出
export { LoginForm } from './LoginForm'
export { RegisterForm } from './RegisterForm'
export { AuthProvider, ProtectedRoute, useAuthCheck } from './AuthProvider'

// 重新导出类型
export type { LoginCredentials, RegisterData } from '@/stores/authStore'