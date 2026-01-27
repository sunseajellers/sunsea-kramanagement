import { NextRequest, NextResponse } from 'next/server'
import { okrService } from '@/lib/okrService'
import { withAuth } from '@/lib/authMiddleware'

/**
 * GET /api/okrs/stats
 * Get OKR statistics
 */
export async function GET(request: NextRequest) {
    return withAuth(request, async (_request: NextRequest, _userId: string) => {
        try {
            const { searchParams } = new URL(request.url)
            const teamId = searchParams.get('teamId') || undefined
            const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined

            const stats = await okrService.getOKRStats({ teamId, year })

            return NextResponse.json({
                success: true,
                data: stats
            })
        } catch (error) {
            console.error('Error fetching OKR stats:', error)
            return NextResponse.json({
                success: false,
                data: {
                    total: 0,
                    active: 0,
                    completed: 0,
                    draft: 0,
                    cancelled: 0,
                    avgProgress: 0,
                    onTrack: 0,
                    atRisk: 0,
                    byTimeframe: { quarterly: 0, yearly: 0 },
                    byTeam: {}
                },
                error: 'Failed to fetch OKR stats'
            })
        }
    })
}
