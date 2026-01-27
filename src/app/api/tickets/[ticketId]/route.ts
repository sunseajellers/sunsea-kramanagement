import { NextRequest, NextResponse } from 'next/server'
import { ticketService } from '@/lib/ticketService'
import { withAuth } from '@/lib/authMiddleware'
import { isUserAdmin } from '@/lib/server/authService'

/**
 * GET /api/tickets/[ticketId]
 * Get a specific ticket by ID
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ ticketId: string }> }
) {
    return withAuth(request, async (_req, _userId) => {
        try {
            const { ticketId } = await params
            const ticket = await ticketService.getTicket(ticketId)

            if (!ticket) {
                return NextResponse.json(
                    { error: 'Ticket not found' },
                    { status: 404 }
                )
            }

            return NextResponse.json(ticket)
        } catch (error) {
            console.error('Error fetching ticket:', error)
            return NextResponse.json(
                { error: 'Failed to fetch ticket' },
                { status: 500 }
            )
        }
    })
}

/**
 * PATCH /api/tickets/[ticketId]
 * Update a ticket (status, assignment, resolution, etc.)
 */
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ ticketId: string }> }
) {
    return withAuth(request, async (req, userId) => {
        try {
            const { ticketId } = await params
            const data = await req.json()
            const { action, ...updateData } = data

            // Fetch user role for permission check
            const isAdmin = await isUserAdmin(userId)

            switch (action) {
                case 'assign':
                    if (!isAdmin) {
                        return NextResponse.json({ error: 'Only admins can assign tickets' }, { status: 403 })
                    }
                    if (!updateData.assignedTo || !updateData.assignedToName) {
                        return NextResponse.json(
                            { error: 'Missing assignedTo or assignedToName' },
                            { status: 400 }
                        )
                    }
                    await ticketService.assignTicket(
                        ticketId,
                        updateData.assignedTo,
                        updateData.assignedToName,
                        userId
                    )
                    break

                case 'resolve':
                    if (!updateData.resolvedByName) {
                        return NextResponse.json({ error: 'Missing resolvedByName' }, { status: 400 })
                    }
                    await ticketService.resolveTicket(
                        ticketId,
                        userId,
                        updateData.resolvedByName
                    )
                    break

                case 'close':
                    if (!isAdmin) {
                        return NextResponse.json({ error: 'Only admins can close tickets' }, { status: 403 })
                    }
                    await ticketService.closeTicket(ticketId, userId)
                    break

                case 'addSolution':
                    if (!updateData.solutionText || !updateData.addedByName) {
                        return NextResponse.json(
                            { error: 'Missing solutionText or addedByName' },
                            { status: 400 }
                        )
                    }
                    await ticketService.addSolution(ticketId, {
                        solutionText: updateData.solutionText,
                        addedBy: userId,
                        addedByName: updateData.addedByName
                    })
                    break

                case 'updateStatus':
                    if (!updateData.status) {
                        return NextResponse.json(
                            { error: 'Missing status' },
                            { status: 400 }
                        )
                    }
                    await ticketService.updateTicketStatus(
                        ticketId,
                        updateData.status,
                        userId
                    )
                    break

                default:
                    return NextResponse.json(
                        { error: 'Invalid action' },
                        { status: 400 }
                    )
            }

            return NextResponse.json({ success: true })
        } catch (error) {
            console.error('Error updating ticket:', error)
            return NextResponse.json(
                { error: 'Failed to update ticket' },
                { status: 500 }
            )
        }
    })
}

/**
 * DELETE /api/tickets/[ticketId]
 * Delete a ticket (admin only)
 */
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ ticketId: string }> }
) {
    return withAuth(request, async (_req, userId) => {
        try {
            const { ticketId } = await params

            // Strict Admin Check
            const isAdmin = await isUserAdmin(userId)
            if (!isAdmin) {
                return NextResponse.json({ error: 'Forbidden: Admins only' }, { status: 403 })
            }

            // Soft delete via closeTicket
            await ticketService.closeTicket(ticketId, userId)

            return NextResponse.json({ success: true })
        } catch (error) {
            console.error('Error deleting ticket:', error)
            return NextResponse.json(
                { error: 'Failed to delete ticket' },
                { status: 500 }
            )
        }
    })
}
