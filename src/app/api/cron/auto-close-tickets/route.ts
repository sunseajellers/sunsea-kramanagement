// src/app/api/cron/auto-close-tickets/route.ts
// CRON JOB: Auto-close stale resolved tickets
// Should be called daily

import { NextRequest, NextResponse } from 'next/server';
import { EnhancedTicketService } from '@/lib/enhancedTicketService';

/**
 * POST /api/cron/auto-close-tickets
 * Automatically closes tickets that have been resolved for 7+ days with accepted solutions
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

        console.log('[CRON] Starting auto-close stale tickets...');

        // Close tickets resolved for 7+ days
        const staleDays = 7;
        const result = await EnhancedTicketService.autoCloseStaleTickets(staleDays);

        console.log(`[CRON] Auto-close completed: ${result.closedCount} tickets closed`);
        
        if (result.errors.length > 0) {
            console.error('[CRON] Auto-close errors:', result.errors);
        }

        return NextResponse.json({
            success: result.success,
            data: {
                closedCount: result.closedCount,
                staleDays,
                errors: result.errors
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('[CRON] Auto-close failed:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Auto-close job failed'
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

        console.log('[MANUAL] Admin triggered auto-close tickets');
        const result = await EnhancedTicketService.autoCloseStaleTickets(7);

        return NextResponse.json({
            success: result.success,
            data: {
                closedCount: result.closedCount,
                errors: result.errors
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('[MANUAL] Auto-close failed:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Auto-close job failed'
            },
            { status: 500 }
        );
    }
}
