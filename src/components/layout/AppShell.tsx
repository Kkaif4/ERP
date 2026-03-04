"use client";

import React from "react";
import { Sidebar } from "./Sidebar";
import { BottomNav } from "./BottomNav";
import { useTranslation } from "@/lib/i18n";
import { User, Menu } from "lucide-react";
import { UserProvider } from "../providers/UserContext";

interface AppShellProps {
  children: React.ReactNode;
  user: {
    id: string;
    name: string;
    role: string;
    organizationId?: string;
  };
}

export function AppShell({ children, user }: AppShellProps) {
  const { t } = useTranslation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);

  return (
    <UserProvider user={user}>
      <div className="flex min-h-screen bg-[#f8fafc]">
        {/* Sidebar */}
        <Sidebar
          role={user.role}
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
        />

        <div
          className="flex flex-col flex-1 min-w-0"
          style={{
            paddingBottom: "calc(5rem + env(safe-area-inset-bottom, 0px))",
          }}
          data-shell-content="true"
        >
          <style>{`
            @media (min-width: 1024px) {
              [data-shell-content="true"] {
                padding-bottom: 0 !important;
              }
            }
          `}</style>

          {/* Header */}
          <header className="sticky top-0 z-40 h-16 bg-white/80 border-b border-slate-200/50 backdrop-blur-xl flex items-center justify-between layout-container no-print">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="lg:hidden w-10 h-10 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                <Menu size={24} />
              </button>

              <h2 className="text-xl font-black text-slate-800 lg:hidden tracking-tight">
                Mandi ERP
              </h2>
            </div>

            {/* User Section */}
            <div className="flex items-center gap-4 pl-3 sm:pl-6 border-l border-slate-200">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-black text-slate-800 leading-none mb-1">
                  {user.name}
                </p>
                <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest opacity-80">
                  {user.role === "ORG_ADMIN"
                    ? t("common.roles.admin")
                    : t("common.roles.staff")}
                </p>
              </div>

              <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 shadow-sm">
                <User size={20} />
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="layout-container flex flex-col gap-8 flex-1 py-6 lg:py-10 max-w-[1600px] animate-in fade-in duration-700 !mt-4 !mb-20">
            {children}
          </main>
        </div>

        {/* Mobile Bottom Navigation */}
        <BottomNav role={user.role} />
      </div>
    </UserProvider>
  );
}
