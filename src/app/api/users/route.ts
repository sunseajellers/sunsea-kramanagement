// API Route for Admin User Management
import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'

// Create a new user (Admin only)
export async function POST(request: NextRequest) {
    try {
        // Get authorization header
        const authHeader = request.headers.get('Authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const idToken = authHeader.split('Bearer ')[1]

        // Verify the requesting user is authenticated
        const decodedToken = await adminAuth.verifyIdToken(idToken)
        const requestingUserId = decodedToken.uid

        // Check if requesting user has admin role
        const requestingUserDoc = await adminDb.collection('users').doc(requestingUserId).get()
        const userData = requestingUserDoc.data()
        if (!requestingUserDoc.exists || userData?.isAdmin !== true) {
            return NextResponse.json({ error: 'Unauthorized. Admin access required.' }, { status: 403 })
        }

        // Parse request body
        const body = await request.json()
        const {
            email,
            password,
            fullName,
            roleIds = [],
            employeeId = '',
            department = '',
            position = '',
            employeeType = 'full-time'
        } = body

        // Validate required fields
        if (!email || !password || !fullName || !employeeId) {
            return NextResponse.json(
                { error: 'Missing required fields: email, password, fullName, employeeId' },
                { status: 400 }
            )
        }

        // Validate password strength
        if (password.length < 6) {
            return NextResponse.json(
                { error: 'Password must be at least 6 characters' },
                { status: 400 }
            )
        }

        // Create user in Firebase Auth
        const userRecord = await adminAuth.createUser({
            email,
            password,
            displayName: fullName,
            emailVerified: true // Admin-created users are pre-verified
        })

        // Create user document in Firestore
        await adminDb.collection('users').doc(userRecord.uid).set({
            id: userRecord.uid,
            email: userRecord.email,
            fullName: fullName,
            roleIds: roleIds,
            employeeId,
            department,
            position,
            employeeType,
            isActive: true,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
            createdBy: requestingUserId
        })

        return NextResponse.json({
            success: true,
            user: {
                id: userRecord.uid,
                email: userRecord.email,
                fullName: fullName
            }
        }, { status: 201 })

    } catch (error: any) {
        console.error('Error creating user:', error)

        // Handle specific Firebase Auth errors
        if (error.code === 'auth/email-already-exists') {
            return NextResponse.json(
                { error: 'A user with this email already exists' },
                { status: 409 }
            )
        }
        if (error.code === 'auth/invalid-email') {
            return NextResponse.json(
                { error: 'Invalid email format' },
                { status: 400 }
            )
        }
        if (error.code === 'auth/weak-password') {
            return NextResponse.json(
                { error: 'Password is too weak' },
                { status: 400 }
            )
        }

        return NextResponse.json(
            { error: error.message || 'Failed to create user' },
            { status: 500 }
        )
    }
}

// Get all users (for admin panel)
export async function GET(request: NextRequest) {
    try {
        // Get authorization header
        const authHeader = request.headers.get('Authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const idToken = authHeader.split('Bearer ')[1]

        // Verify the requesting user is authenticated
        await adminAuth.verifyIdToken(idToken)

        // Fetch all users from Firestore
        const usersSnapshot = await adminDb.collection('users').get()
        const users = usersSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }))

        return NextResponse.json({ users }, { status: 200 })

    } catch (error: any) {
        console.error('Error fetching users:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to fetch users' },
            { status: 500 }
        )
    }
}
