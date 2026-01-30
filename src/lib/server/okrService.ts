import { adminDb } from '@/lib/firebase-admin'
import type { Objective, KeyResult, OKRStats, OKRTimeframe, OKRStatus } from '@/types'
import { timestampToDate } from '@/lib/utils'

/**
 * Server-side OKR Service
 * Uses Admin SDK to bypass security rules
 */
export class ServerOKRService {
    private objectivesCollection = adminDb.collection('objectives')
    private keyResultsCollection = adminDb.collection('keyResults')

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
        let query: any = this.objectivesCollection.orderBy('createdAt', 'desc')

        if (filters?.status) {
            query = query.where('status', '==', filters.status)
        }
        if (filters?.timeframe) {
            query = query.where('timeframe', '==', filters.timeframe)
        }
        if (filters?.ownerId) {
            query = query.where('ownerId', '==', filters.ownerId)
        }
        if (filters?.teamId) {
            query = query.where('teamId', '==', filters.teamId)
        }
        if (filters?.year) {
            query = query.where('year', '==', filters.year)
        }
        if (filters?.quarter) {
            query = query.where('quarter', '==', filters.quarter)
        }

        const snapshot = await query.get()
        return snapshot.docs.map((doc: any) => {
            const data = doc.data()
            return {
                id: doc.id,
                ...data,
                startDate: timestampToDate(data.startDate),
                endDate: timestampToDate(data.endDate),
                createdAt: timestampToDate(data.createdAt),
                updatedAt: timestampToDate(data.updatedAt),
                completedAt: timestampToDate(data.completedAt),
            }
        }) as Objective[]
    }

    /**
     * Get objective by ID
     */
    async getObjective(objectiveId: string): Promise<Objective | null> {
        const docRef = this.objectivesCollection.doc(objectiveId)
        const snapshot = await docRef.get()

        if (!snapshot.exists) return null

        const data = snapshot.data() as any
        return {
            id: snapshot.id,
            ...data,
            startDate: timestampToDate(data.startDate),
            endDate: timestampToDate(data.endDate),
            createdAt: timestampToDate(data.createdAt),
            updatedAt: timestampToDate(data.updatedAt),
            completedAt: timestampToDate(data.completedAt),
        } as Objective
    }

    /**
     * Create a new objective
     */
    async createObjective(data: any): Promise<string> {
        const docRef = await this.objectivesCollection.add({
            ...data,
            progress: 0,
            keyResultIds: [],
            status: data.status || 'active',
            createdAt: new Date(),
            updatedAt: new Date()
        })
        return docRef.id
    }

    /**
     * Update objective
     */
    async updateObjective(objectiveId: string, data: Partial<Objective>): Promise<void> {
        const docRef = this.objectivesCollection.doc(objectiveId)
        await docRef.update({
            ...data,
            updatedAt: new Date()
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
        const docRef = this.objectivesCollection.doc(objectiveId)
        await docRef.delete()
    }

    /**
     * Get key results for an objective
     */
    async getKeyResultsByObjective(objectiveId: string): Promise<KeyResult[]> {
        const snapshot = await this.keyResultsCollection
            .where('objectiveId', '==', objectiveId)
            .get()

        return snapshot.docs.map((doc: any) => {
            const data = doc.data()
            return {
                id: doc.id,
                ...data,
                createdAt: timestampToDate(data.createdAt),
                updatedAt: timestampToDate(data.updatedAt),
                completedAt: timestampToDate(data.completedAt),
            }
        }) as KeyResult[]
    }

    /**
     * Create a new key result
     */
    async createKeyResult(data: Omit<KeyResult, 'id' | 'progress' | 'createdAt' | 'updatedAt'>): Promise<string> {
        const progress = this.calculateKeyResultProgress(
            data.startValue,
            data.currentValue,
            data.targetValue
        )

        const keyResultData = {
            ...data,
            progress,
            status: data.status || 'active',
            createdAt: new Date(),
            updatedAt: new Date()
        }

        const docRef = await this.keyResultsCollection.add(keyResultData)

        // Update objective's keyResultIds
        const objective = await this.getObjective(data.objectiveId)
        if (objective) {
            await this.updateObjective(data.objectiveId, {
                keyResultIds: [...(objective.keyResultIds || []), docRef.id]
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
        const docRef = this.keyResultsCollection.doc(keyResultId)
        const snapshot = await docRef.get()

        if (!snapshot.exists) return null

        const data = snapshot.data() as any
        return {
            id: snapshot.id,
            ...data,
            createdAt: timestampToDate(data.createdAt),
            updatedAt: timestampToDate(data.updatedAt),
            completedAt: timestampToDate(data.completedAt),
        } as KeyResult
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

        const docRef = this.keyResultsCollection.doc(keyResultId)
        await docRef.update({
            ...data,
            progress,
            updatedAt: new Date()
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
                keyResultIds: (objective.keyResultIds || []).filter(id => id !== keyResultId)
            })
        }

        // Delete key result
        const docRef = this.keyResultsCollection.doc(keyResultId)
        await docRef.delete()

        // Recalculate objective progress
        await this.recalculateObjectiveProgress(keyResult.objectiveId)
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

        if (objectives.length > 0) {
            const totalProgress = objectives.reduce((sum, o) => sum + o.progress, 0)
            stats.avgProgress = Math.round(totalProgress / objectives.length)
        }

        objectives.forEach(objective => {
            if (objective.teamName) {
                stats.byTeam[objective.teamName] = (stats.byTeam[objective.teamName] || 0) + 1
            }
        })

        return stats
    }

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
}

export const serverOKRService = new ServerOKRService()
