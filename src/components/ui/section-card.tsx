import { ReactNode } from 'react'

interface SectionCardProps {
    title: string
    subtitle?: string
    children: ReactNode
    action?: ReactNode
}

export function SectionCard({ title, subtitle, children, action }: SectionCardProps) {
    return (
        <div className="glass-panel p-8 space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="section-title text-xl">{title}</h3>
                    {subtitle && <p className="section-subtitle">{subtitle}</p>}
                </div>
                {action && <div>{action}</div>}
            </div>
            {children}
        </div>
    )
}
