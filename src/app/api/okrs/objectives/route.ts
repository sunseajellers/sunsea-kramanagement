import { NextRequest, NextResponse } from 'next/server'
import { okrService } from '@/lib/okrService'
import { withAuth } from '@/lib/authMiddleware'

/**
 * GET /api/okrs/objectives
 * Get all objectives with optional filters
 */
export async function GET(request: NextRequest) {
    return withAuth(request, async (_request: NextRequest, _userId: string) => {
        try {
            const { searchParams } = new URL(request.url)
            const status = searchParams.get('status') as any
            const timeframe = searchParams.get('timeframe') as any
            const ownerId = searchParams.get('ownerId') || undefined
            const teamId = searchParams.get('teamId') || undefined
            const year = searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined
            const quarter = searchParams.get('quarter') ? parseInt(searchParams.get('quarter')!) : undefined

            const objectives = await okrService.getObjectives({
                status,
                timeframe,
                ownerId,
                teamId,
                year,
                quarter
            })

            return NextResponse.json({
                success: true,
                data: objectives || []
            })
        } catch (error) {
            console.error('Error fetching objectives:', error)
            return NextResponse.json({
                success: false,
                data: [],
                error: 'Failed to fetch objectives'
            })
        }
    })
}

/**
 * POST /api/okrs/objectives
 * Create a new objective
 */
export async function POST(request: NextRequest) {
    return withAuth(request, async (_request: NextRequest, userId: string) => {
        try {
            const data = await request.json()

            // Validate required fields
            const required = ['title', 'description', 'ownerId', 'ownerName', 'timeframe', 'startDate', 'endDate', 'year']
            for (const field of required) {
                if (!data[field]) {
                    return NextResponse.json(
                        { success: false, error: `Missing required field: ${field}` },
                        { status: 400 }
                    )
                }
            }

            // Convert dates
            data.startDate = new Date(data.startDate)
            data.endDate = new Date(data.endDate)

            data.createdBy = userId
            data.createdByName = data.ownerName // Fallback to ownerName if not provided

            const objectiveId = await okrService.createObjective(data)

            return NextResponse.json(
                { success: true, data: { id: objectiveId }, message: 'Objective created successfully' },
                { status: 201 }
            )
        } catch (error) {
            console.error('Error creating objective:', error)
            return NextResponse.json(
                { success: false, error: 'Failed to create objective' },
                { status: 500 }
            )
        }
    })
}
