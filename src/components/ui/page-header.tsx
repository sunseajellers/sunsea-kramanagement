// src/components/ui/page-header.tsx
'use client';

import { Fragment } from 'react';
import { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
    title: string;
    description?: string;
    icon?: LucideIcon;
    actions?: React.ReactNode;
    breadcrumbs?: { label: string; href?: string }[];
}

export function PageHeader({
    title,
    description,
    icon: Icon,
    actions,
    breadcrumbs
}: PageHeaderProps) {
    return (
        <div className="mb-8">
            {breadcrumbs && breadcrumbs.length > 0 && (
                <nav className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                    {breadcrumbs.map((crumb, index) => (
                        <Fragment key={index}>
                            {index > 0 && <span>/</span>}
                            {crumb.href ? (
                                <a href={crumb.href} className="hover:text-gray-900 transition-colors">
                                    {crumb.label}
                                </a>
                            ) : (
                                <span className="text-gray-900 font-medium">{crumb.label}</span>
                            )}
                        </Fragment>
                    ))}
                </nav>
            )}
            
            <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4 flex-1">
                    {Icon && (
                        <div className="rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 p-3 shadow-lg">
                            <Icon className="h-7 w-7 text-white" />
                        </div>
                    )}
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">{title}</h1>
                        {description && (
                            <p className="text-gray-600 max-w-3xl">{description}</p>
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
    );
}
