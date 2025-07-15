"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import { Users, GamepadIcon, Settings, Shield, Plus, Edit, Trash2, Home, Activity } from "lucide-react"

interface User {
  id: number
  username: string
  role: string
  created_at: string
  updated_at: string
  last_login: string | null
  is_online: boolean
}

interface GameRecord {
  id: number
  user_id: number
  username: string
  name: string
  game_mode: string
  created_at: string
  updated_at: string
  total_pages: number
}

interface Stats {
  users: {
    total_users: number
    online_users: number
    admin_users: number
  }
  games: {
    total_games: number
    active_players: number
    game_modes: number
  }
  registrations: Array<{
    date: string
    count: number
  }>
}

export default function AdminPage() {
  const [users, setUsers] = useState<User[]>([])
  const [gameRecords, setGameRecords] = useState<GameRecord[]>([])
  const [systemConfig, setSystemConfig] = useState<Record<string, string>>({})
  const [stats, setStats] = useState<Stats | null>(null)
  const [showUserDialog, setShowUserDialog] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [userForm, setUserForm] = useState({ username: "", password: "", role: "player" })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setIsLoading(true)
    try {
      const token = localStorage.getItem("auth-token")
      const headers = { Authorization: `Bearer ${token}` }

      // 加载统计数据
      const statsRes = await fetch("/api/admin/stats", { headers })
      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStats(statsData)
      }

      // 加载用户数据
      const usersRes = await fetch("/api/admin/users", { headers })
      if (usersRes.ok) {
        const usersData = await usersRes.json()
        setUsers(usersData)
      }

      // 加载游戏记录
      const gamesRes = await fetch("/api/admin/game-records", { headers })
      if (gamesRes.ok) {
        const gamesData = await gamesRes.json()
        setGameRecords(gamesData)
      }

      // 加载系统配置
      const configRes = await fetch("/api/admin/system-config", { headers })
      if (configRes.ok) {
        const configData = await configRes.json()
        setSystemConfig(configData)
      }
    } catch (error) {
      console.error("Failed to load admin data:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveUser = async () => {
    try {
      const token = localStorage.getItem("auth-token")
      const method = editingUser ? "PUT" : "POST"
      const body = editingUser ? { ...userForm, id: editingUser.id } : userForm

      const response = await fetch("/api/admin/users", {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      })

      if (response.ok) {
        setShowUserDialog(false)
        setEditingUser(null)
        setUserForm({ username: "", password: "", role: "player" })
        loadData()
      } else {
        const error = await response.json()
        alert(error.error || "操作失败")
      }
    } catch (error) {
      console.error("Failed to save user:", error)
      alert("操作失败")
    }
  }

  const handleDeleteUser = async (userId: number) => {
    if (!confirm("确定要删除这个用户吗？")) return

    try {
      const token = localStorage.getItem("auth-token")
      const response = await fetch(`/api/admin/users?id=${userId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        loadData()
      } else {
        const error = await response.json()
        alert(error.error || "删除失败")
      }
    } catch (error) {
      console.error("Failed to delete user:", error)
      alert("删除失败")
    }
  }

  const handleDeleteGameRecord = async (recordId: number) => {
    if (!confirm("确定要删除这个游戏记录吗？")) return

    try {
      const token = localStorage.getItem("auth-token")
      const response = await fetch(`/api/admin/game-records?id=${recordId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        loadData()
      } else {
        const error = await response.json()
        alert(error.error || "删除失败")
      }
    } catch (error) {
      console.error("Failed to delete game record:", error)
      alert("删除失败")
    }
  }

  const handleSaveSystemConfig = async () => {
    try {
      const token = localStorage.getItem("auth-token")
      const response = await fetch("/api/admin/system-config", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(systemConfig),
      })

      if (response.ok) {
        alert("系统配置保存成功")
      } else {
        const error = await response.json()
        alert(error.error || "保存失败")
      }
    } catch (error) {
      console.error("Failed to save system config:", error)
      alert("保存失败")
    }
  }

  const renderConfigInput = (key: string, value: string) => {
    // 布尔值配置项
    if (key === "streamEnabled") {
      return (
        <div className="flex items-center space-x-2">
          <Switch
            checked={value === "true"}
            onCheckedChange={(checked) =>
              setSystemConfig((prev) => ({
                ...prev,
                [key]: checked ? "true" : "false",
              }))
            }
          />
          <Label>{value === "true" ? "启用" : "禁用"}</Label>
        </div>
      )
    }

    // 数字配置项
    if (["maxChoices", "max_save_slots"].includes(key)) {
      return (
        <Input
          type="number"
          value={value}
          onChange={(e) =>
            setSystemConfig((prev) => ({
              ...prev,
              [key]: e.target.value,
            }))
          }
        />
      )
    }

    // 选择配置项
    if (key === "aiProvider") {
      return (
        <Select
          value={value}
          onValueChange={(newValue) =>
            setSystemConfig((prev) => ({
              ...prev,
              [key]: newValue,
            }))
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="openai">OpenAI</SelectItem>
            <SelectItem value="anthropic">Anthropic</SelectItem>
            <SelectItem value="groq">Groq</SelectItem>
            <SelectItem value="custom">自定义</SelectItem>
          </SelectContent>
        </Select>
      )
    }

    if (key === "storyLength") {
      return (
        <Select
          value={value}
          onValueChange={(newValue) =>
            setSystemConfig((prev) => ({
              ...prev,
              [key]: newValue,
            }))
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="short">短篇</SelectItem>
            <SelectItem value="medium">中篇</SelectItem>
            <SelectItem value="long">长篇</SelectItem>
          </SelectContent>
        </Select>
      )
    }

    if (key === "theme") {
      return (
        <Select
          value={value}
          onValueChange={(newValue) =>
            setSystemConfig((prev) => ({
              ...prev,
              [key]: newValue,
            }))
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="light">浅色</SelectItem>
            <SelectItem value="dark">深色</SelectItem>
            <SelectItem value="system">跟随系统</SelectItem>
          </SelectContent>
        </Select>
      )
    }

    if (key === "language") {
      return (
        <Select
          value={value}
          onValueChange={(newValue) =>
            setSystemConfig((prev) => ({
              ...prev,
              [key]: newValue,
            }))
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="zh">中文</SelectItem>
            <SelectItem value="en">English</SelectItem>
          </SelectContent>
        </Select>
      )
    }

    // JSON配置项
    if (key === "customGameModes") {
      return (
        <Textarea
          value={value}
          onChange={(e) =>
            setSystemConfig((prev) => ({
              ...prev,
              [key]: e.target.value,
            }))
          }
          placeholder="JSON格式的自定义游戏模式"
          rows={4}
        />
      )
    }

    // 默认文本输入
    return (
      <Input
        value={value}
        onChange={(e) =>
          setSystemConfig((prev) => ({
            ...prev,
            [key]: e.target.value,
          }))
        }
        type={key === "apiKey" ? "password" : "text"}
      />
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-lg">正在加载管理面板...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      {/* 顶部导航 */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <Shield className="h-8 w-8 text-amber-500" />
              <h1 className="text-xl font-bold">管理员面板</h1>
            </div>
            <Button variant="outline" onClick={() => window.open("/", "_blank")}>
              <Home className="h-4 w-4 mr-2" />
              返回首页
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <Tabs defaultValue="dashboard" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard">仪表板</TabsTrigger>
            <TabsTrigger value="users">用户管理</TabsTrigger>
            <TabsTrigger value="games">游戏记录</TabsTrigger>
            <TabsTrigger value="config">系统配置</TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            {stats && (
              <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">总用户数</CardTitle>
                      <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.users.total_users}</div>
                      <p className="text-xs text-muted-foreground">
                        在线: {stats.users.online_users} | 管理员: {stats.users.admin_users}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">游戏记录</CardTitle>
                      <GamepadIcon className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stats.games.total_games}</div>
                      <p className="text-xs text-muted-foreground">
                        活跃玩家: {stats.games.active_players} | 游戏模式: {stats.games.game_modes}
                      </p>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">系统状态</CardTitle>
                      <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-green-600">正常</div>
                      <p className="text-xs text-muted-foreground">数据库连接正常</p>
                    </CardContent>
                  </Card>
                </div>

                <Card>
                  <CardHeader>
                    <CardTitle>最近7天用户注册</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {stats.registrations.length > 0 ? (
                        stats.registrations.map((item) => (
                          <div key={item.date} className="flex justify-between items-center">
                            <span className="text-sm">{item.date}</span>
                            <Badge variant="secondary">{item.count} 人</Badge>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">暂无注册数据</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </>
            )}
          </TabsContent>

          <TabsContent value="users" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">用户管理</h2>
              <Button
                onClick={() => {
                  setEditingUser(null)
                  setUserForm({ username: "", password: "", role: "player" })
                  setShowUserDialog(true)
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                添加用户
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>用户名</TableHead>
                      <TableHead>角色</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>注册时间</TableHead>
                      <TableHead>最后登录</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>{user.id}</TableCell>
                        <TableCell>{user.username}</TableCell>
                        <TableCell>
                          <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                            {user.role === "admin" ? "管理员" : "玩家"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant={user.is_online ? "default" : "secondary"}>
                            {user.is_online ? "在线" : "离线"}
                          </Badge>
                        </TableCell>
                        <TableCell>{new Date(user.created_at).toLocaleString()}</TableCell>
                        <TableCell>
                          {user.last_login ? new Date(user.last_login).toLocaleString() : "从未登录"}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setEditingUser(user)
                                setUserForm({
                                  username: user.username,
                                  password: "",
                                  role: user.role,
                                })
                                setShowUserDialog(true)
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => handleDeleteUser(user.id)}>
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="games" className="space-y-6">
            <h2 className="text-2xl font-bold">游戏记录管理</h2>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>ID</TableHead>
                      <TableHead>用户</TableHead>
                      <TableHead>游戏名称</TableHead>
                      <TableHead>游戏模式</TableHead>
                      <TableHead>页数</TableHead>
                      <TableHead>创建时间</TableHead>
                      <TableHead>更新时间</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {gameRecords.map((record) => (
                      <TableRow key={record.id}>
                        <TableCell>{record.id}</TableCell>
                        <TableCell>{record.username}</TableCell>
                        <TableCell>{record.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{record.game_mode}</Badge>
                        </TableCell>
                        <TableCell>{record.total_pages}</TableCell>
                        <TableCell>{new Date(record.created_at).toLocaleString()}</TableCell>
                        <TableCell>{new Date(record.updated_at).toLocaleString()}</TableCell>
                        <TableCell>
                          <Button variant="outline" size="sm" onClick={() => handleDeleteGameRecord(record.id)}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="config" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">系统配置</h2>
              <Button onClick={handleSaveSystemConfig}>
                <Settings className="h-4 w-4 mr-2" />
                保存配置
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>全局系统配置</CardTitle>
                <CardDescription>这些配置将作为所有用户的默认设置</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(systemConfig)
                    .sort(([a], [b]) => a.localeCompare(b))
                    .map(([key, value]) => (
                      <div key={key}>
                        <Label htmlFor={key} className="text-sm font-medium">
                          {key}
                        </Label>
                        {renderConfigInput(key, value)}
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* 用户编辑对话框 */}
        <Dialog open={showUserDialog} onOpenChange={setShowUserDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingUser ? "编辑用户" : "添加用户"}</DialogTitle>
              <DialogDescription>{editingUser ? "修改用户信息" : "创建新用户"}</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="username">用户名</Label>
                <Input
                  id="username"
                  value={userForm.username}
                  onChange={(e) => setUserForm((prev) => ({ ...prev, username: e.target.value }))}
                />
              </div>
              <div>
                <Label htmlFor="password">密码</Label>
                <Input
                  id="password"
                  type="password"
                  value={userForm.password}
                  onChange={(e) => setUserForm((prev) => ({ ...prev, password: e.target.value }))}
                  placeholder={editingUser ? "留空则不修改密码" : "请输入密码"}
                />
              </div>
              <div>
                <Label htmlFor="role">角色</Label>
                <Select
                  value={userForm.role}
                  onValueChange={(value) => setUserForm((prev) => ({ ...prev, role: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="player">玩家</SelectItem>
                    <SelectItem value="admin">管理员</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowUserDialog(false)}>
                取消
              </Button>
              <Button onClick={handleSaveUser}>{editingUser ? "更新" : "创建"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}
