import { NextRequest, NextResponse } from 'next/server';
import { getKRAAnalytics } from '@/lib/analyticsService';

// GET /api/analytics/kras - Get KRA analytics for user
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json(
                { error: 'Missing required parameter: userId' },
                { status: 400 }
            );
        }

        const analytics = await getKRAAnalytics();

        return NextResponse.json({
            success: true,
            data: analytics
        });
    } catch (error: any) {
        console.error('KRA analytics API Error:', error);
        return NextResponse.json(
            { error: error.message || 'Failed to get KRA analytics' },
            { status: 500 }
        );
    }
}