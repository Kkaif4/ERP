"use client";

import { useTranslation } from "@/lib/i18n";
import {
  FileText,
  TrendingUp,
  BarChart3,
  ArrowRight,
  User,
  ShoppingCart,
  ShieldAlert,
  Landmark,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { getSession } from "@/lib/auth";

export default function ReportsIndexPage() {
  const { t } = useTranslation();
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    // Simple client-side session check for UI filtering
    fetch("/api/auth/me")
      .then((r) => (r.ok ? r.json() : null))
      .then((u) => u && setRole(u.role));
  }, []);

  const sections = [
    {
      title: t("reports.types.operational"),
      description: t("reports.desc.operational"),
      href: "/reports/operational",
      icon: BarChart3,
      color: "#15803d",
      adminOnly: false,
    },
    {
      title: t("reports.types.financial"),
      description: t("reports.desc.financial"),
      href: "/reports/financial",
      icon: Landmark,
      color: "#7c3aed",
      adminOnly: true,
    },
    {
      title: t("reports.types.insights"),
      description: t("reports.desc.insights"),
      href: "/reports/insights",
      icon: TrendingUp,
      color: "#0369a1",
      adminOnly: true,
    },
  ];

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "2rem",
        width: "100%",
        padding: "0",
      }}
    >
      {/* Header */}
      <div>
        <h1
          style={{
            fontSize: "clamp(1.5rem, 5vw, 1.875rem)",
            fontWeight: 900,
            color: "var(--text-main)",
            letterSpacing: "-0.02em",
            margin: 0,
          }}
        >
          {t("nav.reports")}
        </h1>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            marginTop: "6px",
          }}
        >
          <div
            style={{
              height: "3px",
              width: "24px",
              backgroundColor: "var(--primary-main)",
              borderRadius: "2px",
            }}
          />
          <p
            style={{
              margin: 0,
              fontSize: "clamp(10px, 2vw, 11px)",
              fontWeight: 800,
              color: "var(--text-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.15em",
            }}
          >
            {t("reports.subtitle")}
          </p>
        </div>
      </div>

      {/* Grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit, minmax(min(100%, 300px), 1fr))",
          gap: "1.5rem",
        }}
      >
        {sections.map((section) => {
          const isLocked =
            section.adminOnly && role !== "ORG_ADMIN" && role !== null;

          return (
            <Link
              key={section.href}
              href={isLocked ? "#" : section.href}
              style={{
                textDecoration: "none",
                pointerEvents: isLocked ? "none" : "auto",
                opacity: isLocked ? 0.6 : 1,
              }}
            >
              <div
                className="premium-card"
                style={{
                  padding: "clamp(1.5rem, 5vw, 2rem)",
                  height: "100%",
                  display: "flex",
                  flexDirection: "column",
                  gap: "1.25rem",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    width: "56px",
                    height: "56px",
                    backgroundColor: `${section.color}15`,
                    borderRadius: "16px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: section.color,
                    flexShrink: 0,
                  }}
                >
                  <section.icon size={28} />
                </div>

                <div>
                  <h2
                    style={{
                      margin: "0 0 8px",
                      fontSize: "clamp(1.125rem, 4vw, 1.25rem)",
                      fontWeight: 900,
                      color: "var(--text-main)",
                    }}
                  >
                    {section.title}
                  </h2>
                  <p
                    style={{
                      margin: 0,
                      fontSize: "clamp(13px, 3vw, 14px)",
                      fontWeight: 600,
                      color: "var(--text-muted)",
                      lineHeight: 1.5,
                    }}
                  >
                    {section.description}
                  </p>
                </div>

                <div
                  style={{
                    marginTop: "auto",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    color: section.color,
                    fontWeight: 800,
                    fontSize: "clamp(11px, 2vw, 12px)",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                    flexWrap: "wrap",
                  }}
                >
                  {isLocked ? (
                    <span
                      style={{
                        color: "#94a3b8",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      <ShieldAlert size={14} /> ADMIN ONLY
                    </span>
                  ) : (
                    <>
                      VIEW REPORT <ArrowRight size={14} />
                    </>
                  )}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <style jsx>{`
        @media (max-width: 640px) {
          div:first-child {
            padding: 0 16px;
          }
        }

        @media (max-width: 480px) {
          div:first-child {
            padding: 0 12px;
          }
        }
      `}</style>
    </div>
  );
}
