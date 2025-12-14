'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/contexts/AuthContext'
import { Loader2 } from 'lucide-react'
import { userHasPermission } from '@/lib/rbacService'

interface ProtectedRouteProps {
    children: React.ReactNode
    requireAdmin?: boolean
    requireManager?: boolean
}

export default function ProtectedRoute({
    children,
    requireAdmin = false,
    requireManager = false
}: ProtectedRouteProps) {
    const { user, userData, loading } = useAuth()
    const router = useRouter()
    const pathname = usePathname()
    const [isAuthorized, setIsAuthorized] = useState(false)

    useEffect(() => {
        const checkAccess = async () => {
            if (loading) return

            // Not authenticated - redirect to login
            if (!user || !userData) {
                // Save the intended destination
                sessionStorage.setItem('redirectAfterLogin', pathname)
                router.push('/')
                return
            }

            // Check admin access
            if (requireAdmin && userData?.uid) {
                const hasAdminAccess = await userHasPermission(userData.uid, 'admin', 'access');
                if (!hasAdminAccess) {
                    router.push('/dashboard')
                    return
                }
            }

            // Check manager access
            if (requireManager && userData?.uid) {
                const hasManagerAccess = await userHasPermission(userData.uid, 'kra', 'manage');
                if (!hasManagerAccess) {
                    router.push('/dashboard')
                    return
                }
            }

            // User is authorized
            setIsAuthorized(true)
        }

        checkAccess()
    }, [user, userData, loading, router, pathname, requireAdmin, requireManager])

    // Show loading state
    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-primary-600 mx-auto mb-4" />
                    <p className="text-gray-600 font-medium">Loading...</p>
                </div>
            </div>
        )
    }

    // Show nothing while checking authorization
    if (!isAuthorized) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-primary-600 mx-auto mb-4" />
                    <p className="text-gray-600 font-medium">Verifying access...</p>
                </div>
            </div>
        )
    }

    // User is authorized, render children
    return <>{children}</>
}
