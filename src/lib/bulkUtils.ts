import { useState, useCallback } from 'react';

/**
 * Hook for managing bulk selection state
 */
export function useBulkSelection<T extends { id: string }>(items: T[]) {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const toggleSelection = useCallback((id: string) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    }, []);

    const toggleAll = useCallback(() => {
        if (selectedIds.size === items.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(items.map(item => item.id)));
        }
    }, [items, selectedIds.size]);

    const clearSelection = useCallback(() => {
        setSelectedIds(new Set());
    }, []);

    const isSelected = useCallback((id: string) => {
        return selectedIds.has(id);
    }, [selectedIds]);

    const isAllSelected = items.length > 0 && selectedIds.size === items.length;
    const isSomeSelected = selectedIds.size > 0 && selectedIds.size < items.length;

    return {
        selectedIds: Array.from(selectedIds),
        selectedCount: selectedIds.size,
        toggleSelection,
        toggleAll,
        clearSelection,
        isSelected,
        isAllSelected,
        isSomeSelected
    };
}

/**
 * Bulk action types
 */
export type BulkTaskAction = 'delete' | 'reassign' | 'updateStatus' | 'updatePriority';
export type BulkKRAAction = 'delete' | 'toggleStatus' | 'duplicate';
export type BulkUserAction = 'updateRole' | 'updateTeam' | 'toggleActive' | 'delete';

/**
 * Execute bulk task operations
 */
export async function executeBulkTaskAction(
    action: BulkTaskAction,
    taskIds: string[],
    params?: Record<string, any>
): Promise<{ success: number; failed: number; errors: string[] }> {
    const response = await fetch('/api/tasks/bulk', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            action,
            taskIds,
            params
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Bulk operation failed');
    }

    return response.json();
}

/**
 * Execute bulk KRA operations
 */
export async function executeBulkKRAAction(
    action: BulkKRAAction,
    kraIds: string[],
    params?: Record<string, any>
): Promise<{ success: number; failed: number; errors: string[] }> {
    const response = await fetch('/api/kras/bulk', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            action,
            kraIds,
            params
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Bulk operation failed');
    }

    return response.json();
}

/**
 * Execute bulk user operations
 */
export async function executeBulkUserAction(
    action: BulkUserAction,
    userIds: string[],
    params?: Record<string, any>
): Promise<{ success: number; failed: number; errors: string[] }> {
    const response = await fetch('/api/users/bulk', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            action,
            userIds,
            params
        })
    });

    if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Bulk operation failed');
    }

    return response.json();
}
