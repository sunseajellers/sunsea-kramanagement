// API Route for individual user operations (GET, PATCH)
import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, adminDb } from '@/lib/firebase-admin'
import { FieldValue } from 'firebase-admin/firestore'

// GET - Fetch user by ID
export async function GET(
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

        // Users can view their own profile, others need permission
        if (userId !== requestingUserId) {
            const { hasPermissionServer } = await import('@/lib/server/authService')
            const hasPermission = await hasPermissionServer(requestingUserId, 'users', 'view')
            if (!hasPermission) {
                return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
            }
        }

        // Fetch user document
        const userDoc = await adminDb.collection('users').doc(userId).get()
        if (!userDoc.exists) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        const userData = userDoc.data()
        return NextResponse.json({
            id: userDoc.id,
            ...userData,
            createdAt: userData?.createdAt?.toDate?.() || null,
            updatedAt: userData?.updatedAt?.toDate?.() || null
        })

    } catch (error: any) {
        console.error('Error fetching user:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to fetch user' },
            { status: 500 }
        )
    }
}

// PATCH - Update user profile
export async function PATCH(
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

        // Users can update their own profile, or those with 'edit' permission
        if (userId !== requestingUserId) {
            const { hasPermissionServer } = await import('@/lib/server/authService')
            const hasPermission = await hasPermissionServer(requestingUserId, 'users', 'edit')
            if (!hasPermission) {
                return NextResponse.json({ error: 'Unauthorized - Cannot update another user\'s profile' }, { status: 403 })
            }
        }

        const body = await request.json()
        const { fullName, phone, dateOfBirth, aadharNumber, panNumber, aadharPhotoUrl, panPhotoUrl, personalDocuments } = body

        // Prepare update data - only allow specific fields for self-update
        const updateData: any = {
            updatedAt: FieldValue.serverTimestamp()
        }

        if (fullName !== undefined) {
            updateData.fullName = fullName
            // Also update Firebase Auth displayName
            try {
                await adminAuth.updateUser(userId, { displayName: fullName })
            } catch (authError) {
                console.error('Failed to update auth displayName:', authError)
            }
        }

        if (phone !== undefined) {
            updateData.phone = phone
        }

        if (dateOfBirth !== undefined) {
            updateData.dateOfBirth = dateOfBirth
        }

        if (aadharNumber !== undefined) {
            updateData.aadharNumber = aadharNumber
        }

        if (panNumber !== undefined) {
            updateData.panNumber = panNumber
        }

        if (aadharPhotoUrl !== undefined) {
            updateData.aadharPhotoUrl = aadharPhotoUrl
        }

        if (panPhotoUrl !== undefined) {
            updateData.panPhotoUrl = panPhotoUrl
        }

        if (personalDocuments !== undefined) {
            updateData.personalDocuments = personalDocuments
        }

        // Update Firestore document
        await adminDb.collection('users').doc(userId).update(updateData)

        // Fetch updated user
        const updatedDoc = await adminDb.collection('users').doc(userId).get()
        const userData = updatedDoc.data()

        return NextResponse.json({
            success: true,
            user: {
                id: updatedDoc.id,
                ...userData,
                createdAt: userData?.createdAt?.toDate?.() || null,
                updatedAt: userData?.updatedAt?.toDate?.() || null
            }
        })

    } catch (error: any) {
        console.error('Error updating user:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to update user' },
            { status: 500 }
        )
    }
}
