// Reusable skeleton components for loading states

export const StatCardSkeleton = () => (
    <div className="bg-card/40 backdrop-blur-sm rounded-3xl p-6 border border-border/50 animate-pulse">
        <div className="flex items-center justify-between mb-8">
            <div className="w-14 h-14 bg-muted rounded-2xl" />
            <div className="w-16 h-4 bg-muted rounded" />
        </div>
        <div className="h-2 bg-muted rounded w-24 mb-4" />
        <div className="h-8 bg-muted rounded w-16" />
    </div>
);

export const StatsSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
            <StatCardSkeleton key={i} />
        ))}
    </div>
);

export const TaskCardSkeleton = () => (
    <div className="p-4 border-b border-gray-100 animate-pulse">
        <div className="flex items-start justify-between mb-2">
            <div className="h-5 bg-gray-200 rounded w-2/3" />
            <div className="h-6 bg-gray-200 rounded-full w-20" />
        </div>
        <div className="h-4 bg-gray-200 rounded w-full mb-3" />
        <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
                <div className="h-6 bg-gray-200 rounded-full w-16" />
                <div className="h-4 bg-gray-200 rounded w-24" />
            </div>
            <div className="flex items-center space-x-2">
                <div className="w-24 h-2 bg-gray-200 rounded-full" />
                <div className="h-4 bg-gray-200 rounded w-10" />
            </div>
        </div>
    </div>
);

export const TaskListSkeleton = () => (
    <div className="bg-card/40 backdrop-blur-sm rounded-3xl border border-border/50 overflow-hidden">
        <div className="p-8 border-b border-border/50 flex items-center justify-between">
            <div className="h-6 bg-muted rounded w-32 animate-pulse" />
            <div className="h-4 bg-muted rounded w-20 animate-pulse" />
        </div>
        <div className="divide-y divide-border/50">
            {[1, 2, 3, 4, 5].map((i) => (
                <TaskCardSkeleton key={i} />
            ))}
        </div>
    </div>
);

export const KRACardSkeleton = () => (
    <div className="p-4 border-b border-gray-100 animate-pulse">
        <div className="flex items-start justify-between mb-2">
            <div className="flex items-center space-x-2 flex-1">
                <div className="w-5 h-5 bg-gray-200 rounded" />
                <div className="h-5 bg-gray-200 rounded w-1/2" />
            </div>
            <div className="h-6 bg-gray-200 rounded-full w-16" />
        </div>
        <div className="h-4 bg-gray-200 rounded w-full mb-3 ml-7" />
        <div className="flex items-center justify-between ml-7">
            <div className="flex items-center space-x-4">
                <div className="h-6 bg-gray-200 rounded-full w-16" />
                <div className="h-4 bg-gray-200 rounded w-24" />
            </div>
            <div className="h-6 bg-gray-200 rounded-full w-20" />
        </div>
    </div>
);

export const BoardColumnSkeleton = () => (
    <div className="flex-shrink-0 w-80">
        <div className="bg-gray-50 rounded-xl p-4">
            <div className="flex items-center justify-between mb-4 animate-pulse">
                <div className="h-5 bg-gray-200 rounded w-24" />
                <div className="h-6 bg-gray-200 rounded-full w-8" />
            </div>
            <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white rounded-lg p-4 border border-gray-200 animate-pulse">
                        <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
                        <div className="h-4 bg-gray-200 rounded w-full mb-3" />
                        <div className="flex items-center justify-between">
                            <div className="h-6 bg-gray-200 rounded-full w-16" />
                            <div className="h-4 bg-gray-200 rounded w-20" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </div>
);

export const BoardSkeleton = () => (
    <div className="flex space-x-4 overflow-x-auto pb-4">
        {[1, 2, 3, 4].map((i) => (
            <BoardColumnSkeleton key={i} />
        ))}
    </div>
);

export const FormSkeleton = () => (
    <div className="space-y-6 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
            <div key={i}>
                <div className="h-4 bg-gray-200 rounded w-24 mb-2" />
                <div className="h-12 bg-gray-200 rounded-lg w-full" />
            </div>
        ))}
        <div className="flex justify-end space-x-3">
            <div className="h-12 bg-gray-200 rounded-lg w-24" />
            <div className="h-12 bg-gray-200 rounded-lg w-32" />
        </div>
    </div>
);

export const TableSkeleton = ({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) => (
    <div className="bg-card/40 backdrop-blur-sm rounded-3xl border border-border/50 overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead className="bg-muted/50 border-b border-border/50">
                    <tr>
                        {Array.from({ length: columns }).map((_, i) => (
                            <th key={i} className="px-6 py-4">
                                <div className="h-3 bg-muted rounded w-20 animate-pulse" />
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                    {Array.from({ length: rows }).map((_, rowIndex) => (
                        <tr key={rowIndex}>
                            {Array.from({ length: columns }).map((_, colIndex) => (
                                <td key={colIndex} className="px-6 py-4">
                                    <div className="h-4 bg-muted rounded w-full animate-pulse" />
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);

export const ChartSkeleton = () => (
    <div className="bg-white rounded-xl p-6 border border-gray-200">
        <div className="h-6 bg-gray-200 rounded w-32 mb-6 animate-pulse" />
        <div className="h-64 bg-gray-100 rounded-lg animate-pulse" />
    </div>
);

export const PageHeaderSkeleton = () => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 animate-pulse">
        <div className="flex items-center justify-between mb-4">
            <div>
                <div className="h-8 bg-gray-200 rounded w-48 mb-2" />
                <div className="h-4 bg-gray-200 rounded w-64" />
            </div>
            <div className="h-12 bg-gray-200 rounded-lg w-40" />
        </div>
    </div>
);

export const FullPageSkeleton = () => (
    <div className="space-y-6 p-6">
        <PageHeaderSkeleton />
        <StatsSkeleton />
        <div className="grid lg:grid-cols-2 gap-6">
            <TaskListSkeleton />
            <TaskListSkeleton />
        </div>
    </div>
);
