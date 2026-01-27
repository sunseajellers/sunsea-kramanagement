import { NextRequest, NextResponse } from 'next/server'
import { notificationService } from '@/lib/notificationService'
import { withAuth } from '@/lib/authMiddleware'

/**
 * POST /api/notifications/mark-all-read
 * Mark all notifications as read for current user
 */
export async function POST(request: NextRequest) {
    return withAuth(request, async (_req, userId) => {
        try {
            await notificationService.markAllAsRead(userId)
            return NextResponse.json({ success: true })
        } catch (error) {
            console.error('Error marking all notifications as read:', error)
            return NextResponse.json(
                { error: 'Failed to mark all notifications as read' },
                { status: 500 }
            )
        }
    })
}
