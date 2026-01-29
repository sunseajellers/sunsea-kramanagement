// src/app/api/intelligence/summary/route.ts
// API endpoint to fetch intelligence summary for admin dashboard

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/authMiddleware';
import { IntelligenceService } from '@/lib/intelligenceService';
import { adminDb } from '@/lib/firebase-admin';

/**
 * GET /api/intelligence/summary
 * Fetch intelligence summary for admin dashboard
 * Requires admin access
 */
export async function GET(request: NextRequest) {
    return withAuth(request, async (_req: NextRequest, userId: string) => {
        try {
            // Verify admin access
            const userDoc = await adminDb.collection('users').doc(userId).get();
            if (!userDoc.exists || !userDoc.data()?.isAdmin) {
                return NextResponse.json(
                    { success: false, error: 'Admin access required' },
                    { status: 403 }
                );
            }

            // Generate summary
            const summary = await IntelligenceService.generateIntelligenceSummary();

            return NextResponse.json({
                success: true,
                data: summary
            });
        } catch (error) {
            console.error('Error fetching intelligence summary:', error);
            return NextResponse.json(
                {
                    success: false,
                    error: error instanceof Error ? error.message : 'Failed to fetch intelligence summary'
                },
                { status: 500 }
            );
        }
    });
}
