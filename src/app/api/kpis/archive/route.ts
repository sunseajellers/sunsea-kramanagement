import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/authMiddleware';
import { adminDb } from '@/lib/firebase-admin';

// GET /api/kpis/archive - Get all archived KPI snapshots
export async function GET(request: NextRequest) {
    return withAuth(request, async (_request: NextRequest, userId: string) => {
        try {
            // Only admins can see archives
            const userDoc = await adminDb.collection('users').doc(userId).get();
            if (userDoc.data()?.isAdmin !== true) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
            }

            const { searchParams } = new URL(request.url);
            const monthYear = searchParams.get('monthYear'); // e.g., "01-2024"

            let query = adminDb.collection('kpiArchives').orderBy('archivedAt', 'desc');

            if (monthYear) {
                query = query.where('monthYear', '==', monthYear);
            }

            const snap = await query.get();
            const archives = snap.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                archivedAt: doc.data().archivedAt?.toDate()
            }));

            return NextResponse.json({ success: true, archives });
        } catch (error) {
            console.error('Error fetching KPI archives:', error);
            return NextResponse.json({ error: 'Failed' }, { status: 500 });
        }
    });
}

// POST /api/kpis/archive - Create a new KPI snapshot (Archive current metrics)
export async function POST(request: NextRequest) {
    return withAuth(request, async (_request: NextRequest, userId: string) => {
        try {
            // Only admins can archive
            const userDoc = await adminDb.collection('users').doc(userId).get();
            if (userDoc.data()?.isAdmin !== true) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
            }

            const body = await request.json();
            const { monthYear, note } = body; // e.g., "Jan 2024 Week 2"

            if (!monthYear) {
                return NextResponse.json({ error: 'monthYear is required' }, { status: 400 });
            }

            // Fetch all current KPIs
            const kpisSnap = await adminDb.collection('kpis').get();
            const kpiSnapshots = kpisSnap.docs.map(doc => ({
                kpiId: doc.id,
                ...doc.data()
            }));

            // Create archive entry
            const archiveEntry = {
                monthYear,
                note: note || '',
                archivedBy: userId,
                archivedAt: new Date(),
                data: kpiSnapshots
            };

            const docRef = await adminDb.collection('kpiArchives').add(archiveEntry);

            return NextResponse.json({
                success: true,
                id: docRef.id,
                message: `Archived ${kpiSnapshots.length} KPIs for ${monthYear}`
            });
        } catch (error) {
            console.error('Error archiving KPIs:', error);
            return NextResponse.json({ error: 'Failed to archive' }, { status: 500 });
        }
    });
}
