'use server'

import { db } from '@/lib/firebase'
import { collection, addDoc, getDocs, query, where, orderBy, Timestamp, limit } from 'firebase/firestore'
import { TaskUpdate } from '@/types'

const COLLECTION = 'taskUpdates'

/**
 * Create a new task update
 */
export async function createTaskUpdate(updateData: Omit<TaskUpdate, 'id' | 'timestamp'>): Promise<string> {
    const docRef = await addDoc(collection(db, COLLECTION), {
        ...updateData,
        revisionDate: updateData.revisionDate ? Timestamp.fromDate(updateData.revisionDate) : null,
        timestamp: Timestamp.fromDate(new Date()),
    })
    return docRef.id
}

/**
 * Get all updates for a specific task
 */
export async function getTaskUpdatesByTask(taskId: string): Promise<TaskUpdate[]> {
    const q = query(
        collection(db, COLLECTION),
        where('taskId', '==', taskId),
        orderBy('timestamp', 'desc')
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        revisionDate: doc.data().revisionDate?.toDate?.() || null,
        timestamp: doc.data().timestamp?.toDate?.() || new Date(),
    } as TaskUpdate))
}

/**
 * Get all updates by a specific user
 */
export async function getTaskUpdatesByUser(userId: string): Promise<TaskUpdate[]> {
    const q = query(
        collection(db, COLLECTION),
        where('userId', '==', userId),
        orderBy('timestamp', 'desc')
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        revisionDate: doc.data().revisionDate?.toDate?.() || null,
        timestamp: doc.data().timestamp?.toDate?.() || new Date(),
    } as TaskUpdate))
}

/**
 * Get recent updates across all users (for admin view)
 */
export async function getRecentTaskUpdates(limitCount: number = 50): Promise<TaskUpdate[]> {
    const q = query(
        collection(db, COLLECTION),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
    )
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        revisionDate: doc.data().revisionDate?.toDate?.() || null,
        timestamp: doc.data().timestamp?.toDate?.() || new Date(),
    } as TaskUpdate))
}
