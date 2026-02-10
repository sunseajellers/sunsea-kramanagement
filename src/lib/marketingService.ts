import { db } from './firebase';
import { collection, getDocs, Timestamp, query, orderBy } from 'firebase/firestore';

export interface Campaign {
    id: string;
    name: string;
    status: 'active' | 'paused' | 'completed' | 'draft';
    type: 'email' | 'social' | 'ads' | 'sms';
    budget: number;
    spend: number;
    leads: number;
    conversions: number;
    roi: number;
    startDate: Date;
}

export interface MarketingStats {
    totalLeads: number;
    conversionRate: number;
    activeCampaigns: number;
    monthlySpend: number;
}

const COLLECTION_NAME = 'campaigns';

export const getAllCampaigns = async (): Promise<Campaign[]> => {
    try {
        const q = query(collection(db, COLLECTION_NAME), orderBy('startDate', 'desc'));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                ...data,
                id: doc.id,
                startDate: data.startDate instanceof Timestamp ? data.startDate.toDate() : data.startDate,
            } as Campaign;
        });
    } catch (error) {
        console.error('Error getting campaigns:', error);
        return [];
    }
};

export const getMarketingStats = async (): Promise<MarketingStats> => {
    try {
        const campaigns = await getAllCampaigns();

        return {
            totalLeads: campaigns.reduce((sum, c) => sum + (c.leads || 0), 0),
            conversionRate: campaigns.length > 0
                ? (campaigns.reduce((sum, c) => sum + (c.conversions || 0), 0) / campaigns.reduce((sum, c) => sum + (c.leads || 1), 0)) * 100
                : 0,
            activeCampaigns: campaigns.filter(c => c.status === 'active').length,
            monthlySpend: campaigns.reduce((sum, c) => sum + (c.spend || 0), 0)
        };
    } catch (error) {
        console.error('Error getting marketing stats:', error);
        return {
            totalLeads: 0,
            conversionRate: 0,
            activeCampaigns: 0,
            monthlySpend: 0
        };
    }
};

export const getChannelPerformance = async () => {
    try {
        // In real app, aggregate leads by source from 'customers' collection
        return [
            { channel: 'Search Ads', leads: 450, growth: '+12%', color: 'bg-indigo-500' },
            { channel: 'Email Marketing', leads: 380, growth: '+5%', color: 'bg-emerald-500' },
            { channel: 'Social Media', leads: 290, growth: '-2%', color: 'bg-rose-500' },
            { channel: 'Referral', leads: 150, growth: '+8%', color: 'bg-amber-500' },
        ];
    } catch (error) {
        console.error('Error getting channel performance:', error);
        return [];
    }
};
