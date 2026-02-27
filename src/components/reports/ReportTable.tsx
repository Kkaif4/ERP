"use client";

import { useTranslation } from "@/lib/i18n";

interface Column {
    key: string;
    label: string;
    align?: "left" | "center" | "right";
    render?: (value: any, item: any) => React.ReactNode;
}

interface ReportTableProps {
    columns: Column[];
    data: any[];
    emptyMessage?: string;
}

export default function ReportTable({ columns, data, emptyMessage }: ReportTableProps) {
    const { t } = useTranslation();

    return (
        <div className="premium-card" style={{ overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr style={{ backgroundColor: "#f8fafc" }}>
                            {columns.map((col) => (
                                <th
                                    key={col.key}
                                    style={{
                                        padding: "16px 20px",
                                        textAlign: col.align || "left",
                                        fontSize: "10px",
                                        fontWeight: 900,
                                        color: "var(--text-muted)",
                                        textTransform: "uppercase",
                                        letterSpacing: "0.15em",
                                        borderBottom: "1px solid var(--border-main)"
                                    }}
                                >
                                    {col.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {data.length === 0 ? (
                            <tr>
                                <td colSpan={columns.length} style={{ padding: "4rem", textAlign: "center", color: "var(--text-muted)", fontSize: "14px", fontWeight: 700 }}>
                                    {emptyMessage || t("reports.noData")}
                                </td>
                            </tr>
                        ) : (
                            data.map((item, idx) => (
                                <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9", transition: "background 0.2s" }}
                                    onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "#fcfdfe"; }}
                                    onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "transparent"; }}>
                                    {columns.map((col) => (
                                        <td
                                            key={col.key}
                                            style={{
                                                padding: "16px 20px",
                                                textAlign: col.align || "left",
                                                fontSize: "14px",
                                                fontWeight: 700,
                                                color: "var(--text-main)"
                                            }}
                                        >
                                            {col.render ? col.render(item[col.key], item) : item[col.key]}
                                        </td>
                                    ))}
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
