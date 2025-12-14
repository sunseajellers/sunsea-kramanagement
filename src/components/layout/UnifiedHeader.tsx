'use client'

import Link from 'next/link'
import { Bell, Menu, X, ChevronDown, LogOut, User, Settings, Palette } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { getInitials, cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { getHeaderConfig, updateHeaderConfig, getDefaultHeaderConfig } from '@/lib/headerService'
import { getUserNotifications } from '@/lib/notificationService'
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
  const { userData, loading, logout } = useAuth()
  const [showNotifications, setShowNotifications] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showHeaderConfig, setShowHeaderConfig] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [headerConfig, setHeaderConfig] = useState<HeaderConfig | null>(null)
  const pathname = usePathname()
  const router = useRouter()
  const notificationRef = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const configRef = useRef<HTMLDivElement>(null)

  // Load notifications for the logged-in user
  useEffect(() => {
    if (userData?.uid && mode !== 'public') {
      getUserNotifications(userData.uid).then(setNotifications).catch(console.error)
    }
  }, [userData, mode])

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
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false)
      }
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

  const unreadCount = notifications.filter(n => !n.read).length

  const getNavigation = () => {
    if (customNavigation) return customNavigation
    return headerConfig?.navigation || getDefaultHeaderConfig().navigation
  }

  const navigation = getNavigation()
  const filteredNav = navigation.filter(item =>
    mode === 'public' ? true : item.roles.includes('admin')
  )

  const getThemeColors = (theme: string) => {
    switch (theme) {
      case 'indian':
        return {
          primary: 'from-orange-500 via-red-500 to-green-600',
          hover: 'hover:from-orange-50 hover:to-red-50',
          focus: 'focus:ring-orange-500 focus:border-orange-500',
          text: 'text-orange-600'
        }
      case 'corporate':
        return {
          primary: 'from-blue-600 to-purple-600',
          hover: 'hover:from-blue-50 hover:to-purple-50',
          focus: 'focus:ring-blue-500 focus:border-blue-500',
          text: 'text-blue-600'
        }
      default:
        return {
          primary: 'from-gray-600 to-gray-800',
          hover: 'hover:from-gray-50 hover:to-gray-50',
          focus: 'focus:ring-gray-500 focus:border-gray-500',
          text: 'text-gray-600'
        }
    }
  }

  const theme = headerConfig?.theme || 'indian'
  const colors = getThemeColors(theme)

  if (loading) {
    return (
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="animate-pulse bg-gray-200 h-8 w-32 rounded"></div>
            <div className="animate-pulse bg-gray-200 h-8 w-8 rounded-full"></div>
          </div>
        </div>
      </header>
    )
  }

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo and Title */}
          <div className="flex items-center">
            {headerConfig?.logo && (
              <img src={headerConfig.logo} alt="Logo" className="h-8 w-8 mr-3" />
            )}
            <Link href={mode === 'admin' ? '/dashboard/admin' : '/dashboard'} className="flex items-center">
              <h1 className={cn("text-xl font-bold bg-gradient-to-r", colors.primary, "bg-clip-text text-transparent")}>
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
                    "text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                    pathname === item.href && "bg-gray-100 text-gray-900"
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
                className="hidden md:flex"
              >
                <Palette className="h-4 w-4 mr-2" />
                Customize
              </Button>
            )}

            {/* Notifications - Only for authenticated users */}
            {mode !== 'public' && userData && (
              <div className="relative" ref={notificationRef}>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 text-gray-400 hover:text-gray-500 relative"
                >
                  <Bell className="h-5 w-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-md shadow-lg border z-50">
                    <div className="p-4 border-b">
                      <h3 className="text-sm font-medium text-gray-900">Notifications</h3>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">No notifications</div>
                      ) : (
                        notifications.slice(0, 5).map((notification) => (
                          <div key={notification.id} className="p-4 border-b hover:bg-gray-50">
                            <p className="text-sm text-gray-900">{notification.message}</p>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(notification.createdAt?.toDate?.() || notification.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* User Menu */}
            {mode !== 'public' && userData && (
              <div className="relative" ref={userMenuRef}>
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 p-2 rounded-full hover:bg-gray-100"
                >
                  <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium bg-gradient-to-r", colors.primary)}>
                    {getInitials(userData.fullName)}
                  </div>
                  <ChevronDown className="h-4 w-4 text-gray-500" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border z-50">
                    <div className="p-4 border-b">
                      <p className="text-sm font-medium text-gray-900">{userData.fullName}</p>
                      <p className="text-xs text-gray-500">{userData.email}</p>
                    </div>
                    <div className="py-1">
                      <Link href="/dashboard/profile" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        <User className="h-4 w-4 mr-3" />
                        Profile
                      </Link>
                      <Link href="/dashboard/settings" className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                        <Settings className="h-4 w-4 mr-3" />
                        Settings
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
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
              className="md:hidden p-2 text-gray-400 hover:text-gray-500"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && mode !== 'public' && (
          <div className="md:hidden border-t bg-white">
            <div className="px-2 pt-2 pb-3 space-y-1">
              {filteredNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "block px-3 py-2 rounded-md text-base font-medium",
                    pathname === item.href
                      ? "bg-gray-100 text-gray-900"
                      : "text-gray-700 hover:bg-gray-50 hover:text-gray-900"
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
          <div className="absolute top-full left-0 right-0 bg-white border-t shadow-lg z-40" ref={configRef}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Logo URL</label>
                  <input
                    type="text"
                    value={headerConfig?.logo || ''}
                    onChange={(e) => setHeaderConfig(prev => prev ? {...prev, logo: e.target.value} : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    placeholder="https://example.com/logo.png"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                  <input
                    type="text"
                    value={headerConfig?.title || ''}
                    onChange={(e) => setHeaderConfig(prev => prev ? {...prev, title: e.target.value} : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
                  <select
                    value={headerConfig?.theme || 'indian'}
                    onChange={(e) => setHeaderConfig(prev => prev ? {...prev, theme: e.target.value as any} : null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  >
                    <option value="indian">Indian</option>
                    <option value="corporate">Corporate</option>
                    <option value="default">Default</option>
                  </select>
                </div>
              </div>
              <div className="mt-4 flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowHeaderConfig(false)}>
                  Cancel
                </Button>
                <Button onClick={() => handleHeaderConfigUpdate(headerConfig!)}>
                  Save Changes
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}