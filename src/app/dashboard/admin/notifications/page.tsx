// src/app/dashboard/admin/notifications/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, TestTube, Settings, Bell } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
    getAllNotificationRules,
    createNotificationRule,
    updateNotificationRule,
    deleteNotificationRule,
    testNotificationRule,
    getNotificationAnalytics,
    NotificationRule,
    NotificationType,
    NotificationPriority,
    initializeDefaultNotificationRules
} from '@/lib/notificationService';
import toast from 'react-hot-toast';

const NOTIFICATION_TYPES: { value: NotificationType; label: string }[] = [
    { value: 'task_assigned', label: 'Task Assigned' },
    { value: 'task_updated', label: 'Task Updated' },
    { value: 'task_overdue', label: 'Task Overdue' },
    { value: 'kra_assigned', label: 'KRA Assigned' },
    { value: 'kra_updated', label: 'KRA Updated' },
    { value: 'kra_deadline', label: 'KRA Deadline' },
    { value: 'team_update', label: 'Team Update' },
    { value: 'system_alert', label: 'System Alert' },
    { value: 'performance_alert', label: 'Performance Alert' },
    { value: 'report_ready', label: 'Report Ready' }
];

const PRIORITIES: { value: NotificationPriority; label: string; color: string }[] = [
    { value: 'low', label: 'Low', color: 'bg-blue-100 text-blue-800' },
    { value: 'medium', label: 'Medium', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'high', label: 'High', color: 'bg-orange-100 text-orange-800' },
    { value: 'critical', label: 'Critical', color: 'bg-red-100 text-red-800' }
];

const FREQUENCIES = [
    { value: 'immediate', label: 'Immediate' },
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' }
];

