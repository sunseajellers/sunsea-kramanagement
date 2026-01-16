// src/components/ui/section-card.tsx
'use client';

import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SectionCardProps {
    title: string;
    description?: string;
    icon?: LucideIcon;
    children: React.ReactNode;
    actions?: React.ReactNode;
    className?: string;
    headerClassName?: string;
}

export function SectionCard({
    title,
    description,
    icon: Icon,
    children,
    actions,
    className,
    headerClassName
}: SectionCardProps) {
    return (
        <div className={cn(
            'rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden',
            className
        )}>
            <div className={cn(
                'border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white px-6 py-4',
                headerClassName
            )}>
                <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1">
                        {Icon && (
                            <div className="rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 p-2">
                                <Icon className="h-5 w-5 text-white" />
                            </div>
                        )}
                        <div className="flex-1">
                            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
                            {description && (
                                <p className="text-sm text-gray-600 mt-0.5">{description}</p>
                            )}
                        </div>
                    </div>
                    {actions && (
                        <div className="flex items-center gap-2">
                            {actions}
                        </div>
                    )}
                </div>
            </div>
            <div className="p-6">
                {children}
            </div>
        </div>
    );
}
