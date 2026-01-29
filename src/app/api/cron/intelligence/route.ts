// src/app/api/cron/intelligence/route.ts
// CRON JOB: Run background intelligence analysis
// Should be called daily (e.g., at night)

import { NextRequest, NextResponse } from 'next/server';
import { IntelligenceService } from '@/lib/intelligenceService';

/**
 * POST /api/cron/intelligence
 * Runs all intelligence analysis:
 * - Chronic overdue pattern detection
 * - Department trend analysis
 * - Task risk assessment
 * - Weekly performance snapshots
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

        console.log('[CRON] Starting intelligence analysis...');
        const startTime = Date.now();

        const results = {
            chronicOverdue: { count: 0, errors: [] as string[] },
            departmentTrends: { count: 0, errors: [] as string[] },
            taskRisks: { count: 0, errors: [] as string[] },
            weeklySnapshots: { count: 0, errors: [] as string[] }
        };

        // 1. Detect chronic overdue patterns
        try {
            console.log('[CRON] Detecting chronic overdue patterns...');
            const patterns = await IntelligenceService.detectChronicOverduePatterns(30, 30);
            results.chronicOverdue.count = patterns.length;
            console.log(`[CRON] Found ${patterns.length} chronic overdue patterns`);
        } catch (error) {
            const msg = error instanceof Error ? error.message : 'Unknown error';
            results.chronicOverdue.errors.push(msg);
            console.error('[CRON] Chronic overdue detection failed:', msg);
        }

        // 2. Analyze department trends
        try {
            console.log('[CRON] Analyzing department trends...');
            const trends = await IntelligenceService.analyzeDepartmentTrends(7);
            results.departmentTrends.count = trends.length;
            console.log(`[CRON] Analyzed ${trends.length} departments`);
        } catch (error) {
            const msg = error instanceof Error ? error.message : 'Unknown error';
            results.departmentTrends.errors.push(msg);
            console.error('[CRON] Department trend analysis failed:', msg);
        }

        // 3. Assess task risks
        try {
            console.log('[CRON] Assessing task risks...');
            const risks = await IntelligenceService.assessTaskRisks();
            results.taskRisks.count = risks.length;
            console.log(`[CRON] Assessed ${risks.length} at-risk tasks`);
        } catch (error) {
            const msg = error instanceof Error ? error.message : 'Unknown error';
            results.taskRisks.errors.push(msg);
            console.error('[CRON] Task risk assessment failed:', msg);
        }

        // 4. Create weekly snapshots (only on Sundays)
        const now = new Date();
        const dayOfWeek = now.getDay();
        
        if (dayOfWeek === 0) { // Sunday
            try {
                console.log('[CRON] Creating weekly performance snapshots...');
                const snapshots = await IntelligenceService.createWeeklySnapshots();
                results.weeklySnapshots.count = snapshots.length;
                console.log(`[CRON] Created ${snapshots.length} weekly snapshots`);
            } catch (error) {
                const msg = error instanceof Error ? error.message : 'Unknown error';
                results.weeklySnapshots.errors.push(msg);
                console.error('[CRON] Weekly snapshot creation failed:', msg);
            }
        } else {
            console.log('[CRON] Skipping weekly snapshots (not Sunday)');
        }

        const duration = Date.now() - startTime;
        console.log(`[CRON] Intelligence analysis completed in ${duration}ms`);

        return NextResponse.json({
            success: true,
            data: results,
            duration,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('[CRON] Intelligence analysis failed:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Intelligence analysis job failed'
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

        console.log('[MANUAL] Admin triggered intelligence analysis');
        
        // Run subset for manual testing (faster)
        const results = {
            chronicOverdue: await IntelligenceService.detectChronicOverduePatterns(30, 30),
            taskRisks: await IntelligenceService.assessTaskRisks(),
            summary: await IntelligenceService.generateIntelligenceSummary()
        };

        return NextResponse.json({
            success: true,
            data: {
                chronicOverdueCount: results.chronicOverdue.length,
                taskRisksCount: results.taskRisks.length,
                summary: results.summary
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('[MANUAL] Intelligence analysis failed:', error);
        return NextResponse.json(
            {
                success: false,
                error: error instanceof Error ? error.message : 'Intelligence analysis job failed'
            },
            { status: 500 }
        );
    }
}
