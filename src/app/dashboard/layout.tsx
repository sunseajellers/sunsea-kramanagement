'use client'

import { useEffect, useRef } from 'react'
import Header from '@/components/Header'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    // Sidebar removed — using top navbar instead
    const { user, userData, loading, getDefaultRoute } = useAuth()
    const router = useRouter()

    const redirectRef = useRef(false)

    useEffect(() => {
        // Redirect if not logged in
        if (!redirectRef.current && !loading && (!user || !userData)) {
            redirectRef.current = true
            router.push('/')
            return
        }
        
        // Redirect admin users to admin dashboard if they're on the main dashboard
        if (!redirectRef.current && !loading && userData) {
            const currentPath = window.location.pathname
            const isOnRegularDashboard = currentPath === '/dashboard'
            const isAdmin = userData.role === 'admin' || userData.isAdmin
            
            if (isOnRegularDashboard && isAdmin) {
                redirectRef.current = true
                console.log('🚫 Admin user blocked from /dashboard - redirecting to /dashboard/admin')
                router.replace('/dashboard/admin')
            }
        }
    }, [user, userData, loading, router])

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="flex flex-col items-center">
                    <Loader2 className="w-12 h-12 text-primary-600 animate-spin mb-4" />
                    <p className="text-gray-600 font-medium">Loading dashboard...</p>
                </div>
            </div>
        )
    }

    if (!user || !userData) return null

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            {/* Top navbar/header */}
            <Header />

            {/* Main Content */}
            <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
                <div className="max-w-7xl mx-auto animate-fade-in">
                    {children}
                </div>
            </main>
        </div>
    )
}
