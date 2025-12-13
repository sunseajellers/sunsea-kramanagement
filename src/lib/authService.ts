// Firebase Authentication Service
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    User,
    UserCredential,
    GoogleAuthProvider,
    signInWithPopup,
    sendPasswordResetEmail,
    updateProfile
} from 'firebase/auth'
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore'
import { auth, db } from './firebase'
import { UserRole } from '@/types'
import { handleError, timestampToDate } from './utils'

// Google Auth Provider
const googleProvider = new GoogleAuthProvider()

// Sign up with email and password
export const signUpWithEmail = async (
    email: string,
    password: string,
    fullName: string,
    role: UserRole = 'employee'
): Promise<UserCredential> => {
    try {
        // Create user in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, password)
        const user = userCredential.user

        // Update user profile with display name
        await updateProfile(user, {
            displayName: fullName
        })

        // Create user document in Firestore
        await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            email: user.email,
            fullName: fullName,
            role: role,
            isAdmin: false, // Default to false, must be manually set to true by developer
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        })

        return userCredential
    } catch (error: any) {
        handleError(error, 'Failed to sign up')
        throw new Error(error.message || 'Failed to sign up')
    }
}

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

// Sign in with Google
export const signInWithGoogle = async (allowCreate: boolean = false): Promise<{ success: boolean, userCredential?: UserCredential, error?: string }> => {
    try {
        const userCredential = await signInWithPopup(auth, googleProvider)
        const user = userCredential.user

        // Check if user document exists
        const userDoc = await getDoc(doc(db, 'users', user.uid))

        // Handle based on allowCreate
        if (allowCreate) {
            // For signup: if exists, error; if not, create
            if (userDoc.exists()) {
                return { success: false, error: 'Account already exists. Please sign in instead.' }
            } else {
                await setDoc(doc(db, 'users', user.uid), {
                    uid: user.uid,
                    email: user.email,
                    fullName: user.displayName || 'User',
                    role: 'employee', // Default role for Google sign-in
                    isAdmin: false, // Default to false, must be manually set to true by developer
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                })
                return { success: true, userCredential }
            }
        } else {
            // For login: must exist
            if (!userDoc.exists()) {
                return { success: false, error: 'Account not found. Please sign up first.' }
            }
            return { success: true, userCredential }
        }
    } catch (error: any) {
        return { success: false, error: error.message || 'Failed to sign in with Google' }
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
        const userDoc = await getDoc(doc(db, 'users', uid))
        if (userDoc.exists()) {
            const data = userDoc.data() as any;
            return {
                ...data,
                createdAt: data.createdAt ? timestampToDate(data.createdAt) : undefined,
                updatedAt: data.updatedAt ? timestampToDate(data.updatedAt) : undefined
            };
        }
        return null
    } catch (error: any) {
        handleError(error, 'Failed to get user data')
        throw new Error(error.message || 'Failed to get user data')
    }
}
