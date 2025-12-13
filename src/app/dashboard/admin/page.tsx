// src/app/dashboard/admin/page.tsx
'use client';

import Link from 'next/link';
import { Users, Settings, BarChart3, Award, FileText, TrendingUp, Bell } from 'lucide-react';

export default function AdminHome() {
    const adminCards = [
        {
            href: '/dashboard/admin/users',
            icon: Users,
            title: 'User Management',
            description: 'Manage users, roles, and permissions',
            color: 'from-blue-500 to-blue-600'
        },
        {
            href: '/dashboard/admin/teams',
            icon: Settings,
            title: 'Team Management',
            description: 'Create and manage teams',
            color: 'from-purple-500 to-purple-600'
        },
        {
            href: '/dashboard/admin/scoring',
            icon: Award,
            title: 'Scoring Configuration',
            description: 'Configure performance scoring weights',
            color: 'from-green-500 to-green-600'
        },
        {
            href: '/dashboard/admin/analytics',
            icon: BarChart3,
            title: 'Analytics',
            description: 'View system-wide analytics',
            color: 'from-orange-500 to-orange-600'
        },
        {
            href: '/dashboard/admin/notifications',
            icon: Bell,
            title: 'Notifications',
            description: 'Manage notification rules and templates',
            color: 'from-red-500 to-red-600'
        },
        {
            href: '/dashboard/admin/reports',
            icon: FileText,
            title: 'Weekly Reports',
            description: 'View and manage team reports',
            color: 'from-pink-500 to-pink-600'
        },
        {
            href: '/dashboard/reports',
            icon: TrendingUp,
            title: 'Performance Metrics',
            description: 'Track overall performance trends',
            color: 'from-indigo-500 to-indigo-600'
        }
    ];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Panel</h1>
                <p className="text-gray-600">Manage your organization's KRA system</p>
            </div>

            {/* Admin Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {adminCards.map((card) => {
                    const Icon = card.icon;
                    return (
                        <Link
                            key={card.href}
                            href={card.href}
                            className="group relative overflow-hidden bg-white rounded-2xl shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
                        >
                            <div className={`absolute inset-0 bg-gradient-to-br ${card.color} opacity-0 group-hover:opacity-5 transition-opacity`} />
                            <div className="p-6">
                                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                                    <Icon className="w-6 h-6 text-white" />
                                </div>
                                <h3 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
                                    {card.title}
                                </h3>
                                <p className="text-sm text-gray-600">
                                    {card.description}
                                </p>
                            </div>
                        </Link>
                    );
                })}
            </div>

            {/* Quick Stats */}
            <div className="bg-gradient-to-br from-primary-50 to-secondary-50 p-6 rounded-2xl border border-primary-200">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Quick Overview</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white p-4 rounded-xl">
                        <p className="text-xs text-gray-600 mb-1">Total Users</p>
                        <p className="text-2xl font-bold text-primary-600">-</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl">
                        <p className="text-xs text-gray-600 mb-1">Active Teams</p>
                        <p className="text-2xl font-bold text-blue-600">-</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl">
                        <p className="text-xs text-gray-600 mb-1">Active KRAs</p>
                        <p className="text-2xl font-bold text-green-600">-</p>
                    </div>
                    <div className="bg-white p-4 rounded-xl">
                        <p className="text-xs text-gray-600 mb-1">Pending Tasks</p>
                        <p className="text-2xl font-bold text-orange-600">-</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
