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
    serverTimestamp,
    deleteDoc
} from 'firebase/firestore'
import type { Objective, KeyResult, OKRProgress, OKRStats, OKRTimeframe, OKRStatus } from '@/types'

/**
 * OKR Service
 * Handles Objectives and Key Results management
 */
export class OKRService {
    private objectivesCollection = collection(db, 'objectives')
    private keyResultsCollection = collection(db, 'keyResults')

    // ========================================
    // OBJECTIVE METHODS
    // ========================================

    /**
     * Create a new objective
     */
    async createObjective(data: Omit<Objective, 'id' | 'progress' | 'keyResultIds' | 'createdAt' | 'updatedAt'>): Promise<string> {
        const objectiveData = {
            ...data,
            progress: 0,
            keyResultIds: [],
            status: data.status || 'draft',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        }

        const docRef = await addDoc(this.objectivesCollection, objectiveData)
        return docRef.id
    }

    /**
     * Get objective by ID
     */
    async getObjective(objectiveId: string): Promise<Objective | null> {
        const docRef = doc(this.objectivesCollection, objectiveId)
        const snapshot = await getDoc(docRef)

        if (!snapshot.exists()) return null

        const data = snapshot.data()
        return {
            id: snapshot.id,
            ...data,
            startDate: data.startDate?.toDate(),
            endDate: data.endDate?.toDate(),
            createdAt: data.createdAt?.toDate(),
            updatedAt: data.updatedAt?.toDate(),
            completedAt: data.completedAt?.toDate(),
        } as Objective
    }

    /**
     * Get all objectives with optional filters
     */
    async getObjectives(filters?: {
        status?: OKRStatus
        timeframe?: OKRTimeframe
        ownerId?: string
        teamId?: string
        year?: number
        quarter?: number
    }): Promise<Objective[]> {
        let q = query(this.objectivesCollection, orderBy('createdAt', 'desc'))

        if (filters?.status) {
            q = query(q, where('status', '==', filters.status))
        }
        if (filters?.timeframe) {
            q = query(q, where('timeframe', '==', filters.timeframe))
        }
        if (filters?.ownerId) {
            q = query(q, where('ownerId', '==', filters.ownerId))
        }
        if (filters?.teamId) {
            q = query(q, where('teamId', '==', filters.teamId))
        }
        if (filters?.year) {
            q = query(q, where('year', '==', filters.year))
        }
        if (filters?.quarter) {
            q = query(q, where('quarter', '==', filters.quarter))
        }

        const snapshot = await getDocs(q)
        return snapshot.docs.map(doc => {
            const data = doc.data()
            return {
                id: doc.id,
                ...data,
                startDate: data.startDate?.toDate(),
                endDate: data.endDate?.toDate(),
                createdAt: data.createdAt?.toDate(),
                updatedAt: data.updatedAt?.toDate(),
                completedAt: data.completedAt?.toDate(),
            }
        }) as Objective[]
    }

    /**
     * Update objective
     */
    async updateObjective(objectiveId: string, data: Partial<Objective>): Promise<void> {
        const docRef = doc(this.objectivesCollection, objectiveId)
        await updateDoc(docRef, {
            ...data,
            updatedAt: serverTimestamp()
        })
    }

    /**
     * Delete objective
     */
    async deleteObjective(objectiveId: string): Promise<void> {
        // Delete all key results first
        const keyResults = await this.getKeyResultsByObjective(objectiveId)
        await Promise.all(keyResults.map(kr => this.deleteKeyResult(kr.id)))

        // Delete objective
        const docRef = doc(this.objectivesCollection, objectiveId)
        await deleteDoc(docRef)
    }

    // ========================================
    // KEY RESULT METHODS
    // ========================================

    /**
     * Create a new key result
     */
    async createKeyResult(data: Omit<KeyResult, 'id' | 'progress' | 'createdAt' | 'updatedAt'>): Promise<string> {
        // Calculate initial progress
        const progress = this.calculateKeyResultProgress(
            data.startValue,
            data.currentValue,
            data.targetValue
        )

        const keyResultData = {
            ...data,
            progress,
            status: data.status || 'draft',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        }

        const docRef = await addDoc(this.keyResultsCollection, keyResultData)

        // Update objective's keyResultIds
        const objective = await this.getObjective(data.objectiveId)
        if (objective) {
            await this.updateObjective(data.objectiveId, {
                keyResultIds: [...objective.keyResultIds, docRef.id]
            })

            // Recalculate objective progress
            await this.recalculateObjectiveProgress(data.objectiveId)
        }

        return docRef.id
    }

    /**
     * Get key result by ID
     */
    async getKeyResult(keyResultId: string): Promise<KeyResult | null> {
        const docRef = doc(this.keyResultsCollection, keyResultId)
        const snapshot = await getDoc(docRef)

        if (!snapshot.exists()) return null

        const data = snapshot.data()
        return {
            id: snapshot.id,
            ...data,
            createdAt: data.createdAt?.toDate(),
            updatedAt: data.updatedAt?.toDate(),
            completedAt: data.completedAt?.toDate(),
        } as KeyResult
    }

    /**
     * Get key results for an objective
     */
    async getKeyResultsByObjective(objectiveId: string): Promise<KeyResult[]> {
        const q = query(
            this.keyResultsCollection,
            where('objectiveId', '==', objectiveId)
        )

        const snapshot = await getDocs(q)
        return snapshot.docs.map(doc => {
            const data = doc.data()
            return {
                id: doc.id,
                ...data,
                createdAt: data.createdAt?.toDate(),
                updatedAt: data.updatedAt?.toDate(),
                completedAt: data.completedAt?.toDate(),
            }
        }) as KeyResult[]
    }

