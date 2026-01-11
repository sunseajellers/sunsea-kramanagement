// Firebase Authentication Service
import {
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    User,
    UserCredential,
    sendPasswordResetEmail,
} from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from './firebase'
import { handleError, timestampToDate } from './utils'

// Sign in with email and password
export const signInWithEmail = async (
    email: string,
    password: string
): Promise<UserCredential> => {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password)
        return userCredential
    } catch (error: any) {
        handleError(error, 'Failed to sign in')
        throw new Error(error.message || 'Failed to sign in')
    }
}

// Sign out
export const logOut = async (): Promise<void> => {
    try {
        await signOut(auth)
    } catch (error: any) {
        handleError(error, 'Failed to sign out')
        throw new Error(error.message || 'Failed to sign out')
    }
}

// Send password reset email
export const resetPassword = async (email: string): Promise<void> => {
    try {
        await sendPasswordResetEmail(auth, email)
    } catch (error: any) {
        handleError(error, 'Failed to send password reset email')
        throw new Error(error.message || 'Failed to send password reset email')
    }
}

// Get current user
export const getCurrentUser = (): User | null => {
    return auth.currentUser
}

// Listen to auth state changes
export const onAuthStateChange = (callback: (user: User | null) => void) => {
    return onAuthStateChanged(auth, callback)
}

// Get user data from Firestore
export const getUserData = async (uid: string) => {
    try {
        console.log('🔍 getUserData called for UID:', uid)
        const userDoc = await getDoc(doc(db, 'users', uid))
        console.log('🔍 getUserData - doc exists:', userDoc.exists())
        if (userDoc.exists()) {
            const data = userDoc.data() as any;
            console.log('🔍 getUserData - raw doc data:', data)
            const processedData = {
                ...data,
                createdAt: data.createdAt ? timestampToDate(data.createdAt) : undefined,
                updatedAt: data.updatedAt ? timestampToDate(data.updatedAt) : undefined
            };
            console.log('🔍 getUserData - processed data:', processedData)
            return processedData;
        }
        console.log('🔍 getUserData - document does not exist')
        return null
    } catch (error: any) {
        handleError(error, 'Failed to get user data')
        throw new Error(error.message || 'Failed to get user data')
    }
}
