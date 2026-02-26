"use client";

import { useEffect, useState } from "react";
import {
    ReceiptText,
    Users,
    UserSearch,
    WalletCards,
    TrendingUp,
    TrendingDown,
    Plus,
    ArrowRight,
    Clock,
    IndianRupee,
    ShoppingCart,
    Truck,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import Link from "next/link";

interface DashboardStats {
    todayBills: number;
    todayPayments: number;
    totalFarmers: number;
    totalCustomers: number;
    pendingFarmerBalance: number;
    pendingCustomerBalance: number;
    recentBills: {
        id: string;
        billNumber: string;
        type: "PURCHASE" | "SALE";
        party: string;
        netTotal: number;
        billDate: string;
        createdBy: string;
    }[];
}

function formatINR(amount: number) {
    return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
    }).format(amount);
}

function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
}

// Skeleton loader card
function SkeletonCard() {
    return (
        <div
            className="premium-card"
            style={{
                padding: "1.75rem",
                animation: "pulse 1.5s ease-in-out infinite",
            }}
        >
            <div style={{ height: "12px", width: "60%", backgroundColor: "var(--bg-main)", borderRadius: "6px", marginBottom: "1rem" }} />
            <div style={{ height: "32px", width: "40%", backgroundColor: "var(--bg-main)", borderRadius: "8px" }} />
        </div>
    );
}

