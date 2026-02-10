'use client'

export default function ProductivityStats() {
    const deptData = [
        { name: 'Eng', completed: 45, pending: 12 },
        { name: 'Sales', completed: 32, pending: 5 },
        { name: 'Mktg', completed: 28, pending: 8 },
        { name: 'HR', completed: 15, pending: 2 },
        { name: 'Fin', completed: 22, pending: 4 },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {deptData.map((d) => (
                <div key={d.name} className="glass-panel p-6 text-center hover:border-primary/20 transition-all group">
                    <p className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-widest mb-2 group-hover:text-primary/60 transition-colors">{d.name}</p>
                    <h4 className="text-2xl font-black text-slate-800 tracking-tight">{d.completed + d.pending}</h4>
                    <div className="flex items-center justify-center gap-2 mt-4">
                        <div className="h-1 flex-1 bg-emerald-500/20 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500" style={{ width: `${(d.completed / (d.completed + d.pending)) * 100}%` }} />
                        </div>
                        <span className="text-[9px] font-black text-emerald-600 uppercase tracking-tighter">{Math.round((d.completed / (d.completed + d.pending)) * 100)}%</span>
                    </div>
                </div>
            ))}
        </div>
    );
}
