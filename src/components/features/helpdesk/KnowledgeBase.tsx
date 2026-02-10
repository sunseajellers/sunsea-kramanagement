'use client';

import { useState, useEffect } from 'react';
import { searchKB, seedKB } from '@/lib/helpdeskService';
import { KBArticle } from '@/types';
import { Search, BookOpen, ThumbsUp, Eye, Tag } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';

export default function KnowledgeBase() {
    const [articles, setArticles] = useState<KBArticle[]>([]);
    const [search, setSearch] = useState('');
    const [selectedArticle, setSelectedArticle] = useState<KBArticle | null>(null);

    useEffect(() => {
        // Seed data for demo purposes
        seedKB().then(() => loadArticles());
    }, []);

    const loadArticles = async (query?: string) => {
        const results = await searchKB(query);
        setArticles(results);
    };

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setSearch(val);
        loadArticles(val);
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-[500px]">
            {/* List & Search */}
            <div className="md:col-span-1 flex flex-col gap-4">
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Search specific guides..."
                        className="pl-9 bg-white"
                        value={search}
                        onChange={handleSearch}
                    />
                </div>
                <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                    {articles.map(article => (
                        <div
                            key={article.id}
                            onClick={() => setSelectedArticle(article)}
                            className={`p-4 rounded-xl cursor-pointer border transition-all ${selectedArticle?.id === article.id
                                    ? 'bg-primary/5 border-primary shadow-sm'
                                    : 'bg-white border-slate-100 hover:border-slate-300'
                                }`}
                        >
                            <h4 className="font-bold text-slate-900 text-sm mb-1">{article.title}</h4>
                            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                                <span className="bg-slate-100 px-1.5 py-0.5 rounded">{article.category}</span>
                                <span>•</span>
                                <span>{article.views} views</span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Content Viewer */}
            <Card className="md:col-span-2 p-6 overflow-y-auto bg-white border-none shadow-sm h-full">
                {selectedArticle ? (
                    <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                        <div className="border-b border-slate-100 pb-4">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="bg-primary/10 text-primary px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wider">
                                    {selectedArticle.category}
                                </span>
                                {selectedArticle.tags.map(tag => (
                                    <span key={tag} className="flex items-center text-xs text-slate-400">
                                        <Tag className="w-3 h-3 mr-1" />
                                        {tag}
                                    </span>
                                ))}
                            </div>
                            <h2 className="text-2xl font-black text-slate-900">{selectedArticle.title}</h2>
                        </div>

                        <div className="prose prose-sm max-w-none text-slate-600">
                            <p>{selectedArticle.content}</p>
                        </div>

                        <div className="flex items-center gap-4 pt-6 border-t border-slate-100 text-slate-400 text-xs font-bold uppercase tracking-wider">
                            <button className="flex items-center gap-2 hover:text-emerald-600 transition-colors">
                                <ThumbsUp className="w-4 h-4" />
                                Helpful ({selectedArticle.helpfulCount})
                            </button>
                            <div className="flex items-center gap-2">
                                <Eye className="w-4 h-4" />
                                {selectedArticle.views} Views
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-300">
                        <BookOpen className="w-16 h-16 mb-4 opacity-50" />
                        <p className="font-bold">Select an article to read</p>
                    </div>
                )}
            </Card>
        </div>
    );
}
