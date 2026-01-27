// src/lib/server/notificationService.ts
import { adminDb } from '../firebase-admin';
import { timestampToDate, handleError } from '../utils';

/**
 * Notification Service (Server-side)
 * Uses Admin SDK for Firestore operations.
 */
export async function getUserNotifications(userId: string, unreadOnly = false, limitCount = 50) {
    try {
        let query: any = adminDb.collection('notifications')
            .where('userId', '==', userId)
            .orderBy('createdAt', 'desc')
            .limit(limitCount);

        if (unreadOnly) {
            query = query.where('read', '==', false);
        }

        const snapshot = await query.get();
        return snapshot.docs.map((doc: any) => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: timestampToDate(data.createdAt),
                readAt: timestampToDate(data.readAt),
            };
        });
    } catch (error) {
        handleError(error, 'Failed to fetch notifications via Admin SDK');
        throw error;
    }
}

export async function createNotification(data: any): Promise<string> {
    try {
        const docRef = await adminDb.collection('notifications').add({
            ...data,
            read: false,
            createdAt: new Date()
        });
        return docRef.id;
    } catch (error) {
        handleError(error, 'Failed to create notification via Admin SDK');
        throw error;
    }
}

export async function getUnreadCount(userId: string): Promise<number> {
    try {
        const snapshot = await adminDb.collection('notifications')
            .where('userId', '==', userId)
            .where('read', '==', false)
            .get();
        return snapshot.size;
    } catch (error) {
        handleError(error, 'Failed to get unread count via Admin SDK');
        throw error;
    }
}

export async function markAsRead(notificationId: string): Promise<void> {
    try {
        await adminDb.collection('notifications').doc(notificationId).update({
            read: true,
            readAt: new Date()
        });
    } catch (error) {
        handleError(error, 'Failed to mark notification as read via Admin SDK');
        throw error;
    }
}

/**
 * Notify when task is submitted for review
 */
export async function notifyTaskSubmitted(taskId: string, taskTitle: string, submittedByName: string, adminIds: string[]) {
    const promises = adminIds.map(userId =>
        createNotification({
            userId,
            type: 'task_submitted',
            title: 'Task Awaiting Review',
            message: `${submittedByName} submitted: "${taskTitle}" for verification.`,
            link: `/admin/operations?verification=true`,
            metadata: { taskId, taskTitle }
        })
    );
    await Promise.all(promises);
}

/**
 * Notify when task is verified
 */
export async function notifyTaskVerified(taskId: string, taskTitle: string, assignedToIds: string[]) {
    const promises = assignedToIds.map(userId =>
        createNotification({
            userId,
            type: 'task_verified',
            title: 'Task Approved',
            message: `Work validated: "${taskTitle}" has been marked as completed.`,
            link: `/admin/operations`,
            metadata: { taskId, taskTitle }
        })
    );
    await Promise.all(promises);
}

/**
 * Notify when task is rejected / revision requested
 */
export async function notifyTaskRejected(taskId: string, taskTitle: string, assignedToIds: string[], reason: string) {
    const promises = assignedToIds.map(userId =>
        createNotification({
            userId,
            type: 'task_revision',
            title: 'Revision Requested',
            message: `Task "${taskTitle}": ${reason}`,
            link: `/admin/operations`,
            metadata: { taskId, taskTitle, reason }
        })
    );
    await Promise.all(promises);
}
