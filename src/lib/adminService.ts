// src/lib/adminService.ts
import { db } from './firebase';
import { collection, getDocs, doc, updateDoc, deleteDoc, query, where, orderBy, limit } from 'firebase/firestore';

export interface SystemHealth {
    database: 'healthy' | 'warning' | 'error';
    firestore: 'healthy' | 'warning' | 'error';
    authentication: 'healthy' | 'warning' | 'error';
    storage: 'healthy' | 'warning' | 'error';
    lastBackup: Date | null;
    uptime: number;
    activeUsers: number;
    totalUsers: number;
}

export interface SystemSettings {
    maintenanceMode: boolean;
    allowRegistration: boolean;
    emailNotifications: boolean;
    backupFrequency: 'daily' | 'weekly' | 'monthly';
    logRetention: number;
    maxFileSize: number;
    sessionTimeout: number;
}

export interface AdminLog {
    id: string;
    timestamp: Date;
    action: string;
    userId: string;
    userEmail: string;
    details: string;
    ipAddress?: string;
    userAgent?: string;
}

/**
 * Get system health status
 */
export async function getSystemHealth(): Promise<SystemHealth> {
    try {
        // In a real implementation, this would check actual system metrics
        // For now, we'll return mock data
        const usersSnapshot = await getDocs(collection(db, 'users'));
        const totalUsers = usersSnapshot.size;

        // Mock active users (users active in last 24 hours)
        const activeUsers = Math.floor(totalUsers * 0.3);

        return {
            database: 'healthy',
            firestore: 'healthy',
            authentication: 'healthy',
            storage: 'healthy',
            lastBackup: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
            uptime: 99.9,
            activeUsers,
            totalUsers
        };
    } catch (error) {
        console.error('Failed to get system health:', error);
        return {
            database: 'error',
            firestore: 'error',
            authentication: 'error',
            storage: 'error',
            lastBackup: null,
            uptime: 0,
            activeUsers: 0,
            totalUsers: 0
        };
    }
}

/**
 * Get system settings
 */
export async function getSystemSettings(): Promise<SystemSettings> {
    try {
        // In a real implementation, this would fetch from a settings collection
        // For now, return default settings
        return {
            maintenanceMode: false,
            allowRegistration: true,
            emailNotifications: true,
            backupFrequency: 'daily',
            logRetention: 30,
            maxFileSize: 10,
            sessionTimeout: 480
        };
    } catch (error) {
        console.error('Failed to get system settings:', error);
        throw error;
    }
}

/**
 * Update system settings
 */
export async function updateSystemSettings(settings: Partial<SystemSettings>): Promise<void> {
    try {
        // In a real implementation, this would update a settings document
        // For now, just log the action
        console.log('Updating system settings:', settings);

        // Log the admin action
        await logAdminAction(
            'update_system_settings',
            'System settings updated',
            JSON.stringify(settings)
        );
    } catch (error) {
        console.error('Failed to update system settings:', error);
        throw error;
    }
}

/**
 * Toggle maintenance mode
 */
export async function toggleMaintenanceMode(enabled: boolean): Promise<void> {
    try {
        await updateSystemSettings({ maintenanceMode: enabled });

        // Log the action
        await logAdminAction(
            enabled ? 'enable_maintenance_mode' : 'disable_maintenance_mode',
            `Maintenance mode ${enabled ? 'enabled' : 'disabled'}`,
            `Maintenance mode set to ${enabled}`
        );
    } catch (error) {
        console.error('Failed to toggle maintenance mode:', error);
        throw error;
    }
}

/**
 * Perform system backup
 */
export async function performSystemBackup(): Promise<void> {
    try {
        // In a real implementation, this would trigger a backup process
        // For now, just simulate the backup
        console.log('Performing system backup...');

        // Log the backup action
        await logAdminAction(
            'system_backup',
            'System backup initiated',
            'Full system backup started'
        );

        // Simulate backup time
        await new Promise(resolve => setTimeout(resolve, 3000));

        // Log successful backup
        await logAdminAction(
            'system_backup_complete',
            'System backup completed',
            'Full system backup finished successfully'
        );
    } catch (error) {
        console.error('Failed to perform system backup:', error);
        await logAdminAction(
            'system_backup_failed',
            'System backup failed',
            `Backup failed: ${error}`
        );
        throw error;
    }
}

/**
 * Get admin activity logs
 */
export async function getAdminLogs(limitCount: number = 50): Promise<AdminLog[]> {
    try {
        const logsQuery = query(
            collection(db, 'admin_logs'),
            orderBy('timestamp', 'desc'),
            limit(limitCount)
        );

        const snapshot = await getDocs(logsQuery);
        return snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data().timestamp.toDate()
        })) as AdminLog[];
    } catch (error) {
        console.error('Failed to get admin logs:', error);
        return [];
    }
}

/**
 * Log admin action
 */
export async function logAdminAction(
    action: string,
    description: string,
    details: string,
    userId?: string,
    userEmail?: string
): Promise<void> {
    try {
        // In a real implementation, this would create a log entry
        // For now, just console log
        console.log('Admin Action:', {
            action,
            description,
            details,
            userId,
            userEmail,
            timestamp: new Date()
        });
    } catch (error) {
        console.error('Failed to log admin action:', error);
    }
}

/**
 * Get database statistics
 */
export async function getDatabaseStats(): Promise<{
    users: number;
    teams: number;
    tasks: number;
    kras: number;
    reports: number;
}> {
    try {
        const [users, teams, tasks, kras, reports] = await Promise.all([
            getDocs(collection(db, 'users')),
            getDocs(collection(db, 'teams')),
            getDocs(collection(db, 'tasks')),
            getDocs(collection(db, 'kras')),
            getDocs(collection(db, 'reports'))
        ]);

        return {
            users: users.size,
            teams: teams.size,
            tasks: tasks.size,
            kras: kras.size,
            reports: reports.size
        };
    } catch (error) {
        console.error('Failed to get database stats:', error);
        return {
            users: 0,
            teams: 0,
            tasks: 0,
            kras: 0,
            reports: 0
        };
    }
}

/**
 * Clean up old logs based on retention policy
 */
export async function cleanupOldLogs(retentionDays: number): Promise<void> {
    try {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

        // In a real implementation, this would delete old log entries
        console.log(`Cleaning up logs older than ${retentionDays} days`);

        await logAdminAction(
            'cleanup_logs',
            'Old logs cleaned up',
            `Deleted logs older than ${retentionDays} days`
        );
    } catch (error) {
        console.error('Failed to cleanup old logs:', error);
        throw error;
    }
}