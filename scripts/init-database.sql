-- 创建用户表
CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('player', 'admin') DEFAULT 'player',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  last_login TIMESTAMP NULL,
  is_online BOOLEAN DEFAULT FALSE
);

-- 创建系统全局配置表
CREATE TABLE IF NOT EXISTS system_config (
  id INT AUTO_INCREMENT PRIMARY KEY,
  config_key VARCHAR(100) UNIQUE NOT NULL,
  config_value TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- 创建用户个人配置表
CREATE TABLE IF NOT EXISTS user_config (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  config_key VARCHAR(100) NOT NULL,
  config_value TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_config (user_id, config_key)
);

-- 创建剧情节点表
CREATE TABLE IF NOT EXISTS story_nodes (
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
);

-- 创建用户存档表（优化结构）
CREATE TABLE IF NOT EXISTS user_saves (
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
);

-- 创建好友关系表
CREATE TABLE IF NOT EXISTS friendships (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  friend_id INT NOT NULL,
  status ENUM('pending', 'accepted', 'blocked') DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (friend_id) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_friendship (user_id, friend_id)
);

-- 创建多人房间表
CREATE TABLE IF NOT EXISTS game_rooms (
  id INT AUTO_INCREMENT PRIMARY KEY,
  room_code VARCHAR(10) UNIQUE NOT NULL,
  room_name VARCHAR(100) NOT NULL,
  host_id INT NOT NULL,
  max_players INT DEFAULT 4,
  current_players INT DEFAULT 1,
  room_data JSON,
  status ENUM('waiting', 'playing', 'finished') DEFAULT 'waiting',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (host_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 插入默认管理员用户
INSERT IGNORE INTO users (username, password_hash, role) 
VALUES ('admin', '$2b$10$rQZ9QmSTnkKZzjzjzjzjzOeKKKKKKKKKKKKKKKKKKKKKKKKKKKKKKK', 'admin');

-- 插入默认系统配置（全局配置）
INSERT IGNORE INTO system_config (config_key, config_value) VALUES
('aiProvider', 'openai'),
('baseUrl', 'https://api.openai.com'),
('apiKey', ''),
('model', 'gpt-3.5-turbo'),
('modelsPath', '/v1/models'),
('chatPath', '/v1/chat/completions'),
('streamEnabled', 'true'),
('gameMode', 'adventure'),
('maxChoices', '4'),
('storyLength', 'medium'),
('theme', 'system'),
('language', 'zh'),
('customGameModes', '{}'),
('game_title', 'AI剧情游戏'),
('max_save_slots', '5');
