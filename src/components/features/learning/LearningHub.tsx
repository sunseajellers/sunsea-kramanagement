'use client'

import { useState, useEffect } from 'react'
import {
    Search,
    Video,
    FileText,
    ChevronRight,
    ExternalLink
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

import { getFeaturedArticles, getFAQs, seedLearningHubIfNeeded, Article, FAQ, incrementArticleView } from '@/lib/learningService'
import { formatDistanceToNow } from 'date-fns'

// Removed static FEATURED_ARTICLES

// Simple Academy Interface
export default function LearningHub() {
    const [searchQuery, setSearchQuery] = useState('')
    const [articles, setArticles] = useState<Article[]>([])
    const [faqs, setFaqs] = useState<FAQ[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const init = async () => {
            await seedLearningHubIfNeeded()
            const [fetchedArticles, fetchedFAQs] = await Promise.all([
                getFeaturedArticles(),
                getFAQs()
            ])
            setArticles(fetchedArticles)
            setFaqs(fetchedFAQs)
            setLoading(false)
        }
        init()
    }, [])

    const handleArticleClick = async (article: Article) => {
        await incrementArticleView(article.id)
        if (article.url) {
            window.open(article.url, '_blank')
        }
    }

    const filteredArticles = articles.filter(a =>
        a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        a.category.toLowerCase().includes(searchQuery.toLowerCase())
    )

    return (
        <div className="space-y-8">
            {/* Simple Search Header */}
            <div className="glass-card p-10 text-center space-y-4">
                <h1 className="text-3xl font-bold text-slate-900">Company Academy</h1>
                <p className="text-slate-500 max-w-xl mx-auto">Find guides, videos, and answers to your daily questions.</p>
                <div className="max-w-md mx-auto relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input
                        placeholder="Search for guides..."
                        className="w-full h-12 pl-12 rounded-xl bg-slate-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500/20 font-medium"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Simple Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Articles */}
                <div className="lg:col-span-2 space-y-6">
                    <h2 className="text-xl font-bold text-slate-900">Latest Guides</h2>
                    <div className="space-y-4">
                        {loading ? (
                            <div className="text-center py-10 text-slate-400">Loading resources...</div>
                        ) : filteredArticles.length === 0 ? (
                            <div className="text-center py-10 text-slate-400">No guides found matching your search.</div>
                        ) : (
                            filteredArticles.map((article) => (
                                <div
                                    key={article.id}
                                    onClick={() => handleArticleClick(article)}
                                    className="glass-card p-6 flex flex-col sm:flex-row gap-6 items-start hover:border-indigo-200 cursor-pointer transition-colors"
                                >
                                    <div className={cn(
                                        "h-16 w-16 rounded-xl flex items-center justify-center shrink-0",
                                        article.type === 'video' ? 'bg-rose-50 text-rose-500' : 'bg-indigo-50 text-indigo-500'
                                    )}>
                                        {article.type === 'video' ? <Video className="h-8 w-8" /> : <FileText className="h-8 w-8" />}
                                    </div>
                                    <div className="space-y-2 flex-1">
                                        <div className="flex gap-2">
                                            <Badge variant="secondary" className="bg-slate-100 text-slate-600 font-bold">
                                                {article.category}
                                            </Badge>
                                            <span className="text-xs text-slate-400 font-bold pt-1">
                                                {article.updatedAt ? formatDistanceToNow(new Date(article.updatedAt), { addSuffix: true }) : ''}
                                            </span>
                                        </div>
                                        <h3 className="text-lg font-bold text-slate-900">{article.title}</h3>
                                        <p className="text-slate-500 text-sm">{article.excerpt}</p>
                                    </div>
                                    <ChevronRight className="h-5 w-5 text-slate-300 self-center" />
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Simple Sidebar */}
                <div className="space-y-6">
                    <div className="glass-card p-6 bg-indigo-600 text-white">
                        <h2 className="text-xl font-bold mb-4">Common Questions</h2>
                        <div className="space-y-3">
                            {loading ? (
                                <div className="text-white/60 text-sm">Loading FAQs...</div>
                            ) : faqs.map((q) => (
                                <div key={q.id} className="flex items-center justify-between p-3 bg-white/10 rounded-lg hover:bg-white/20 cursor-pointer transition-colors">
                                    <span className="text-sm font-medium">{q.question}</span>
                                    <ExternalLink className="h-4 w-4 opacity-70" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
