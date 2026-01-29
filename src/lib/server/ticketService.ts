// src/lib/server/ticketService.ts
import { adminDb } from '../firebase-admin';
import { Ticket, TicketStats, TicketStatus } from '@/types';
import { timestampToDate, handleError } from '../utils';

/**
 * Ticket Service (Server-side)
 * Uses Admin SDK for Firestore operations.
 */
export async function getTickets(filters?: {
    status?: TicketStatus;
    requesterId?: string;
    assignedTo?: string;
    departmentId?: string;
    priority?: string;
}): Promise<Ticket[]> {
    try {
        let query: any = adminDb.collection('tickets').orderBy('createdAt', 'desc');

        if (filters?.status && (filters.status as any) !== 'all') {
            query = query.where('status', '==', filters.status);
        }
        if (filters?.requesterId) {
            query = query.where('requesterId', '==', filters.requesterId);
        }
        if (filters?.assignedTo) {
            query = query.where('assignedTo', '==', filters.assignedTo);
        }
        if (filters?.departmentId) {
            query = query.where('departmentId', '==', filters.departmentId);
        }
        if (filters?.priority) {
            query = query.where('priority', '==', filters.priority);
        }

        const snapshot = await query.get();
        return snapshot.docs.map((doc: any) => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: timestampToDate(data.createdAt),
                updatedAt: timestampToDate(data.updatedAt),
                dueDate: timestampToDate(data.dueDate),
                assignedAt: timestampToDate(data.assignedAt),
                resolvedAt: timestampToDate(data.resolvedAt),
            } as Ticket;
        });
    } catch (error) {
        handleError(error, 'Failed to fetch tickets via Admin SDK');
        throw error;
    }
}

export async function createTicket(data: any): Promise<string> {
    try {
        return await adminDb.runTransaction(async (transaction) => {
            const counterRef = adminDb.collection('config').doc('counters');
            const counterDoc = await transaction.get(counterRef);

            let currentId = 0;
            if (counterDoc.exists) {
                currentId = counterDoc.data()?.ticketId || 0;
            } else {
                transaction.set(counterRef, { ticketId: 0 }, { merge: true });
            }

            const newId = currentId + 1;
            const ticketNumber = `TKT-${newId.toString().padStart(4, '0')}`;
            transaction.update(counterRef, { ticketId: newId });

            const newDocRef = adminDb.collection('tickets').doc();
            const timestamp = new Date();

            transaction.set(newDocRef, {
                ...data,
                ticketNumber,
                status: 'open',
                solutions: [],
                createdAt: timestamp,
                updatedAt: timestamp
            });

            return newDocRef.id;
        });
    } catch (error) {
        handleError(error, 'Failed to create ticket via Admin SDK');
        throw error;
    }
}

export async function getTicketStats(filters?: { departmentId?: string; requesterId?: string }): Promise<TicketStats> {
    try {
        const tickets = await getTickets(filters);

        const stats: TicketStats = {
            total: tickets.length,
            open: tickets.filter(t => t.status === 'open').length,
            inProgress: tickets.filter(t => t.status === 'in_progress').length,
            resolved: tickets.filter(t => t.status === 'resolved').length,
            closed: tickets.filter(t => t.status === 'closed').length,
            avgResolutionTime: 0
        };

        const resolvedTickets = tickets.filter(t => t.resolvedAt && t.createdAt);
        if (resolvedTickets.length > 0) {
            const totalTime = resolvedTickets.reduce((sum, ticket) => {
                const created = new Date(ticket.createdAt).getTime();
                const resolved = new Date(ticket.resolvedAt!).getTime();
                return sum + (resolved - created);
            }, 0);
            stats.avgResolutionTime = totalTime / resolvedTickets.length / (1000 * 60 * 60);
        }

        return stats;
    } catch (error) {
        handleError(error, 'Failed to get ticket stats via Admin SDK');
        throw error;
    }
}

export async function updateTicket(ticketId: string, updates: any): Promise<void> {
    try {
        await adminDb.collection('tickets').doc(ticketId).update({
            ...updates,
            updatedAt: new Date()
        });
    } catch (error) {
        handleError(error, 'Failed to update ticket via Admin SDK');
        throw error;
    }
}
