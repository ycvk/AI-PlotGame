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
      const [rows] = await connection.execute(`
        SELECT 
          us.id,
          us.user_id,
          u.username,
          us.save_name as name,
          COALESCE(us.game_mode, 'unknown') as game_mode,
          us.created_at,
          us.updated_at,
          COALESCE(us.total_pages, 0) as total_pages
        FROM user_saves us
        LEFT JOIN users u ON us.user_id = u.id
        WHERE us.save_name != 'current'
        ORDER BY us.updated_at DESC
      `)

      return NextResponse.json(rows || [])
    } else {
      return NextResponse.json([])
    }
  } catch (error) {
    console.error("Admin game records GET error:", error)
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
    const recordId = searchParams.get("id")

    if (!recordId) {
      return NextResponse.json({ error: "记录ID不能为空" }, { status: 400 })
    }

    if (process.env.MYSQL_URL) {
      const connection = await getConnection()
      await connection.execute("DELETE FROM user_saves WHERE id = ?", [recordId])
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: "数据库未配置" }, { status: 500 })
    }
  } catch (error) {
    console.error("Admin game records DELETE error:", error)
    return NextResponse.json({ error: "服务器错误" }, { status: 500 })
  }
}
