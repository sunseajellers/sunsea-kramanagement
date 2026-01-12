'use server'

import { db } from '@/lib/firebase'
import { collection, doc, addDoc, updateDoc, deleteDoc, getDocs, query, where, getDoc, Timestamp, orderBy } from 'firebase/firestore'
import { KPI } from '@/types'

const COLLECTION = 'kpis'

/**
 * Create a new KPI
 */
export async function createKPI(kpiData: Omit<KPI, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    const now = new Date()
    const docRef = await addDoc(collection(db, COLLECTION), {
        ...kpiData,
        weekStartDate: Timestamp.fromDate(kpiData.weekStartDate),
        createdAt: Timestamp.fromDate(now),
        updatedAt: Timestamp.fromDate(now),
    })
    return docRef.id
}

/**
 * Get all KPIs for a specific KRA
 */
export async function getKPIsByKRA(kraId: string): Promise<KPI[]> {
    const q = query(collection(db, COLLECTION), where('kraId', '==', kraId), orderBy('createdAt', 'desc'))
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        weekStartDate: doc.data().weekStartDate?.toDate?.() || new Date(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
    } as KPI))
}

/**
 * Get all KPIs for a specific user
 */
export async function getKPIsByUser(userId: string): Promise<KPI[]> {
    const q = query(collection(db, COLLECTION), where('userId', '==', userId), orderBy('weekStartDate', 'desc'))
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        weekStartDate: doc.data().weekStartDate?.toDate?.() || new Date(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
    } as KPI))
}

/**
 * Get a single KPI by ID
 */
export async function getKPI(kpiId: string): Promise<KPI | null> {
    const docRef = doc(db, COLLECTION, kpiId)
    const snapshot = await getDoc(docRef)
    if (!snapshot.exists()) return null
    return {
        id: snapshot.id,
        ...snapshot.data(),
        weekStartDate: snapshot.data().weekStartDate?.toDate?.() || new Date(),
        createdAt: snapshot.data().createdAt?.toDate?.() || new Date(),
        updatedAt: snapshot.data().updatedAt?.toDate?.() || new Date(),
    } as KPI
}

/**
 * Update a KPI
 */
export async function updateKPI(kpiId: string, updates: Partial<Omit<KPI, 'id' | 'createdAt'>>): Promise<void> {
    const docRef = doc(db, COLLECTION, kpiId)
    const updateData: any = {
        ...updates,
        updatedAt: Timestamp.fromDate(new Date()),
    }
    if (updates.weekStartDate) {
        updateData.weekStartDate = Timestamp.fromDate(updates.weekStartDate)
    }
    await updateDoc(docRef, updateData)
}

/**
 * Delete a KPI
 */
export async function deleteKPI(kpiId: string): Promise<void> {
    const docRef = doc(db, COLLECTION, kpiId)
    await deleteDoc(docRef)
}

/**
 * Roll over KPIs to a new week
 * This moves currentWeekActual to lastWeekActual and resets for the new week
 */
export async function rolloverKPIsForUser(userId: string): Promise<void> {
    const kpis = await getKPIsByUser(userId)
    const now = new Date()

    // Get Monday of the current week
    const dayOfWeek = now.getDay()
    const monday = new Date(now)
    monday.setDate(now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))
    monday.setHours(0, 0, 0, 0)

    for (const kpi of kpis) {
        // Check if this KPI is from a previous week
        if (kpi.weekStartDate < monday) {
            await updateKPI(kpi.id, {
                lastWeekActual: kpi.currentWeekActual,
                currentWeekPlanned: kpi.nextWeekTarget,
                currentWeekActual: 0,
                nextWeekTarget: kpi.nextWeekTarget, // Keep the same target
                weekStartDate: monday,
                previousWeekCommitment: `Carried over from week of ${kpi.weekStartDate.toLocaleDateString()}`,
            })
        }
    }
}

/**
 * Get all KPIs (for admin dashboard)
 */
export async function getAllKPIs(): Promise<KPI[]> {
    const q = query(collection(db, COLLECTION), orderBy('updatedAt', 'desc'))
    const snapshot = await getDocs(q)
    return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        weekStartDate: doc.data().weekStartDate?.toDate?.() || new Date(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate?.() || new Date(),
    } as KPI))
}
