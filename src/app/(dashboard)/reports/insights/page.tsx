"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "@/lib/i18n";
import {
  TrendingUp,
  Download,
  Loader2,
  RefreshCcw,
  PieChart,
  Trophy,
  LineChart,
  Package,
  User,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";
import DateRangePicker from "@/components/reports/DateRangePicker";
import ReportStats from "@/components/reports/ReportStats";
import { toast } from "sonner";

export default function BusinessInsightsPage() {
  const { t } = useTranslation();
  const [startDate, setStartDate] = useState(
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
  );
  const [endDate, setEndDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<any>(null);

  const fetchInsights = async () => {
    setLoading(true);
    try {
      // Fetch all 3 types of insights
      const [profitRes, topRes, itemRes] = await Promise.all([
        fetch(
          `/api/reports/insights?type=PROFIT_SUMMARY&startDate=${startDate}&endDate=${endDate}`,
        ),
        fetch(
          `/api/reports/insights?type=TOP_PARTIES&startDate=${startDate}&endDate=${endDate}`,
        ),
        fetch(
          `/api/reports/insights?type=ITEM_TRENDS&startDate=${startDate}&endDate=${endDate}`,
        ),
      ]);

      if (profitRes.ok && topRes.ok && itemRes.ok) {
        const profitData = await profitRes.json();
        const topData = await topRes.json();
        const itemData = await itemRes.json();
        setInsights({ ...profitData, ...topData, items: itemData.data });
      } else {
        toast.error(t("common.error"));
      }
    } catch (error) {
      toast.error(t("common.error"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInsights();
  }, [startDate, endDate]);

  const stats = insights?.summary
    ? [
        {
          label: t("reports.insights.grossRevenue"),
          value: insights.summary.grossRevenue,
          icon: TrendingUp,
          color: "#0369a1",
        },
        {
          label: t("reports.insights.netEarnings"),
          value: insights.summary.earnings,
          icon: PieChart,
          color: "#15803d",
        },
      ]
    : [];

  const handleDownloadPDF = () => {
    if (!insights) return;

    let html = "";

    // Stats
    html += '<div class="stats-grid">';
    stats.forEach((s) => {
      html +=
        '<div class="stat-box">' +
        '<div class="stat-label">' +
        s.label +
        "</div>" +
        '<div class="stat-value">₹ ' +
        s.value.toLocaleString("en-IN") +
        "</div>" +
        "</div>";
    });
    html += "</div>";

    // Top Parties
    html +=
      '<div style="display:grid; grid-template-columns: 1fr 1fr; gap: 30px; margin-top: 30px;">' +
      '<div><h3 style="border-bottom: 2px solid #0369a1; padding-bottom: 5px;">' +
      t("reports.insights.topCustomers").toUpperCase() +
      "</h3>";
    insights.customers.forEach((c: any, i: number) => {
      html +=
        '<p style="font-size: 12px; margin: 8px 0;">' +
        (i + 1) +
        ". <strong>" +
        c.name +
        "</strong> - ₹ " +
        c.amount.toLocaleString("en-IN") +
        "</p>";
    });
    html +=
      '</div><div><h3 style="border-bottom: 2px solid #15803d; padding-bottom: 5px;">' +
      t("reports.insights.topFarmers").toUpperCase() +
      "</h3>";
    insights.farmers.forEach((f: any, i: number) => {
      html +=
        '<p style="font-size: 12px; margin: 8px 0;">' +
        (i + 1) +
        ". <strong>" +
        f.name +
        "</strong> - ₹ " +
        f.amount.toLocaleString("en-IN") +
        "</p>";
    });
    html += "</div></div>";

    // Item Trends
    html +=
      '<h3 style="margin-top: 40px; border-bottom: 2px solid #ea580c; padding-bottom: 5px;">' +
      t("reports.insights.itemSalesTrends").toUpperCase() +
      "</h3>" +
      "<table><thead><tr><th>" +
      t("reports.insights.item") +
      "</th><th>" +
      t("reports.insights.qtySold") +
      '</th><th class="text-right">' +
      t("reports.insights.revenue") +
      "</th></tr></thead><tbody>";
    insights.items.forEach((item: any) => {
      html +=
        "<tr>" +
        "<td><strong>" +
        item.name +
        "</strong></td>" +
        "<td>" +
        item.quantity +
        " units</td>" +
        '<td class="text-right">₹ ' +
        item.revenue.toLocaleString("en-IN") +
        "</td>" +
        "</tr>";
    });
    html += "</tbody></table>";
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <div style={{ marginBottom: "1rem" }}>
            <Link
              href="/reports"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                color: "var(--text-muted)",
                fontSize: "12px",
                fontWeight: 800,
                textDecoration: "none",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
              }}
            >
              <ArrowLeft size={16} />
              {t("common.back") || "BACK"}
            </Link>
          </div>

          <h1
            style={{
              fontSize: "clamp(1.5rem, 5vw, 1.875rem)",
              fontWeight: 900,
              color: "var(--text-main)",
              letterSpacing: "-0.02em",
              margin: 0,
            }}
          >
            {t("reports.types.insights")}
          </h1>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={fetchInsights}
            style={{
              padding: "10px",
              backgroundColor: "#f8fafc",
              border: "1px solid var(--border-main)",
              borderRadius: "12px",
              cursor: "pointer",
            }}
          >
            <RefreshCcw size={18} className={loading ? "animate-spin" : ""} />
          </button>

          <button
            onClick={handleDownloadPDF}
            disabled={loading || !insights}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 16px",
              backgroundColor: "#0369a1",
              color: "#fff",
              borderRadius: "12px",
              border: "none",
              fontWeight: 800,
              cursor: "pointer",
              opacity: loading || !insights ? 0.5 : 1,
            }}
          >
            <Download size={16} /> PDF
          </button>
        </div>
      </div>

      <DateRangePicker
        startDate={startDate}
        endDate={endDate}
        onStartChange={setStartDate}
        onEndChange={setEndDate}
      />

      {loading && (
        <div style={{ textAlign: "center", padding: "2rem" }}>
          <Loader2 size={32} className="animate-spin" color="#0369a1" />
        </div>
      )}

      {!loading && insights && (
        <>
          <ReportStats stats={stats} />

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
              gap: "1.5rem",
            }}
          >
            {/* Top Customers */}
            <div className="premium-card" style={{ padding: "1.5rem" }}>
              <h3 style={{ marginBottom: "1rem", fontWeight: 900 }}>
                {t("reports.insights.topCustomers").toUpperCase()}
              </h3>

              {insights.customers.map((c: any, i: number) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "10px",
                    background: "#f8fafc",
                    borderRadius: "8px",
                    marginBottom: "8px",
                  }}
                >
                  <span>{c.name}</span>
                  <strong>₹ {c.amount.toLocaleString("en-IN")}</strong>
                </div>
              ))}
            </div>

            {/* Top Farmers */}
            <div className="premium-card" style={{ padding: "1.5rem" }}>
              <h3 style={{ marginBottom: "1rem", fontWeight: 900 }}>
                {t("reports.insights.topFarmers").toUpperCase()}
              </h3>

              {insights.farmers.map((f: any, i: number) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "10px",
                    background: "#f8fafc",
                    borderRadius: "8px",
                    marginBottom: "8px",
                  }}
                >
                  <span>{f.name}</span>
                  <strong>₹ {f.amount.toLocaleString("en-IN")}</strong>
                </div>
              ))}
            </div>
          </div>

          {/* Item Trends */}
          <div className="premium-card" style={{ padding: "1.5rem" }}>
            <h3 style={{ marginBottom: "1rem", fontWeight: 900 }}>
              {t("reports.insights.itemSalesTrends").toUpperCase()}
            </h3>

            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr>
                  <th style={{ textAlign: "left", padding: "12px" }}>
                    {t("reports.insights.item")}
                  </th>
                  <th style={{ textAlign: "left", padding: "12px" }}>
                    {t("reports.insights.qtySold")}
                  </th>
                  <th style={{ textAlign: "right", padding: "12px" }}>
                    {t("reports.insights.revenue")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {insights.items.map((item: any, i: number) => (
                  <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "12px" }}>{item.name}</td>
                    <td style={{ padding: "12px" }}>{item.quantity} units</td>
                    <td style={{ padding: "12px", textAlign: "right" }}>
                      ₹ {item.revenue.toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <style>{`
      .animate-spin { animation: spin 1s linear infinite; }
      @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
    `}</style>
    </div>
  );
}
