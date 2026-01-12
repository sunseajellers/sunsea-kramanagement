// src/lib/performanceService.ts
import { collection, query, where, getDocs, addDoc, doc, updateDoc, deleteDoc, orderBy } from 'firebase/firestore';
import { db } from './firebase';
import { PerformanceParameter, PerformanceScore, MISReport } from '@/types';
import { timestampToDate, handleError } from './utils';

/**
 * Get all active performance parameters
 * @returns Array of PerformanceParameter objects
 */
export async function getActivePerformanceParameters(): Promise<PerformanceParameter[]> {
    try {
        const q = query(
            collection(db, 'performanceParameters'),
            where('isActive', '==', true),
            orderBy('category', 'asc')
        );

        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: timestampToDate(doc.data().createdAt),
            updatedAt: timestampToDate(doc.data().updatedAt)
        })) as PerformanceParameter[];
    } catch (error) {
        handleError(error, 'Failed to fetch performance parameters');
        throw error;
    }
}

/**
 * Get all performance parameters (including inactive)
 * @returns Array of PerformanceParameter objects
 */
export async function getAllPerformanceParameters(): Promise<PerformanceParameter[]> {
    try {
        const q = query(
            collection(db, 'performanceParameters'),
            orderBy('createdAt', 'desc')
        );

        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: timestampToDate(doc.data().createdAt),
            updatedAt: timestampToDate(doc.data().updatedAt)
        })) as PerformanceParameter[];
    } catch (error) {
        handleError(error, 'Failed to fetch all performance parameters');
        throw error;
    }
}

/**
 * Create a new performance parameter
 * @param parameterData - Parameter data
 * @returns The ID of the created parameter
 */
export async function createPerformanceParameter(
    parameterData: Omit<PerformanceParameter, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
    try {
        const docRef = await addDoc(collection(db, 'performanceParameters'), {
            ...parameterData,
            createdAt: new Date(),
            updatedAt: new Date()
        });
        return docRef.id;
    } catch (error) {
        handleError(error, 'Failed to create performance parameter');
        throw error;
    }
}

/**
 * Update a performance parameter
 * @param parameterId - Parameter ID
 * @param updates - Updates to apply
 */
export async function updatePerformanceParameter(
    parameterId: string,
    updates: Partial<PerformanceParameter>
): Promise<void> {
    try {
        const docRef = doc(db, 'performanceParameters', parameterId);
        await updateDoc(docRef, {
            ...updates,
            updatedAt: new Date()
        });
    } catch (error) {
        handleError(error, 'Failed to update performance parameter');
        throw error;
    }
}

/**
 * Delete a performance parameter
 * @param parameterId - Parameter ID
 */
export async function deletePerformanceParameter(parameterId: string): Promise<void> {
    try {
        const docRef = doc(db, 'performanceParameters', parameterId);
        await deleteDoc(docRef);
    } catch (error) {
        handleError(error, 'Failed to delete performance parameter');
        throw error;
    }
}

/**
 * Add a performance score for a task or KRA
 * @param scoreData - Score data
 * @returns The ID of the created score
 */
export async function addPerformanceScore(
    scoreData: Omit<PerformanceScore, 'id' | 'percentage' | 'evaluatedAt'>
): Promise<string> {
    try {
        // Calculate percentage
        const percentage = (scoreData.score / scoreData.maxScore) * 100;

        const docRef = await addDoc(collection(db, 'performanceScores'), {
            ...scoreData,
            percentage,
            evaluatedAt: new Date()
        });
        return docRef.id;
    } catch (error) {
        handleError(error, 'Failed to add performance score');
        throw error;
    }
}

/**
 * Get performance scores for a task
 * @param taskId - Task ID
 * @returns Array of PerformanceScore objects
 */
export async function getTaskPerformanceScores(taskId: string): Promise<PerformanceScore[]> {
    try {
        const q = query(
            collection(db, 'performanceScores'),
            where('taskId', '==', taskId),
            orderBy('evaluatedAt', 'desc')
        );

        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            evaluatedAt: timestampToDate(doc.data().evaluatedAt)
        })) as PerformanceScore[];
    } catch (error) {
        handleError(error, 'Failed to fetch task performance scores');
        throw error;
    }
}

/**
 * Get performance scores for a user in a period
 * @param userId - User ID
 * @param period - Period string (e.g., "2024-W01")
 * @returns Array of PerformanceScore objects
 */
export async function getUserPerformanceScores(
    userId: string,
    period?: string
): Promise<PerformanceScore[]> {
    try {
        let q = query(
            collection(db, 'performanceScores'),
            where('userId', '==', userId),
            orderBy('evaluatedAt', 'desc')
        );

        if (period) {
            q = query(
                collection(db, 'performanceScores'),
                where('userId', '==', userId),
                where('period', '==', period),
                orderBy('evaluatedAt', 'desc')
            );
        }

        const snapshot = await getDocs(q);

        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            evaluatedAt: timestampToDate(doc.data().evaluatedAt)
        })) as PerformanceScore[];
    } catch (error) {
        handleError(error, 'Failed to fetch user performance scores');
        throw error;
    }
}

