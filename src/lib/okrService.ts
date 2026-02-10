import { db } from './firebase';
import { collection, addDoc, getDocs, query, where, orderBy, updateDoc, doc, Timestamp, getDoc } from 'firebase/firestore';
import { Objective, KeyResult } from '@/types';

// --- Objectives Management ---

export const getObjectives = async (options?: { timeframe?: 'quarterly' | 'yearly', status?: string }): Promise<Objective[]> => {
    try {
        const timeframe = options?.timeframe || 'quarterly';
        const status = options?.status;

        let q = query(
            collection(db, 'objectives'),
            where('timeframe', '==', timeframe),
            orderBy('createdAt', 'desc')
        );

        if (status) {
            q = query(q, where('status', '==', status));
        }

        const snapshot = await getDocs(q);
        const objectives = await Promise.all(snapshot.docs.map(async (docSnap) => {
            const data = docSnap.data();
            // Fetch associated Key Results
            const krs = await getKeyResults(docSnap.id);

            // Calculate progress
            const progress = krs.length > 0
                ? krs.reduce((acc, kr) => acc + kr.progress, 0) / krs.length
                : 0;

            return {
                ...data,
                id: docSnap.id,
                startDate: data.startDate.toDate(),
                endDate: data.endDate.toDate(),
                createdAt: data.createdAt.toDate(),
                updatedAt: data.updatedAt.toDate(),
                keyResults: krs,
                progress: Math.round(progress)
            } as Objective;
        }));

        return objectives;
    } catch (error) {
        console.error('Error fetching objectives:', error);
        return [];
    }
};

export const getObjective = async (id: string): Promise<Objective | null> => {
    try {
        const docRef = doc(db, 'objectives', id);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) return null;
        const data = docSnap.data();
        const krs = await getKeyResults(id);
        const progress = krs.length > 0
            ? krs.reduce((acc, kr) => acc + kr.progress, 0) / krs.length
            : 0;

        return {
            ...data,
            id: docSnap.id,
            startDate: data.startDate.toDate(),
            endDate: data.endDate.toDate(),
            createdAt: data.createdAt.toDate(),
            updatedAt: data.updatedAt.toDate(),
            keyResults: krs,
            progress: Math.round(progress)
        } as Objective;
    } catch (error) {
        console.error('Error fetching objective:', error);
        return null;
    }
};

export const createObjective = async (objective: Omit<Objective, 'id' | 'createdAt' | 'updatedAt' | 'progress' | 'keyResultIds'>) => {
    try {
        const docRef = await addDoc(collection(db, 'objectives'), {
            ...objective,
            progress: 0,
            keyResultIds: [],
            status: 'active',
            startDate: Timestamp.fromDate(objective.startDate),
            endDate: Timestamp.fromDate(objective.endDate),
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        });
        return docRef.id;
    } catch (error) {
        console.error('Error creating objective:', error);
        throw error;
    }
};

// --- Key Results Management ---

export const getKeyResults = async (objectiveId: string): Promise<KeyResult[]> => {
    try {
        const q = query(collection(db, 'key_results'), where('objectiveId', '==', objectiveId));
        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                ...data,
                id: doc.id,
                createdAt: data.createdAt.toDate(),
                updatedAt: data.updatedAt.toDate()
            } as KeyResult;
        });
    } catch (error) {
        console.error('Error fetching key results:', error);
        return [];
    }
};

export const getKeyResult = async (id: string): Promise<KeyResult | null> => {
    try {
        const docRef = doc(db, 'key_results', id);
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) return null;
        const data = docSnap.data();
        return {
            ...data,
            id: docSnap.id,
            createdAt: data.createdAt.toDate(),
            updatedAt: data.updatedAt.toDate()
        } as KeyResult;
    } catch (error) {
        console.error('Error fetching key result:', error);
        return null;
    }
};

export const getKeyResultsByObjective = async (objectiveId: string): Promise<KeyResult[]> => {
    return getKeyResults(objectiveId);
};

export const createKeyResult = async (keyResult: Omit<KeyResult, 'id' | 'createdAt' | 'updatedAt' | 'progress' | 'currentValue'>) => {
    try {
        const docRef = await addDoc(collection(db, 'key_results'), {
            ...keyResult,
            currentValue: keyResult.startValue,
            progress: 0,
            status: 'active',
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        });
        return docRef.id;
    } catch (error) {
        console.error('Error creating key result:', error);
        throw error;
    }
};

export const updateKeyResultProgress = async (id: string, currentValue: number) => {
    try {
        const krRef = doc(db, 'key_results', id);
        const krSnap = await getDoc(krRef);

        if (!krSnap.exists()) throw new Error('Key Result not found');

        const data = krSnap.data() as KeyResult;
        const total = data.targetValue - data.startValue;
        const current = currentValue - data.startValue;
        let progress = (current / total) * 100;

        // Clamp progress
        progress = Math.min(100, Math.max(0, progress));

        await updateDoc(krRef, {
            currentValue,
            progress,
            updatedAt: Timestamp.now()
        });
    } catch (error) {
        console.error('Error updating KR progress:', error);
        throw error;
    }
};

export const getOKRStats = async () => {
    // Mock stats matching usage in governance dashboard
    return {
        total: 24,
        active: 18,
        completed: 6,
        avgProgress: 72
    };
};

export const syncKPIProgress = async (kpiId: string) => {
    // Mock sync logic
    console.log('Syncing KPI progress for:', kpiId);
};

export const okrService = {
    getObjectives,
    getObjective,
    getKeyResults,
    getKeyResult,
    getKeyResultsByObjective,
    createObjective,
    createKeyResult,
    updateKeyResultProgress,
    getOKRStats,
    syncKPIProgress
};
