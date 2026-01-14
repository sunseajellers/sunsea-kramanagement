'use client';

import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BulkActionBarProps {
    selectedCount: number;
    onClear: () => void;
    actions: Array<{
        label: string;
        icon?: React.ComponentType<{ className?: string }>;
        onClick: () => void;
        variant?: 'default' | 'destructive' | 'outline';
        disabled?: boolean;
    }>;
}

export default function BulkActionBar({ selectedCount, onClear, actions }: BulkActionBarProps) {
    if (selectedCount === 0) return null;

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4">
            <div className="glass-card px-6 py-4 flex items-center gap-4 shadow-xl border-2 border-blue-100">
                {/* Count Badge */}
                <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center">
                        <span className="text-white font-black text-sm">{selectedCount}</span>
                    </div>
                    <span className="text-sm font-bold text-gray-700">
                        {selectedCount} item{selectedCount > 1 ? 's' : ''} selected
                    </span>
                </div>

                {/* Divider */}
                <div className="w-px h-8 bg-gray-200" />

                {/* Action Buttons */}
                <div className="flex items-center gap-2">
                    {actions.map((action, index) => {
                        const Icon = action.icon;
                        return (
                            <Button
                                key={index}
                                onClick={action.onClick}
                                disabled={action.disabled}
                                variant={action.variant || 'outline'}
                                size="sm"
                                className="h-9 px-4 text-xs font-bold"
                            >
                                {Icon && <Icon className="w-3.5 h-3.5 mr-2" />}
                                {action.label}
                            </Button>
                        );
                    })}
                </div>

                {/* Clear Button */}
                <Button
                    onClick={onClear}
                    variant="ghost"
                    size="sm"
                    className="h-9 w-9 p-0 rounded-xl hover:bg-gray-100"
                >
                    <X className="w-4 h-4" />
                </Button>
            </div>
        </div>
    );
}
