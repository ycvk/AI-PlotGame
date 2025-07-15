import type { GameConfig } from "./config"

export interface StoryContext {
  currentScene: string
  playerChoices: string[]
  gameMode: string
  storyHistory: string[]
  playerInventory: string[]
  gameVariables: Record<string, any>
}

export interface GeneratedStory {
  title: string
  content: string
  choices: Array<{
    id: string
    text: string
    consequence?: string
  }>
  effects?: Record<string, any>
}

export class AIStoryGenerator {
  private config: GameConfig

  constructor(config: GameConfig) {
    this.config = config
  }

  // 更新配置
  updateConfig(config: GameConfig): void {
    this.config = config
  }

  async generateStoryNode(context: StoryContext, onStream?: (content: string) => void): Promise<GeneratedStory | null> {
    try {
      const prompt = this.buildPrompt(context)
      const response = await this.callAI(prompt, onStream)
      return this.parseResponse(response)
    } catch (error) {
      console.error("AI story generation failed:", error)
      return null
    }
  }

  async generateInitialStory(gameMode: string, onStream?: (content: string) => void): Promise<GeneratedStory | null> {
    const context: StoryContext = {
      currentScene: "开始",
      playerChoices: [],
      gameMode,
      storyHistory: [],
      playerInventory: [],
      gameVariables: {},
    }

    const prompt = this.buildInitialPrompt(gameMode)

    try {
      const response = await this.callAI(prompt, onStream)
      return this.parseResponse(response)
    } catch (error) {
      console.error("Initial story generation failed:", error)
      return null
    }
  }

  private buildInitialPrompt(gameMode: string): string {
    const defaultModes = {
      adventure: "冒险探索类游戏，充满未知的世界和挑战",
      mystery: "悬疑推理类游戏，需要解开谜团和找出真相",
      horror: "恐怖惊悚类游戏，营造紧张刺激的氛围",
      romance: "浪漫爱情类游戏，专注于人物关系和情感发展",
      scifi: "科幻类游戏，包含未来科技和太空探索",
      fantasy: "奇幻类游戏，包含魔法、神话生物和超自然元素",
    }

    const language = this.config.language === "zh" ? "中文" : "English"

    // 检查是否为自定义游戏模式
    const customMode = this.config.customGameModes[gameMode]
    let modeDesc: string

    if (customMode) {
      modeDesc = customMode.prompt
    } else {
      modeDesc = defaultModes[gameMode as keyof typeof defaultModes] || defaultModes.adventure
    }

    return `你是一个专业的互动小说作家。请创建一个${modeDesc}的开场剧情。

要求：
1. 使用${language}
2. 创建引人入胜的开场情节
3. 提供${this.config.maxChoices}个有意义的选择
4. 每个选择都应该导向不同的故事发展
5. 保持适当的悬念和吸引力

请按以下JSON格式返回：
{
  "title": "场景标题",
  "content": "详细的场景描述，至少100字",
  "choices": [
    {
      "id": "choice1",
      "text": "选择1的描述",
      "consequence": "这个选择可能的后果提示"
    },
    {
      "id": "choice2", 
      "text": "选择2的描述",
      "consequence": "这个选择可能的后果提示"
    }
  ],
  "effects": {
    "mood": "当前氛围",
    "location": "当前位置"
  }
}`
  }

  private buildPrompt(context: StoryContext): string {
    const language = this.config.language === "zh" ? "中文" : "English"

    return `你是一个专业的互动小说作家。基于以下游戏状态继续故事：

当前场景：${context.currentScene}
游戏模式：${context.gameMode}
玩家历史选择：${context.playerChoices.join(", ") || "无"}
故事历史：${context.storyHistory.slice(-3).join(" -> ") || "刚开始"}
玩家物品：${context.playerInventory.join(", ") || "无"}
游戏变量：${JSON.stringify(context.gameVariables)}

要求：
1. 使用${language}
2. 根据玩家之前的选择自然地推进故事
3. 保持与游戏模式的一致性
4. 提供${this.config.maxChoices}个有意义的选择
5. 每个选择都应该有不同的后果和发展方向
6. 适当使用游戏变量和物品

请按以下JSON格式返回：
{
  "title": "场景标题",
  "content": "详细的场景描述和故事发展，至少150字",
  "choices": [
    {
      "id": "choice1",
      "text": "选择1的描述",
      "consequence": "这个选择的可能后果"
    }
  ],
  "effects": {
    "add_item": "新获得的物品（如果有）",
    "remove_item": "失去的物品（如果有）",
    "set_variable": "设置的游戏变量",
    "mood": "当前氛围",
    "location": "当前位置"
  }
}`
  }

  private async callAI(prompt: string, onStream?: (content: string) => void): Promise<string> {
    const baseUrl = this.config.baseUrl.replace(/\/$/, "")
    const chatPath = this.config.chatPath.startsWith("/") ? this.config.chatPath : `/${this.config.chatPath}`
    const chatUrl = `${baseUrl}${chatPath}`

    console.log("AI Request URL:", chatUrl)
    console.log("AI Request Config:", {
      baseUrl: this.config.baseUrl,
      chatPath: this.config.chatPath,
      model: this.config.model,
      streamEnabled: this.config.streamEnabled,
      hasApiKey: !!this.config.apiKey,
    })

    const requestBody = {
      model: this.config.model,
      messages: [
        {
          role: "system",
          content: "你是一个专业的互动小说作家，擅长创作引人入胜的故事情节。请严格按照JSON格式返回结果。",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      temperature: 0.8,
      max_tokens: 1000,
      stream: this.config.streamEnabled,
    }

    const response = await fetch(chatUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.config.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`AI API request failed: ${response.status} - ${errorText}`)
    }

    if (this.config.streamEnabled && onStream) {
      return this.handleStreamResponse(response, onStream)
    } else {
      const data = await response.json()
      return data.choices[0]?.message?.content || ""
    }
  }

  private async handleStreamResponse(response: Response, onStream: (content: string) => void): Promise<string> {
    const reader = response.body?.getReader()
    if (!reader) throw new Error("No response body")

    let fullContent = ""
    const decoder = new TextDecoder()

    try {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        const chunk = decoder.decode(value)
        const lines = chunk.split("\n")

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const data = line.slice(6)
            if (data === "[DONE]") continue

            try {
              const parsed = JSON.parse(data)
              const content = parsed.choices?.[0]?.delta?.content
              if (content) {
                fullContent += content
                onStream(content)
              }
            } catch (e) {
              // 忽略解析错误
            }
          }
        }
      }
    } finally {
      reader.releaseLock()
    }

    return fullContent
  }

  private parseResponse(response: string): GeneratedStory | null {
    try {
      // 尝试提取JSON部分
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (!jsonMatch) {
        throw new Error("No JSON found in response")
      }

      const parsed = JSON.parse(jsonMatch[0])

      // 验证必要字段
      if (!parsed.title || !parsed.content || !parsed.choices) {
        throw new Error("Missing required fields")
      }

      // 确保choices有正确的格式
      parsed.choices = parsed.choices.map((choice: any, index: number) => ({
        id: choice.id || `choice${index + 1}`,
        text: choice.text || `选择 ${index + 1}`,
        consequence: choice.consequence,
      }))

      return parsed as GeneratedStory
    } catch (error) {
      console.error("Failed to parse AI response:", error)
      console.error("Raw response:", response)
      return null
    }
  }
}
