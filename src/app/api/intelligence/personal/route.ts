// src/app/api/intelligence/personal/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

export async function GET(request: NextRequest) {
    try {
        const userId = request.nextUrl.searchParams.get('userId');

        if (!userId) {
            return NextResponse.json(
                { success: false, error: 'User ID is required' },
                { status: 400 }
            );
        }

        // Fetch user's risk assessments from the last 7 days
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - 7);

        const risksSnapshot = await adminDb.collection('taskRiskAssessments')
            .where('assignedTo', 'array-contains', userId)
            .where('assessedAt', '>=', cutoffDate)
            .orderBy('assessedAt', 'desc')
            .limit(5)
            .get();

        const risks = risksSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        // Fetch user's performance trend (latest snapshot)
        const trendSnapshot = await adminDb.collection('performanceSnapshots')
            .where('userId', '==', userId)
            .orderBy('snapshotAt', 'desc')
            .limit(1)
            .get();

        const trend = trendSnapshot.empty ? null : {
            id: trendSnapshot.docs[0].id,
            ...trendSnapshot.docs[0].data()
        };

        // Fetch chronic overdue patterns if any
        const patternsSnapshot = await adminDb.collection('chronicOverduePatterns')
            .where('userId', '==', userId)
            .orderBy('detectedAt', 'desc')
            .limit(1)
            .get();

        const pattern = patternsSnapshot.empty ? null : {
            id: patternsSnapshot.docs[0].id,
            ...patternsSnapshot.docs[0].data()
        };

        return NextResponse.json({
            success: true,
            data: {
                risks,
                trend,
                pattern,
                generatedAt: new Date().toISOString()
            }
        });
    } catch (error) {
        console.error('Error fetching personal intelligence:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Internal server error'
            },
            { status: 500 }
        );
    }
}
