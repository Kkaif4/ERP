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
    Store
} from "lucide-react";

const navItems = [
    { key: "dashboard", href: "/dashboard", icon: LayoutDashboard },
    { key: "bills", href: "/dashboard/bills", icon: ReceiptText },
    { key: "farmers", href: "/dashboard/farmers", icon: Users },
    { key: "customers", href: "/dashboard/customers", icon: UserSearch },
    { key: "items", href: "/dashboard/items", icon: Package },
    { key: "payments", href: "/dashboard/payments", icon: WalletCards },
    { key: "reports", href: "/dashboard/reports", icon: BarChart3 },
    { key: "settings", href: "/dashboard/settings", icon: Settings },
];

export function Sidebar({ role }: { role: string }) {
    const { t } = useTranslation();
    const pathname = usePathname();

    const handleLogout = async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        window.location.href = "/login";
    };

    return (
        <aside className="hidden lg:flex flex-col w-[280px] bg-white border-r border-slate-200/60 h-screen sticky top-0">
            <div className="p-8 flex flex-col h-full">
                {/* Logo Section */}
                <div className="flex items-center gap-4 bg-[#15803d] p-5 rounded-[2.5rem] mb-10 shadow-lg shadow-emerald-100 transition-transform hover:scale-[1.02] duration-500">
                    <div className="bg-white/20 p-2.5 rounded-2xl backdrop-blur-md">
                        <Store size={24} color="white" strokeWidth={2.5} />
                    </div>
                    <div>
                        <h1 className="font-black text-white text-lg leading-tight tracking-tight">Mandi ERP</h1>
                        <p className="text-[10px] uppercase font-black text-emerald-100 tracking-[0.2em] opacity-80">v1.0 Premium</p>
                    </div>
                </div>

                {/* Navigation Links */}
                <nav className="flex-1 space-y-1.5 overflow-y-auto pr-2 scrollbar-thin">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                        return (
                            <Link
                                key={item.key}
                                href={item.href}
                                className={`
                                    flex items-center gap-4 px-5 py-4 rounded-2xl text-[14px] font-black tracking-wide transition-all duration-300 group
                                    ${isActive
                                        ? "bg-[#15803d] text-white shadow-xl shadow-emerald-100 scale-105"
                                        : "text-slate-400 hover:bg-emerald-50 hover:text-[#15803d]"}
                                `}
                            >
                                <div className={`${isActive ? "text-white" : "text-slate-300 group-hover:text-emerald-600"} transition-colors`}>
                                    <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                                </div>
                                <span className="uppercase tracking-widest">{t(`nav.${item.key}`)}</span>
                            </Link>
                        );
                    })}

                    {role === "SUPER_ADMIN" && (
                        <Link
                            href="/admin"
                            className="flex items-center gap-4 px-5 py-4 rounded-2xl text-[14px] font-black text-emerald-600 hover:bg-emerald-50 transition-all mt-6 border-2 border-dashed border-emerald-100 shadow-sm uppercase tracking-widest"
                        >
                            <ShieldCheck size={20} />
                            <span>{t("nav.admin")}</span>
                        </Link>
                    )}
                </nav>

                {/* Footer / Logout */}
                <div className="pt-8 mt-8 border-t border-slate-100">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-4 w-full px-5 py-4 rounded-2xl text-[14px] font-black text-slate-400 hover:bg-red-50 hover:text-red-600 transition-all uppercase tracking-widest group"
                    >
                        <div className="text-slate-300 group-hover:text-red-500 transition-colors">
                            <LogOut size={20} />
                        </div>
                        <span>{t("common.logout")}</span>
                    </button>

                    <div className="mt-8 px-5">
                        <p className="text-[9px] font-black text-slate-300 uppercase tracking-[0.3em]">
                            Secure Portal &copy; 2026
                        </p>
                    </div>
                </div>
            </div>
        </aside>
    );
}
