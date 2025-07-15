export interface User {
  id: number
  username: string
  role: "player" | "admin"
  isOnline: boolean
}

export interface AuthResult {
  success: boolean
  user?: User
  token?: string
  error?: string
}

export class ClientAuthManager {
  static async login(username: string, password: string): Promise<AuthResult> {
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      })

      if (response.ok) {
        const data = await response.json()
        return { success: true, user: data.user, token: data.token }
      } else {
        const error = await response.json()
        return { success: false, error: error.error }
      }
    } catch (error) {
      return { success: false, error: "网络错误" }
    }
  }

  static async register(username: string, password: string): Promise<AuthResult> {
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      })

      if (response.ok) {
        const data = await response.json()
        return { success: true, user: data.user, token: data.token }
      } else {
        const error = await response.json()
        return { success: false, error: error.error }
      }
    } catch (error) {
      return { success: false, error: "网络错误" }
    }
  }

  static async verifyToken(token: string): Promise<User | null> {
    try {
      const response = await fetch("/api/auth/verify", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        return data.user
      }
      return null
    } catch (error) {
      return null
    }
  }

  static async logout(): Promise<void> {
    try {
      const token = localStorage.getItem("auth-token")
      if (token) {
        await fetch("/api/auth/logout", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        })
      }
    } catch (error) {
      console.error("Logout error:", error)
    }
  }
}
