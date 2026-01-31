'use client';

import SimpleActivityLog from '@/components/features/activity/SimpleActivityLog';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function GlobalActivityPage() {
    const { isAdmin, loading } = useAuth();
    const router = useRouter();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-12 h-12 animate-spin text-indigo-600 opacity-20" />
                    <p className="text-sm font-bold text-slate-400 tracking-widest uppercase">Initializing Stream</p>
                </div>
            </div>
        );
    }

    if (!isAdmin) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
                <div className="max-w-md w-full bg-white p-12 rounded-[40px] shadow-2xl shadow-slate-200/50 text-center space-y-6">
                    <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto">
                        <span className="text-3xl">🚫</span>
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-2xl font-black text-slate-900">Access Restricted</h1>
                        <p className="text-slate-500 font-medium leading-relaxed">
                            This real-time activity stream is only available to system administrators.
                        </p>
                    </div>
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="w-full h-14 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all active:scale-[0.98]"
                    >
                        Return to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-white selection:bg-indigo-100 selection:text-indigo-900">
            {/* Top Navigation */}
            <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-50 px-6 h-20 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link
                        href="/dashboard"
                        className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-all"
                    >
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <div className="h-6 w-px bg-slate-100 mx-2" />
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                        <span className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Live Monitor</span>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="text-right hidden sm:block">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">System Health</p>
                        <p className="text-xs font-bold text-emerald-500 flex items-center justify-end gap-1.5 leading-none">
                            Operational
                        </p>
                    </div>
                </div>
            </nav>

            {/* Content Area */}
            <div className="pt-10 pb-20">
                <SimpleActivityLog />
            </div>

            {/* Simple Footer */}
            <footer className="border-t border-slate-50 py-12">
                <div className="max-w-4xl mx-auto px-6 flex flex-col items-center gap-4 text-center">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center text-white font-black text-xs">
                        J
                    </div>
                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">
                        JewelMatrix • Enterprise DOS
                    </p>
                </div>
            </footer>
        </main>
    );
}

