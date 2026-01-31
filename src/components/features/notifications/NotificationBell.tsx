'use client'

import { useState, useEffect } from 'react'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'

import type { Notification } from '@/lib/notificationService'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'
import { cn } from '@/lib/utils'

export function NotificationBell() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [unreadCount, setUnreadCount] = useState(0)
    const [loading, setLoading] = useState(false)
    const { user } = useAuth()

    useEffect(() => {
        if (user) {
            fetchNotifications()
            fetchUnreadCount()
        }

        // Poll for new notifications every 30 seconds
        const interval = setInterval(() => {
            if (user) {
                fetchUnreadCount()
            }
        }, 30000)

        return () => clearInterval(interval)
    }, [user])

    const fetchNotifications = async () => {
        try {
            if (!user) return
            setLoading(true)
            const token = await user.getIdToken()
            const response = await fetch('/api/notifications?limit=10', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
            if (!response.ok) throw new Error('Failed to fetch notifications')

            const data = await response.json()
            setNotifications(data)
        } catch (error) {
            console.error('Error fetching notifications:', error)
        } finally {
            setLoading(false)
        }
    }

    const fetchUnreadCount = async () => {
        try {
            if (!user) return
            const token = await user.getIdToken()
            const response = await fetch('/api/notifications/unread-count', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })
            if (!response.ok) throw new Error('Failed to fetch unread count')

            const data = await response.json()
            setUnreadCount(data.count)
        } catch (error) {
            console.error('Error fetching unread count:', error)
        }
    }

    const handleMarkAsRead = async (notificationId: string) => {
        try {
            if (!user) return
            const token = await user.getIdToken()
            const response = await fetch(`/api/notifications/${notificationId}`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            if (!response.ok) throw new Error('Failed to mark as read')

            // Update local state
            setNotifications(prev =>
                prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
            )
            setUnreadCount(prev => Math.max(0, prev - 1))
        } catch (error) {
            console.error('Error marking notification as read:', error)
        }
    }

    const handleMarkAllAsRead = async () => {
        try {
            if (!user) return
            const token = await user.getIdToken()
            const response = await fetch('/api/notifications/mark-all-read', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            })

            if (!response.ok) throw new Error('Failed to mark all as read')

            setNotifications(prev => prev.map(n => ({ ...n, read: true })))
            setUnreadCount(0)
            toast.success('All notifications marked as read')
        } catch (error) {
            console.error('Error marking all as read:', error)
            toast.error('Failed to mark all as read')
        }
    }

    const getNotificationIcon = (type: string) => {
        const icons: Record<string, string> = {
            task_assigned: '📋',
            task_due_soon: '⏰',
            task_overdue: '🚨',
            ticket_created: '🎫',
            ticket_assigned: '👤',
            ticket_updated: '🔄',
            ticket_resolved: '✅',
            kra_assigned: '🎯',
            kra_due_soon: '⏰',
            system: 'ℹ️'
        }
        return icons[type] || '📬'
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-10 w-10 rounded-xl hover:bg-slate-100 transition-all">
                    <Bell className="h-4.5 w-4.5 text-slate-600" />
                    {unreadCount > 0 && (
                        <div className="absolute top-2 right-2 h-1.5 w-1.5 rounded-full bg-rose-500 ring-2 ring-white animate-pulse" />
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 rounded-2xl p-1.5 border-slate-100 shadow-xl overflow-hidden bg-card backdrop-blur-xl">
                <div className="flex items-center justify-between px-5 py-3.5">
                    <h3 className="text-xs font-black uppercase tracking-widest text-primary">Notifications</h3>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleMarkAllAsRead}
                            className="text-[9px] font-black uppercase tracking-widest text-primary/40 hover:text-primary hover:bg-primary/5 h-auto py-1 px-2.5 rounded-full"
                        >
                            Mark All Read
                        </Button>
                    )}
                </div>
                <DropdownMenuSeparator className="bg-slate-50" />

                {loading ? (
                    <div className="p-8 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Looking...
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="p-8 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        Nothing new!
                    </div>
                ) : (
                    <div className="max-h-[500px] overflow-y-auto space-y-1 p-2">
                        {notifications.map((notification) => (
                            <DropdownMenuItem
                                key={notification.id}
                                className={cn(
                                    "flex flex-col items-start p-3.5 cursor-pointer rounded-xl transition-all duration-300",
                                    !notification.read ? "bg-slate-50 border-l-4 border-primary" : "opacity-60 grayscale-[0.5]"
                                )}
                                onClick={() => {
                                    if (!notification.read) {
                                        handleMarkAsRead(notification.id)
                                    }
                                    if (notification.link) {
                                        window.location.href = notification.link
                                    }
                                }}
                            >
                                <div className="flex items-start gap-3 w-full">
                                    <div className="w-9 h-9 rounded-lg bg-white shadow-sm flex items-center justify-center text-lg shrink-0 border border-slate-50">
                                        {getNotificationIcon(notification.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="font-black text-xs text-primary tracking-tight">{notification.title}</p>
                                            {!notification.read && (
                                                <div className="w-1 h-1 bg-primary rounded-full shrink-0" />
                                            )}
                                        </div>
                                        <p className="text-[11px] font-medium text-slate-500 mt-0.5 leading-relaxed line-clamp-2">
                                            {notification.message}
                                        </p>
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1.5">
                                            {notification.createdAt ? formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true }) : ''}
                                        </p>
                                    </div>
                                </div>
                            </DropdownMenuItem>
                        ))}
                    </div>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
