// src/app/api/admin/tasks/extensions/[taskId]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { approveExtension, rejectExtension } from '@/lib/server/taskService';
import { withAdmin } from '@/lib/authMiddleware';

export async function POST(
    request: NextRequest,
    context: { params: Promise<{ taskId: string }> }
) {
    return withAdmin(request, async (_req, adminId) => {
        try {
            const { taskId } = await context.params
            const { action, reason } = await request.json();

            if (action === 'approve') {
                await approveExtension(taskId, adminId);
            } else if (action === 'reject') {
                await rejectExtension(taskId, adminId, reason || 'No reason provided');
            } else {
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
            }

            return NextResponse.json({ success: true });
        } catch (error) {
            console.error('Error processing extension:', error);
            return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
        }
    });
}
