"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "@/lib/i18n";
import {
  ChevronRight,
  LogOut,
  Store,
  ShieldCheck,
  X,
  Globe,
} from "lucide-react";
import { mainNav, masterNav, financeNav, systemNav } from "@/lib/navigation";

function SectionLabel({ label }: { label: string }) {
  return (
    <p
      style={{
        fontSize: "9px",
        fontWeight: 900,
        letterSpacing: "0.22em",
        textTransform: "uppercase",
        color: "#94a3b8",
        paddingLeft: "10px",
        marginBottom: "3px",
        marginTop: "0",
      }}
    >
      {label}
    </p>
  );
}

function NavGroup({
  label,
  items,
  pathname,
  t,
  onClose,
}: {
  label: string;
  items: { key: string; href: string; icon: React.ElementType }[];
  pathname: string;
  t: (key: string) => string;
  onClose?: () => void;
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
              onClick={onClose}
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
                ...(isActive
                  ? {
                      backgroundColor: "rgba(21,128,61,0.09)",
                      color: "#15803d",
                      boxShadow: "inset 0 0 0 1.5px rgba(21,128,61,0.15)",
                    }
                  : {
                      color: "#64748b",
                      backgroundColor: "transparent",
                    }),
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = "#f8fafc";
                  e.currentTarget.style.color = "#15803d";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.backgroundColor = "transparent";
                  e.currentTarget.style.color = "#64748b";
                }
              }}
            >
              <div
                style={{
                  width: "30px",
                  height: "30px",
                  borderRadius: "9px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                  backgroundColor: isActive
                    ? "rgba(21,128,61,0.12)"
                    : "#f1f5f9",
                  color: isActive ? "#15803d" : "#94a3b8",
                  transition: "all 0.2s",
                }}
              >
                <Icon size={15} strokeWidth={isActive ? 2.5 : 2} />
              </div>
              <span style={{ flex: 1 }}>{t(`nav.${item.key}`)}</span>
              {isActive && (
                <ChevronRight
                  size={13}
                  style={{ color: "#15803d", opacity: 0.6 }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </div>
  );
}

export function Sidebar({
  role,
  isOpen,
  onClose,
}: {
  role: string;
  isOpen?: boolean;
  onClose?: () => void;
}) {
  const { t, language, setLanguage } = useTranslation();
  const pathname = usePathname();

  const languages = [
    { code: "en", name: "English", short: "EN" },
    { code: "hi", name: "हिन्दी", short: "हि" },
    { code: "mr", name: "मराठी", short: "म" },
  ] as const;

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] animate-in fade-in duration-300"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-[101] w-[280px] bg-white border-r border-slate-200 transition-transform duration-300 lg:sticky lg:translate-x-0 lg:z-30 lg:flex lg:w-68 no-print ${
          isOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full"
        }`}
        style={{
          height: "100vh",
          flexDirection: "column",
          display: "flex",
        }}
      >
        {/* Thin top emerald accent stripe */}
        <div
          style={{
            height: "3px",
            background:
              "linear-gradient(90deg, #15803d 0%, #34d399 60%, transparent 100%)",
            flexShrink: 0,
          }}
        />

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            height: "100%",
            padding: "0.875rem 0.875rem",
            overflowY: "auto",
          }}
        >
          {/* ── Logo & Close ── */}
          <div className="flex items-center justify-between mb-4">
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                padding: "10px 12px",
                background: "linear-gradient(135deg, #15803d, #16a34a)",
                borderRadius: "16px",
                flex: 1,
                boxShadow: "0 6px 16px rgba(21,128,61,0.2)",
              }}
            >
              <div
                style={{
                  width: "34px",
                  height: "34px",
                  backgroundColor: "rgba(255,255,255,0.2)",
                  borderRadius: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Store size={19} color="white" strokeWidth={2.5} />
              </div>
              <div>
                <h1
                  style={{
                    fontSize: "15px",
                    fontWeight: 900,
                    color: "#fff",
                    letterSpacing: "-0.02em",
                    lineHeight: 1.2,
                    margin: 0,
                  }}
                >
                  Mandi ERP
                </h1>
                <p
                  style={{
                    margin: 0,
                    fontSize: "8px",
                    fontWeight: 800,
                    color: "rgba(255,255,255,0.7)",
                    letterSpacing: "0.2em",
                    textTransform: "uppercase",
                  }}
                >
                  v1.0 Premium
                </p>
              </div>
            </div>

            {/* Close button for mobile */}
            <button
              onClick={onClose}
              className="lg:hidden ml-2 w-10 h-10 flex items-center justify-center text-slate-400 hover:bg-slate-100 rounded-xl transition-colors"
            >
              <X size={24} />
            </button>
          </div>

          {/* ── Navigation ── */}
          <nav style={{ flex: 1 }}>
            <NavGroup
              label={t("nav.sections.main") || "Main"}
              items={mainNav}
              pathname={pathname}
              t={t}
              onClose={onClose}
            />
            <NavGroup
              label={t("nav.sections.master") || "Master"}
              items={masterNav}
              pathname={pathname}
              t={t}
              onClose={onClose}
            />
            <NavGroup
              label={t("nav.sections.finance") || "Finance"}
              items={financeNav.filter(
                (item) => !item.adminOnly || role === "ORG_ADMIN",
              )}
              pathname={pathname}
              t={t}
              onClose={onClose}
            />
            {role === "ORG_ADMIN" && (
              <NavGroup
                label={t("nav.sections.system") || "System"}
                items={systemNav}
                pathname={pathname}
                t={t}
                onClose={onClose}
              />
            )}

            {role === "SUPER_ADMIN" && (
              <Link
                href="/admin"
                onClick={onClose}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "10px 14px",
                  borderRadius: "14px",
                  textDecoration: "none",
                  fontSize: "13px",
                  fontWeight: 800,
                  color: "#15803d",
                  border: "1.5px dashed rgba(21,128,61,0.3)",
                  marginTop: "0.5rem",
                  transition: "all 0.2s",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor =
                    "rgba(21,128,61,0.06)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = "transparent";
                }}
              >
                <div
                  style={{
                    width: "34px",
                    height: "34px",
                    borderRadius: "10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    backgroundColor: "rgba(21,128,61,0.08)",
                    color: "#15803d",
                  }}
                >
                  <ShieldCheck size={17} />
                </div>
                <span>{t("nav.admin")}</span>
              </Link>
            )}
          </nav>

          {/* ── Language selection for mobile drawer ── */}
          <div className="lg:hidden mb-6 pt-4 border-t border-slate-100">
            <SectionLabel label={t("common.language") || "Language"} />
            <div className="grid grid-cols-3 gap-2 px-2 mt-2">
              {languages.map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => setLanguage(lang.code)}
                  style={{
                    padding: "8px 4px",
                    borderRadius: "10px",
                    fontSize: "10px",
                    fontWeight: 800,
                    transition: "all 0.2s",
                    border: "1px solid",
                    ...(language === lang.code
                      ? {
                          backgroundColor: "#15803d",
                          borderColor: "#15803d",
                          color: "#fff",
                          boxShadow: "0 4px 12px rgba(21,128,61,0.2)",
                        }
                      : {
                          backgroundColor: "#fff",
                          borderColor: "#e2e8f0",
                          color: "#64748b",
                        }),
                  }}
                >
                  {lang.short}
                </button>
              ))}
            </div>
          </div>

          {/* ── Footer / Logout ── */}
          <div
            style={{
              paddingTop: "0.625rem",
              borderTop: "1px solid #f1f5f9",
              marginTop: "0.25rem",
            }}
          >
            <button
              onClick={handleLogout}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                width: "100%",
                padding: "7px 10px",
                borderRadius: "12px",
                border: "none",
                backgroundColor: "transparent",
                cursor: "pointer",
                fontSize: "12.5px",
                fontWeight: 800,
                color: "#94a3b8",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#fef2f2";
                e.currentTarget.style.color = "#ef4444";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "transparent";
                e.currentTarget.style.color = "#94a3b8";
              }}
            >
              <div
                style={{
                  width: "30px",
                  height: "30px",
                  borderRadius: "9px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: "#f1f5f9",
                }}
              >
                <LogOut size={15} />
              </div>
              <span>{t("common.logout")}</span>
            </button>

            <p
              style={{
                marginTop: "0.5rem",
                paddingLeft: "10px",
                fontSize: "8px",
                fontWeight: 800,
                color: "#cbd5e1",
                textTransform: "uppercase",
                letterSpacing: "0.3em",
              }}
            >
              Secure Portal © 2026
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
