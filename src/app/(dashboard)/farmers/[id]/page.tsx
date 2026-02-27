"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useTranslation } from "@/lib/i18n";
import {
  ArrowLeft,
  Phone,
  Wallet,
  Plus,
  Loader2,
  X,
  ReceiptText,
  Banknote,
  TrendingUp,
  TrendingDown,
  Calendar,
} from "lucide-react";
import { toast } from "sonner";
import { paymentSchema } from "@/lib/schemas";

interface LedgerEntry {
  id: string;
  date: string;
  type: "BILL" | "PAYMENT";
  description: string;
  debit: number;
  credit: number;
  runningBalance: number;
  meta?: string;
}

interface Farmer {
  id: string;
  name: string;
  mobile: string;
  balance: number;
}

const GREEN = "#15803d";
const GREEN_BG = "rgba(21,128,61,0.09)";

export default function FarmerLedgerPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { t, language } = useTranslation();

  const [farmer, setFarmer] = useState<Farmer | null>(null);
  const [ledger, setLedger] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    amount: "",
    mode: "CASH",
    notes: "",
    paymentDate: new Date().toISOString().split("T")[0],
  });
  const [roundOff, setRoundOff] = useState(false);

  const fetchLedger = async () => {
    try {
      const res = await fetch(`/api/farmers/${id}/ledger`);
      const data = await res.json();
      setFarmer(data.farmer);
      setLedger(data.ledger || []);
    } catch {
      toast.error("Failed to load ledger");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLedger();
  }, [id]);

  const outstandingBalance = farmer ? Number(farmer.balance) : 0;
  const paymentAmount = parseFloat(form.amount) || 0;
  const remainingDue = Math.max(0, outstandingBalance - paymentAmount);
  const canRoundOff = paymentAmount > 0 && paymentAmount < outstandingBalance;

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const roundOffAmount = canRoundOff && roundOff ? remainingDue : 0;
    const data = {
      farmerId: id,
      amount: parseFloat(form.amount) || 0,
      mode: form.mode as any,
      notes: form.notes || undefined,
      paymentDate: form.paymentDate,
      roundOff: canRoundOff && roundOff,
      roundOffAmount,
    };

    const result = paymentSchema.safeParse(data);
    if (!result.success) {
      toast.error(result.error.issues[0].message);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        toast.success(t("payments.successAdd") || "Payment recorded");
        setShowModal(false);
        setRoundOff(false);
        setForm({
          amount: "",
          mode: "CASH",
          notes: "",
          paymentDate: new Date().toISOString().split("T")[0],
        });
        fetchLedger();
      } else {
        const err = await res.json();
        toast.error(err.error || "Failed to record payment");
      }
    } catch {
      toast.error("Failed to record payment");
    } finally {
      setSubmitting(false);
    }
  };

  const fmt = (n: number) =>
    `₹ ${Math.abs(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  const fmtDate = (d: string) =>
    new Date(d).toLocaleDateString(
      language === "hi" ? "hi-IN" : language === "mr" ? "mr-IN" : "en-IN",
      { day: "numeric", month: "short", year: "numeric" },
    );

  if (loading)
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "60vh",
        }}
      >
        <Loader2
          size={40}
          color={GREEN}
          style={{ animation: "spin 0.8s linear infinite" }}
        />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );

  if (!farmer)
    return (
      <div style={{ textAlign: "center", padding: "4rem" }}>
        <p style={{ color: "#94a3b8", fontWeight: 700 }}>Farmer not found.</p>
      </div>
    );

  const balance = Number(farmer.balance);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
      {/* ── Back + Header ── */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <button
            onClick={() => router.push("/farmers")}
            style={{
              width: "40px",
              height: "40px",
              borderRadius: "12px",
              border: "1.5px solid var(--border-main)",
              backgroundColor: "#fff",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              color: "#64748b",
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = "#f8fafc";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = "#fff";
            }}
          >
            <ArrowLeft size={18} />
          </button>
          <div>
            <h1
              style={{
                fontSize: "1.75rem",
                fontWeight: 900,
                color: "var(--text-main)",
                letterSpacing: "-0.02em",
                margin: 0,
                lineHeight: 1.2,
              }}
            >
              {farmer.name}
            </h1>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                marginTop: "4px",
              }}
            >
              <Phone size={12} color="#94a3b8" />
              <span
                style={{ fontSize: "12px", fontWeight: 700, color: "#94a3b8" }}
              >
                {farmer.mobile}
              </span>
            </div>
          </div>
        </div>

        <button
          onClick={() => setShowModal(true)}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 20px",
            backgroundColor: GREEN,
            color: "#fff",
            borderRadius: "12px",
            fontWeight: 800,
            fontSize: "14px",
            border: "none",
            cursor: "pointer",
            boxShadow: "0 8px 16px rgba(21,128,61,0.2)",
            letterSpacing: "0.02em",
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "none";
          }}
        >
          <Plus size={16} strokeWidth={3} />
          {t("payments.record") || "Record Payment"}
        </button>
      </div>

      {/* ── Balance Card ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
          gap: "1rem",
        }}
      >
        {/* Main balance */}
        <div
          className="premium-card"
          style={{
            padding: "1.75rem",
            borderLeft: `4px solid ${balance > 0 ? "#d97706" : GREEN}`,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "0.75rem",
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: "10px",
                fontWeight: 900,
                color: "#94a3b8",
                textTransform: "uppercase",
                letterSpacing: "0.18em",
              }}
            >
              {t("ledger.currentBalance") || "Current Balance"}
            </p>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                backgroundColor: balance > 0 ? "rgba(217,119,6,0.1)" : GREEN_BG,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Wallet size={18} color={balance > 0 ? "#d97706" : GREEN} />
            </div>
          </div>
          <p
            style={{
              margin: 0,
              fontSize: "1.875rem",
              fontWeight: 900,
              color: balance > 0 ? "#d97706" : GREEN,
              letterSpacing: "-0.02em",
            }}
          >
            {fmt(balance)}
          </p>
          <p
            style={{
              margin: "4px 0 0",
              fontSize: "11px",
              fontWeight: 700,
              color: "#94a3b8",
            }}
          >
            {balance > 0
              ? t("ledger.youOwe") || "You owe this farmer"
              : t("ledger.settled") || "Fully settled"}
          </p>
        </div>

        {/* Total billed */}
        <div className="premium-card" style={{ padding: "1.75rem" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "0.75rem",
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: "10px",
                fontWeight: 900,
                color: "#94a3b8",
                textTransform: "uppercase",
                letterSpacing: "0.18em",
              }}
            >
              {t("ledger.totalBilled") || "Total Purchased"}
            </p>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                backgroundColor: GREEN_BG,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ReceiptText size={18} color={GREEN} />
            </div>
          </div>
          <p
            style={{
              margin: 0,
              fontSize: "1.875rem",
              fontWeight: 900,
              color: "var(--text-main)",
              letterSpacing: "-0.02em",
            }}
          >
            {fmt(
              ledger
                .filter((e) => e.type === "BILL")
                .reduce((s, e) => s + e.credit, 0),
            )}
          </p>
          <p
            style={{
              margin: "4px 0 0",
              fontSize: "11px",
              fontWeight: 700,
              color: "#94a3b8",
            }}
          >
            {ledger.filter((e) => e.type === "BILL").length}{" "}
            {t("ledger.bills") || "bills"}
          </p>
        </div>

        {/* Total paid */}
        <div className="premium-card" style={{ padding: "1.75rem" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "0.75rem",
            }}
          >
            <p
              style={{
                margin: 0,
                fontSize: "10px",
                fontWeight: 900,
                color: "#94a3b8",
                textTransform: "uppercase",
                letterSpacing: "0.18em",
              }}
            >
              {t("ledger.totalPaid") || "Total Paid Out"}
            </p>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "10px",
                backgroundColor: "rgba(14,165,233,0.08)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Banknote size={18} color="#0ea5e9" />
            </div>
          </div>
          <p
            style={{
              margin: 0,
              fontSize: "1.875rem",
              fontWeight: 900,
              color: "var(--text-main)",
              letterSpacing: "-0.02em",
            }}
          >
            {fmt(
              ledger
                .filter((e) => e.type === "PAYMENT")
                .reduce((s, e) => s + e.debit, 0),
            )}
          </p>
          <p
            style={{
              margin: "4px 0 0",
              fontSize: "11px",
              fontWeight: 700,
              color: "#94a3b8",
            }}
          >
            {ledger.filter((e) => e.type === "PAYMENT").length}{" "}
            {t("ledger.payments") || "payments"}
          </p>
        </div>
      </div>

      {/* ── Ledger Table ── */}
      <div className="premium-card" style={{ overflow: "hidden" }}>
        <div
          style={{
            padding: "1.25rem 1.5rem",
            borderBottom: "1px solid #f1f5f9",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <div
            style={{
              width: "34px",
              height: "34px",
              borderRadius: "10px",
              backgroundColor: GREEN_BG,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: GREEN,
            }}
          >
            <Calendar size={16} />
          </div>
          <div>
            <p
              style={{
                margin: 0,
                fontSize: "13px",
                fontWeight: 900,
                color: "var(--text-main)",
              }}
            >
              {t("ledger.title") || "Ledger"}
            </p>
            <p
              style={{
                margin: 0,
                fontSize: "11px",
                fontWeight: 700,
                color: "#94a3b8",
              }}
            >
              {ledger.length} {t("ledger.entries") || "entries · chronological"}
            </p>
          </div>
        </div>

        {ledger.length === 0 ? (
          <div style={{ padding: "4rem", textAlign: "center" }}>
            <ReceiptText
              size={40}
              color="#e2e8f0"
              style={{ margin: "0 auto 1rem" }}
            />
            <p
              style={{
                margin: 0,
                fontWeight: 700,
                color: "#94a3b8",
                fontSize: "13px",
              }}
            >
              {t("ledger.noEntries") || "No transactions yet"}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="ledger-table-wrap" style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ backgroundColor: "#f8fafc" }}>
                    {[
                      "Date",
                      "Description",
                      "Debit (Paid)",
                      "Credit (Bill)",
                      "Balance",
                    ].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: "10px 20px",
                          textAlign: h === "Description" ? "left" : "right",
                          fontSize: "10px",
                          fontWeight: 900,
                          color: "#94a3b8",
                          textTransform: "uppercase",
                          letterSpacing: "0.1em",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...ledger].reverse().map((entry, i) => (
                    <tr
                      key={entry.id}
                      style={{
                        borderTop: "1px solid #f1f5f9",
                        transition: "background 0.1s",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = "#fafafa";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = "transparent";
                      }}
                    >
                      <td
                        style={{
                          padding: "14px 20px",
                          fontSize: "12px",
                          fontWeight: 700,
                          color: "#64748b",
                          whiteSpace: "nowrap",
                          textAlign: "right",
                        }}
                      >
                        {fmtDate(entry.date)}
                      </td>
                      <td style={{ padding: "14px 20px", textAlign: "left" }}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "10px",
                          }}
                        >
                          <div
                            style={{
                              width: "30px",
                              height: "30px",
                              borderRadius: "8px",
                              flexShrink: 0,
                              backgroundColor:
                                entry.type === "BILL"
                                  ? GREEN_BG
                                  : "rgba(14,165,233,0.08)",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: entry.type === "BILL" ? GREEN : "#0ea5e9",
                            }}
                          >
                            {entry.type === "BILL" ? (
                              <ReceiptText size={14} />
                            ) : (
                              <Banknote size={14} />
                            )}
                          </div>
                          <div>
                            <p
                              style={{
                                margin: 0,
                                fontSize: "13px",
                                fontWeight: 800,
                                color: "var(--text-main)",
                              }}
                            >
                              {entry.description}
                            </p>
                            {entry.meta && (
                              <p
                                style={{
                                  margin: 0,
                                  fontSize: "11px",
                                  fontWeight: 600,
                                  color: "#94a3b8",
                                }}
                              >
                                {entry.meta}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td
                        style={{
                          padding: "14px 20px",
                          textAlign: "right",
                          fontSize: "13px",
                          fontWeight: 800,
                          color: entry.debit > 0 ? "#0ea5e9" : "#cbd5e1",
                        }}
                      >
                        {entry.debit > 0 ? fmt(entry.debit) : "—"}
                      </td>
                      <td
                        style={{
                          padding: "14px 20px",
                          textAlign: "right",
                          fontSize: "13px",
                          fontWeight: 800,
                          color: entry.credit > 0 ? "#d97706" : "#cbd5e1",
                        }}
                      >
                        {entry.credit > 0 ? fmt(entry.credit) : "—"}
                      </td>
                      <td
                        style={{
                          padding: "14px 20px",
                          textAlign: "right",
                          fontSize: "13px",
                          fontWeight: 900,
                          color: entry.runningBalance > 0 ? "#d97706" : GREEN,
                          whiteSpace: "nowrap",
                        }}
                      >
                        {fmt(entry.runningBalance)}
                        {entry.runningBalance > 0 ? (
                          <TrendingUp
                            size={12}
                            style={{
                              marginLeft: "4px",
                              verticalAlign: "middle",
                            }}
                          />
                        ) : (
                          <TrendingDown
                            size={12}
                            style={{
                              marginLeft: "4px",
                              verticalAlign: "middle",
                            }}
                          />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="ledger-mobile">
              {[...ledger].reverse().map((entry) => (
                <div
                  key={entry.id}
                  style={{
                    padding: "1rem 1.25rem",
                    borderTop: "1px solid #f1f5f9",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      }}
                    >
                      <div
                        style={{
                          width: "36px",
                          height: "36px",
                          borderRadius: "10px",
                          flexShrink: 0,
                          backgroundColor:
                            entry.type === "BILL"
                              ? GREEN_BG
                              : "rgba(14,165,233,0.08)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: entry.type === "BILL" ? GREEN : "#0ea5e9",
                        }}
                      >
                        {entry.type === "BILL" ? (
                          <ReceiptText size={16} />
                        ) : (
                          <Banknote size={16} />
                        )}
                      </div>
                      <div>
                        <p
                          style={{
                            margin: 0,
                            fontSize: "13px",
                            fontWeight: 800,
                            color: "var(--text-main)",
                          }}
                        >
                          {entry.description}
                        </p>
                        <p
                          style={{
                            margin: 0,
                            fontSize: "11px",
                            fontWeight: 600,
                            color: "#94a3b8",
                          }}
                        >
                          {fmtDate(entry.date)}
                        </p>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "14px",
                          fontWeight: 900,
                          color: entry.type === "BILL" ? "#d97706" : "#0ea5e9",
                        }}
                      >
                        {entry.type === "BILL"
                          ? `+${fmt(entry.credit)}`
                          : `-${fmt(entry.debit)}`}
                      </p>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "10px",
                          fontWeight: 800,
                          color: entry.runningBalance > 0 ? "#d97706" : GREEN,
                        }}
                      >
                        Bal: {fmt(entry.runningBalance)}
                      </p>
                    </div>
                  </div>
                  {entry.meta && (
                    <p
                      style={{
                        margin: "6px 0 0 46px",
                        fontSize: "11px",
                        fontWeight: 600,
                        color: "#94a3b8",
                      }}
                    >
                      {entry.meta}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Record Payment Modal ── */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
        >
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundColor: "rgba(15,23,42,0.6)",
              backdropFilter: "blur(8px)",
            }}
            onClick={() => !submitting && setShowModal(false)}
          />
          <div
            style={{
              position: "relative",
              backgroundColor: "#fff",
              width: "100%",
              maxWidth: "440px",
              borderRadius: "24px",
              boxShadow: "0 25px 50px rgba(0,0,0,0.2)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "4px",
                background: `linear-gradient(90deg, ${GREEN}, #34d399)`,
              }}
            />
            <div
              style={{
                padding: "1.75rem 2rem 1rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div>
                <h2
                  style={{
                    margin: 0,
                    fontSize: "1.25rem",
                    fontWeight: 900,
                    color: "var(--text-main)",
                  }}
                >
                  {t("payments.record") || "Record Payment"}
                </h2>
                <p
                  style={{
                    margin: "2px 0 0",
                    fontSize: "12px",
                    fontWeight: 700,
                    color: "#94a3b8",
                  }}
                >
                  to {farmer.name}
                </p>
              </div>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  border: "none",
                  backgroundColor: "#f1f5f9",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#64748b",
                }}
              >
                <X size={18} />
              </button>
            </div>
            <form
              onSubmit={handlePayment}
              style={{
                padding: "1rem 2rem 2rem",
                display: "flex",
                flexDirection: "column",
                gap: "1.25rem",
              }}
            >
              {/* Amount */}
              <div>
                <p
                  style={{
                    margin: "0 0 8px",
                    fontSize: "10px",
                    fontWeight: 900,
                    color: "#94a3b8",
                    textTransform: "uppercase",
                    letterSpacing: "0.15em",
                  }}
                >
                  {t("payments.amount") || "Amount"} *
                </p>
                <div style={{ position: "relative" }}>
                  <span
                    style={{
                      position: "absolute",
                      left: "14px",
                      top: "50%",
                      transform: "translateY(-50%)",
                      fontSize: "14px",
                      fontWeight: 900,
                      color: "#94a3b8",
                    }}
                  >
                    ₹
                  </span>
                  <input
                    required
                    type="text"
                    inputMode="decimal"
                    value={form.amount}
                    onChange={(e) => {
                      const val = e.target.value;
                      if (val === "" || /^\d*\.?\d{0,2}$/.test(val))
                        setForm({ ...form, amount: val });
                    }}
                    style={{
                      width: "100%",
                      boxSizing: "border-box",
                      padding: "13px 16px 13px 32px",
                      backgroundColor: "#f8fafc",
                      border: "1.5px solid var(--border-main)",
                      borderRadius: "12px",
                      fontSize: "16px",
                      fontWeight: 800,
                      color: "var(--text-main)",
                      outline: "none",
                      transition: "all 0.2s",
                    }}
                    onFocusCapture={(e) => {
                      e.currentTarget.style.borderColor = GREEN;
                      e.currentTarget.style.backgroundColor = "#fff";
                    }}
                    onBlurCapture={(e) => {
                      e.currentTarget.style.borderColor = "var(--border-main)";
                      e.currentTarget.style.backgroundColor = "#f8fafc";
                    }}
                  />
                </div>
                {paymentAmount > 0 && canRoundOff ? (
                  <div
                    style={{
                      marginTop: "16px",
                      padding: "16px 0 0",
                      borderTop: "1px dashed #e2e8f0",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        gap: "12px",
                        alignItems: "flex-start",
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={roundOff}
                        onChange={(e) => setRoundOff(e.target.checked)}
                        style={{
                          width: "20px",
                          height: "20px",
                          accentColor: "#15803d",
                          cursor: "pointer",
                          marginTop: "2px",
                          borderRadius: "4px",
                        }}
                      />
                      <div>
                        <p
                          style={{
                            margin: 0,
                            fontSize: "15px",
                            fontWeight: 600,
                            color: "#1e293b",
                          }}
                        >
                          {t("payments.roundOff") || "Write off rounding"}
                        </p>
                        <p
                          style={{
                            margin: "4px 0 0",
                            fontSize: "13px",
                            color: "#64748b",
                            fontWeight: 500,
                          }}
                        >
                          Auto-expensed:{" "}
                          <span style={{ color: "#f97316" }}>
                            ₹
                            {remainingDue.toLocaleString("en-IN", {
                              minimumFractionDigits: 2,
                            })}
                          </span>
                        </p>
                      </div>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "11px",
                          fontWeight: 700,
                          color: "#94a3b8",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                        }}
                      >
                        {t("payments.remainingDue") || "Balance Due"}
                      </p>
                      <p
                        style={{
                          margin: "2px 0 0",
                          fontSize: "20px",
                          fontWeight: 700,
                          color: roundOff ? "#22c55e" : "#1e293b",
                        }}
                      >
                        ₹
                        {roundOff
                          ? "0.00"
                          : remainingDue.toLocaleString("en-IN", {
                              minimumFractionDigits: 2,
                            })}
                      </p>
                    </div>
                  </div>
                ) : paymentAmount > 0 ? (
                  <div
                    style={{
                      marginTop: "16px",
                      padding: "16px 0 0",
                      borderTop: "1px dashed #e2e8f0",
                      display: "flex",
                      justifyContent: "flex-end",
                    }}
                  >
                    <div style={{ textAlign: "right" }}>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "11px",
                          fontWeight: 700,
                          color: "#94a3b8",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                        }}
                      >
                        {t("payments.remainingDue") || "Balance Due"}
                      </p>
                      <p
                        style={{
                          margin: "2px 0 0",
                          fontSize: "20px",
                          fontWeight: 700,
                          color: "#22c55e",
                        }}
                      >
                        ₹
                        {remainingDue.toLocaleString("en-IN", {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                    </div>
                  </div>
                ) : null}
              </div>

              {/* Mode */}
              <div>
                <p
                  style={{
                    margin: "0 0 10px",
                    fontSize: "10px",
                    fontWeight: 900,
                    color: "#94a3b8",
                    textTransform: "uppercase",
                    letterSpacing: "0.15em",
                  }}
                >
                  {t("payments.mode") || "Payment Mode"} *
                </p>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr 1fr",
                    gap: "0.5rem",
                  }}
                >
                  {[
                    { v: "CASH", l: "Cash" },
                    { v: "BANK_TRANSFER", l: "Bank" },
                    { v: "OTHER", l: "Other" },
                  ].map((opt) => (
                    <button
                      key={opt.v}
                      type="button"
                      onClick={() => setForm({ ...form, mode: opt.v })}
                      style={{
                        padding: "10px 8px",
                        borderRadius: "10px",
                        border: `2px solid ${form.mode === opt.v ? GREEN : "var(--border-main)"}`,
                        backgroundColor:
                          form.mode === opt.v ? GREEN_BG : "#f8fafc",
                        fontSize: "12px",
                        fontWeight: 900,
                        color: form.mode === opt.v ? GREEN : "#64748b",
                        cursor: "pointer",
                        transition: "all 0.15s",
                      }}
                    >
                      {opt.l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Date */}
              <div>
                <p
                  style={{
                    margin: "0 0 8px",
                    fontSize: "10px",
                    fontWeight: 900,
                    color: "#94a3b8",
                    textTransform: "uppercase",
                    letterSpacing: "0.15em",
                  }}
                >
                  {t("payments.date") || "Date"}
                </p>
                <input
                  type="date"
                  value={form.paymentDate}
                  onChange={(e) =>
                    setForm({ ...form, paymentDate: e.target.value })
                  }
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "12px 16px",
                    backgroundColor: "#f8fafc",
                    border: "1.5px solid var(--border-main)",
                    borderRadius: "12px",
                    fontSize: "14px",
                    fontWeight: 700,
                    color: "var(--text-main)",
                    outline: "none",
                    transition: "all 0.2s",
                  }}
                  onFocusCapture={(e) => {
                    e.currentTarget.style.borderColor = GREEN;
                    e.currentTarget.style.backgroundColor = "#fff";
                  }}
                  onBlurCapture={(e) => {
                    e.currentTarget.style.borderColor = "var(--border-main)";
                    e.currentTarget.style.backgroundColor = "#f8fafc";
                  }}
                />
              </div>

              {/* Notes */}
              <div>
                <p
                  style={{
                    margin: "0 0 8px",
                    fontSize: "10px",
                    fontWeight: 900,
                    color: "#94a3b8",
                    textTransform: "uppercase",
                    letterSpacing: "0.15em",
                  }}
                >
                  {t("payments.notes") || "Notes (optional)"}
                </p>
                <textarea
                  rows={2}
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="e.g. Against Bill #PUR-0001"
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "12px 16px",
                    backgroundColor: "#f8fafc",
                    border: "1.5px solid var(--border-main)",
                    borderRadius: "12px",
                    fontSize: "14px",
                    fontWeight: 700,
                    color: "var(--text-main)",
                    outline: "none",
                    resize: "none",
                    fontFamily: "inherit",
                    transition: "all 0.2s",
                  }}
                  onFocusCapture={(e) => {
                    e.currentTarget.style.borderColor = GREEN;
                    e.currentTarget.style.backgroundColor = "#fff";
                  }}
                  onBlurCapture={(e) => {
                    e.currentTarget.style.borderColor = "var(--border-main)";
                    e.currentTarget.style.backgroundColor = "#f8fafc";
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{
                    flex: 1,
                    padding: "12px",
                    border: "none",
                    backgroundColor: "#f1f5f9",
                    borderRadius: "12px",
                    fontWeight: 800,
                    fontSize: "13px",
                    color: "#64748b",
                    cursor: "pointer",
                  }}
                >
                  {t("master.actions.cancel")}
                </button>
                <button
                  disabled={submitting}
                  type="submit"
                  style={{
                    flex: 2,
                    padding: "12px",
                    border: "none",
                    backgroundColor: GREEN,
                    borderRadius: "12px",
                    fontWeight: 900,
                    fontSize: "13px",
                    color: "#fff",
                    cursor: submitting ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    boxShadow: "0 8px 16px rgba(21,128,61,0.25)",
                    opacity: submitting ? 0.7 : 1,
                  }}
                >
                  {submitting ? (
                    <Loader2
                      size={18}
                      style={{ animation: "spin 0.6s linear infinite" }}
                    />
                  ) : (
                    t("payments.confirm") || "Confirm Payment"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
                .ledger-table-wrap { display: block; }
                .ledger-mobile { display: none; }
                @media (max-width: 768px) {
                    .ledger-table-wrap { display: none; }
                    .ledger-mobile { display: block; }
                }
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
    </div>
  );
}
