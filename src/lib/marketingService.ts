import { db } from './firebase';
import { collection, addDoc, getDocs, query, where, orderBy, updateDoc, doc, Timestamp } from 'firebase/firestore';
import { Campaign } from '@/types';

// --- Campaign Management ---

export const createCampaign = async (campaignData: Omit<Campaign, 'id' | 'createdAt' | 'updatedAt' | 'metrics'>) => {
    try {
        const docRef = await addDoc(collection(db, 'campaigns'), {
            ...campaignData,
            status: 'draft',
            metrics: {
                sent: 0,
                opened: 0,
                clicked: 0,
                converted: 0,
                revenue: 0
            },
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        });
        return docRef.id;
    } catch (error) {
        console.error('Error creating campaign:', error);
        throw error;
    }
};

export const getCampaigns = async (status?: string): Promise<Campaign[]> => {
    try {
        let q = query(collection(db, 'campaigns'), orderBy('createdAt', 'desc'));

        if (status) {
            q = query(q, where('status', '==', status));
        }

        const snapshot = await getDocs(q);
        return snapshot.docs.map(doc => {
            const data = doc.data();
            return {
                ...data,
                id: doc.id,
                scheduleDate: data.scheduleDate ? data.scheduleDate.toDate() : undefined,
                createdAt: data.createdAt.toDate(),
                updatedAt: data.updatedAt.toDate()
            } as Campaign;
        });
    } catch (error) {
        console.error('Error fetching campaigns:', error);
        return [];
    }
};

export const updateCampaignStatus = async (campaignId: string, status: Campaign['status']) => {
    try {
        await updateDoc(doc(db, 'campaigns', campaignId), {
            status,
            updatedAt: Timestamp.now()
        });
        return true;
    } catch (error) {
        console.error('Error updating campaign status:', error);
        throw error;
    }
};

// --- Mock Analytics Data ---
export const getMarketingStats = async () => {
    return {
        totalLeads: 1240,
        activeCampaigns: 3,
        emailOpenRate: 24.5,
        conversionRate: 3.2
    };
};
