import { NextRequest, NextResponse } from 'next/server';
import { getAllUsers, updateUser } from '@/lib/server/userService';
import { getAllTeams } from '@/lib/server/teamService';
import { withAdmin } from '@/lib/authMiddleware';

// GET /api/team - Get all users and teams
export async function GET(request: NextRequest) {
    return withAdmin(request, async (_request: NextRequest, _userId: string) => {
        const [users, teams] = await Promise.all([
            getAllUsers(),
            getAllTeams()
        ]);

        return NextResponse.json({
            success: true,
            data: {
                users,
                teams
            }
        });
    });
}

// PUT /api/team - Update user team assignment
export async function PUT(request: NextRequest) {
    try {
        const { userId, teamId } = await request.json();

        if (!userId) {
            return NextResponse.json(
                { error: 'Missing required parameter: userId' },
                { status: 400 }
            );
        }

        await updateUser(userId, { teamId });

        return NextResponse.json({
            success: true
        });
    } catch (error) {
        console.error('Failed to update user team:', error);
        return NextResponse.json(
            { error: 'Failed to update user team' },
            { status: 500 }
        );
    }
}