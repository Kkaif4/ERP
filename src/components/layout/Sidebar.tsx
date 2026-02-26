"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "@/lib/i18n";
import {
    LayoutDashboard,
    ReceiptText,
    Users,
    UserSearch,
    Package,
    WalletCards,
    BarChart3,
    Settings,
    ShieldCheck,
    LogOut,
    Store,
    ChevronRight,
} from "lucide-react";

const mainNav = [
    { key: "dashboard", href: "/dashboard", icon: LayoutDashboard },
    { key: "bills", href: "/bills", icon: ReceiptText },
];

const masterNav = [
    { key: "farmers", href: "/farmers", icon: Users },
    { key: "customers", href: "/customers", icon: UserSearch },
    { key: "items", href: "/items", icon: Package },
];

const financeNav = [
    { key: "payments", href: "/payments", icon: WalletCards },
    { key: "reports", href: "/reports", icon: BarChart3 },
];

const systemNav = [
    { key: "settings", href: "/settings", icon: Settings },
];

function SectionLabel({ label }: { label: string }) {
    return (
        <p style={{
            fontSize: "9px", fontWeight: 900, letterSpacing: "0.22em",
            textTransform: "uppercase", color: "#94a3b8",
            paddingLeft: "10px", marginBottom: "3px", marginTop: "0",
        }}>
            {label}
        </p>
    );
}

