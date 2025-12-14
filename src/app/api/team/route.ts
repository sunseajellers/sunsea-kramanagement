import { NextRequest, NextResponse } from 'next/server';
import { getAllUsers, updateUser } from '@/lib/userService';
import { getAllTeams } from '@/lib/teamService';

// GET /api/team - Get all users and teams
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json(
                { error: 'Missing userId parameter' },
                { status: 400 }
            );
        }

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
    } catch (error) {
        console.error('Failed to get team data:', error);
        return NextResponse.json(
            { error: 'Failed to get team data' },
            { status: 500 }
        );
    }
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