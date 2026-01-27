import { db } from '@/lib/firebase'
import {
    collection,
    doc,
    addDoc,
    updateDoc,
    getDoc,
    getDocs,
    query,
    where,
    orderBy,
    serverTimestamp
} from 'firebase/firestore'
import type { Ticket, TicketSolution, TicketStats, TicketStatus } from '@/types'

/**
 * Ticket Service
 * Handles all ticket-related operations for the helpdesk system
 */
export class TicketService {
    private ticketsCollection = collection(db, 'tickets')

    /**
     * Generate unique ticket number
     * Format: TKT-0001, TKT-0002, etc.
     */
    async generateTicketNumber(): Promise<string> {
        const snapshot = await getDocs(this.ticketsCollection)
        const count = snapshot.size + 1
        return `TKT-${count.toString().padStart(4, '0')}`
    }

    /**
     * Create a new ticket
     */
    async createTicket(data: Omit<Ticket, 'id' | 'ticketNumber' | 'createdAt' | 'updatedAt' | 'solutions'>): Promise<string> {
        const ticketNumber = await this.generateTicketNumber()

        const ticketData = {
            ...data,
            ticketNumber,
            status: 'open' as TicketStatus,
            solutions: [],
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        }

        const docRef = await addDoc(this.ticketsCollection, ticketData)

        // Log activity
        await this.logActivity(docRef.id, data.requesterId, 'created', 'Ticket created')

        return docRef.id
    }

    /**
     * Get ticket by ID
     */
    async getTicket(ticketId: string): Promise<Ticket | null> {
        const docRef = doc(this.ticketsCollection, ticketId)
        const snapshot = await getDoc(docRef)

        if (!snapshot.exists()) return null

        const data = snapshot.data()
        return {
            id: snapshot.id,
            ...data,
            createdAt: data.createdAt?.toDate(),
            updatedAt: data.updatedAt?.toDate(),
            dueDate: data.dueDate?.toDate(),
            assignedAt: data.assignedAt?.toDate(),
            resolvedAt: data.resolvedAt?.toDate(),
        } as Ticket
    }

