"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "@/lib/i18n";
import { useRouter } from "next/navigation";
import { Users, Plus, Search, Phone, MapPin, ChevronRight, Loader2, X, ArrowRight, Clock } from "lucide-react";
import { toast } from "sonner";

interface Farmer { id: string; name: string; mobile: string; address: string | null; balance: number; }

export default function FarmersPage() {
    const { t, language } = useTranslation();
    const router = useRouter();
    const [farmers, setFarmers] = useState<Farmer[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ name: "", mobile: "", address: "" });
    const [submitting, setSubmitting] = useState(false);

    const fetchFarmers = async () => {
        try {
            const res = await fetch(`/api/farmers?search=${encodeURIComponent(search)}`);
            const data = await res.json();
            setFarmers(data || []);
        } catch { toast.error(t("master.farmers.errorLoad")); }
        finally { setLoading(false); }
    };

    useEffect(() => { fetchFarmers(); }, [search]);

    const handleAddFarmer = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.mobile) { toast.error(t("master.farmers.emptyFields")); return; }
        setSubmitting(true);
        try {
            const res = await fetch("/api/farmers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(formData) });
            if (res.ok) { toast.success(t("master.farmers.successAdd")); setIsModalOpen(false); setFormData({ name: "", mobile: "", address: "" }); fetchFarmers(); }
            else toast.error(t("master.farmers.errorAdd"));
        } catch { toast.error(t("master.farmers.errorAdd")); }
        finally { setSubmitting(false); }
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
                        <div style={{ height: "3px", width: "24px", backgroundColor: "var(--primary-main)", borderRadius: "2px" }} />
                        <p style={{ margin: 0, fontSize: "11px", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.15em", display: "flex", alignItems: "center", gap: "6px" }}>
                            <Clock size={12} /> {farmers.length} {t("master.farmers.totalFarmers")} · {today}
                        </p>
                    </div>
                </div>
                <button onClick={() => setIsModalOpen(true)} style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "10px 20px", backgroundColor: "var(--primary-main)", color: "#fff", borderRadius: "12px", fontWeight: 800, fontSize: "14px", border: "none", cursor: "pointer", boxShadow: "0 8px 16px var(--primary-glow)", transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)", letterSpacing: "0.02em" }}
                    onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; e.currentTarget.style.boxShadow = "0 12px 24px rgba(0,0,0,0.15)"; }}
                    onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; e.currentTarget.style.boxShadow = "0 8px 16px var(--primary-glow)"; }}>
                    <Plus size={16} strokeWidth={3} /> {t("master.farmers.addFarmer")}
                </button>
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
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
                    {farmers.map(farmer => (
                        <div key={farmer.id} className="premium-card" style={{ padding: "1.75rem", cursor: "pointer" }} onClick={() => router.push(`/farmers/${farmer.id}`)}>
                            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.25rem" }}>
                                <div style={{ width: "48px", height: "48px", backgroundColor: "var(--primary-glow)", borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primary-main)", fontWeight: 900, fontSize: "20px", border: "1px solid rgba(21,128,61,0.15)", flexShrink: 0 }}>
                                    {farmer.name.charAt(0).toUpperCase()}
                                </div>
                                <div style={{ textAlign: "right" }}>
                                    <p style={{ margin: 0, fontSize: "10px", fontWeight: 900, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: "4px" }}>{t("master.farmers.balance")}</p>
                                    <p style={{ margin: 0, fontSize: "1.25rem", fontWeight: 900, color: farmer.balance > 0 ? "#d97706" : "#16a34a" }}>
                                        ₹ {farmer.balance.toLocaleString("en-IN")}
                                    </p>
                                </div>
                            </div>
                            <h3 style={{ margin: "0 0 1rem", fontSize: "1.125rem", fontWeight: 900, color: "var(--text-main)", letterSpacing: "-0.01em" }}>{farmer.name}</h3>
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
                            <div style={{ marginTop: "1.25rem", paddingTop: "1.25rem", borderTop: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between", color: "var(--primary-main)" }}>
                                <span style={{ fontSize: "11px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em" }}>{t("master.actions.viewLedger")}</span>
                                <ArrowRight size={16} />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── Add Farmer Modal ── */}
            {isModalOpen && (
                <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
                    <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(15,23,42,0.6)", backdropFilter: "blur(8px)" }} onClick={() => !submitting && setIsModalOpen(false)} />
                    <div style={{ position: "relative", backgroundColor: "#fff", width: "100%", maxWidth: "480px", borderRadius: "24px", boxShadow: "0 25px 50px rgba(0,0,0,0.2)", overflow: "hidden" }}>
                        <div style={{ padding: "1.75rem 2rem 1rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                            <h2 style={{ margin: 0, fontSize: "1.5rem", fontWeight: 900, color: "var(--text-main)", letterSpacing: "-0.02em" }}>{t("master.farmers.addFarmer")}</h2>
                            <button onClick={() => setIsModalOpen(false)} style={{ width: "36px", height: "36px", borderRadius: "50%", border: "none", backgroundColor: "#f1f5f9", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b" }}
                                onMouseEnter={e => e.currentTarget.style.backgroundColor = "#e2e8f0"}
                                onMouseLeave={e => e.currentTarget.style.backgroundColor = "#f1f5f9"}>
                                <X size={18} />
                            </button>
                        </div>
                        <form onSubmit={handleAddFarmer} style={{ padding: "1rem 2rem 2rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                            {[
                                { label: `${t("master.farmers.name")} *`, key: "name", type: "text", required: true },
                                { label: `${t("master.farmers.mobile")} *`, key: "mobile", type: "tel", required: true },
                            ].map(({ label, key, type, required }) => (
                                <div key={key}>
                                    <p style={{ margin: "0 0 8px", fontSize: "10px", fontWeight: 900, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.15em" }}>{label}</p>
                                    <input required={required} type={type} value={(formData as any)[key]} onChange={e => setFormData({ ...formData, [key]: e.target.value })}
                                        style={{ width: "100%", boxSizing: "border-box", padding: "12px 16px", backgroundColor: "#f8fafc", border: "1.5px solid var(--border-main)", borderRadius: "12px", fontSize: "15px", fontWeight: 700, color: "var(--text-main)", outline: "none", transition: "all 0.2s" }}
                                        onFocusCapture={e => { e.currentTarget.style.borderColor = "#15803d"; e.currentTarget.style.backgroundColor = "#fff"; }}
                                        onBlurCapture={e => { e.currentTarget.style.borderColor = "var(--border-main)"; e.currentTarget.style.backgroundColor = "#f8fafc"; }} />
                                </div>
                            ))}
                            <div>
                                <p style={{ margin: "0 0 8px", fontSize: "10px", fontWeight: 900, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.15em" }}>{t("master.farmers.address")}</p>
                                <textarea rows={3} value={formData.address} onChange={e => setFormData({ ...formData, address: e.target.value })}
                                    style={{ width: "100%", boxSizing: "border-box", padding: "12px 16px", backgroundColor: "#f8fafc", border: "1.5px solid var(--border-main)", borderRadius: "12px", fontSize: "15px", fontWeight: 700, color: "var(--text-main)", outline: "none", resize: "none", transition: "all 0.2s", fontFamily: "inherit" }}
                                    onFocusCapture={e => { e.currentTarget.style.borderColor = "#15803d"; e.currentTarget.style.backgroundColor = "#fff"; }}
                                    onBlurCapture={e => { e.currentTarget.style.borderColor = "var(--border-main)"; e.currentTarget.style.backgroundColor = "#f8fafc"; }} />
                            </div>
                            <div style={{ display: "flex", gap: "0.75rem", paddingTop: "0.5rem" }}>
                                <button type="button" onClick={() => setIsModalOpen(false)} style={{ flex: 1, padding: "12px", border: "none", backgroundColor: "#f1f5f9", borderRadius: "12px", fontWeight: 800, fontSize: "13px", color: "#64748b", cursor: "pointer", transition: "all 0.2s" }}
                                    onMouseEnter={e => e.currentTarget.style.backgroundColor = "#e2e8f0"}
                                    onMouseLeave={e => e.currentTarget.style.backgroundColor = "#f1f5f9"}>
                                    {t("master.actions.cancel")}
                                </button>
                                <button disabled={submitting} type="submit" style={{ flex: 2, padding: "12px", border: "none", backgroundColor: "#15803d", borderRadius: "12px", fontWeight: 900, fontSize: "13px", color: "#fff", cursor: submitting ? "not-allowed" : "pointer", boxShadow: "0 8px 16px rgba(21,128,61,0.2)", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", transition: "all 0.2s", opacity: submitting ? 0.7 : 1 }}>
                                    {submitting ? <Loader2 size={18} style={{ animation: "spin 0.6s linear infinite" } as any} /> : t("master.actions.save")}
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
