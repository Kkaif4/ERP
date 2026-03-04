"use client";

import { useState, useEffect } from "react";
import {
    Plus,
    Search,
    ChevronRight,
    ArrowUpRight,
    ArrowDownLeft,
    Clock,
    User,
    ArrowRight,
    X
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import Link from "next/link";
import { toast } from "sonner";
import { fmtDate, fmtDateShort } from "@/lib/dateUtils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface Bill {
    id: string;
    billNumber: string;
    type: "PURCHASE" | "SALE";
    party: string;
    netTotal: number;
    billDate: string;
}

export default function BillsPage() {
    const { t, language } = useTranslation();
    const [bills, setBills] = useState<Bill[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<"ALL" | "PURCHASE" | "SALE">("ALL");
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState(search);
    const [dateSort, setDateSort] = useState<"asc" | "desc">("desc");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");

    const [pagination, setPagination] = useState({ totalPages: 1, page: 1, total: 0 });

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setPagination(p => ({ ...p, page: 1 }));
        }, 400);
        return () => clearTimeout(timer);
    }, [search]);

    useEffect(() => {
        const controller = new AbortController();
        const fetchBills = async () => {
            setLoading(true);
            try {
                const url = `/api/bills?type=${filter}&search=${encodeURIComponent(debouncedSearch)}&page=${pagination.page}${fromDate ? `&startDate=${fromDate}` : ""}${toDate ? `&endDate=${toDate}` : ""}&sort=${dateSort}`;
                const r = await fetch(
                    url,
                    { signal: controller.signal }
                );
                if (!r.ok) throw new Error("Fetch failed");
                const res = await r.json();
                setBills(res.data);
                setPagination(prev => ({
                    ...prev,
                    totalPages: res.pagination.totalPages,
                    total: res.pagination.total
                }));
            } catch (err: any) {
                if (err.name === 'AbortError') return;
                console.error("Bills fetch error:", err);
                toast.error("Failed to load bills history");
            } finally {
                setLoading(false);
            }
        };
        fetchBills();
        return () => controller.abort();
    }, [filter, debouncedSearch, pagination.page, fromDate, toDate, dateSort]);

    const activeDate = new Date().toLocaleDateString(language === "hi" ? "hi-IN" : language === "mr" ? "mr-IN" : "en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
    });

    const handlePageChange = (newPage: number) => {
        setPagination(prev => ({ ...prev, page: newPage }));
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>

            {/* --- Header Section (Dashboard Style) --- */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "1.5rem" }}>
                <div>
                    <h1 style={{ fontSize: "1.875rem", fontWeight: 900, color: "var(--text-main)", letterSpacing: "-0.02em", margin: 0, lineHeight: 1.2 }}>
                        {t("nav.bills")}
                    </h1>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "6px" }}>
                        <div style={{ height: "3px", width: "24px", backgroundColor: "var(--primary-main)", borderRadius: "2px" }} />
                        <p style={{ margin: 0, fontSize: "11px", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.15em", display: "flex", alignItems: "center", gap: "6px" }}>
                            <Clock size={12} />
                            {activeDate}
                        </p>
                    </div>
                </div>

                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                    <Link
                        href="/bills/purchase/new"
                        className="quick-action-btn purchase"
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "12px 24px",
                            backgroundColor: "var(--primary-main)",
                            color: "#fff",
                            borderRadius: "14px",
                            fontWeight: 800,
                            fontSize: "14px",
                            textDecoration: "none",
                            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                            boxShadow: "0 10px 15px -3px rgba(21, 128, 61, 0.25)"
                        }}
                    >
                        <Plus size={18} strokeWidth={3} />
                        {t("dashboard.purchaseBill")}
                    </Link>
                    <Link
                        href="/bills/sale/new"
                        className="quick-action-btn sale"
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "12px 24px",
                            backgroundColor: "#0369a1",
                            color: "#fff",
                            borderRadius: "14px",
                            fontWeight: 800,
                            fontSize: "14px",
                            textDecoration: "none",
                            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                            boxShadow: "0 10px 15px -3px rgba(3, 105, 161, 0.25)"
                        }}
                    >
                        <Plus size={18} strokeWidth={3} />
                        {t("dashboard.saleBill")}
                    </Link>
                </div>
            </div>

            {/* --- Filters & Search Area (Premium Card Style) --- */}
            <div className="premium-card" style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "1.5rem" }}>

                    {/* Filter Tabs */}
                    <div style={{ display: "flex", backgroundColor: "#f1f5f9", padding: "4px", borderRadius: "14px", gap: "4px" }}>
                        {(["ALL", "PURCHASE", "SALE"] as const).map((opt) => (
                            <button
                                key={opt}
                                onClick={() => { setFilter(opt); setPagination(p => ({ ...p, page: 1 })); }}
                                style={{
                                    border: "none",
                                    padding: "10px 20px",
                                    borderRadius: "10px",
                                    fontSize: "11px",
                                    fontWeight: 800,
                                    textTransform: "uppercase",
                                    letterSpacing: "0.1em",
                                    cursor: "pointer",
                                    transition: "all 0.2s ease",
                                    backgroundColor: filter === opt ? "#fff" : "transparent",
                                    color: filter === opt ? "var(--text-main)" : "var(--text-muted)",
                                    boxShadow: filter === opt ? "0 4px 6px -1px rgba(0,0,0,0.05)" : "none"
                                }}
                            >
                                {opt === "ALL" ? t("common.all") || "All Bills" : opt === "PURCHASE" ? t("bills.purchase.title") : t("bills.sale.title")}
                            </button>
                        ))}
                    </div>

                    {/* Search Input */}
                    <div style={{ flex: 1, minWidth: "260px", position: "relative" }}>
                        <Search style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} size={18} />
                        <input
                            type="text"
                            placeholder="Find by Bill # or Party Name..."
                            style={{
                                width: "100%",
                                padding: "14px 14px 14px 56px",
                                backgroundColor: "#f8fafc",
                                border: "1px solid var(--border-main)",
                                borderRadius: "16px",
                                fontSize: "14px",
                                fontWeight: 700,
                                color: "var(--text-main)",
                                outline: "none",
                                transition: "all 0.2s ease",
                                boxShadow: "inset 0 2px 4px 0 rgba(0,0,0,0.02)"
                            }}
                            className="focus:ring-2 focus:ring-emerald-500/10 focus:border-emerald-500/50"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>

                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            <span style={{ fontSize: "10px", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase" }}>{t("common.from") || "From"}</span>
                            <input
                                type="date"
                                value={fromDate}
                                onChange={(e) => setFromDate(e.target.value)}
                                style={{ padding: "8px", borderRadius: "10px", border: "1.5px solid var(--border-main)", fontSize: "12px", fontWeight: 700, outline: "none" }}
                            />
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            <span style={{ fontSize: "10px", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase" }}>{t("common.to") || "To"}</span>
                            <input
                                type="date"
                                value={toDate}
                                onChange={(e) => setToDate(e.target.value)}
                                style={{ padding: "8px", borderRadius: "10px", border: "1.5px solid var(--border-main)", fontSize: "12px", fontWeight: 700, outline: "none" }}
                            />
                        </div>
                        {(fromDate || toDate) && (
                            <button
                                onClick={() => { setFromDate(""); setToDate(""); }}
                                style={{ padding: "8px", borderRadius: "10px", border: "none", backgroundColor: "#f1f5f9", color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                                title="Clear dates"
                            >
                                <X size={14} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* --- Bills History List --- */}
            <div className="premium-card overflow-hidden">

                {/* Desktop View (Table) */}
                <div className="hidden lg:block border border-gray-200 rounded-none overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-gray-100 border-b-2 border-gray-300 sticky top-0 z-10">
                                {[
                                    { label: t("common.billNumber"), key: "billNo" },
                                    { label: t("common.party"), key: "party" },
                                    { label: t("common.type"), key: "type" },
                                    { label: t("common.amount"), key: "amount", align: "right" as const },
                                    { label: t("common.date"), key: "date", align: "right" as const },
                                    { label: "", key: "actions", width: "40px" }
                                ].map((h, idx) => (
                                    <TableHead
                                        key={h.key}
                                        onClick={h.key === "date" ? () => setDateSort(s => s === "asc" ? "desc" : "asc") : undefined}
                                        className={cn(
                                            "h-10 px-4 text-[11px] font-semibold uppercase tracking-wider text-gray-600 border-r border-gray-200 last:border-r-0 whitespace-nowrap",
                                            h.align === "right" && "text-right",
                                            h.key === "date" && "cursor-pointer select-none",
                                            h.key === "actions" && "w-[40px]"
                                        )}
                                    >
                                        <div className={cn(
                                            "flex items-center gap-1",
                                            h.align === "right" ? "justify-end" : "justify-start"
                                        )}>
                                            {h.label}
                                            {h.key === "date" && (
                                                <span className={cn("text-xs", dateSort === "desc" ? "text-blue-600" : "text-gray-400")}>
                                                    {dateSort === "desc" ? "↓" : "↑"}
                                                </span>
                                            )}
                                        </div>
                                    </TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <TableRow key={i} className="border-b border-gray-200">
                                        <TableCell colSpan={6} className="p-4">
                                            <div className="h-4 bg-gray-50 rounded w-full animate-pulse" />
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : bills.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-20 text-gray-400 font-medium">
                                        {t("bills.noBills") || "No bills found."}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                bills.map((bill) => (
                                    <TableRow
                                        key={bill.id}
                                        className="even:bg-gray-50/50 odd:bg-white hover:bg-blue-50/30 transition-colors border-b border-gray-200 last:border-b-0 cursor-pointer"
                                        onClick={() => window.location.href = `/bills/${bill.id}`}
                                    >
                                        <TableCell className="border-r border-gray-200">
                                            <Link
                                                href={`/bills/${bill.id}`}
                                                className={cn(
                                                    "text-[14px] font-bold tracking-tight hover:underline transition-colors",
                                                    bill.type === 'PURCHASE' ? "text-emerald-700" : "text-blue-700"
                                                )}
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                {bill.billNumber}
                                            </Link>
                                        </TableCell>
                                        <TableCell className="border-r border-gray-200">
                                            <span className="text-[14px] font-bold text-gray-900">{bill.party}</span>
                                        </TableCell>
                                        <TableCell className="border-r border-gray-200">
                                            <span className={cn(
                                                "text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider",
                                                bill.type === 'PURCHASE' ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-blue-50 text-blue-700 border-blue-200"
                                            )}>
                                                {bill.type}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-right font-bold text-[14px] text-gray-900 tabular-nums border-l border-gray-200 bg-gray-50/30">
                                            <span className="text-[11px] font-medium text-gray-400 mr-0.5">₹</span>
                                            {bill.netTotal.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                        </TableCell>
                                        <TableCell className="text-right text-[12px] font-bold text-gray-500 border-l border-gray-200">
                                            {fmtDate(bill.billDate)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <ChevronRight size={14} className="text-gray-300 group-hover:text-blue-500 transition-colors inline" />
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>

                {/* Mobile View (Card List) */}
                <div className="lg:hidden divide-y divide-slate-100">
                    {loading ? (
                        Array.from({ length: 3 }).map((_, i) => (
                            <div key={i} style={{ padding: "1.25rem", animation: "pulse 1.5s infinite" }}>
                                <div style={{ height: "16px", backgroundColor: "#f1f5f9", borderRadius: "8px", width: "40%", marginBottom: "1rem" }} />
                                <div style={{ height: "12px", backgroundColor: "#f1f5f9", borderRadius: "6px", width: "80%" }} />
                            </div>
                        ))
                    ) : bills.length === 0 ? (
                        <div style={{ textAlign: "center", padding: "4rem 2rem" }}>
                            <p style={{ fontWeight: 800, color: "var(--text-muted)" }}>No transactions to show.</p>
                        </div>
                    ) : (
                        bills.map((bill) => (
                            <Link key={bill.id} href={`/bills/${bill.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                                <div style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }} className="active:bg-slate-50 transition-colors">
                                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                            <div style={{ width: "36px", height: "36px", borderRadius: "10px", display: "flex", alignItems: "center", justifyItems: "center", backgroundColor: bill.type === 'PURCHASE' ? "rgba(21, 128, 61, 0.08)" : "rgba(3, 105, 161, 0.08)", color: bill.type === 'PURCHASE' ? "var(--primary-main)" : "#0369a1", paddingLeft: "10px" }}>
                                                {bill.type === 'PURCHASE' ? <ArrowDownLeft size={16} /> : <ArrowUpRight size={16} />}
                                            </div>
                                            <div>
                                                <p style={{ fontSize: "13px", fontWeight: 900, color: "var(--text-main)", textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>{bill.billNumber}</p>
                                                <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", margin: 0 }}>
                                                    {fmtDateShort(bill.billDate)}
                                                </p>
                                            </div>
                                        </div>
                                        <div style={{ textAlign: "right" }}>
                                            <p style={{ fontSize: "15px", fontWeight: 950, color: "var(--text-main)", margin: 0 }}>
                                                ₹ {bill.netTotal.toLocaleString("en-IN")}
                                            </p>
                                            <span style={{ fontSize: "9px", fontWeight: 900, textTransform: "uppercase", color: bill.type === 'PURCHASE' ? "var(--primary-main)" : "#0369a1", opacity: 0.8 }}>
                                                {bill.type === 'PURCHASE' ? 'PURCHASE' : 'SALE'}
                                            </span>
                                        </div>
                                    </div>

                                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", backgroundColor: "#f8fafc", padding: "10px 14px", borderRadius: "12px" }}>
                                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                            <User size={14} className="text-slate-400" />
                                            <span style={{ fontSize: "13px", fontWeight: 800, color: "var(--text-main)" }}>{bill.party}</span>
                                        </div>
                                        <ArrowRight size={14} className="text-slate-300" />
                                    </div>
                                </div>
                            </Link>
                        ))
                    )}
                </div>

                {/* Pagination Controls */}
                {!loading && bills.length > 0 && pagination.totalPages > 1 && (
                    <div style={{ padding: "1.25rem 1.75rem", borderTop: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between", backgroundColor: "#fff" }}>
                        <p style={{ margin: 0, fontSize: "12px", fontWeight: 700, color: "var(--text-muted)" }}>
                            {t("common.pagination.status", { page: pagination.page, total: pagination.totalPages, count: pagination.total })}
                        </p>
                        <div style={{ display: "flex", gap: "0.5rem" }}>
                            <button
                                onClick={() => handlePageChange(Math.max(1, pagination.page - 1))}
                                disabled={pagination.page === 1}
                                style={{
                                    padding: "8px 16px", borderRadius: "10px", border: "1px solid var(--border-main)", backgroundColor: pagination.page === 1 ? "#f8fafc" : "#fff",
                                    fontSize: "12px", fontWeight: 800, color: pagination.page === 1 ? "#cbd5e1" : "var(--text-main)", cursor: pagination.page === 1 ? "not-allowed" : "pointer",
                                    transition: "all 0.2s"
                                }}
                            >
                                {t("common.pagination.previous")}
                            </button>
                            <button
                                onClick={() => handlePageChange(Math.min(pagination.totalPages, pagination.page + 1))}
                                disabled={pagination.page === pagination.totalPages}
                                style={{
                                    padding: "8px 16px", borderRadius: "10px", border: "1px solid var(--border-main)", backgroundColor: pagination.page === pagination.totalPages ? "#f8fafc" : "#fff",
                                    fontSize: "12px", fontWeight: 800, color: pagination.page === pagination.totalPages ? "#cbd5e1" : "var(--text-main)", cursor: pagination.page === pagination.totalPages ? "not-allowed" : "pointer",
                                    transition: "all 0.2s"
                                }}
                            >
                                {t("common.pagination.next")}
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <style jsx>{`
                    @keyframes pulse {
                        0%, 100% { opacity: 1; }
                        50% { opacity: 0.5; }
                    }
                    .quick-action-btn:hover {
                        transform: translateY(-2px);
                    }
                    .quick-action-btn:active {
                        transform: translateY(0) scale(0.98);
                    }
                    .purchase:hover {
                        background-color: var(--color-primary-dark) !important;
                        box-shadow: 0 12px 20px -5px rgba(21, 128, 61, 0.3) !important;
                    }
                    .sale:hover {
                        background-color: #0284c7 !important;
                        box-shadow: 0 12px 20px -5px rgba(3, 105, 161, 0.3) !important;
                    }
                `}</style>
        </div>
    );
}
