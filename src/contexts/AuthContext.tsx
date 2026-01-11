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
    roleIds: string[]
    avatar?: string
    teamId?: string
}

interface AuthContextType {
    user: User | null
    userData: UserData | null
    loading: boolean
    error: string | null
    logout: () => Promise<void>
    getDefaultRoute: () => string
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    userData: null,
    loading: true,
    error: null,
    logout: async () => { },
    getDefaultRoute: () => '/dashboard'
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

    useEffect(() => {
        const unsubscribe = onAuthStateChange(async (firebaseUser) => {
            setUser(firebaseUser)

            if (firebaseUser) {
                try {
                    // Fetch user data from Firestore
                    let data = await getUserData(firebaseUser.uid)

                    // If no Firestore document exists, auto-create one
                    if (!data) {
                        console.log('📝 Creating Firestore user document for:', firebaseUser.email)

                        // Create the user document
                        const newUserData = {
                            id: firebaseUser.uid,
                            email: firebaseUser.email,
                            fullName: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'User',
                            roleIds: ['admin'], // First user gets admin role
                            isActive: true,
                            createdAt: serverTimestamp(),
                            updatedAt: serverTimestamp()
                        }

                        await setDoc(doc(db, 'users', firebaseUser.uid), newUserData)

                        // Fetch the newly created document
                        data = await getUserData(firebaseUser.uid)
                    }

                    if (data) {
                        const processedUserData = {
                            uid: data.uid || firebaseUser.uid,
                            email: data.email || firebaseUser.email,
                            fullName: data.fullName || firebaseUser.displayName || 'User',
                            roleIds: data.roleIds || [],
                            avatar: data.avatar || undefined,
                            teamId: data.teamId || undefined
                        }
                        setUserData(processedUserData)
                        setError(null)
                    } else {
                        console.error('Failed to create or retrieve user document')
                        setUserData(null)
                        setError('Failed to create user profile. Please try again.')
                    }
                } catch (err: unknown) {
                    const errorMessage = err instanceof Error ? err.message : 'Failed to fetch user data'
                    console.error('Error fetching user data:', errorMessage)
                    setError(errorMessage)
                    setUserData(null)
                }
            } else {
                setUserData(null)
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
            setError(null)
        } catch (error: any) {
            setError(error.message || 'Failed to logout')
            throw error
        }
    }

    const getDefaultRoute = () => {
        if (!userData) return '/dashboard'

        // Check if user has admin role
        if (userData.roleIds.includes('admin')) {
            return '/dashboard/admin'
        }

        // All other authenticated users go to regular dashboard
        return '/dashboard'
    }

    const value = {
        user,
        userData,
        loading,
        error,
        logout,
        getDefaultRoute
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
