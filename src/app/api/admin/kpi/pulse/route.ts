// src/app/api/admin/kpi/pulse/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { processKPIPulse } from '@/lib/server/kpiService';
import { withAdmin } from '@/lib/authMiddleware';

export async function POST(request: NextRequest) {
    return withAdmin(request, async () => {
        try {
            const count = await processKPIPulse();
            return NextResponse.json({
                success: true,
                message: `KPI Pulse executed. ${count} recurring tasks generated.`
            });
        } catch (error) {
            console.error('KPI Pulse error:', error);
            return NextResponse.json({ error: 'Pulse execution failed' }, { status: 500 });
        }
    });
}
