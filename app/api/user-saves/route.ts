import { type NextRequest, NextResponse } from "next/server"
import { getConnection } from "@/lib/database"
import { getAuthFromRequest } from "@/lib/auth"

export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: "未授权" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const saveName = searchParams.get("saveName")

    if (!saveName) {
      return NextResponse.json({ error: "存档名称不能为空" }, { status: 400 })
    }

    if (process.env.MYSQL_URL) {
      const connection = await getConnection()
      // Delete based on user_id and save_name
      await connection.execute("DELETE FROM user_saves WHERE user_id = ? AND save_name = ?", [user.id, saveName])
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ error: "数据库未配置" }, { status: 500 })
    }
  } catch (error) {
    console.error("User game saves DELETE error:", error)
    return NextResponse.json({ error: "服务器错误" }, { status: 500 })
  }
}
