// src/lib/headerService.ts
import { db } from './firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { HeaderConfig } from '@/types';

const HEADER_CONFIG_DOC_ID = 'global_header_config';

/**
 * Get the global header configuration
 */
export async function getHeaderConfig(): Promise<HeaderConfig | null> {
    try {
        const docRef = doc(db, 'header_config', HEADER_CONFIG_DOC_ID);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return docSnap.data() as HeaderConfig;
        }

        // Return default config if none exists
        return getDefaultHeaderConfig();
    } catch (error) {
        console.error('Failed to get header config:', error);
        return getDefaultHeaderConfig();
    }
}

/**
 * Update the global header configuration
 */
export async function updateHeaderConfig(config: HeaderConfig): Promise<void> {
    try {
        const docRef = doc(db, 'header_config', HEADER_CONFIG_DOC_ID);
        await setDoc(docRef, config, { merge: true });
    } catch (error) {
        console.error('Failed to update header config:', error);
        throw error;
    }
}

/**
 * Get default header configuration
 */
export function getDefaultHeaderConfig(): HeaderConfig {
    return {
        logo: '',
        title: 'JewelMatrix',
        navigation: [
            { name: 'Dashboard', href: '/dashboard', roles: ['admin', 'user'] },
            { name: 'Sales', href: '/admin/sales', roles: ['admin'] },
            { name: 'Marketing', href: '/admin/marketing', roles: ['admin'] },
            { name: 'Helpdesk', href: '/admin/helpdesk', roles: ['admin'] },
            { name: 'OKRs', href: '/okr', roles: ['admin', 'user'] },
            { name: 'Academy', href: '/learning-hub', roles: ['admin', 'user'] },
            { name: 'HR', href: '/admin/staff', roles: ['admin'] },
            { name: 'Security', href: '/admin/security', roles: ['admin'] },
        ],
        theme: 'indian'
    };
}