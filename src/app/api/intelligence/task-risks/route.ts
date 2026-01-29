// src/app/api/intelligence/task-risks/route.ts
// API endpoint to fetch task risk assessments

import { NextRequest, NextResponse } from 'next/server';
import { withAuth } from '@/lib/authMiddleware';
import { adminDb } from '@/lib/firebase-admin';

/**
 * GET /api/intelligence/task-risks
 * Fetch high-risk tasks detected in the last 24 hours
 * Accessible by admins, managers, and task assignees
 */
export async function GET(request: NextRequest) {
    return withAuth(request, async (req: NextRequest, userId: string) => {
        try {
            // Get user info
            const userDoc = await adminDb.collection('users').doc(userId).get();
            const userData = userDoc.data();
            
            if (!userData) {
                return NextResponse.json(
                    { success: false, error: 'User not found' },
                    { status: 404 }
                );
            }

            const isAdminOrManager = userData.isAdmin || userData.role === 'manager';

            const cutoffDate = new Date();
            cutoffDate.setDate(cutoffDate.getDate() - 1); // Last 24 hours

            // Fetch risk assessments
            let query = adminDb.collection('taskRiskAssessments')
                .where('assessedAt', '>=', cutoffDate)
                .where('riskScore', '>=', 40) // Medium+ risk
                .orderBy('assessedAt', 'desc')
                .orderBy('riskScore', 'desc');

            // If not admin/manager, filter to user's tasks
            if (!isAdminOrManager) {
                query = query.where('assignedTo', 'array-contains', userId);
            }

            const risksSnapshot = await query.limit(100).get();

            const risks = risksSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            return NextResponse.json({
                success: true,
                data: risks
            });
        } catch (error) {
            console.error('Error fetching task risks:', error);
            return NextResponse.json(
                {
                    success: false,
                    error: error instanceof Error ? error.message : 'Failed to fetch task risks'
                },
                { status: 500 }
            );
        }
    });
}
