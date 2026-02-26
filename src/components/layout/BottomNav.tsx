"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "@/lib/i18n";
import {
    LayoutDashboard,
    ReceiptText,
    Users,
    WalletCards,
    UserSearch,
} from "lucide-react";

interface BottomNavProps {
    role: string;
}

export function BottomNav({ role }: BottomNavProps) {
    const { t } = useTranslation();
    const pathname = usePathname();

    const baseTabs = [
        { key: "dashboard", href: "/dashboard", icon: LayoutDashboard },
        { key: "bills", href: "/bills", icon: ReceiptText },
        { key: "farmers", href: "/farmers", icon: Users },
        { key: "payments", href: "/payments", icon: WalletCards },
        { key: "customers", href: "/customers", icon: UserSearch },
    ] as const;

    const tabs =
        role === "ORG_STAFF"
            ? baseTabs.filter((t) => t.key !== "bills")
            : baseTabs;

    return (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50" style={{
            backgroundColor: "rgba(255,255,255,0.95)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderTop: "1px solid #e2e8f0",
            paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}>
            <div style={{ display: "flex", justifyContent: "space-around", alignItems: "center", height: "64px", paddingLeft: "0.5rem", paddingRight: "0.5rem" }}>
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive =
                        tab.href === "/dashboard"
                            ? pathname === tab.href
                            : pathname === tab.href || pathname.startsWith(tab.href);
                    return (
                        <Link
                            key={tab.key}
                            href={tab.href}
                            style={{
                                display: "flex", flexDirection: "column",
                                alignItems: "center", justifyContent: "center",
                                gap: "3px", minWidth: "56px",
                                textDecoration: "none",
                                transition: "all 0.2s",
                                transform: isActive ? "translateY(-2px)" : "none",
                                color: isActive ? "#15803d" : "#94a3b8",
                            }}
                        >
                            <div style={{
                                width: "40px", height: "40px",
                                borderRadius: "12px",
                                display: "flex", alignItems: "center", justifyContent: "center",
                                backgroundColor: isActive ? "rgba(21,128,61,0.1)" : "transparent",
                                transition: "all 0.2s",
                            }}>
                                <Icon size={22} strokeWidth={isActive ? 2.5 : 2} />
                            </div>
                            <span style={{
                                fontSize: "9px", fontWeight: 900,
                                textTransform: "uppercase", letterSpacing: "0.08em",
                                color: isActive ? "#15803d" : "#94a3b8",
                            }}>
                                {t(`nav.${tab.key}`)}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
