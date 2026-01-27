import { NextRequest, NextResponse } from 'next/server'
import { notificationService } from '@/lib/notificationService'

/**
 * PATCH /api/notifications/[id]
 * Mark notification as read
 */
export async function PATCH(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        await notificationService.markAsRead(id)
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error marking notification as read:', error)
        return NextResponse.json(
            { error: 'Failed to mark notification as read' },
            { status: 500 }
        )
    }
}
