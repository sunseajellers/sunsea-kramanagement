import { NextRequest, NextResponse } from 'next/server'
import { enhancedUserService } from '@/lib/enhancedUserService'

/**
 * GET /api/users/enhanced
 * Get all users with enhanced employee fields
 */
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url)
        const teamId = searchParams.get('teamId')
        const employeeType = searchParams.get('employeeType') as any

        let users
        if (teamId) {
            users = await enhancedUserService.getUsersByTeam(teamId)
        } else if (employeeType) {
            users = await enhancedUserService.getUsersByEmployeeType(employeeType)
        } else {
            users = await enhancedUserService.getAllUsers()
        }

        return NextResponse.json(users)
    } catch (error) {
        console.error('Error fetching users:', error)
        return NextResponse.json(
            { error: 'Failed to fetch users' },
            { status: 500 }
        )
    }
}

/**
 * POST /api/users/enhanced
 * Create a new user with employee fields
 */
export async function POST(request: NextRequest) {
    try {
        const data = await request.json()

        // Validate required fields
        const required = ['fullName', 'email', 'position', 'employeeType', 'phone', 'joiningDate']
        for (const field of required) {
            if (!data[field]) {
                return NextResponse.json(
                    { error: `Missing required field: ${field}` },
                    { status: 400 }
                )
            }
        }

        // Convert date string to Date object
        data.joiningDate = new Date(data.joiningDate)
        if (data.dateOfBirth) {
            data.dateOfBirth = new Date(data.dateOfBirth)
        }

        const userId = await enhancedUserService.createUser(data)

        return NextResponse.json(
            { id: userId, message: 'User created successfully' },
            { status: 201 }
        )
    } catch (error) {
        console.error('Error creating user:', error)
        return NextResponse.json(
            { error: 'Failed to create user' },
            { status: 500 }
        )
    }
}
