import { NextRequest, NextResponse } from 'next/server';
import { deleteTask, updateTask } from '@/lib/taskService';
import { handleError } from '@/lib/utils';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { action, taskIds, params } = body;

        if (!action || !taskIds || !Array.isArray(taskIds)) {
            return NextResponse.json(
                { error: 'Invalid request. Required: action, taskIds (array)' },
                { status: 400 }
            );
        }

        let success = 0;
        let failed = 0;
        const errors: string[] = [];

        for (const taskId of taskIds) {
            try {
                switch (action) {
                    case 'delete':
                        await deleteTask(taskId);
                        success++;
                        break;

                    case 'reassign':
                        if (!params?.assignedTo) {
                            throw new Error('assignedTo required for reassign action');
                        }
                        await updateTask(taskId, {
                            assignedTo: params.assignedTo,
                            updatedAt: new Date()
                        });
                        success++;
                        break;

                    case 'updateStatus':
                        if (!params?.status) {
                            throw new Error('status required for updateStatus action');
                        }
                        await updateTask(taskId, {
                            status: params.status,
                            updatedAt: new Date()
                        });
                        success++;
                        break;

                    case 'updatePriority':
                        if (!params?.priority) {
                            throw new Error('priority required for updatePriority action');
                        }
                        await updateTask(taskId, {
                            priority: params.priority,
                            updatedAt: new Date()
                        });
                        success++;
                        break;

                    default:
                        throw new Error(`Unknown action: ${action}`);
                }
            } catch (error: any) {
                failed++;
                errors.push(`Task ${taskId}: ${error.message}`);
            }
        }

        return NextResponse.json({
            success,
            failed,
            errors
        });
    } catch (error) {
        handleError(error, 'Bulk task operation failed');
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
