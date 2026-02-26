"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "@/lib/i18n";
import {
    LayoutDashboard,
    ReceiptText,
    WalletCards,
    MoreHorizontal,
    Search
} from "lucide-react";

export function BottomNav() {
    const { t } = useTranslation();
    const pathname = usePathname();

    const tabs = [
        { key: "dashboard", href: "/dashboard", icon: LayoutDashboard },
        { key: "bills", href: "/dashboard/bills", icon: ReceiptText },
        { key: "search", href: "/dashboard/search", icon: Search },
        { key: "payments", href: "/dashboard/payments", icon: WalletCards },
        { key: "more", href: "/dashboard/more", icon: MoreHorizontal },
    ];

    return (
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t pb-safe glass z-50">
            <div className="flex justify-around items-center h-20 px-2">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = pathname === tab.href;
                    return (
                        <Link
                            key={tab.key}
                            href={tab.href}
                            className={`flex flex-col items-center justify-center gap-1.5 min-w-[64px] transition-all ${isActive ? "text-primary scale-110" : "text-slate-400"
                                }`}
                        >
                            <div className={`p-2 rounded-xl ${isActive ? "bg-primary/10 shadow-sm" : ""}`}>
                                <Icon size={26} strokeWidth={isActive ? 2.5 : 2} />
                            </div>
                            <span className={`text-[10px] font-black uppercase tracking-wider ${isActive ? "text-primary" : "text-slate-500"}`}>
                                {t(`nav.${tab.key}`)}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}
