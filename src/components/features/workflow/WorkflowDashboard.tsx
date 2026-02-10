'use client'

import { } from 'react';
import WorkflowBoard from './WorkflowBoard';
import ProductivityStats from './ProductivityStats';
import { ListTodo } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function WorkflowDashboard() {
    return (
        <div className="space-y-10 animate-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Workflow & Productivity</h1>
                    <p className="text-slate-500 font-medium mt-1">Monitor cross-departmental tasks, optimize throughput, and track efficiency.</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" className="h-11 px-6 border-slate-200">
                        Workflow Logs
                    </Button>
                    <Button className="btn-primary h-11 px-6 shadow-lg shadow-primary/20">
                        <ListTodo className="w-4 h-4 mr-2" />
                        Configure Rules
                    </Button>
                </div>
            </div>

            {/* Main Stats */}
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-1 bg-indigo-500 rounded-full" />
                    <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">System Efficiency</h2>
                </div>
                <ProductivityStats />
            </div>

            {/* Workflow Board */}
            <div className="space-y-6">
                <div className="flex items-center gap-3">
                    <div className="h-8 w-1 bg-primary rounded-full" />
                    <h2 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">Production Board</h2>
                </div>
                <WorkflowBoard />
            </div>
        </div>
    );
}
