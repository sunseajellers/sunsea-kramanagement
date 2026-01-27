'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User } from 'firebase/auth'
import { doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { onAuthStateChange, getUserData, logOut } from '@/lib/authService'

interface UserData {
    uid: string
    email: string | null
    fullName: string
    isAdmin: boolean // Simple boolean - set by developer in Firebase
    avatar?: string
    teamId?: string
    department?: string
}

interface AuthContextType {
    user: User | null
    userData: UserData | null
    loading: boolean
    error: string | null
    isAdmin: boolean
    logout: () => Promise<void>
    signOut: () => Promise<void>
    getDefaultRoute: () => string
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    userData: null,
    loading: true,
    error: null,
    isAdmin: false,
    logout: async () => { },
    signOut: async () => { },
    getDefaultRoute: () => '/admin'
})

export const useAuth = () => {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}

export const AuthProvider = ({ children }: { children: React.ReactNode }): React.ReactElement => {
    const [user, setUser] = useState<User | null>(null)
    const [userData, setUserData] = useState<UserData | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isAdmin, setIsAdmin] = useState(false)

    useEffect(() => {
        const unsubscribe = onAuthStateChange(async (firebaseUser) => {
            setUser(firebaseUser)

            if (firebaseUser) {
                try {
                    // Fetch user data from Firestore
                    let data = await getUserData(firebaseUser.uid)

                    // If no Firestore document exists, auto-create one
                    if (!data) {

                        // Create the user document - isAdmin: false by default
                        // Developer must set isAdmin: true in Firebase for admin users
                        const newUserData = {
                            id: firebaseUser.uid,
                            email: firebaseUser.email,
                            fullName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
                            isAdmin: false, // Default false - developer sets true in Firebase
                            isActive: true,
                            createdAt: serverTimestamp(),
                            updatedAt: serverTimestamp()
                        }

                        await setDoc(doc(db, 'users', firebaseUser.uid), newUserData)
                        data = await getUserData(firebaseUser.uid)
                    }

                    if (data) {
                        // Check isAdmin - can be boolean or check roleIds for backward compatibility
                        let adminStatus = false
                        if (typeof data.isAdmin === 'boolean') {
                            adminStatus = data.isAdmin
                        } else if (Array.isArray(data.roleIds)) {
                            adminStatus = data.roleIds.includes('admin')
                        }


                        const processedUserData: UserData = {
                            uid: data.uid || data.id || firebaseUser.uid,
                            email: data.email || firebaseUser.email,
                            fullName: data.fullName || firebaseUser.displayName || 'User',
                            isAdmin: adminStatus,
                            avatar: data.avatar || undefined,
                            teamId: data.teamId || undefined,
                            department: data.department || undefined
                        }


                        setUserData(processedUserData)
                        setIsAdmin(adminStatus)
                        setError(null)
                    } else {
                        console.error('Failed to create or retrieve user document')
                        setUserData(null)
                        setIsAdmin(false)
                        setError('Failed to create user profile. Please try again.')
                    }
                } catch (err: unknown) {
                    const errorMessage = err instanceof Error ? err.message : 'Failed to fetch user data'
                    console.error('Error fetching user data:', errorMessage)
                    setError(errorMessage)
                    setUserData(null)
                    setIsAdmin(false)
                }
            } else {
                setUserData(null)
                setIsAdmin(false)
            }

            setLoading(false)
        })

        return () => unsubscribe()
    }, [])

    const logout = async () => {
        try {
            await logOut()
            setUser(null)
            setUserData(null)
            setIsAdmin(false)
            setError(null)
        } catch (error: any) {
            setError(error.message || 'Failed to logout')
            throw error
        }
    }

    const getDefaultRoute = () => {
        // Non-admin users go to employee dashboard, admins go to admin panel
        return isAdmin ? '/admin' : '/dashboard'
    }

    const value = React.useMemo(() => ({
        user,
        userData,
        loading,
        error,
        isAdmin,
        logout,
        signOut: logout,
        getDefaultRoute
    }), [user, userData, loading, error, isAdmin])

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
