// src/lib/enhancedTicketService.ts
// ENHANCED TICKET SERVICE - Enterprise-grade helpdesk with full validation
// Implements all business rules for ticket operations

import { Ticket, TicketSolution } from '@/types';
import { adminDb } from './firebase-admin';

/**
 * Ticket acknowledgment record
 */
export interface TicketAcknowledgment {
    ticketId: string;
    solutionId: string;
    acknowledgmentedBy: string;
    acknowledgmentedByName: string;
    accepted: boolean;
    feedback?: string;
    acknowledgedAt: Date;
}

/**
 * Validation result for ticket operations
 */
export interface TicketValidationResult {
    valid: boolean;
    error?: string;
    warnings?: string[];
}

/**
 * Enhanced Ticket Service with full business rule enforcement
 */
export class EnhancedTicketService {

    /**
     * Validate if a ticket can be resolved
     */
    static validateResolution(ticket: Ticket): TicketValidationResult {
        const errors: string[] = [];

        // Must have at least one solution
        if (!ticket.solutions || ticket.solutions.length === 0) {
            errors.push('Cannot resolve ticket without at least one solution');
        }

        // Cannot resolve already closed ticket
        if (ticket.status === 'closed') {
            errors.push('Cannot resolve a closed ticket');
        }

        // Must be assigned
        if (!ticket.assignedTo) {
            errors.push('Cannot resolve unassigned ticket');
        }

        return {
            valid: errors.length === 0,
            error: errors.join('; ')
        };
    }

    /**
     * Validate if a ticket can be closed
     */
    static validateClosure(ticket: Ticket): TicketValidationResult {
        const errors: string[] = [];
        const warnings: string[] = [];

        // Must be resolved first
        if (ticket.status !== 'resolved') {
            errors.push('Ticket must be resolved before closing');
        }

        // Check if solutions are acknowledged
        const hasAcceptedSolution = ticket.solutions?.some(s => s.isAccepted === true);
        if (!hasAcceptedSolution) {
            warnings.push('Closing ticket without requester acknowledgment of solution');
        }

        return {
            valid: errors.length === 0,
            error: errors.join('; '),
            warnings
        };
    }

    /**
     * Validate ticket assignment
     */
    static async validateAssignment(
        assignedTo: string
    ): Promise<TicketValidationResult> {
        try {
            // Check if assignee exists
            const userDoc = await adminDb.collection('users').doc(assignedTo).get();
            if (!userDoc.exists) {
                return {
                    valid: false,
                    error: 'Assigned user does not exist'
                };
            }

            // Check if user has appropriate role (optional - depends on requirements)
            // const userData = userDoc.data();
            // You could check role here: if (!['admin', 'support', 'manager'].includes(userData?.role)) ...

            return { valid: true };
        } catch (error) {
            return {
                valid: false,
                error: 'Failed to validate assignee'
            };
        }
    }

    /**
     * Add solution to ticket with validation
     */
    static async addSolution(
        ticketId: string,
        solutionText: string,
        addedBy: string,
        addedByName: string
    ): Promise<{ success: boolean; error?: string; solutionId?: string }> {
        try {
            // Fetch ticket
            const ticketDoc = await adminDb.collection('tickets').doc(ticketId).get();
            if (!ticketDoc.exists) {
                return { success: false, error: 'Ticket not found' };
            }

            const ticket = { id: ticketDoc.id, ...ticketDoc.data() } as Ticket;

            // Cannot add solution to closed ticket
            if (ticket.status === 'closed') {
                return { success: false, error: 'Cannot add solution to closed ticket' };
            }

            // Solution must be meaningful
            if (!solutionText || solutionText.trim().length < 10) {
                return { success: false, error: 'Solution must be at least 10 characters' };
            }

            const newSolution: TicketSolution = {
                id: `sol-${Date.now()}`,
                ticketId,
                solutionText,
                addedBy,
                addedByName,
                addedAt: new Date(),
                isAccepted: false // Default to not accepted
            };

            // Use batch for transactional update
            const batch = adminDb.batch();
            const ticketRef = adminDb.collection('tickets').doc(ticketId);

            // Add solution to ticket
            batch.update(ticketRef, {
                solutions: [...(ticket.solutions || []), newSolution],
                updatedAt: new Date()
            });

            // Add activity log
            const activityRef = adminDb.collection('tickets').doc(ticketId).collection('activityLog').doc();
            batch.set(activityRef, {
                userId: addedBy,
                action: 'solution_added',
                details: 'Solution added to ticket',
                timestamp: new Date()
            });

            // Add to audit log
            const auditRef = adminDb.collection('auditLogs').doc();
            batch.set(auditRef, {
                entityType: 'ticket',
                entityId: ticketId,
                operation: 'solution_added',
                userId: addedBy,
                timestamp: new Date(),
                changes: { solutionId: newSolution.id }
            });

            await batch.commit();

            return {
                success: true,
                solutionId: newSolution.id
            };
        } catch (error) {
            console.error('Error adding solution:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to add solution'
            };
        }
    }

