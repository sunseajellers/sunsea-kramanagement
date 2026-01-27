// src/app/api/admin/tasks/audit/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { runOverdueAudit } from '@/lib/server/taskService';
import { withAdmin } from '@/lib/authMiddleware';

export async function POST(request: NextRequest) {
    return withAdmin(request, async () => {
        try {
            const count = await runOverdueAudit();
            return NextResponse.json({
                success: true,
                message: `Audit complete. ${count} tasks moved to overdue status.`
            });
        } catch (error) {
            console.error('Audit error:', error);
            return NextResponse.json({ error: 'Audit failed' }, { status: 500 });
        }
    });
}
