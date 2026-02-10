// Firebase Authentication Service
import {
    signInWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    User,
    UserCredential,
    sendPasswordResetEmail,
} from 'firebase/auth'
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore'
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

// Get user data from Firestore with RBAC support
export const getUserData = async (uid: string) => {
    try {
        const userDoc = await getDoc(doc(db, 'users', uid))
        if (userDoc.exists()) {
            const data = userDoc.data() as any;
            let permissions: any[] = [];
            let roleName = '';

            // If user has a roleId, fetch the role and its permissions
            if (data.roleId) {
                const roleDoc = await getDoc(doc(db, 'roles', data.roleId));
                if (roleDoc.exists()) {
                    const roleData = roleDoc.data();
                    permissions = roleData.permissions || [];
                    roleName = roleData.name || '';
                }
            }

            const processedData = {
                ...data,
                uid: uid, // Ensure uid is present
                roleName,
                permissions,
                createdAt: data.createdAt ? timestampToDate(data.createdAt) : undefined,
                updatedAt: data.updatedAt ? timestampToDate(data.updatedAt) : undefined
            };
            return processedData;
        }
        return null
    } catch (error: any) {
        handleError(error, 'Failed to get user data')
        throw new Error(error.message || 'Failed to get user data')
    }
}

// Get user by email
export const getUserByEmail = async (email: string) => {
    try {
        const q = query(collection(db, 'users'), where('email', '==', email))
        const querySnapshot = await getDocs(q)
        if (!querySnapshot.empty) {
            const doc = querySnapshot.docs[0]
            const data = doc.data()
            return {
                id: doc.id,
                ...data,
                // Ensure helper works or fallback
                uid: doc.id,
                email: data.email,
                fullName: data.fullName
            }
        }
        return null
    } catch (error: any) {
        handleError(error, 'Failed to find user by email')
        throw error
    }
}
