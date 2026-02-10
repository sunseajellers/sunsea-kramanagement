'use client';

import { useState } from 'react';
import KnowledgeBase from './KnowledgeBase';
import TicketBoard from './TicketBoard';
import {
    Headphones, Zap, Book
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function HelpdeskDashboard() {
    const [activeTab, setActiveTab] = useState<'tickets' | 'kb'>('tickets');

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Helpcenter & Support</h1>
                    <p className="text-slate-500 font-medium mt-1">Smart ticket routing and integrated knowledge base.</p>
                </div>

                {/* Navigation Tabs */}
                <div className="flex bg-slate-100/50 p-1 rounded-xl">
                    <button
                        onClick={() => setActiveTab('tickets')}
                        className={cn(
                            "px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2",
                            activeTab === 'tickets' ? "bg-white shadow-sm text-primary" : "text-slate-500 hover:text-slate-700"
                        )}
                    >
                        <Headphones className="w-3 h-3" />
                        My Tickets
                    </button>
                    <button
                        onClick={() => setActiveTab('kb')}
                        className={cn(
                            "px-4 py-2 text-xs font-bold rounded-lg transition-all flex items-center gap-2",
                            activeTab === 'kb' ? "bg-white shadow-sm text-primary" : "text-slate-500 hover:text-slate-700"
                        )}
                    >
                        <Book className="w-3 h-3" />
                        Knowledge Base
                    </button>
                </div>
            </div>

            {/* Content Area */}
            {activeTab === 'tickets' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2">
                        <TicketBoard />
                    </div>
                    <div className="space-y-6">
                        <div className="glass-panel p-6 bg-gradient-to-br from-indigo-600 to-indigo-800 text-white border-none">
                            <Zap className="w-8 h-8 text-indigo-200 mb-4" />
                            <h3 className="font-black text-lg mb-2">Smart Routing Active</h3>
                            <p className="text-xs text-indigo-100 leading-relaxed opacity-80">
                                Our AI analyzes your ticket content to instantly route it to the right department (Engineering, Finance, Support) and assign priority levels.
                            </p>
                        </div>
                        <div className="glass-panel p-6">
                            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Quick Links</h3>
                            <ul className="space-y-3">
                                {['Reset Password', 'Billing FAQ', 'API Documentation'].map(link => (
                                    <li key={link} className="flex items-center gap-2 text-sm text-slate-600 hover:text-primary cursor-pointer transition-colors">
                                        <Book className="w-3 h-3" />
                                        {link}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'kb' && <KnowledgeBase />}
        </div>
    );
}
