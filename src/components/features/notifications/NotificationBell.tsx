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
import { Badge } from '@/components/ui/badge'
import type { Notification } from '@/lib/notificationService'
import { formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'
import { useAuth } from '@/contexts/AuthContext'

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
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <Badge
                            variant="destructive"
                            className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                        >
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </Badge>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                <div className="flex items-center justify-between px-4 py-2">
                    <h3 className="font-semibold">Notifications</h3>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleMarkAllAsRead}
                            className="text-xs"
                        >
                            Mark all read
                        </Button>
                    )}
                </div>
                <DropdownMenuSeparator />

                {loading ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                        Loading...
                    </div>
                ) : notifications.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                        No notifications
                    </div>
                ) : (
                    <div className="max-h-96 overflow-y-auto">
                        {notifications.map((notification) => (
                            <DropdownMenuItem
                                key={notification.id}
                                className={`flex flex-col items-start p-4 cursor-pointer ${!notification.read ? 'bg-muted/50' : ''
                                    }`}
                                onClick={() => {
                                    if (!notification.read) {
                                        handleMarkAsRead(notification.id)
                                    }
                                    if (notification.link) {
                                        window.location.href = notification.link
                                    }
                                }}
                            >
                                <div className="flex items-start gap-2 w-full">
                                    <span className="text-lg">{getNotificationIcon(notification.type)}</span>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="font-medium text-sm">{notification.title}</p>
                                            {!notification.read && (
                                                <div className="w-2 h-2 bg-blue-500 rounded-full" />
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {notification.message}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-1">
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
