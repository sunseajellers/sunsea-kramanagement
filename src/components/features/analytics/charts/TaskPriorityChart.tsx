'use client'

import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface TaskPriorityChartProps {
    data: {
        low: number
        medium: number
        high: number
        critical: number
    }
}

export default function TaskPriorityChart({ data }: TaskPriorityChartProps) {
    const [isMounted, setIsMounted] = useState(false)

    useEffect(() => {
        setIsMounted(true)
    }, [])

    const chartData = [
        { name: 'Low', value: data.low, fill: '#3B82F6' },
        { name: 'Medium', value: data.medium, fill: '#F59E0B' },
        { name: 'High', value: data.high, fill: '#F97316' },
        { name: 'Critical', value: data.critical, fill: '#EF4444' },
    ]

    return (
        <div className="w-full h-[300px]">
            {isMounted && (
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                        <XAxis dataKey="name" stroke="#6B7280" />
                        <YAxis stroke="#6B7280" />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#fff',
                                border: '1px solid #E5E7EB',
                                borderRadius: '8px'
                            }}
                        />
                        <Bar dataKey="value" radius={[8, 8, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            )}
        </div>
    )
}
