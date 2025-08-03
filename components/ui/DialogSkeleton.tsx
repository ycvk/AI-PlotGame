'use client'

import React from 'react'

interface DialogSkeletonProps {
  type?: 'default' | 'settings' | 'records' | 'auth' | 'custom'
}

export const DialogSkeleton: React.FC<DialogSkeletonProps> = ({ type = 'default' }) => {
  const getSkeletonContent = () => {
    switch (type) {
      case 'settings':
        return (
          <>
            {/* 设置对话框骨架 - 多个选项卡 */}
            <div className="flex gap-2 mb-4">
              <div className="h-10 bg-gray-200 rounded w-24 animate-pulse"></div>
              <div className="h-10 bg-gray-200 rounded w-24 animate-pulse"></div>
              <div className="h-10 bg-gray-200 rounded w-24 animate-pulse"></div>
            </div>
            <div className="space-y-4">
              <div className="h-12 bg-gray-200 rounded w-full animate-pulse"></div>
              <div className="h-12 bg-gray-200 rounded w-full animate-pulse"></div>
              <div className="h-12 bg-gray-200 rounded w-3/4 animate-pulse"></div>
            </div>
          </>
        )
      
      case 'records':
        return (
          <>
            {/* 游戏记录骨架 - 列表结构 */}
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="border rounded-lg p-4 space-y-2">
                  <div className="flex justify-between">
                    <div className="h-5 bg-gray-200 rounded w-1/3 animate-pulse"></div>
                    <div className="h-5 bg-gray-200 rounded w-20 animate-pulse"></div>
                  </div>
                  <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
                  <div className="flex gap-2">
                    <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                    <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )
      
      case 'auth':
        return (
          <>
            {/* 认证对话框骨架 - 表单结构 */}
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                <div className="h-10 bg-gray-200 rounded w-full animate-pulse"></div>
              </div>
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                <div className="h-10 bg-gray-200 rounded w-full animate-pulse"></div>
              </div>
              <div className="h-10 bg-gray-200 rounded w-full animate-pulse"></div>
            </div>
          </>
        )
      
      case 'custom':
        return (
          <>
            {/* 自定义模式骨架 - 简单表单 */}
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
              <div className="h-32 bg-gray-200 rounded w-full animate-pulse"></div>
              <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
            </div>
          </>
        )
      
      default:
        return (
          <>
            {/* 默认骨架 */}
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-full animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
            </div>
          </>
        )
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4">
        {/* 标题骨架 */}
        <div className="mb-4">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-2 animate-pulse"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse"></div>
        </div>
        
        {/* 内容骨架 */}
        {getSkeletonContent()}
        
        {/* 按钮骨架 */}
        <div className="flex justify-end gap-2 mt-6">
          <div className="h-10 bg-gray-200 rounded w-20 animate-pulse"></div>
          <div className="h-10 bg-gray-200 rounded w-20 animate-pulse"></div>
        </div>
      </div>
    </div>
  )
}