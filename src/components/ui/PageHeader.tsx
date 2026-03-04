import * as React from "react"

interface PageHeaderProps {
    title: string
    label: string
    action?: React.ReactNode
    color?: string
}

export function PageHeader({ title, label, action, color = "hsl(var(--primary))" }: PageHeaderProps) {
    return (
        <div className="flex flex-col gap-1 w-full mb-8">
            <div className="flex justify-between items-start">
                <h1 className="text-3xl font-black tracking-tighter text-foreground">{title}</h1>
                {action && <div className="mt-2">{action}</div>}
            </div>
            <div className="flex items-center gap-3">
                <div className="h-[3px] w-6 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">
                    {label}
                </span>
            </div>
        </div>
    )
}
