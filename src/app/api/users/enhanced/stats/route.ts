import { NextResponse } from 'next/server'
import { enhancedUserService } from '@/lib/enhancedUserService'

/**
 * GET /api/users/enhanced/stats
 * Get user statistics
 */
export async function GET() {
    try {
        const stats = await enhancedUserService.getUserStats()
        return NextResponse.json(stats)
    } catch (error) {
        console.error('Error fetching user stats:', error)
        // Return default empty stats instead of error to prevent frontend crash
        return NextResponse.json({
            totalUsers: 0,
            activeUsers: 0,
            admins: 0,
            employees: 0,
            byDepartment: {},
            byType: {}
        })
    }
}
