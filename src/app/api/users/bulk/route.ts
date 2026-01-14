import { NextRequest, NextResponse } from 'next/server';
import { updateUser } from '@/lib/userService';
import { handleError } from '@/lib/utils';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { action, userIds, params } = body;

        if (!action || !userIds || !Array.isArray(userIds)) {
            return NextResponse.json(
                { error: 'Invalid request. Required: action, userIds (array)' },
                { status: 400 }
            );
        }

        let success = 0;
        let failed = 0;
        const errors: string[] = [];

        for (const userId of userIds) {
            try {
                switch (action) {
                    case 'updateRole':
                        if (!params?.roleIds) {
                            throw new Error('roleIds required for updateRole action');
                        }
                        await updateUser(userId, {
                            roleIds: params.roleIds,
                            updatedAt: new Date()
                        });
                        success++;
                        break;

                    case 'updateTeam':
                        if (!params?.teamId) {
                            throw new Error('teamId required for updateTeam action');
                        }
                        await updateUser(userId, {
                            teamId: params.teamId,
                            updatedAt: new Date()
                        });
                        success++;
                        break;

                    case 'toggleActive':
                        // For toggle, we need the current state - using a simple approach
                        // In a real scenario, you might want to fetch current state first
                        const isActive = params?.isActive !== undefined ? params.isActive : true;
                        await updateUser(userId, {
                            isActive,
                            updatedAt: new Date()
                        });
                        success++;
                        break;

                    default:
                        throw new Error(`Unknown action: ${action}`);
                }
            } catch (error: any) {
                failed++;
                errors.push(`User ${userId}: ${error.message}`);
            }
        }

        return NextResponse.json({
            success,
            failed,
            errors
        });
    } catch (error) {
        handleError(error, 'Bulk user operation failed');
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
