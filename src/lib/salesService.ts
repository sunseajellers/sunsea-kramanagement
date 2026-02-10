
import { db } from './firebase';
import {
    collection,
    updateDoc,
    doc,
    serverTimestamp
} from 'firebase/firestore';
import { Sale, PipelineStage } from '@/types';

const COLLECTION_NAME = 'sales';

import { getDocs, query, orderBy, Timestamp } from 'firebase/firestore';

export const getAllSales = async (): Promise<Sale[]> => {
    try {
        const q = query(collection(db, COLLECTION_NAME), orderBy('createdAt', 'desc'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                ...data,
                id: doc.id,
                expectedClosedDate: data.expectedClosedDate instanceof Timestamp ? data.expectedClosedDate.toDate() : data.expectedClosedDate,
                actualClosedDate: data.actualClosedDate instanceof Timestamp ? data.actualClosedDate.toDate() : data.actualClosedDate,
                createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate() : data.createdAt,
                updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate() : data.updatedAt,
            } as Sale;
        });
    } catch (error) {
        console.error('Error getting sales:', error);
        throw error;
    }
};

export const updateSaleStage = async (id: string, stage: PipelineStage): Promise<void> => {
    try {
        const docRef = doc(db, COLLECTION_NAME, id);
        await updateDoc(docRef, {
            stage,
            updatedAt: serverTimestamp(),
            ...(stage === 'closed_won' || stage === 'closed_lost' ? { actualClosedDate: serverTimestamp() } : {})
        });
    } catch (error) {
        console.error('Error updating sale stage:', error);
        throw error;
    }
};

export const PIPELINE_STAGES = [
    { id: 'lead' as PipelineStage, label: 'Lead', color: 'bg-blue-50 text-blue-600 border-blue-100' },
    { id: 'contacted' as PipelineStage, label: 'Contacted', color: 'bg-indigo-50 text-indigo-600 border-indigo-100' },
    { id: 'proposal' as PipelineStage, label: 'Proposal', color: 'bg-amber-50 text-amber-600 border-amber-100' },
    { id: 'negotiation' as PipelineStage, label: 'Negotiation', color: 'bg-purple-50 text-purple-600 border-purple-100' },
    { id: 'closed_won' as PipelineStage, label: 'Won', color: 'bg-emerald-50 text-emerald-600 border-emerald-100' },
    { id: 'closed_lost' as PipelineStage, label: 'Lost', color: 'bg-rose-50 text-rose-600 border-rose-100' },
];
