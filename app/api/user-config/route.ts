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

      // 获取系统默认配置
      const [systemRows] = await connection.execute("SELECT config_key, config_value FROM system_config")

      // 获取用户配置
      const [userRows] = await connection.execute(
        "SELECT config_key, config_value FROM user_config WHERE user_id = ?",
        [user.id],
      )

      const config: Record<string, string> = {}

      // 先加载系统默认配置
      ;(systemRows as any[]).forEach((row) => {
        config[row.config_key] = row.config_value
      })

      // 用户配置覆盖系统配置
      ;(userRows as any[]).forEach((row) => {
        config[row.config_key] = row.config_value
      })

      return NextResponse.json(config)
    } else {
      // 如果没有数据库，返回默认配置
      const defaultConfig = {
        aiProvider: "openai",
        baseUrl: "https://api.openai.com",
        apiKey: "",
        model: "gpt-3.5-turbo",
        modelsPath: "/v1/models",
        chatPath: "/v1/chat/completions",
        streamEnabled: "true",
        gameMode: "adventure",
        maxChoices: "4",
        storyLength: "medium",
        theme: "system",
        language: "zh",
        customGameModes: "{}",
      }
      return NextResponse.json(defaultConfig)
    }
  } catch (error) {
    console.error("User config GET error:", error)
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

      // 保存用户配置
      for (const [key, value] of Object.entries(config)) {
        await connection.execute(
          `INSERT INTO user_config (user_id, config_key, config_value) 
           VALUES (?, ?, ?) 
           ON DUPLICATE KEY UPDATE config_value = VALUES(config_value)`,
          [user.id, key, String(value)],
        )
      }

      return NextResponse.json({ success: true })
    } else {
      // 如果没有数据库，保存到本地存储（客户端处理）
      return NextResponse.json({ success: true })
    }
  } catch (error) {
    console.error("User config POST error:", error)
    return NextResponse.json({ error: "服务器错误" }, { status: 500 })
  }
}
