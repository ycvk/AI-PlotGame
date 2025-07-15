import { type NextRequest, NextResponse } from "next/server"
import { getConnection } from "@/lib/database"
import { getAuthFromRequest } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const saveName = searchParams.get("saveName")

    if (process.env.MYSQL_URL) {
      const connection = await getConnection()
      let query =
        "SELECT id, user_id, save_name, game_name, game_mode, save_data, current_node, story_nodes, total_pages, created_at, updated_at FROM user_saves WHERE user_id = ?"
      const params: any[] = [user.id]

      if (saveName) {
        query += " AND save_name = ?"
        params.push(saveName)
      }

      query += " ORDER BY updated_at DESC"

      const [rows] = await connection.execute(query, params)
      return NextResponse.json(rows)
    } else {
      return NextResponse.json([])
    }
  } catch (error) {
    console.error("Saves GET error:", error)
    return NextResponse.json({ error: "服务器错误" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthFromRequest(request)
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { saveName, saveData } = await request.json()

    if (!saveName || !saveData) {
      return NextResponse.json({ error: "saveName 和 saveData 不能为空" }, { status: 400 })
    }

    if (process.env.MYSQL_URL) {
      const connection = await getConnection()

      if (saveName === "current_active_game_id") {
        // Special save for the currently active game ID
        await connection.execute(
          `INSERT INTO user_saves (user_id, save_name, save_data) VALUES (?, ?, ?)
           ON DUPLICATE KEY UPDATE save_data = ?, updated_at = NOW()`,
          [user.id, saveName, JSON.stringify(saveData), JSON.stringify(saveData)],
        )
      } else {
        // Regular game save
        const currentNode = saveData?.currentNode || "start"
        const gameName = saveData?.name || saveName
        const gameMode = saveData?.gameMode || "adventure"
        const storyNodes = saveData?.nodes ? JSON.stringify(saveData.nodes) : null
        const totalPages = saveData?.nodes ? saveData.nodes.length : 0

        await connection.execute(
          `INSERT INTO user_saves
           (user_id, save_name, game_name, game_mode, save_data, current_node, story_nodes, total_pages)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
           game_name = ?, game_mode = ?, save_data = ?, current_node = ?,
           story_nodes = ?, total_pages = ?, updated_at = NOW()`,
          [
            user.id,
            saveName,
            gameName,
            gameMode,
            JSON.stringify(saveData),
            currentNode,
            storyNodes,
            totalPages,
            // ON DUPLICATE KEY UPDATE values
            gameName,
            gameMode,
            JSON.stringify(saveData),
            currentNode,
            storyNodes,
            totalPages,
          ],
        )
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Saves POST error:", error)
    return NextResponse.json({ error: "服务器错误" }, { status: 500 })
  }
}
