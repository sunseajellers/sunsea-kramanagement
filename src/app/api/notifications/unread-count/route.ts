import { NextRequest, NextResponse } from 'next/server'
import { getUnreadCount } from '@/lib/server/notificationService'
import { withAuth } from '@/lib/authMiddleware'

/**
 * GET /api/notifications/unread-count
 * Get unread notification count for current user
 */
export async function GET(request: NextRequest) {
    return withAuth(request, async (_request: NextRequest, userId: string) => {
        try {
            const count = await getUnreadCount(userId)
            return NextResponse.json({ count })
        } catch (error) {
            console.error('Error fetching unread count:', error)
            return NextResponse.json({ count: 0 })
        }
    })
}
