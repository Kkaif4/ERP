"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useTranslation } from "@/lib/i18n";
import {
    MoreHorizontal,
    ChevronRight,
    LogOut,
    Globe,
} from "lucide-react";

import { mainNav, masterNav, financeNav, systemNav, NavItem } from "@/lib/navigation";

interface BottomNavProps {
    role: string;
}

export function BottomNav({ role }: BottomNavProps) {
    const { t, language, setLanguage } = useTranslation();
    const pathname = usePathname();
    const router = useRouter();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const languages = [
        { code: "en", name: "English", short: "EN" },
        { code: "hi", name: "हिन्दी", short: "हि" },
        { code: "mr", name: "मराठी", short: "म" },
    ] as const;

    const handleLogout = async () => {
        await fetch("/api/auth/logout", { method: "POST" });
        window.location.href = "/login";
    };

    // Primary tabs shown directly in the bar
    const primaryTabs = [
        mainNav[0],    // Dashboard
        mainNav[1],    // Bills
        masterNav[0],  // Farmers
        financeNav[0], // Payments
    ];

    // All other items grouped by section for the action menu
    const menuSections = [
        { label: t("nav.sections.master"), items: masterNav.slice(1) }, // Customers, Items
        { label: t("nav.sections.finance"), items: financeNav.slice(1) }, // Reports
        { label: t("nav.sections.system"), items: systemNav }, // Settings, Staff
    ];

    const filteredSections = menuSections.map(section => ({
        ...section,
        items: section.items.filter(item => !item.adminOnly || role === "ORG_ADMIN")
    })).filter(section => section.items.length > 0);

    return (
        <>
            {/* Action Menu (Overlay) */}
            {isMenuOpen && (
                <div className="lg:hidden fixed inset-0 z-[100] no-print">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
                        onClick={() => setIsMenuOpen(false)}
                    />

                    {/* Menu Content (Animated Slide Up) */}
                    <div className="absolute bottom-24 left-4 right-4 bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.2)] p-8 animate-in slide-in-from-bottom-10 fade-in duration-300 border border-slate-100 max-h-[80vh] overflow-y-auto custom-scrollbar pointer-events-auto">
                        <div className="flex items-center justify-center mb-8">
                            <div className="w-16 h-1.5 bg-slate-100 rounded-full opacity-50" onClick={() => setIsMenuOpen(false)} />
                        </div>

                        {/* Navigation Sections */}
                        <div className="space-y-10 mb-10">
                            {filteredSections.map((section, idx) => (
                                <div key={idx} className="space-y-4">
                                    <p className="px-2 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-3">
                                        <span className="w-1.5 h-1.5" />
                                        {section.label}
                                    </p>
                                    <div className="grid grid-cols-1 gap-2">
                                        {section.items.map((item) => {
                                            const Icon = item.icon;
                                            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(item.href));
                                            return (
                                                <Link
                                                    key={item.key}
                                                    href={item.href}
                                                    onClick={() => setIsMenuOpen(false)}
                                                    className={`flex items-center gap-5 px-5 py-4 rounded-[1.5rem] transition-all duration-300 ${isActive
                                                        ? "bg-emerald-50 text-emerald-700 font-bold shadow-sm"
                                                        : "text-slate-600 font-medium hover:bg-slate-50"
                                                        }`}
                                                >
                                                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${isActive ? "bg-emerald-600 text-white shadow-lg shadow-emerald-100" : "bg-slate-100 text-slate-400"
                                                        }`}>
                                                        <Icon size={20} />
                                                    </div>
                                                    <span className="flex-1 text-[16px]">{t(`nav.${item.key}`)}</span>
                                                    <ChevronRight size={16} className={`opacity-20 ${isActive ? "opacity-100" : ""}`} />
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Language Selection */}
                        <div className="mb-10 border-t border-slate-100 pt-8">
                            <p className="px-2 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-5 flex items-center gap-3">
                                <Globe size={16} className="text-slate-400" />
                                {t("common.language")}
                            </p>
                            <div className="grid grid-cols-3 gap-3">
                                {languages.map((lang) => (
                                    <button
                                        key={lang.code}
                                        onClick={() => setLanguage(lang.code)}
                                        className={`flex flex-col items-center justify-center py-4 rounded-[1.25rem] border transition-all duration-300 ${language === lang.code
                                            ? "bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-200"
                                            : "bg-white border-slate-200 text-slate-600 hover:border-emerald-200 hover:bg-emerald-50"
                                            }`}
                                    >
                                        <span className="text-[12px] font-black uppercase tracking-widest">{lang.short}</span>
                                        <span className="text-[11px] font-bold mt-1 opacity-80">{lang.name}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Logout Button */}
                        <div className="border-t border-slate-100 pt-8 pb-4">
                            <button
                                onClick={handleLogout}
                                className="w-full flex items-center gap-5 px-6 py-5 rounded-[1.5rem] text-red-500 hover:bg-red-50 font-black text-[16px] transition-all duration-300 border border-transparent hover:border-red-100 shadow-sm hover:shadow-red-100/50"
                            >
                                <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center text-red-600 shadow-sm">
                                    <LogOut size={22} />
                                </div>
                                <span className="flex-1 text-left">{t("common.logout")}</span>
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Bottom Nav Bar */}
            <nav className="lg:hidden fixed bottom-1 left-0 right-0 z-50 px-4 pb-4 pointer-events-none w-full no-print" >
                <div className="flex justify-around items-center h-20 bg-white/95 backdrop-blur-2xl border border-slate-200/50 rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] mx-auto pointer-events-auto">
                    {primaryTabs.map((tab) => {
                        const Icon = tab.icon;
                        const isActive =
                            tab.href === "/dashboard"
                                ? pathname === tab.href
                                : pathname === tab.href || pathname.startsWith(tab.href);
                        return (
                            <Link
                                key={tab.key}
                                href={tab.href}
                                className={`flex flex-col items-center justify-center gap-1.5 min-w-[72px] transition-all duration-300 ${isActive ? "transform translateY(-2px)" : ""
                                    }`}
                            >
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${isActive ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200" : "text-slate-400"
                                    }`}>
                                    <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                                </div>
                                <span className={`text-[11px] font-bold uppercase tracking-tight ${isActive ? "text-emerald-700" : "text-slate-400 opacity-0 scale-50"
                                    } transition-all duration-300`}>
                                    {t(`nav.${tab.key}`)}
                                </span>
                            </Link>
                        );
                    })}

                    {/* More Button */}
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className={`flex flex-col items-center justify-center gap-1.5 min-w-[72px] transition-all duration-300 ${isMenuOpen ? "transform translateY(-2px)" : ""
                            }`}
                    >
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${isMenuOpen ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200" : "text-slate-400 hover:bg-slate-50"
                            }`}>
                            <MoreHorizontal size={24} strokeWidth={isMenuOpen ? 2.5 : 2} />
                        </div>
                        <span className={`text-[11px] font-bold uppercase tracking-tight ${isMenuOpen ? "text-emerald-700" : "text-slate-400 opacity-0 scale-50"
                            } transition-all duration-300`}>
                            {t("nav.more")}
                        </span>
                    </button>
                </div>
            </nav>
        </>
    );
}
