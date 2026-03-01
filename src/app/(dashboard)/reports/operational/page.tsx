"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "@/lib/i18n";
import {
    FileText, Download, Loader2,
    BarChart3, RefreshCcw,
    TrendingUp, User, ShoppingCart, CreditCard, ArrowLeft
} from "lucide-react";
import Link from "next/link";
import DateRangePicker from "@/components/reports/DateRangePicker";
import ReportStats from "@/components/reports/ReportStats";
import ReportTable from "@/components/reports/ReportTable";
import { toast } from "sonner";
import { openPrintWindow } from "@/lib/print";

export default function OperationalReportsPage() {
    const { t } = useTranslation();
    const [reportType, setReportType] = useState("FARMER_PURCHASE");
    const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
    const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
    const [loading, setLoading] = useState(false);
    const [data, setData] = useState<any[]>([]);
    const [summary, setSummary] = useState<any>(null);

    const reportTypes = [
        { id: "FARMER_PURCHASE", label: t("reports.types.FARMER_PURCHASE"), icon: User, color: "#15803d" },
        { id: "CUSTOMER_SALE", label: t("reports.types.CUSTOMER_SALE"), icon: ShoppingCart, color: "#0369a1" },
        { id: "PAYMENT_HISTORY", label: t("reports.types.PAYMENT_HISTORY"), icon: CreditCard, color: "#7c3aed" },
        { id: "EXPENSE_REPORT", label: t("reports.types.EXPENSE_REPORT"), icon: FileText, color: "#e11d48" },
        { id: "DAILY_SUMMARY", label: t("reports.types.DAILY_SUMMARY"), icon: BarChart3, color: "#ea580c" },
    ];

    const fetchReport = async () => {
        setLoading(true);
        setData([]);
        setSummary(null);
        try {
            const res = await fetch(`/api/reports/operational?type=${reportType}&startDate=${startDate}&endDate=${endDate}`);
            if (res.ok) {
                const result = await res.json();
                setData(result.data || []);
                setSummary(result.summary);
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
    }, [reportType, startDate, endDate]);

    const getColumns = () => {
        switch (reportType) {
            case "FARMER_PURCHASE":
            case "CUSTOMER_SALE":
                return [
                    {
                        key: "billNumber",
                        label: t("reports.table.billNumber"),
                        render: (v: string, item: any) => <Link href={`/bills/${item.id}`} className="text-emerald-600 hover:underline font-bold">{v}</Link>,
                        pdfValue: (v: string, item: any) => v
                    },
                    { key: "date", label: t("reports.table.date"), render: (v: string) => new Date(v).toLocaleDateString() },
                    { key: "party", label: t("reports.table.party") },
                    { key: "totalKg", label: t("reports.table.qtyKg"), align: "right" as const, render: (v: number) => v?.toFixed(2) || "0.00" },
                    { key: "totalUnits", label: t("reports.table.qtyUnits"), align: "right" as const, render: (v: number) => v?.toFixed(2) || "0.00" },
                    {
                        key: "othersAmount",
                        label: t("reports.table.others"),
                        align: "right" as const,
                        render: (v: number, item: any) => (
                            <div>
                                <div style={{ fontWeight: 800 }}>₹ {(v || 0).toLocaleString("en-IN")}</div>
                                {item.othersNote && <div style={{ fontSize: "10px", color: "var(--text-muted)", fontStyle: "italic" }}>{item.othersNote}</div>}
                            </div>
                        ),
                        pdfValue: (v: number, item: any) => `₹ ${(v || 0).toLocaleString("en-IN")} ${item.othersNote ? '(' + item.othersNote + ')' : ''}`
                    },
                    { key: "amount", label: t("reports.table.amount"), align: "right" as const, render: (v: number) => `₹ ${(v || 0).toLocaleString("en-IN")}` },
                ];
            case "PAYMENT_HISTORY":
                return [
                    { key: "date", label: t("reports.table.date"), render: (v: string) => new Date(v).toLocaleDateString() },
                    { key: "party", label: t("reports.table.party") },
                    { key: "amount", label: t("reports.table.amount"), align: "right" as const, render: (v: number) => `₹ ${(v || 0).toLocaleString("en-IN")}` },
                    { key: "mode", label: t("reports.table.mode") },
                    { key: "type", label: t("reports.table.type") },
                ];
            case "EXPENSE_REPORT":
                return [
                    { key: "date", label: t("reports.table.date"), render: (v: string) => new Date(v).toLocaleDateString() },
                    { key: "category", label: t("reports.table.category") },
                    { key: "amount", label: t("reports.table.amount"), align: "right" as const, render: (v: number) => `₹ ${(v || 0).toLocaleString("en-IN")}` },
                    { key: "mode", label: t("reports.table.mode") },
                    { key: "description", label: t("common.description") || "Description" },
                ];
            default:
                return [];
        }
    };

    const stats = summary ? [
        { label: reportType === "DAILY_SUMMARY" ? t("reports.types.DAILY_SUMMARY") : t("reports.totalAmount"), value: reportType === "DAILY_SUMMARY" ? summary.saleTotal : summary.totalAmount, icon: TrendingUp, color: "#15803d" },
        { label: t("reports.totalCount"), value: summary.count || summary.billsCount, icon: FileText, color: "#0369a1", isCurrency: false },
    ] : [];

    const handleDownloadPDF = () => {
        if (!summary) return;

        const reportLabel = reportTypes.find(r => r.id === reportType)?.label || "Report";
        let html = "";

        // Summary Stats HTML
        html += '<div class="stats-grid">';
        stats.forEach(s => {
            html += '<div class="stat-box">' +
                '<div class="stat-label">' + s.label + '</div>' +
                '<div class="stat-value">' + (typeof s.value === 'number' ? '₹ ' + (s.value || 0).toLocaleString("en-IN") : s.value) + '</div>' +
                '</div>';
        });
        html += '</div>';

        if (reportType === "DAILY_SUMMARY") {
            html += '<div style="display:grid; grid-template-columns: 1fr 1fr; gap: 30px;">' +
                '<div class="stat-box">' +
                '<h3 style="margin-top:0">' + t("reports.dailySummary.tradeSummary") + '</h3>' +
                '<p>' + t("reports.dailySummary.totalSales") + ': <strong>₹ ' + (summary.saleTotal || 0).toLocaleString("en-IN") + '</strong></p>' +
                '<p>' + t("reports.dailySummary.totalPurchases") + ': <strong>₹ ' + (summary.purchaseTotal || 0).toLocaleString("en-IN") + '</strong></p>' +
                '<p>' + t("reports.dailySummary.totalOthers") + ': <strong>₹ ' + (summary.othersTotal || 0).toLocaleString("en-IN") + '</strong></p>' +
                '</div>' +
                '<div class="stat-box">' +
                '<h3 style="margin-top:0">' + t("reports.dailySummary.expensesAndCashFlow") + '</h3>' +
                '<p>' + t("reports.dailySummary.paymentsReceived") + ': <strong>₹ ' + (summary.paymentsIn || 0).toLocaleString("en-IN") + '</strong></p>' +
                '<p>' + t("reports.dailySummary.paymentsPaid") + ': <strong>₹ ' + (summary.paymentsOut || 0).toLocaleString("en-IN") + '</strong></p>' +
                '<p>' + t("reports.dailySummary.businessExpenses") + ': <strong>₹ ' + (summary.expenseTotal || 0).toLocaleString("en-IN") + '</strong></p>' +
                '</div>' +
                '</div>';
        } else {
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
                    let value = "";
                    if (col.pdfValue) {
                        value = (col.pdfValue as any)(item[col.key], item);
                    } else if (typeof col.render === 'function') {
                        // Cast to any to avoid TS error on argument count
                        const rendered = (col.render as any)(item[col.key], item);
                        value = (typeof rendered === 'string' || typeof rendered === 'number') ? String(rendered) : String(item[col.key] || "");
                    } else {
                        value = String(item[col.key] || "");
                    }
                    html += '<td class="' + (col.align === 'right' ? 'text-right' : '') + '">' + value + '</td>';
                });
                html += '</tr>';
            });
            html += '</tbody></table>';
        }

        openPrintWindow(reportLabel + " (" + startDate + " to " + endDate + ")", html);
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
                            onMouseEnter={(e) => (e.currentTarget.style.color = "var(--primary-main)")}
                            onMouseLeave={(e) => (e.currentTarget.style.color = "var(--text-muted)")}
                        >
                            <ArrowLeft size={16} />
                            {t("common.back") || "BACK"}
                        </Link>
                    </div>
                    <h1 style={{ fontSize: "1.875rem", fontWeight: 900, color: "var(--text-main)", letterSpacing: "-0.02em", margin: 0 }}>
                        {t("reports.title")}
                    </h1>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "6px" }}>
                        <div style={{ height: "3px", width: "24px", backgroundColor: "var(--primary-main)", borderRadius: "2px" }} />
                        <p style={{ margin: 0, fontSize: "11px", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.15em" }}>
                            {t("reports.subtitle")}
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
                        style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px", backgroundColor: "var(--primary-main)", color: "#fff", borderRadius: "12px", border: "none", fontWeight: 800, fontSize: "12px", cursor: "pointer", opacity: (loading || !summary) ? 0.5 : 1 }}
                    >
                        <Download size={16} /> {t("common.downloadPdf") || "DOWNLOAD PDF"}
                    </button>
                </div>
            </div>

            {/* Config Section */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "1.5rem" }} className="report-config-grid">
                <div className="premium-card" style={{ padding: "1.5rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "1.25rem" }}>
                        <div style={{ width: "36px", height: "36px", backgroundColor: "var(--primary-glow)", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primary-main)" }}>
                            <BarChart3 size={18} />
                        </div>
                        <p style={{ margin: 0, fontSize: "10px", fontWeight: 900, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.2em" }}>
                            {t("reports.reportType")}
                        </p>
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
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

                <DateRangePicker
                    startDate={startDate}
                    endDate={endDate}
                    onStartChange={setStartDate}
                    onEndChange={setEndDate}
                />
            </div>

            {/* Stats */}
            {summary && <ReportStats stats={stats} />}

            {/* Data Table */}
            {reportType !== "DAILY_SUMMARY" && (
                <div style={{ position: "relative" }}>
                    {loading && (
                        <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(255,255,255,0.5)", backdropFilter: "blur(2px)", zIndex: 10, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "20px" }}>
                            <Loader2 size={32} className="animate-spin" color="var(--primary-main)" />
                        </div>
                    )}
                    <ReportTable columns={getColumns()} data={data} />
                </div>
            )}

            {/* Daily Summary Specific View */}
            {reportType === "DAILY_SUMMARY" && summary && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.5rem" }}>
                    <div className="premium-card" style={{ padding: "2rem" }}>
                        <h3 style={{ margin: "0 0 1.5rem", fontSize: "1.125rem", fontWeight: 900 }}>Sales vs Purchases</h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span style={{ fontWeight: 700, color: "#64748b" }}>Total Sales</span>
                                <span style={{ fontWeight: 900, color: "#0369a1" }}>₹ {summary.saleTotal?.toLocaleString("en-IN") || '0'}</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span style={{ fontWeight: 700, color: "#64748b" }}>Total Purchases</span>
                                <span style={{ fontWeight: 900, color: "#15803d" }}>₹ {summary.purchaseTotal?.toLocaleString("en-IN") || '0'}</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "0.5rem", borderTop: "1px solid #f1f5f9" }}>
                                <span style={{ fontWeight: 700, color: "#64748b" }}>{t("reports.dailySummary.totalOthers")}</span>
                                <span style={{ fontWeight: 900, color: "#64748b" }}>₹ {summary.othersTotal?.toLocaleString("en-IN") || '0'}</span>
                            </div>
                        </div>
                    </div>
                    <div className="premium-card" style={{ padding: "2rem" }}>
                        <h3 style={{ margin: "0 0 1.5rem", fontSize: "1.125rem", fontWeight: 900 }}>Cash Flow & Expenses</h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span style={{ fontWeight: 700, color: "#64748b" }}>Payments Received</span>
                                <span style={{ fontWeight: 900, color: "#7c3aed" }}>₹ {summary.paymentsIn?.toLocaleString("en-IN") || '0'}</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span style={{ fontWeight: 700, color: "#64748b" }}>Payments Paid</span>
                                <span style={{ fontWeight: 900, color: "#ea580c" }}>₹ {summary.paymentsOut?.toLocaleString("en-IN") || '0'}</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", paddingTop: "0.5rem", borderTop: "1px solid #f1f5f9" }}>
                                <span style={{ fontWeight: 700, color: "#64748b" }}>Business Expenses</span>
                                <span style={{ fontWeight: 900, color: "#e11d48" }}>₹ {summary.expenseTotal?.toLocaleString("en-IN") || '0'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
            .animate - spin { animation: spin 1s linear infinite; }
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    @media(max - width: 1024px) {
                    .report - config - grid { grid - template - columns: 1fr!important; }
    }
    `}</style>
        </div>
    );
}
