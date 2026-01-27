import { NextRequest, NextResponse } from 'next/server'
import { getTicketStats } from '@/lib/server/ticketService'
import { withAuth } from '@/lib/authMiddleware'

/**
 * GET /api/tickets/stats
 * Get ticket statistics (total, open, in progress, resolved, closed, avg resolution time)
 */
export async function GET(request: NextRequest) {
    return withAuth(request, async (_request: NextRequest, _userId: string) => {
        try {
            const { searchParams } = new URL(request.url)
            const departmentId = searchParams.get('departmentId') || undefined

            const stats = await getTicketStats({ departmentId })

            return NextResponse.json({
                success: true,
                data: stats
            })
        } catch (error) {
            console.error('Error fetching ticket stats:', error)
            return NextResponse.json({
                success: false,
                data: {
                    total: 0,
                    open: 0,
                    inProgress: 0,
                    resolved: 0,
                    closed: 0,
                    avgResolutionTime: 0
                },
                error: 'Failed to fetch ticket stats'
            })
        }
    })
}
