'use client'

import Link from 'next/link'
import { Menu, X, ChevronDown, LogOut, User, Settings, Palette } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { getInitials, cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { getHeaderConfig, updateHeaderConfig, getDefaultHeaderConfig } from '@/lib/headerService'
import { HeaderConfig } from '@/types'
import { usePathname, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'

export type HeaderMode = 'public' | 'dashboard' | 'admin'

interface UnifiedHeaderProps {
  mode?: HeaderMode
  customTitle?: string
  customNavigation?: Array<{ name: string, href: string, roles: string[] }>
  onHeaderConfigChange?: (config: HeaderConfig) => void
  showAdminControls?: boolean
}

export default function UnifiedHeader({
  mode = 'dashboard',
  customTitle,
  customNavigation,
  onHeaderConfigChange,
  showAdminControls = false
}: UnifiedHeaderProps) {
  const { userData, loading, logout, isAdmin } = useAuth()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showHeaderConfig, setShowHeaderConfig] = useState(false)
  const [headerConfig, setHeaderConfig] = useState<HeaderConfig | null>(null)
  const pathname = usePathname()
  const router = useRouter()
  const userMenuRef = useRef<HTMLDivElement>(null)
  const configRef = useRef<HTMLDivElement>(null)

  // Load header configuration
  useEffect(() => {
    if (mode === 'admin') {
      const loadHeaderConfig = async () => {
        const config = await getHeaderConfig()
        setHeaderConfig(config || getDefaultHeaderConfig())
      }
      loadHeaderConfig()
    } else {
      setHeaderConfig(getDefaultHeaderConfig())
    }
  }, [mode])

  // Handle click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false)
      }
      if (configRef.current && !configRef.current.contains(event.target as Node)) {
        setShowHeaderConfig(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleLogout = async () => {
    try {
      await logout()
      router.push('/')
    } catch (error) {
      console.error('Failed to logout:', error)
    }
  }

  const handleHeaderConfigUpdate = async (newConfig: HeaderConfig) => {
    if (mode === 'admin') {
      await updateHeaderConfig(newConfig)
      setHeaderConfig(newConfig)
      onHeaderConfigChange?.(newConfig)
    }
  }

  const getNavigation = () => {
    if (customNavigation) return customNavigation
    return headerConfig?.navigation || getDefaultHeaderConfig().navigation
  }

  const navigation = getNavigation()
  const filteredNav = navigation.filter(item => {
    if (mode === 'public') return true
    if (isAdmin) return item.roles.includes('admin')
    return item.roles.includes('user')
  })

  if (loading) {
    return (
      <header className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="animate-pulse bg-gray-100 h-8 w-32 rounded"></div>
            <div className="animate-pulse bg-gray-100 h-8 w-8 rounded-full"></div>
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className="fixed top-0 left-0 w-full z-40 backdrop-blur-xl bg-white/70 border-b border-white/50 shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Title */}
          <div className="flex items-center">
            {headerConfig?.logo && (
              <img src={headerConfig.logo} alt="Logo" className="h-8 w-8 mr-3 object-contain" />
            )}
            <Link href={mode === 'admin' ? '/dashboard/admin' : '/dashboard'} className="flex items-center">
              <h1 className="text-xl font-bold text-blue-600">
                {customTitle || headerConfig?.title || 'JewelMatrix'}
              </h1>
            </Link>
          </div>

          {/* Navigation - Only show for dashboard and admin modes */}
          {mode !== 'public' && (
            <nav className="hidden md:flex space-x-8">
              {filteredNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "text-gray-600 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    pathname === item.href && "text-blue-600 bg-blue-50"
                  )}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          )}

          {/* Right side actions */}
          <div className="flex items-center space-x-4">
            {/* Admin Controls */}
            {mode === 'admin' && showAdminControls && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowHeaderConfig(!showHeaderConfig)}
                className="hidden md:flex border-gray-300 text-gray-700"
              >
                <Palette className="h-4 w-4 mr-2" />
                Customize UI
              </Button>
            )}

            {/* User Menu */}
            {mode !== 'public' && userData && (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 p-1 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold bg-blue-600 ring-2 ring-white">
                    {getInitials(userData.fullName)}
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border z-50 overflow-hidden">
                    <div className="p-4 border-b bg-gray-50">
                      <p className="text-sm font-bold text-gray-900 truncate">{userData.fullName}</p>
                      <p className="text-xs text-gray-500 truncate">{userData.email}</p>
                    </div>
                    <div className="py-1">
                      <Link href="/dashboard/profile" className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        <User className="h-4 w-4 mr-3 text-gray-400" />
                        My Profile
                      </Link>
                      <Link href="/dashboard/settings" className="flex items-center px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                        <Settings className="h-4 w-4 mr-3 text-gray-400" />
                        Settings
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <LogOut className="h-4 w-4 mr-3" />
                        Sign out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-gray-500 hover:text-blue-600 transition-colors"
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && mode !== 'public' && (
          <div className="md:hidden border-t bg-white animate-in slide-in-from-top duration-200">
            <div className="px-2 pt-2 pb-6 space-y-1">
              {filteredNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "block px-4 py-3 rounded-lg text-base font-medium transition-colors",
                    pathname === item.href
                      ? "bg-blue-50 text-blue-600"
                      : "text-gray-700 hover:bg-gray-50 hover:text-blue-600"
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Admin Header Configuration Panel */}
        {mode === 'admin' && showHeaderConfig && (
          <div className="absolute top-full left-0 right-0 bg-white border-t border-b shadow-xl z-40" ref={configRef}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Logo URL</label>
                  <input
                    type="text"
                    value={headerConfig?.logo || ''}
                    onChange={(e) => setHeaderConfig(prev => prev ? { ...prev, logo: e.target.value } : null)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                    placeholder="https://example.com/logo.png"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Dashboard Title</label>
                  <input
                    type="text"
                    value={headerConfig?.title || ''}
                    onChange={(e) => setHeaderConfig(prev => prev ? { ...prev, title: e.target.value } : null)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end space-x-3">
                <Button variant="ghost" onClick={() => setShowHeaderConfig(false)}>
                  Cancel
                </Button>
                <Button onClick={() => handleHeaderConfigUpdate(headerConfig!)} className="bg-blue-600 hover:bg-blue-700 text-white">
                  Save Appearance
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}