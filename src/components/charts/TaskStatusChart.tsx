'use client'

import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts'

interface TaskStatusChartProps {
    data: {
        pending: number
        'in-progress': number
        completed: number
        blocked: number
    }
}

const COLORS = {
    pending: '#9CA3AF',
    'in-progress': '#3B82F6',
    completed: '#10B981',
    blocked: '#EF4444'
}

const STATUS_LABELS = {
    pending: 'Pending',
    'in-progress': 'In Progress',
    completed: 'Completed',
    blocked: 'Blocked'
}

export default function TaskStatusChart({ data }: TaskStatusChartProps) {
    const chartData = Object.entries(data).map(([key, value]) => ({
        name: STATUS_LABELS[key as keyof typeof STATUS_LABELS],
        value,
        color: COLORS[key as keyof typeof COLORS]
    })).filter(item => item.value > 0)

    if (chartData.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 text-gray-400">
                No task data available
            </div>
        )
    }

    return (
        <ResponsiveContainer width="100%" height={300}>
            <PieChart>
                <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }: any) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                >
                    {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                </Pie>
                <Tooltip />
                <Legend />
            </PieChart>
        </ResponsiveContainer>
    )
}
