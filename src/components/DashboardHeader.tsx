'use client'

import Link from 'next/link'
import { Bell, Search, Menu, X, ChevronDown, LogOut, User, Settings } from 'lucide-react'
import { useState, useEffect } from 'react'
import { getInitials, getAvatarColor, cn } from '@/lib/utils'
import { useAuth } from '@/contexts/AuthContext'
import { getUserNotifications } from '@/lib/notificationService'
import { usePathname, useRouter } from 'next/navigation'

// Top navbar with role-aware navigation
export default function DashboardHeader() {
    const { userData, loading, logout } = useAuth()
    const [showNotifications, setShowNotifications] = useState(false)
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [showUserMenu, setShowUserMenu] = useState(false)
    const [notifications, setNotifications] = useState<any[]>([])
    const pathname = usePathname()
    const router = useRouter()

    // Load notifications for the logged‑in user
    useEffect(() => {
        if (userData?.uid) {
            getUserNotifications(userData.uid).then(setNotifications).catch(console.error)
        }
    }, [userData])

    const handleLogout = async () => {
        try {
            await logout()
            router.push('/')
        } catch (error) {
            console.error('Failed to logout:', error)
        }
    }

    const unreadCount = notifications.filter(n => !n.read).length

    const navigation = [
        { name: 'The Hub', href: '/dashboard', roles: ['admin', 'manager', 'employee'] },
        { name: 'Goals & Vibes', href: '/dashboard/kras', roles: ['admin', 'manager', 'employee'] },
        { name: 'To-Do\'s', href: '/dashboard/tasks', roles: ['admin', 'manager', 'employee'] },
        { name: 'Stats & Wins', href: '/dashboard/reports', roles: ['admin', 'manager', 'employee'] },
        { name: 'The Squad', href: '/dashboard/team', roles: ['admin', 'manager'] },
        { name: 'Control Center', href: '/dashboard/admin', roles: ['admin'] },
    ]

    const filteredNav = navigation.filter(item => item.roles.includes(userData?.role || 'employee'))

    if (loading) {
        return (
            <header className="bg-white border-b border-gray-200 px-6 py-4 flex justify-center items-center">
                <span className="text-gray-600">Loading header...</span>
            </header>
        )
    }

    return (
        <header className="bg-white border-b border-gray-200 px-4 py-3">
            <div className="max-w-7xl mx-auto flex items-center justify-between space-x-4">
                <div className="flex items-center space-x-6">
                    <Link href="/dashboard" className="flex items-center space-x-2">
                        <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-secondary-500 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none">
                                <path d="M12 2L3 7v6c0 5 4 9 9 9s9-4 9-9V7l-9-5z" fill="currentColor" />
                            </svg>
                        </div>
                        <span className="text-lg font-semibold hidden sm:inline">JewelMatrix</span>
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
                                        'px-3 py-2 rounded-md text-sm font-medium',
                                        isActive ? 'bg-gradient-to-r from-primary-600 to-secondary-600 text-white shadow' : 'text-gray-600 hover:bg-gray-100'
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
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search tasks, KRAs, or people..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                        />
                    </div>
                </div>

                {/* Right: Notifications & User */}
                <div className="flex items-center space-x-4">
                    <div className="relative">
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            className="relative p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <Bell className="w-5 h-5 text-gray-600" />
                            {unreadCount > 0 && (
                                <span className="absolute top-0 right-0 -mt-1 -mr-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                                    {unreadCount}
                                </span>
                            )}
                        </button>

                        {showNotifications && (
                            <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-xl border border-gray-200 z-50 animate-scale-in">
                                <div className="p-4 border-b border-gray-200">
                                    <h3 className="font-semibold text-gray-900">Notifications</h3>
                                </div>
                                <div className="max-h-96 overflow-y-auto">
                                    {notifications.slice(0, 5).map((notification) => (
                                        <div
                                            key={notification.id}
                                            className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors ${!notification.read ? 'bg-blue-50' : ''}`}>
                                            <p className="font-semibold text-sm text-gray-900">{notification.title}</p>
                                            <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                                            <p className="text-xs text-gray-400 mt-2">
                                                {new Date(notification.createdAt).toLocaleString()}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                                <div className="p-3 border-t border-gray-200 text-center">
                                    <button className="text-sm text-primary-600 hover:text-primary-700 font-semibold">
                                        View All Notifications
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex items-center space-x-3">
                        <div className="text-right hidden sm:block">
                            <p className="text-sm font-semibold text-gray-900">{userData?.fullName || 'User'}</p>
                            <p className="text-xs text-gray-500 capitalize">{userData?.role || 'employee'}</p>
                        </div>
                        <div className="relative">
                            <button
                                onClick={() => setShowUserMenu(!showUserMenu)}
                                className="flex items-center space-x-2 hover:bg-gray-100 rounded-lg p-2 transition-colors"
                            >
                                <div className={`w-10 h-10 bg-gradient-to-br ${getAvatarColor(userData?.fullName || '')} rounded-full flex items-center justify-center text-white font-semibold`}
                                >
                                    {getInitials(userData?.fullName || '')}
                                </div>
                                <ChevronDown className="w-4 h-4 text-gray-600" />
                            </button>

                            {showUserMenu && (
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-xl border border-gray-200 z-50 animate-scale-in">
                                    <div className="p-3 border-b border-gray-200">
                                        <p className="text-sm font-semibold text-gray-900">{userData?.fullName || 'User'}</p>
                                        <p className="text-xs text-gray-500">{userData?.email}</p>
                                    </div>
                                    <div className="py-1">
                                        <button
                                            onClick={() => {
                                                setShowUserMenu(false)
                                                // Could add profile/settings page later
                                            }}
                                            className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                        >
                                            <User className="w-4 h-4" />
                                            <span>Profile</span>
                                        </button>
                                        <button
                                            onClick={() => {
                                                setShowUserMenu(false)
                                                // Could add settings page later
                                            }}
                                            className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                        >
                                            <Settings className="w-4 h-4" />
                                            <span>Settings</span>
                                        </button>
                                    </div>
                                    <div className="border-t border-gray-200">
                                        <button
                                            onClick={handleLogout}
                                            className="flex items-center space-x-2 w-full px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
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
                                    <p className="text-sm font-semibold text-gray-900">{userData?.fullName || 'User'}</p>
                                    <p className="text-xs text-gray-500 capitalize">{userData?.role || 'employee'}</p>
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
                                                    ? 'bg-gradient-to-r from-primary-600 to-secondary-600 text-white shadow'
                                                    : 'text-gray-700 hover:bg-gray-100'
                                            )}
                                        >
                                            {item.name}
                                        </Link>
                                    )
                                })}
                            </nav>

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