export default function AdminNotificationsPage() {
    const { user } = useAuth();
    const [rules, setRules] = useState<NotificationRule[]>([]);
    const [analytics, setAnalytics] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [selectedRule, setSelectedRule] = useState<NotificationRule | null>(null);
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'rules' | 'analytics'>('rules');
    const [formData, setFormData] = useState<Partial<NotificationRule>>({});

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [rulesData, analyticsData] = await Promise.all([
                getAllNotificationRules(),
                getNotificationAnalytics()
            ]);
            setRules(rulesData);
            setAnalytics(analyticsData);
        } catch (error) {
            toast.error('Failed to load notification data');
        } finally {
            setLoading(false);
        }
    };

    const handleCreateRule = async () => {
        if (!user?.uid) return;

        try {
            await createNotificationRule({
                ...formData,
                createdBy: user.uid
            } as Omit<NotificationRule, 'id' | 'createdAt' | 'updatedAt'>);
            toast.success('Notification rule created successfully');
            setIsCreateDialogOpen(false);
            setFormData({});
            loadData();
        } catch (error) {
            toast.error('Failed to create notification rule');
        }
    };

    const handleUpdateRule = async () => {
        if (!selectedRule) return;

        try {
            await updateNotificationRule(selectedRule.id, formData);
            toast.success('Notification rule updated successfully');
            setIsEditDialogOpen(false);
            setSelectedRule(null);
            setFormData({});
            loadData();
        } catch (error) {
            toast.error('Failed to update notification rule');
        }
    };

    const handleDeleteRule = async (ruleId: string) => {
        if (!confirm('Are you sure you want to delete this notification rule?')) return;

        try {
            await deleteNotificationRule(ruleId);
            toast.success('Notification rule deleted successfully');
            loadData();
        } catch (error) {
            toast.error('Failed to delete notification rule');
        }
    };

    const handleTestRule = async (ruleId: string) => {
        try {
            await testNotificationRule(ruleId, user?.uid || '');
            toast.success('Notification rule tested successfully');
        } catch (error) {
            toast.error('Failed to test notification rule');
        }
    };

    const initializeDefaults = async () => {
        if (!user?.uid) return;

        try {
            await initializeDefaultNotificationRules(user.uid);
            toast.success('Default notification rules initialized');
            loadData();
        } catch (error) {
            toast.error('Failed to initialize default rules');
        }
    };

    const openEditDialog = (rule: NotificationRule) => {
        setSelectedRule(rule);
        setFormData(rule);
        setIsEditDialogOpen(true);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Notification Management</h1>
                    <p className="text-muted-foreground">Configure notification rules and templates for the system</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={initializeDefaults}
                        className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
                    >
                        <Settings className="w-4 h-4" />
                        Initialize Defaults
                    </button>
                    <button
                        onClick={() => setIsCreateDialogOpen(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        Create Rule
                    </button>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setActiveTab('rules')}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                            activeTab === 'rules'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        Rules
                    </button>
                    <button
                        onClick={() => setActiveTab('analytics')}
                        className={`py-2 px-1 border-b-2 font-medium text-sm ${
                            activeTab === 'analytics'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                        }`}
                    >
                        Analytics
                    </button>
                </nav>
            </div>

            {activeTab === 'rules' && (
                <div className="space-y-4">
                    {rules.map((rule) => (
                        <div key={rule.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <Bell className="w-5 h-5 text-gray-400" />
                                    <div>
                                        <h3 className="text-lg font-medium text-gray-900">{rule.name}</h3>
                                        <p className="text-sm text-gray-600">{rule.description}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${rule.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                        {rule.isActive ? 'Active' : 'Inactive'}
                                    </span>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${PRIORITIES.find(p => p.value === rule.template.priority)?.color}`}>
                                        {rule.template.priority}
                                    </span>
                                </div>
                            </div>
                            <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Type</p>
                                    <p className="text-sm text-gray-900">
                                        {NOTIFICATION_TYPES.find(t => t.value === rule.type)?.label}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Recipients</p>
                                    <p className="text-sm text-gray-900">
                                        {rule.recipients.roles.join(', ')}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-500">Schedule</p>
                                    <p className="text-sm text-gray-900">
                                        {rule.schedule.enabled ? rule.schedule.frequency : 'Disabled'}
                                    </p>
                                </div>
                            </div>
                            <div className="mt-4 flex gap-2">
                                <button
                                    onClick={() => openEditDialog(rule)}
                                    className="px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors flex items-center gap-1"
                                >
                                    <Edit className="w-4 h-4" />
                                    Edit
                                </button>
                                <button
                                    onClick={() => handleTestRule(rule.id)}
                                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors flex items-center gap-1"
                                >
                                    <TestTube className="w-4 h-4" />
                                    Test
                                </button>
                                <button
                                    onClick={() => handleDeleteRule(rule.id)}
                                    className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors flex items-center gap-1"
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Delete
                                </button>
                            </div>
                        </div>
                    ))}

                    {rules.length === 0 && (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-12 text-center">
                            <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No notification rules</h3>
                            <p className="text-gray-600 mb-4">
                                Create your first notification rule to start sending automated notifications.
                            </p>
                            <button
                                onClick={() => setIsCreateDialogOpen(true)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
                            >
                                <Plus className="w-4 h-4" />
                                Create Rule
                            </button>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'analytics' && analytics && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center">
                            <Settings className="w-8 h-8 text-gray-400" />
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Total Rules</p>
                                <p className="text-2xl font-bold text-gray-900">{analytics.totalRules}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center">
                            <Bell className="w-8 h-8 text-gray-400" />
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Active Rules</p>
                                <p className="text-2xl font-bold text-gray-900">{analytics.activeRules}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center">
                            <Plus className="w-8 h-8 text-gray-400" />
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Rules Created (30d)</p>
                                <p className="text-2xl font-bold text-gray-900">{analytics.recentActivity.rulesCreated}</p>
                            </div>
                        </div>
                    </div>
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                        <div className="flex items-center">
                            <Edit className="w-8 h-8 text-gray-400" />
                            <div className="ml-4">
                                <p className="text-sm font-medium text-gray-500">Rules Updated (30d)</p>
                                <p className="text-2xl font-bold text-gray-900">{analytics.recentActivity.rulesUpdated}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Create/Edit Dialog */}
            {(isCreateDialogOpen || isEditDialogOpen) && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
                        <div className="p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">
                                {isCreateDialogOpen ? 'Create Notification Rule' : 'Edit Notification Rule'}
                            </h2>
                            <NotificationRuleForm
                                formData={formData}
                                setFormData={setFormData}
                                onSubmit={isCreateDialogOpen ? handleCreateRule : handleUpdateRule}
                                submitLabel={isCreateDialogOpen ? 'Create Rule' : 'Update Rule'}
                            />
                            <div className="flex justify-end gap-2 mt-6">
                                <button
                                    onClick={() => {
                                        setIsCreateDialogOpen(false);
                                        setIsEditDialogOpen(false);
                                        setFormData({});
                                        setSelectedRule(null);
                                    }}
                                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

interface NotificationRuleFormProps {
    formData: Partial<NotificationRule>;
    setFormData: (data: Partial<NotificationRule>) => void;
    onSubmit: () => void;
    submitLabel: string;
}

function NotificationRuleForm({ formData, setFormData, onSubmit, submitLabel }: NotificationRuleFormProps) {
    const updateFormData = (field: string, value: any) => {
        setFormData({ ...formData, [field]: value });
    };

    const updateNestedField = (path: string[], value: any) => {
        const updated = { ...formData } as any;
        let current: any = updated;
        for (let i = 0; i < path.length - 1; i++) {
            if (!current[path[i]]) current[path[i]] = {};
            current = current[path[i]];
        }
        current[path[path.length - 1]] = value;
        setFormData(updated);
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Rule Name</label>
                    <input
                        type="text"
                        value={formData.name || ''}
                        onChange={(e) => updateFormData('name', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter rule name"
                    />
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Notification Type</label>
                    <select
                        value={formData.type || ''}
                        onChange={(e) => updateFormData('type', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">Select type</option>
                        {NOTIFICATION_TYPES.map((type) => (
                            <option key={type.value} value={type.value}>
                                {type.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                    value={formData.description || ''}
                    onChange={(e) => updateFormData('description', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Describe what this rule does"
                    rows={3}
                />
            </div>

            <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Template</h4>
                <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Title Template</label>
                        <input
                            type="text"
                            value={formData.template?.title || ''}
                            onChange={(e) => updateNestedField(['template', 'title'], e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Notification title"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                        <select
                            value={formData.template?.priority || ''}
                            onChange={(e) => updateNestedField(['template', 'priority'], e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Select priority</option>
                            {PRIORITIES.map((priority) => (
                                <option key={priority.value} value={priority.value}>
                                    {priority.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Message Template</label>
                    <textarea
                        value={formData.template?.message || ''}
                        onChange={(e) => updateNestedField(['template', 'message'], e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Notification message"
                        rows={3}
                    />
                </div>
            </div>

            <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Recipients</h4>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Roles</label>
                    <div className="flex gap-4">
                        {['admin', 'manager', 'employee'].map((role) => (
                            <label key={role} className="flex items-center">
                                <input
                                    type="checkbox"
                                    checked={formData.recipients?.roles?.includes(role) || false}
                                    onChange={(e) => {
                                        const roles = formData.recipients?.roles || [];
                                        if (e.target.checked) {
                                            updateNestedField(['recipients', 'roles'], [...roles, role]);
                                        } else {
                                            updateNestedField(['recipients', 'roles'], roles.filter(r => r !== role));
                                        }
                                    }}
                                    className="mr-2"
                                />
                                <span className="capitalize text-sm">{role}</span>
                            </label>
                        ))}
                    </div>
                </div>
            </div>

            <div>
                <h4 className="text-sm font-medium text-gray-900 mb-3">Schedule</h4>
                <div className="flex items-center mb-4">
                    <input
                        type="checkbox"
                        checked={formData.schedule?.enabled || false}
                        onChange={(e) => updateNestedField(['schedule', 'enabled'], e.target.checked)}
                        className="mr-2"
                    />
                    <label className="text-sm font-medium text-gray-700">Enable scheduled notifications</label>
                </div>
                {formData.schedule?.enabled && (
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Frequency</label>
                            <select
                                value={formData.schedule?.frequency || ''}
                                onChange={(e) => updateNestedField(['schedule', 'frequency'], e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Select frequency</option>
                                {FREQUENCIES.map((freq) => (
                                    <option key={freq.value} value={freq.value}>
                                        {freq.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        {(formData.schedule?.frequency === 'daily' || formData.schedule?.frequency === 'weekly') && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                                <input
                                    type="time"
                                    value={formData.schedule?.time || ''}
                                    onChange={(e) => updateNestedField(['schedule', 'time'], e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        )}
                    </div>
                )}
            </div>

            <div className="flex items-center">
                <input
                    type="checkbox"
                    checked={formData.isActive || false}
                    onChange={(e) => updateFormData('isActive', e.target.checked)}
                    className="mr-2"
                />
                <label className="text-sm font-medium text-gray-700">Rule is active</label>
            </div>

            <div className="flex justify-end">
                <button
                    onClick={onSubmit}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    {submitLabel}
                </button>
            </div>
        </div>
    );
}