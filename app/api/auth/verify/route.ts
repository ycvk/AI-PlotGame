import { type NextRequest, NextResponse } from "next/server"
import { AuthManager } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get("authorization")?.replace("Bearer ", "")

    if (!token) {
      return NextResponse.json({ error: "Token required" }, { status: 401 })
    }

    const user = await AuthManager.verifyToken(token)

    if (user) {
      return NextResponse.json({ user })
    } else {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }
  } catch (error) {
    console.error("Verify API error:", error)
    return NextResponse.json({ error: "服务器错误" }, { status: 500 })
  }
}
