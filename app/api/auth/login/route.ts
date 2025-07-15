import { type NextRequest, NextResponse } from "next/server"
import { AuthManager } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()

    if (!username || !password) {
      return NextResponse.json({ error: "用户名和密码不能为空" }, { status: 400 })
    }

    const result = await AuthManager.login(username, password)

    if (result.success) {
      return NextResponse.json({
        user: result.user,
        token: result.token,
      })
    } else {
      return NextResponse.json({ error: result.error }, { status: 401 })
    }
  } catch (error) {
    console.error("Login API error:", error)
    return NextResponse.json({ error: "服务器错误" }, { status: 500 })
  }
}
