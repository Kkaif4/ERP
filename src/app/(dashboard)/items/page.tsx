"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "@/lib/i18n";
import {
    Package, Plus, Search, Loader2, X, Scale, Boxes,
    Clock, ToggleLeft, ToggleRight, ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { itemSchema } from "@/lib/schemas";
import { useUser } from "@/components/providers/UserContext";

interface Item {
    id: string;
    name: string;
    defaultPricingMode: "WEIGHT" | "UNIT";
    isActive: boolean;
    createdAt: string;
}

export default function ItemsPage() {
    const { t, language } = useTranslation();
    const { user } = useUser();
    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [showInactive, setShowInactive] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ name: "", defaultPricingMode: "WEIGHT" as "WEIGHT" | "UNIT" });
    const [submitting, setSubmitting] = useState(false);
    const [togglingId, setTogglingId] = useState<string | null>(null);
    const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 50, totalPages: 1 });

    const isAdmin = user?.role === "ORG_ADMIN" || user?.role === "SUPER_ADMIN";

    const today = new Date().toLocaleDateString(
        language === "hi" ? "hi-IN" : language === "mr" ? "mr-IN" : "en-IN",
        { weekday: "long", day: "numeric", month: "long" }
    );

    const [debouncedSearch, setDebouncedSearch] = useState("");

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setPagination(p => ({ ...p, page: 1 }));
        }, 400);
        return () => clearTimeout(timer);
    }, [search]);

    const fetchItemsList = async (signal?: AbortSignal) => {
        setLoading(true);
        try {
            const res = await fetch(
                `/api/items?search=${encodeURIComponent(debouncedSearch)}&page=${pagination.page}`,
                { signal }
            );
            const result = await res.json();
            if (result.data) {
                setItems(result.data);
                setPagination(prev => ({
                    ...prev,
                    totalPages: result.pagination.totalPages,
                    total: result.pagination.total
                }));
            } else {
                setItems(Array.isArray(result) ? result : []);
            }
        } catch (err: any) {
            if (err.name === 'AbortError') return;
            toast.error(t("master.items.errorLoad"));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const controller = new AbortController();
        fetchItemsList(controller.signal);
        return () => controller.abort();
    }, [debouncedSearch, pagination.page]);

    const handlePageChange = (newPage: number) => {
        setPagination(p => ({ ...p, page: newPage }));
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleAddItem = async (e: React.FormEvent) => {
        e.preventDefault();
        const result = itemSchema.safeParse(formData);
        if (!result.success) {
            toast.error(result.error.issues[0].message);
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch("/api/items", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            if (res.ok) {
                toast.success(t("master.items.successAdd"));
                setIsModalOpen(false);
                setFormData({ name: "", defaultPricingMode: "WEIGHT" });
                fetchItemsList();
            } else {
                const err = await res.json();
                toast.error(err.error || t("master.items.errorAdd"));
            }
        } catch { toast.error(t("master.items.errorAdd")); }
        finally { setSubmitting(false); }
    };

    const toggleActive = async (item: Item) => {
        setTogglingId(item.id);
        try {
            const res = await fetch("/api/items", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ id: item.id, isActive: !item.isActive }),
            });
            if (res.ok) {
                setItems(prev => prev.map(i => i.id === item.id ? { ...i, isActive: !i.isActive } : i));
                toast.success(item.isActive ? t("master.items.deactivated") || "Item deactivated" : t("master.items.activated") || "Item activated");
            } else toast.error("Failed to update item");
        } catch { toast.error("Failed to update item"); }
        finally { setTogglingId(null); }
    };

    const filtered = items.filter(i => showInactive ? true : i.isActive);
    const activeCount = items.filter(i => i.isActive).length;
    const inactiveCount = items.filter(i => !i.isActive).length;

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>

            {/* ── Header ── */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
                <div>
                    <h1 style={{ fontSize: "1.875rem", fontWeight: 900, color: "var(--text-main)", letterSpacing: "-0.02em", margin: 0, lineHeight: 1.2 }}>
                        {t("master.items.title")}
                    </h1>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "6px" }}>
                        <div style={{ height: "3px", width: "24px", backgroundColor: "#7c3aed", borderRadius: "2px" }} />
                        <p style={{ margin: 0, fontSize: "11px", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.15em", display: "flex", alignItems: "center", gap: "6px" }}>
                            <Clock size={12} /> {activeCount} {t("master.items.activeItems") || "Active Items"} · {today}
                        </p>
                    </div>
                </div>
                {isAdmin && (
                    <button
                        onClick={() => setIsModalOpen(true)}
                        style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "10px 20px", backgroundColor: "#7c3aed", color: "#fff", borderRadius: "12px", fontWeight: 800, fontSize: "14px", border: "none", cursor: "pointer", boxShadow: "0 8px 16px rgba(124,58,237,0.2)", transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)", letterSpacing: "0.02em" }}
                        onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 12px 24px rgba(124,58,237,0.3)"; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 8px 16px rgba(124,58,237,0.2)"; }}>
                        <Plus size={16} strokeWidth={3} /> {t("master.items.addItem")}
                    </button>
                )}
            </div>

            {/* ── Stats + Search + Filter ── */}
            <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
                {/* Stat pills */}
                <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 16px", backgroundColor: "rgba(124,58,237,0.07)", border: "1px solid rgba(124,58,237,0.15)", borderRadius: "12px" }}>
                        <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#7c3aed" }} />
                        <span style={{ fontSize: "12px", fontWeight: 800, color: "#7c3aed" }}>{activeCount} {t("master.items.active") || "Active"}</span>
                    </div>
                    {inactiveCount > 0 && (
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "8px 16px", backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "12px" }}>
                            <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#cbd5e1" }} />
                            <span style={{ fontSize: "12px", fontWeight: 800, color: "#94a3b8" }}>{inactiveCount} {t("master.items.inactive") || "Inactive"}</span>
                        </div>
                    )}
                </div>

                {/* Show inactive toggle */}
                {inactiveCount > 0 && (
                    <button
                        onClick={() => setShowInactive(!showInactive)}
                        style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "8px 14px", backgroundColor: showInactive ? "rgba(124,58,237,0.07)" : "transparent", border: `1.5px solid ${showInactive ? "rgba(124,58,237,0.2)" : "#e2e8f0"}`, borderRadius: "12px", fontSize: "12px", fontWeight: 800, color: showInactive ? "#7c3aed" : "#94a3b8", cursor: "pointer", transition: "all 0.2s" }}>
                        {showInactive ? <ToggleRight size={15} /> : <ToggleLeft size={15} />}
                        {t("master.items.showAll") || "Show Inactive"}
                    </button>
                )}
            </div>

            {/* ── Search ── */}
            <div className="premium-card" style={{ padding: "1rem 1.25rem" }}>
                <div style={{ position: "relative" }}>
                    <Search style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} size={18} />
                    <input
                        type="text"
                        placeholder={t("master.items.searchPlaceholder")}
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{ width: "100%", boxSizing: "border-box", padding: "12px 12px 12px 52px", backgroundColor: "#f8fafc", border: "1.5px solid var(--border-main)", borderRadius: "12px", fontSize: "14px", fontWeight: 700, color: "var(--text-main)", outline: "none", transition: "all 0.2s" }}
                        onFocusCapture={e => { e.currentTarget.style.borderColor = "#7c3aed"; e.currentTarget.style.backgroundColor = "#fff"; }}
                        onBlurCapture={e => { e.currentTarget.style.borderColor = "var(--border-main)"; e.currentTarget.style.backgroundColor = "#f8fafc"; }}
                    />
                </div>
            </div>

            {/* ── Grid ── */}
            {loading ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1rem" }}>
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <div key={i} className="premium-card" style={{ height: "140px", animation: "pulse 1.5s ease-in-out infinite", opacity: 0.5 }} />
                    ))}
                </div>
            ) : filtered.length === 0 ? (
                <div className="premium-card" style={{ padding: "4rem", textAlign: "center" }}>
                    <Package size={48} color="#e2e8f0" style={{ margin: "0 auto 1rem" }} />
                    <p style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: "#94a3b8" }}>{t("master.items.noItems")}</p>
                </div>
            ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1rem" }}>
                    {filtered.map(item => (
                        <div
                            key={item.id}
                            className="premium-card"
                            style={{ padding: "1.5rem", opacity: item.isActive ? 1 : 0.55, transition: "opacity 0.2s" }}
                        >
                            {/* Icon + mode badge */}
                            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1rem" }}>
                                <div style={{
                                    width: "44px", height: "44px",
                                    backgroundColor: item.isActive ? "rgba(124,58,237,0.08)" : "#f1f5f9",
                                    borderRadius: "12px",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    color: item.isActive ? "#7c3aed" : "#94a3b8",
                                }}>
                                    {item.defaultPricingMode === "WEIGHT" ? <Scale size={20} /> : <Boxes size={20} />}
                                </div>
                                <span style={{
                                    fontSize: "9px", fontWeight: 900,
                                    textTransform: "uppercase", letterSpacing: "0.1em",
                                    padding: "3px 8px", borderRadius: "6px",
                                    backgroundColor: item.defaultPricingMode === "WEIGHT" ? "rgba(14,165,233,0.08)" : "rgba(21,128,61,0.08)",
                                    color: item.defaultPricingMode === "WEIGHT" ? "#0ea5e9" : "#15803d",
                                    border: `1px solid ${item.defaultPricingMode === "WEIGHT" ? "rgba(14,165,233,0.2)" : "rgba(21,128,61,0.2)"}`,
                                }}>
                                    {item.defaultPricingMode === "WEIGHT" ? "per 10 KG" : "per Unit"}
                                </span>
                            </div>

                            {/* Name */}
                            <h3 style={{ margin: "0 0 1rem", fontSize: "15px", fontWeight: 900, color: "var(--text-main)", letterSpacing: "-0.01em", lineHeight: 1.3 }}>
                                {item.name}
                            </h3>

                            {/* Footer: status toggle */}
                            <div style={{ paddingTop: "0.875rem", borderTop: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <span style={{
                                    fontSize: "10px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em",
                                    color: item.isActive ? "#15803d" : "#94a3b8",
                                }}>
                                    {item.isActive ? (t("master.items.active") || "Active") : (t("master.items.inactive") || "Inactive")}
                                </span>
                                {isAdmin && (
                                    <button
                                        onClick={() => toggleActive(item)}
                                        disabled={togglingId === item.id}
                                        style={{
                                            display: "flex", alignItems: "center", gap: "4px",
                                            padding: "4px 10px", borderRadius: "8px", border: "none",
                                            cursor: togglingId === item.id ? "not-allowed" : "pointer",
                                            fontSize: "10px", fontWeight: 800,
                                            backgroundColor: item.isActive ? "#fef2f2" : "rgba(21,128,61,0.08)",
                                            color: item.isActive ? "#ef4444" : "#15803d",
                                            transition: "all 0.2s",
                                            opacity: togglingId === item.id ? 0.5 : 1,
                                        }}
                                    >
                                        {togglingId === item.id
                                            ? <Loader2 size={12} style={{ animation: "spin 0.6s linear infinite" }} />
                                            : item.isActive
                                                ? <><ToggleRight size={12} /> {t("master.items.deactivate") || "Disable"}</>
                                                : <><ToggleLeft size={12} /> {t("master.items.activate") || "Enable"}</>
                                        }
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                    {filtered.length > 0 && pagination.totalPages > 1 && (
                        <div className="premium-card" style={{ gridColumn: "1 / -1", marginTop: "1rem", padding: "1.25rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <p style={{ margin: 0, fontSize: "12px", fontWeight: 700, color: "var(--text-muted)" }}>
                                Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
                            </p>
                            <div style={{ display: "flex", gap: "0.5rem" }}>
                                <button
                                    onClick={() => handlePageChange(Math.max(1, pagination.page - 1))}
                                    disabled={pagination.page === 1}
                                    style={{ padding: "8px 16px", borderRadius: "10px", border: "1px solid var(--border-main)", backgroundColor: pagination.page === 1 ? "#f8fafc" : "#fff", fontSize: "12px", fontWeight: 800, color: pagination.page === 1 ? "#cbd5e1" : "var(--text-main)", cursor: pagination.page === 1 ? "not-allowed" : "pointer" }}>
                                    Previous
                                </button>
                                <button
                                    onClick={() => handlePageChange(Math.min(pagination.totalPages, pagination.page + 1))}
                                    disabled={pagination.page === pagination.totalPages}
                                    style={{ padding: "8px 16px", borderRadius: "10px", border: "1px solid var(--border-main)", backgroundColor: pagination.page === pagination.totalPages ? "#f8fafc" : "#fff", fontSize: "12px", fontWeight: 800, color: pagination.page === pagination.totalPages ? "#cbd5e1" : "var(--text-main)", cursor: pagination.page === pagination.totalPages ? "not-allowed" : "pointer" }}>
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* ── Add Item Modal ── */}
            {isModalOpen && (
                <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
                    <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(15,23,42,0.6)", backdropFilter: "blur(8px)" }} onClick={() => !submitting && setIsModalOpen(false)} />
                    <div style={{ position: "relative", backgroundColor: "#fff", width: "100%", maxWidth: "460px", borderRadius: "24px", boxShadow: "0 25px 50px rgba(0,0,0,0.2)", overflow: "hidden" }}>

                        {/* Modal header accent */}
                        <div style={{ height: "4px", background: "linear-gradient(90deg, #7c3aed, #a78bfa)" }} />

                        <div style={{ padding: "1.75rem 2rem 1rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <div>
                                <h2 style={{ margin: 0, fontSize: "1.375rem", fontWeight: 900, color: "var(--text-main)", letterSpacing: "-0.02em" }}>
                                    {t("master.items.addItem")}
                                </h2>
                                <p style={{ margin: "2px 0 0", fontSize: "11px", fontWeight: 700, color: "#94a3b8" }}>
                                    {t("master.items.addItemSubtitle") || "Item will be available in all bills"}
                                </p>
                            </div>
                            <button onClick={() => setIsModalOpen(false)} style={{ width: "36px", height: "36px", borderRadius: "50%", border: "none", backgroundColor: "#f1f5f9", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}
                                onMouseEnter={e => e.currentTarget.style.backgroundColor = "#e2e8f0"}
                                onMouseLeave={e => e.currentTarget.style.backgroundColor = "#f1f5f9"}>
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleAddItem} style={{ padding: "1rem 2rem 2rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                            {/* Item Name */}
                            <div>
                                <p style={{ margin: "0 0 8px", fontSize: "10px", fontWeight: 900, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.15em" }}>
                                    {t("master.items.itemName")} *
                                </p>
                                <input
                                    required
                                    type="text"
                                    placeholder={t("master.items.itemNamePlaceholder") || "e.g. Tomato, Onion, Potato..."}
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                    style={{ width: "100%", boxSizing: "border-box", padding: "12px 16px", backgroundColor: "#f8fafc", border: "1.5px solid var(--border-main)", borderRadius: "12px", fontSize: "15px", fontWeight: 700, color: "var(--text-main)", outline: "none", transition: "all 0.2s" }}
                                    onFocusCapture={e => { e.currentTarget.style.borderColor = "#7c3aed"; e.currentTarget.style.backgroundColor = "#fff"; }}
                                    onBlurCapture={e => { e.currentTarget.style.borderColor = "var(--border-main)"; e.currentTarget.style.backgroundColor = "#f8fafc"; }}
                                />
                            </div>

                            {/* Pricing Mode */}
                            <div>
                                <p style={{ margin: "0 0 10px", fontSize: "10px", fontWeight: 900, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.15em" }}>
                                    {t("master.items.pricingMode") || "Default Pricing Mode"} *
                                </p>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                                    {[
                                        { value: "WEIGHT", label: t("master.items.weight") || "Weight Based", sublabel: "Price per 10 KG", icon: Scale, color: "#0ea5e9", bg: "rgba(14,165,233,0.08)", border: "rgba(14,165,233,0.3)" },
                                        { value: "UNIT", label: t("master.items.unit") || "Unit Based", sublabel: "Price per Crate / Piece", icon: Boxes, color: "#15803d", bg: "rgba(21,128,61,0.08)", border: "rgba(21,128,61,0.3)" },
                                    ].map(opt => {
                                        const Icon = opt.icon;
                                        const selected = formData.defaultPricingMode === opt.value;
                                        return (
                                            <button
                                                key={opt.value}
                                                type="button"
                                                onClick={() => setFormData({ ...formData, defaultPricingMode: opt.value as any })}
                                                style={{
                                                    padding: "14px 12px", borderRadius: "14px", cursor: "pointer", textAlign: "left",
                                                    border: `2px solid ${selected ? opt.border : "var(--border-main)"}`,
                                                    backgroundColor: selected ? opt.bg : "#f8fafc",
                                                    transition: "all 0.2s",
                                                }}
                                            >
                                                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                                                    <Icon size={16} color={selected ? opt.color : "#94a3b8"} />
                                                    <span style={{ fontSize: "12px", fontWeight: 900, color: selected ? opt.color : "#64748b" }}>{opt.label}</span>
                                                </div>
                                                <p style={{ margin: 0, fontSize: "10px", fontWeight: 700, color: selected ? opt.color : "#94a3b8", opacity: 0.8 }}>{opt.sublabel}</p>
                                            </button>
                                        );
                                    })}
                                </div>
                                <p style={{ margin: "8px 0 0", fontSize: "11px", fontWeight: 600, color: "#94a3b8" }}>
                                    💡 {t("master.items.pricingModeNote") || "This can be overridden when creating a bill"}
                                </p>
                            </div>

                            {/* Buttons */}
                            <div style={{ display: "flex", gap: "0.75rem", paddingTop: "0.5rem" }}>
                                <button type="button" onClick={() => setIsModalOpen(false)} style={{ flex: 1, padding: "12px", border: "none", backgroundColor: "#f1f5f9", borderRadius: "12px", fontWeight: 800, fontSize: "13px", color: "#64748b", cursor: "pointer", transition: "all 0.2s" }}
                                    onMouseEnter={e => e.currentTarget.style.backgroundColor = "#e2e8f0"}
                                    onMouseLeave={e => e.currentTarget.style.backgroundColor = "#f1f5f9"}>
                                    {t("master.actions.cancel")}
                                </button>
                                <button disabled={submitting} type="submit" style={{ flex: 2, padding: "12px", border: "none", backgroundColor: "#7c3aed", borderRadius: "12px", fontWeight: 900, fontSize: "13px", color: "#fff", cursor: submitting ? "not-allowed" : "pointer", boxShadow: "0 8px 16px rgba(124,58,237,0.25)", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", transition: "all 0.2s", opacity: submitting ? 0.7 : 1 }}>
                                    {submitting ? <Loader2 size={18} style={{ animation: "spin 0.6s linear infinite" }} /> : t("master.actions.save")}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes pulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 0.8; } }
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}
