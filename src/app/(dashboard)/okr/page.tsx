'use client'

import OKRList from '@/components/features/okr/OKRList'
import { Info, Loader2 } from 'lucide-react'
import { useAuth } from '@/contexts/AuthContext'
import { useDashboardData } from '@/hooks/useDashboardData'

export default function OKRPage() {
    const { user } = useAuth()
    const { okrs, loading } = useDashboardData(
        user?.uid,
        () => user?.getIdToken() || Promise.resolve(undefined)
    )

    return (
        <div className="min-h-screen bg-[#F8FAFC]">


            <main className="max-w-7xl mx-auto px-10 py-12 space-y-12">
                {/* Intro Tooltip */}
                <div className="bg-blue-600 rounded-[2.5rem] p-8 text-white flex flex-col md:flex-row items-center gap-8 shadow-2xl shadow-blue-100 overflow-hidden relative">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <Info className="h-32 w-32" />
                    </div>
                    <div className="p-5 bg-white/10 rounded-3xl backdrop-blur-xl shrink-0">
                        <Info className="h-8 w-8 text-white" />
                    </div>
                    <div>
                        <h3 className="text-xl font-black tracking-tight">Focus on what matters.</h3>
                        <p className="text-blue-50 text-sm font-medium opacity-80 mt-2 leading-relaxed">
                            OKRs are transparent across the company to ensure alignment. Every task you complete contributes towards these strategic objectives.
                        </p>
                    </div>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="h-8 w-8 animate-spin text-slate-300" />
                    </div>
                ) : (
                    <OKRList okrs={okrs} />
                )}
            </main>
        </div>
    )
}
