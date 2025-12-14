'use client'

import Link from 'next/link'
import { Bell, Search, Menu, X, ChevronDown, LogOut, User, Settings, Flag, Palette, Globe, Shield } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { getInitials, getAvatarColor, cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { getHeaderConfig, updateHeaderConfig, getDefaultHeaderConfig } from '@/lib/headerService';
import { getUserNotifications } from '@/lib/notificationService';
import { HeaderConfig } from '@/types';
import { usePathname, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

interface AdminHeaderProps {
  customLogo?: string
  customTitle?: string
  customNavigation?: Array<{ name: string, href: string, roles: string[] }>
  onHeaderConfigChange?: (config: AdminHeaderConfig) => void
}

interface AdminHeaderConfig {
  logo: string
  title: string
  navigation: Array<{ name: string, href: string, roles: string[] }>
  theme: 'default' | 'indian' | 'corporate'
}

export default function AdminHeader({
  customLogo,
  customTitle = "JewelMatrix Admin",
  customNavigation,
  onHeaderConfigChange
}: AdminHeaderProps) {
  const { userData, loading, logout } = useAuth()
  const [showNotifications, setShowNotifications] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showHeaderConfig, setShowHeaderConfig] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  const [headerConfig, setHeaderConfig] = useState<AdminHeaderConfig>({
    logo: customLogo || '',
    title: customTitle,
    navigation: customNavigation || [],
    theme: 'indian'
  })
  const pathname = usePathname()
  const router = useRouter()
  const notificationRef = useRef<HTMLDivElement>(null)
  const userMenuRef = useRef<HTMLDivElement>(null)
  const configRef = useRef<HTMLDivElement>(null)

  // Load notifications for the logged-in user
  useEffect(() => {
    if (userData?.uid) {
      getUserNotifications(userData.uid).then(setNotifications).catch(console.error)
    }
  }, [userData])

  // Load header configuration
  useEffect(() => {
    const loadHeaderConfig = async () => {
      const config = await getHeaderConfig();
      if (config) {
        setHeaderConfig(config);
      }
    };
    loadHeaderConfig();
  }, [])

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

  const handleConfigSave = async () => {
    try {
      await updateHeaderConfig(headerConfig as HeaderConfig);
      setShowHeaderConfig(false);
      // Optionally show success message
    } catch (error) {
      console.error('Failed to save header config:', error);
      // Optionally show error message
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length

  const defaultNavigation = [
    { name: 'The Hub', href: '/dashboard', roles: ['admin', 'manager', 'employee'] },
    { name: 'Goals & Vibes', href: '/dashboard/kras', roles: ['admin', 'manager', 'employee'] },
    { name: 'To-Do\'s', href: '/dashboard/tasks', roles: ['admin', 'manager', 'employee'] },
    { name: 'Stats & Wins', href: '/dashboard/reports', roles: ['admin', 'manager', 'employee'] },
    { name: 'The Squad', href: '/dashboard/team', roles: ['admin', 'manager'] },
    { name: 'Control Center', href: '/dashboard/admin', roles: ['admin'] },
    { name: 'Roles', href: '/dashboard/admin/roles', roles: ['admin'] },
  ]

  const navigation = customNavigation || defaultNavigation
  const filteredNav = navigation.filter(item => item.roles.includes(userData?.role || 'admin'))

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
          primary: 'from-primary-600 to-secondary-600',
          hover: 'hover:from-primary-50 hover:to-secondary-50',
          focus: 'focus:ring-primary-500 focus:border-primary-500',
          text: 'text-primary-600'
        }
    }
  }

  const themeColors = getThemeColors(headerConfig.theme)

  if (loading) {
    return (
      <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-center items-center">
        <span className="text-gray-600">Loading admin header...</span>
      </header>
    )
  }

  return (
    <header className="bg-white/80 backdrop-blur-md border-b border-white/20 shadow-lg px-4 py-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between space-x-4">
        <div className="flex items-center space-x-6">
          <Link href="/dashboard/admin" className="flex items-center space-x-3 group">
            <div className={`w-10 h-10 bg-gradient-to-br ${themeColors.primary} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform relative`}>
              {headerConfig.logo ? (
                <img src={headerConfig.logo} alt="Logo" className="w-6 h-6" />
              ) : (
                <Shield className="w-6 h-6 text-white" />
              )}
              {/* Indian Flag indicator */}
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-gradient-to-br from-orange-400 via-white to-green-400 rounded-full border border-white"></div>
            </div>
            <span className={`text-xl font-bold bg-gradient-to-r ${themeColors.primary} bg-clip-text text-transparent hidden sm:inline`}>
              {headerConfig.title}
            </span>
          </Link>

          {/* Navigation links */}
          <nav className="hidden md:flex items-center space-x-2">
            {filteredNav.map((item) => {
              const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200',
                    isActive
                      ? `bg-gradient-to-r ${themeColors.primary} text-white shadow-lg transform scale-105`
                      : `text-gray-600 ${themeColors.hover} hover:${themeColors.text}`
                  )}
                >
                  {item.name}
                </Link>
              )
            })}
          </nav>
        </div>

        <div className="flex-1 px-4">
          <div className="relative max-w-lg mx-auto">
            <Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400`} />
            <input
              type="text"
              placeholder="Search tasks, KRAs, users, or teams..."
              className={`w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 ${themeColors.focus} outline-none transition-all bg-gray-50/50 backdrop-blur-sm hover:bg-white/50`}
            />
          </div>
        </div>

        {/* Right: Admin Controls, Notifications & User */}
        <div className="flex items-center space-x-4">
          {/* Header Config Button */}
          <div className="relative" ref={configRef}>
            <button
              onClick={() => setShowHeaderConfig(!showHeaderConfig)}
              className={`relative p-3 ${themeColors.hover} rounded-xl transition-all duration-200 group`}
              title="Configure Header"
            >
              <Palette className={`w-5 h-5 text-gray-600 group-hover:${themeColors.text} transition-colors`} />
            </button>

            {showHeaderConfig && (
              <div className="absolute right-0 mt-3 w-96 bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 z-50 animate-scale-in">
                <div className="p-6 border-b border-gray-200/50 bg-gradient-to-r from-gray-50/50 to-white/50">
                  <h3 className="font-bold text-gray-900 text-lg flex items-center gap-2">
                    <Palette className="w-5 h-5" />
                    Header Configuration
                  </h3>
                  <p className="text-sm text-gray-600 mt-1">Customize the header for all users</p>
                </div>
                <div className="p-6 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                    <input
                      type="text"
                      value={headerConfig.title}
                      onChange={(e) => setHeaderConfig(prev => ({ ...prev, title: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter header title"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Logo URL</label>
                    <input
                      type="text"
                      value={headerConfig.logo}
                      onChange={(e) => setHeaderConfig(prev => ({ ...prev, logo: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Enter logo URL"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
                    <select
                      value={headerConfig.theme}
                      onChange={(e) => setHeaderConfig(prev => ({ ...prev, theme: e.target.value as any }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="indian">Indian (Orange-Red-Green)</option>
                      <option value="corporate">Corporate (Blue-Purple)</option>
                      <option value="default">Default</option>
                    </select>
                  </div>
                  <div className="flex gap-3 pt-4">
                    <Button onClick={handleConfigSave} className="flex-1">
                      Save Changes
                    </Button>
                    <Button variant="outline" onClick={() => setShowHeaderConfig(false)} className="flex-1">
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className={`relative p-3 ${themeColors.hover} rounded-xl transition-all duration-200 group`}
            >
              <Bell className={`w-5 h-5 text-gray-600 group-hover:${themeColors.text} transition-colors`} />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 -mt-1 -mr-1 w-5 h-5 bg-gradient-to-r from-red-500 to-red-600 text-white text-xs rounded-full flex items-center justify-center shadow-lg animate-pulse">
                  {unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-3 w-80 bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 z-50 animate-scale-in">
                <div className="p-6 border-b border-gray-200/50 bg-gradient-to-r from-gray-50/50 to-white/50">
                  <h3 className="font-bold text-gray-900 text-lg">Admin Notifications</h3>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.slice(0, 5).map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 border-b border-gray-100/50 hover:bg-gradient-to-r hover:from-blue-50/30 hover:to-purple-50/30 cursor-pointer transition-all duration-200 ${!notification.read ? 'bg-gradient-to-r from-blue-50/50 to-purple-50/50' : ''}`}>
                      <p className="font-semibold text-sm text-gray-900">{notification.title}</p>
                      <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
                <div className="p-4 border-t border-gray-200/50 text-center bg-gradient-to-r from-gray-50/50 to-white/50 rounded-b-2xl">
                  <button className={`text-sm ${themeColors.text} hover:${themeColors.text.replace('600', '700')} font-semibold hover:bg-blue-50 px-3 py-1 rounded-lg transition-colors`}>
                    View All Notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-gray-900">{userData?.fullName || 'Admin'}</p>
              <p className="text-xs text-gray-500 capitalize">
                {userData?.role || 'admin'}
                <span className="text-green-600 font-bold ml-1">ADMIN</span>
              </p>
            </div>
            <div className="relative" ref={userMenuRef}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className={`flex items-center space-x-2 ${themeColors.hover} rounded-xl p-2 transition-all duration-200 group`}
              >
                <div className={`w-10 h-10 bg-gradient-to-br ${getAvatarColor(userData?.fullName || '')} rounded-full flex items-center justify-center text-black font-semibold shadow-lg group-hover:scale-110 transition-transform`}
                >
                  {getInitials(userData?.fullName || '')}
                </div>
                <ChevronDown className={`w-4 h-4 text-gray-600 group-hover:${themeColors.text} transition-colors`} />
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-3 w-56 bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 z-50 animate-scale-in">
                  <div className="p-4 border-b border-gray-200/50 bg-gradient-to-r from-gray-50/50 to-white/50 rounded-t-2xl">
                    <p className="text-sm font-semibold text-gray-900">{userData?.fullName || 'Admin'}</p>
                    <p className="text-xs text-gray-500">{userData?.email}</p>
                  </div>
                  <div className="py-2">
                    <Link
                      href="/dashboard/profile"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center space-x-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-purple-50/50 transition-all duration-200 rounded-lg mx-2"
                    >
                      <User className="w-4 h-4" />
                      <span>Profile</span>
                    </Link>
                    <Link
                      href="/dashboard/settings"
                      onClick={() => setShowUserMenu(false)}
                      className="flex items-center space-x-3 w-full px-4 py-3 text-sm text-gray-700 hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-purple-50/50 transition-all duration-200 rounded-lg mx-2"
                    >
                      <Settings className="w-4 h-4" />
                      <span>Settings</span>
                    </Link>
                  </div>
                  <div className="border-t border-gray-200/50 rounded-b-2xl bg-gradient-to-r from-gray-50/50 to-white/50">
                    <button
                      onClick={handleLogout}
                      className="flex items-center space-x-3 w-full px-4 py-3 text-sm text-red-600 hover:bg-gradient-to-r hover:from-red-50 hover:to-red-100 transition-all duration-200 rounded-lg mx-2"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
            aria-label="Toggle menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 z-40 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Menu */}
          <div className="fixed top-16 right-0 bottom-0 w-64 bg-white shadow-2xl z-50 md:hidden animate-slide-in overflow-y-auto">
            <div className="p-4">
              {/* User Info */}
              <div className="flex items-center space-x-3 pb-4 border-b border-gray-200 mb-4">
                <div className={`w-12 h-12 bg-gradient-to-br ${getAvatarColor(userData?.fullName || '')} rounded-full flex items-center justify-center text-white font-semibold`}>
                  {getInitials(userData?.fullName || '')}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{userData?.fullName || 'Admin'}</p>
                  <p className="text-xs text-gray-500 capitalize">{userData?.role || 'admin'}</p>
                </div>
              </div>

              {/* Navigation Links */}
              <nav className="space-y-1">
                {filteredNav.map((item) => {
                  const isActive = pathname === item.href || pathname?.startsWith(item.href + '/')
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        'block px-4 py-3 rounded-lg text-sm font-medium transition-colors',
                        isActive
                          ? `bg-gradient-to-r ${themeColors.primary} text-white shadow`
                          : 'text-gray-700 hover:bg-gray-100'
                      )}
                    >
                      {item.name}
                    </Link>
                  )
                })}
              </nav>

              {/* Admin Quick Actions */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">Quick Admin Actions</h3>
                <div className="space-y-2">
                  <Link
                    href="/dashboard/admin/users"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 rounded-lg"
                  >
                    User Management
                  </Link>
                  <Link
                    href="/dashboard/admin/teams"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 rounded-lg"
                  >
                    Team Management
                  </Link>
                  <Link
                    href="/dashboard/admin/analytics"
                    onClick={() => setMobileMenuOpen(false)}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 rounded-lg"
                  >
                    Analytics
                  </Link>
                </div>
              </div>

              {/* Notifications Section */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">Notifications</h3>
                {notifications.length > 0 ? (
                  <div className="space-y-2">
                    {notifications.slice(0, 3).map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-3 rounded-lg border ${!notification.read ? 'bg-blue-50 border-blue-200' : 'bg-gray-50 border-gray-200'}`}
                      >
                        <p className="text-xs font-semibold text-gray-900">{notification.title}</p>
                        <p className="text-xs text-gray-600 mt-1 line-clamp-2">{notification.message}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No notifications</p>
                )}
              </div>

              {/* Logout Button */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false)
                    handleLogout()
                  }}
                  className="flex items-center space-x-2 w-full px-4 py-3 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </header>
  )
}