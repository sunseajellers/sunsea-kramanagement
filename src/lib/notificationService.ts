// src/lib/notificationService.ts
import { collection, query, where, orderBy, limit, getDocs, addDoc, updateDoc, doc, deleteDoc, Timestamp } from 'firebase/firestore';
import { db } from './firebase';
import { Notification } from '@/types';
import { timestampToDate, handleError } from './utils';

export type NotificationType =
    | 'task_assigned'
    | 'task_updated'
    | 'task_overdue'
    | 'kra_assigned'
    | 'kra_updated'
    | 'kra_deadline'
    | 'team_update'
    | 'system_alert'
    | 'performance_alert'
    | 'report_ready';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'critical';

export interface NotificationRule {
    id: string;
    name: string;
    description: string;
    type: NotificationType;
    conditions: {
        trigger: string;
        threshold?: number;
        filters?: any;
    };
    template: {
        title: string;
        message: string;
        priority: NotificationPriority;
    };
    recipients: {
        roles: string[];
        teams?: string[];
        users?: string[];
    };
    schedule: {
        enabled: boolean;
        frequency?: 'immediate' | 'daily' | 'weekly';
        time?: string;
    };
    isActive: boolean;
    createdBy: string;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Fetch the latest notifications for a given user.
 * Returns at most `limitCount` items ordered by newest first.
 */
export async function getUserNotifications(
    uid: string,
    limitCount = 10
): Promise<Notification[]> {
    try {
        const q = query(
            collection(db, 'notifications'),
            where('userId', '==', uid),
            orderBy('createdAt', 'desc'),
            limit(limitCount)
        );

        const snap = await getDocs(q);
        return snap.docs.map((doc) => {
            const data = doc.data();
            return {
                id: doc.id,
                ...data,
                createdAt: timestampToDate(data.createdAt)
            } as Notification;
        });
    } catch (error) {
        handleError(error, 'Failed to fetch notifications');
        throw error;
    }
}

/**
 * Create a notification for a user
 */
export async function createNotification(notificationData: Omit<Notification, 'id'>): Promise<string> {
    try {
        const docRef = await addDoc(collection(db, 'notifications'), {
            ...notificationData,
            createdAt: Timestamp.now()
        });
        return docRef.id;
    } catch (error) {
        handleError(error, 'Failed to create notification');
        throw error;
    }
}

// ===== ADMIN NOTIFICATION MANAGEMENT =====

/**
 * Get all notification rules for admin management
 */
export async function getAllNotificationRules(): Promise<NotificationRule[]> {
    try {
        const q = query(
            collection(db, 'notificationRules'),
            orderBy('createdAt', 'desc')
        );
        const snap = await getDocs(q);
        return snap.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
            updatedAt: doc.data().updatedAt?.toDate()
        })) as NotificationRule[];
    } catch (error) {
        handleError(error, 'Failed to fetch notification rules');
        throw error;
    }
}

/**
 * Create a new notification rule
 */
export async function createNotificationRule(ruleData: Omit<NotificationRule, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
    try {
        const docRef = await addDoc(collection(db, 'notificationRules'), {
            ...ruleData,
            createdAt: Timestamp.now(),
            updatedAt: Timestamp.now()
        });
        return docRef.id;
    } catch (error) {
        handleError(error, 'Failed to create notification rule');
        throw error;
    }
}

/**
 * Update a notification rule
 */
export async function updateNotificationRule(ruleId: string, updates: Partial<NotificationRule>): Promise<void> {
    try {
        await updateDoc(doc(db, 'notificationRules', ruleId), {
            ...updates,
            updatedAt: Timestamp.now()
        });
    } catch (error) {
        handleError(error, 'Failed to update notification rule');
        throw error;
    }
}

/**
 * Delete a notification rule
 */
export async function deleteNotificationRule(ruleId: string): Promise<void> {
    try {
        await deleteDoc(doc(db, 'notificationRules', ruleId));
    } catch (error) {
        handleError(error, 'Failed to delete notification rule');
        throw error;
    }
}

/**
 * Get notification analytics for admin dashboard
 */
