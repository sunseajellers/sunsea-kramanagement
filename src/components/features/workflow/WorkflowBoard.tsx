'use client'

import { useState, useEffect, useMemo } from 'react'
import { Task, TaskStatus } from '@/types'
import { getAllTasks } from '@/lib/taskService'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Loader2, Plus, MoreVertical, Calendar, LayoutGrid, Building2, Filter } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import toast from 'react-hot-toast'

const STATUS_COLUMNS: { id: TaskStatus; label: string; color: string }[] = [
    { id: 'not_started', label: 'Backlog', color: 'bg-slate-100 text-slate-600' },
    { id: 'assigned', label: 'Todo', color: 'bg-blue-50 text-blue-600' },
    { id: 'in_progress', label: 'In Progress', color: 'bg-amber-50 text-amber-600' },
    { id: 'pending_review', label: 'Review', color: 'bg-purple-50 text-purple-600' },
    { id: 'completed', label: 'Completed', color: 'bg-emerald-50 text-emerald-600' },
];

export default function WorkflowBoard() {
    const [tasks, setTasks] = useState<Task[]>([])
    const [loading, setLoading] = useState(true)
    const [activeView, setActiveView] = useState<'status' | 'department'>('status')

    useEffect(() => {
        loadTasks()
    }, [])

    const loadTasks = async () => {
        try {
            setLoading(true)
            const data = await getAllTasks()
            setTasks(data)
        } catch (error) {
            toast.error('Failed to load workflow data')
        } finally {
            setLoading(false)
        }
    }

    const departments = useMemo(() => {
        const depts = new Set(tasks.map(t => t.department).filter(Boolean))
        return Array.from(depts) as string[]
    }, [tasks])

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="w-8 h-8 animate-spin text-primary/40" />
                <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Loading Workflow...</p>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between glass-panel p-2 px-4 h-16">
                <Tabs value={activeView} onValueChange={(v: any) => setActiveView(v)} className="w-auto">
                    <TabsList className="bg-transparent gap-2">
                        <TabsTrigger value="status" className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-xl text-[10px] font-black uppercase tracking-widest h-10 px-6">
                            <LayoutGrid className="w-4 h-4 mr-2" />
                            Status Board
                        </TabsTrigger>
                        <TabsTrigger value="department" className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-xl text-[10px] font-black uppercase tracking-widest h-10 px-6">
                            <Building2 className="w-4 h-4 mr-2" />
                            By Department
                        </TabsTrigger>
                    </TabsList>
                </Tabs>

                <div className="flex items-center gap-3">
                    <Button variant="outline" className="h-10 text-[10px] font-black uppercase tracking-widest">
                        <Filter className="w-4 h-4 mr-2" />
                        Filter
                    </Button>
                    <Button className="btn-primary h-10 px-6 shadow-lg shadow-primary/20">
                        <Plus className="w-4 h-4 mr-2" />
                        New Task
                    </Button>
                </div>
            </div>

            {activeView === 'status' ? (
                <div className="flex gap-6 overflow-x-auto pb-6 scroll-panel min-h-[600px]">
                    {STATUS_COLUMNS.map((col) => {
                        const colTasks = tasks.filter(t => t.status === col.id)
                        return (
                            <div key={col.id} className="flex-shrink-0 w-80 space-y-4">
                                <div className="flex items-center justify-between px-2">
                                    <div className="flex items-center gap-2">
                                        <span className={cn(
                                            "px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-widest border",
                                            col.color
                                        )}>
                                            {col.label}
                                        </span>
                                        <span className="text-[10px] font-bold text-muted-foreground bg-muted w-6 h-6 flex items-center justify-center rounded-full">
                                            {colTasks.length}
                                        </span>
                                    </div>
                                </div>
                                <div className="space-y-4 min-h-[500px] bg-slate-50/50 rounded-3xl p-3 border border-dashed border-slate-200">
                                    {colTasks.map((task) => (
                                        <TaskCard key={task.id} task={task} />
                                    ))}
                                </div>
                            </div>
                        )
                    })}
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                    {departments.map((dept) => {
                        const deptTasks = tasks.filter(t => t.department === dept)
                        return (
                            <div key={dept} className="glass-panel p-6 flex flex-col h-full">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black text-xs">
                                            {dept.substring(0, 2).toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="font-black text-slate-900 tracking-tight">{dept}</h3>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{deptTasks.length} ACTIVE WORKFLOWS</p>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground">
                                        <MoreVertical className="h-4 w-4" />
                                    </Button>
                                </div>
                                <div className="space-y-4 flex-1">
                                    {deptTasks.slice(0, 5).map((task) => (
                                        <div key={task.id} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100 hover:border-primary/20 transition-all group">
                                            <div className="flex-1 min-w-0">
                                                <p className="text-xs font-bold text-slate-700 truncate">{task.title}</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className={cn(
                                                        "text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded border",
                                                        task.priority === 'high' || task.priority === 'critical' ? "bg-rose-50 text-rose-600 border-rose-100" : "bg-slate-100 text-slate-500 border-slate-200"
                                                    )}>
                                                        {task.priority}
                                                    </span>
                                                </div>
                                            </div>
                                            <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Plus className="h-3.5 w-3.5" />
                                            </Button>
                                        </div>
                                    ))}
                                    {deptTasks.length > 5 && (
                                        <Button variant="ghost" className="w-full text-[9px] font-black uppercase tracking-widest text-primary/60 hover:text-primary">
                                            + {deptTasks.length - 5} More Tasks
                                        </Button>
                                    )}
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}

function TaskCard({ task }: { task: Task }) {
    return (
        <Card className="p-4 bg-white shadow-sm hover:shadow-md transition-all border-slate-100 group">
            <div className="flex justify-between items-start mb-3">
                <Badge variant="outline" className={cn(
                    "text-[8px] font-black uppercase tracking-widest h-5 px-2",
                    task.priority === 'high' || task.priority === 'critical' ? "bg-rose-50 text-rose-600 border-rose-100" : "bg-slate-50 text-slate-500 border-slate-100"
                )}>
                    {task.priority}
                </Badge>
                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreVertical className="h-3 w-3" />
                </Button>
            </div>

            <h4 className="font-bold text-xs text-slate-900 mb-3 line-clamp-2 leading-relaxed">
                {task.title}
            </h4>

            <div className="space-y-3">
                <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                        {task.assignedTo.slice(0, 3).map((id) => (
                            <div key={id} className="w-6 h-6 rounded-full bg-slate-100 border-2 border-white flex items-center justify-center text-[8px] font-black uppercase text-slate-400">
                                {id.substring(0, 1)}
                            </div>
                        ))}
                    </div>
                    {task.assignedTo.length > 3 && (
                        <span className="text-[9px] font-bold text-slate-400">+{task.assignedTo.length - 3}</span>
                    )}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-slate-50">
                    <div className="flex items-center gap-1 text-[9px] font-bold text-muted-foreground uppercase">
                        <Calendar className="w-3 h-3 opacity-40" />
                        {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                </div>
            </div>
        </Card>
    )
}
