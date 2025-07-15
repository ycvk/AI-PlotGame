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

      // 获取用户统计
      const [userStats] = await connection.execute(`
        SELECT 
          COUNT(*) as total_users,
          SUM(CASE WHEN is_online = 1 THEN 1 ELSE 0 END) as online_users,
          SUM(CASE WHEN role = 'admin' THEN 1 ELSE 0 END) as admin_users
        FROM users
      `)

      // 获取游戏记录统计
      const [gameStats] = await connection.execute(`
        SELECT 
          COUNT(*) as total_games,
          COUNT(DISTINCT user_id) as active_players,
          COUNT(DISTINCT COALESCE(game_mode, 'unknown')) as game_modes
        FROM user_saves 
        WHERE save_name != 'current'
      `)

      // 获取最近7天的用户注册数据
      const [registrationStats] = await connection.execute(`
        SELECT 
          DATE(created_at) as date,
          COUNT(*) as count
        FROM users 
        WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
        GROUP BY DATE(created_at)
        ORDER BY date DESC
      `)

      return NextResponse.json({
        users: (userStats as any[])[0] || { total_users: 0, online_users: 0, admin_users: 0 },
        games: (gameStats as any[])[0] || { total_games: 0, active_players: 0, game_modes: 0 },
        registrations: registrationStats || [],
      })
    } else {
      return NextResponse.json({
        users: { total_users: 0, online_users: 0, admin_users: 0 },
        games: { total_games: 0, active_players: 0, game_modes: 0 },
        registrations: [],
      })
    }
  } catch (error) {
    console.error("Admin stats GET error:", error)
    return NextResponse.json({ error: "服务器错误" }, { status: 500 })
  }
}
