// src/app/api/admin/tasks/extensions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { withAdmin } from '@/lib/authMiddleware';

export async function GET(request: NextRequest) {
    return withAdmin(request, async (_req, _adminId) => {
        try {
            const snapshot = await adminDb.collection('tasks')
                .where('extensionStatus', '==', 'pending')
                .get();

            const requests = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            return NextResponse.json({ requests });
        } catch (error) {
            console.error('Error fetching extensions:', error);
            return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
        }
    });
}
