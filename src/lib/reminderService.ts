// src/lib/reminderService.ts
import { collection, query, where, getDocs, addDoc, doc, updateDoc, deleteDoc, orderBy } from 'firebase/firestore';
import { db } from './firebase';
import { timestampToDate, handleError } from './utils';
import { createNotification } from './notificationService';

/**
 * Reminder Interface
 */
export interface Reminder {
    id: string
    userId: string
    title: string
    message: string
    type: 'task' | 'kra' | 'meeting' | 'custom'
    relatedId?: string // taskId or kraId
    reminderAt: Date
    status: 'pending' | 'sent' | 'snoozed' | 'dismissed'
    snoozeCount: number
    snoozeUntil?: Date
    priority: 'low' | 'medium' | 'high'
    createdAt: Date
    updatedAt: Date
}

/**
 * Get user's reminders
 */
export async function getUserReminders(userId: string): Promise<Reminder[]> {
    try {
        const q = query(
            collection(db, 'reminders'),
            where('userId', '==', userId),
            where('status', 'in', ['pending', 'snoozed']),
            orderBy('reminderAt', 'asc')
        );
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            reminderAt: timestampToDate(doc.data().reminderAt),
            snoozeUntil: timestampToDate(doc.data().snoozeUntil),
            createdAt: timestampToDate(doc.data().createdAt),
            updatedAt: timestampToDate(doc.data().updatedAt)
        })) as Reminder[];
    } catch (error) {
        handleError(error, 'Failed to fetch reminders');
        throw error;
    }
}

/**
 * Create a reminder
 */
export async function createReminder(
    reminderData: Omit<Reminder, 'id' | 'status' | 'snoozeCount' | 'createdAt' | 'updatedAt'>
): Promise<string> {
    try {
        const docRef = await addDoc(collection(db, 'reminders'), {
            ...reminderData,
            status: 'pending',
            snoozeCount: 0,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        return docRef.id;
    } catch (error) {
        handleError(error, 'Failed to create reminder');
        throw error;
    }
}

/**
 * Snooze a reminder
 */
export async function snoozeReminder(reminderId: string, snoozeMinutes: number = 30): Promise<void> {
    try {
        const snoozeUntil = new Date();
        snoozeUntil.setMinutes(snoozeUntil.getMinutes() + snoozeMinutes);

        await updateDoc(doc(db, 'reminders', reminderId), {
            status: 'snoozed',
            snoozeUntil,
            snoozeCount: ((await getReminder(reminderId))?.snoozeCount ?? 0) + 1,
            reminderAt: snoozeUntil,
            updatedAt: new Date()
        });
    } catch (error) {
        handleError(error, 'Failed to snooze reminder');
        throw error;
    }
}

/**
 * Dismiss a reminder
 */
export async function dismissReminder(reminderId: string): Promise<void> {
    try {
        await updateDoc(doc(db, 'reminders', reminderId), {
            status: 'dismissed',
            updatedAt: new Date()
        });
    } catch (error) {
        handleError(error, 'Failed to dismiss reminder');
        throw error;
    }
}

/**
 * Delete a reminder
 */
export async function deleteReminder(reminderId: string): Promise<void> {
    try {
        await deleteDoc(doc(db, 'reminders', reminderId));
    } catch (error) {
        handleError(error, 'Failed to delete reminder');
        throw error;
    }
}

/**
 * Get a single reminder
 */
async function getReminder(reminderId: string): Promise<Reminder | null> {
    try {
        const snapshot = await getDocs(query(collection(db, 'reminders'), where('__name__', '==', reminderId)));
        if (snapshot.empty) return null;
        const data = snapshot.docs[0].data();
        return {
            id: snapshot.docs[0].id,
            ...data,
            reminderAt: timestampToDate(data.reminderAt),
            createdAt: timestampToDate(data.createdAt),
            updatedAt: timestampToDate(data.updatedAt)
        } as Reminder;
    } catch (error) {
        return null;
    }
}

/**
 * Process due reminders (called by cron)
 */
export async function processDueReminders(): Promise<{ sent: number; errors: string[] }> {
    const results = { sent: 0, errors: [] as string[] };

    try {
        const now = new Date();
        const q = query(
            collection(db, 'reminders'),
            where('status', 'in', ['pending', 'snoozed']),
            where('reminderAt', '<=', now)
        );

        const snapshot = await getDocs(q);

        for (const docSnap of snapshot.docs) {
            const reminder = { id: docSnap.id, ...docSnap.data() } as Reminder;

            try {
                // Send notification
                await createNotification({
                    userId: reminder.userId,
                    type: 'system_alert',
                    title: `Reminder: ${reminder.title}`,
                    message: reminder.message,
                    link: reminder.relatedId ? `/dashboard/${reminder.type}s/${reminder.relatedId}` : '/dashboard',
                    read: false,
                    createdAt: new Date()
                });

                // Mark as sent
                await updateDoc(doc(db, 'reminders', reminder.id), {
                    status: 'sent',
                    updatedAt: new Date()
                });

                results.sent++;
            } catch (error: any) {
                results.errors.push(`Reminder ${reminder.id}: ${error.message}`);
            }
        }

        return results;
    } catch (error) {
        handleError(error, 'Failed to process reminders');
        throw error;
    }
}

/**
 * Create quick reminder for a task
 */
export async function createTaskReminder(
    taskId: string,
    taskTitle: string,
    userId: string,
    reminderAt: Date
): Promise<string> {
    return createReminder({
        userId,
        title: `Task Reminder: ${taskTitle}`,
        message: `Don't forget to complete: ${taskTitle}`,
        type: 'task',
        relatedId: taskId,
        reminderAt,
        priority: 'medium'
    });
}
