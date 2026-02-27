"use client";

import { useTranslation } from "@/lib/i18n";
import { Calendar, Clock } from "lucide-react";

interface DateRangePickerProps {
    startDate: string;
    endDate: string;
    onStartChange: (date: string) => void;
    onEndChange: (date: string) => void;
}

export default function DateRangePicker({ startDate, endDate, onStartChange, onEndChange }: DateRangePickerProps) {
    const { t } = useTranslation();

    const presets = [
        { label: t("reports.presets.today"), getDates: () => ({ start: new Date().toISOString().split('T')[0], end: new Date().toISOString().split('T')[0] }) },
        {
            label: t("reports.presets.yesterday"), getDates: () => {
                const d = new Date(); d.setDate(d.getDate() - 1);
                const s = d.toISOString().split('T')[0];
                return { start: s, end: s };
            }
        },
        {
            label: t("reports.presets.last7Days"), getDates: () => {
                const end = new Date().toISOString().split('T')[0];
                const start = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                return { start, end };
            }
        },
        {
            label: t("reports.presets.thisMonth"), getDates: () => {
                const now = new Date();
                const start = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
                const end = now.toISOString().split('T')[0];
                return { start, end };
            }
        }
    ];

    return (
        <div className="premium-card" style={{ padding: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "1.25rem" }}>
                <div style={{ width: "36px", height: "36px", backgroundColor: "var(--primary-glow)", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--primary-main)" }}>
                    <Calendar size={18} />
                </div>
                <p style={{ margin: 0, fontSize: "10px", fontWeight: 900, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.2em" }}>
                    {t("reports.dateRange")}
                </p>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "1.5rem", alignItems: "flex-end" }}>
                <div style={{ flex: "1", minWidth: "200px" }}>
                    <label style={{ display: "block", fontSize: "10px", fontWeight: 900, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: "8px" }}>
                        {t("reports.startDate")}
                    </label>
                    <div style={{ position: "relative" }}>
                        <Clock size={16} style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => onStartChange(e.target.value)}
                            style={{
                                width: "100%",
                                boxSizing: "border-box",
                                padding: "12px 14px 12px 52px",
                                backgroundColor: "#f1f5f9",
                                border: "1.5px solid #e2e8f0",
                                borderRadius: "14px",
                                fontSize: "14px",
                                fontWeight: 700,
                                color: "var(--text-main)",
                                outline: "none"
                            }}
                        />
                    </div>
                </div>

                <div style={{ flex: "1", minWidth: "200px" }}>
                    <label style={{ display: "block", fontSize: "10px", fontWeight: 900, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: "8px" }}>
                        {t("reports.endDate")}
                    </label>
                    <div style={{ position: "relative" }}>
                        <Clock size={16} style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => onEndChange(e.target.value)}
                            style={{
                                width: "100%",
                                boxSizing: "border-box",
                                padding: "12px 14px 12px 52px",
                                backgroundColor: "#f1f5f9",
                                border: "1.5px solid #e2e8f0",
                                borderRadius: "14px",
                                fontSize: "14px",
                                fontWeight: 700,
                                color: "var(--text-main)",
                                outline: "none"
                            }}
                        />
                    </div>
                </div>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "1.5rem" }}>
                {presets.map((preset) => (
                    <button
                        key={preset.label}
                        onClick={() => {
                            const { start, end } = preset.getDates();
                            onStartChange(start);
                            onEndChange(end);
                        }}
                        style={{
                            padding: "6px 12px",
                            backgroundColor: "#f1f5f9",
                            border: "none",
                            borderRadius: "8px",
                            fontSize: "11px",
                            fontWeight: 800,
                            color: "#64748b",
                            cursor: "pointer",
                            transition: "all 0.2s"
                        }}
                        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = "var(--primary-glow)"; e.currentTarget.style.color = "var(--primary-main)"; }}
                        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = "#f1f5f9"; e.currentTarget.style.color = "#64748b"; }}
                    >
                        {preset.label}
                    </button>
                ))}
            </div>
        </div>
    );
}