export async function getNotificationAnalytics() {
    try {
        const rules = await getAllNotificationRules();

        const activeRules = rules.filter(r => r.isActive);
        const rulesByType = rules.reduce((acc, rule) => {
            acc[rule.type] = (acc[rule.type] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const rulesByPriority = rules.reduce((acc, rule) => {
            acc[rule.template.priority] = (acc[rule.template.priority] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        return {
            totalRules: rules.length,
            activeRules: activeRules.length,
            rulesByType,
            rulesByPriority,
            recentActivity: {
                rulesCreated: rules.filter(r => r.createdAt >= thirtyDaysAgo).length,
                rulesUpdated: rules.filter(r => r.updatedAt >= thirtyDaysAgo && r.createdAt < thirtyDaysAgo).length
            }
        };
    } catch (error) {
        handleError(error, 'Failed to fetch notification analytics');
        throw error;
    }
}

/**
 * Test a notification rule
 */
export async function testNotificationRule(ruleId: string, testRecipientId: string): Promise<void> {
    try {
        const rules = await getAllNotificationRules();
        const rule = rules.find(r => r.id === ruleId);

        if (!rule) throw new Error('Rule not found');

        console.log('Testing notification rule:', {
            ruleId,
            ruleName: rule.name,
            testRecipientId,
            template: rule.template
        });
    } catch (error) {
        handleError(error, 'Failed to test notification rule');
        throw error;
    }
}

// ===== DEFAULT NOTIFICATION RULES =====

export const DEFAULT_NOTIFICATION_RULES: Omit<NotificationRule, 'id' | 'createdAt' | 'updatedAt' | 'createdBy'>[] = [
    {
        name: 'Task Overdue Alert',
        description: 'Notify when tasks become overdue',
        type: 'task_overdue',
        conditions: {
            trigger: 'task_overdue',
            threshold: 1
        },
        template: {
            title: 'Task Overdue: {{task.title}}',
            message: 'The task "{{task.title}}" is now overdue. Please review and update its status.',
            priority: 'high'
        },
        recipients: {
            roles: ['employee', 'manager']
        },
        schedule: {
            enabled: true,
            frequency: 'daily',
            time: '09:00'
        },
        isActive: true
    },
    {
        name: 'KRA Deadline Approaching',
        description: 'Alert when KRA deadlines are approaching',
        type: 'kra_deadline',
        conditions: {
            trigger: 'kra_deadline_approaching',
            threshold: 3
        },
        template: {
            title: 'KRA Deadline Approaching: {{kra.title}}',
            message: 'The KRA "{{kra.title}}" is due in {{days}} days. Please ensure progress is on track.',
            priority: 'medium'
        },
        recipients: {
            roles: ['employee', 'manager']
        },
        schedule: {
            enabled: true,
            frequency: 'daily',
            time: '10:00'
        },
        isActive: true
    },
    {
        name: 'Weekly Performance Report',
        description: 'Send weekly performance summaries',
        type: 'report_ready',
        conditions: {
            trigger: 'weekly_report_generated'
        },
        template: {
            title: 'Weekly Performance Report Available',
            message: 'Your weekly performance report is now available. Check your dashboard for detailed insights.',
            priority: 'low'
        },
        recipients: {
            roles: ['employee', 'manager', 'admin']
        },
        schedule: {
            enabled: true,
            frequency: 'weekly',
            time: '08:00'
        },
        isActive: true
    },
    {
        name: 'Team Performance Alert',
        description: 'Alert managers when team performance drops',
        type: 'performance_alert',
        conditions: {
            trigger: 'team_completion_rate_below',
            threshold: 70
        },
        template: {
            title: 'Team Performance Alert: {{team.name}}',
            message: 'Team "{{team.name}}" has a completion rate below {{threshold}}%. Please review and provide support.',
            priority: 'high'
        },
        recipients: {
            roles: ['manager', 'admin']
        },
        schedule: {
            enabled: true,
            frequency: 'weekly',
            time: '09:00'
        },
        isActive: true
    },
    {
        name: 'New Task Assignment',
        description: 'Notify when new tasks are assigned',
        type: 'task_assigned',
        conditions: {
            trigger: 'task_assigned'
        },
        template: {
            title: 'New Task Assigned: {{task.title}}',
            message: 'You have been assigned a new task: "{{task.title}}". Due date: {{task.dueDate}}.',
            priority: 'medium'
        },
        recipients: {
            roles: ['employee', 'manager']
        },
        schedule: {
            enabled: true,
            frequency: 'immediate'
        },
        isActive: true
    }
];

/**
 * Initialize default notification rules
 */
export async function initializeDefaultNotificationRules(adminId: string): Promise<void> {
    try {
        const existingRules = await getAllNotificationRules();

        if (existingRules.length === 0) {
            for (const rule of DEFAULT_NOTIFICATION_RULES) {
                await createNotificationRule({
                    ...rule,
                    createdBy: adminId
                });
            }
        }
    } catch (error) {
        handleError(error, 'Failed to initialize default notification rules');
        throw error;
    }
}
