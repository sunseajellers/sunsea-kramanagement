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
            <div className="glass-card mb-4 p-4 md:p-6 text-center">
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

            {/* Main Content Column */}
            <div className="lg:col-span-3 space-y-12">
                <div className="space-y-6">
                    <h2 className="text-xl font-bold text-slate-900 border-l-4 border-primary pl-4">Latest Guides</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {loading ? (
                            <div className="text-center py-10 text-slate-400">Loading resources...</div>
                        ) : filteredArticles.length === 0 ? (
                            <div className="text-center py-10 text-slate-400">No guides found matching your search.</div>
                        ) : (
                            filteredArticles.map((article) => (
                                <div
                                    key={article.id}
                                    onClick={() => handleArticleClick(article)}
                                    className="glass-card p-5 md:p-6 flex gap-6 items-start hover:border-indigo-200 cursor-pointer transition-colors"
                                >
                                    <div className={cn(
                                        "h-12 w-12 md:h-14 md:w-14 rounded-xl flex items-center justify-center shrink-0",
                                        article.type === 'video' ? 'bg-rose-50 text-rose-500' : 'bg-indigo-50 text-indigo-500'
                                    )}>
                                        {article.type === 'video' ? <Video className="h-6 w-6 md:h-7 md:w-7" /> : <FileText className="h-6 h-6 md:h-7 md:w-7" />}
                                    </div>
                                    <div className="space-y-1.5 flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="secondary" className="bg-slate-100 text-slate-600 font-bold text-[9px] px-1.5 py-0">
                                                {article.category}
                                            </Badge>
                                            <span className="text-[10px] text-slate-400 font-bold">
                                                {article.updatedAt ? formatDistanceToNow(new Date(article.updatedAt), { addSuffix: true }) : ''}
                                            </span>
                                        </div>
                                        <h3 className="text-md font-bold text-slate-900 truncate">{article.title}</h3>
                                        <p className="text-slate-500 text-xs line-clamp-2">{article.excerpt}</p>
                                    </div>
                                    <ChevronRight className="h-4 w-4 text-slate-300 self-center" />
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Integrated FAQ Section */}
                {faqs.length > 0 && (
                    <div className="space-y-6">
                        <h2 className="text-xl font-bold text-slate-900 border-l-4 border-indigo-400 pl-4">Common Questions</h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {faqs.map((q) => (
                                <div
                                    key={q.id}
                                    className="flex items-center justify-between p-4 bg-white/50 border border-slate-100 rounded-xl hover:bg-white hover:shadow-md cursor-pointer transition-all group"
                                >
                                    <span className="text-sm font-bold text-slate-700">{q.question}</span>
                                    <ExternalLink className="h-4 w-4 text-slate-400 group-hover:text-primary transition-colors" />
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    )
}
