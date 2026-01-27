import { db } from '@/lib/firebase'
import {
    collection,
    doc,
    addDoc,
    updateDoc,
    getDocs,
    query,
    where,
    orderBy,
    limit,
    serverTimestamp
} from 'firebase/firestore'

export type NotificationType =
    | 'task_assigned'
    | 'task_due_soon'
    | 'task_overdue'
    | 'task_submitted'
    | 'task_verified'
    | 'task_revision'
    | 'ticket_created'
    | 'ticket_assigned'
    | 'ticket_updated'
    | 'ticket_resolved'
    | 'kra_assigned'
    | 'kra_due_soon'
    | 'system'

export interface Notification {
    id: string
    userId: string
    type: NotificationType
    title: string
    message: string
    link?: string
    read: boolean
    createdAt: Date
    readAt?: Date
    metadata?: Record<string, any>
}

/**
 * Notification Service
 * Handles creation and management of user notifications
 */
export class NotificationService {
    private notificationsCollection = collection(db, 'notifications')

    /**
     * Create a notification
     */
    async createNotification(data: {
        userId: string
        type: NotificationType
        title: string
        message: string
        link?: string
        metadata?: Record<string, any>
    }): Promise<string> {
        const notificationData = {
            ...data,
            read: false,
            createdAt: serverTimestamp()
        }

        const docRef = await addDoc(this.notificationsCollection, notificationData)

        // TODO: Send email notification if user has email notifications enabled
        // TODO: Send push notification if user has push notifications enabled

        return docRef.id
    }

