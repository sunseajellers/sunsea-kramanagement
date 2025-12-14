import Link from 'next/link';
import { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    actionLabel?: string;
    actionHref?: string;
    onAction?: () => void;
    secondaryActionLabel?: string;
    onSecondaryAction?: () => void;
}

export default function EmptyState({
    icon: Icon,
    title,
    description,
    actionLabel,
    actionHref,
    onAction,
    secondaryActionLabel,
    onSecondaryAction,
}: EmptyStateProps) {
    return (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            {/* Icon */}
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                <Icon className="w-10 h-10 text-gray-400" />
            </div>

            {/* Title */}
            <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>

            {/* Description */}
            <p className="text-gray-600 mb-8 max-w-md">{description}</p>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3">
                {actionLabel && (
                    <>
                        {actionHref ? (
                            <Link href={actionHref} className="btn-primary inline-flex items-center">
                                {actionLabel}
                            </Link>
                        ) : (
                            <button onClick={onAction} className="btn-primary">
                                {actionLabel}
                            </button>
                        )}
                    </>
                )}

                {secondaryActionLabel && onSecondaryAction && (
                    <button onClick={onSecondaryAction} className="btn-secondary">
                        {secondaryActionLabel}
                    </button>
                )}
            </div>
        </div>
    );
}

// Specific empty state components for common scenarios

export function NoTasksEmptyState({ onCreate }: { onCreate?: () => void }) {
    return (
        <EmptyState
            icon={require('lucide-react').CheckCircle2}
            title="No tasks yet"
            description="Create your first task to get started with tracking your work and achieving your goals."
            actionLabel="Create Task"
            onAction={onCreate}
        />
    );
}

export function NoKRAsEmptyState({ onCreate }: { onCreate?: () => void }) {
    return (
        <EmptyState
            icon={require('lucide-react').Target}
            title="No KRAs defined"
            description="Set your first Key Result Area to align your team's efforts with strategic objectives."
            actionLabel="Create KRA"
            onAction={onCreate}
        />
    );
}

export function NoSearchResultsEmptyState({ onClear }: { onClear?: () => void }) {
    return (
        <EmptyState
            icon={require('lucide-react').Search}
            title="No results found"
            description="We couldn't find anything matching your search. Try adjusting your filters or search terms."
            actionLabel="Clear Search"
            onAction={onClear}
        />
    );
}

export function NoNotificationsEmptyState() {
    return (
        <EmptyState
            icon={require('lucide-react').Bell}
            title="All caught up!"
            description="You don't have any notifications right now. We'll notify you when something important happens."
        />
    );
}

export function NoReportsEmptyState({ onGenerate }: { onGenerate?: () => void }) {
    return (
        <EmptyState
            icon={require('lucide-react').BarChart3}
            title="No reports generated"
            description="Generate your first weekly report to track performance and identify areas for improvement."
            actionLabel="Generate Report"
            onAction={onGenerate}
        />
    );
}

export function ErrorEmptyState({ onRetry }: { onRetry?: () => void }) {
    return (
        <EmptyState
            icon={require('lucide-react').AlertCircle}
            title="Failed to load data"
            description="We encountered an error while loading your data. Please try again."
            actionLabel="Retry"
            onAction={onRetry}
        />
    );
}

export function NoPermissionEmptyState() {
    return (
        <EmptyState
            icon={require('lucide-react').Lock}
            title="Access Denied"
            description="You don't have permission to view this content. Contact your administrator if you believe this is an error."
            actionLabel="Go to Dashboard"
            actionHref="/dashboard"
        />
    );
}

export function ComingSoonEmptyState({ feature }: { feature: string }) {
    return (
        <EmptyState
            icon={require('lucide-react').Sparkles}
            title="Coming Soon"
            description={`${feature} is currently under development. We're working hard to bring you this feature soon!`}
            actionLabel="Back to Dashboard"
            actionHref="/dashboard"
        />
    );
}