/**
 * Generate MIS report for a user
 * @param userId - User ID
 * @param userName - User name
 * @param period - Period string
 * @param periodType - Period type
 * @returns MISReport object
 */
export async function generateMISReport(
    userId: string,
    userName: string,
    period: string,
    periodType: 'daily' | 'weekly' | 'monthly'
): Promise<MISReport> {
    try {
        // Get user's scores for the period
        const scores = await getUserPerformanceScores(userId, period);

        // Get active parameters
        const parameters = await getActivePerformanceParameters();

        // Calculate parameter averages
        const parameterScores = parameters.map(param => {
            const paramScores = scores.filter(s => s.parameterId === param.id);
            const avgScore = paramScores.length > 0
                ? paramScores.reduce((sum, s) => sum + s.percentage, 0) / paramScores.length
                : 0;

            return {
                parameterId: param.id,
                parameterName: param.name,
                averageScore: avgScore,
                weight: param.weight
            };
        });

        // Calculate weighted score
        const totalWeight = parameterScores.reduce((sum, p) => sum + p.weight, 0);
        const weightedScore = totalWeight > 0
            ? parameterScores.reduce((sum, p) => sum + (p.averageScore * p.weight / 100), 0)
            : 0;

        // Get task statistics (simplified - would need actual task data)
        const totalTasks = scores.length; // Simplified
        const completedTasks = scores.filter(s => s.score >= s.maxScore * 0.7).length; // 70% threshold
        const onTimeTasks = completedTasks; // Simplified
        const delayedTasks = totalTasks - onTimeTasks;

        const report: Omit<MISReport, 'id'> = {
            userId,
            userName,
            period,
            periodType,
            totalTasks,
            completedTasks,
            onTimeTasks,
            delayedTasks,
            completionRate: totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0,
            onTimeRate: totalTasks > 0 ? (onTimeTasks / totalTasks) * 100 : 0,
            averageScore: scores.length > 0
                ? scores.reduce((sum, s) => sum + s.percentage, 0) / scores.length
                : 0,
            parameterScores,
            weightedScore,
            generatedAt: new Date()
        };

        // Save report
        const docRef = await addDoc(collection(db, 'misReports'), report);

        return {
            id: docRef.id,
            ...report
        };
    } catch (error) {
        handleError(error, 'Failed to generate MIS report');
        throw error;
    }
}

/**
 * Get MIS reports for a user
 * @param userId - User ID
 * @param limit - Number of reports to return
 * @returns Array of MISReport objects
 */
export async function getUserMISReports(userId: string, limit: number = 10): Promise<MISReport[]> {
    try {
        const q = query(
            collection(db, 'misReports'),
            where('userId', '==', userId),
            orderBy('generatedAt', 'desc')
        );

        const snapshot = await getDocs(q);

        return snapshot.docs.slice(0, limit).map(doc => ({
            id: doc.id,
            ...doc.data(),
            generatedAt: timestampToDate(doc.data().generatedAt)
        })) as MISReport[];
    } catch (error) {
        handleError(error, 'Failed to fetch MIS reports');
        throw error;
    }
}

/**
 * Initialize default performance parameters
 * @param createdBy - User ID creating the parameters
 */
export async function initializeDefaultParameters(createdBy: string): Promise<void> {
    try {
        const defaultParameters: Omit<PerformanceParameter, 'id' | 'createdAt' | 'updatedAt'>[] = [
            {
                name: 'Quality',
                description: 'Quality of work delivered',
                weight: 30,
                category: 'quality',
                minScore: 0,
                maxScore: 10,
                isActive: true,
                createdBy
            },
            {
                name: 'Timeliness',
                description: 'On-time completion of tasks',
                weight: 25,
                category: 'timeliness',
                minScore: 0,
                maxScore: 10,
                isActive: true,
                createdBy
            },
            {
                name: 'Accuracy',
                description: 'Accuracy and attention to detail',
                weight: 20,
                category: 'accuracy',
                minScore: 0,
                maxScore: 10,
                isActive: true,
                createdBy
            },
            {
                name: 'Completeness',
                description: 'Thoroughness of work',
                weight: 15,
                category: 'completeness',
                minScore: 0,
                maxScore: 10,
                isActive: true,
                createdBy
            },
            {
                name: 'Efficiency',
                description: 'Resource utilization and productivity',
                weight: 10,
                category: 'efficiency',
                minScore: 0,
                maxScore: 10,
                isActive: true,
                createdBy
            }
        ];

        for (const param of defaultParameters) {
            await createPerformanceParameter(param);
        }
    } catch (error) {
        handleError(error, 'Failed to initialize default parameters');
        throw error;
    }
}
