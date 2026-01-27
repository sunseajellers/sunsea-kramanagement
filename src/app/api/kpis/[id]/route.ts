import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/authMiddleware';
import { adminDb } from '@/lib/firebase-admin';

interface Params {
    params: Promise<{ id: string }>;
}

// PATCH /api/kpis/[id] - Update KPI weekly values
export async function PATCH(request: NextRequest, { params }: Params) {
    return withAuth(request, async (request: NextRequest, userId: string) => {
        try {
            const { id } = await params;
            const updates = await request.json();

            // Verify user owns this KPI
            const kpiDoc = await adminDb.collection('kpis').doc(id).get();
            if (!kpiDoc.exists) {
                return NextResponse.json({ error: 'KPI not found' }, { status: 404 });
            }

            const kpiData = kpiDoc.data();
            if (kpiData?.userId !== userId) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
            }

            // Update KPI
            await adminDb.collection('kpis').doc(id).update({
                ...updates,
                updatedBy: userId,
                updatedAt: new Date()
            });

            return NextResponse.json({ success: true });
        } catch (error) {
            console.error('Error updating KPI:', error);
            return NextResponse.json({ error: 'Failed to update KPI' }, { status: 500 });
        }
    });
}
