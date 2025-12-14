'use client'

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getUserPermissions } from '@/lib/rbacService';
import { Permission } from '@/types';

interface PermissionsContextType {
    permissions: Permission[];
    loading: boolean;
    hasPermission: (module: string, action: string) => boolean;
    refreshPermissions: () => Promise<void>;
}

const PermissionsContext = createContext<PermissionsContextType | undefined>(undefined);

export function PermissionsProvider({ children }: { children: React.ReactNode }) {
    const { userData } = useAuth();
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [loading, setLoading] = useState(true);

    const loadPermissions = async () => {
        if (!userData?.uid) {
            setPermissions([]);
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const userPermissions = await getUserPermissions(userData.uid);
            setPermissions(userPermissions);
        } catch (error) {
            console.error('Failed to load permissions:', error);
            setPermissions([]);
        } finally {
            setLoading(false);
        }
    };

    const hasPermission = (module: string, action: string): boolean => {
        return permissions.some(p => p.module === module && p.action === action);
    };

    const refreshPermissions = async () => {
        await loadPermissions();
    };

    useEffect(() => {
        loadPermissions();
    }, [userData?.uid]);

    const value: PermissionsContextType = {
        permissions,
        loading,
        hasPermission,
        refreshPermissions
    };

    return (
        <PermissionsContext.Provider value={value}>
            {children}
        </PermissionsContext.Provider>
    );
}

export function usePermissions() {
    const context = useContext(PermissionsContext);
    if (context === undefined) {
        throw new Error('usePermissions must be used within a PermissionsProvider');
    }
    return context;
}

// Higher-order component for permission checking
export function withPermission<P extends object>(
    WrappedComponent: React.ComponentType<P>,
    requiredModule: string,
    requiredAction: string,
    fallbackComponent?: React.ComponentType<any>
) {
    return function PermissionProtectedComponent(props: P) {
        const { hasPermission, loading } = usePermissions();

        if (loading) {
            return <div>Loading...</div>;
        }

        if (!hasPermission(requiredModule, requiredAction)) {
            if (fallbackComponent) {
                const FallbackComponent = fallbackComponent;
                return <FallbackComponent />;
            }
            return <div>You don't have permission to access this feature.</div>;
        }

        return <WrappedComponent {...props} />;
    };
}