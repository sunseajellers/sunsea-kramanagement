import { NextRequest, NextResponse } from 'next/server'
import { serverOKRService } from '@/lib/server/okrService'
import { withAuth } from '@/lib/authMiddleware'

/**
 * GET /api/okrs/key-results
 * Get key results (optionally filtered by objective)
 */
export async function GET(request: NextRequest) {
    return withAuth(request, async (_request: NextRequest, _userId: string) => {
        try {
            const { searchParams } = new URL(request.url)
            const objectiveId = searchParams.get('objectiveId')

            if (!objectiveId) {
                return NextResponse.json(
                    { success: false, error: 'objectiveId is required' },
                    { status: 400 }
                )
            }

            const keyResults = await serverOKRService.getKeyResultsByObjective(objectiveId)
            return NextResponse.json({
                success: true,
                data: keyResults
            })
        } catch (error) {
            console.error('Error fetching key results:', error)
            return NextResponse.json(
                { success: false, error: 'Failed to fetch key results' },
                { status: 500 }
            )
        }
    })
}

/**
 * POST /api/okrs/key-results
 * Create a new key result
 */
export async function POST(request: NextRequest) {
    return withAuth(request, async (_request: NextRequest, _userId: string) => {
        try {
            const data = await request.json()

            // Validate required fields
            const required = ['objectiveId', 'title', 'type', 'startValue', 'targetValue', 'currentValue']
            for (const field of required) {
                if (data[field] === undefined) {
                    return NextResponse.json(
                        { success: false, error: `Missing required field: ${field}` },
                        { status: 400 }
                    )
                }
            }

            const keyResultId = await serverOKRService.createKeyResult(data)

            return NextResponse.json(
                { success: true, data: { id: keyResultId }, message: 'Key result created successfully' },
                { status: 201 }
            )
        } catch (error) {
            console.error('Error creating key result:', error)
            return NextResponse.json(
                { success: false, error: 'Failed to create key result' },
                { status: 500 }
            )
        }
    })
}
