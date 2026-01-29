// src/app/api/intelligence/chronic-overdue/route.ts
// API endpoint to fetch chronic overdue patterns

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/authMiddleware';
import { adminDb } from '@/lib/firebase-admin';

/**
 * GET /api/intelligence/chronic-overdue
 * Fetch chronic overdue patterns detected in the last 7 days
 * Requires admin or manager access
 */
export async function GET(request: NextRequest) {
    return withAuth(request, async (_req: NextRequest, userId: string) => {
        try {
            // Verify access (admin or manager)
            const userDoc = await adminDb.collection('users').doc(userId).get();
            const userData = userDoc.data();
            
            if (!userData || (!userData.isAdmin && userData.role !== 'manager')) {
                return NextResponse.json(
                    { success: false, error: 'Admin or manager access required' },
                    { status: 403 }
                );
            }

            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - 7);

            // Fetch patterns
            const patternsSnapshot = await adminDb.collection('chronicOverduePatterns')
                .where('detectedAt', '>=', cutoffDate)
                .orderBy('detectedAt', 'desc')
                .orderBy('overduePercentage', 'desc')
                .limit(50)
                .get();

            const patterns = patternsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            return NextResponse.json({
                success: true,
                data: patterns
            });
        } catch (error) {
            console.error('Error fetching chronic overdue patterns:', error);
            return NextResponse.json(
                {
                    success: false,
                    error: error instanceof Error ? error.message : 'Failed to fetch patterns'
                },
                { status: 500 }
            );
        }
    });
}
