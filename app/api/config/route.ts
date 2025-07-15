import { type NextRequest, NextResponse } from "next/server"
import { getConnection } from "@/lib/database"
import { getAuthFromRequest } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: "未授权" }, { status: 401 })
    }

    if (process.env.MYSQL_URL) {
      const connection = await getConnection()

      // 获取用户配置和全局配置
      const [rows] = await connection.execute(
        `
        SELECT config_key, config_value, user_id 
        FROM system_config 
        WHERE user_id = ? OR user_id IS NULL
        ORDER BY user_id DESC
      `,
        [user.id],
      )

      const config: Record<string, string> = {}
      const processedKeys = new Set<string>()

      // 优先使用用户配置，如果没有则使用全局配置
      ;(rows as any[]).forEach((row) => {
        if (!processedKeys.has(row.config_key)) {
          config[row.config_key] = row.config_value
          processedKeys.add(row.config_key)
        }
      })

      return NextResponse.json(config)
    } else {
      return NextResponse.json({})
    }
  } catch (error) {
    console.error("Config GET error:", error)
    return NextResponse.json({ error: "服务器错误" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: "未授权" }, { status: 401 })
    }

    const config = await request.json()

    if (process.env.MYSQL_URL) {
      const connection = await getConnection()

      for (const [key, value] of Object.entries(config)) {
        await connection.execute(
          "INSERT INTO system_config (user_id, config_key, config_value) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE config_value = ?",
          [user.id, key, value, value],
        )
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Config POST error:", error)
    return NextResponse.json({ error: "服务器错误" }, { status: 500 })
  }
}
