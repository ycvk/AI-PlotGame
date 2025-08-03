/**
 * 功能开关管理
 * 用于控制虚拟滚动和懒加载等性能优化功能的启用/禁用
 */

interface FeatureFlags {
  virtualScroll: boolean
  lazyLoading: boolean
}

export const getFeatureFlags = (): FeatureFlags => {
  if (typeof window === 'undefined') {
    return { virtualScroll: true, lazyLoading: true }
  }

  return {
    virtualScroll: localStorage.getItem('disable-virtual-scroll') !== 'true',
    lazyLoading: localStorage.getItem('disable-lazy-loading') !== 'true'
  }
}

export const setFeatureFlag = (flag: keyof FeatureFlags, enabled: boolean) => {
  if (typeof window === 'undefined') return
  
  const key = flag === 'virtualScroll' ? 'disable-virtual-scroll' : 'disable-lazy-loading'
  
  if (enabled) {
    localStorage.removeItem(key)
  } else {
    localStorage.setItem(key, 'true')
  }
}

export const disableVirtualScroll = () => {
  setFeatureFlag('virtualScroll', false)
  window.location.reload()
}

export const enableVirtualScroll = () => {
  setFeatureFlag('virtualScroll', true)
  window.location.reload()
}

export const disableLazyLoading = () => {
  setFeatureFlag('lazyLoading', false)
  window.location.reload()
}

export const enableLazyLoading = () => {
  setFeatureFlag('lazyLoading', true)
  window.location.reload()
}

// 紧急回滚机制
export const emergencyRollback = {
  disableVirtualScroll,
  disableLazyLoading,
  
  disableAll: () => {
    localStorage.setItem('disable-virtual-scroll', 'true')
    localStorage.setItem('disable-lazy-loading', 'true')
    window.location.reload()
  },
  
  resetAll: () => {
    localStorage.removeItem('disable-virtual-scroll')
    localStorage.removeItem('disable-lazy-loading')
    window.location.reload()
  },
  
  getStatus: () => {
    const flags = getFeatureFlags()
    console.log('功能开关状态:')
    console.log('- 虚拟滚动:', flags.virtualScroll ? '启用' : '禁用')
    console.log('- 懒加载:', flags.lazyLoading ? '启用' : '禁用')
    return flags
  }
}

// 在开发环境下暴露到全局
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  (window as any).featureFlags = {
    getFeatureFlags,
    setFeatureFlag,
    emergencyRollback
  }
  console.log('功能开关已暴露到 window.featureFlags')
}