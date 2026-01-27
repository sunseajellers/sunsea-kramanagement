import { NextRequest, NextResponse } from 'next/server'
import { okrService } from '@/lib/okrService'

/**
 * PATCH /api/okrs/key-results/[id]
 * Update a key result
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        const data = await request.json()
        await okrService.updateKeyResult(id, data)

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error updating key result:', error)
        return NextResponse.json(
            { error: 'Failed to update key result' },
            { status: 500 }
        )
    }
}

/**
 * DELETE /api/okrs/key-results/[id]
 * Delete a key result
 */
export async function DELETE(
    _request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params
        await okrService.deleteKeyResult(id)
        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Error deleting key result:', error)
        return NextResponse.json(
            { error: 'Failed to delete key result' },
            { status: 500 }
        )
    }
}
