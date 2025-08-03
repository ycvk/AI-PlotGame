'use client'

import React from 'react'
import { useAuthStore, useUIStore } from '@/stores'
import { useAllHandlers } from '@/hooks'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export const AuthDialogs: React.FC = () => {
  const { loginForm, setLoginForm, registerForm, setRegisterForm } = useAuthStore()
  const { showLogin, setShowLogin, showRegister, setShowRegister } = useUIStore()
  const { handleLogin, handleRegister } = useAllHandlers()

  return (
    <>
      {/* Login Dialog */}
      <Dialog open={showLogin} onOpenChange={setShowLogin}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>用户登录</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="username">用户名</Label>
              <Input
                id="username"
                type="text"
                value={loginForm.username}
                onChange={(e) => setLoginForm({ username: e.target.value })}
                placeholder="请输入用户名"
                required
              />
            </div>
            <div>
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                type="password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ password: e.target.value })}
                placeholder="请输入密码"
                required
              />
            </div>
            <Button type="submit" className="w-full">
              登录
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Register Dialog */}
      <Dialog open={showRegister} onOpenChange={setShowRegister}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>用户注册</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <Label htmlFor="reg-username">用户名</Label>
              <Input
                id="reg-username"
                type="text"
                value={registerForm.username}
                onChange={(e) => setRegisterForm({ username: e.target.value })}
                placeholder="请输入用户名"
                required
              />
            </div>
            <div>
              <Label htmlFor="reg-password">密码</Label>
              <Input
                id="reg-password"
                type="password"
                value={registerForm.password}
                onChange={(e) => setRegisterForm({ password: e.target.value })}
                placeholder="请输入密码"
                required
              />
            </div>
            <div>
              <Label htmlFor="reg-confirm">确认密码</Label>
              <Input
                id="reg-confirm"
                type="password"
                value={registerForm.confirmPassword}
                onChange={(e) => setRegisterForm({ confirmPassword: e.target.value })}
                placeholder="请再次输入密码"
                required
              />
            </div>
            <Button type="submit" className="w-full">
              注册
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </>
  )
}