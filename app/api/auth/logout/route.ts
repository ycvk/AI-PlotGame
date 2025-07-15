import { type NextRequest, NextResponse } from "next/server"
import { getAuthFromRequest, AuthManager } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthFromRequest(request)

    if (user) {
      await AuthManager.logout(user.id)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Logout API error:", error)
    return NextResponse.json({ error: "服务器错误" }, { status: 500 })
  }
}
