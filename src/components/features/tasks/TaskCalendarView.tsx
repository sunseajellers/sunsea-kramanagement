'use client'

import { useState, useEffect } from 'react'
import { Task } from '@/types'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'

interface Props {
    tasks: Task[]
    onTaskClick: (task: Task) => void
}

interface CalendarDay {
    date: Date
    isCurrentMonth: boolean
    tasks: Task[]
}

const priorityColors: Record<string, string> = {
    low: 'bg-gray-400',
    medium: 'bg-blue-500',
    high: 'bg-orange-500',
    critical: 'bg-red-500'
}

export default function TaskCalendarView({ tasks, onTaskClick }: Props) {
    const [currentDate, setCurrentDate] = useState(new Date())
    const [calendarDays, setCalendarDays] = useState<CalendarDay[]>([])

    useEffect(() => {
        generateCalendar()
    }, [currentDate, tasks])

    const generateCalendar = () => {
        const year = currentDate.getFullYear()
        const month = currentDate.getMonth()

        // Get first day of month
        const firstDay = new Date(year, month, 1)
        const lastDay = new Date(year, month + 1, 0)

        // Get starting day (Sunday = 0)
        const startingDayOfWeek = firstDay.getDay()

        // Get days from previous month
        const daysInPrevMonth = new Date(year, month, 0).getDate()

        const days: CalendarDay[] = []

        // Add days from previous month
        for (let i = startingDayOfWeek - 1; i >= 0; i--) {
            const date = new Date(year, month - 1, daysInPrevMonth - i)
            days.push({
                date,
                isCurrentMonth: false,
                tasks: getTasksForDate(date)
            })
        }

        // Add days from current month
        for (let i = 1; i <= lastDay.getDate(); i++) {
            const date = new Date(year, month, i)
            days.push({
                date,
                isCurrentMonth: true,
                tasks: getTasksForDate(date)
            })
        }

        // Add days from next month to complete the grid
        const remainingDays = 42 - days.length // 6 rows * 7 days
        for (let i = 1; i <= remainingDays; i++) {
            const date = new Date(year, month + 1, i)
            days.push({
                date,
                isCurrentMonth: false,
                tasks: getTasksForDate(date)
            })
        }

        setCalendarDays(days)
    }

    const getTasksForDate = (date: Date): Task[] => {
        return tasks.filter(task => {
            const taskDate = new Date(task.dueDate)
            return (
                taskDate.getDate() === date.getDate() &&
                taskDate.getMonth() === date.getMonth() &&
                taskDate.getFullYear() === date.getFullYear()
            )
        })
    }

    const previousMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
    }

    const nextMonth = () => {
        setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
    }

    const today = () => {
        setCurrentDate(new Date())
    }

    const isToday = (date: Date) => {
        const now = new Date()
        return (
            date.getDate() === now.getDate() &&
            date.getMonth() === now.getMonth() &&
            date.getFullYear() === now.getFullYear()
        )
    }

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ]

    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                    <CalendarIcon className="w-6 h-6 text-primary-600" />
                    <h2 className="text-2xl font-bold text-gray-900">
                        {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
                    </h2>
                </div>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={today}
                        className="px-4 py-2 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                    >
                        Today
                    </button>
                    <button
                        onClick={previousMonth}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <button
                        onClick={nextMonth}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                        <ChevronRight className="w-5 h-5 text-gray-600" />
                    </button>
                </div>
            </div>

            {/* Day Names */}
            <div className="grid grid-cols-7 gap-2 mb-2">
                {dayNames.map(day => (
                    <div key={day} className="text-center text-sm font-semibold text-gray-600 py-2">
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2">
                {calendarDays.map((day, index) => {
                    const dayIsToday = isToday(day.date)
                    const hasOverdueTasks = day.tasks.some(
                        task => new Date(task.dueDate) < new Date() && task.status !== 'completed'
                    )

                    return (
                        <div
                            key={index}
                            className={`min-h-[100px] border rounded-lg p-2 transition-all ${day.isCurrentMonth
                                    ? 'bg-white border-gray-200 hover:border-primary-300 hover:shadow-sm'
                                    : 'bg-gray-50 border-gray-100'
                                } ${dayIsToday ? 'ring-2 ring-primary-500' : ''}`}
                        >
                            {/* Day Number */}
                            <div className="flex items-center justify-between mb-1">
                                <span
                                    className={`text-sm font-semibold ${day.isCurrentMonth ? 'text-gray-900' : 'text-gray-400'
                                        } ${dayIsToday ? 'text-primary-600' : ''}`}
                                >
                                    {day.date.getDate()}
                                </span>
                                {hasOverdueTasks && (
                                    <span className="w-2 h-2 bg-red-500 rounded-full" />
                                )}
                            </div>

                            {/* Tasks */}
                            <div className="space-y-1">
                                {day.tasks.slice(0, 3).map(task => (
                                    <div
                                        key={task.id}
                                        onClick={() => onTaskClick(task)}
                                        className={`text-xs p-1.5 rounded cursor-pointer hover:opacity-80 transition-opacity ${priorityColors[task.priority]
                                            } text-white truncate`}
                                        title={task.title}
                                    >
                                        {task.title}
                                    </div>
                                ))}
                                {day.tasks.length > 3 && (
                                    <div className="text-xs text-gray-500 text-center py-1">
                                        +{day.tasks.length - 3} more
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Legend */}
            <div className="mt-6 pt-4 border-t border-gray-200">
                <div className="flex items-center justify-center space-x-6 text-sm">
                    <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded bg-gray-400" />
                        <span className="text-gray-600">Low</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded bg-blue-500" />
                        <span className="text-gray-600">Medium</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded bg-orange-500" />
                        <span className="text-gray-600">High</span>
                    </div>
                    <div className="flex items-center space-x-2">
                        <div className="w-3 h-3 rounded bg-red-500" />
                        <span className="text-gray-600">Critical</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
