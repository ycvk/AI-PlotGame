import mysql from "mysql2/promise"
import bcrypt from "bcryptjs"

let connection: mysql.Connection | null = null

export async function getConnection(): Promise<mysql.Connection> {
  if (!connection && process.env.MYSQL_URL) {
    try {
      connection = await mysql.createConnection(process.env.MYSQL_URL)
      await initializeDatabase()
    } catch (error) {
      console.error("Database connection failed:", error)
      throw error
    }
  }
  return connection!
}

async function initializeDatabase(): Promise<void> {
  if (!connection) return

  try {
    // 检查表是否存在
    const [tables] = await connection.execute(
      "SELECT COUNT(*) as count FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'users'",
    )

    const tableExists = (tables as any)[0].count > 0

    if (!tableExists) {
      console.log("Initializing database...")

      // 创建用户表
      await connection.execute(`
        CREATE TABLE users (
          id INT AUTO_INCREMENT PRIMARY KEY,
          username VARCHAR(50) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          role ENUM('player', 'admin') DEFAULT 'player',
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          last_login TIMESTAMP NULL,
          is_online BOOLEAN DEFAULT FALSE
        )
      `)

      // 创建系统配置表
      await connection.execute(`
        CREATE TABLE system_config (
          id INT AUTO_INCREMENT PRIMARY KEY,
          config_key VARCHAR(100) UNIQUE NOT NULL,
          config_value TEXT,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `)

      // 创建用户配置表
      await connection.execute(`
        CREATE TABLE user_config (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          config_key VARCHAR(100) NOT NULL,
          config_value TEXT,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          UNIQUE KEY unique_user_config (user_id, config_key)
        )
      `)

      // 创建剧情节点表
      await connection.execute(`
        CREATE TABLE story_nodes (
          id INT AUTO_INCREMENT PRIMARY KEY,
          node_id VARCHAR(100) UNIQUE NOT NULL,
          title VARCHAR(255) NOT NULL,
          content TEXT NOT NULL,
          choices JSON,
          conditions JSON,
          created_by INT,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
        )
      `)

      // 创建用户存档表
      await connection.execute(`
        CREATE TABLE user_saves (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id INT NOT NULL,
          save_name VARCHAR(100) NOT NULL,
          game_name VARCHAR(255) DEFAULT NULL,
          game_mode VARCHAR(50) DEFAULT NULL,
          save_data JSON NOT NULL,
          current_node VARCHAR(100),
          story_nodes JSON DEFAULT NULL,
          total_pages INT DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
          UNIQUE KEY unique_user_save (user_id, save_name),
          INDEX idx_user_updated (user_id, updated_at),
          INDEX idx_game_mode (game_mode)
        )
      `)

      // 创建默认管理员
      const adminUser = process.env.ADMIN_USER || "admin"
      const adminPwd = process.env.ADMIN_PWD || "admin"
      const hashedPassword = await bcrypt.hash(adminPwd, 10)

      await connection.execute("INSERT INTO users (username, password_hash, role) VALUES (?, ?, ?)", [
        adminUser,
        hashedPassword,
        "admin",
      ])

      // 插入默认系统配置
      const defaultConfigs = [
        ["aiProvider", "openai"],
        ["baseUrl", "https://api.openai.com"],
        ["apiKey", ""],
        ["model", "gpt-3.5-turbo"],
        ["modelsPath", "/v1/models"],
        ["chatPath", "/v1/chat/completions"],
        ["streamEnabled", "true"],
        ["gameMode", "adventure"],
        ["maxChoices", "4"],
        ["storyLength", "medium"],
        ["theme", "system"],
        ["language", "zh"],
        ["customGameModes", "{}"],
        ["game_title", "AI剧情游戏"],
        ["max_save_slots", "5"],
      ]

      for (const [key, value] of defaultConfigs) {
        await connection.execute("INSERT INTO system_config (config_key, config_value) VALUES (?, ?)", [key, value])
      }

      console.log("Database initialized successfully")
    }
  } catch (error) {
    console.error("Database initialization failed:", error)
    throw error
  }
}

export async function closeConnection(): Promise<void> {
  if (connection) {
    await connection.end()
    connection = null
  }
}
