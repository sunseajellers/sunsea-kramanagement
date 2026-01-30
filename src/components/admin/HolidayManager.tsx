'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { addHoliday, getHolidays, removeHoliday } from '@/lib/holidayService';
import { Holiday } from '@/types';
import { Loader2, Plus, Trash2, CalendarDays } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

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
        <div className="space-y-12 animate-in">
            <div className="page-header">
                <h2 className="section-title">Holidays & Off-Days</h2>
                <p className="section-subtitle">Mark days when the office is closed so tasks aren't assigned on those dates</p>
            </div>

            <div className="glass-panel p-10 border-border/40">
                <div className="flex items-center gap-5 mb-10">
                    <div className="w-14 h-14 rounded-2xl bg-primary/5 flex items-center justify-center text-primary shadow-xl shadow-primary/5">
                        <CalendarDays className="w-7 h-7" />
                    </div>
                    <h3 className="text-xl font-black text-primary uppercase tracking-tight">
                        Add a Holiday
                    </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 items-end">
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-[0.3em] ml-2">Holiday Name</label>
                        <input
                            type="text"
                            placeholder="e.g. New Year's Day"
                            value={newHoliday.name}
                            onChange={(e) => setNewHoliday({ ...newHoliday, name: e.target.value })}
                            className="form-input h-16 bg-muted/20"
                        />
                    </div>
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-[0.3em] ml-2">Date</label>
                        <input
                            type="date"
                            value={newHoliday.date}
                            onChange={(e) => setNewHoliday({ ...newHoliday, date: e.target.value })}
                            className="form-input h-16 bg-muted/20"
                        />
                    </div>
                    <div className="space-y-3">
                        <label className="text-[10px] font-black text-muted-foreground/50 uppercase tracking-[0.3em] ml-2">Type</label>
                        <select
                            value={newHoliday.type}
                            onChange={(e) => setNewHoliday({ ...newHoliday, type: e.target.value as any })}
                            className="form-input h-16 bg-muted/20 appearance-none"
                        >
                            <option value="company">Company Holiday</option>
                            <option value="public">Public Holiday</option>
                            <option value="optional">Optional Holiday</option>
                        </select>
                    </div>
                    <button
                        onClick={handleAdd}
                        disabled={adding}
                        className="btn-primary h-16 w-full shadow-xl shadow-primary/10"
                    >
                        {adding ? <Loader2 className="w-5 h-5 animate-spin" /> : <Plus className="w-6 h-6 mr-2" />}
                        Add Holiday
                    </button>
                </div>
            </div>

            <div className="glass-panel overflow-hidden border-border/40 p-0">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-muted/30 border-b border-border/40">
                                <th className="px-10 py-6 text-left text-[10px] font-black text-muted-foreground/50 uppercase tracking-[0.3em]">Date</th>
                                <th className="px-10 py-6 text-left text-[10px] font-black text-muted-foreground/50 uppercase tracking-[0.3em]">Name</th>
                                <th className="px-10 py-6 text-left text-[10px] font-black text-muted-foreground/50 uppercase tracking-[0.3em]">Type</th>
                                <th className="px-10 py-6 text-right text-[10px] font-black text-muted-foreground/50 uppercase tracking-[0.3em]">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                            {holidays.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-10 py-24 text-center">
                                        <div className="flex flex-col items-center gap-6">
                                            <div className="w-24 h-24 rounded-[3.5rem] bg-muted/30 flex items-center justify-center text-muted-foreground/20">
                                                <CalendarDays className="w-12 h-12" />
                                            </div>
                                            <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.4em]">No holidays added yet</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                holidays.map((holiday) => (
                                    <tr key={holiday.id} className="group hover:bg-muted/20 transition-colors">
                                        <td className="px-10 py-8">
                                            <div className="text-base font-black text-primary group-hover:text-secondary transition-colors">
                                                {format(new Date(holiday.date), 'MMM dd, yyyy')}
                                            </div>
                                            <div className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-[0.3em] mt-1.5 font-jakarta">
                                                {format(new Date(holiday.date), '(EEEE)')}
                                            </div>
                                        </td>
                                        <td className="px-10 py-8 text-base font-black text-primary uppercase tracking-tight">{holiday.name}</td>
                                        <td className="px-10 py-8">
                                            <span className={cn(
                                                "status-badge px-4 py-1.5 text-[9px] font-black tracking-widest",
                                                holiday.type === 'company' ? 'bg-primary/5 text-primary border-primary/10' :
                                                    holiday.type === 'public' ? 'status-badge-success' : 'status-badge-neutral'
                                            )}>
                                                {holiday.type === 'company' ? 'COMPANY' : holiday.type === 'public' ? 'PUBLIC' : 'OPTIONAL'}
                                            </span>
                                        </td>
                                        <td className="px-10 py-8 text-right">
                                            <button
                                                onClick={() => handleDelete(holiday.id)}
                                                className="w-12 h-12 rounded-2xl hover:bg-destructive/10 text-muted-foreground/20 hover:text-destructive border border-transparent hover:border-destructive/20 flex items-center justify-center mx-auto mr-0 transition-all group/trash shadow-sm hover:shadow-xl active:translate-y-0.5"
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
    )
}
