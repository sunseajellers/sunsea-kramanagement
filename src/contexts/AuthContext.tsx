'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { User } from 'firebase/auth'
import { onAuthStateChange, getUserData, logOut } from '@/lib/authService'
import { UserRole } from '@/types'

interface UserData {
    uid: string
    email: string | null
    fullName: string
    role: UserRole
    isAdmin: boolean
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
    logout: async () => {},
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
                    console.log('🔍 AuthContext Debug - Raw Firestore data:', data)
                    if (data) {
                        const processedUserData = {
                            uid: data.uid || firebaseUser.uid,
                            email: data.email || firebaseUser.email,
                            fullName: data.fullName || firebaseUser.displayName || 'User',
                            role: data.role || 'employee',
                            isAdmin: data.isAdmin === true, // Explicitly check for true
                            avatar: data.avatar || undefined,
                            teamId: data.teamId || undefined
                        }
                        console.log('🔍 AuthContext Debug - Processed userData:', processedUserData)
                        setUserData(processedUserData)
                    } else {
                        // If no Firestore document exists, don't allow access
                        console.warn('No Firestore document found for user')
                        setUserData(null)
                        setError('Account not found in database. Please contact support.')
                    }
                    setError(null)
                } catch (err: any) {
                    console.error('Error fetching user data:', err)
                    setError(err.message || 'Failed to fetch user data')
                    // Set default user data even on error
                    setUserData({
                        uid: firebaseUser.uid,
                        email: firebaseUser.email,
                        fullName: firebaseUser.displayName || 'User',
                        role: 'employee',
                        isAdmin: false,
                        avatar: undefined,
                        teamId: undefined
                    })
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
        
        // Admin users go to admin dashboard
        if (userData.role === 'admin' || userData.isAdmin) {
            return '/dashboard/admin'
        }
        
        // Everyone else goes to regular dashboard
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