    /**
     * Get notifications for a user
     */
    async getUserNotifications(userId: string, unreadOnly = false, limitCount = 50): Promise<Notification[]> {
        let q = query(
            this.notificationsCollection,
            where('userId', '==', userId),
            orderBy('createdAt', 'desc'),
            limit(limitCount)
        )

        if (unreadOnly) {
            q = query(q, where('read', '==', false))
        }

        const snapshot = await getDocs(q)
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
            readAt: doc.data().readAt?.toDate(),
        })) as Notification[]
    }

    /**
     * Mark notification as read
     */
    async markAsRead(notificationId: string): Promise<void> {
        const docRef = doc(this.notificationsCollection, notificationId)
        await updateDoc(docRef, {
            read: true,
            readAt: serverTimestamp()
        })
    }

    /**
     * Mark all notifications as read for a user
     */
    async markAllAsRead(userId: string): Promise<void> {
        const notifications = await this.getUserNotifications(userId, true)

        const updatePromises = notifications.map(notification =>
            this.markAsRead(notification.id)
        )

        await Promise.all(updatePromises)
    }

    /**
     * Get unread count for a user
     */
    async getUnreadCount(userId: string): Promise<number> {
        const q = query(
            this.notificationsCollection,
            where('userId', '==', userId),
            where('read', '==', false)
        )

        const snapshot = await getDocs(q)
        return snapshot.size
    }

    // ========================================
    // NOTIFICATION TRIGGERS
    // ========================================

    /**
     * Notify when task is assigned
     */
    async notifyTaskAssigned(taskId: string, taskTitle: string, assignedToIds: string[], assignedByName: string): Promise<void> {
        const promises = assignedToIds.map(userId =>
            this.createNotification({
                userId,
                type: 'task_assigned',
                title: 'New Task Assigned',
                message: `${assignedByName} assigned you a task: "${taskTitle}"`,
                link: `/tasks/${taskId}`,
                metadata: { taskId, taskTitle }
            })
        )

        await Promise.all(promises)
    }

    /**
     * Notify when task is due soon (24 hours before)
     */
    async notifyTaskDueSoon(taskId: string, taskTitle: string, assignedToIds: string[], dueDate: Date): Promise<void> {
        const promises = assignedToIds.map(userId =>
            this.createNotification({
                userId,
                type: 'task_due_soon',
                title: 'Task Due Soon',
                message: `Task "${taskTitle}" is due tomorrow`,
                link: `/tasks/${taskId}`,
                metadata: { taskId, taskTitle, dueDate }
            })
        )

        await Promise.all(promises)
    }

    /**
     * Notify when task is overdue
     */
    async notifyTaskOverdue(taskId: string, taskTitle: string, assignedToIds: string[]): Promise<void> {
        const promises = assignedToIds.map(userId =>
            this.createNotification({
                userId,
                type: 'task_overdue',
                title: 'Task Overdue',
                message: `Task "${taskTitle}" is overdue. Please update the status.`,
                link: `/tasks/${taskId}`,
                metadata: { taskId, taskTitle }
            })
        )

        await Promise.all(promises)
    }

    /**
     * Notify when task is submitted for review
     */
    async notifyTaskSubmitted(taskId: string, taskTitle: string, submittedByName: string, adminIds: string[]): Promise<void> {
        const promises = adminIds.map(userId =>
            this.createNotification({
                userId,
                type: 'task_submitted',
                title: 'Task Awaiting Review',
                message: `${submittedByName} submitted: "${taskTitle}" for verification.`,
                link: `/admin/operations?tab=verification`,
                metadata: { taskId, taskTitle }
            })
        )
        await Promise.all(promises)
    }

    /**
     * Notify when task is verified
     */
    async notifyTaskVerified(taskId: string, taskTitle: string, assignedToIds: string[]): Promise<void> {
        const promises = assignedToIds.map(userId =>
            this.createNotification({
                userId,
                type: 'task_verified',
                title: 'Task Approved',
                message: `Work validated: "${taskTitle}" has been marked as completed.`,
                link: `/tasks/${taskId}`,
                metadata: { taskId, taskTitle }
            })
        )
        await Promise.all(promises)
    }

    /**
     * Notify when task is rejected / revision requested
     */
    async notifyTaskRejected(taskId: string, taskTitle: string, assignedToIds: string[], reason: string): Promise<void> {
        const promises = assignedToIds.map(userId =>
            this.createNotification({
                userId,
                type: 'task_revision',
                title: 'Revision Requested',
                message: `Task "${taskTitle}": ${reason}`,
                link: `/tasks/${taskId}`,
                metadata: { taskId, taskTitle, reason }
            })
        )
        await Promise.all(promises)
    }

    /**
     * Notify when ticket is created
     */
    async notifyTicketCreated(ticketId: string, ticketNumber: string, subject: string, adminIds: string[]): Promise<void> {
        const promises = adminIds.map(userId =>
            this.createNotification({
                userId,
                type: 'ticket_created',
                title: 'New Support Ticket',
                message: `New ticket ${ticketNumber}: "${subject}"`,
                link: `/helpdesk`,
                metadata: { ticketId, ticketNumber, subject }
            })
        )

        await Promise.all(promises)
    }

    /**
     * Notify when ticket is assigned
     */
    async notifyTicketAssigned(ticketId: string, ticketNumber: string, subject: string, assignedToId: string): Promise<void> {
        await this.createNotification({
            userId: assignedToId,
            type: 'ticket_assigned',
            title: 'Ticket Assigned to You',
            message: `You've been assigned ticket ${ticketNumber}: "${subject}"`,
            link: `/helpdesk`,
            metadata: { ticketId, ticketNumber, subject }
        })
    }

    /**
     * Notify when ticket is updated
     */
    async notifyTicketUpdated(ticketId: string, ticketNumber: string, requesterId: string, updateType: string): Promise<void> {
        await this.createNotification({
            userId: requesterId,
            type: 'ticket_updated',
            title: 'Ticket Updated',
            message: `Your ticket ${ticketNumber} has been updated: ${updateType}`,
            link: `/helpdesk`,
            metadata: { ticketId, ticketNumber, updateType }
        })
    }

    /**
     * Notify when ticket is resolved
     */
    async notifyTicketResolved(ticketId: string, ticketNumber: string, requesterId: string): Promise<void> {
        await this.createNotification({
            userId: requesterId,
            type: 'ticket_resolved',
            title: 'Ticket Resolved',
            message: `Your ticket ${ticketNumber} has been resolved`,
            link: `/helpdesk`,
            metadata: { ticketId, ticketNumber }
        })
    }
}

// Export singleton instance
export const notificationService = new NotificationService()
