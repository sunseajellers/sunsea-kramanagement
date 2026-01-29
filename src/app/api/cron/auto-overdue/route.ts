// src/app/api/cron/auto-overdue/route.ts
// CRON JOB: Auto-mark overdue tasks
// Should be called daily (e.g., at midnight)

import { NextRequest, NextResponse } from 'next/server';
import { EnhancedTaskService } from '@/lib/enhancedTaskService';

/**
 * POST /api/cron/auto-overdue
 * Automatically marks tasks as overdue when they pass their due date
 * 
 * Security: Should be called by cron service with auth token
 */
export async function POST(request: NextRequest) {
    try {
        // Verify cron auth token (simple security)
        const authHeader = request.headers.get('authorization');
        const cronToken = process.env.CRON_SECRET_TOKEN || 'default-cron-secret';
        
        if (authHeader !== `Bearer ${cronToken}`) {
            return NextResponse.json(
                { success: false, error: 'Unauthorized' },
                { status: 401 }
            );
        }

        console.log('[CRON] Starting auto-overdue task marking...');

        const result = await EnhancedTaskService.autoMarkOverdueTasks();

        console.log(`[CRON] Auto-overdue completed: ${result.markedCount} tasks marked`);
        
        if (result.errors.length > 0) {
            console.error('[CRON] Auto-overdue errors:', result.errors);
        }

        return NextResponse.json({
            success: result.success,
            data: {
                markedCount: result.markedCount,
                errors: result.errors
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('[CRON] Auto-overdue failed:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Auto-overdue job failed'
            },
            { status: 500 }
        );
    }
}

// Allow GET for manual testing (admin only)
export async function GET(request: NextRequest) {
    try {
        // Check if user is admin
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

        console.log('[MANUAL] Admin triggered auto-overdue');
        const result = await EnhancedTaskService.autoMarkOverdueTasks();

        return NextResponse.json({
            success: result.success,
            data: {
                markedCount: result.markedCount,
                errors: result.errors
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('[MANUAL] Auto-overdue failed:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Auto-overdue job failed'
            },
            { status: 500 }
        );
    }
}
