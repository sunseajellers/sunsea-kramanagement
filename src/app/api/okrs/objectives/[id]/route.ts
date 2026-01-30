import { NextRequest, NextResponse } from 'next/server'
import { serverOKRService } from '@/lib/server/okrService'

/**
 * GET /api/okrs/objectives/[id]
 * Get a specific objective
 */
export async function GET(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const objective = await serverOKRService.getObjective(id)

        if (!objective) {
            return NextResponse.json(
                { error: 'Objective not found' },
                { status: 404 }
            )
        }

        return NextResponse.json(objective)
    } catch (error) {
        console.error('Error fetching objective:', error)
        return NextResponse.json(
            { error: 'Failed to fetch objective' },
            { status: 500 }
        )
    }
}

/**
 * PATCH /api/okrs/objectives/[id]
 * Update an objective
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const data = await request.json()

        // Convert dates if provided
        if (data.startDate) data.startDate = new Date(data.startDate)
        if (data.endDate) data.endDate = new Date(data.endDate)

        await serverOKRService.updateObjective(id, data)

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error updating objective:', error)
        return NextResponse.json(
            { error: 'Failed to update objective' },
            { status: 500 }
        )
    }
}

/**
 * DELETE /api/okrs/objectives/[id]
 * Delete an objective
 */
export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        await serverOKRService.deleteObjective(id)
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting objective:', error)
        return NextResponse.json(
            { error: 'Failed to delete objective' },
            { status: 500 }
        )
    }
}