function NavGroup({ label, items, pathname, t }: {
    label: string;
    items: { key: string; href: string; icon: React.ElementType }[];
    pathname: string;
    t: (key: string) => string;
}) {
    return (
        <div style={{ marginBottom: "0.6rem" }}>
            <SectionLabel label={label} />
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                {items.map((item) => {
                    const Icon = item.icon;
                    const isActive =
                        item.href === "/dashboard"
                            ? pathname === item.href
                            : pathname === item.href || pathname.startsWith(`${item.href}/`);
                    return (
                        <Link
                            key={item.key}
                            href={item.href}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                                padding: "7px 10px",
                                borderRadius: "12px",
                                textDecoration: "none",
                                fontSize: "12.5px",
                                fontWeight: 800,
                                letterSpacing: "0.01em",
                                transition: "all 0.2s cubic-bezier(0.4,0,0.2,1)",
                                ...(isActive ? {
                                    backgroundColor: "rgba(21,128,61,0.09)",
                                    color: "#15803d",
                                    boxShadow: "inset 0 0 0 1.5px rgba(21,128,61,0.15)",
                                } : {
                                    color: "#64748b",
                                    backgroundColor: "transparent",
                                }),
                            }}
                            onMouseEnter={e => {
                                if (!isActive) {
                                    e.currentTarget.style.backgroundColor = "#f8fafc";
                                    e.currentTarget.style.color = "#15803d";
                                }
                            }}
                            onMouseLeave={e => {
                                if (!isActive) {
                                    e.currentTarget.style.backgroundColor = "transparent";
                                    e.currentTarget.style.color = "#64748b";
                                }
                            }}
                        >
                            <div style={{
                                width: "30px", height: "30px",
                                borderRadius: "9px",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                flexShrink: 0,
                                backgroundColor: isActive ? "rgba(21,128,61,0.12)" : "#f1f5f9",
                                color: isActive ? "#15803d" : "#94a3b8",
                                transition: "all 0.2s",
                            }}>
                                <Icon size={15} strokeWidth={isActive ? 2.5 : 2} />
                            </div>
                            <span style={{ flex: 1 }}>{t(`nav.${item.key}`)}</span>
                            {isActive && (
                                <ChevronRight size={13} style={{ color: "#15803d", opacity: 0.6 }} />
                            )}
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}

export function Sidebar({ role }: { role: string }) {
    const { t } = useTranslation();
    const pathname = usePathname();

    const handleLogout = async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        window.location.href = "/login";
    };

    return (
        <aside className="hidden lg:flex flex-col" style={{
            width: "272px",
            flexShrink: 0,
            backgroundColor: "#ffffff",
            borderRight: "1px solid #e2e8f0",
            height: "100vh",
            position: "sticky",
            top: 0,
            flexDirection: "column",
            overflow: "hidden",
        }}>
            {/* Thin top emerald accent stripe */}
            <div style={{
                height: "3px",
                background: "linear-gradient(90deg, #15803d 0%, #34d399 60%, transparent 100%)",
                flexShrink: 0,
            }} />

            <div style={{ display: "flex", flexDirection: "column", height: "100%", padding: "0.875rem 0.875rem", overflowY: "auto" }}>

                {/* ── Logo ── */}
                <div style={{
                    display: "flex", alignItems: "center", gap: "10px",
                    padding: "10px 12px",
                    background: "linear-gradient(135deg, #15803d, #16a34a)",
                    borderRadius: "16px",
                    marginBottom: "1rem",
                    boxShadow: "0 6px 16px rgba(21,128,61,0.2)",
                }}>
                    <div style={{
                        width: "34px", height: "34px",
                        backgroundColor: "rgba(255,255,255,0.2)",
                        borderRadius: "10px",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        flexShrink: 0,
                    }}>
                        <Store size={19} color="white" strokeWidth={2.5} />
                    </div>
                    <div>
                        <h1 style={{ fontSize: "15px", fontWeight: 900, color: "#fff", letterSpacing: "-0.02em", lineHeight: 1.2, margin: 0 }}>
                            Mandi ERP
                        </h1>
                        <p style={{ margin: 0, fontSize: "8px", fontWeight: 800, color: "rgba(255,255,255,0.7)", letterSpacing: "0.2em", textTransform: "uppercase" }}>
                            v1.0 Premium
                        </p>
                    </div>
                </div>

                {/* ── Navigation ── */}
                <nav style={{ flex: 1 }}>
                    <NavGroup label={t("nav.sections.main") || "Main"} items={mainNav} pathname={pathname} t={t} />
                    <NavGroup label={t("nav.sections.master") || "Master"} items={masterNav} pathname={pathname} t={t} />
                    <NavGroup label={t("nav.sections.finance") || "Finance"} items={financeNav.filter(item => item.key !== "reports" || role === "ORG_ADMIN")} pathname={pathname} t={t} />
                    {role === "ORG_ADMIN" && (
                        <NavGroup label={t("nav.sections.system") || "System"} items={systemNav} pathname={pathname} t={t} />
                    )}

                    {role === "SUPER_ADMIN" && (
                        <Link
                            href="/admin"
                            style={{
                                display: "flex", alignItems: "center", gap: "12px",
                                padding: "10px 14px", borderRadius: "14px",
                                textDecoration: "none", fontSize: "13px", fontWeight: 800,
                                color: "#15803d",
                                border: "1.5px dashed rgba(21,128,61,0.3)",
                                marginTop: "0.5rem",
                                transition: "all 0.2s",
                            }}
                            onMouseEnter={e => { e.currentTarget.style.backgroundColor = "rgba(21,128,61,0.06)"; }}
                            onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; }}
                        >
                            <div style={{ width: "34px", height: "34px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(21,128,61,0.08)", color: "#15803d" }}>
                                <ShieldCheck size={17} />
                            </div>
                            <span>{t("nav.admin")}</span>
                        </Link>
                    )}
                </nav>

                {/* ── Footer / Logout ── */}
                <div style={{ paddingTop: "0.625rem", borderTop: "1px solid #f1f5f9", marginTop: "0.25rem" }}>
                    <button
                        onClick={handleLogout}
                        style={{
                            display: "flex", alignItems: "center", gap: "10px",
                            width: "100%", padding: "7px 10px", borderRadius: "12px",
                            border: "none", backgroundColor: "transparent", cursor: "pointer",
                            fontSize: "12.5px", fontWeight: 800,
                            color: "#94a3b8",
                            transition: "all 0.2s",
                        }}
                        onMouseEnter={e => { e.currentTarget.style.backgroundColor = "#fef2f2"; e.currentTarget.style.color = "#ef4444"; }}
                        onMouseLeave={e => { e.currentTarget.style.backgroundColor = "transparent"; e.currentTarget.style.color = "#94a3b8"; }}
                    >
                        <div style={{
                            width: "30px", height: "30px", borderRadius: "9px",
                            display: "flex", alignItems: "center", justifyContent: "center",
                            backgroundColor: "#f1f5f9",
                        }}>
                            <LogOut size={15} />
                        </div>
                        <span>{t("common.logout")}</span>
                    </button>

                    <p style={{
                        marginTop: "0.5rem", paddingLeft: "10px",
                        fontSize: "8px", fontWeight: 800,
                        color: "#cbd5e1", textTransform: "uppercase", letterSpacing: "0.3em",
                    }}>
                        Secure Portal © 2026
                    </p>
                </div>
            </div>
        </aside>
    );
}
