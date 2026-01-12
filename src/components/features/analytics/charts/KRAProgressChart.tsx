'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface KRAProgressChartProps {
    data: Array<{
        id: string
        title: string
        progress: number
        tasksCompleted: number
        tasksTotal: number
    }>
}

export default function KRAProgressChart({ data }: KRAProgressChartProps) {
    // Show top 5 KRAs
    const topKRAs = data.slice(0, 5)

    const getColor = (progress: number) => {
        if (progress >= 80) return '#10B981' // Green
        if (progress >= 50) return '#F59E0B' // Yellow
        if (progress >= 25) return '#F97316' // Orange
        return '#EF4444' // Red
    }

    if (topKRAs.length === 0) {
        return (
            <div className="flex items-center justify-center h-64 text-gray-400">
                No KRA data available
            </div>
        )
    }

    return (
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topKRAs} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis type="number" domain={[0, 100]} stroke="#6B7280" />
                <YAxis
                    type="category"
                    dataKey="title"
                    width={150}
                    stroke="#6B7280"
                    tick={{ fontSize: 12 }}
                />
                <Tooltip
                    contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px'
                    }}
                    formatter={(value: number | undefined, _name: string | undefined, props: any) => [
                        `${value ?? 0}% (${props.payload.tasksCompleted ?? 0}/${props.payload.tasksTotal ?? 0} tasks)`,
                        'Progress'
                    ]}
                />
                <Bar dataKey="progress" radius={[0, 8, 8, 0]}>
                    {topKRAs.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={getColor(entry.progress)} />
                    ))}
                </Bar>
            </BarChart>
        </ResponsiveContainer>
    )
}
