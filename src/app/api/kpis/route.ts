import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/authMiddleware';
import { adminDb } from '@/lib/firebase-admin';

// Helper to convert Firestore Timestamp to Date
const timestampToDate = (timestamp: any): Date | null => {
    if (!timestamp) return null;
    if (timestamp.toDate) return timestamp.toDate();
    if (timestamp._seconds) return new Date(timestamp._seconds * 1000);
    return new Date(timestamp);
};

// GET /api/kpis - Get user's KPIs for weekly input
export async function GET(request: NextRequest) {
    return withAuth(request, async (_request: NextRequest, userId: string) => {
        try {
            // Get KPIs assigned to this user
            const kpisSnap = await adminDb.collection('kpis').where('userId', '==', userId).get();

            const kpis = await Promise.all(kpisSnap.docs.map(async (doc) => {
                const data = doc.data();

                // Get parent KRA title for display
                let kraTitle = '';
                if (data.kraId) {
                    const kraDoc = await adminDb.collection('kras').doc(data.kraId).get();
                    if (kraDoc.exists) {
                        kraTitle = kraDoc.data()?.title || '';
                    }
                }

                return {
                    id: doc.id,
                    ...data,
                    kraTitle,
                    weekStartDate: timestampToDate(data.weekStartDate),
                    createdAt: timestampToDate(data.createdAt),
                    updatedAt: timestampToDate(data.updatedAt)
                };
            }));

            return NextResponse.json({ kpis });
        } catch (error) {
            console.error('Error fetching KPIs:', error);
            return NextResponse.json({ error: 'Failed to fetch KPIs' }, { status: 500 });
        }
    });
}
