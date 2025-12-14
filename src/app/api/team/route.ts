import { NextRequest, NextResponse } from 'next/server';
import { getAllUsers, updateUser } from '@/lib/userService';
import { getAllTeams } from '@/lib/teamService';
import { userHasPermission } from '@/lib/rbacService';

// GET /api/team - Get all users and teams
export async function GET(request: NextRequest) {
    try {
        // Get user ID from middleware (authenticated requests)
        const userId = request.headers.get('x-user-id');

        if (!userId) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        // Check if user has admin access to teams
        const hasAccess = await userHasPermission(userId, 'admin', 'teams');
        if (!hasAccess) {
            return NextResponse.json(
                { error: 'Unauthorized: Admin access required' },
                { status: 403 }
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

        // Get admin user ID from middleware (authenticated requests)
        const adminUserId = request.headers.get('x-user-id');

        if (!userId) {
            return NextResponse.json(
                { error: 'Missing required parameter: userId' },
                { status: 400 }
            );
        }

        if (!adminUserId) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }

        // Check if admin user has access to manage teams
        const hasAccess = await userHasPermission(adminUserId, 'admin', 'teams');
        if (!hasAccess) {
            return NextResponse.json(
                { error: 'Unauthorized: Admin access required' },
                { status: 403 }
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