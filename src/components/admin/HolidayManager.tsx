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
        <div className="space-y-10 animate-in">
            <div className="page-header">
                <h2 className="section-title">Operational Calendar</h2>
                <p className="section-subtitle">Manage organizational holidays and non-operational tactical windows</p>
            </div>

            <div className="glass-panel p-10">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500">
                        <CalendarDays className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest leading-none">
                        Register Tactical Break
                    </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 items-end">
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Directive Name</label>
                        <input
                            type="text"
                            placeholder="e.g. Strategic Recess"
                            value={newHoliday.name}
                            onChange={(e) => setNewHoliday({ ...newHoliday, name: e.target.value })}
                            className="form-input h-14"
                        />
                    </div>
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Target Date</label>
                        <input
                            type="date"
                            value={newHoliday.date}
                            onChange={(e) => setNewHoliday({ ...newHoliday, date: e.target.value })}
                            className="form-input h-14"
                        />
                    </div>
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Category</label>
                        <select
                            value={newHoliday.type}
                            onChange={(e) => setNewHoliday({ ...newHoliday, type: e.target.value as any })}
                            className="form-input h-14 appearance-none"
                        >
                            <option value="company">MANDATORY (COMPANY)</option>
                            <option value="public">PUBLIC OBSERVANCE</option>
                            <option value="optional">RESTRICTED / OPTIONAL</option>
                        </select>
                    </div>
                    <Button
                        onClick={handleAdd}
                        disabled={adding}
                        className="btn-primary h-14 w-full"
                    >
                        {adding ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-6 h-6 mr-2" />}
                        Authorize Date
                    </Button>
                </div>
            </div>

            <div className="glass-panel overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-slate-50/50 border-b border-slate-100">
                                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Temporal Window</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Designation</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest">Protocol Type</th>
                                <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Control</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {holidays.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-8 py-16 text-center">
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="w-16 h-16 rounded-[2rem] bg-slate-50 flex items-center justify-center text-slate-200">
                                                <CalendarDays className="w-8 h-8" />
                                            </div>
                                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Zero Calendar Exceptions Configured</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                holidays.map((holiday) => (
                                    <tr key={holiday.id} className="group hover:bg-slate-50/50 transition-colors">
                                        <td className="px-8 py-6">
                                            <div className="text-sm font-black text-slate-900 group-hover:text-indigo-600 transition-colors">
                                                {format(new Date(holiday.date), 'MMM dd, yyyy')}
                                            </div>
                                            <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">
                                                {format(new Date(holiday.date), '(EEEE)')}
                                            </div>
                                        </td>
                                        <td className="px-8 py-6 text-sm font-black text-slate-700 uppercase tracking-tight">{holiday.name}</td>
                                        <td className="px-8 py-6">
                                            <span className={`status-badge px-3 py-1 text-[9px]
                                                ${holiday.type === 'company' ? 'status-badge-neutral border-indigo-200 text-indigo-600 bg-indigo-50' :
                                                    holiday.type === 'public' ? 'status-badge-success' : 'status-badge-neutral'}`}>
                                                {holiday.type}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            <button
                                                onClick={() => handleDelete(holiday.id)}
                                                className="w-10 h-10 rounded-xl hover:bg-rose-50 text-slate-300 hover:text-rose-600 border border-transparent hover:border-rose-100 flex items-center justify-center transition-all group/trash"
                                            >
                                                <Trash2 className="w-5 h-5 group-hover/trash:scale-110 transition-transform" />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
