// API route for KRA generation cron job
import { NextRequest, NextResponse } from 'next/server';
import { generateScheduledKRAs } from '@/lib/kraAutomation';

// This route can be called by a cron job service (Vercel Cron, etc.)
export async function GET(request: NextRequest) {
    try {
        // Optional: Verify cron secret for security
        const authHeader = request.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET;

        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const results = await generateScheduledKRAs();

        return NextResponse.json({
            success: true,
            message: `Generated ${results.generated} KRAs`,
            ...results
        });
    } catch (error: any) {
        console.error('Cron job error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}

// Manual trigger for testing
export async function POST(_request: NextRequest) {
    try {
        const results = await generateScheduledKRAs();

        return NextResponse.json({
            success: true,
            message: `Generated ${results.generated} KRAs`,
            ...results
        });
    } catch (error: any) {
        console.error('Manual KRA generation error:', error);
        return NextResponse.json(
            { success: false, error: error.message },
            { status: 500 }
        );
    }
}
