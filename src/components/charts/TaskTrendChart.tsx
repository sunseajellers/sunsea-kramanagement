'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

interface TaskTrendChartProps {
    data: Array<{
        date: string
        created: number
        completed: number
    }>
}

export default function TaskTrendChart({ data }: TaskTrendChartProps) {
    return (
        <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis dataKey="date" stroke="#6B7280" />
                <YAxis stroke="#6B7280" />
                <Tooltip
                    contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #E5E7EB',
                        borderRadius: '8px'
                    }}
                />
                <Legend />
                <Line
                    type="monotone"
                    dataKey="created"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    name="Created"
                    dot={{ fill: '#3B82F6', r: 4 }}
                />
                <Line
                    type="monotone"
                    dataKey="completed"
                    stroke="#10B981"
                    strokeWidth={2}
                    name="Completed"
                    dot={{ fill: '#10B981', r: 4 }}
                />
            </LineChart>
        </ResponsiveContainer>
    )
}