export default function DashboardPage() {
    const { t, language } = useTranslation();
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const r = await fetch("/api/dashboard/stats");
                if (!r.ok) throw new Error("Stats fetch failed");
                const text = await r.text();
                if (!text) throw new Error("Empty stats response");
                const data = JSON.parse(text);
                setStats(data);
                setLoading(false);
            } catch (err) {
                console.error("Dashboard stats error:", err);
                setError(true);
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const today = new Date().toLocaleDateString(language === "hi" ? "hi-IN" : language === "mr" ? "mr-IN" : "en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
    });

    const statCards = stats
        ? [
            {
                label: t("dashboard.stats.todayBills"),
                value: stats.todayBills.toString(),
                icon: ReceiptText,
                color: "var(--primary-main)",
                bg: "var(--primary-glow)",
                border: "rgba(21, 128, 61, 0.2)",
                trend: null,
            },
            {
                label: t("dashboard.stats.todayPayments"),
                value: stats.todayPayments.toString(),
                icon: WalletCards,
                color: "#0369a1",
                bg: "rgba(3, 105, 161, 0.08)",
                border: "rgba(3, 105, 161, 0.15)",
                trend: null,
            },
            {
                label: t("dashboard.stats.farmerPayable"),
                value: formatINR(stats.pendingFarmerBalance),
                icon: TrendingDown,
                color: "#b45309",
                bg: "rgba(180, 83, 9, 0.08)",
                border: "rgba(180, 83, 9, 0.15)",
                trend: "down",
            },
            {
                label: t("dashboard.stats.customerDue"),
                value: formatINR(stats.pendingCustomerBalance),
                icon: TrendingUp,
                color: "#7c3aed",
                bg: "rgba(124, 58, 237, 0.08)",
                border: "rgba(124, 58, 237, 0.15)",
                trend: "up",
            },
        ]
        : [];

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>

            {/* ── Header ── */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
                <div>
                    <h1
                        style={{
                            fontSize: "1.875rem",
                            fontWeight: 900,
                            color: "var(--text-main)",
                            letterSpacing: "-0.02em",
                            margin: 0,
                            lineHeight: 1.2,
                        }}
                    >
                        {t("dashboard.overview")}
                    </h1>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "6px" }}>
                        <div style={{ height: "3px", width: "24px", backgroundColor: "var(--primary-main)", borderRadius: "2px" }} />
                        <p
                            style={{
                                margin: 0,
                                fontSize: "11px",
                                fontWeight: 800,
                                color: "var(--text-muted)",
                                textTransform: "uppercase",
                                letterSpacing: "0.15em",
                                display: "flex",
                                alignItems: "center",
                                gap: "6px",
                            }}
                        >
                            <Clock size={12} />
                            {today}
                        </p>
                    </div>
                </div>

                {/* Quick Action Buttons */}
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    <Link
                        href="/bills/purchase/new"
                        className="quick-action-btn purchase"
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "10px 20px",
                            backgroundColor: "var(--primary-main)",
                            color: "#fff",
                            borderRadius: "12px",
                            fontWeight: 800,
                            fontSize: "14px",
                            textDecoration: "none",
                            boxShadow: "0 8px 16px var(--primary-glow)",
                            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                            letterSpacing: "0.02em",
                        }}
                    >
                        <Truck size={16} />
                        {t("dashboard.purchaseBill")}
                    </Link>
                    <Link
                        href="/bills/sale/new"
                        className="quick-action-btn sale"
                        style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "10px 20px",
                            backgroundColor: "#0369a1",
                            color: "#fff",
                            borderRadius: "12px",
                            fontWeight: 800,
                            fontSize: "14px",
                            textDecoration: "none",
                            boxShadow: "0 8px 16px rgba(3, 105, 161, 0.15)",
                            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                            letterSpacing: "0.02em",
                        }}
                    >
                        <ShoppingCart size={16} />
                        {t("dashboard.saleBill")}
                    </Link>
                </div>
            </div>

            {/* ── Stat Cards ── */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: "1rem",
                }}
            >
                {loading
                    ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
                    : statCards.map((card) => {
                        const Icon = card.icon;
                        return (
                            <div
                                key={card.label}
                                className="premium-card"
                                style={{
                                    padding: "2rem",
                                    border: `1px solid ${card.border}`,
                                }}
                            >
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem" }}>
                                    <div>
                                        <p style={{ margin: 0, fontSize: "10px", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.15em" }}>
                                            {card.label}
                                        </p>
                                    </div>
                                    <div
                                        style={{
                                            width: "48px",
                                            height: "48px",
                                            backgroundColor: card.bg,
                                            borderRadius: "14px",
                                            display: "flex",
                                            alignItems: "center",
                                            justifyContent: "center",
                                            color: card.color,
                                            border: `1px solid ${card.border}`,
                                        }}
                                    >
                                        <Icon size={22} strokeWidth={2.5} />
                                    </div>
                                </div>
                                <p
                                    style={{
                                        margin: 0,
                                        fontSize: "1.875rem",
                                        fontWeight: 900,
                                        color: "var(--text-main)",
                                        letterSpacing: "-0.02em",
                                        lineHeight: 1.1,
                                    }}
                                >
                                    {card.value}
                                </p>
                            </div>
                        );
                    })}
            </div>

            {/* ── Bottom Section: Recent Bills + Quick Links ── */}
            <div className="dashboard-bottom-grid">

                {/* Recent Bills */}
                <div
                    className="premium-card"
                    style={{
                        overflow: "hidden",
                    }}
                >
                    <div
                        style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "1.5rem 2rem",
                            borderBottom: "1px solid var(--border-main)",
                            background: "linear-gradient(to right, rgba(255,255,255,1), rgba(248,250,252,1))",
                        }}
                    >
                        <h3 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 900, color: "var(--text-main)", letterSpacing: "-0.01em" }}>
                            {t("dashboard.latestBills")}
                        </h3>
                        <Link
                            href="/bills"
                            style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "6px",
                                fontSize: "12px",
                                fontWeight: 800,
                                color: "var(--primary-main)",
                                textDecoration: "none",
                                padding: "6px 14px",
                                borderRadius: "10px",
                                backgroundColor: "var(--primary-glow)",
                                transition: "all 0.2s",
                                letterSpacing: "0.02em",
                            }}
                        >
                            {t("dashboard.viewAll")} <ArrowRight size={13} strokeWidth={2.5} />
                        </Link>
                    </div>

                    {loading ? (
                        <div style={{ padding: "2rem 1.75rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
                            {Array.from({ length: 4 }).map((_, i) => (
                                <div key={i} style={{ height: "48px", backgroundColor: "#f8fafc", borderRadius: "10px" }} />
                            ))}
                        </div>
                    ) : error ? (
                        <div style={{ padding: "3rem", textAlign: "center", color: "#94a3b8", fontSize: "14px", fontWeight: 600 }}>
                            Could not load bills. Check your database connection.
                        </div>
                    ) : stats?.recentBills.length === 0 ? (
                        <div style={{ padding: "3rem", textAlign: "center" }}>
                            <ReceiptText size={32} color="#e2e8f0" style={{ margin: "0 auto 0.75rem" }} />
                            <p style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "#94a3b8" }}>
                                {t("dashboard.noBills")}
                            </p>
                            <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#cbd5e1" }}>
                                {t("dashboard.createFirst")}
                            </p>
                        </div>
                    ) : (
                        <div className="recent-bills-container">
                            {/* Table Header - Hidden on Mobile */}
                            <div className="bill-header">
                                <span>{t("dashboard.billTable.number")}</span>
                                <span>{t("dashboard.billTable.party")}</span>
                                <span>{t("dashboard.billTable.type")}</span>
                                <span style={{ textAlign: "right" }}>{t("dashboard.billTable.amount")}</span>
                                <span style={{ textAlign: "right" }}>{t("dashboard.billTable.time")}</span>
                            </div>

                            {stats?.recentBills.map((bill) => (
                                <div key={bill.id} className="bill-row">
                                    <div className="bill-main-info">
                                        <div className="bill-id">
                                            <span className="id-badge">#{bill.billNumber}</span>
                                            <span className="party-name">{bill.party}</span>
                                        </div>
                                        <div className="bill-meta">
                                            <span
                                                className={`type-badge ${bill.type.toLowerCase()}`}
                                            >
                                                {bill.type === "PURCHASE" ? t("dashboard.billTable.purchase") : t("dashboard.billTable.sale")}
                                            </span>
                                            <span className="time-info text-slate-400">
                                                <Clock size={10} /> {timeAgo(bill.billDate)}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="bill-amount-container">
                                        <div className="amount-wrapper">
                                            <IndianRupee size={14} strokeWidth={3} />
                                            <span className="amount-value">{bill.netTotal.toLocaleString("en-IN")}</span>
                                        </div>
                                        <ArrowRight size={16} className="mobile-chevron text-slate-300" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Quick Links Panel */}
                <div
                    className="premium-card quick-links-panel"
                    style={{
                        padding: "1.75rem",
                    }}
                >
                    <p style={{ margin: "0 0 1rem", fontSize: "10px", fontWeight: 900, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.2em" }}>
                        {t("dashboard.quickNav")}
                    </p>

                    {[
                        { href: "/farmers", label: "Farmers", labelHi: "किसान", icon: Users, color: "#15803d" },
                        { href: "/customers", label: "Customers", labelHi: "ग्राहक", icon: UserSearch, color: "#0369a1" },
                        { href: "/payments", label: "Payments", labelHi: "भुगतान", icon: WalletCards, color: "#7c3aed" },
                        { href: "/bills", label: "All Bills", labelHi: "सभी बिल", icon: ReceiptText, color: "#b45309" },
                    ].map((item) => {
                        const Icon = item.icon;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                style={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "12px",
                                    padding: "12px 14px",
                                    borderRadius: "12px",
                                    textDecoration: "none",
                                    transition: "background 0.15s",
                                }}
                                onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f8fafc")}
                                onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
                            >
                                <div
                                    style={{
                                        width: "36px",
                                        height: "36px",
                                        borderRadius: "10px",
                                        backgroundColor: `${item.color}18`,
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        color: item.color,
                                        flexShrink: 0,
                                    }}
                                >
                                    <Icon size={17} strokeWidth={2} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <p style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>{t(`nav.${item.href.split("/").pop()}`)}</p>
                                </div>
                                <ArrowRight size={14} color="#cbd5e1" />
                            </Link>
                        );
                    })}

                    {/* New Bill CTA */}
                    <div style={{ marginTop: "1rem", paddingTop: "1.25rem", borderTop: "1px dashed var(--border-main)" }}>
                        <Link
                            href="/bills/purchase/new"
                            className="quick-action-btn purchase"
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "10px",
                                padding: "14px",
                                backgroundColor: "var(--primary-main)",
                                color: "#fff",
                                borderRadius: "14px",
                                fontWeight: 800,
                                fontSize: "13px",
                                textDecoration: "none",
                                boxShadow: "0 8px 16px var(--primary-glow)",
                            }}
                        >
                            <Plus size={18} strokeWidth={3} />
                            {t("dashboard.createBill")}
                        </Link>
                    </div>
                </div>
            </div>

            {/* Global Hover Effects */}
            <style>{`
                @keyframes pulse {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.7; }
                }
                .quick-action-btn:hover {
                    transform: translateY(-3px) scale(1.02);
                    box-shadow: 0 12px 24px rgba(0,0,0,0.15);
                    filter: brightness(1.1);
                }
                .quick-action-btn:active {
                    transform: translateY(0);
                }

                /* Responsive Grid for Bottom Section */
                .dashboard-bottom-grid {
                    display: grid;
                    grid-template-columns: 1fr;
                    gap: 1.5rem;
                }
                @media (min-width: 1024px) {
                    .dashboard-bottom-grid {
                        grid-template-columns: 1fr 320px;
                    }
                }

                /* Bill Row Styling */
                .bill-header {
                    display: none;
                    grid-template-columns: 1.2fr 1fr 1fr 100px 90px;
                    padding: 1rem 2rem;
                    gap: 1rem;
                    background-color: #f8fafc;
                    color: #94a3b8;
                    font-size: 10px;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                }
                @media (min-width: 768px) {
                    .bill-header {
                        display: grid;
                    }
                }

                .bill-row {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 1.25rem 1.5rem;
                    border-bottom: 1px solid #f1f5f9;
                    transition: background 0.2s;
                    cursor: pointer;
                }
                @media (min-width: 768px) {
                    .bill-row {
                        display: grid;
                        grid-template-columns: 1.2fr 1fr 1fr 100px 90px;
                        padding: 1.25rem 2rem;
                        gap: 1rem;
                    }
                }
                .bill-row:hover {
                    background-color: #f8fafc;
                }

                .bill-main-info {
                    display: flex;
                    flex-direction: column;
                    gap: 0.5rem;
                }
                @media (min-width: 768px) {
                    .bill-main-info {
                        display: contents;
                    }
                }

                .bill-id {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }
                @media (min-width: 768px) {
                    .bill-id {
                        display: contents;
                    }
                }

                .id-badge {
                    font-size: 14px;
                    font-weight: 900;
                    color: #1e293b;
                    letter-spacing: 0.02em;
                }
                .party-name {
                    font-size: 14px;
                    font-weight: 700;
                    color: #475569;
                }

                .bill-meta {
                    display: flex;
                    align-items: center;
                    gap: 0.75rem;
                }
                @media (min-width: 768px) {
                    .bill-meta {
                        display: contents;
                    }
                }

                .type-badge {
                    display: inline-block;
                    padding: 4px 10px;
                    border-radius: 8px;
                    font-size: 10px;
                    font-weight: 900;
                    text-transform: uppercase;
                    letter-spacing: 0.05em;
                }
                .type-badge.purchase {
                    background-color: rgba(234, 88, 12, 0.08);
                    color: #ea580c;
                    border: 1px solid rgba(234, 88, 12, 0.2);
                }
                .type-badge.sale {
                    background-color: rgba(21, 128, 61, 0.08);
                    color: #15803d;
                    border: 1px solid rgba(21, 128, 61, 0.2);
                }

                .time-info {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    font-size: 11px;
                    font-weight: 700;
                }
                @media (min-width: 768px) {
                    .time-info {
                        justify-content: flex-end;
                        text-align: right;
                    }
                }

                .bill-amount-container {
                    display: flex;
                    align-items: center;
                    gap: 1rem;
                }
                @media (min-width: 768px) {
                    .bill-amount-container {
                        display: contents;
                    }
                }
                
                .amount-wrapper {
                    display: flex;
                    align-items: center;
                    gap: 2px;
                    color: #0f172a;
                    font-weight: 900;
                }
                @media (min-width: 768px) {
                    .amount-wrapper {
                        justify-content: flex-end;
                        font-size: 14px;
                    }
                }
                .amount-value {
                    font-size: 16px;
                }
                @media (min-width: 768px) {
                    .amount-value {
                        font-size: 14px;
                    }
                }

                .mobile-chevron {
                    display: block;
                }
                @media (min-width: 768px) {
                    .mobile-chevron {
                        display: none;
                    }
                }
            `}</style>
        </div>
    );
}
