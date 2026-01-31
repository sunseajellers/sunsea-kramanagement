'use client'

import { useState, useEffect } from 'react'
import {
    Search,
    Plus,
    FileText,
    TrendingUp,
    ChevronRight,
    Loader2,
    BookOpen,
    HelpCircle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { getAllArticles, getAllCategories, getLearningStats } from '@/lib/learningHubService'
import { Article, LearningHubStats } from '@/types'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

export default function LearningHubPage() {
    const [articles, setArticles] = useState<Article[]>([])
    const [stats, setStats] = useState<LearningHubStats | null>(null)
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedCategory, setSelectedCategory] = useState<string>('all')

    useEffect(() => {
        loadData()
    }, [])

    const loadData = async () => {
        try {
            setLoading(true)
            const [artList, , hubStats] = await Promise.all([
                getAllArticles(),
                getAllCategories(),
                getLearningStats()
            ])
            setArticles(artList)
            setStats(hubStats)
        } catch (error) {
            console.error('Error loading hub:', error)
            toast.error('Failed to load knowledge base')
        } finally {
            setLoading(false)
        }
    }

    const filteredArticles = articles.filter(art => {
        const matchesSearch = art.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            art.content.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesCategory = selectedCategory === 'all' || art.categoryId === selectedCategory
        return matchesSearch && matchesCategory
    })

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Accessing Knowledge Base</p>
            </div>
        )
    }

    return (
        <div className="space-y-10 animate-in">
            {/* Header Section */}
            <div className="page-header flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="section-title">Operations Manuals</h1>
                    <p className="section-subtitle">Company-wide SOPs, training modules, and strategic guides</p>
                </div>
                <Button className="btn-primary">
                    <Plus className="w-5 h-5 mr-2" />
                    Archive New Data
                </Button>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: 'Total Documentation', value: stats?.totalArticles || 0, icon: FileText, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                    { label: 'Operational FAQs', value: stats?.totalFAQs || 0, icon: HelpCircle, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Resource Views', value: stats?.totalViews || 0, icon: TrendingUp, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Active Guides', value: articles.filter(a => a.type === 'guide').length, icon: BookOpen, color: 'text-purple-600', bg: 'bg-purple-50' }
                ].map((s, i) => (
                    <div key={i} className="dashboard-card group">
                        <div className="flex items-center justify-between mb-4">
                            <div className={cn("p-2.5 rounded-2xl", s.bg)}>
                                <s.icon className={cn("w-5 h-5", s.color)} />
                            </div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Stat</span>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-500 mb-1">{s.label}</p>
                            <h3 className="text-3xl font-black text-slate-900 leading-none">{s.value}</h3>
                        </div>
                    </div>
                ))}
            </div>

            {/* Navigation & Intelligence Search */}
            <div className="flex flex-col xl:flex-row gap-6">
                <div className="flex-1 relative">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <Input
                        placeholder="Search for internal protocols, guides, or data..."
                        className="h-14 pl-14 pr-6 bg-white border-slate-200/60 rounded-2xl text-base font-medium shadow-sm focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center p-1.5 bg-slate-100/50 rounded-2xl border border-slate-200/60 overflow-x-auto scrollbar-none">
                    {['all', 'Guides', 'Technical', 'Compliance', 'HR'].map((cat) => (
                        <button
                            key={cat}
                            onClick={() => setSelectedCategory(cat === 'all' ? 'all' : cat)}
                            className={cn(
                                "h-11 px-6 rounded-xl text-xs font-bold uppercase tracking-widest transition-all min-w-max",
                                selectedCategory === (cat === 'all' ? 'all' : cat)
                                    ? "bg-white text-indigo-600 shadow-sm border border-slate-200/60"
                                    : "text-slate-500 hover:text-slate-900"
                            )}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Information Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
                {/* Protocol Feed */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="flex items-center justify-between px-2">
                        <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Operational Documentation</h2>
                        <span className="text-xs font-bold text-slate-400">{filteredArticles.length} results</span>
                    </div>

                    {filteredArticles.length > 0 ? (
                        <div className="space-y-4">
                            {filteredArticles.map((art) => (
                                <div key={art.id} className="glass-panel p-6 group cursor-pointer hover:translate-x-1">
                                    <div className="flex items-start gap-6">
                                        <div className="p-4 rounded-3xl bg-slate-50 group-hover:bg-indigo-50 transition-colors border border-slate-100 group-hover:border-indigo-100">
                                            <FileText className="w-8 h-8 text-slate-400 group-hover:text-indigo-600 transition-colors" />
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex flex-wrap items-center gap-3 mb-2">
                                                <Badge className="bg-slate-100 text-slate-600 text-[10px] font-bold border-none px-2 py-0.5 rounded-lg">
                                                    {art.type}
                                                </Badge>
                                                <span className="text-[10px] text-slate-400 font-black uppercase">• {art.viewCount} Insights</span>
                                            </div>
                                            <h3 className="text-xl font-bold text-slate-900 group-hover:text-indigo-600 transition-colors tracking-tight mb-2">
                                                {art.title}
                                            </h3>
                                            <p className="text-sm text-slate-500 font-medium line-clamp-2 leading-relaxed mb-4">
                                                {(art.content || '').replace(/[#*`]/g, '').substring(0, 180)}...
                                            </p>
                                            <div className="flex items-center text-[10px] font-black text-indigo-500 uppercase tracking-widest opacity-0 group-hover:opacity-100 -translate-x-2 group-hover:translate-x-0 transition-all">
                                                Full Disclosure <ChevronRight className="w-3.5 h-3.5 ml-1" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="glass-panel p-20 text-center flex flex-col items-center">
                            <div className="w-20 h-20 rounded-3xl bg-slate-50 flex items-center justify-center mb-6">
                                <Search className="w-10 h-10 text-slate-300" />
                            </div>
                            <h3 className="text-xl font-black text-slate-900 mb-2">Query Unsuccessful</h3>
                            <p className="text-slate-500 font-medium max-w-sm">No documentation matches your intelligence parameters. Try refining your search.</p>
                        </div>
                    )}
                </div>

                {/* Tactical Sidebar */}
                <div className="space-y-8">
                    {/* Featured Intelligence */}
                    <div className="glass-panel p-8 bg-slate-900 border-none relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-indigo-500/10 rounded-full -mr-20 -mt-20 blur-3xl" />
                        <h2 className="text-lg font-black text-white tracking-tight mb-6 relative z-10 flex items-center gap-3">
                            <TrendingUp className="w-5 h-5 text-indigo-400" />
                            Tactical FAQ
                        </h2>
                        <div className="space-y-5 relative z-10">
                            {[
                                { cat: 'Logistics', q: 'How to request a task deadline extension correctly?' },
                                { cat: 'Analytics', q: 'Weekly performance scoring breakdown explained.' }
                            ].map((f, i) => (
                                <div key={i} className="p-5 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/5 transition-colors cursor-pointer group">
                                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-2">{f.cat}</p>
                                    <p className="text-sm font-bold text-slate-100 leading-snug group-hover:text-white transition-colors">{f.q}</p>
                                </div>
                            ))}
                        </div>
                        <Button variant="ghost" className="w-full mt-6 text-[10px] font-black text-white hover:bg-white/5 border border-white/10 h-11 tracking-widest relative z-10">
                            VIEW INTELLIGENCE HUB
                        </Button>
                    </div>

                    {/* Trending Data */}
                    <div className="glass-panel p-8">
                        <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6">Trending Protocols</h2>
                        <div className="space-y-8">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="flex gap-5 group cursor-pointer">
                                    <span className="text-3xl font-black text-slate-100 group-hover:text-indigo-500 transition-colors leading-none">0{i}</span>
                                    <div className="flex-1">
                                        <p className="text-sm font-bold text-slate-800 group-hover:text-indigo-600 transition-colors line-clamp-2 leading-snug">
                                            {i === 1 ? 'Internal Security & Data Protection Protocol 2026' :
                                                i === 2 ? 'New Attendance & Leave Management for Field Staff' :
                                                    'Official Vendor Onboarding & Verification Guide'}
                                        </p>
                                        <div className="mt-2">
                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Protocol File</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
