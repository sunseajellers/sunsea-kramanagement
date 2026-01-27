import { useState, useCallback, useRef, useEffect } from 'react';
import { TaskWithMeta } from '@/types';

interface DashboardData {
    tasks: TaskWithMeta[];
    delegatedTasks: TaskWithMeta[];
    userProfile: any;
}

interface CacheEntry {
    data: DashboardData;
    timestamp: number;
}

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
const cache = new Map<string, CacheEntry>();

export function useDashboardData(userId: string | undefined, getToken: () => Promise<string | undefined>) {
    const [data, setData] = useState<DashboardData>({
        tasks: [],
        delegatedTasks: [],
        userProfile: null,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const cacheKeyRef = useRef(`dashboard-${userId}`);

    // Check if cache is still valid
    const getCachedData = useCallback((): DashboardData | null => {
        const cached = cache.get(cacheKeyRef.current);
        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
            return cached.data;
        }
        cache.delete(cacheKeyRef.current);
        return null;
    }, []);

    // Fetch all data in parallel with optimized API calls
    const fetchAllData = useCallback(async () => {
        if (!userId) return;

        // Check cache first
        const cachedData = getCachedData();
        if (cachedData) {
            setData(cachedData);
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const token = await getToken();
            const headers: any = token ? { 'Authorization': `Bearer ${token}` } : {};

            // Fetch all data in parallel
            const [tasksRes, delegatedRes, profileRes] = await Promise.all([
                fetch(`/api/tasks?userId=${userId}`, { headers }),
                fetch(`/api/tasks?assignedBy=${userId}`, { headers }),
                fetch(`/api/users/${userId}`, { headers })
            ]);

            let tasks: TaskWithMeta[] = [];
            let delegatedTasks: TaskWithMeta[] = [];
            let userProfile: any = null;

            if (tasksRes.ok) {
                const tasksData = await tasksRes.json();
                tasks = tasksData.tasks || [];
            }

            if (delegatedRes.ok) {
                const delegatedData = await delegatedRes.json();
                delegatedTasks = (delegatedData.tasks || []).filter((t: TaskWithMeta) =>
                    !t.assignedTo?.includes(userId)
                );
            }

            if (profileRes.ok) {
                userProfile = await profileRes.json();
            }

            const newData = { tasks, delegatedTasks, userProfile };
            setData(newData);

            // Cache the data
            cache.set(cacheKeyRef.current, {
                data: newData,
                timestamp: Date.now()
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to fetch data');
            console.error('Error fetching dashboard data:', err);
        } finally {
            setLoading(false);
        }
    }, [userId, getToken, getCachedData]);

    // Fetch data on mount and when userId changes
    useEffect(() => {
        if (userId) {
            fetchAllData();
        } else {
            setLoading(false);
        }
    }, [userId, fetchAllData]);

    // Refetch data and clear cache
    const refetch = useCallback(async () => {
        cache.delete(cacheKeyRef.current);
        await fetchAllData();
    }, [fetchAllData]);

    return {
        ...data,
        loading,
        error,
        refetch,
        setUserProfile: (profile: any) => setData(prev => ({ ...prev, userProfile: profile })),
        setTasks: (tasks: TaskWithMeta[]) => setData(prev => ({ ...prev, tasks })),
        setDelegatedTasks: (delegated: TaskWithMeta[]) => setData(prev => ({ ...prev, delegatedTasks: delegated }))
    };
}
