"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "@/lib/i18n";
import {
    Landmark, Download, Loader2,
    RefreshCcw, Wallet,
    ArrowUpCircle, ArrowDownCircle, Users, UserSearch, ArrowLeft
} from "lucide-react";
import Link from "next/link";
import ReportStats from "@/components/reports/ReportStats";
import ReportTable from "@/components/reports/ReportTable";
import { toast } from "sonner";

export default function FinancialReportsPage() {
    const { t } = useTranslation();
    const [reportType, setReportType] = useState("OUTSTANDING_PAYABLES");
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any[]>([]);
    const [summary, setSummary] = useState<any>(null);

    const reportTypes = [
        { id: "OUTSTANDING_PAYABLES", label: t("reports.types.OUTSTANDING_PAYABLES"), icon: Users, color: "#b45309" },
        { id: "OUTSTANDING_RECEIVABLES", label: t("reports.types.OUTSTANDING_RECEIVABLES"), icon: UserSearch, color: "#dc2626" },
    ];

    const fetchReport = async () => {
        setLoading(true);
        setData([]);
        setSummary(null);
        try {
            const res = await fetch(`/api/reports/financial?type=${reportType}`);
            if (res.ok) {
                const result = await res.json();
                setData(result.data || []);
                setSummary(result.summary);
            } else if (res.status === 403) {
                toast.error("Admin access required");
            } else {
                toast.error(t("common.error"));
            }
        } catch (error) {
            toast.error(t("common.error"));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReport();
    }, [reportType]);

    const getColumns = () => {
        return [
            { key: "party", label: t("reports.table.party") },
            { key: "mobile", label: t("common.mobile") || "Mobile" },
            { key: "amount", label: t("reports.table.amount"), align: "right" as const, render: (v: number) => `₹ ${v.toLocaleString("en-IN")}` },
        ];
    };

    const stats = summary ? [
        {
            label: reportType === "OUTSTANDING_PAYABLES" ? t("reports.types.OUTSTANDING_PAYABLES") : t("reports.types.OUTSTANDING_RECEIVABLES"),
            value: summary.totalAmount,
            icon: reportType === "OUTSTANDING_PAYABLES" ? ArrowUpCircle : ArrowDownCircle,
            color: reportType === "OUTSTANDING_PAYABLES" ? "#b45309" : "#dc2626"
        },
        { label: t("reports.totalCount"), value: summary.count, icon: Wallet, color: "#0369a1", isCurrency: false },
    ] : [];

    const handleDownloadPDF = () => {
        if (!summary) return;

        const reportLabel = reportTypes.find(r => r.id === reportType)?.label || "Financial Report";
        let html = "";

        // Summary Stats HTML
        html += '<div class="stats-grid">';
        stats.forEach(s => {
            html += '<div class="stat-box">' +
                '<div class="stat-label">' + s.label + '</div>' +
                '<div class="stat-value">₹ ' + s.value.toLocaleString("en-IN") + '</div>' +
                '</div>';
        });
        html += '</div>';

        // Table HTML
        const columns = getColumns();
        html += '<table><thead><tr>';
        columns.forEach(col => {
            html += '<th>' + col.label + '</th>';
        });
        html += '</tr></thead><tbody>';

        data.forEach(item => {
            html += '<tr>';
            columns.forEach(col => {
                const renderFn = col.render as ((v: any) => string) | undefined;
                const value = renderFn ? renderFn(item[col.key]) : item[col.key];
                html += '<td class="' + (col.align === 'right' ? 'text-right' : '') + '">' + value + '</td>';
            });
            html += '</tr>';
        });
        html += '</tbody></table>';

    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
                <div>
                    <div style={{ marginBottom: "1rem" }}>
                        <Link
                            href="/reports"
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "8px",
                                color: "var(--text-muted)",
                                fontSize: "12px",
                                fontWeight: 800,
                                textDecoration: "none",
                                textTransform: "uppercase",
                                letterSpacing: "0.1em",
                                transition: "all 0.2s"
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = "#7c3aed")}
                            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
                        >
                            <ArrowLeft size={16} />
                            {t("common.back") || "BACK"}
                        </Link>
                    </div>
                    <h1 style={{ fontSize: "1.875rem", fontWeight: 900, color: "var(--text-main)", letterSpacing: "-0.02em", margin: 0 }}>
                        {t("reports.types.financial")}
                    </h1>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "6px" }}>
                        <div style={{ height: "3px", width: "24px", backgroundColor: "#7c3aed", borderRadius: "2px" }} />
                        <p style={{ margin: 0, fontSize: "11px", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.15em" }}>
                            {t("reports.desc.financial")}
                        </p>
                    </div>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                    <button
                        onClick={fetchReport}
                        style={{ padding: "10px", backgroundColor: "#f8fafc", border: "1px solid var(--border-main)", borderRadius: "12px", color: "var(--text-muted)", cursor: "pointer" }}
                    >
                        <RefreshCcw size={18} className={loading ? "animate-spin" : ""} />
                    </button>
                    <button
                        onClick={handleDownloadPDF}
                        disabled={loading || !summary}
                        style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px", backgroundColor: "#7c3aed", color: "#fff", borderRadius: "12px", border: "none", fontWeight: 800, fontSize: "12px", cursor: "pointer", opacity: (loading || !summary) ? 0.5 : 1 }}
                    >
                        <Download size={16} /> {t("common.downloadPdf") || "DOWNLOAD PDF"}
                    </button>
                </div>
            </div>

            {/* Config Section */}
            <div className="premium-card" style={{ padding: "1.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "1.25rem" }}>
                    <div style={{ width: "36px", height: "36px", backgroundColor: "rgba(124, 58, 237, 0.1)", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", color: "#7c3aed" }}>
                        <Landmark size={18} />
                    </div>
                    <p style={{ margin: 0, fontSize: "10px", fontWeight: 900, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.2em" }}>
                        {t("reports.reportType")}
                    </p>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px" }}>
                    {reportTypes.map((type) => (
                        <button
                            key={type.id}
                            onClick={() => setReportType(type.id)}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "12px",
                                padding: "16px",
                                backgroundColor: reportType === type.id ? `${type.color}10` : "#f8fafc",
                                border: reportType === type.id ? `2px solid ${type.color}` : "2px solid transparent",
                                borderRadius: "16px",
                                cursor: "pointer",
                                transition: "all 0.2s",
                                textAlign: "left"
                            }}
                        >
                            <div style={{
                                width: "32px",
                                height: "32px",
                                backgroundColor: reportType === type.id ? type.color : "#e2e8f0",
                                borderRadius: "8px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                color: "#fff"
                            }}>
                                <type.icon size={16} />
                            </div>
                            <span style={{ fontSize: "13px", fontWeight: 800, color: reportType === type.id ? "var(--text-main)" : "#64748b" }}>
                                {type.label}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            {/* Stats */}
            {summary && <ReportStats stats={stats} />}

            {/* Data Table */}
            <div style={{ position: "relative" }}>
                {loading && (
                    <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(255,255,255,0.5)", backdropFilter: "blur(2px)", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "20px" }}>
                        <Loader2 size={32} className="animate-spin" color="#7c3aed" />
                    </div>
                )}
                <ReportTable columns={getColumns()} data={data} />
            </div>

            <style>{`
                .animate-spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}
