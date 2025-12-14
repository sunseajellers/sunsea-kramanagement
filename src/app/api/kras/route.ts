import { NextRequest, NextResponse } from 'next/server';
import { getUserKRAs } from '@/lib/kraService';
import { getAllTeams } from '@/lib/teamService';

// GET /api/kras - Get user KRAs and teams
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

        const [kras, teams] = await Promise.all([
            getUserKRAs(userId),
            getAllTeams()
        ]);

        return NextResponse.json({
            success: true,
            data: {
                kras,
                teams
            }
        });
    } catch (error) {
        console.error('Failed to get KRAs:', error);
        return NextResponse.json(
            { error: 'Failed to get KRAs' },
            { status: 500 }
        );
    }
}