// src/app/api/cron/score-recalculation/route.ts
// CRON JOB: Process score recalculation queue
// Should be called every hour or when queue builds up

import { NextRequest, NextResponse } from 'next/server';
import { PerformanceServiceServer } from '@/lib/server/performanceService';

/**
 * POST /api/cron/score-recalculation
 * Processes queued score recalculation requests
 */
export async function POST(request: NextRequest) {
    try {
        // Verify cron auth token
        const authHeader = request.headers.get('authorization');
        const cronToken = process.env.CRON_SECRET_TOKEN || 'default-cron-secret';

        if (authHeader !== `Bearer ${cronToken}`) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        console.log('[CRON] Starting score recalculation queue processing...');

        // Process up to 100 requests per run
        const result = await PerformanceServiceServer.processRecalculationQueue(100);

        console.log(`[CRON] Score recalculation completed: ${result.processed} processed`);

        if (result.errors.length > 0) {
            console.error('[CRON] Score recalculation errors:', result.errors);
        }

        return NextResponse.json({
            success: result.success,
            data: {
                processed: result.processed,
                errors: result.errors
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('[CRON] Score recalculation failed:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Score recalculation job failed'
            },
            { status: 500 }
        );
    }
}

// Allow GET for manual testing (admin only)
export async function GET(request: NextRequest) {
    try {
        const userId = request.headers.get('x-user-id');
        if (!userId) {
            return NextResponse.json(
                { success: false, error: 'Authentication required' },
                { status: 401 }
            );
        }

        const { adminDb } = await import('@/lib/firebase-admin');
        const userDoc = await adminDb.collection('users').doc(userId).get();

        if (!userDoc.exists || !userDoc.data()?.isAdmin) {
            return NextResponse.json(
                { success: false, error: 'Admin access required' },
                { status: 403 }
            );
        }

        console.log('[MANUAL] Admin triggered score recalculation');
        const result = await PerformanceServiceServer.processRecalculationQueue(100);

        return NextResponse.json({
            success: result.success,
            data: {
                processed: result.processed,
                errors: result.errors
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('[MANUAL] Score recalculation failed:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Score recalculation job failed'
            },
            { status: 500 }
        );
    }
}
