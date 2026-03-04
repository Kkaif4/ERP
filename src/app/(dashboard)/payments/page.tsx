"use client";

import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "@/lib/i18n";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Banknote,
  ChevronDown,
  Clock,
  Edit2,
  Loader2,
  Phone,
  Plus,
  Search,
  Trash2,
  Wallet,
  Users,
  UserSearch,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { paymentSchema } from "@/lib/schemas";
import { fmtDate } from "@/lib/dateUtils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface Payment {
  id: string;
  amount: number;
  mode: string;
  notes: string | null;
  paymentDate: string;
  farmer?: { id: string; name: string } | null;
  customer?: { id: string; name: string } | null;
  bill?: { id: string; billNumber: string } | null;
  recordedBy?: { name: string };
}

interface Party {
  id: string;
  name: string;
  mobile: string;
  balance: number;
}

const VIOLET = "#7c3aed";
const VIOLET_BG = "rgba(124,58,237,0.08)";

export default function PaymentsPage() {
  const { t, language } = useTranslation();
  const router = useRouter();

  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"ALL" | "FARMER" | "CUSTOMER">("ALL");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [dateSort, setDateSort] = useState<"asc" | "desc">("desc");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  // Modal state
  const [partyType, setPartyType] = useState<"FARMER" | "CUSTOMER">("FARMER");
  const [partySearch, setPartySearch] = useState("");
  const [partyResults, setPartyResults] = useState<Party[]>([]);
  const [selectedParty, setSelectedParty] = useState<Party | null>(null);
  const [showPartyDrop, setShowPartyDrop] = useState(false);

  const [partyPage, setPartyPage] = useState(1);
  const [hasMoreParties, setHasMoreParties] = useState(true);
  const [isPartyLoading, setIsPartyLoading] = useState(false);
  const [debouncedPartySearch, setDebouncedPartySearch] = useState("");

  const [form, setForm] = useState({
    amount: "",
    mode: "CASH",
    notes: "",
    paymentDate: new Date().toISOString().split("T")[0],
  });
  const [roundOff, setRoundOff] = useState(false);

  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 50,
    totalPages: 1,
  });

  // Debounce main search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPagination((p) => ({ ...p, page: 1 }));
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Debounce modal party search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedPartySearch(partySearch);
      setPartyPage(1);
      setHasMoreParties(true);
    }, 400);
    return () => clearTimeout(timer);
  }, [partySearch]);

  const fetchPayments = async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const url = `/api/payments?page=${pagination.page}&limit=${pagination.limit}${tab !== "ALL" ? `&type=${tab}` : ""}${debouncedSearch ? `&search=${encodeURIComponent(debouncedSearch)}` : ""}`;
      const res = await fetch(url, { signal });
      const result = await res.json();
      if (result.data) {
        setPayments(result.data);
        setPagination(result.pagination);
      }
    } catch (err: any) {
      if (err.name !== "AbortError") toast.error("Failed to load payments");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchPayments(controller.signal);
    return () => controller.abort();
  }, [tab, pagination.page, debouncedSearch]);

  // Search parties for modal dropdown with infinite scroll
  useEffect(() => {
    if (!showPartyDrop) return;
    const controller = new AbortController();
    const fetchPartiesList = async () => {
      if (!hasMoreParties && partyPage !== 1) return;
      setIsPartyLoading(true);
      try {
        const endpoint =
          partyType === "FARMER" ? `/api/farmers` : `/api/customers`;
        const url = `${endpoint}?search=${encodeURIComponent(debouncedPartySearch)}&page=${partyPage}&limit=20`;
        const res = await fetch(url, { signal: controller.signal });
        const result = await res.json();
        if (result.data) {
          setPartyResults((prev) =>
            partyPage === 1 ? result.data : [...prev, ...result.data],
          );
          setHasMoreParties(
            result.pagination.page < result.pagination.totalPages,
          );
        }
      } finally {
        setIsPartyLoading(false);
      }
    };
    fetchPartiesList();
    return () => controller.abort();
  }, [debouncedPartySearch, partyPage, partyType, showPartyDrop]);

  const handlePageChange = (newPage: number) => {
    setPagination((p) => ({ ...p, page: newPage }));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const today = new Date().toLocaleDateString(
    language === "hi" ? "hi-IN" : language === "mr" ? "mr-IN" : "en-IN",
    { weekday: "long", day: "numeric", month: "long" },
  );

  const outstandingBalance = selectedParty ? Number(selectedParty.balance) : 0;
  const paymentAmount = parseFloat(form.amount) || 0;
  const remainingDue = Math.max(0, outstandingBalance - paymentAmount);
  const canRoundOff = paymentAmount > 0 && paymentAmount < outstandingBalance;
  const roundOffAmount = canRoundOff && roundOff ? remainingDue : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...(partyType === "FARMER"
        ? { farmerId: selectedParty?.id }
        : { customerId: selectedParty?.id }),
      amount: paymentAmount,
      mode: form.mode as any,
      notes: form.notes || undefined,
      paymentDate: form.paymentDate,
      roundOff: canRoundOff && roundOff,
      roundOffAmount: roundOffAmount,
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
        resetModal();
        fetchPayments();
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

  const resetModal = () => {
    setPartySearch("");
    setSelectedParty(null);
    setPartyResults([]);
    setForm({
      amount: "",
      mode: "CASH",
      notes: "",
      paymentDate: new Date().toISOString().split("T")[0],
    });
    setPartyType("FARMER");
    setRoundOff(false);
  };

  const fmt = (n: number) =>
    `₹ ${Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

  const filtered = useMemo(() => {
    return payments
      .filter((p) => {
        const matchesTab = tab === "ALL" ? true : tab === "FARMER" ? !!p.farmer : !!p.customer;

        const payTime = new Date(p.paymentDate).getTime();
        const start = fromDate ? new Date(fromDate).getTime() : -Infinity;
        const end = toDate ? new Date(toDate).setHours(23, 59, 59, 999) : Infinity;

        return matchesTab && payTime >= start && payTime <= end;
      })
      .sort((a, b) => {
        const dateA = new Date(a.paymentDate).getTime();
        const dateB = new Date(b.paymentDate).getTime();
        return dateSort === "desc" ? dateB - dateA : dateA - dateB;
      });
  }, [payments, tab, fromDate, toDate, dateSort]);

  const farmerTotal = payments
    .filter((p) => p.farmer)
    .reduce((s, p) => s + Number(p.amount), 0);
  const customerTotal = payments
    .filter((p) => p.customer)
    .reduce((s, p) => s + Number(p.amount), 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      {/* ── Header ── */}
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
          <h1
            style={{
              fontSize: "1.875rem",
              fontWeight: 900,
              color: "var(--text-main)",
              letterSpacing: "-0.02em",
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            {t("payments.title") || "Payments"}
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
                backgroundColor: VIOLET,
                borderRadius: "2px",
              }}
            />
            <p
              style={{
                margin: 0,
                fontSize: "11px",
                fontWeight: 800,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.15em",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <Clock size={12} /> {pagination.total}{" "}
              {t("payments.totalPayments") || "payments"} · {today}
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            resetModal();
            setShowModal(true);
          }}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 20px",
            backgroundColor: VIOLET,
            color: "#fff",
            borderRadius: "12px",
            fontWeight: 800,
            fontSize: "14px",
            border: "none",
            cursor: "pointer",
            boxShadow: "0 8px 16px rgba(124,58,237,0.2)",
            transition: "all 0.2s",
            letterSpacing: "0.02em",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)";
            e.currentTarget.style.boxShadow =
              "0 12px 24px rgba(124,58,237,0.3)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "none";
            e.currentTarget.style.boxShadow = "0 8px 16px rgba(124,58,237,0.2)";
          }}
        >
          <Plus size={16} strokeWidth={3} />{" "}
          {t("payments.record") || "Record Payment"}
        </button>
      </div>

      {/* ── Stat cards ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "1rem",
        }}
      >
        {[
          {
            label: t("payments.totalPaidOut") || "Paid to Farmers",
            value: farmerTotal,
            color: "#15803d",
            bg: "rgba(21,128,61,0.08)",
            icon: Users,
          },
          {
            label: t("payments.totalReceived") || "Received from Customers",
            value: customerTotal,
            color: "#0369a1",
            bg: "rgba(3,105,161,0.08)",
            icon: UserSearch,
          },
          {
            label: t("payments.grandTotal") || "Grand Total",
            value: farmerTotal + customerTotal,
            color: VIOLET,
            bg: VIOLET_BG,
            icon: Wallet,
          },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="premium-card"
              style={{ padding: "1.5rem" }}
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
                    letterSpacing: "0.15em",
                  }}
                >
                  {stat.label}
                </p>
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "10px",
                    backgroundColor: stat.bg,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Icon size={16} color={stat.color} />
                </div>
              </div>
              <p
                style={{
                  margin: 0,
                  fontSize: "1.5rem",
                  fontWeight: 900,
                  color: "var(--text-main)",
                  letterSpacing: "-0.02em",
                }}
              >
                {fmt(stat.value)}
              </p>
            </div>
          );
        })}
      </div>

      {/* ── Filters & Search Area ── */}
      <div className="premium-card" style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "1.5rem" }}>

          {/* Filter Tabs */}
          <div style={{ display: "flex", backgroundColor: "#f1f5f9", padding: "4px", borderRadius: "14px", gap: "4px" }}>
            {(["ALL", "FARMER", "CUSTOMER"] as const).map((t2) => (
              <button
                key={t2}
                onClick={() => setTab(t2)}
                style={{
                  border: "none",
                  padding: "10px 20px",
                  borderRadius: "10px",
                  fontSize: "11px",
                  fontWeight: 800,
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  backgroundColor: tab === t2 ? "#fff" : "transparent",
                  color: tab === t2 ? "var(--text-main)" : "var(--text-muted)",
                  boxShadow: tab === t2 ? "0 4px 6px -1px rgba(0,0,0,0.05)" : "none"
                }}
              >
                {t2 === "ALL"
                  ? t("payments.all") || "All"
                  : t2 === "FARMER"
                    ? t("payments.farmers") || "Farmers"
                    : t("payments.customers") || "Customers"}
              </button>
            ))}
          </div>

          {/* Search Input */}
          <div style={{ flex: 1, minWidth: "260px", position: "relative" }}>
            <Search
              style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }}
              size={18}
            />
            <input
              type="text"
              placeholder={t("payments.searchPlaceholder") || "Search by party or notes..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: "100%",
                padding: "14px 14px 14px 56px",
                backgroundColor: "#f8fafc",
                border: "1px solid var(--border-main)",
                borderRadius: "16px",
                fontSize: "14px",
                fontWeight: 700,
                color: "var(--text-main)",
                outline: "none",
                transition: "all 0.2s ease",
                boxShadow: "inset 0 2px 4px 0 rgba(0,0,0,0.02)"
              }}
              className="focus:ring-2 focus:ring-violet-500/10 focus:border-violet-500/50"
            />
          </div>

          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span style={{ fontSize: "10px", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase" }}>{t("common.from") || "From"}</span>
              <input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                style={{ padding: "8px", borderRadius: "10px", border: "1.5px solid var(--border-main)", fontSize: "12px", fontWeight: 700, outline: "none" }}
              />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <span style={{ fontSize: "10px", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase" }}>{t("common.to") || "To"}</span>
              <input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                style={{ padding: "8px", borderRadius: "10px", border: "1.5px solid var(--border-main)", fontSize: "12px", fontWeight: 700, outline: "none" }}
              />
            </div>
            {(fromDate || toDate) && (
              <button
                onClick={() => { setFromDate(""); setToDate(""); }}
                style={{ padding: "8px", borderRadius: "10px", border: "none", backgroundColor: "#f1f5f9", color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                title="Clear dates"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Payments List ── */}
      <div className="premium-card overflow-hidden">

        {loading ? (
          <div
            style={{
              padding: "3rem",
              display: "flex",
              justifyContent: "center",
            }}
          >
            <Loader2
              size={32}
              color={VIOLET}
              style={{ animation: "spin 0.8s linear infinite" }}
            />
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: "4rem", textAlign: "center" }}>
            <Banknote
              size={40}
              color="#e2e8f0"
              style={{ margin: "0 auto 1rem", display: "block" }}
            />
            <p
              style={{
                margin: 0,
                fontWeight: 700,
                color: "#94a3b8",
                fontSize: "13px",
              }}
            >
              {t("payments.noPayments") || "No payments found"}
            </p>
          </div>
        ) : (
          <>
            <div className="hidden lg:block border border-gray-200 rounded-none overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-gray-100 border-b-2 border-gray-300 sticky top-0 z-10">
                    {[
                      t("common.date"),
                      t("common.party"),
                      t("common.paymentMode"),
                      t("payments.table.billRef"),
                      t("payments.table.notes"),
                      t("common.amount"),
                    ].map((h, idx) => (
                      <TableHead
                        key={idx}
                        onClick={h === t("common.date") ? () => setDateSort(s => s === "asc" ? "desc" : "asc") : undefined}
                        className={cn(
                          "h-10 px-4 text-[11px] font-semibold uppercase tracking-wider text-gray-600 border-r border-gray-200 last:border-r-0 whitespace-nowrap",
                          h === t("common.amount") && "text-right",
                          h === t("common.date") && "cursor-pointer select-none"
                        )}
                      >
                        <div className={cn(
                          "flex items-center gap-1",
                          h === t("common.amount") ? "justify-end" : "justify-start"
                        )}>
                          {h}
                          {h === t("common.date") && (
                            <span className={cn("text-xs", dateSort === "desc" ? "text-blue-600" : "text-gray-400")}>
                              {dateSort === "desc" ? "↓" : "↑"}
                            </span>
                          )}
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-gray-400 font-medium">
                        {t("payments.noPayments") || "No payments found"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filtered.map((p) => {
                      const party = p.farmer || p.customer;
                      const isCustomer = !!p.customer;
                      return (
                        <TableRow
                          key={p.id}
                          className="even:bg-gray-50/50 odd:bg-white hover:bg-blue-50/30 transition-colors border-b border-gray-200 last:border-b-0 cursor-pointer"
                          onClick={() =>
                            party &&
                            router.push(
                              isCustomer
                                ? `/customers/${party.id}`
                                : `/farmers/${party.id}`,
                            )
                          }
                        >
                          <TableCell className="border-r border-gray-200 whitespace-nowrap">
                            <span className="text-[14px] font-bold text-gray-500">{fmtDate(p.paymentDate)}</span>
                          </TableCell>
                          <TableCell className="border-r border-gray-200">
                            <span className="text-[14px] font-bold text-gray-900">{party?.name || "—"}</span>
                          </TableCell>
                          <TableCell className="border-r border-gray-200">
                            <span className={cn(
                              "inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase border tracking-wider",
                              p.mode === "CASH" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                                p.mode === "BANK" ? "bg-blue-50 text-blue-700 border-blue-200" :
                                  "bg-gray-50 text-gray-700 border-gray-200"
                            )}>
                              {t(`expenses.paymentModes.${p.mode}`)}
                            </span>
                          </TableCell>
                          <TableCell className="border-r border-gray-200">
                            <span className="text-[14px] font-medium text-gray-600">
                              {p.bill?.billNumber || <span className="text-gray-300">—</span>}
                            </span>
                          </TableCell>
                          <TableCell className="border-r border-gray-200 max-w-[200px] truncate">
                            <span className="text-[14px] font-normal text-gray-500 italic">
                              {p.notes || <span className="text-gray-300">—</span>}
                            </span>
                          </TableCell>
                          <TableCell className="text-right border-l border-gray-200 bg-gray-50/30">
                            <div className="text-[14px] font-bold text-gray-900 tabular-nums">
                              <span className="text-[11px] font-medium text-gray-400 mr-0.5">₹</span>
                              {p.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Mobile cards */}
            <div className="pay-mobile">
              {filtered.map((p) => {
                const party = p.farmer || p.customer;
                const isCustomer = !!p.customer;
                return (
                  <div
                    key={p.id}
                    style={{
                      padding: "1rem 1.25rem",
                      borderTop: "1px solid #f1f5f9",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: "0.75rem",
                      cursor: "pointer",
                    }}
                    onClick={() =>
                      party &&
                      router.push(
                        isCustomer
                          ? `/customers/${party.id}`
                          : `/farmers/${party.id}`,
                      )
                    }
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                      }}
                    >
                      <div
                        style={{
                          width: "40px",
                          height: "40px",
                          borderRadius: "10px",
                          backgroundColor: isCustomer
                            ? "rgba(3,105,161,0.08)"
                            : "rgba(21,128,61,0.08)",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: isCustomer ? "#0369a1" : "#15803d",
                          fontWeight: 900,
                          fontSize: "16px",
                          flexShrink: 0,
                        }}
                      >
                        {party?.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p
                          style={{
                            margin: 0,
                            fontSize: "14px",
                            fontWeight: 800,
                            color: "var(--text-main)",
                          }}
                        >
                          {party?.name}
                        </p>
                        <p
                          style={{
                            margin: 0,
                            fontSize: "11px",
                            fontWeight: 700,
                            color: "#94a3b8",
                          }}
                        >
                          {fmtDate(p.paymentDate)} · {t(`expenses.paymentModes.${p.mode}`)}
                        </p>
                      </div>
                    </div>
                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "15px",
                          fontWeight: 900,
                          color: "#7c3aed",
                          letterSpacing: "-0.01em",
                        }}
                      >
                        {fmt(p.amount)}
                      </p>
                      <ArrowRight size={14} color="#cbd5e1" style={{ marginTop: "4px" }} />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ── Pagination ── */}
            {!loading && pagination.totalPages > 1 && (
              <div
                className="px-5 py-3.5 border-t border-[#f1f5f9] flex items-center justify-between bg-white"
                style={{ padding: "1.25rem", borderTop: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" }}
              >
                <p style={{ margin: 0, fontSize: "12px", fontWeight: 700, color: "var(--text-muted)" }}>
                  {t("common.pagination.status", { page: pagination.page, total: pagination.totalPages, count: pagination.total })}
                </p>
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <button
                    onClick={() => handlePageChange(Math.max(1, pagination.page - 1))}
                    disabled={pagination.page === 1}
                    className={cn(
                      "px-4 py-2 rounded-xl border border-[#e2e8f0] text-xs font-black uppercase tracking-wider transition-all",
                      pagination.page === 1 ? "bg-[#f8fafc] text-[#cbd5e1] cursor-not-allowed" : "bg-white text-[#475569] hover:bg-[#f8fafc] hover:border-[#cbd5e1]"
                    )}
                  >
                    {t("common.pagination.previous")}
                  </button>
                  <button
                    onClick={() => handlePageChange(Math.min(pagination.totalPages, pagination.page + 1))}
                    disabled={pagination.page === pagination.totalPages}
                    className={cn(
                      "px-4 py-2 rounded-xl border border-[#e2e8f0] text-xs font-black uppercase tracking-wider transition-all",
                      pagination.page === pagination.totalPages ? "bg-[#f8fafc] text-[#cbd5e1] cursor-not-allowed" : "bg-white text-[#475569] hover:bg-[#f8fafc] hover:border-[#cbd5e1]"
                    )}
                  >
                    {t("common.pagination.next")}
                  </button>
                </div>
              </div>
            )}
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
            onClick={() => !submitting && (setShowModal(false), resetModal())}
          />
          <div
            style={{
              position: "relative",
              backgroundColor: "#fff",
              width: "100%",
              maxWidth: "460px",
              borderRadius: "24px",
              boxShadow: "0 25px 50px rgba(0,0,0,0.2)",
              overflow: "hidden",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <div
              style={{
                height: "4px",
                background: `linear-gradient(90deg, ${VIOLET}, #a78bfa)`,
              }}
            />

            {/* Modal header */}
            <div
              style={{
                padding: "1.75rem 2rem 1rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                position: "sticky",
                top: 0,
                backgroundColor: "#fff",
                zIndex: 1,
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
                  {t("payments.recordSubtitle") ||
                    "Select party & enter amount"}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowModal(false);
                  resetModal();
                }}
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
              onSubmit={handleSubmit}
              style={{
                padding: "0.5rem 2rem 2rem",
                display: "flex",
                flexDirection: "column",
                gap: "1.25rem",
              }}
            >
              {/* Party type toggle */}
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
                  {t("payments.partyType") || "Payment For"}
                </p>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: "0.5rem",
                  }}
                >
                  {[
                    {
                      v: "FARMER" as const,
                      l: t("nav.farmers") || "Farmer",
                      color: "#15803d",
                      bg: "rgba(21,128,61,0.08)",
                      icon: Users,
                    },
                    {
                      v: "CUSTOMER" as const,
                      l: t("nav.customers") || "Customer",
                      color: "#0369a1",
                      bg: "rgba(3,105,161,0.08)",
                      icon: UserSearch,
                    },
                  ].map((opt) => {
                    const Icon = opt.icon;
                    const sel = partyType === opt.v;
                    return (
                      <button
                        key={opt.v}
                        type="button"
                        onClick={() => {
                          setPartyType(opt.v);
                          setSelectedParty(null);
                          setPartySearch("");
                          setPartyResults([]);
                        }}
                        style={{
                          padding: "12px",
                          borderRadius: "12px",
                          border: `2px solid ${sel ? opt.color : "#e2e8f0"}`,
                          backgroundColor: sel ? opt.bg : "#f1f5f9",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          cursor: "pointer",
                          transition: "all 0.15s",
                        }}
                      >
                        <Icon size={16} color={sel ? opt.color : "#94a3b8"} />
                        <span
                          style={{
                            fontSize: "13px",
                            fontWeight: 800,
                            color: sel ? opt.color : "#64748b",
                          }}
                        >
                          {opt.l}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Party search */}
              <div style={{ position: "relative" }}>
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
                  {partyType === "FARMER"
                    ? t("nav.farmers") || "Farmer"
                    : t("nav.customers") || "Customer"}{" "}
                  *
                </p>
                {selectedParty ? (
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "12px 16px",
                      backgroundColor:
                        partyType === "FARMER"
                          ? "rgba(21,128,61,0.06)"
                          : "rgba(3,105,161,0.06)",
                      border: `1.5px solid ${partyType === "FARMER" ? "rgba(21,128,61,0.2)" : "rgba(3,105,161,0.2)"}`,
                      borderRadius: "12px",
                    }}
                  >
                    <div>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "14px",
                          fontWeight: 800,
                          color: "var(--text-main)",
                        }}
                      >
                        {selectedParty.name}
                      </p>
                      <p
                        style={{
                          margin: 0,
                          fontSize: "11px",
                          fontWeight: 700,
                          color: "#94a3b8",
                        }}
                      >
                        Balance: ₹
                        {Number(selectedParty.balance).toLocaleString("en-IN")}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSelectedParty(null)}
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "50%",
                        border: "none",
                        backgroundColor: "#f1f5f9",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      <X size={14} color="#64748b" />
                    </button>
                  </div>
                ) : (
                  <div style={{ position: "relative" }}>
                    <Search
                      style={{
                        position: "absolute",
                        left: "14px",
                        top: "50%",
                        transform: "translateY(-50%)",
                        color: "#94a3b8",
                      }}
                      size={16}
                    />
                    <input
                      type="text"
                      placeholder={`Search ${partyType.toLowerCase()}...`}
                      value={partySearch}
                      onChange={(e) => {
                        setPartySearch(e.target.value);
                        setShowPartyDrop(true);
                      }}
                      onFocus={() => setShowPartyDrop(true)}
                      style={{
                        width: "100%",
                        boxSizing: "border-box",
                        padding: "12px 12px 12px 42px",
                        backgroundColor: "#f1f5f9",
                        border: "1.5px solid #e2e8f0",
                        borderRadius: "12px",
                        fontSize: "14px",
                        fontWeight: 700,
                        color: "var(--text-main)",
                        outline: "none",
                        transition: "all 0.2s",
                      }}
                      onFocusCapture={(e) => {
                        e.currentTarget.style.borderColor = VIOLET;
                        e.currentTarget.style.backgroundColor = "#fff";
                      }}
                      onBlurCapture={(e) => {
                        e.currentTarget.style.borderColor = "#e2e8f0";
                        e.currentTarget.style.backgroundColor = "#f1f5f9";
                        setTimeout(() => setShowPartyDrop(false), 150);
                      }}
                    />
                    {showPartyDrop &&
                      (debouncedPartySearch.length > 0 ||
                        partyResults.length > 0) && (
                        <div
                          onScroll={(e) => {
                            const { scrollTop, scrollHeight, clientHeight } =
                              e.currentTarget;
                            if (
                              scrollHeight - scrollTop <= clientHeight + 50 &&
                              hasMoreParties &&
                              !isPartyLoading
                            ) {
                              setPartyPage((p) => p + 1);
                            }
                          }}
                          style={{
                            position: "absolute",
                            top: "100%",
                            left: 0,
                            right: 0,
                            marginTop: "6px",
                            backgroundColor: "#fff",
                            border: "1px solid var(--border-main)",
                            borderRadius: "14px",
                            boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
                            zIndex: 10,
                            padding: "6px",
                            maxHeight: "200px",
                            overflowY: "auto",
                          }}
                        >
                          {partyResults.map((p) => (
                            <button
                              key={p.id}
                              type="button"
                              onMouseDown={() => {
                                setSelectedParty(p);
                                setPartySearch("");
                                setShowPartyDrop(false);
                              }}
                              style={{
                                width: "100%",
                                textAlign: "left",
                                padding: "10px 12px",
                                borderRadius: "10px",
                                border: "none",
                                background: "none",
                                cursor: "pointer",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center",
                                transition: "all 0.15s",
                              }}
                              onMouseEnter={(e) =>
                              (e.currentTarget.style.backgroundColor =
                                VIOLET_BG)
                              }
                              onMouseLeave={(e) =>
                              (e.currentTarget.style.backgroundColor =
                                "transparent")
                              }
                            >
                              <div>
                                <p
                                  style={{
                                    margin: 0,
                                    fontSize: "13px",
                                    fontWeight: 800,
                                    color: "var(--text-main)",
                                  }}
                                >
                                  {p.name}
                                </p>
                                <p
                                  style={{
                                    margin: 0,
                                    fontSize: "11px",
                                    fontWeight: 600,
                                    color: "#94a3b8",
                                  }}
                                >
                                  {p.mobile}
                                </p>
                              </div>
                              <span
                                style={{
                                  fontSize: "12px",
                                  fontWeight: 800,
                                  color:
                                    Number(p.balance) > 0
                                      ? "#15803d"
                                      : "#d97706",
                                }}
                              >
                                ₹
                                {Math.abs(Number(p.balance)).toLocaleString(
                                  "en-IN",
                                )}
                                <span
                                  style={{ fontSize: "9px", marginLeft: "2px" }}
                                >
                                  {Number(p.balance) > 0 ? "CR" : "DR"}
                                </span>
                              </span>
                            </button>
                          ))}
                          {isPartyLoading && (
                            <div
                              style={{ padding: "12px", textAlign: "center" }}
                            >
                              <Loader2
                                size={16}
                                className="spin"
                                style={{
                                  animation: "spin 0.6s linear infinite",
                                }}
                                color={VIOLET}
                              />
                            </div>
                          )}
                          {!isPartyLoading &&
                            partyResults.length === 0 &&
                            debouncedPartySearch.length > 0 && (
                              <p
                                style={{
                                  padding: "12px",
                                  margin: 0,
                                  textAlign: "center",
                                  fontSize: "12px",
                                  color: "#94a3b8",
                                }}
                              >
                                No results found
                              </p>
                            )}
                        </div>
                      )}
                  </div>
                )}
              </div>

              {/* Amount */}
              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-end",
                    marginBottom: "8px",
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      fontSize: "10px",
                      fontWeight: 900,
                      color: "#94a3b8",
                      textTransform: "uppercase",
                      letterSpacing: "0.15em",
                    }}
                  >
                    {t("payments.amount") || "Amount"} *
                  </p>
                  {selectedParty && (
                    <p
                      style={{
                        margin: 0,
                        fontSize: "11px",
                        fontWeight: 700,
                        color: VIOLET,
                      }}
                    >
                      {t("payments.outstandingBalance") ||
                        "Outstanding Balance"}
                      : ₹{outstandingBalance.toLocaleString("en-IN")}
                    </p>
                  )}
                </div>
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
                      backgroundColor: "#f1f5f9",
                      border: "1.5px solid #e2e8f0",
                      borderRadius: "12px",
                      fontSize: "16px",
                      fontWeight: 800,
                      color: "var(--text-main)",
                      outline: "none",
                      transition: "all 0.2s",
                    }}
                    onFocusCapture={(e) => {
                      e.currentTarget.style.borderColor = VIOLET;
                      e.currentTarget.style.backgroundColor = "#fff";
                    }}
                    onBlurCapture={(e) => {
                      e.currentTarget.style.borderColor = "#e2e8f0";
                      e.currentTarget.style.backgroundColor = "#f1f5f9";
                    }}
                  />
                </div>
                {selectedParty && paymentAmount > 0 && canRoundOff ? (
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
                          accentColor: "#3b82f6",
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
                ) : selectedParty && paymentAmount > 0 ? (
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
                        border: `2px solid ${form.mode === opt.v ? VIOLET : "#e2e8f0"}`,
                        backgroundColor:
                          form.mode === opt.v ? VIOLET_BG : "#f1f5f9",
                        fontSize: "12px",
                        fontWeight: 900,
                        color: form.mode === opt.v ? VIOLET : "#64748b",
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
                    backgroundColor: "#f1f5f9",
                    border: "1.5px solid #e2e8f0",
                    borderRadius: "12px",
                    fontSize: "14px",
                    fontWeight: 700,
                    color: "var(--text-main)",
                    outline: "none",
                    transition: "all 0.2s",
                  }}
                  onFocusCapture={(e) => {
                    e.currentTarget.style.borderColor = VIOLET;
                    e.currentTarget.style.backgroundColor = "#fff";
                  }}
                  onBlurCapture={(e) => {
                    e.currentTarget.style.borderColor = "#e2e8f0";
                    e.currentTarget.style.backgroundColor = "#f1f5f9";
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
                  placeholder="e.g. For Bill #SAL-0001"
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "12px 16px",
                    backgroundColor: "#f1f5f9",
                    border: "1.5px solid #e2e8f0",
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
                    e.currentTarget.style.borderColor = VIOLET;
                    e.currentTarget.style.backgroundColor = "#fff";
                  }}
                  onBlurCapture={(e) => {
                    e.currentTarget.style.borderColor = "#e2e8f0";
                    e.currentTarget.style.backgroundColor = "#f1f5f9";
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: "0.75rem" }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    resetModal();
                  }}
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
                    backgroundColor: VIOLET,
                    borderRadius: "12px",
                    fontWeight: 900,
                    fontSize: "13px",
                    color: "#fff",
                    cursor: submitting ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    boxShadow: "0 8px 16px rgba(124,58,237,0.25)",
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
                .pay-table-wrap { display: block; }
                .pay-mobile { display: none; }
                @media (max-width: 768px) {
                    .pay-table-wrap { display: none; }
                    .pay-mobile { display: block; }
                }
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
    </div>
  );
}
