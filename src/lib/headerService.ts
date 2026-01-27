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
            { name: 'Home', href: '/dashboard', roles: ['admin', 'user'] },
            { name: 'Team', href: '/admin/operations', roles: ['admin'] },
            { name: 'People', href: '/admin/organization', roles: ['admin'] },
            { name: 'Tasks', href: '/dashboard/tasks', roles: ['user'] },
            { name: 'Score', href: '/dashboard/my-updates', roles: ['user'] },
            { name: 'OKRs', href: '/dashboard/kras', roles: ['user'] },
            { name: 'Academy', href: '/dashboard/learning-hub', roles: ['admin', 'user'] },
        ],
        theme: 'indian'
    };
}