    /**
     * Resolve ticket with full validation
     */
    static async resolveTicket(
        ticketId: string,
        resolvedBy: string,
        resolvedByName: string
    ): Promise<{ success: boolean; error?: string; warnings?: string[] }> {
        try {
            // Fetch ticket
            const ticketDoc = await adminDb.collection('tickets').doc(ticketId).get();
            if (!ticketDoc.exists) {
                return { success: false, error: 'Ticket not found' };
            }

            const ticket = { id: ticketDoc.id, ...ticketDoc.data() } as Ticket;

            // Validate resolution
            const validation = this.validateResolution(ticket);
            if (!validation.valid) {
                return { success: false, error: validation.error };
            }

            const batch = adminDb.batch();
            const ticketRef = adminDb.collection('tickets').doc(ticketId);

            // Update ticket status
            batch.update(ticketRef, {
                status: 'resolved',
                resolvedBy,
                resolvedByName,
                resolvedAt: new Date(),
                updatedAt: new Date()
            });

            // Add activity log
            const activityRef = ticketRef.collection('activityLog').doc();
            batch.set(activityRef, {
                userId: resolvedBy,
                action: 'resolved',
                details: 'Ticket marked as resolved',
                timestamp: new Date()
            });

            // Add audit log
            const auditRef = adminDb.collection('auditLogs').doc();
            batch.set(auditRef, {
                entityType: 'ticket',
                entityId: ticketId,
                operation: 'resolution',
                userId: resolvedBy,
                timestamp: new Date()
            });

            await batch.commit();

            return {
                success: true,
                warnings: validation.warnings
            };
        } catch (error) {
            console.error('Error resolving ticket:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to resolve ticket'
            };
        }
    }

    /**
     * Acknowledge solution (requester confirms solution worked)
     */
    static async acknowledgeSolution(
        ticketId: string,
        solutionId: string,
        acknowledgedBy: string,
        acknowledgedByName: string,
        accepted: boolean,
        feedback?: string
    ): Promise<{ success: boolean; error?: string }> {
        try {
            // Fetch ticket
            const ticketDoc = await adminDb.collection('tickets').doc(ticketId).get();
            if (!ticketDoc.exists) {
                return { success: false, error: 'Ticket not found' };
            }

            const ticket = { id: ticketDoc.id, ...ticketDoc.data() } as Ticket;

            // Verify acknowledger is the requester
            if (ticket.requesterId !== acknowledgedBy) {
                return { success: false, error: 'Only the requester can acknowledge solutions' };
            }

            // Find solution
            const solution = ticket.solutions?.find(s => s.id === solutionId);
            if (!solution) {
                return { success: false, error: 'Solution not found' };
            }

            // Update solution
            const updatedSolutions = ticket.solutions?.map(s =>
                s.id === solutionId ? { ...s, isAccepted: accepted } : s
            );

            // Create acknowledgment record
            const acknowledgment: TicketAcknowledgment = {
                ticketId,
                solutionId,
                acknowledgmentedBy: acknowledgedBy,
                acknowledgmentedByName: acknowledgedByName,
                accepted,
                feedback,
                acknowledgedAt: new Date()
            };

            const batch = adminDb.batch();

            // Update ticket
            const ticketRef = adminDb.collection('tickets').doc(ticketId);
            batch.update(ticketRef, {
                solutions: updatedSolutions,
                updatedAt: new Date()
            });

            // Store acknowledgment
            const ackRef = adminDb.collection('ticketAcknowledgments').doc();
            batch.set(ackRef, acknowledgment);

            // Add activity log
            const activityRef = ticketRef.collection('activityLog').doc();
            batch.set(activityRef, {
                userId: acknowledgedBy,
                action: accepted ? 'solution_accepted' : 'solution_rejected',
                details: `Solution ${accepted ? 'accepted' : 'rejected'}: ${feedback || 'No feedback provided'}`,
                timestamp: new Date()
            });

            // If rejected and ticket is resolved, reopen it
            if (!accepted && ticket.status === 'resolved') {
                batch.update(ticketRef, {
                    status: 'in_progress'
                });
            }

            await batch.commit();

            return { success: true };
        } catch (error) {
            console.error('Error acknowledging solution:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to acknowledge solution'
            };
        }
    }

