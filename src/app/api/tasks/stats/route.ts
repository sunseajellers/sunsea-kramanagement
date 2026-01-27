import { NextRequest, NextResponse } from 'next/server'
import { getTaskStats } from '@/lib/taskService'

/**
 * GET /api/tasks/stats
 * Get task statistics
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const userId = searchParams.get('userId') || undefined
        const departmentId = searchParams.get('departmentId') || undefined

        const stats = await getTaskStats({ userId, departmentId })

        return NextResponse.json(stats)
    } catch (error) {
        console.error('Error fetching task stats:', error)
        // Return default empty stats instead of error to prevent frontend crash
        return NextResponse.json({
            total: 0,
            pending: 0,
            inProgress: 0,
            completed: 0,
            overdue: 0,
            completionRate: 0
        })
    }
}
