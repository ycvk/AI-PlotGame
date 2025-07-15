import { type NextRequest, NextResponse } from "next/server"
import { getConnection } from "@/lib/database"
import { getAuthFromRequest } from "@/lib/auth"
import bcrypt from "bcryptjs"

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthFromRequest(request)
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "权限不足" }, { status: 403 })
    }

    if (process.env.MYSQL_URL) {
      const connection = await getConnection()
      const [rows] = await connection.execute(`
        SELECT 
          id, username, role, created_at, updated_at, last_login, is_online
        FROM users 
        ORDER BY created_at DESC
      `)

      return NextResponse.json(rows)
    } else {
      return NextResponse.json([])
    }
  } catch (error) {
    console.error("Admin users GET error:", error)
    return NextResponse.json({ error: "服务器错误" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthFromRequest(request)
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "权限不足" }, { status: 403 })
    }

    const { username, password, role } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ error: "用户名和密码不能为空" }, { status: 400 })
    }

    if (process.env.MYSQL_URL) {
      const connection = await getConnection()
      const passwordHash = await bcrypt.hash(password, 10)

      await connection.execute("INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)", [
        username,
        passwordHash,
        role || "player",
      ])

      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: "数据库未配置" }, { status: 500 })
    }
  } catch (error) {
    console.error("Admin users POST error:", error)
    return NextResponse.json({ error: "服务器错误" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthFromRequest(request)
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "权限不足" }, { status: 403 })
    }

    const { id, username, role, password } = await request.json()

    if (process.env.MYSQL_URL) {
      const connection = await getConnection()

      if (password) {
        const passwordHash = await bcrypt.hash(password, 10)
        await connection.execute("UPDATE users SET username = ?, role = ?, password_hash = ? WHERE id = ?", [
          username,
          role,
          passwordHash,
          id,
        ])
      } else {
        await connection.execute("UPDATE users SET username = ?, role = ? WHERE id = ?", [username, role, id])
      }

      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: "数据库未配置" }, { status: 500 })
    }
  } catch (error) {
    console.error("Admin users PUT error:", error)
    return NextResponse.json({ error: "服务器错误" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthFromRequest(request)
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "权限不足" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("id")

    if (!userId) {
      return NextResponse.json({ error: "用户ID不能为空" }, { status: 400 })
    }

    if (process.env.MYSQL_URL) {
      const connection = await getConnection()
      await connection.execute("DELETE FROM users WHERE id = ?", [userId])
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: "数据库未配置" }, { status: 500 })
    }
  } catch (error) {
    console.error("Admin users DELETE error:", error)
    return NextResponse.json({ error: "服务器错误" }, { status: 500 })
  }
}
