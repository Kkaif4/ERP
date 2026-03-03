"use client";

import Link from "next/link";
import {
  LayoutDashboard,
  Users,
  UserPlus,
  Receipt,
  TrendingDown,
  BookOpen,
  ArrowRight,
  ShieldCheck,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";

export default function HomeClient() {
  const { t } = useTranslation();

  const features = [
    {
      title: t("common.features.smartBilling"),
      desc: t("common.features.smartBillingDesc"),
      icon: <Receipt size={24} />,
    },
    {
      title: t("common.features.farmerManagement"),
      desc: t("common.features.farmerManagementDesc"),
      icon: <Users size={24} />,
    },
    {
      title: t("common.features.customerCRM"),
      desc: t("common.features.customerCRMDesc"),
      icon: <UserPlus size={24} />,
    },
    {
      title: t("common.features.expenseTracker"),
      desc: t("common.features.expenseTrackerDesc"),
      icon: <TrendingDown size={24} />,
    },
    {
      title: t("common.features.ledgerHistory"),
      desc: t("common.features.ledgerHistoryDesc"),
      icon: <BookOpen size={24} />,
    },
    {
      title: t("common.features.adminDashboard"),
      desc: t("common.features.adminDashboardDesc"),
      icon: <LayoutDashboard size={24} />,
    },
  ];

  return (
    <main
      style={{
        minHeight: "100vh",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#f8fafc",
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Ambient Background Glows */}
      <div
        style={{
          position: "absolute",
          top: "-100px",
          right: "-100px",
          width: "600px",
          height: "600px",
          background:
            "radial-gradient(ellipse at center, rgba(21,128,61,0.08) 0%, transparent 70%)",
          borderRadius: "50%",
          pointerEvents: "none",
          filter: "blur(60px)",
        }}
      />
      <div
        style={{
          position: "absolute",
          bottom: "-150px",
          left: "-100px",
          width: "500px",
          height: "500px",
          background:
            "radial-gradient(ellipse at center, rgba(21,128,61,0.05) 0%, transparent 70%)",
          borderRadius: "50%",
          pointerEvents: "none",
          filter: "blur(50px)",
        }}
      />

      {/* Navigation Header */}
      <nav
        style={{
          width: "100%",
          padding: "1.5rem 2rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          maxWidth: "1200px",
          margin: "0 auto",
          zIndex: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "40px",
              height: "40px",
              backgroundColor: "#15803d",
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow: "0 4px 12px rgba(21,128,61,0.2)",
            }}
          >
            <ShieldCheck color="#fff" size={24} />
          </div>
          <span
            style={{
              fontSize: "1.25rem",
              fontWeight: 800,
              color: "#0f172a",
              letterSpacing: "-0.02em",
            }}
          >
            Sabzi Mandi <span style={{ color: "#15803d" }}>ERP</span>
          </span>
        </div>

        <div style={{ display: "flex", gap: "12px" }}>
          <Link
            href="/login"
            style={{
              padding: "0.6rem 1.25rem",
              fontSize: "0.875rem",
              fontWeight: 600,
              color: "#475569",
              textDecoration: "none",
              borderRadius: "10px",
              transition: "all 0.2s",
            }}
          >
            {t("auth.login")}
          </Link>
          <Link
            href="/register"
            style={{
              padding: "0.6rem 1.25rem",
              fontSize: "0.875rem",
              fontWeight: 700,
              color: "#fff",
              backgroundColor: "#15803d",
              textDecoration: "none",
              borderRadius: "10px",
              boxShadow: "0 4px 12px rgba(21,128,61,0.2)",
              transition: "all 0.2s",
            }}
          >
            {t("common.getStarted")}
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section
        style={{
          maxWidth: "1200px",
          margin: "4rem auto",
          padding: "0 2rem",
          textAlign: "center",
          zIndex: 10,
        }}
      >
        <div
          style={{
            display: "inline-flex",
            padding: "0.5rem 1rem",
            backgroundColor: "rgba(21,128,61,0.08)",
            color: "#15803d",
            borderRadius: "50px",
            fontSize: "0.75rem",
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "0.1em",
            marginBottom: "1.5rem",
          }}
        >
          {t("common.everythingYouNeed")}
        </div>
        <h1
          style={{
            fontSize: "calc(2.5rem + 1.5vw)",
            fontWeight: 900,
            color: "#0f172a",
            letterSpacing: "-0.04em",
            lineHeight: 1.1,
            marginBottom: "1.5rem",
            maxWidth: "800px",
            margin: "0 auto 1.5rem",
          }}
        >
          {t("common.streamlineBusiness")}{" "}
          <span style={{ color: "#15803d" }}>{t("common.business")}</span>{" "}
          {t("common.management")}
        </h1>
        <p
          style={{
            fontSize: "1.125rem",
            color: "#64748b",
            lineHeight: 1.6,
            maxWidth: "600px",
            margin: "0 auto 2.5rem",
          }}
        >
          {t("common.heroDescription")}
        </p>

        <div style={{ display: "flex", justifyContent: "center", gap: "16px" }}>
          <Link
            href="/register"
            style={{
              padding: "1rem 2rem",
              fontSize: "1rem",
              fontWeight: 700,
              color: "#fff",
              backgroundColor: "#15803d",
              textDecoration: "none",
              borderRadius: "14px",
              boxShadow: "0 8px 20px rgba(21,128,61,0.25)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              transition: "all 0.2s",
            }}
          >
            {t("common.startFreeRegistration")} <ArrowRight size={18} />
          </Link>
        </div>
      </section>

      {/* Features Grid */}
      <section
        style={{
          maxWidth: "1200px",
          margin: "4rem auto 8rem",
          padding: "0 2rem",
          zIndex: 10,
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "24px",
          }}
        >
          {features.map((feature, i) => (
            <div
              key={i}
              style={{
                backgroundColor: "#fff",
                padding: "2rem",
                borderRadius: "24px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 4px 6px rgba(0,0,0,0.02)",
                transition: "all 0.3s ease",
              }}
            >
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  backgroundColor: "rgba(21,128,61,0.08)",
                  color: "#15803d",
                  borderRadius: "14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: "1.5rem",
                }}
              >
                {feature.icon}
              </div>
              <h3
                style={{
                  fontSize: "1.125rem",
                  fontWeight: 700,
                  color: "#0f172a",
                  marginBottom: "0.75rem",
                }}
              >
                {feature.title}
              </h3>
              <p
                style={{
                  color: "#64748b",
                  fontSize: "0.875rem",
                  lineHeight: 1.5,
                }}
              >
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          width: "100%",
          padding: "4rem 2rem",
          backgroundColor: "#fff",
          borderTop: "1px solid #e2e8f0",
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <p
            style={{
              fontSize: "0.875rem",
              color: "#94a3b8",
              fontWeight: 500,
              letterSpacing: "0.05em",
            }}
          >
            &copy; 2026 {t("common.footer")}
          </p>
        </div>
      </footer>
    </main>
  );
}
