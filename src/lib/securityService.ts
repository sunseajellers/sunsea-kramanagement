import { db } from './firebase';
import { collection, getDocs, query, orderBy, limit, Timestamp, addDoc } from 'firebase/firestore';
import { Role } from '@/types';

export interface AuditEvent {
    id: string;
    timestamp: Date;
    userId: string;
    userName: string;
    action: string;
    module: 'CRM' | 'Sales' | 'Staff' | 'Workflow' | 'Analytics' | 'Marketing' | 'Security';
    severity: 'low' | 'medium' | 'high' | 'critical';
    details: string;
    ipAddress?: string;
}

export interface SecurityStats {
    healthScore: number;
    activeSessions: number;
    mfaEnabled: number; // percentage
    criticalAlerts: number;
    systemUptime: number; // percentage
}

const COLLECTION_NAME = 'audit_logs';

export const getAuditLogs = async (maxResults: number = 20): Promise<AuditEvent[]> => {
    try {
        const q = query(collection(db, COLLECTION_NAME), orderBy('timestamp', 'desc'), limit(maxResults));
        const querySnapshot = await getDocs(q);
        return querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                ...data,
                id: doc.id,
                timestamp: data.timestamp instanceof Timestamp ? data.timestamp.toDate() : data.timestamp,
            } as AuditEvent;
        });
    } catch (error) {
        console.error('Error getting audit logs:', error);
        return [];
    }
};

export const getSecurityStats = async (): Promise<SecurityStats> => {
    try {
        const logs = await getAuditLogs(100);
        const criticalAlerts = logs.filter(l => l.severity === 'critical').length;

        return {
            healthScore: criticalAlerts > 0 ? 85 : 94,
            activeSessions: 12, // Mock for now as session tracking is complex
            mfaEnabled: 88,
            criticalAlerts,
            systemUptime: 99.98
        };
    } catch (error) {
        console.error('Error getting security stats:', error);
        return {
            healthScore: 0,
            activeSessions: 0,
            mfaEnabled: 0,
            criticalAlerts: 0,
            systemUptime: 0
        };
    }
};

export const getComplianceStatus = async () => {
    try {
        // In real app, calculate from audit logs and settings
        return [
            { label: 'GDPR Data Compliance', status: 'Compliant', progress: 100 },
            { label: 'Auditing & Visibility', status: 'Optimal', progress: 94 },
            { label: 'Access Control Rigor', status: 'Review Needed', progress: 75, warn: true },
        ];
    } catch (error) {
        console.error('Error getting compliance status:', error);
        return [];
    }
};

// Mock Config Data (In a real app, this would be in a 'system_settings' collection)
let mockSecurityConfig = {
    whitelistedIps: ['192.168.1.1', '10.0.0.1'],
    enforceIpWhitelist: false,
    maxSessionDuration: 120,
    mfaEnforcedRoles: ['admin', 'super_admin'],
    passwordPolicy: {
        minLength: 8,
        requireSpecialChar: true,
        expiryDays: 90
    }
};

export const getSecurityConfig = async () => {
    // Simulate API call
    return mockSecurityConfig;
};



export const updateSecurityConfig = async (config: any) => {
    // Simulate API call
    mockSecurityConfig = config;
    return true;
};

// --- Role Management ---

export const getRoles = async (): Promise<Role[]> => {
    try {
        const snapshot = await getDocs(collection(db, 'roles'));
        return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Role));
    } catch (error) {
        console.error('Error fetching roles:', error);
        return [];
    }
};

export const createRole = async (roleData: any) => {
    try {
        const docRef = await addDoc(collection(db, 'roles'), {
            ...roleData,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        });
        return docRef.id;
    } catch (error) {
        console.error('Error creating role:', error);
        throw error;
    }
};
