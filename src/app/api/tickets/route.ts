import { NextRequest, NextResponse } from 'next/server'
import { getTickets, createTicket } from '@/lib/server/ticketService'
import { withAuth } from '@/lib/authMiddleware'

/**
 * GET /api/tickets
 * Fetch all tickets with optional filters
 */
export async function GET(request: NextRequest) {
    return withAuth(request, async (_request: NextRequest, _userId: string) => {
        try {
            const { searchParams } = new URL(request.url)
            const status = searchParams.get('status') as any || undefined
            const requesterId = searchParams.get('requesterId') || undefined
            const assignedTo = searchParams.get('assignedTo') || undefined
            const departmentId = searchParams.get('departmentId') || undefined
            const priority = searchParams.get('priority') || undefined

            const tickets = await getTickets({
                status: status === 'all' ? undefined : status,
                requesterId,
                assignedTo,
                departmentId,
                priority
            })

            return NextResponse.json({
                success: true,
                data: tickets || []
            })
        } catch (error) {
            console.error('Error fetching tickets:', error)
            return NextResponse.json(
                { success: false, error: 'Failed to fetch tickets' },
                { status: 500 }
            )
        }
    })
}

/**
 * POST /api/tickets
 * Create a new ticket
 */
export async function POST(request: NextRequest) {
    return withAuth(request, async (_request: NextRequest, userId: string) => {
        try {
            const data = await request.json()

            // Validate required fields
            if (!data.subject || !data.description || !data.requestType || !data.priority || !data.dueDate) {
                return NextResponse.json(
                    { success: false, error: 'Missing required fields' },
                    { status: 400 }
                )
            }

            // Get user info from context if available in userData or just use userId
            const ticketData = {
                ...data,
                requesterId: userId,
                // These should ideally be fetched from the database using userId if not in payload
                requesterName: data.requesterName || 'Auth User',
                requesterEmail: data.requesterEmail || 'user@auth.com',
                dueDate: new Date(data.dueDate)
            }

            const ticketId = await createTicket(ticketData)

            return NextResponse.json(
                { success: true, data: { id: ticketId }, message: 'Ticket created successfully' },
                { status: 201 }
            )
        } catch (error) {
            console.error('Error creating ticket:', error)
            return NextResponse.json(
                { success: false, error: 'Failed to create ticket' },
                { status: 500 }
            )
        }
    })
}
