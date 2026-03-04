import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "@/lib/i18n";

import { mainNav, masterNav, financeNav } from "@/lib/navigation";

interface BottomNavProps {
  role: string;
}

export function BottomNav({ role }: BottomNavProps) {
  const { t } = useTranslation();
  const pathname = usePathname();

  // Primary tabs shown directly in the bar
  const primaryTabs = [
    mainNav[0], // Dashboard
    mainNav[1], // Bills
    masterNav[0], // Farmers
    financeNav[0], // Payments
  ];

  return (
    <>
      {/* Bottom Nav Bar */}
      <nav className="lg:hidden fixed bottom-1 left-0 right-0 z-50 px-4 pb-4 pointer-events-none w-full no-print">
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
                className={`flex flex-col items-center justify-center gap-1.5 min-w-[72px] transition-all duration-300 ${
                  isActive ? "transform translateY(-2px)" : ""
                }`}
              >
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${
                    isActive
                      ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200"
                      : "text-slate-400"
                  }`}
                >
                  <Icon size={24} strokeWidth={isActive ? 2.5 : 2} />
                </div>
                <span
                  className={`text-[11px] font-bold uppercase tracking-tight ${
                    isActive
                      ? "text-emerald-700"
                      : "text-slate-400 opacity-0 scale-50"
                  } transition-all duration-300`}
                >
                  {t(`nav.${tab.key}`)}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
