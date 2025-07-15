# AI 剧情游戏系统

## 概述

AI 剧情游戏系统是一个基于 AI 生成的互动故事平台，玩家可以选择不同的游戏模式，体验由 AI 生成的动态故事情节，并通过选择影响故事发展。

## 功能特性

- 🎮 多种预设游戏模式（冒险、悬疑、恐怖、浪漫等）
- 🛠️ 支持自定义游戏模式
- 🤖 可配置的 AI 模型接入（支持 OpenAI、Anthropic、Groq 等）
- 📖 动态故事生成与分支选择及自定义分枝回复
- 📚 多页面故事系统
- 🎒 游戏状态管理（背包、位置、等变量）
- 🔒 用户认证系统（支持数据库和本地存储两种模式）
- ⚙️ 可配置的系统设置
- 💾 游戏存档导入/导出功能

## 环境变量配置

系统运行需要配置以下环境变量：

```env
# JWT 加密密钥（任意字符串）
JWT_SECRET="your jwt secret"

# MySQL 数据库连接（可选，不使用则仅支持单用户）
MYSQL_URL="mysql://用户名:密码@主机名:端口/数据库名"

# 默认管理员账号（必填）
# 若首次设置MYSQL_URL，则下面的用户名和密码会被插入到管理员用户，若不使用MySQL，则下面账户即管理员账户
ADMIN_USER="admin"
ADMIN_PWD="admin"

# AI 提供商配置（可选）
NEXT_PUBLIC_AI_PROVIDER="openai"
NEXT_PUBLIC_AI_API_KEY="sk-apikey"
NEXT_PUBLIC_AI_BASE_URL="https://api.openai.com"
NEXT_PUBLIC_AI_MODELS_PATH="/v1/models"
NEXT_PUBLIC_AI_CHAT_PATH="/v1/chat/completions"
NEXT_PUBLIC_AI_MODEL="gpt-4o-mini"
NEXT_PUBLIC_AI_STREAM_ENABLED=true

# 系统默认设置（可选）
NEXT_PUBLIC_THEME="system"
NEXT_PUBLIC_LANGUAGE="zh"
```
## vercel部署
- fork该项目
- 打开`vercel.com`
- 导入该项目
- 填写管理员用户名和密码等变量
- deploy ＆ enjoy
- option: add your custom domain

## 安装与运行

### 前置要求

- Node.js (推荐 LTS 版本)
- npm 或 yarn
- MySQL (可选，仅在使用数据库模式时需要)

### 安装步骤

1. 克隆仓库：
   ```bash
   git clone https://github.com/eraycc/AI-PlotGame.git
   cd AI-PlotGame
   ```

2. 安装依赖：
   ```bash
   npm install
   # 或
   yarn install
   ```

3. 配置环境变量：
   复制 `.env.example` 为 `.env` 并填写实际配置

4. 运行开发服务器：
   ```bash
   npm run dev
   # 或
   yarn dev
   ```

5. 构建生产版本：
   ```bash
   npm run build
   npm start
   # 或
   yarn build
   yarn start
   ```

## 使用说明

### 用户认证

- 系统支持两种模式：
  - **数据库模式**：完整功能，支持多用户注册
  - **本地模式**：单用户模式，使用默认管理员账号

### 游戏模式

系统提供多种预设游戏模式：

- 冒险探索 🗺️
- 悬疑推理 🔍
- 恐怖惊悚 👻
- 浪漫爱情 💕
- 科幻未来 🚀
- 奇幻魔法 🧙‍♂️

用户也可以创建自定义游戏模式。

### 游戏操作

1. 选择游戏模式
2. 阅读 AI 生成的故事内容
3. 做出选择影响故事发展
4. 查看游戏状态（背包、位置等信息）
5. 可随时保存/加载游戏进度

### 系统设置

在设置面板可以配置：

- AI 提供商和 API 设置
- 游戏参数（默认模式、选择数量等）
- 界面主题和语言
- 管理自定义游戏模式

### 系统管理
在接入MySQL的情况下，支持多用户管理，剧情记录管理，系统默认配置管理。

在接入MySQL的情况下，用户的模型配置数据和剧情记录保存在云端，可多端同步，登录后刷新界面即可自动同步，如果同步失败尝试再次刷新界面。

## 技术栈

- 前端框架：Next.js
- UI 组件：shadcn/ui
- 状态管理：React Context + 自定义管理器
- 认证：JWT
- 数据库：MySQL (可选)
- AI 集成：OpenAI API 兼容接口

## 开发指南

### 项目结构

```
/src
  /components - UI 组件
  /lib - 核心逻辑
    /auth-client - 客户端认证
    /config - 配置管理
    /story-engine-client - 故事引擎
  /pages - 页面路由
  /styles - 全局样式
```

### 扩展功能

1. 添加新游戏模式：
   - 在 `DEFAULT_GAME_MODES` 中添加新条目
   - 或通过 UI 创建自定义模式

2. 支持新 AI 提供商：
   - 在配置管理器中添加对新提供商的支持
   - 更新设置界面中的提供商选项

3. 添加新游戏变量：
   - 修改故事引擎中的状态管理逻辑
   - 更新 UI 显示相关变量

## 常见问题

### 游戏无法启动

1. 检查 AI API 配置是否正确
2. 确保网络连接正常
3. 验证 API 密钥是否有足够权限

### 故事生成失败

1. 尝试重置 AI 配置
2. 检查模型是否可用
3. 调整故事长度设置

### 数据库连接问题

1. 验证 MySQL 服务是否运行
2. 检查连接字符串格式
3. 确保数据库用户有足够权限

## 贡献

目前项目处于起步阶段，很多功能和逻辑还不完善，欢迎提交 Pull Request。

## 许可证

本项目采用Apache-2.0 license许可证开源