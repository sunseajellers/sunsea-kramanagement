'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { addHoliday, getHolidays, removeHoliday } from '@/lib/holidayService';
import { Holiday } from '@/types';
import { Loader2, Plus, Trash2, CalendarDays } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';

export default function HolidayManager() {
    const { user } = useAuth();
    const [holidays, setHolidays] = useState<Holiday[]>([]);
    const [loading, setLoading] = useState(true);
    const [adding, setAdding] = useState(false);

    // New holiday form state
    const [newHoliday, setNewHoliday] = useState({
        name: '',
        date: '',
        type: 'company' as 'company' | 'public' | 'optional',
        description: ''
    });

    useEffect(() => {
        loadHolidays();
    }, []);

    const loadHolidays = async () => {
        try {
            setLoading(true);
            const data = await getHolidays();
            // Sort by date
            const sorted = data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
            setHolidays(sorted);
        } catch (error) {
            console.error('Failed to load holidays', error);
            toast.error('Failed to load holidays');
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async () => {
        if (!newHoliday.name || !newHoliday.date) {
            toast.error('Name and date are required');
            return;
        }

        try {
            setAdding(true);
            await addHoliday({
                name: newHoliday.name,
                date: new Date(newHoliday.date),
                type: newHoliday.type,
                description: newHoliday.description,
                createdBy: user?.uid || 'system'
            });
            toast.success('Holiday added successfully');
            setNewHoliday({ name: '', date: '', type: 'company', description: '' });
            loadHolidays();
        } catch (error) {
            toast.error('Failed to add holiday');
        } finally {
            setAdding(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this holiday?')) return;

        try {
            await removeHoliday(id);
            toast.success('Holiday removed');
            loadHolidays();
        } catch (error) {
            toast.error('Failed to remove holiday');
        }
    };

    if (loading) {
        return <div className="p-10 flex justify-center"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>;
    }

    return (
        <div className="space-y-6">
            <div className="glass-card p-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <CalendarDays className="w-4 h-4 text-purple-600" />
                    Add New Holiday
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-500">Holiday Name</label>
                        <input
                            type="text"
                            placeholder="e.g. Diwali"
                            value={newHoliday.name}
                            onChange={(e) => setNewHoliday({ ...newHoliday, name: e.target.value })}
                            className="w-full h-9 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-500">Date</label>
                        <input
                            type="date"
                            value={newHoliday.date}
                            onChange={(e) => setNewHoliday({ ...newHoliday, date: e.target.value })}
                            className="w-full h-9 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-xs font-medium text-gray-500">Type</label>
                        <select
                            value={newHoliday.type}
                            onChange={(e) => setNewHoliday({ ...newHoliday, type: e.target.value as any })}
                            className="w-full h-9 px-3 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                        >
                            <option value="company">Company Holiday (Mandatory)</option>
                            <option value="public">Public Holiday</option>
                            <option value="optional">Optional / Restricted</option>
                        </select>
                    </div>
                    <Button
                        onClick={handleAdd}
                        disabled={adding}
                        className="h-9 bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
                    >
                        {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                        Add Holiday
                    </Button>
                </div>
            </div>

            <div className="glass-card overflow-hidden">
                <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-100">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">Name</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500">Type</th>
                            <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {holidays.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-400">
                                    No holidays configured yet.
                                </td>
                            </tr>
                        ) : (
                            holidays.map((holiday) => (
                                <tr key={holiday.id} className="hover:bg-gray-50/50">
                                    <td className="px-6 py-3 text-sm font-medium text-gray-900">
                                        {format(new Date(holiday.date), 'MMM d, yyyy (EEE)')}
                                    </td>
                                    <td className="px-6 py-3 text-sm text-gray-600">{holiday.name}</td>
                                    <td className="px-6 py-3">
                                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide
                                            ${holiday.type === 'company' ? 'bg-purple-100 text-purple-700' :
                                                holiday.type === 'public' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                                            {holiday.type}
                                        </span>
                                    </td>
                                    <td className="px-6 py-3 text-right">
                                        <button
                                            onClick={() => handleDelete(holiday.id)}
                                            className="p-1.5 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-lg transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
