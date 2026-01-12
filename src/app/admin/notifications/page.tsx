// src/app/admin/notifications/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, TestTube, Settings, Bell, Settings2, ShieldCheck, Loader2, X } from 'lucide-react';
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
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
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
    { value: 'low', label: 'Low', color: 'bg-blue-50 text-blue-600 border-blue-100' },
    { value: 'medium', label: 'Medium', color: 'bg-yellow-50 text-yellow-600 border-yellow-100' },
    { value: 'high', label: 'High', color: 'bg-orange-50 text-orange-600 border-orange-100' },
    { value: 'critical', label: 'Critical', color: 'bg-red-50 text-red-600 border-red-100' }
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
            toast.success('Rule created');
            setIsCreateDialogOpen(false);
            setFormData({});
            loadData();
        } catch (error) {
            toast.error('Failed to create');
        }
    };

    const handleUpdateRule = async () => {
        if (!selectedRule) return;

        try {
            await updateNotificationRule(selectedRule.id, formData);
            toast.success('Rule updated');
            setIsEditDialogOpen(false);
            setSelectedRule(null);
            setFormData({});
            loadData();
        } catch (error) {
            toast.error('Failed to update');
        }
    };

    const handleDeleteRule = async (ruleId: string) => {
        if (!confirm('Are you sure you want to delete this notification rule?')) return;

        try {
            await deleteNotificationRule(ruleId);
            toast.success('Rule deleted');
            loadData();
        } catch (error) {
            toast.error('Failed to delete');
        }
    };

    const handleTestRule = async (ruleId: string) => {
        try {
            await testNotificationRule(ruleId, user?.uid || '');
            toast.success('Test notification sent');
        } catch (error) {
            toast.error('Test failed');
        }
    };

    const initializeDefaults = async () => {
        if (!user?.uid) return;
        if (!confirm('Initialize default notification rules?')) return;

        try {
            await initializeDefaultNotificationRules(user.uid);
            toast.success('Defaults initialized');
            loadData();
        } catch (error) {
            toast.error('Failed to initialize');
        }
    };

    const openEditDialog = (rule: NotificationRule) => {
        setSelectedRule(rule);
        setFormData(rule);
        setIsEditDialogOpen(true);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-12 h-12 animate-spin text-blue-600 mb-4" />
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Loading Notifications...</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header - Simplified */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 flex items-center gap-3">
                        <Bell className="h-7 w-7 text-blue-600" />
                        System Notifications
                    </h1>
                    <p className="text-sm text-gray-400 font-medium mt-1">Configure automated broadcast rules and templates</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={initializeDefaults}
                        className="h-10 border-gray-100 text-[10px] font-black uppercase tracking-widest rounded-xl"
                    >
                        <Settings2 className="w-4 h-4 mr-2" />
                        Init Defaults
                    </Button>
                    <Button
                        onClick={() => setIsCreateDialogOpen(true)}
                        className="h-10 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase tracking-widest rounded-xl transition-all shadow-sm"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Create Rule
                    </Button>
                </div>
            </div>

            {/* Tabs - Simplified */}
            <div className="flex gap-1 bg-gray-100/50 p-1 rounded-xl w-fit">
                {[
                    { id: 'rules', label: 'Broadcast Rules', icon: Bell },
                    { id: 'analytics', label: 'System Analytics', icon: Settings }
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id
                            ? 'bg-white text-blue-600 shadow-sm'
                            : 'text-gray-400 hover:text-gray-600'
                            }`}
                    >
                        <tab.icon className="w-3.5 h-3.5" />
                        {tab.label}
                    </button>
                ))}
            </div>

            {activeTab === 'rules' && (
                <div className="grid grid-cols-1 gap-4">
                    {rules.map((rule) => (
                        <Card key={rule.id} className="border-none shadow-sm bg-white hover:shadow-md transition-all group overflow-hidden">
                            <CardContent className="p-0">
                                <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-gray-50">
                                    <div className="p-6 flex-1">
                                        <div className="flex items-start justify-between mb-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                                    <Bell className="w-5 h-5" />
                                                </div>
                                                <div>
                                                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">{rule.name}</h3>
                                                    <p className="text-xs text-gray-400 font-medium">{rule.description}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${rule.isActive ? 'bg-green-50 text-green-600 border-green-100' : 'bg-gray-50 text-gray-400 border-gray-100'
                                                    }`}>
                                                    {rule.isActive ? 'Active' : 'Paused'}
                                                </span>
                                                <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border ${PRIORITIES.find(p => p.value === rule.template.priority)?.color}`}>
                                                    {rule.template.priority}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 pt-4 border-t border-gray-50">
                                            <div>
                                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Trigger Event</p>
                                                <p className="text-xs font-bold text-gray-700 capitalize">
                                                    {NOTIFICATION_TYPES.find(t => t.value === rule.type)?.label.replace('Task ', '')}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Recipients</p>
                                                <div className="flex flex-wrap gap-1">
                                                    {rule.recipients.roles.map(role => (
                                                        <span key={role} className="text-[9px] font-black text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded uppercase">{role}</span>
                                                    ))}
                                                </div>
                                            </div>
                                            <div>
                                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Schedule</p>
                                                <p className="text-xs font-bold text-gray-700 capitalize">
                                                    {rule.schedule.enabled ? rule.schedule.frequency : 'Real-time'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-gray-50/30 flex flex-row md:flex-col justify-center gap-2 min-w-[120px]">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => openEditDialog(rule)}
                                            className="h-8 w-full md:w-full border-gray-100 text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-white"
                                        >
                                            <Edit className="w-3 h-3 mr-2" />
                                            Edit
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleTestRule(rule.id)}
                                            className="h-8 w-full md:w-full border-gray-100 text-blue-600 text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-blue-50"
                                        >
                                            <TestTube className="w-3 h-3 mr-2" />
                                            Test
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleDeleteRule(rule.id)}
                                            className="h-8 w-full md:w-full border-gray-100 text-red-600 text-[10px] font-black uppercase tracking-widest rounded-lg hover:bg-red-50"
                                        >
                                            <Trash2 className="w-3 h-3 mr-2" />
                                            Delete
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}

                    {rules.length === 0 && (
                        <Card className="border-none shadow-sm bg-white p-20 text-center">
                            <div className="w-20 h-20 bg-gray-50 rounded-3xl flex items-center justify-center mx-auto mb-6">
                                <Bell className="w-10 h-10 text-gray-300" />
                            </div>
                            <h3 className="text-xl font-black text-gray-900 uppercase tracking-widest mb-2">No Active Rules</h3>
                            <p className="text-sm text-gray-400 font-medium mb-8 max-w-md mx-auto">
                                Automated system notifications aren't configured yet. Initialize defaults or create your first rule.
                            </p>
                            <Button
                                onClick={() => setIsCreateDialogOpen(true)}
                                className="h-12 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase tracking-widest px-8 rounded-2xl shadow-lg shadow-blue-100 transition-all"
                            >
                                <Plus className="w-5 h-5 mr-3" />
                                Configure First Rule
                            </Button>
                        </Card>
                    )}
                </div>
            )}

            {activeTab === 'analytics' && analytics && (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Total Rules', value: analytics.totalRules, icon: Settings, color: 'text-blue-600', bg: 'bg-blue-50' },
                        { label: 'Active Engine', value: analytics.activeRules, icon: Bell, color: 'text-green-600', bg: 'bg-green-50' },
                        { label: 'New (30d)', value: analytics.recentActivity.rulesCreated, icon: Plus, color: 'text-orange-600', bg: 'bg-orange-50' },
                        { label: 'Updates (30d)', value: analytics.recentActivity.rulesUpdated, icon: Edit, color: 'text-indigo-600', bg: 'bg-indigo-50' }
                    ].map((stat) => (
                        <Card key={stat.label} className="border-none shadow-sm bg-white">
                            <CardContent className="p-6">
                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${stat.bg} ${stat.color}`}>
                                        <stat.icon className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{stat.label}</p>
                                        <p className="text-2xl font-black text-gray-900">{stat.value}</p>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}

            {/* Create/Edit Dialog - Modern Overlay */}
            {(isCreateDialogOpen || isEditDialogOpen) && (
                <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
                    <Card className="max-w-2xl w-full max-h-[90vh] overflow-hidden border-none shadow-2xl rounded-3xl animate-in zoom-in-95 duration-300">
                        <CardHeader className="border-b bg-gray-50/30 px-8 py-6 flex flex-row items-center justify-between space-y-0">
                            <div>
                                <CardTitle className="text-sm font-black text-gray-900 uppercase tracking-widest">
                                    {isCreateDialogOpen ? 'New Broadcast Rule' : 'Update Rule Settings'}
                                </CardTitle>
                                <p className="text-xs text-gray-400 font-medium mt-1">Configure behavioral triggers and templates</p>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setIsCreateDialogOpen(false);
                                    setIsEditDialogOpen(false);
                                    setFormData({});
                                    setSelectedRule(null);
                                }}
                                className="h-8 w-8 p-0 rounded-full hover:bg-gray-100"
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </CardHeader>
                        <CardContent className="p-8 overflow-y-auto">
                            <NotificationRuleForm
                                formData={formData}
                                setFormData={setFormData}
                                onSubmit={isCreateDialogOpen ? handleCreateRule : handleUpdateRule}
                                submitLabel={isCreateDialogOpen ? 'Create Broadcast Rule' : 'Update Broadcast Rule'}
                            />
                        </CardContent>
                    </Card>
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
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Rule Name *</Label>
                    <Input
                        type="text"
                        value={formData.name || ''}
                        onChange={(e) => updateFormData('name', e.target.value)}
                        className="h-10 px-4 bg-gray-50 border-none rounded-xl text-sm font-bold text-gray-900 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                        placeholder="e.g. Critical Task Alert"
                    />
                </div>
                <div className="space-y-2">
                    <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Event Type</Label>
                    <select
                        value={formData.type || ''}
                        onChange={(e) => updateFormData('type', e.target.value)}
                        className="w-full h-10 px-3 py-2 bg-gray-50 border-none rounded-xl text-sm font-bold text-gray-900 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                    >
                        <option value="">Select Trigger</option>
                        {NOTIFICATION_TYPES.map((type) => (
                            <option key={type.value} value={type.value}>
                                {type.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="space-y-2">
                <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Context / Description</Label>
                <Textarea
                    value={formData.description || ''}
                    onChange={(e) => updateFormData('description', e.target.value)}
                    className="bg-gray-50 border-none rounded-xl text-sm font-medium text-gray-900 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                    placeholder="Briefly describe when this notification fires"
                    rows={2}
                />
            </div>

            <div className="space-y-6 pt-4 border-t border-gray-50">
                <div className="flex items-center gap-2 mb-2">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Notification Template</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Heading Template</Label>
                        <Input
                            type="text"
                            value={formData.template?.title || ''}
                            onChange={(e) => updateNestedField(['template', 'title'], e.target.value)}
                            className="h-10 px-4 bg-gray-50 border-none rounded-xl text-sm font-bold text-gray-900 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                            placeholder="System Alert: {{task_name}}"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Urgency</Label>
                        <select
                            value={formData.template?.priority || ''}
                            onChange={(e) => updateNestedField(['template', 'priority'], e.target.value)}
                            className="w-full h-10 px-3 py-2 bg-gray-50 border-none rounded-xl text-sm font-bold text-gray-900 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                        >
                            <option value="">Set Priority</option>
                            {PRIORITIES.map((priority) => (
                                <option key={priority.value} value={priority.value}>
                                    {priority.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="space-y-2">
                    <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Content Body Template</Label>
                    <Textarea
                        value={formData.template?.message || ''}
                        onChange={(e) => updateNestedField(['template', 'message'], e.target.value)}
                        className="bg-gray-50 border-none rounded-xl text-sm font-medium text-gray-900 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                        placeholder="Define the message content (Markdown supported)"
                        rows={3}
                    />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-gray-50">
                <div className="space-y-4">
                    <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Target Roles</Label>
                    <div className="flex gap-4 p-4 bg-gray-50 rounded-2xl">
                        {['admin', 'manager', 'employee'].map((role) => (
                            <label key={role} className="flex items-center gap-2 cursor-pointer group">
                                <Checkbox
                                    checked={formData.recipients?.roles?.includes(role) || false}
                                    onCheckedChange={(checked) => {
                                        const roles = formData.recipients?.roles || [];
                                        if (checked) {
                                            updateNestedField(['recipients', 'roles'], [...roles, role]);
                                        } else {
                                            updateNestedField(['recipients', 'roles'], roles.filter(r => r !== role));
                                        }
                                    }}
                                    className="border-gray-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                                />
                                <span className="text-[10px] font-black text-gray-600 uppercase tracking-widest group-hover:text-blue-600 transition-colors">{role}</span>
                            </label>
                        ))}
                    </div>
                </div>

                <div className="space-y-4">
                    <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Scheduling Strategy</Label>
                    <div className="flex items-center gap-2 p-4 bg-gray-50 rounded-2xl">
                        <Checkbox
                            id="schedule-enable"
                            checked={formData.schedule?.enabled || false}
                            onCheckedChange={(checked) => updateNestedField(['schedule', 'enabled'], checked)}
                            className="border-gray-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                        />
                        <Label htmlFor="schedule-enable" className="text-[10px] font-black text-gray-600 uppercase tracking-widest cursor-pointer">Queue for Batch Sending</Label>
                    </div>
                </div>
            </div>

            {formData.schedule?.enabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-blue-50/50 rounded-3xl animate-in slide-in-from-top duration-300">
                    <div className="space-y-2">
                        <Label className="text-[10px] font-black text-blue-600 uppercase tracking-widest ml-1">Frequency</Label>
                        <select
                            value={formData.schedule?.frequency || ''}
                            onChange={(e) => updateNestedField(['schedule', 'frequency'], e.target.value)}
                            className="w-full h-10 px-3 py-2 bg-white border-none rounded-xl text-sm font-bold text-gray-900 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
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
                        <div className="space-y-2">
                            <Label className="text-[10px] font-black text-blue-600 uppercase tracking-widest ml-1">Delivery Time</Label>
                            <Input
                                type="time"
                                value={formData.schedule?.time || ''}
                                onChange={(e) => updateNestedField(['schedule', 'time'], e.target.value)}
                                className="h-10 px-4 bg-white border-none rounded-xl text-sm font-bold text-gray-900 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                            />
                        </div>
                    )}
                </div>
            )}

            <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl px-4">
                    <Checkbox
                        id="rule-active"
                        checked={formData.isActive || false}
                        onCheckedChange={(checked) => updateFormData('isActive', checked)}
                        className="border-gray-300 data-[state=checked]:bg-green-600 data-[state=checked]:border-green-600"
                    />
                    <Label htmlFor="rule-active" className="text-[10px] font-black text-gray-900 uppercase tracking-widest cursor-pointer">Rule Status: {formData.isActive ? 'Enabled' : 'Disabled'}</Label>
                </div>
                <Button
                    onClick={onSubmit}
                    className="h-12 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase tracking-widest px-10 rounded-2xl shadow-lg shadow-blue-100 transition-all"
                >
                    {submitLabel}
                </Button>
            </div>
        </div>
    );
}