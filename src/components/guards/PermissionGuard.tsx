'use client'


import { FC, ReactNode } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Action } from '@/types/rbac'

interface PermissionGuardProps {
    module: string
    action: Action
    children: ReactNode
    fallback?: ReactNode
    mode?: 'hide' | 'disable'
}

/**
 * PermissionGuard
 * 
 * A wrapper component that conditionally renders children based on the user's permissions.
 * Matches the Deep Jewel aesthetic by potentially applying translucent disabled states.
 */
export const PermissionGuard: FC<PermissionGuardProps> = ({
    module,
    action,
    children,
    fallback = null,
    mode = 'hide'
}) => {
    const { hasPermission, loading } = useAuth()

    if (loading) return null

    const permitted = hasPermission(module, action)

    if (!permitted) {
        if (mode === 'disable') {
            return (
                <div className="relative opacity-50 cursor-not-allowed grayscale pointer-events-none select-none">
                    {children}
                </div>
            )
        }
        return fallback as React.ReactElement | null
    }

    return <>{children}</>
}
