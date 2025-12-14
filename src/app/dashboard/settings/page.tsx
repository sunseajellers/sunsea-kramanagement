'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
    Bell, 
    Shield, 
    Palette, 
    Globe, 
    Moon, 
    Sun, 
    Monitor,
    ArrowLeft,
    Save
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import toast from 'react-hot-toast';
import Link from 'next/link';

interface NotificationSettings {
    emailNotifications: boolean;
    pushNotifications: boolean;
    taskUpdates: boolean;
    kraReminders: boolean;
    weeklyReports: boolean;
    teamUpdates: boolean;
}

interface AppSettings {
    theme: 'light' | 'dark' | 'system';
    language: string;
    timezone: string;
    dateFormat: string;
    weekStartsOn: number;
}

export default function SettingsPage() {
    const { loading } = useAuth();
    const [saving, setSaving] = useState(false);
    
    const [notifications, setNotifications] = useState<NotificationSettings>({
        emailNotifications: true,
        pushNotifications: true,
        taskUpdates: true,
        kraReminders: true,
        weeklyReports: false,
        teamUpdates: true
    });

    const [appSettings, setAppSettings] = useState<AppSettings>({
        theme: 'system',
        language: 'en',
        timezone: 'UTC',
        dateFormat: 'MM/DD/YYYY',
        weekStartsOn: 0
    });

    // Load settings from localStorage on component mount
    useEffect(() => {
        const savedNotifications = localStorage.getItem('notificationSettings');
        const savedAppSettings = localStorage.getItem('appSettings');
        
        if (savedNotifications) {
            setNotifications(JSON.parse(savedNotifications));
        }
        
        if (savedAppSettings) {
            setAppSettings(JSON.parse(savedAppSettings));
        }
    }, []);

    const handleSaveSettings = async () => {
        setSaving(true);
        try {
            // Save to localStorage (in a real app, you'd save to backend)
            localStorage.setItem('notificationSettings', JSON.stringify(notifications));
            localStorage.setItem('appSettings', JSON.stringify(appSettings));
            
            // Apply theme setting
            if (appSettings.theme === 'dark') {
                document.documentElement.classList.add('dark');
            } else if (appSettings.theme === 'light') {
                document.documentElement.classList.remove('dark');
            } else {
                // System theme
                if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                    document.documentElement.classList.add('dark');
                } else {
                    document.documentElement.classList.remove('dark');
                }
            }
            
            toast.success('Settings saved successfully!');
        } catch (error) {
            console.error('Error saving settings:', error);
            toast.error('Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link href="/dashboard" className="text-gray-500 hover:text-gray-700">
                        <ArrowLeft className="h-5 w-5" />
                    </Link>
                    <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
                </div>
                <Button onClick={handleSaveSettings} disabled={saving}>
                    {saving ? (
                        <div className="flex items-center gap-2">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            Saving...
                        </div>
                    ) : (
                        <>
                            <Save className="h-4 w-4 mr-2" />
                            Save Settings
                        </>
                    )}
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Notification Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Bell className="h-5 w-5" />
                            Notifications
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="font-medium text-gray-900">Email Notifications</h4>
                                    <p className="text-sm text-gray-500">Receive notifications via email</p>
                                </div>
                                <Switch
                                    checked={notifications.emailNotifications}
                                    onCheckedChange={(checked) => 
                                        setNotifications(prev => ({ ...prev, emailNotifications: checked }))
                                    }
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="font-medium text-gray-900">Push Notifications</h4>
                                    <p className="text-sm text-gray-500">Receive browser notifications</p>
                                </div>
                                <Switch
                                    checked={notifications.pushNotifications}
                                    onCheckedChange={(checked) => 
                                        setNotifications(prev => ({ ...prev, pushNotifications: checked }))
                                    }
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="font-medium text-gray-900">Task Updates</h4>
                                    <p className="text-sm text-gray-500">Get notified when tasks are updated</p>
                                </div>
                                <Switch
                                    checked={notifications.taskUpdates}
                                    onCheckedChange={(checked) => 
                                        setNotifications(prev => ({ ...prev, taskUpdates: checked }))
                                    }
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="font-medium text-gray-900">KRA Reminders</h4>
                                    <p className="text-sm text-gray-500">Reminders for KRA deadlines</p>
                                </div>
                                <Switch
                                    checked={notifications.kraReminders}
                                    onCheckedChange={(checked) => 
                                        setNotifications(prev => ({ ...prev, kraReminders: checked }))
                                    }
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="font-medium text-gray-900">Weekly Reports</h4>
                                    <p className="text-sm text-gray-500">Weekly performance summaries</p>
                                </div>
                                <Switch
                                    checked={notifications.weeklyReports}
                                    onCheckedChange={(checked) => 
                                        setNotifications(prev => ({ ...prev, weeklyReports: checked }))
                                    }
                                />
                            </div>

                            <div className="flex items-center justify-between">
                                <div>
                                    <h4 className="font-medium text-gray-900">Team Updates</h4>
                                    <p className="text-sm text-gray-500">Updates from your team members</p>
                                </div>
                                <Switch
                                    checked={notifications.teamUpdates}
                                    onCheckedChange={(checked) => 
                                        setNotifications(prev => ({ ...prev, teamUpdates: checked }))
                                    }
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Appearance Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Palette className="h-5 w-5" />
                            Appearance
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div>
                            <h4 className="font-medium text-gray-900 mb-3">Theme</h4>
                            <div className="space-y-2">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="theme"
                                        value="light"
                                        checked={appSettings.theme === 'light'}
                                        onChange={(e) => setAppSettings(prev => ({ ...prev, theme: e.target.value as any }))}
                                        className="w-4 h-4 text-primary-600"
                                    />
                                    <Sun className="h-4 w-4" />
                                    <span>Light</span>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="theme"
                                        value="dark"
                                        checked={appSettings.theme === 'dark'}
                                        onChange={(e) => setAppSettings(prev => ({ ...prev, theme: e.target.value as any }))}
                                        className="w-4 h-4 text-primary-600"
                                    />
                                    <Moon className="h-4 w-4" />
                                    <span>Dark</span>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="theme"
                                        value="system"
                                        checked={appSettings.theme === 'system'}
                                        onChange={(e) => setAppSettings(prev => ({ ...prev, theme: e.target.value as any }))}
                                        className="w-4 h-4 text-primary-600"
                                    />
                                    <Monitor className="h-4 w-4" />
                                    <span>System</span>
                                </label>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Localization Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Globe className="h-5 w-5" />
                            Localization
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Language
                            </label>
                            <select
                                value={appSettings.language}
                                onChange={(e) => setAppSettings(prev => ({ ...prev, language: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                            >
                                <option value="en">English</option>
                                <option value="es">Spanish</option>
                                <option value="fr">French</option>
                                <option value="de">German</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Timezone
                            </label>
                            <select
                                value={appSettings.timezone}
                                onChange={(e) => setAppSettings(prev => ({ ...prev, timezone: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                            >
                                <option value="UTC">UTC</option>
                                <option value="America/New_York">Eastern Time</option>
                                <option value="America/Chicago">Central Time</option>
                                <option value="America/Denver">Mountain Time</option>
                                <option value="America/Los_Angeles">Pacific Time</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Date Format
                            </label>
                            <select
                                value={appSettings.dateFormat}
                                onChange={(e) => setAppSettings(prev => ({ ...prev, dateFormat: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                            >
                                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                            </select>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Week Starts On
                            </label>
                            <select
                                value={appSettings.weekStartsOn}
                                onChange={(e) => setAppSettings(prev => ({ ...prev, weekStartsOn: parseInt(e.target.value) }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                            >
                                <option value={0}>Sunday</option>
                                <option value={1}>Monday</option>
                            </select>
                        </div>
                    </CardContent>
                </Card>

                {/* Privacy & Security */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5" />
                            Privacy & Security
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div>
                                <h4 className="font-medium text-gray-900">Activity Tracking</h4>
                                <p className="text-sm text-gray-500">Track your app usage for analytics</p>
                            </div>
                            <Switch defaultChecked />
                        </div>

                        <div className="flex items-center justify-between p-4 border rounded-lg">
                            <div>
                                <h4 className="font-medium text-gray-900">Data Export</h4>
                                <p className="text-sm text-gray-500">Download your data anytime</p>
                            </div>
                            <Button variant="outline" size="sm">
                                Export Data
                            </Button>
                        </div>

                        <div className="flex items-center justify-between p-4 border rounded-lg border-red-200 bg-red-50">
                            <div>
                                <h4 className="font-medium text-red-900">Delete Account</h4>
                                <p className="text-sm text-red-600">Permanently delete your account</p>
                            </div>
                            <Button variant="destructive" size="sm">
                                Delete Account
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}