    /**
     * Update key result
     */
    async updateKeyResult(keyResultId: string, data: Partial<KeyResult>): Promise<void> {
        const keyResult = await this.getKeyResult(keyResultId)
        if (!keyResult) throw new Error('Key result not found')

        // Recalculate progress if values changed
        let progress = data.progress
        if (data.currentValue !== undefined || data.targetValue !== undefined || data.startValue !== undefined) {
            progress = this.calculateKeyResultProgress(
                data.startValue ?? keyResult.startValue,
                data.currentValue ?? keyResult.currentValue,
                data.targetValue ?? keyResult.targetValue
            )
        }

        const docRef = doc(this.keyResultsCollection, keyResultId)
        await updateDoc(docRef, {
            ...data,
            progress,
            updatedAt: serverTimestamp()
        })

        // Recalculate objective progress
        await this.recalculateObjectiveProgress(keyResult.objectiveId)
    }

    /**
     * Delete key result
     */
    async deleteKeyResult(keyResultId: string): Promise<void> {
        const keyResult = await this.getKeyResult(keyResultId)
        if (!keyResult) return

        // Remove from objective's keyResultIds
        const objective = await this.getObjective(keyResult.objectiveId)
        if (objective) {
            await this.updateObjective(keyResult.objectiveId, {
                keyResultIds: objective.keyResultIds.filter(id => id !== keyResultId)
            })
        }

        // Delete key result
        const docRef = doc(this.keyResultsCollection, keyResultId)
        await deleteDoc(docRef)

        // Recalculate objective progress
        await this.recalculateObjectiveProgress(keyResult.objectiveId)
    }

    // ========================================
    // PROGRESS CALCULATION
    // ========================================

    /**
     * Calculate key result progress (0-100)
     */
    private calculateKeyResultProgress(startValue: number, currentValue: number, targetValue: number): number {
        if (targetValue === startValue) return 100

        const progress = ((currentValue - startValue) / (targetValue - startValue)) * 100
        return Math.max(0, Math.min(100, Math.round(progress)))
    }

    /**
     * Recalculate objective progress based on key results
     */
    async recalculateObjectiveProgress(objectiveId: string): Promise<void> {
        const keyResults = await this.getKeyResultsByObjective(objectiveId)

        if (keyResults.length === 0) {
            await this.updateObjective(objectiveId, { progress: 0 })
            return
        }

        const totalProgress = keyResults.reduce((sum, kr) => sum + kr.progress, 0)
        const avgProgress = Math.round(totalProgress / keyResults.length)

        await this.updateObjective(objectiveId, { progress: avgProgress })
    }

    /**
     * Get OKR progress for an objective
     */
    async getOKRProgress(objectiveId: string): Promise<OKRProgress | null> {
        const objective = await this.getObjective(objectiveId)
        if (!objective) return null

        const keyResults = await this.getKeyResultsByObjective(objectiveId)

        // Get actual completed tasks count from Firestore
        let tasksCompleted = 0
        const tasksTotal = objective.linkedTaskIds?.length || 0

        if (objective.linkedTaskIds && objective.linkedTaskIds.length > 0) {
            const tasksSnapshot = await getDocs(query(
                collection(db, 'tasks'),
                where('__name__', 'in', objective.linkedTaskIds)
            ))
            tasksCompleted = tasksSnapshot.docs.filter(doc => doc.data().status === 'completed').length
        }

        return {
            objectiveId: objective.id,
            objectiveTitle: objective.title,
            progress: objective.progress,
            keyResults: keyResults.map(kr => ({
                id: kr.id,
                title: kr.title,
                progress: kr.progress,
                currentValue: kr.currentValue,
                targetValue: kr.targetValue
            })),
            tasksCompleted,
            tasksTotal
        }
    }

    /**
     * Get OKR statistics
     */
    async getOKRStats(filters?: { teamId?: string; year?: number }): Promise<OKRStats> {
        const objectives = await this.getObjectives(filters)

        const stats: OKRStats = {
            total: objectives.length,
            active: objectives.filter(o => o.status === 'active').length,
            completed: objectives.filter(o => o.status === 'completed').length,
            draft: objectives.filter(o => o.status === 'draft').length,
            cancelled: objectives.filter(o => o.status === 'cancelled').length,
            avgProgress: 0,
            onTrack: objectives.filter(o => o.progress >= 70).length,
            atRisk: objectives.filter(o => o.progress < 70 && o.status === 'active').length,
            byTimeframe: {
                quarterly: objectives.filter(o => o.timeframe === 'quarterly').length,
                yearly: objectives.filter(o => o.timeframe === 'yearly').length
            },
            byTeam: {}
        }

        // Calculate average progress
        if (objectives.length > 0) {
            const totalProgress = objectives.reduce((sum, o) => sum + o.progress, 0)
            stats.avgProgress = Math.round(totalProgress / objectives.length)
        }

        // Count by team
        objectives.forEach(objective => {
            if (objective.teamName) {
                stats.byTeam[objective.teamName] = (stats.byTeam[objective.teamName] || 0) + 1
            }
        })

        return stats
    }
}

// Export singleton instance
export const okrService = new OKRService()
