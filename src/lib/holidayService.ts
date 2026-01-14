import { collection, addDoc, deleteDoc, doc, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase'; // Client SDK for now, or Admin if server-side only. KRA Automation is likely server-side or scheduled.
// Using Client SDK for consistency with other client services unless this is strictly server-side.
// KRA Automation uses 'firebase/firestore', which is client SDK.

import { Holiday } from '@/types';
import { timestampToDate, handleError } from '@/lib/utils';
import { startOfDay, endOfDay } from 'date-fns';

const HOLIDAYS_COLLECTION = 'holidays';

/**
 * Add a new holiday
 */
export async function addHoliday(holiday: Omit<Holiday, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
        const docRef = await addDoc(collection(db, HOLIDAYS_COLLECTION), {
            ...holiday,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        return docRef.id;
    } catch (error) {
        handleError(error, 'Failed to add holiday');
        throw error;
    }
}

/**
 * Remove a holiday
 */
export async function removeHoliday(id: string): Promise<void> {
    try {
        await deleteDoc(doc(db, HOLIDAYS_COLLECTION, id));
    } catch (error) {
        handleError(error, 'Failed to delete holiday');
        throw error;
    }
}

/**
 * Get all holidays
 */
export async function getHolidays(): Promise<Holiday[]> {
    try {
        const q = query(collection(db, HOLIDAYS_COLLECTION));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            date: timestampToDate(doc.data().date),
            createdAt: timestampToDate(doc.data().createdAt),
            updatedAt: timestampToDate(doc.data().updatedAt)
        })) as Holiday[];
    } catch (error) {
        handleError(error, 'Failed to fetch holidays');
        throw error;
    }
}

/**
 * Check if a specific date is a holiday
 */
export async function isHoliday(date: Date): Promise<boolean> {
    try {
        // Query for holidays within the same day
        const start = startOfDay(date);
        const end = endOfDay(date);

        const q = query(
            collection(db, HOLIDAYS_COLLECTION),
            where('date', '>=', start),
            where('date', '<=', end)
        );

        const snapshot = await getDocs(q);
        return !snapshot.empty;
    } catch (error) {
        console.error('Error checking holiday status:', error);
        return false; // Default to not a holiday on error to prevent blocking work
    }
}

/**
 * Check if a date is a weekend (Sunday)
 * Assuming 6-day work week (Monday-Saturday) as common in many industries, or 5-day?
 * Prompt says "Suppress Off-days".
 * Jewelers often work Mon-Sat. Let's assume Sunday is off.
 */
export function isWeekend(date: Date): boolean {
    const day = date.getDay();
    return day === 0; // 0 is Sunday
}

/**
 * Check if a date is a working day (Not Holiday AND Not Weekend)
 * This logic should probably run mainly on Server/API side to avoid excessive DB calls from client.
 * But for now, we put it here to be imported by KRA Automation.
 */
export async function isWorkingDay(date: Date): Promise<boolean> {
    if (isWeekend(date)) return false;
    const holiday = await isHoliday(date);
    return !holiday;
}
