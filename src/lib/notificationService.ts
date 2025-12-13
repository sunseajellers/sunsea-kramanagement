// src/lib/notificationService.ts
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from './firebase';
import { Notification } from '@/types';
import { timestampToDate, handleError } from './utils';

/**
 * Fetch the latest notifications for a given user.
 * Returns at most `limitCount` items ordered by newest first.
 */
export async function getUserNotifications(
    uid: string,
    limitCount = 10
): Promise<Notification[]> {
    try {
        const q = query(
            collection(db, 'notifications'),
            where('userId', '==', uid),
            orderBy('createdAt', 'desc'),
            limit(limitCount)
        );

        const snap = await getDocs(q);
        return snap.docs.map((doc) => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: timestampToDate(data.createdAt)
            } as Notification;
        });
    } catch (error) {
        handleError(error, 'Failed to fetch notifications');
        throw error;
    }
}
