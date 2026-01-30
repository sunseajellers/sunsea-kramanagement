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
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center bg-card/40 backdrop-blur-sm rounded-3xl border border-border/50">
            {/* Icon */}
            <div className="w-24 h-24 bg-muted/50 rounded-[2.5rem] flex items-center justify-center mb-8 shadow-sm transition-transform hover:scale-110 duration-500">
                <Icon className="w-12 h-12 text-muted-foreground/60" />
            </div>

            {/* Title */}
            <h3 className="text-2xl font-bold text-foreground mb-3">{title}</h3>

            {/* Description */}
            <p className="text-muted-foreground mb-10 max-w-md leading-relaxed font-medium">{description}</p>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4">
                {actionLabel && (
                    <>
                        {actionHref ? (
                            <Link href={actionHref} className="btn-primary inline-flex items-center h-12 px-8">
                                {actionLabel}
                            </Link>
                        ) : (
                            <button onClick={onAction} className="btn-primary h-12 px-8">
                                {actionLabel}
                            </button>
                        )}
                    </>
                )}

                {secondaryActionLabel && onSecondaryAction && (
                    <button onClick={onSecondaryAction} className="btn-secondary h-12 px-8">
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
