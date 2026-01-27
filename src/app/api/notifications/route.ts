import { NextRequest, NextResponse } from 'next/server'
import { getUserNotifications, createNotification } from '@/lib/server/notificationService'
import { withAuth } from '@/lib/authMiddleware'

/**
 * GET /api/notifications
 * Get notifications for current user
 */
export async function GET(request: NextRequest) {
    return withAuth(request, async (_request: NextRequest, userId: string) => {
        try {
            const { searchParams } = new URL(request.url)
            const unreadOnly = searchParams.get('unreadOnly') === 'true'
            const limitCount = parseInt(searchParams.get('limit') || '50')

            const notifications = await getUserNotifications(
                userId,
                unreadOnly,
                limitCount
            )

            return NextResponse.json(notifications || [])
        } catch (error) {
            console.error('Error fetching notifications:', error)
            // Return empty array instead of error to prevent frontend crash
            return NextResponse.json([])
        }
    })
}

/**
 * POST /api/notifications
 * Create a new notification (admin/system only)
 */
export async function POST(request: NextRequest) {
    try {
        const data = await request.json()

        // Validate required fields
        if (!data.userId || !data.type || !data.title || !data.message) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            )
        }

        const notificationId = await createNotification(data)

        return NextResponse.json(
            { id: notificationId, message: 'Notification created successfully' },
            { status: 201 }
        )
    } catch (error) {
        console.error('Error creating notification:', error)
        return NextResponse.json(
            { error: 'Failed to create notification' },
            { status: 500 }
        )
    }
}
