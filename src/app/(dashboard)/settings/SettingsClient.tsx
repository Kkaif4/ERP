"use client";

import { useEffect, useState } from "react";
import { useTranslation } from "@/lib/i18n";
import { toast } from "sonner";
import { businessConfigSchema } from "@/lib/schemas";

type ChargeType = "PERCENTAGE" | "FIXED";

interface BusinessConfigDto {
    id: string;
    taxType: ChargeType;
    taxValue: number;
    serviceChargeType: ChargeType;
    serviceChargeValue: number;
}

export default function SettingsClient() {
    const { t } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [config, setConfig] = useState<BusinessConfigDto | null>(null);

    const [taxType, setTaxType] = useState<ChargeType>("PERCENTAGE");
    const [taxValue, setTaxValue] = useState<string>("0");
    const [serviceChargeType, setServiceChargeType] = useState<ChargeType>("PERCENTAGE");
    const [serviceChargeValue, setServiceChargeValue] = useState<string>("0");

    useEffect(() => {
        const loadConfig = async () => {
            try {
                const res = await fetch("/api/config");
                if (!res.ok) throw new Error("Failed to load settings");
                const data: BusinessConfigDto = await res.json();
                setConfig(data);
                setTaxType(data.taxType);
                setTaxValue(String(data.taxValue ?? 0));
                setServiceChargeType(data.serviceChargeType);
                setServiceChargeValue(String(data.serviceChargeValue ?? 0));
            } catch (e: any) {
                console.error(e);
                toast.error(e?.message || "Unable to load business settings");
            } finally {
                setLoading(false);
            }
        };

        loadConfig();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        if (saving) return;

        const data = {
            taxType,
            taxValue: Number(taxValue),
            serviceChargeType,
            serviceChargeValue: Number(serviceChargeValue),
        };

        const validationResult = businessConfigSchema.safeParse(data);
        if (!validationResult.success) {
            toast.error(validationResult.error.issues[0].message);
            return;
        }

        setSaving(true);
        try {
            const res = await fetch("/api/config", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(validationResult.data),
            });

            const text = await res.text();
            let payload: any = null;
            try {
                payload = text ? JSON.parse(text) : null;
            } catch {
                // ignore parse error
            }

            if (!res.ok) {
                const msg = payload?.error || "Failed to save settings";
                toast.error(msg);
                return;
            }

            setConfig(payload);
            toast.success("Business settings updated");
        } catch (error: any) {
            console.error("Settings save error", error);
            toast.error("Unexpected error while saving settings");
        } finally {
            setSaving(false);
        }
    };

    const title = t("settings.title") || "Business Settings";

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
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
                        {title}
                    </h1>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "6px" }}>
                        <div style={{ height: "3px", width: "24px", backgroundColor: "var(--primary-main)", borderRadius: "2px" }} />
                        <p
                            style={{
                                margin: 0,
                                fontSize: "11px",
                                fontWeight: 800,
                                color: "var(--text-muted)",
                                textTransform: "uppercase",
                                letterSpacing: "0.15em",
                            }}
                        >
                            {t("settings.subtitle") || "Tax & service configuration for this mandi"}
                        </p>
                    </div>
                </div>
            </div>

            {/* Form */}
            <div className="premium-card" style={{ padding: "2rem", maxWidth: 640 }}>
                {loading ? (
                    <div style={{ height: "160px", animation: "pulse 1.5s ease-in-out infinite", opacity: 0.6 }} />
                ) : (
                    <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                        {/* Tax Section */}
                        <div>
                            <p
                                style={{
                                    margin: "0 0 0.5rem",
                                    fontSize: "11px",
                                    fontWeight: 900,
                                    color: "var(--text-muted)",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.18em",
                                }}
                            >
                                {t("settings.taxSection") || "Tax"}
                            </p>
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "minmax(0, 1.2fr) minmax(0, 1fr)",
                                    gap: "0.75rem",
                                    alignItems: "center",
                                }}
                            >
                                <div>
                                    <label
                                        style={{
                                            display: "block",
                                            marginBottom: "6px",
                                            fontSize: "10px",
                                            fontWeight: 800,
                                            letterSpacing: "0.16em",
                                            textTransform: "uppercase",
                                            color: "#94a3b8",
                                        }}
                                    >
                                        {t("settings.taxType") || "Tax Type"}
                                    </label>
                                    <select
                                        value={taxType}
                                        onChange={(e) => setTaxType(e.target.value as ChargeType)}
                                        style={{
                                            width: "100%",
                                            padding: "10px 14px",
                                            borderRadius: "12px",
                                            border: "1.5px solid var(--border-main)",
                                            backgroundColor: "#f8fafc",
                                            fontSize: "13px",
                                            fontWeight: 700,
                                            color: "var(--text-main)",
                                            outline: "none",
                                        }}
                                    >
                                        <option value="PERCENTAGE">{t("settings.percentage") || "Percentage (%)"}</option>
                                        <option value="FIXED">{t("settings.fixed") || "Fixed Amount (₹)"}</option>
                                    </select>
                                </div>
                                <div>
                                    <label
                                        style={{
                                            display: "block",
                                            marginBottom: "6px",
                                            fontSize: "10px",
                                            fontWeight: 800,
                                            letterSpacing: "0.16em",
                                            textTransform: "uppercase",
                                            color: "#94a3b8",
                                        }}
                                    >
                                        {t("settings.taxValue") || "Tax Value"}
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min={0}
                                        value={taxValue}
                                        onChange={(e) => setTaxValue(e.target.value)}
                                        onKeyDown={(e) => ["e", "E", "+", "-"].includes(e.key) && e.preventDefault()}
                                        onWheel={(e) => (e.target as HTMLInputElement).blur()}
                                        style={{
                                            width: "100%",
                                            boxSizing: "border-box",
                                            padding: "10px 14px",
                                            borderRadius: "12px",
                                            border: "1.5px solid var(--border-main)",
                                            backgroundColor: "#f8fafc",
                                            fontSize: "14px",
                                            fontWeight: 700,
                                            color: "var(--text-main)",
                                            outline: "none",
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Service Charge Section */}
                        <div>
                            <p
                                style={{
                                    margin: "0 0 0.5rem",
                                    fontSize: "11px",
                                    fontWeight: 900,
                                    color: "var(--text-muted)",
                                    textTransform: "uppercase",
                                    letterSpacing: "0.18em",
                                }}
                            >
                                {t("settings.serviceSection") || "Service Charge"}
                            </p>
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: "minmax(0, 1.2fr) minmax(0, 1fr)",
                                    gap: "0.75rem",
                                    alignItems: "center",
                                }}
                            >
                                <div>
                                    <label
                                        style={{
                                            display: "block",
                                            marginBottom: "6px",
                                            fontSize: "10px",
                                            fontWeight: 800,
                                            letterSpacing: "0.16em",
                                            textTransform: "uppercase",
                                            color: "#94a3b8",
                                        }}
                                    >
                                        {t("settings.serviceType") || "Service Charge Type"}
                                    </label>
                                    <select
                                        value={serviceChargeType}
                                        onChange={(e) => setServiceChargeType(e.target.value as ChargeType)}
                                        style={{
                                            width: "100%",
                                            padding: "10px 14px",
                                            borderRadius: "12px",
                                            border: "1.5px solid var(--border-main)",
                                            backgroundColor: "#f8fafc",
                                            fontSize: "13px",
                                            fontWeight: 700,
                                            color: "var(--text-main)",
                                            outline: "none",
                                        }}
                                    >
                                        <option value="PERCENTAGE">{t("settings.percentage") || "Percentage (%)"}</option>
                                        <option value="FIXED">{t("settings.fixed") || "Fixed Amount (₹)"}</option>
                                    </select>
                                </div>
                                <div>
                                    <label
                                        style={{
                                            display: "block",
                                            marginBottom: "6px",
                                            fontSize: "10px",
                                            fontWeight: 800,
                                            letterSpacing: "0.16em",
                                            textTransform: "uppercase",
                                            color: "#94a3b8",
                                        }}
                                    >
                                        {t("settings.serviceValue") || "Service Charge Value"}
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        min={0}
                                        value={serviceChargeValue}
                                        onChange={(e) => setServiceChargeValue(e.target.value)}
                                        onKeyDown={(e) => ["e", "E", "+", "-"].includes(e.key) && e.preventDefault()}
                                        onWheel={(e) => (e.target as HTMLInputElement).blur()}
                                        style={{
                                            width: "100%",
                                            boxSizing: "border-box",
                                            padding: "10px 14px",
                                            borderRadius: "12px",
                                            border: "1.5px solid var(--border-main)",
                                            backgroundColor: "#f8fafc",
                                            fontSize: "14px",
                                            fontWeight: 700,
                                            color: "var(--text-main)",
                                            outline: "none",
                                        }}
                                    />
                                </div>
                            </div>
                        </div>

                        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
                            <button
                                type="submit"
                                disabled={saving}
                                style={{
                                    padding: "10px 20px",
                                    borderRadius: "12px",
                                    border: "none",
                                    backgroundColor: "var(--primary-main)",
                                    color: "#fff",
                                    fontWeight: 900,
                                    fontSize: "13px",
                                    cursor: saving ? "not-allowed" : "pointer",
                                    boxShadow: "0 8px 16px var(--primary-glow)",
                                    opacity: saving ? 0.7 : 1,
                                }}
                            >
                                {saving ? t("common.saving") || "Saving..." : t("common.save") || "Save Changes"}
                            </button>
                        </div>
                    </form>
                )}
            </div>

            {/* Preview Section */}
            {!loading && (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem", maxWidth: 640 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{ height: "3px", width: "16px", backgroundColor: "#94a3b8", borderRadius: "2px" }} />
                        <p style={{ margin: 0, fontSize: "10px", fontWeight: 900, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.2em" }}>
                            {t("settings.preview") || "Calculation Preview"}
                        </p>
                    </div>

                    <div className="premium-card" style={{ padding: "1.5rem", backgroundColor: "#f8fafc", border: "1.5px dashed var(--border-main)" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                            <span style={{ fontSize: "12px", fontWeight: 700, color: "#64748b" }}>Sample Subtotal</span>
                            <span style={{ fontSize: "13px", fontWeight: 900, color: "#1e293b" }}>₹ 1,000.00</span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.75rem" }}>
                            <span style={{ fontSize: "12px", fontWeight: 700, color: "#64748b" }}>
                                {t("settings.taxSection") || "Tax"} ({taxType === "PERCENTAGE" ? `${taxValue || 0}%` : `₹${taxValue || 0}`})
                            </span>
                            <span style={{ fontSize: "13px", fontWeight: 900, color: "#1e293b" }}>
                                ₹ {(taxType === "PERCENTAGE" ? 1000 * (Number(taxValue) / 100) : Number(taxValue)).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
                            <span style={{ fontSize: "12px", fontWeight: 700, color: "#64748b" }}>
                                {t("settings.serviceSection") || "Service Charge"} ({serviceChargeType === "PERCENTAGE" ? `${serviceChargeValue || 0}%` : `₹${serviceChargeValue || 0}`})
                            </span>
                            <span style={{ fontSize: "13px", fontWeight: 900, color: "#1e293b" }}>
                                ₹ {(serviceChargeType === "PERCENTAGE" ? 1000 * (Number(serviceChargeValue) / 100) : Number(serviceChargeValue)).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                        <div style={{ height: "1px", backgroundColor: "var(--border-main)", marginBottom: "1rem" }} />
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: "11px", fontWeight: 900, color: "var(--text-main)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Total Balance Impact</span>
                            <span style={{ fontSize: "18px", fontWeight: 950, color: "var(--primary-main)" }}>
                                ₹ {(1000 + (taxType === "PERCENTAGE" ? 1000 * (Number(taxValue) / 100) : Number(taxValue)) + (serviceChargeType === "PERCENTAGE" ? 1000 * (Number(serviceChargeValue) / 100) : Number(serviceChargeValue))).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                            </span>
                        </div>
                    </div>
                </div>
            )}

            <style>{`
                @keyframes pulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 0.9; } }
            `}</style>
        </div>
    );
}

