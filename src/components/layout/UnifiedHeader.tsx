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
    <header className="fixed top-0 left-0 w-full z-50 px-4 py-3 pointer-events-none">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4 pointer-events-auto">
        {/* Main Header Shell */}
        <div className="flex-1 h-14 glass-panel bg-white/90 backdrop-blur-2xl border-white/40 shadow-2xl px-6 flex items-center justify-between gap-8">
          {/* Logo and Title */}
          <div className="flex items-center gap-4 shrink-0">
            <Link href={mode === 'admin' ? '/admin' : '/dashboard'} className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center text-white shadow-lg shadow-primary/20 transition-transform group-hover:scale-105 active:scale-95">
                {headerConfig?.logo ? (
                  <img src={headerConfig.logo} alt="Logo" className="w-6 h-6 object-contain brightness-0 invert" />
                ) : (
                  <span className="text-xl font-black tracking-tighter">JM</span>
                )}
              </div>
              <div className="hidden sm:block">
                <h1 className="text-lg font-black text-primary tracking-tighter uppercase leading-none">
                  {customTitle || headerConfig?.title || 'JewelMatrix'}
                </h1>
                <p className="text-[8px] font-black text-muted-foreground/40 uppercase tracking-[0.2em] mt-0.5">
                  {mode === 'admin' ? 'Executive Panel' : 'Operations Hub'}
                </p>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          {mode !== 'public' && (
            <nav className="hidden md:flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
              {filteredNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 relative group whitespace-nowrap",
                    pathname === item.href
                      ? "bg-primary text-white shadow-md shadow-primary/30"
                      : "text-primary/60 hover:text-primary hover:bg-primary/5"
                  )}
                >
                  <span>{item.name}</span>
                  {pathname === item.href && (
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-white animate-pulse" />
                  )}
                </Link>
              ))}
            </nav>
          )}

          {/* Right side actions */}
          <div className="flex items-center gap-4 shrink-0">
            {/* Admin Controls */}
            {mode === 'admin' && showAdminControls && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowHeaderConfig(!showHeaderConfig)}
                className="hidden lg:flex h-9 px-4 rounded-xl text-[9px] font-black uppercase tracking-widest border border-primary/5 hover:bg-primary/5"
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
                  className="flex items-center gap-3 p-1 rounded-xl hover:bg-primary/5 transition-all group"
                >
                  <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center text-white text-[11px] font-black shadow-lg shadow-primary/10 ring-2 ring-white transition-transform group-hover:scale-105">
                    {getInitials(userData.fullName)}
                  </div>
                  <div className="hidden lg:flex flex-col items-start mr-1">
                    <p className="text-[10px] font-black text-primary leading-none mb-1 truncate max-w-[100px]">{userData.fullName}</p>
                    <p className="text-[8px] font-black text-muted-foreground/40 uppercase tracking-widest leading-none">Account</p>
                  </div>
                  <ChevronDown className="h-4 w-4 text-primary/30 group-hover:text-primary transition-colors" />
                </button>

                {showUserMenu && (
                  <div className="absolute right-0 mt-4 w-60 glass-panel bg-white/95 backdrop-blur-2xl border-white/40 shadow-2xl p-2 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="p-4 mb-2 bg-primary/[0.02] rounded-2xl border border-primary/5">
                      <p className="text-xs font-black text-primary truncate leading-none mb-1">{userData.fullName}</p>
                      <p className="text-[10px] font-bold text-muted-foreground/60 truncate">{userData.email}</p>
                    </div>
                    <div className="space-y-1">
                      <Link href="/dashboard/profile" className="flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-primary/60 hover:text-primary hover:bg-primary/5 rounded-xl transition-all">
                        <User className="h-4 w-4" />
                        My Profile
                      </Link>
                      <Link href="/dashboard/settings" className="flex items-center gap-3 px-4 py-3 text-[10px] font-black uppercase tracking-widest text-primary/60 hover:text-primary hover:bg-primary/5 rounded-xl transition-all">
                        <Settings className="h-4 w-4" />
                        Settings
                      </Link>
                      <div className="h-px bg-primary/5 my-1" />
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-3 text-[10px] font-black uppercase tracking-widest text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                      >
                        <LogOut className="h-4 w-4" />
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
              className="md:hidden w-10 h-10 rounded-xl bg-primary/5 text-primary flex items-center justify-center hover:bg-primary/10 transition-colors"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {mobileMenuOpen && mode !== 'public' && (
        <div className="fixed inset-x-4 top-24 z-[60] md:hidden">
          <div className="glass-panel bg-white/95 backdrop-blur-2xl border-white/40 shadow-2xl p-4 animate-in slide-in-from-top duration-300">
            <div className="space-y-2">
              {filteredNav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-4 px-5 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all duration-300",
                    pathname === item.href
                      ? "bg-primary text-white shadow-lg shadow-primary/20"
                      : "text-primary/60 hover:text-primary hover:bg-primary/5"
                  )}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.name}
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Admin Header Configuration Panel */}
      {mode === 'admin' && showHeaderConfig && (
        <div className="fixed inset-x-4 top-24 z-[60] md:max-w-xl md:left-auto md:right-4">
          <div className="glass-panel bg-white/95 backdrop-blur-2xl border-white/40 shadow-2xl p-8 animate-in slide-in-from-top duration-300" ref={configRef}>
            <div className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Logo URL</label>
                  <input
                    type="text"
                    value={headerConfig?.logo || ''}
                    onChange={(e) => setHeaderConfig(prev => prev ? { ...prev, logo: e.target.value } : null)}
                    className="form-input"
                    placeholder="https://example.com/logo.png"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Dashboard Title</label>
                  <input
                    type="text"
                    value={headerConfig?.title || ''}
                    onChange={(e) => setHeaderConfig(prev => prev ? { ...prev, title: e.target.value } : null)}
                    className="form-input"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="ghost" onClick={() => setShowHeaderConfig(false)} className="flex-1 rounded-xl text-[10px] font-black uppercase tracking-widest h-12">
                  Cancel
                </Button>
                <Button onClick={() => handleHeaderConfigUpdate(headerConfig!)} className="flex-1 btn-primary h-12 rounded-xl text-[10px] font-black uppercase tracking-widest">
                  Save Appearance
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  )
}