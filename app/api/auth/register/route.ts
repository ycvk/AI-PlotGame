import { type NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import jwt from "jsonwebtoken"
import { getConnection } from "@/lib/database"

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ error: "用户名和密码不能为空" }, { status: 400 })
    }

    // 检查是否有数据库连接
    if (!process.env.MYSQL_URL) {
      return NextResponse.json({ error: "数据库未配置，无法注册用户" }, { status: 500 })
    }

    const connection = await getConnection()

    // 检查用户是否已存在
    const [existingUsers] = await connection.execute("SELECT id FROM users WHERE username = ?", [username])

    if ((existingUsers as any[]).length > 0) {
      return NextResponse.json({ error: "用户名已存在" }, { status: 400 })
    }

    // 创建新用户
    const passwordHash = await bcrypt.hash(password, 10)
    const [result] = await connection.execute("INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)", [
      username,
      passwordHash,
      "player",
    ])

    const userId = (result as any).insertId

    // 生成JWT token
    const token = jwt.sign({ id: userId, username, role: "player" }, process.env.JWT_SECRET || "default-secret", {
      expiresIn: "7d",
    })

    return NextResponse.json({
      success: true,
      user: { id: userId, username, role: "player" },
      token,
    })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ error: "注册失败" }, { status: 500 })
  }
}
