import React, { Component, ReactNode } from 'react'
import { Button } from '@/components/ui/button'

interface Props {
  children: ReactNode
  componentName?: string
}

interface State {
  hasError: boolean
  error?: Error
}

export class LazyErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('懒加载组件错误:', {
      component: this.props.componentName,
      error: error.message,
      errorInfo
    })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-medium mb-2">组件加载失败</h3>
            <p className="text-gray-600 mb-4">
              {this.props.componentName || '对话框'}加载时出现错误，请重试。
            </p>
            <div className="flex justify-end gap-2">
              <Button 
                variant="outline" 
                onClick={() => window.location.reload()}
              >
                刷新页面
              </Button>
              <Button 
                onClick={() => this.setState({ hasError: false })}
              >
                重试
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}