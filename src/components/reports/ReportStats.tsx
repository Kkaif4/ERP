"use client";

import { LucideIcon } from "lucide-react";

interface StatItem {
    label: string;
    value: string | number;
    icon: LucideIcon;
    color: string;
    isCurrency?: boolean;
}

interface ReportStatsProps {
    stats: StatItem[];
}

export default function ReportStats({ stats }: ReportStatsProps) {
    return (
        <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "1.5rem"
        }}>
            {stats.map((stat, idx) => (
                <div key={idx} className="premium-card" style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <p style={{ margin: 0, fontSize: "10px", fontWeight: 900, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.2em" }}>
                            {stat.label}
                        </p>
                        <div style={{
                            width: "48px",
                            height: "48px",
                            backgroundColor: `${stat.color}15`,
                            borderRadius: "12px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: stat.color
                        }}>
                            <stat.icon size={24} />
                        </div>
                    </div>
                    <p style={{ margin: 0, fontSize: "1.875rem", fontWeight: 900, color: "var(--text-main)", letterSpacing: "-0.02em" }}>
                        {typeof stat.value === 'number'
                            ? (stat.isCurrency !== false ? `₹ ${stat.value.toLocaleString("en-IN")}` : stat.value.toLocaleString("en-IN"))
                            : stat.value}
                    </p>
                </div>
            ))}
        </div>
    );
}
