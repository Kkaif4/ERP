"use client";

import { useState } from "react";
import { useTranslation } from "@/lib/i18n";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Eye, EyeOff, ShieldCheck, User, Lock } from "lucide-react";

export default function LoginPage() {
    const { t, language, setLanguage } = useTranslation();
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [focusedField, setFocusedField] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        username: "",
        password: "",
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch("/api/auth/login", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (res.ok) {
                toast.success(language === "mr" ? "यशस्वीरीत्या लॉगिन झाले!" : "Login Successful!");
                router.push(data.redirect);
            } else {
                toast.error(data.error || "Login Failed");
            }
        } catch {
            toast.error("An error occurred. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main
            style={{
                minHeight: "100vh",
                width: "100%",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: "#f8fafc",
                fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
                position: "relative",
                overflow: "hidden",
                padding: "2.5rem 1.5rem",
            }}
        >
            {/* Ambient Background Glow */}
            <div
                style={{
                    position: "absolute",
                    bottom: "-150px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    width: "700px",
                    height: "400px",
                    background: "radial-gradient(ellipse at center, rgba(21,128,61,0.12) 0%, transparent 70%)",
                    borderRadius: "50%",
                    pointerEvents: "none",
                    filter: "blur(40px)",
                }}
            />
            <div
                style={{
                    position: "absolute",
                    top: "-100px",
                    right: "-100px",
                    width: "400px",
                    height: "400px",
                    background: "radial-gradient(ellipse at center, rgba(21,128,61,0.06) 0%, transparent 70%)",
                    borderRadius: "50%",
                    pointerEvents: "none",
                    filter: "blur(60px)",
                }}
            />


            {/* Main Container */}
            <div style={{ width: "100%", maxWidth: "440px", position: "relative", zIndex: 10 }}>

                {/* Header */}
                <div style={{ textAlign: "center", marginBottom: "2rem" }}>
                    {/* Logo */}
                    <div style={{ display: "inline-flex", justifyContent: "center", marginBottom: "1.25rem" }} className="scale-75 sm:scale-100">
                        <div
                            style={{
                                width: "88px",
                                height: "88px",
                                backgroundColor: "#fff",
                                border: "1px solid #e2e8f0",
                                borderRadius: "28px",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                boxShadow: "0 8px 32px rgba(21,128,61,0.12), 0 2px 8px rgba(0,0,0,0.06)",
                                transform: "rotate(-3deg)",
                                transition: "transform 0.5s ease",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.transform = "rotate(0deg)")}
                            onMouseLeave={(e) => (e.currentTarget.style.transform = "rotate(-3deg)")}
                        >
                            <div
                                style={{
                                    width: "60px",
                                    height: "60px",
                                    backgroundColor: "#15803d",
                                    borderRadius: "18px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    boxShadow: "0 4px 16px rgba(21,128,61,0.4)",
                                }}
                            >
                                <ShieldCheck color="#fff" size={28} strokeWidth={2.5} />
                            </div>
                        </div>
                    </div>

                    <h1
                        style={{
                            fontWeight: 900,
                            color: "#0f172a",
                            letterSpacing: "-0.02em",
                            lineHeight: 1.2,
                            margin: "0 0 0.5rem",
                        }}
                        className="text-2xl sm:text-[2rem]"
                    >
                        {t("common.welcome")}
                    </h1>

                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px" }}>
                        <div style={{ height: "1px", width: "32px", backgroundColor: "#e2e8f0" }} />
                        <p
                            style={{
                                color: "#15803d",
                                fontWeight: 800,
                                fontSize: "10px",
                                letterSpacing: "0.35em",
                                textTransform: "uppercase",
                                margin: 0,
                            }}
                        >
                            System Portal
                        </p>
                        <div style={{ height: "1px", width: "32px", backgroundColor: "#e2e8f0" }} />
                    </div>
                </div>

                {/* Form Card */}
                <div
                    style={{
                        backgroundColor: "#ffffff",
                        border: "1px solid #e8edf2",
                        borderRadius: "28px",
                        padding: "2.5rem",
                        boxShadow: "0 20px 60px rgba(0,0,0,0.07), 0 4px 16px rgba(0,0,0,0.04)",
                    }}
                >
                    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>

                        {/* Username Field */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            <label
                                htmlFor="username"
                                style={{
                                    fontSize: "11px",
                                    fontWeight: 800,
                                    letterSpacing: "0.2em",
                                    textTransform: "uppercase",
                                    color: focusedField === "username" ? "#15803d" : "#94a3b8",
                                    transition: "color 0.25s ease",
                                    paddingLeft: "4px",
                                }}
                            >
                                {t("auth.username")}
                            </label>
                            <div style={{ position: "relative" }}>
                                <div
                                    style={{
                                        position: "absolute",
                                        left: "16px",
                                        top: "50%",
                                        transform: "translateY(-50%)",
                                        color: focusedField === "username" ? "#15803d" : "#cbd5e1",
                                        transition: "color 0.25s ease",
                                        display: "flex",
                                        alignItems: "center",
                                        pointerEvents: "none",
                                        zIndex: 1,
                                    }}
                                >
                                    <User size={18} strokeWidth={2} />
                                </div>
                                <input
                                    id="username"
                                    type="text"
                                    autoComplete="username"
                                    placeholder="your_username"
                                    required
                                    value={formData.username}
                                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                    onFocus={() => setFocusedField("username")}
                                    onBlur={() => setFocusedField(null)}
                                    style={{
                                        width: "100%",
                                        height: "54px",
                                        paddingLeft: "48px",
                                        paddingRight: "16px",
                                        fontSize: "15px",
                                        fontWeight: 500,
                                        color: "#0f172a",
                                        backgroundColor: focusedField === "username" ? "#fff" : "#f8fafc",
                                        border: `2px solid ${focusedField === "username" ? "rgba(21,128,61,0.35)" : "#e2e8f0"}`,
                                        borderRadius: "14px",
                                        outline: "none",
                                        boxSizing: "border-box",
                                        transition: "all 0.25s ease",
                                        boxShadow: focusedField === "username" ? "0 0 0 4px rgba(21,128,61,0.06)" : "none",
                                        fontFamily: "inherit",
                                    }}
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            <label
                                htmlFor="password"
                                style={{
                                    fontSize: "11px",
                                    fontWeight: 800,
                                    letterSpacing: "0.2em",
                                    textTransform: "uppercase",
                                    color: focusedField === "password" ? "#15803d" : "#94a3b8",
                                    transition: "color 0.25s ease",
                                    paddingLeft: "4px",
                                }}
                            >
                                {t("auth.password")}
                            </label>
                            <div style={{ position: "relative" }}>
                                <div
                                    style={{
                                        position: "absolute",
                                        left: "16px",
                                        top: "50%",
                                        transform: "translateY(-50%)",
                                        color: focusedField === "password" ? "#15803d" : "#cbd5e1",
                                        transition: "color 0.25s ease",
                                        display: "flex",
                                        alignItems: "center",
                                        pointerEvents: "none",
                                        zIndex: 1,
                                    }}
                                >
                                    <Lock size={18} strokeWidth={2} />
                                </div>
                                <input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    autoComplete="current-password"
                                    placeholder="••••••••"
                                    required
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    onFocus={() => setFocusedField("password")}
                                    onBlur={() => setFocusedField(null)}
                                    style={{
                                        width: "100%",
                                        height: "54px",
                                        paddingLeft: "48px",
                                        paddingRight: "52px",
                                        fontSize: "15px",
                                        fontWeight: 500,
                                        color: "#0f172a",
                                        backgroundColor: focusedField === "password" ? "#fff" : "#f8fafc",
                                        border: `2px solid ${focusedField === "password" ? "rgba(21,128,61,0.35)" : "#e2e8f0"}`,
                                        borderRadius: "14px",
                                        outline: "none",
                                        boxSizing: "border-box",
                                        transition: "all 0.25s ease",
                                        boxShadow: focusedField === "password" ? "0 0 0 4px rgba(21,128,61,0.06)" : "none",
                                        fontFamily: "inherit",
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{
                                        position: "absolute",
                                        right: "12px",
                                        top: "50%",
                                        transform: "translateY(-50%)",
                                        background: "none",
                                        border: "none",
                                        cursor: "pointer",
                                        padding: "6px",
                                        color: "#94a3b8",
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "center",
                                        borderRadius: "8px",
                                        transition: "color 0.2s ease",
                                    }}
                                    onMouseEnter={(e) => (e.currentTarget.style.color = "#15803d")}
                                    onMouseLeave={(e) => (e.currentTarget.style.color = "#94a3b8")}
                                >
                                    {showPassword ? <EyeOff size={18} strokeWidth={2} /> : <Eye size={18} strokeWidth={2} />}
                                </button>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                marginTop: "0.5rem",
                                width: "100%",
                                height: "54px",
                                backgroundColor: loading ? "#4ade80" : "#15803d",
                                color: "#fff",
                                fontSize: "13px",
                                fontWeight: 800,
                                letterSpacing: "0.15em",
                                textTransform: "uppercase",
                                border: "none",
                                borderRadius: "14px",
                                cursor: loading ? "not-allowed" : "pointer",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "10px",
                                boxShadow: "0 4px 20px rgba(21,128,61,0.35)",
                                transition: "all 0.25s ease",
                                fontFamily: "inherit",
                                opacity: loading ? 0.8 : 1,
                            }}
                            onMouseEnter={(e) => {
                                if (!loading) e.currentTarget.style.backgroundColor = "#166534";
                            }}
                            onMouseLeave={(e) => {
                                if (!loading) e.currentTarget.style.backgroundColor = "#15803d";
                            }}
                            onMouseDown={(e) => {
                                if (!loading) e.currentTarget.style.transform = "scale(0.98)";
                            }}
                            onMouseUp={(e) => {
                                e.currentTarget.style.transform = "scale(1)";
                            }}
                        >
                            {loading && (
                                <div
                                    style={{
                                        width: "18px",
                                        height: "18px",
                                        border: "2px solid rgba(255,255,255,0.4)",
                                        borderTopColor: "#fff",
                                        borderRadius: "50%",
                                        animation: "spin 0.7s linear infinite",
                                    }}
                                />
                            )}
                            {t("auth.signIn")}
                        </button>
                    </form>

                    {/* Support Link */}
                    <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
                        <button
                            style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                fontSize: "11px",
                                fontWeight: 700,
                                color: "#94a3b8",
                                letterSpacing: "0.15em",
                                textTransform: "uppercase",
                                transition: "color 0.2s ease",
                                fontFamily: "inherit",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = "#15803d")}
                            onMouseLeave={(e) => (e.currentTarget.style.color = "#94a3b8")}
                        >
                            {language === "mr" ? "प्रशासकाशी संपर्क साधा" : "Contact Support"}
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <footer style={{ textAlign: "center", marginTop: "2rem", opacity: 0.4 }}>
                    <p
                        style={{
                            fontSize: "10px",
                            fontWeight: 800,
                            color: "#64748b",
                            letterSpacing: "0.35em",
                            textTransform: "uppercase",
                            margin: 0,
                        }}
                    >
                        &copy; 2026 Sabzi Mandi ERP &bull; Secure Environment
                    </p>
                </footer>
            </div>

            {/* Spinner Keyframe */}
            <style>{`
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </main>
    );
}
