// Server actions for analytics operations
'use server'

import { generateAdminReport } from '@/lib/analyticsService';

export async function generateAdminReportAction(reportType: 'overview' | 'teams' | 'users' | 'performance') {
    try {
        const reportData = await generateAdminReport(reportType);
        return { success: true, data: reportData };
    } catch (error) {
        console.error('Failed to generate admin report:', error);
        return { success: false, error: 'Failed to generate report' };
    }
}
