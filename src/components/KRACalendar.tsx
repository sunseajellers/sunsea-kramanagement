'use client'

import { useState } from 'react'
import { KRA } from '@/types'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react'

interface Props {
    kras: KRA[]
}

export default function KRACalendar({ kras }: Props) {
    const [currentDate, setCurrentDate] = useState(new Date())
    const [selectedDate, setSelectedDate] = useState<Date | null>(null)

    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    // Get first day of month and number of days
    const firstDayOfMonth = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const daysInPrevMonth = new Date(year, month, 0).getDate()

    const monthNames = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
    ]

    const goToPreviousMonth = () => {
        setCurrentDate(new Date(year, month - 1, 1))
    }

    const goToNextMonth = () => {
        setCurrentDate(new Date(year, month + 1, 1))
    }

    const goToToday = () => {
        setCurrentDate(new Date())
    }

    // Check if a KRA is active on a given date
    const getKRAsForDate = (date: Date) => {
        return kras.filter(kra => {
            const kraStart = new Date(kra.startDate)
            const kraEnd = new Date(kra.endDate)
            kraStart.setHours(0, 0, 0, 0)
            kraEnd.setHours(23, 59, 59, 999)
            date.setHours(12, 0, 0, 0)
            return date >= kraStart && date <= kraEnd
        })
    }

    // Generate calendar days
    const calendarDays = []

    // Previous month days
    for (let i = firstDayOfMonth - 1; i >= 0; i--) {
        const day = daysInPrevMonth - i
        const date = new Date(year, month - 1, day)
        calendarDays.push({ day, date, isCurrentMonth: false, kras: getKRAsForDate(date) })
    }

    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day)
        calendarDays.push({ day, date, isCurrentMonth: true, kras: getKRAsForDate(date) })
    }

    // Next month days to fill the grid
    const remainingDays = 42 - calendarDays.length // 6 rows × 7 days
    for (let day = 1; day <= remainingDays; day++) {
        const date = new Date(year, month + 1, day)
        calendarDays.push({ day, date, isCurrentMonth: false, kras: getKRAsForDate(date) })
    }

    const isToday = (date: Date) => {
        const today = new Date()
        return date.getDate() === today.getDate() &&
            date.getMonth() === today.getMonth() &&
            date.getFullYear() === today.getFullYear()
    }

    const selectedKras = selectedDate ? getKRAsForDate(selectedDate) : []

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            {/* Calendar Header */}
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                    <CalendarIcon className="w-6 h-6 mr-2 text-primary-600" />
                    📅 Calendar View
                </h2>
                <div className="flex items-center space-x-3">
                    <button
                        onClick={goToToday}
                        className="px-4 py-2 text-sm font-medium text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                    >
                        Today
                    </button>
                    <div className="flex items-center space-x-2">
                        <button
                            onClick={goToPreviousMonth}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <ChevronLeft className="w-5 h-5 text-gray-600" />
                        </button>
                        <span className="text-lg font-semibold text-gray-900 min-w-[180px] text-center">
                            {monthNames[month]} {year}
                        </span>
                        <button
                            onClick={goToNextMonth}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <ChevronRight className="w-5 h-5 text-gray-600" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 gap-2">
                {/* Day headers */}
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center font-semibold text-gray-600 text-sm py-2">
                        {day}
                    </div>
                ))}

                {/* Calendar days */}
                {calendarDays.map((dayInfo, index) => {
                    const { day, date, isCurrentMonth, kras: dayKras } = dayInfo
                    const today = isToday(date)
                    const hasKras = dayKras.length > 0

                    return (
                        <button
                            key={index}
                            onClick={() => setSelectedDate(date)}
                            className={`
                                relative min-h-[80px] p-2 rounded-lg border transition-all
                                ${isCurrentMonth ? 'bg-white' : 'bg-gray-50'}
                                ${today ? 'border-primary-500 ring-2 ring-primary-200' : 'border-gray-200'}
                                ${hasKras && isCurrentMonth ? 'hover:border-primary-300 hover:shadow-md' : 'hover:border-gray-300'}
                                ${!isCurrentMonth ? 'opacity-50' : ''}
                            `}
                        >
                            <div className={`
                                text-sm font-semibold mb-1
                                ${today ? 'text-primary-600' : isCurrentMonth ? 'text-gray-900' : 'text-gray-400'}
                            `}>
                                {day}
                            </div>

                            {hasKras && (
                                <div className="space-y-1">
                                    {dayKras.slice(0, 2).map((kra, i) => (
                                        <div
                                            key={i}
                                            className={`
                                                text-xs px-2 py-1 rounded truncate
                                                ${kra.type === 'daily' ? 'bg-blue-100 text-blue-700' : ''}
                                                ${kra.type === 'weekly' ? 'bg-purple-100 text-purple-700' : ''}
                                                ${kra.type === 'monthly' ? 'bg-green-100 text-green-700' : ''}
                                            `}
                                            title={kra.title}
                                        >
                                            {kra.title}
                                        </div>
                                    ))}
                                    {dayKras.length > 2 && (
                                        <div className="text-xs text-gray-500 font-medium">
                                            +{dayKras.length - 2} more
                                        </div>
                                    )}
                                </div>
                            )}
                        </button>
                    )
                })}
            </div>

            {/* Selected Date Details */}
            {selectedDate && selectedKras.length > 0 && (
                <div className="mt-6 p-4 bg-gradient-to-r from-primary-50 to-secondary-50 rounded-xl border border-primary-200">
                    <h3 className="font-semibold text-gray-900 mb-3">
                        Goals for {selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                    </h3>
                    <div className="space-y-2">
                        {selectedKras.map(kra => (
                            <div key={kra.id} className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-2 mb-1">
                                            <span className={`
                                                px-2 py-0.5 rounded text-xs font-semibold
                                                ${kra.type === 'daily' ? 'bg-blue-100 text-blue-700' : ''}
                                                ${kra.type === 'weekly' ? 'bg-purple-100 text-purple-700' : ''}
                                                ${kra.type === 'monthly' ? 'bg-green-100 text-green-700' : ''}
                                            `}>
                                                {kra.type === 'daily' ? '📅' : kra.type === 'weekly' ? '📆' : '🗓️'} {kra.type}
                                            </span>
                                            <span className={`
                                                px-2 py-0.5 rounded text-xs font-semibold
                                                ${kra.priority === 'low' ? 'bg-green-100 text-green-700' : ''}
                                                ${kra.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' : ''}
                                                ${kra.priority === 'high' ? 'bg-orange-100 text-orange-700' : ''}
                                                ${kra.priority === 'critical' ? 'bg-red-100 text-red-700' : ''}
                                            `}>
                                                {kra.priority}
                                            </span>
                                        </div>
                                        <h4 className="font-semibold text-gray-900">{kra.title}</h4>
                                        <p className="text-sm text-gray-600 mt-1">{kra.description}</p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    )
}