    /**
     * Get all tickets with optional filters
     */
    async getTickets(filters?: {
        status?: TicketStatus
        requesterId?: string
        assignedTo?: string
        departmentId?: string
        priority?: string
    }): Promise<Ticket[]> {
        let q = query(this.ticketsCollection, orderBy('createdAt', 'desc'))

        if (filters?.status) {
            q = query(q, where('status', '==', filters.status))
        }
        if (filters?.requesterId) {
            q = query(q, where('requesterId', '==', filters.requesterId))
        }
        if (filters?.assignedTo) {
            q = query(q, where('assignedTo', '==', filters.assignedTo))
        }
        if (filters?.departmentId) {
            q = query(q, where('departmentId', '==', filters.departmentId))
        }
        if (filters?.priority) {
            q = query(q, where('priority', '==', filters.priority))
        }

        const snapshot = await getDocs(q)
        return snapshot.docs.map(doc => {
            const data = doc.data()
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate(),
                updatedAt: data.updatedAt?.toDate(),
                dueDate: data.dueDate?.toDate(),
                assignedAt: data.assignedAt?.toDate(),
                resolvedAt: data.resolvedAt?.toDate(),
            }
        }) as Ticket[]
    }

    /**
     * Update ticket status
     */
    async updateTicketStatus(ticketId: string, status: TicketStatus, userId: string): Promise<void> {
        const docRef = doc(this.ticketsCollection, ticketId)
        await updateDoc(docRef, {
            status,
            updatedAt: serverTimestamp()
        })

        await this.logActivity(ticketId, userId, 'status_changed', `Status changed to ${status}`)
    }

    /**
     * Assign ticket to support staff
     */
    async assignTicket(ticketId: string, assignedTo: string, assignedToName: string, assignedBy: string): Promise<void> {
        const docRef = doc(this.ticketsCollection, ticketId)
        await updateDoc(docRef, {
            assignedTo,
            assignedToName,
            assignedAt: serverTimestamp(),
            status: 'in_progress',
            updatedAt: serverTimestamp()
        })

        await this.logActivity(ticketId, assignedBy, 'assigned', `Assigned to ${assignedToName}`)
    }

    /**
     * Add solution to ticket
     */
    async addSolution(ticketId: string, solution: Omit<TicketSolution, 'id' | 'ticketId' | 'addedAt'>): Promise<void> {
        const ticket = await this.getTicket(ticketId)
        if (!ticket) throw new Error('Ticket not found')

        const newSolution: TicketSolution = {
            id: `sol-${Date.now()}`,
            ticketId,
            ...solution,
            addedAt: new Date()
        }

        const docRef = doc(this.ticketsCollection, ticketId)
        await updateDoc(docRef, {
            solutions: [...ticket.solutions, newSolution],
            updatedAt: serverTimestamp()
        })

        await this.logActivity(ticketId, solution.addedBy, 'solution_added', 'Solution added')
    }

    /**
     * Resolve ticket
     */
    async resolveTicket(ticketId: string, resolvedBy: string, resolvedByName: string): Promise<void> {
        const docRef = doc(this.ticketsCollection, ticketId)
        await updateDoc(docRef, {
            status: 'resolved',
            resolvedBy,
            resolvedByName,
            resolvedAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        })

        await this.logActivity(ticketId, resolvedBy, 'resolved', 'Ticket resolved')
    }

    /**
     * Close ticket
     */
    async closeTicket(ticketId: string, closedBy: string): Promise<void> {
        const docRef = doc(this.ticketsCollection, ticketId)
        await updateDoc(docRef, {
            status: 'closed',
            updatedAt: serverTimestamp()
        })

        await this.logActivity(ticketId, closedBy, 'closed', 'Ticket closed')
    }

    /**
     * Get ticket statistics
     */
    async getTicketStats(filters?: { departmentId?: string }): Promise<TicketStats> {
        const tickets = await this.getTickets(filters)

        const stats: TicketStats = {
            total: tickets.length,
            open: tickets.filter(t => t.status === 'open').length,
            inProgress: tickets.filter(t => t.status === 'in_progress').length,
            resolved: tickets.filter(t => t.status === 'resolved').length,
            closed: tickets.filter(t => t.status === 'closed').length,
            avgResolutionTime: 0
        }

        // Calculate average resolution time
        const resolvedTickets = tickets.filter(t => t.resolvedAt && t.createdAt)
        if (resolvedTickets.length > 0) {
            const totalTime = resolvedTickets.reduce((sum, ticket) => {
                const created = ticket.createdAt instanceof Date ? ticket.createdAt : new Date(ticket.createdAt)
                const resolved = ticket.resolvedAt instanceof Date ? ticket.resolvedAt : new Date(ticket.resolvedAt!)
                return sum + (resolved.getTime() - created.getTime())
            }, 0)
            stats.avgResolutionTime = totalTime / resolvedTickets.length / (1000 * 60 * 60) // Convert to hours
        }

        return stats
    }

    /**
     * Log activity for ticket
     */
    private async logActivity(ticketId: string, userId: string, action: string, details: string): Promise<void> {
        try {
            const activityLogsCollection = collection(db, 'activityLogs')
            await addDoc(activityLogsCollection, {
                entityType: 'ticket',
                entityId: ticketId,
                userId,
                action,
                details,
                timestamp: serverTimestamp()
            })
        } catch (error) {
            console.error('Error logging activity:', error)
            // Don't throw - activity logging shouldn't break the main operation
        }
    }

    /**
     * Add comment to ticket
     */
    async addComment(ticketId: string, userId: string, userName: string, text: string): Promise<void> {
        const commentsCollection = collection(db, `tickets/${ticketId}/comments`)
        await addDoc(commentsCollection, {
            userId,
            userName,
            text,
            createdAt: serverTimestamp()
        })

        await this.logActivity(ticketId, userId, 'comment_added', 'Comment added')
    }

    /**
     * Get comments for ticket
     */
    async getComments(ticketId: string): Promise<any[]> {
        const commentsCollection = collection(db, `tickets/${ticketId}/comments`)
        const q = query(commentsCollection, orderBy('createdAt', 'asc'))
        const snapshot = await getDocs(q)

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate()
        }))
    }
}

// Export singleton instance
export const ticketService = new TicketService()
