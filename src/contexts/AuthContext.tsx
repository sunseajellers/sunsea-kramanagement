'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User } from 'firebase/auth'
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
                    const data = await getUserData(firebaseUser.uid)
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
                        // If no Firestore document exists, don't allow access
                        console.warn('No Firestore document found for user')
                        setUserData(null)
                        setError('Account not found in database. Please contact support.')
                    }
                } catch (err: unknown) {
                    const errorMessage = err instanceof Error ? err.message : 'Failed to fetch user data'
                    console.error('Error fetching user data:', errorMessage)
                    setError(errorMessage)
                    // SECURITY FIX: Don't set userData on error - force re-auth
                    // Previously this would set empty roles, which is a security risk
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

        // All authenticated users go to regular dashboard
        // Permission checks are handled by ProtectedRoute components
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
