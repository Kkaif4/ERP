"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "@/lib/i18n";
import { useRouter } from "next/navigation";
import { Users, Plus, Search, Phone, MapPin, ArrowRight, Clock } from "lucide-react";
import { toast } from "sonner";
import { useUser } from "@/components/providers/UserContext";
import { AddPartyModal } from "@/components/modals/AddPartyModal";

interface Farmer { id: string; incrementalId: number; name: string; mobile: string; address: string | null; balance: number; }

export default function FarmersPage() {
    const { t, language } = useTranslation();
    const { user } = useUser();
    const router = useRouter();
    const [farmers, setFarmers] = useState<Farmer[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState(search);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [pagination, setPagination] = useState({ total: 0, page: 1, limit: 50, totalPages: 1 });

    const isAdmin = user?.role === "ORG_ADMIN" || user?.role === "SUPER_ADMIN";

    // Debounce search input
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setPagination(p => ({ ...p, page: 1 }));
        }, 400);
        return () => clearTimeout(timer);
    }, [search]);

    const fetchFarmersList = async (signal?: AbortSignal) => {
        setLoading(true);
        try {
            const res = await fetch(
                `/api/farmers?search=${encodeURIComponent(debouncedSearch)}&page=${pagination.page}`,
                { signal }
            );
            const result = await res.json();
            if (result.data) {
                setFarmers(result.data);
                setPagination(prev => ({
                    ...prev,
                    totalPages: result.pagination.totalPages,
                    total: result.pagination.total
                }));
            } else {
                setFarmers(Array.isArray(result) ? result : []);
            }
        } catch (err: any) {
            if (err.name === 'AbortError') return;
            toast.error(t("master.farmers.errorLoad"));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const controller = new AbortController();
        fetchFarmersList(controller.signal);
        return () => controller.abort();
    }, [debouncedSearch, pagination.page]);

    const handlePageChange = (newPage: number) => {
        setPagination(p => ({ ...p, page: newPage }));
        window.scrollTo({ top: 0, behavior: "smooth" });
    };


    const today = new Date().toLocaleDateString(language === "hi" ? "hi-IN" : language === "mr" ? "mr-IN" : "en-IN", { weekday: "long", day: "numeric", month: "long" });

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            {/* ── Header ── */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
                <div>
                    <h1 style={{ fontSize: "1.875rem", fontWeight: 900, color: "var(--text-main)", letterSpacing: "-0.02em", margin: 0, lineHeight: 1.2 }}>
                        {t("master.farmers.title")}
                    </h1>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "6px" }}>
                        <div style={{ height: "3px", width: "24px", backgroundColor: "#15803d", borderRadius: "2px" }} />
                        <p style={{ margin: 0, fontSize: "11px", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.15em", display: "flex", alignItems: "center", gap: "6px" }}>
                            <Clock size={12} /> {farmers.length} {t("nav.farmers")} · {today}
                        </p>
                    </div>
                </div>
                {isAdmin && (
                    <button onClick={() => setIsModalOpen(true)} style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "10px 20px", backgroundColor: "#15803d", color: "#fff", borderRadius: "12px", fontWeight: 800, fontSize: "14px", border: "none", cursor: "pointer", boxShadow: "0 8px 16px rgba(21,128,61,0.2)", transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)", letterSpacing: "0.02em" }}
                        onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 12px 24px rgba(0,0,0,0.15)"; }}
                        onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 8px 16px rgba(21,128,61,0.2)"; }}>
                        <Plus size={16} strokeWidth={3} /> {t("master.farmers.addFarmer")}
                    </button>
                )}
            </div>

            {/* ── Search ── */}
            <div className="premium-card" style={{ padding: "1rem 1.25rem" }}>
                <div style={{ position: "relative" }}>
                    <Search style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} size={18} />
                    <input type="text" placeholder={t("master.farmers.searchPlaceholder")} value={search} onChange={e => setSearch(e.target.value)}
                        style={{ width: "100%", boxSizing: "border-box", padding: "12px 12px 12px 52px", backgroundColor: "#f8fafc", border: "1.5px solid var(--border-main)", borderRadius: "12px", fontSize: "14px", fontWeight: 700, color: "var(--text-main)", outline: "none", transition: "all 0.2s" }}
                        onFocusCapture={e => { e.currentTarget.style.borderColor = "#15803d"; e.currentTarget.style.backgroundColor = "#fff"; }}
                        onBlurCapture={e => { e.currentTarget.style.borderColor = "var(--border-main)"; e.currentTarget.style.backgroundColor = "#f8fafc"; }} />
                </div>
            </div>

            {/* ── Grid ── */}
            {loading ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
                    {[1, 2, 3].map(i => <div key={i} className="premium-card" style={{ height: "220px", animation: "pulse 1.5s ease-in-out infinite", opacity: 0.5 }} />)}
                </div>
            ) : farmers.length === 0 ? (
                <div className="premium-card" style={{ padding: "4rem", textAlign: "center" }}>
                    <Users size={48} color="#e2e8f0" style={{ margin: "0 auto 1rem" }} />
                    <p style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: "#94a3b8" }}>{t("master.farmers.noFarmers")}</p>
                </div>
            ) : (
                <>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
                        {farmers.map(farmer => (
                            <div key={farmer.id} className="premium-card" style={{ padding: "1.75rem", cursor: "pointer" }} onClick={() => router.push(`/farmers/${farmer.id}`)}>
                                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.25rem" }}>
                                    <div style={{ width: "48px", height: "48px", backgroundColor: "rgba(21,128,61,0.08)", borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center", color: "#15803d", fontWeight: 900, fontSize: "20px", border: "1px solid rgba(21,128,61,0.15)", flexShrink: 0 }}>
                                        {farmer.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div style={{ textAlign: "right" }}>
                                        <p style={{ margin: 0, fontSize: "10px", fontWeight: 900, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: "4px" }}>{t("master.farmers.balance")}</p>
                                        <p style={{ margin: 0, fontSize: "1.25rem", fontWeight: 900, color: farmer.balance > 0 ? "#d97706" : "#16a34a" }}>
                                            ₹ {farmer.balance.toLocaleString("en-IN")}
                                        </p>
                                    </div>
                                </div>
                                <h3 style={{ margin: "0 0 1rem", fontSize: "1.125rem", fontWeight: 900, color: "var(--text-main)", letterSpacing: "-0.01em" }}>
                                    <span style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginRight: "0.5rem", fontWeight: 700 }}>#{farmer.incrementalId}</span>
                                    {farmer.name}
                                </h3>
                                <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#64748b" }}>
                                        <div style={{ width: "32px", height: "32px", backgroundColor: "#f8fafc", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                                            <Phone size={14} />
                                        </div>
                                        <span style={{ fontSize: "13px", fontWeight: 700 }}>{farmer.mobile}</span>
                                    </div>
                                    {farmer.address && (
                                        <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", color: "#64748b" }}>
                                            <div style={{ width: "32px", height: "32px", backgroundColor: "#f8fafc", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "2px" }}>
                                                <MapPin size={14} />
                                            </div>
                                            <span style={{ fontSize: "13px", fontWeight: 600, lineHeight: 1.4 }}>{farmer.address}</span>
                                        </div>
                                    )}
                                </div>
                                <div style={{ marginTop: "1.25rem", paddingTop: "1.25rem", borderTop: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between", color: "#15803d" }}>
                                    <span style={{ fontSize: "11px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em" }}>{t("master.actions.viewLedger")}</span>
                                    <ArrowRight size={16} />
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    {pagination.totalPages > 1 && (
                        <div className="premium-card" style={{ marginTop: "2rem", padding: "1.25rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <p style={{ margin: 0, fontSize: "12px", fontWeight: 700, color: "var(--text-muted)" }}>
                                {t("common.pagination.status", { page: pagination.page, total: pagination.totalPages, count: pagination.total })}
                            </p>
                            <div style={{ display: "flex", gap: "0.5rem" }}>
                                <button
                                    onClick={() => handlePageChange(Math.max(1, pagination.page - 1))}
                                    disabled={pagination.page === 1}
                                    style={{ padding: "8px 16px", borderRadius: "10px", border: "1px solid var(--border-main)", backgroundColor: pagination.page === 1 ? "#f8fafc" : "#fff", fontSize: "12px", fontWeight: 800, color: pagination.page === 1 ? "#cbd5e1" : "var(--text-main)", cursor: pagination.page === 1 ? "not-allowed" : "pointer" }}>
                                    {t("common.pagination.previous")}
                                </button>
                                <button
                                    onClick={() => handlePageChange(Math.min(pagination.totalPages, pagination.page + 1))}
                                    disabled={pagination.page === pagination.totalPages}
                                    style={{ padding: "8px 16px", borderRadius: "10px", border: "1px solid var(--border-main)", backgroundColor: pagination.page === pagination.totalPages ? "#f8fafc" : "#fff", fontSize: "12px", fontWeight: 800, color: pagination.page === pagination.totalPages ? "#cbd5e1" : "var(--text-main)", cursor: pagination.page === pagination.totalPages ? "not-allowed" : "pointer" }}>
                                    {t("common.pagination.next")}
                                </button>
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* ── Add Farmer Modal ── */}
            <AddPartyModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                type="FARMER"
                onSuccess={() => fetchFarmersList()}
            />

            <style>{`
                @keyframes pulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 0.8; } }
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}
