// src/components/ui/stat-card.tsx
'use client';

import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    trend?: {
        value: number;
        isPositive: boolean;
    };
    subtitle?: string;
    color?: 'blue' | 'green' | 'purple' | 'orange' | 'red' | 'pink' | 'cyan' | 'amber';
    onClick?: () => void;
}

const colorClasses = {
    blue: {
        bg: 'from-blue-500 to-blue-600',
        light: 'bg-blue-50',
        text: 'text-blue-600',
        icon: 'text-blue-500'
    },
    green: {
        bg: 'from-green-500 to-green-600',
        light: 'bg-green-50',
        text: 'text-green-600',
        icon: 'text-green-500'
    },
    purple: {
        bg: 'from-purple-500 to-purple-600',
        light: 'bg-purple-50',
        text: 'text-purple-600',
        icon: 'text-purple-500'
    },
    orange: {
        bg: 'from-orange-500 to-orange-600',
        light: 'bg-orange-50',
        text: 'text-orange-600',
        icon: 'text-orange-500'
    },
    red: {
        bg: 'from-red-500 to-red-600',
        light: 'bg-red-50',
        text: 'text-red-600',
        icon: 'text-red-500'
    },
    pink: {
        bg: 'from-pink-500 to-pink-600',
        light: 'bg-pink-50',
        text: 'text-pink-600',
        icon: 'text-pink-500'
    },
    cyan: {
        bg: 'from-cyan-500 to-cyan-600',
        light: 'bg-cyan-50',
        text: 'text-cyan-600',
        icon: 'text-cyan-500'
    },
    amber: {
        bg: 'from-amber-500 to-amber-600',
        light: 'bg-amber-50',
        text: 'text-amber-600',
        icon: 'text-amber-500'
    }
};

export function StatCard({
    title,
    value,
    icon: Icon,
    trend,
    subtitle,
    color = 'blue',
    onClick
}: StatCardProps) {
    const colors = colorClasses[color];

    return (
        <div
            onClick={onClick}
            className={cn(
                'relative overflow-hidden rounded-xl border border-gray-200 bg-white p-6 shadow-sm transition-all duration-200',
                onClick && 'cursor-pointer hover:shadow-lg hover:scale-[1.02] hover:border-gray-300'
            )}
        >
            {/* Background Gradient */}
            <div className={cn(
                'absolute -right-4 -top-4 h-24 w-24 rounded-full bg-gradient-to-br opacity-10',
                colors.bg
            )} />

            {/* Icon */}
            <div className={cn('mb-4 inline-flex rounded-lg p-3', colors.light)}>
                <Icon className={cn('h-6 w-6', colors.icon)} />
            </div>

            {/* Content */}
            <div className="relative">
                <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
                <div className="flex items-baseline gap-2">
                    <h3 className={cn('text-3xl font-bold', colors.text)}>{value}</h3>
                    {trend && (
                        <span className={cn(
                            'text-xs font-semibold px-2 py-1 rounded-full',
                            trend.isPositive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        )}>
                            {trend.isPositive ? '+' : ''}{trend.value}%
                        </span>
                    )}
                </div>
                {subtitle && (
                    <p className="text-xs text-gray-500 mt-2">{subtitle}</p>
                )}
            </div>
        </div>
    );
}
