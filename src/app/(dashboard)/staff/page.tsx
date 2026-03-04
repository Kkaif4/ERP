"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "@/lib/i18n";
import {
    ShieldCheck, Plus, Search, Loader2, X, User,
    Key, Lock, UserCheck, UserMinus, ChevronRight,
    Search as SearchIcon, Mail, Phone, Clock
} from "lucide-react";
import { toast } from "sonner";
import { staffSchema } from "@/lib/schemas";
import { fmtDate } from "@/lib/dateUtils";
import { useUser } from "@/components/providers/UserContext";
import { Modal } from "@/components/ui/Modal";

interface StaffMember {
    id: string;
    name: string;
    username: string;
    role: string;
    isActive: boolean;
    createdAt: string;
}

export default function StaffPage() {
    const { t, language } = useTranslation();
    const { user: currentUser } = useUser();
    const [staff, setStaff] = useState<StaffMember[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        username: "",
        password: "",
        pin: "",
        isActive: true
    });

    const isAdmin = currentUser?.role === "ORG_ADMIN" || currentUser?.role === "SUPER_ADMIN";

    const fetchStaff = async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/staff?search=${encodeURIComponent(search)}`);
            if (res.ok) {
                const data = await res.json();
                setStaff(data);
            } else {
                toast.error(t("staff.alerts.errorLoad"));
            }
        } catch {
            toast.error(t("staff.alerts.errorLoad"));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isAdmin) {
            const timer = setTimeout(fetchStaff, 400);
            return () => clearTimeout(timer);
        }
    }, [search, isAdmin]);

    const handleAddStaff = async (e: React.FormEvent) => {
        e.preventDefault();
        const result = staffSchema.safeParse(formData);
        if (!result.success) {
            toast.error(result.error.issues[0].message);
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch("/api/staff", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });
            if (res.ok) {
                toast.success(t("staff.alerts.successAdd"));
                setIsModalOpen(false);
                setFormData({ name: "", username: "", password: "", pin: "", isActive: true });
                fetchStaff();
            } else {
                const err = await res.json();
                toast.error(err.error || t("staff.alerts.errorAdd"));
            }
        } catch {
            toast.error(t("staff.alerts.errorAdd"));
        } finally {
            setSubmitting(false);
        }
    };

    if (!isAdmin) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                <Lock size={48} className="text-slate-300 mb-4" />
                <h2 className="text-xl font-black text-slate-800">{t("staff.accessDenied.title")}</h2>
                <p className="text-slate-500">{t("staff.accessDenied.subtitle")}</p>
            </div>
        );
    }

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
                <div>
                    <h1 style={{ fontSize: "1.875rem", fontWeight: 900, color: "var(--text-main)", letterSpacing: "-0.02em", margin: 0, lineHeight: 1.2 }}>
                        {t("staff.title")}
                    </h1>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "6px" }}>
                        <div style={{ height: "3px", width: "24px", backgroundColor: "#7c3aed", borderRadius: "2px" }} />
                        <p style={{ margin: 0, fontSize: "11px", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.15em", display: "flex", alignItems: "center", gap: "6px" }}>
                            <ShieldCheck size={12} /> {staff.length} {t("staff.activeStaff")}
                        </p>
                    </div>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="premium-button-primary"
                    style={{
                        display: "inline-flex", alignItems: "center", gap: "8px", padding: "12px 24px",
                        backgroundColor: "#7c3aed", color: "#fff", borderRadius: "14px", fontWeight: 900,
                        border: "none", cursor: "pointer", boxShadow: "0 8px 20px rgba(124,58,237,0.25)"
                    }}
                >
                    <Plus size={18} strokeWidth={3} /> {t("staff.addStaff")}
                </button>
            </div>

            {/* Search */}
            <div className="premium-card" style={{ padding: "1.25rem" }}>
                <div style={{ position: "relative" }}>
                    <SearchIcon style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} size={20} />
                    <input
                        type="text"
                        placeholder={t("staff.searchPlaceholder")}
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        style={{
                            width: "100%", padding: "14px 14px 14px 52px", backgroundColor: "#f8fafc",
                            border: "1.5px solid #e2e8f0", borderRadius: "14px", fontSize: "15px",
                            fontWeight: 700, outline: "none"
                        }}
                    />
                </div>
            </div>

            {/* Staff Grid */}
            {loading ? (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.5rem" }}>
                    {[1, 2, 3].map(i => (
                        <div key={i} className="premium-card" style={{ height: "180px", opacity: 0.5, animation: "pulse 1.5s infinite" }} />
                    ))}
                </div>
            ) : staff.length === 0 ? (
                <div className="premium-card" style={{ padding: "4rem", textAlign: "center" }}>
                    <User size={48} className="text-slate-200 mx-auto mb-4" />
                    <p className="text-slate-500 font-bold">{t("staff.noStaffFound")}</p>
                </div>
            ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "1.5rem" }}>
                    {staff.map(member => (
                        <div key={member.id} className="premium-card" style={{ padding: "1.75rem", display: "flex", flexDirection: "column", gap: "1rem" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                                <div style={{
                                    width: "48px", height: "48px", borderRadius: "16px", backgroundColor: "rgba(124,58,237,0.1)",
                                    display: "flex", alignItems: "center", justifyContent: "center", color: "#7c3aed"
                                }}>
                                    <User size={24} />
                                </div>
                                <div style={{ flex: 1 }}>
                                    <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 900, color: "var(--text-main)" }}>{member.name}</h3>
                                    <p style={{ margin: 0, fontSize: "13px", fontWeight: 700, color: "var(--text-muted)" }}>@{member.username}</p>
                                </div>
                                <div style={{
                                    padding: "4px 10px", borderRadius: "8px", fontSize: "10px", fontWeight: 900,
                                    textTransform: "uppercase", letterSpacing: "0.05em",
                                    backgroundColor: member.isActive ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
                                    color: member.isActive ? "#10b981" : "#ef4444"
                                }}>
                                    {member.isActive ? t("staff.status.active") : t("staff.status.inactive")}
                                </div>
                            </div>

                            <div style={{ paddingTop: "1rem", borderTop: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--text-muted)", fontSize: "11px", fontWeight: 700 }}>
                                    <Clock size={14} /> {t("staff.joined")} {fmtDate(member.createdAt)}
                                </div>
                                <button className="p-2 hover:bg-slate-50 rounded-lg transition-colors text-slate-400">
                                    <ChevronRight size={18} />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Staff Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={() => !submitting && setIsModalOpen(false)}
                title={t("staff.modal.title")}
                subtitle={t("staff.modal.subtitle")}
                icon={<Plus size={20} />}
                maxWidth="480px"
            >
                <form onSubmit={handleAddStaff} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                    <div>
                        <label style={{ display: "block", marginBottom: "8px", fontSize: "10px", fontWeight: 900, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em" }}>{t("staff.modal.fullName")}</label>
                        <input
                            required
                            type="text"
                            value={formData.name}
                            onChange={e => setFormData({ ...formData, name: e.target.value })}
                            style={{ width: "100%", padding: "12px 16px", backgroundColor: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: "12px", outline: "none", fontWeight: 700 }}
                        />
                    </div>

                    <div>
                        <label style={{ display: "block", marginBottom: "8px", fontSize: "10px", fontWeight: 900, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em" }}>{t("staff.modal.username")}</label>
                        <input
                            required
                            type="text"
                            value={formData.username}
                            onChange={e => setFormData({ ...formData, username: e.target.value })}
                            placeholder={t("staff.modal.usernamePlaceholder")}
                            style={{ width: "100%", padding: "12px 16px", backgroundColor: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: "12px", outline: "none", fontWeight: 700 }}
                        />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                        <div>
                            <label style={{ display: "block", marginBottom: "8px", fontSize: "10px", fontWeight: 900, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em" }}>{t("staff.modal.password")}</label>
                            <input
                                type="password"
                                value={formData.password}
                                onChange={e => setFormData({ ...formData, password: e.target.value })}
                                placeholder={t("staff.modal.passwordPlaceholder")}
                                style={{ width: "100%", padding: "12px 16px", backgroundColor: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: "12px", outline: "none", fontWeight: 700 }}
                            />
                        </div>
                        <div>
                            <label style={{ display: "block", marginBottom: "8px", fontSize: "10px", fontWeight: 900, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em" }}>{t("staff.modal.pin")}</label>
                            <input
                                type="text"
                                maxLength={4}
                                value={formData.pin}
                                onChange={e => setFormData({ ...formData, pin: e.target.value })}
                                placeholder={t("staff.modal.pinPlaceholder")}
                                style={{ width: "100%", padding: "12px 16px", backgroundColor: "#f8fafc", border: "1.5px solid #e2e8f0", borderRadius: "12px", outline: "none", fontWeight: 700 }}
                            />
                        </div>
                    </div>

                    <div style={{ display: "flex", gap: "1rem", paddingTop: "0.5rem" }}>
                        <button type="button" onClick={() => setIsModalOpen(false)} style={{ flex: 1, padding: "14px", borderRadius: "14px", border: "none", backgroundColor: "#f1f5f9", fontWeight: 800, color: "#64748b", cursor: "pointer" }}>{t("staff.modal.cancel")}</button>
                        <button disabled={submitting} type="submit" style={{ flex: 2, padding: "14px", borderRadius: "14px", border: "none", backgroundColor: "#7c3aed", fontWeight: 900, color: "#fff", cursor: submitting ? "not-allowed" : "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                            {submitting ? <Loader2 size={18} style={{ animation: "spin 0.6s linear infinite" } as any} /> : t("staff.modal.save")}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
