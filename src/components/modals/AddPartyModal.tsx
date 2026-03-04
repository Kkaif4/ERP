"use client";

import { useState } from "react";
import { useTranslation } from "@/lib/i18n";
import { Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { farmerSchema, customerSchema } from "@/lib/schemas";
import { Modal } from "@/components/ui/Modal";

interface AddPartyModalProps {
    isOpen: boolean;
    onClose: () => void;
    type: "FARMER" | "CUSTOMER";
    onSuccess?: () => void;
}

export function AddPartyModal({ isOpen, onClose, type, onSuccess }: AddPartyModalProps) {
    const { t } = useTranslation();
    const [submitting, setSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        mobile: "",
        address: "",
        openingBalance: 0,
        openingBalanceType: "DUE" as "DUE" | "ADVANCE"
    });

    const isFarmer = type === "FARMER";
    const accentColor = isFarmer ? "#15803d" : "#0369a1";
    const title = isFarmer ? t("master.farmers.addFarmer") : t("master.customers.addCustomer");
    const schema = isFarmer ? farmerSchema : customerSchema;
    const apiUrl = isFarmer ? "/api/farmers" : "/api/customers";
    const successMsg = isFarmer ? t("master.farmers.successAdd") : t("master.customers.successAdd");
    const errorMsg = isFarmer ? t("master.farmers.errorAdd") : t("master.customers.errorAdd");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const result = schema.safeParse(formData);
        if (!result.success) {
            toast.error(result.error.issues[0].message);
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch(apiUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                toast.success(successMsg);
                setFormData({
                    name: "",
                    mobile: "",
                    address: "",
                    openingBalance: 0,
                    openingBalanceType: "DUE"
                });
                onSuccess?.();
                onClose();
            } else {
                toast.error(errorMsg);
            }
        } catch {
            toast.error(errorMsg);
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={() => !submitting && onClose()}
            title={title}
            icon={<Plus size={20} />}
            maxWidth="480px"
        >
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                {[
                    { label: `${isFarmer ? t("master.farmers.name") : t("master.customers.name")} *`, key: "name", type: "text", required: true },
                    { label: `${isFarmer ? t("master.farmers.mobile") : t("master.customers.mobile")} *`, key: "mobile", type: "tel", required: true },
                ].map(({ label, key, type, required }) => (
                    <div key={key}>
                        <p style={{ margin: "0 0 8px", fontSize: "10px", fontWeight: 900, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.15em" }}>{label}</p>
                        <input
                            required={required}
                            type={type}
                            value={(formData as any)[key]}
                            onChange={e => {
                                const val = e.target.value;
                                if (key === "mobile") {
                                    const digits = val.replace(/\D/g, "").slice(0, 10);
                                    setFormData({ ...formData, [key]: digits });
                                } else {
                                    setFormData({ ...formData, [key]: val });
                                }
                            }}
                            style={{ width: "100%", boxSizing: "border-box", padding: "12px 16px", backgroundColor: "#f8fafc", border: "1.5px solid var(--border-main)", borderRadius: "12px", fontSize: "15px", fontWeight: 700, color: "var(--text-main)", outline: "none", transition: "all 0.2s" }}
                            onFocusCapture={e => { e.currentTarget.style.borderColor = accentColor; e.currentTarget.style.backgroundColor = "#fff"; }}
                            onBlurCapture={e => { e.currentTarget.style.borderColor = "var(--border-main)"; e.currentTarget.style.backgroundColor = "#f8fafc"; }}
                        />
                    </div>
                ))}
                <div>
                    <p style={{ margin: "0 0 8px", fontSize: "10px", fontWeight: 900, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.15em" }}>{isFarmer ? t("master.farmers.address") : t("master.customers.address")}</p>
                    <textarea
                        rows={2}
                        value={formData.address}
                        onChange={e => setFormData({ ...formData, address: e.target.value })}
                        style={{ width: "100%", boxSizing: "border-box", padding: "12px 16px", backgroundColor: "#f8fafc", border: "1.5px solid var(--border-main)", borderRadius: "12px", fontSize: "15px", fontWeight: 700, color: "var(--text-main)", outline: "none", resize: "none", transition: "all 0.2s", fontFamily: "inherit" }}
                        onFocusCapture={e => { e.currentTarget.style.borderColor = accentColor; e.currentTarget.style.backgroundColor = "#fff"; }}
                        onBlurCapture={e => { e.currentTarget.style.borderColor = "var(--border-main)"; e.currentTarget.style.backgroundColor = "#f8fafc"; }}
                    />
                </div>

                {/* Opening Balance */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                    <div>
                        <p style={{ margin: "0 0 8px", fontSize: "10px", fontWeight: 900, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.15em" }}>{isFarmer ? t("master.farmers.openingBalance") : t("master.customers.openingBalance")}</p>
                        <div style={{ position: "relative" }}>
                            <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", fontSize: "14px", fontWeight: 800, color: "#94a3b8" }}>₹</span>
                            <input
                                type="number"
                                step="0.01"
                                value={formData.openingBalance || ""}
                                onChange={e => setFormData({ ...formData, openingBalance: parseFloat(e.target.value) || 0 })}
                                onFocusCapture={e => { e.currentTarget.style.borderColor = accentColor; e.currentTarget.style.backgroundColor = "#fff"; }}
                                onBlurCapture={e => { e.currentTarget.style.borderColor = "var(--border-main)"; e.currentTarget.style.backgroundColor = "#f8fafc"; }}
                                style={{ width: "100%", boxSizing: "border-box", padding: "12px 12px 12px 30px", backgroundColor: "#f8fafc", border: "1.5px solid var(--border-main)", borderRadius: "12px", fontSize: "15px", fontWeight: 700, color: "var(--text-main)", outline: "none" }}
                            />
                        </div>
                    </div>
                    <div>
                        <p style={{ margin: "0 0 8px", fontSize: "10px", fontWeight: 900, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.15em" }}>{isFarmer ? t("master.farmers.openingBalanceType") : t("master.customers.openingBalanceType")}</p>
                        <select
                            value={formData.openingBalanceType}
                            onChange={e => setFormData({ ...formData, openingBalanceType: e.target.value as any })}
                            style={{ width: "100%", height: "49px", padding: "0 12px", backgroundColor: "#f8fafc", border: "1.5px solid var(--border-main)", borderRadius: "12px", fontSize: "14px", fontWeight: 700, color: "var(--text-main)", outline: "none" }}
                        >
                            <option value="DUE">{isFarmer ? t("master.farmers.due") : t("master.customers.due")}</option>
                            <option value="ADVANCE">{isFarmer ? t("master.farmers.advance") : t("master.customers.advance")}</option>
                        </select>
                    </div>
                </div>

                <div style={{ display: "flex", gap: "0.75rem", paddingTop: "0.5rem" }}>
                    <button
                        type="button"
                        onClick={onClose}
                        style={{ flex: 1, padding: "12px", border: "none", backgroundColor: "#f1f5f9", borderRadius: "12px", fontWeight: 800, fontSize: "13px", color: "#64748b", cursor: "pointer", transition: "all 0.2s" }}
                        onMouseEnter={e => e.currentTarget.style.backgroundColor = "#e2e8f0"}
                        onMouseLeave={e => e.currentTarget.style.backgroundColor = "#f1f5f9"}
                    >
                        {t("master.actions.cancel")}
                    </button>
                    <button
                        disabled={submitting}
                        type="submit"
                        style={{ flex: 2, padding: "12px", border: "none", backgroundColor: accentColor, borderRadius: "12px", fontWeight: 900, fontSize: "13px", color: "#fff", cursor: submitting ? "not-allowed" : "pointer", boxShadow: `0 8px 16px ${isFarmer ? "rgba(21,128,61,0.2)" : "rgba(3,105,161,0.2)"}`, display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", transition: "all 0.2s", opacity: submitting ? 0.7 : 1 }}
                    >
                        {submitting ? <Loader2 size={18} style={{ animation: "spin 0.6s linear infinite" } as any} /> : t("master.actions.save")}
                    </button>
                </div>
            </form>
            <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
        </Modal>
    );
}
