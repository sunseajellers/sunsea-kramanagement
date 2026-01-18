// API Route for changing user password
import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebase-admin'

export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const authHeader = request.headers.get('Authorization')
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const idToken = authHeader.split('Bearer ')[1]
        const decodedToken = await adminAuth.verifyIdToken(idToken)
        const requestingUserId = decodedToken.uid

        const { id: userId } = await context.params

        // Users can only change their own password
        if (userId !== requestingUserId) {
            return NextResponse.json(
                { error: 'Unauthorized - Cannot change another user\'s password' },
                { status: 403 }
            )
        }

        const body = await request.json()
        const { currentPassword, newPassword } = body

        if (!currentPassword || !newPassword) {
            return NextResponse.json(
                { error: 'Current password and new password are required' },
                { status: 400 }
            )
        }

        // Note: Firebase Admin SDK doesn't directly support password verification
        // We need to use the Firebase REST API to verify the password
        const firebaseApiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY
        if (!firebaseApiKey) {
            return NextResponse.json(
                { error: 'Firebase API key not configured' },
                { status: 500 }
            )
        }

        // Get user email from Firestore
        const userDoc = await adminDb.collection('users').doc(userId).get()
        if (!userDoc.exists) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        const userEmail = userDoc.data()?.email || decodedToken.email

        // Verify current password using Firebase REST API
        try {
            const verifyResponse = await fetch(
                `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${firebaseApiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        email: userEmail,
                        password: currentPassword,
                        returnSecureToken: true
                    })
                }
            )

            if (!verifyResponse.ok) {
                return NextResponse.json(
                    { message: 'Current password is incorrect' },
                    { status: 401 }
                )
            }
        } catch (error) {
            console.error('Error verifying password:', error)
            return NextResponse.json(
                { message: 'Failed to verify current password' },
                { status: 500 }
            )
        }

        // Update password using Firebase Admin SDK
        try {
            await adminAuth.updateUser(userId, {
                password: newPassword
            })

            return NextResponse.json({ message: 'Password changed successfully' })
        } catch (error: any) {
            console.error('Error updating password:', error)
            return NextResponse.json(
                { message: error.message || 'Failed to update password' },
                { status: 500 }
            )
        }
    } catch (error: any) {
        console.error('Error in password change endpoint:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to change password' },
            { status: 500 }
        )
    }
}
