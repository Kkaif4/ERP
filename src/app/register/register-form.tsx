"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslation } from "@/lib/i18n";
import { toast } from "sonner";
import {
  Eye,
  EyeOff,
  ShieldCheck,
  User,
  Lock,
  Mail,
  Building2,
  ArrowRight,
  Loader2,
} from "lucide-react";
import Link from "next/link";

export function RegisterForm() {
  const router = useRouter();
  const { t, language } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    password: "",
    organizationName: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Account created successfully!");
        router.push(data.redirect || "/dashboard");
      } else {
        toast.error(data.error || "Registration failed");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        width: "100%",
        maxWidth: "480px",
        position: "relative",
        zIndex: 10,
      }}
    >
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <Link
          href="/"
          style={{
            display: "inline-flex",
            textDecoration: "none",
            marginBottom: "1.25rem",
          }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              backgroundColor: "#fff",
              border: "1px solid #e2e8f0",
              borderRadius: "20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              boxShadow:
                "0 8px 32px rgba(21,128,61,0.1), 0 2px 8px rgba(0,0,0,0.04)",
            }}
          >
            <div
              style={{
                width: "44px",
                height: "44px",
                backgroundColor: "#15803d",
                borderRadius: "14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 4px 12px rgba(21,128,61,0.3)",
              }}
            >
              <ShieldCheck color="#fff" size={20} strokeWidth={2.5} />
            </div>
          </div>
        </Link>

        <h1
          style={{
            fontSize: "1.875rem",
            fontWeight: 900,
            color: "#0f172a",
            letterSpacing: "-0.02em",
            lineHeight: 1.2,
            margin: "0 0 0.5rem",
          }}
        >
          {t("auth.createAdmin")}
        </h1>
        <p style={{ color: "#64748b", fontWeight: 500, fontSize: "0.9375rem" }}>
          {t("auth.startManaging")}
        </p>
      </div>

      {/* Form Card */}
      <div
        style={{
          backgroundColor: "#ffffff",
          border: "1px solid #e8edf2",
          borderRadius: "28px",
          padding: "2.5rem",
          boxShadow:
            "0 20px 60px rgba(0,0,0,0.05), 0 4px 16px rgba(0,0,0,0.02)",
        }}
      >
        <form
          onSubmit={handleSubmit}
          style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
        >
          {/* Full Name */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label
              style={{
                fontSize: "11px",
                fontWeight: 800,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: focusedField === "name" ? "#15803d" : "#94a3b8",
              }}
            >
              {t("auth.fullName")}
            </label>
            <div style={{ position: "relative" }}>
              <div
                style={{
                  position: "absolute",
                  left: "16px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: focusedField === "name" ? "#15803d" : "#cbd5e1",
                  zIndex: 1,
                }}
              >
                <User size={18} />
              </div>
              <input
                type="text"
                placeholder="John Doe"
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                onFocus={() => setFocusedField("name")}
                onBlur={() => setFocusedField(null)}
                style={inputStyle(focusedField === "name")}
              />
            </div>
          </div>

          {/* Organization Name */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label
              style={{
                fontSize: "11px",
                fontWeight: 800,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: focusedField === "org" ? "#15803d" : "#94a3b8",
              }}
            >
              {t("auth.organizationName")}
            </label>
            <div style={{ position: "relative" }}>
              <div
                style={{
                  position: "absolute",
                  left: "16px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: focusedField === "org" ? "#15803d" : "#cbd5e1",
                  zIndex: 1,
                }}
              >
                <Building2 size={18} />
              </div>
              <input
                type="text"
                placeholder="Apex Fruits & Veg Mandi"
                required
                value={formData.organizationName}
                onChange={(e) =>
                  setFormData({ ...formData, organizationName: e.target.value })
                }
                onFocus={() => setFocusedField("org")}
                onBlur={() => setFocusedField(null)}
                style={inputStyle(focusedField === "org")}
              />
            </div>
          </div>

          {/* Email / Username */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label
              style={{
                fontSize: "11px",
                fontWeight: 800,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: focusedField === "username" ? "#15803d" : "#94a3b8",
              }}
            >
              {t("auth.emailAddress")}
            </label>
            <div style={{ position: "relative" }}>
              <div
                style={{
                  position: "absolute",
                  left: "16px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: focusedField === "username" ? "#15803d" : "#cbd5e1",
                  zIndex: 1,
                }}
              >
                <Mail size={18} />
              </div>
              <input
                type="email"
                placeholder="john@example.com"
                required
                value={formData.username}
                onChange={(e) =>
                  setFormData({ ...formData, username: e.target.value })
                }
                onFocus={() => setFocusedField("username")}
                onBlur={() => setFocusedField(null)}
                style={inputStyle(focusedField === "username")}
              />
            </div>
          </div>

          {/* Password */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label
              style={{
                fontSize: "11px",
                fontWeight: 800,
                letterSpacing: "0.15em",
                textTransform: "uppercase",
                color: focusedField === "password" ? "#15803d" : "#94a3b8",
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
                  zIndex: 1,
                }}
              >
                <Lock size={18} />
              </div>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                required
                value={formData.password}
                onChange={(e) =>
                  setFormData({ ...formData, password: e.target.value })
                }
                onFocus={() => setFocusedField("password")}
                onBlur={() => setFocusedField(null)}
                style={{
                  ...inputStyle(focusedField === "password"),
                  paddingRight: "52px",
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
                }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              marginTop: "0.75rem",
              width: "100%",
              height: "54px",
              backgroundColor: loading ? "#4ade80" : "#15803d",
              color: "#fff",
              fontSize: "0.875rem",
              fontWeight: 800,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              border: "none",
              borderRadius: "14px",
              cursor: loading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
              boxShadow: "0 4px 20px rgba(21,128,61,0.25)",
              transition: "all 0.2s ease",
            }}
          >
            {loading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                {t("auth.createAdmin")} <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "1.5rem" }}>
          <p
            style={{ fontSize: "0.875rem", color: "#64748b", fontWeight: 500 }}
          >
            {t("auth.alreadyHaveAccount")}{" "}
            <Link
              href="/login"
              style={{
                color: "#15803d",
                fontWeight: 700,
                textDecoration: "none",
              }}
            >
              {t("auth.login")}
            </Link>
          </p>
        </div>
      </div>

      {/* Footer */}
      <footer style={{ textAlign: "center", marginTop: "2rem", opacity: 0.5 }}>
        <p
          style={{
            fontSize: "10px",
            fontWeight: 800,
            color: "#64748b",
            letterSpacing: "0.2em",
            textTransform: "uppercase",
          }}
        >
          &copy; 2026 {t("common.secureRegistration")}
        </p>
      </footer>
    </div>
  );
}

function inputStyle(isFocused: boolean): React.CSSProperties {
  return {
    width: "100%",
    height: "54px",
    paddingLeft: "48px",
    paddingRight: "16px",
    fontSize: "15px",
    fontWeight: 500,
    color: "#0f172a",
    backgroundColor: isFocused ? "#fff" : "#f8fafc",
    border: `2px solid ${isFocused ? "rgba(21,128,61,0.3)" : "#e2e8f0"}`,
    borderRadius: "14px",
    outline: "none",
    boxSizing: "border-box",
    transition: "all 0.2s ease",
    boxShadow: isFocused ? "0 0 0 4px rgba(21,128,61,0.05)" : "none",
  };
}
