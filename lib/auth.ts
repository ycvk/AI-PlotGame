import type { NextRequest } from "next/server"
import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"
import { getConnection } from "./database"

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key"

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

export class AuthManager {
  static async login(username: string, password: string): Promise<AuthResult> {
    const configManager = await import("./config").then((m) => m.ConfigManager.getInstance())
    const systemInfo = configManager.getSystemInfo()

    if (!systemInfo.hasDatabase) {
      // 单机模式：只允许管理员登录
      const adminUser = process.env.ADMIN_USER || "admin"
      const adminPwd = process.env.ADMIN_PWD || "admin"
      if (username === adminUser && password === adminPwd) {
        const user: User = {
          id: 1,
          username: adminUser,
          role: adminPwd,
          isOnline: true,
        }
        const token = jwt.sign({ userId: user.id, username: user.username, role: user.role }, JWT_SECRET)
        return { success: true, user, token }
      }
      return { success: false, error: "用户名或密码错误" }
    }

    try {
      const connection = await getConnection()
      const [rows] = await connection.execute(
        "SELECT id, username, password_hash, role FROM users WHERE username = ?",
        [username],
      )

      const users = rows as any[]
      if (users.length === 0) {
        return { success: false, error: "用户不存在" }
      }

      const user = users[0]
      const isValidPassword = await bcrypt.compare(password, user.password_hash)

      if (!isValidPassword) {
        return { success: false, error: "密码错误" }
      }

      // 更新在线状态和最后登录时间
      await connection.execute("UPDATE users SET is_online = TRUE, last_login = NOW() WHERE id = ?", [user.id])

      const authUser: User = {
        id: user.id,
        username: user.username,
        role: user.role,
        isOnline: true,
      }

      const token = jwt.sign({ userId: user.id, username: user.username, role: user.role }, JWT_SECRET, {
        expiresIn: "7d",
      })

      return { success: true, user: authUser, token }
    } catch (error) {
      console.error("Login error:", error)
      return { success: false, error: "登录失败" }
    }
  }

  static async register(username: string, password: string): Promise<AuthResult> {
    const configManager = await import("./config").then((m) => m.ConfigManager.getInstance())
    const systemInfo = configManager.getSystemInfo()

    if (!systemInfo.hasDatabase) {
      return { success: false, error: "单机模式不支持注册" }
    }

    try {
      const connection = await getConnection()

      // 检查用户名是否已存在
      const [existing] = await connection.execute("SELECT id FROM users WHERE username = ?", [username])

      if ((existing as any[]).length > 0) {
        return { success: false, error: "用户名已存在" }
      }

      // 创建新用户
      const hashedPassword = await bcrypt.hash(password, 10)
      const [result] = await connection.execute("INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)", [
        username,
        hashedPassword,
        "player",
      ])

      const userId = (result as any).insertId
      const user: User = {
        id: userId,
        username,
        role: "player",
        isOnline: true,
      }

      const token = jwt.sign({ userId, username, role: "player" }, JWT_SECRET, { expiresIn: "7d" })

      return { success: true, user, token }
    } catch (error) {
      console.error("Register error:", error)
      return { success: false, error: "注册失败" }
    }
  }

  static async verifyToken(token: string): Promise<User | null> {
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as any
      return {
        id: decoded.userId,
        username: decoded.username,
        role: decoded.role,
        isOnline: true,
      }
    } catch (error) {
      return null
    }
  }

  static async logout(userId: number): Promise<void> {
    const configManager = await import("./config").then((m) => m.ConfigManager.getInstance())
    const systemInfo = configManager.getSystemInfo()

    if (systemInfo.hasDatabase) {
      try {
        const connection = await getConnection()
        await connection.execute("UPDATE users SET is_online = FALSE WHERE id = ?", [userId])
      } catch (error) {
        console.error("Logout error:", error)
      }
    }
  }
}

export function getAuthFromRequest(request: NextRequest): User | null {
  const token = request.headers.get("authorization")?.replace("Bearer ", "")
  if (!token) return null

  return AuthManager.verifyToken(token) as any
}