    /**
     * Close ticket with validation
     */
    static async closeTicket(
        ticketId: string,
        closedBy: string,
        force: boolean = false
    ): Promise<{ success: boolean; error?: string; warnings?: string[] }> {
        try {
            // Fetch ticket
            const ticketDoc = await adminDb.collection('tickets').doc(ticketId).get();
            if (!ticketDoc.exists) {
                return { success: false, error: 'Ticket not found' };
            }

            const ticket = { id: ticketDoc.id, ...ticketDoc.data() } as Ticket;

            // Validate closure
            const validation = this.validateClosure(ticket);
            if (!validation.valid) {
                return { success: false, error: validation.error };
            }

            // If not forced and there are warnings, require force
            if (!force && validation.warnings && validation.warnings.length > 0) {
                return {
                    success: false,
                    error: 'Closure requires force=true due to warnings',
                    warnings: validation.warnings
                };
            }

            const batch = adminDb.batch();
            const ticketRef = adminDb.collection('tickets').doc(ticketId);

            // Close ticket
            batch.update(ticketRef, {
                status: 'closed',
                closedBy,
                closedAt: new Date(),
                updatedAt: new Date()
            });

            // Add activity log
            const activityRef = ticketRef.collection('activityLog').doc();
            batch.set(activityRef, {
                userId: closedBy,
                action: 'closed',
                details: force ? 'Ticket force-closed' : 'Ticket closed',
                timestamp: new Date()
            });

            // Add audit log
            const auditRef = adminDb.collection('auditLogs').doc();
            batch.set(auditRef, {
                entityType: 'ticket',
                entityId: ticketId,
                operation: 'closure',
                userId: closedBy,
                timestamp: new Date(),
                changes: { forced: force }
            });

            await batch.commit();

            return {
                success: true,
                warnings: validation.warnings
            };
        } catch (error) {
            console.error('Error closing ticket:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to close ticket'
            };
        }
    }

    /**
     * Auto-close stale resolved tickets (for cron job)
     * Closes tickets that have been resolved for N days without activity
     */
    static async autoCloseStaleTickets(
        staleDays: number = 7
    ): Promise<{
        success: boolean;
        closedCount: number;
        errors: string[];
    }> {
        try {
            const errors: string[] = [];
            let closedCount = 0;

            const staleDate = new Date();
            staleDate.setDate(staleDate.getDate() - staleDays);

            // Fetch resolved tickets older than staleDate
            const ticketsSnapshot = await adminDb.collection('tickets')
                .where('status', '==', 'resolved')
                .where('resolvedAt', '<=', staleDate)
                .get();

            const batch = adminDb.batch();
            let batchCount = 0;

            for (const ticketDoc of ticketsSnapshot.docs) {
                const ticket = { id: ticketDoc.id, ...ticketDoc.data() } as Ticket;

                // Check if requester acknowledged any solution
                const hasAcceptedSolution = ticket.solutions?.some(s => s.isAccepted === true);

                // Only auto-close if solution was accepted or no activity for stale period
                if (hasAcceptedSolution) {
                    const ticketRef = adminDb.collection('tickets').doc(ticket.id);

                    batch.update(ticketRef, {
                        status: 'closed',
                        closedBy: 'system',
                        closedAt: new Date(),
                        autoClosedReason: `Auto-closed after ${staleDays} days in resolved status`,
                        updatedAt: new Date()
                    });

                    // Add activity log
                    const activityRef = ticketRef.collection('activityLog').doc();
                    batch.set(activityRef, {
                        userId: 'system',
                        action: 'auto_closed',
                        details: `Ticket auto-closed after ${staleDays} days in resolved status`,
                        timestamp: new Date()
                    });

                    closedCount++;
                    batchCount += 2;

                    // Commit batch every 400 operations
                    if (batchCount >= 400) {
                        await batch.commit();
                        batchCount = 0;
                    }
                }
            }

            // Commit remaining operations
            if (batchCount > 0) {
                await batch.commit();
            }

            return {
                success: true,
                closedCount,
                errors
            };
        } catch (error) {
            console.error('Error auto-closing stale tickets:', error);
            return {
                success: false,
                closedCount: 0,
                errors: [error instanceof Error ? error.message : 'Unknown error']
            };
        }
    }

    /**
     * Assign ticket with validation
     */
    static async assignTicket(
        ticketId: string,
        assignedTo: string,
        assignedToName: string,
        assignedBy: string
    ): Promise<{ success: boolean; error?: string }> {
        try {
            // Validate assignment
            const validation = await this.validateAssignment(assignedTo);
            if (!validation.valid) {
                return { success: false, error: validation.error };
            }

            // Fetch ticket
            const ticketDoc = await adminDb.collection('tickets').doc(ticketId).get();
            if (!ticketDoc.exists) {
                return { success: false, error: 'Ticket not found' };
            }

            const batch = adminDb.batch();
            const ticketRef = adminDb.collection('tickets').doc(ticketId);

            // Assign ticket
            batch.update(ticketRef, {
                assignedTo,
                assignedToName,
                assignedAt: new Date(),
                status: 'in_progress',
                updatedAt: new Date()
            });

            // Add activity log
            const activityRef = ticketRef.collection('activityLog').doc();
            batch.set(activityRef, {
                userId: assignedBy,
                action: 'assigned',
                details: `Assigned to ${assignedToName}`,
                timestamp: new Date()
            });

            await batch.commit();

            return { success: true };
        } catch (error) {
            console.error('Error assigning ticket:', error);
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to assign ticket'
            };
        }
    }
}
