import { type NextRequest, NextResponse } from "next/server"
import { getConnection } from "@/lib/database"
import { getAuthFromRequest } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthFromRequest(request)
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "权限不足" }, { status: 403 })
    }

    if (process.env.MYSQL_URL) {
      const connection = await getConnection()
      const [rows] = await connection.execute("SELECT config_key, config_value FROM system_config ORDER BY config_key")

      const config: Record<string, string> = {}
      ;(rows as any[]).forEach((row) => {
        config[row.config_key] = row.config_value
      })

      return NextResponse.json(config)
    } else {
      return NextResponse.json({})
    }
  } catch (error) {
    console.error("Admin system config GET error:", error)
    return NextResponse.json({ error: "服务器错误" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthFromRequest(request)
    if (!user || user.role !== "admin") {
      return NextResponse.json({ error: "权限不足" }, { status: 403 })
    }

    const config = await request.json()

    if (process.env.MYSQL_URL) {
      const connection = await getConnection()

      for (const [key, value] of Object.entries(config)) {
        await connection.execute(
          `INSERT INTO system_config (config_key, config_value) 
           VALUES (?, ?) 
           ON DUPLICATE KEY UPDATE config_value = VALUES(config_value)`,
          [key, String(value)],
        )
      }

      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: "数据库未配置" }, { status: 500 })
    }
  } catch (error) {
    console.error("Admin system config POST error:", error)
    return NextResponse.json({ error: "服务器错误" }, { status: 500 })
  }
}
