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
  upiId?: string;
  logoBase64?: string;
  defaultPageSize: string;
  city?: string;
  enableStockRestriction: boolean;
  laborChargePerUnit: number;
}

export default function SettingsClient() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<BusinessConfigDto | null>(null);

  const [taxType, setTaxType] = useState<ChargeType>("PERCENTAGE");
  const [taxValue, setTaxValue] = useState<string>("0");
  const [serviceChargeType, setServiceChargeType] =
    useState<ChargeType>("PERCENTAGE");
  const [serviceChargeValue, setServiceChargeValue] = useState<string>("0");
  const [upiId, setUpiId] = useState<string>("");
  const [logoBase64, setLogoBase64] = useState<string>("");
  const [defaultPageSize, setDefaultPageSize] = useState<string>("A4");
  const [city, setCity] = useState<string>("");
  const [enableStockRestriction, setEnableStockRestriction] =
    useState<boolean>(false);
  const [laborChargePerUnit, setLaborChargePerUnit] = useState<string>("0");
  const [uploadingLogo, setUploadingLogo] = useState(false);

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
        setUpiId(data.upiId ?? "");
        setLogoBase64(data.logoBase64 ?? "");
        setDefaultPageSize(data.defaultPageSize ?? "A4");
        setCity(data.city ?? "");
        setEnableStockRestriction(data.enableStockRestriction ?? false);
        setLaborChargePerUnit(String(data.laborChargePerUnit ?? 0));
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
      upiId,
      defaultPageSize,
      city,
      enableStockRestriction,
      laborChargePerUnit: Number(laborChargePerUnit),
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

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingLogo(true);
    const formData = new FormData();
    formData.append("logo", file);

    try {
      const res = await fetch("/api/config/logo", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Logo upload failed");
      const data = await res.json();
      setLogoBase64(data.logoBase64);
      toast.success("Logo updated successfully");
    } catch (error: any) {
      console.error(error);
      toast.error("Failed to upload logo");
    } finally {
      setUploadingLogo(false);
    }
  };

  const title = t("settings.title") || "Business Settings";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
      {/* Header */}
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
            {title}
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
                backgroundColor: "var(--primary-main)",
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
              }}
            >
              {t("settings.subtitle") ||
                "Configure branding, payments, and tax details"}
            </p>
          </div>
        </div>
      </div>

      {/* Logo Section */}
      <div className="premium-card" style={{ padding: "2rem", maxWidth: 640 }}>
        <p
          style={{
            margin: "0 0 1rem",
            fontSize: "11px",
            fontWeight: 900,
            color: "var(--text-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.18em",
          }}
        >
          {t("settings.brandingSection") || "Business Branding"}
        </p>
        <div style={{ display: "flex", alignItems: "center", gap: "2rem" }}>
          <div
            style={{
              width: "120px",
              height: "120px",
              borderRadius: "16px",
              backgroundColor: "#f8fafc",
              border: "2px dashed var(--border-main)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              position: "relative",
            }}
          >
            {logoBase64 ? (
              <img
                src={logoBase64}
                alt="Logo"
                style={{ width: "100%", height: "100%", objectFit: "contain" }}
              />
            ) : (
              <span
                style={{
                  fontSize: "10px",
                  fontWeight: 800,
                  color: "#94a3b8",
                  textAlign: "center",
                  padding: "10px",
                }}
              >
                {t("settings.noLogo") || "No Logo"}
              </span>
            )}
            {uploadingLogo && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "rgba(255,255,255,0.8)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <div className="loader-small" />
              </div>
            )}
          </div>
          <div>
            <input
              type="file"
              id="logo-upload"
              accept="image/*"
              onChange={handleLogoUpload}
              style={{ display: "none" }}
            />
            <label
              htmlFor="logo-upload"
              style={{
                padding: "10px 20px",
                borderRadius: "12px",
                backgroundColor: "#f1f5f9",
                color: "#64748b",
                fontWeight: 800,
                fontSize: "13px",
                cursor: uploadingLogo ? "not-allowed" : "pointer",
              }}
            >
              {uploadingLogo
                ? t("settings.uploading") || "Uploading..."
                : t("settings.uploadLogo") || "Upload Logo"}
            </label>
            <p
              style={{
                marginTop: "12px",
                fontSize: "11px",
                color: "var(--text-muted)",
                fontWeight: 600,
              }}
            >
              {t("settings.logoHint") ||
                "Recommended: Square image, max 2MB. Stored as optimized WebP."}
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="premium-card" style={{ padding: "2rem", maxWidth: 640 }}>
        {loading ? (
          <div
            style={{
              height: "160px",
              animation: "pulse 1.5s ease-in-out infinite",
              opacity: 0.6,
            }}
          />
        ) : (
          <form
            onSubmit={handleSave}
            style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
          >
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
                    <option value="PERCENTAGE">
                      {t("settings.percentage") || "Percentage (%)"}
                    </option>
                    <option value="FIXED">
                      {t("settings.fixed") || "Fixed Amount (₹)"}
                    </option>
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
                    onKeyDown={(e) =>
                      ["e", "E", "+", "-"].includes(e.key) && e.preventDefault()
                    }
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
                    onChange={(e) =>
                      setServiceChargeType(e.target.value as ChargeType)
                    }
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
                    <option value="PERCENTAGE">
                      {t("settings.percentage") || "Percentage (%)"}
                    </option>
                    <option value="FIXED">
                      {t("settings.fixed") || "Fixed Amount (₹)"}
                    </option>
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
                    onKeyDown={(e) =>
                      ["e", "E", "+", "-"].includes(e.key) && e.preventDefault()
                    }
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

            {/* Labor Charge Section */}
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
                {t("settings.laborSection") || "Labor Charges"}
              </p>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr",
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
                    {t("settings.laborPerUnit") || "Labor Charge Per Unit (₹)"}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    value={laborChargePerUnit}
                    onChange={(e) => setLaborChargePerUnit(e.target.value)}
                    onKeyDown={(e) =>
                      ["e", "E", "+", "-"].includes(e.key) && e.preventDefault()
                    }
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
                  <p
                    style={{
                      marginTop: "8px",
                      fontSize: "11px",
                      color: "var(--text-muted)",
                      fontWeight: 600,
                    }}
                  >
                    {t("settings.laborHint") ||
                      "If set to a value > 0, labor charges in purchase bills will be automatically calculated based on total units."}
                  </p>
                </div>
              </div>
            </div>

            {/* Payments Section */}
            <div
              style={{ borderTop: "1px solid #f1f5f9", paddingTop: "1.5rem" }}
            >
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
                {t("settings.paymentSection") || "Payment Settings"}
              </p>
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
                  {t("settings.upiIdLabel") ||
                    "UPI ID (VPA) for Customer Payments"}
                </label>
                <input
                  type="text"
                  placeholder={t("settings.upiIdPlaceholder") || "yourname@upi"}
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
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
                <p
                  style={{
                    marginTop: "8px",
                    fontSize: "11px",
                    color: "var(--text-muted)",
                    fontWeight: 600,
                  }}
                >
                  {t("settings.upiIdHint") ||
                    "Used to generate dynamic QR codes on sale bills."}
                </p>
              </div>
            </div>

            {/* Print Section */}
            <div
              style={{ borderTop: "1px solid #f1f5f9", paddingTop: "1.5rem" }}
            >
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
                {t("settings.printSection") || "Printing Defaults"}
              </p>
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
                  {t("settings.pageSizeLabel") || "Default Page Size"}
                </label>
                <select
                  value={defaultPageSize}
                  onChange={(e) => setDefaultPageSize(e.target.value)}
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
                  <option value="A4">
                    {t("settings.a4") || "A4 (Standard Office)"}
                  </option>
                  <option value="A5">
                    {t("settings.a5") || "A5 (Half Page)"}
                  </option>
                  <option value="LEGAL">
                    {t("settings.legal") || "Legal (Traditional Long)"}
                  </option>
                  <option value="FOLIO">
                    {t("settings.folio") || "Folio/F4 (Register Style)"}
                  </option>
                </select>
              </div>
              <div style={{ marginTop: "1rem" }}>
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
                  {t("settings.cityLabel") || "Jurisdiction City"}
                </label>
                <input
                  type="text"
                  placeholder={t("settings.cityPlaceholder") || "e.g. Latur"}
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
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
                <p
                  style={{
                    marginTop: "8px",
                    fontSize: "11px",
                    color: "var(--text-muted)",
                    fontWeight: 600,
                  }}
                >
                  {t("settings.cityHint") ||
                    "This city will be used in the 'Subject to Jurisdiction' text on bills."}
                </p>
              </div>
            </div>

            {/* Inventory Section */}
            <div
              style={{ borderTop: "1px solid #f1f5f9", paddingTop: "1.5rem" }}
            >
              <p
                style={{
                  margin: "0 0 1rem",
                  fontSize: "11px",
                  fontWeight: 900,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.18em",
                }}
              >
                {t("settings.inventorySection") || "Inventory Settings"}
              </p>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "1rem",
                  backgroundColor: "#f8fafc",
                  borderRadius: "16px",
                  border: "1.5px solid var(--border-main)",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                  }}
                >
                  <span
                    style={{
                      fontSize: "14px",
                      fontWeight: 800,
                      color: "var(--text-main)",
                    }}
                  >
                    {t("settings.stockRestrictionLabel") ||
                      "Enable Stock Restriction"}
                  </span>
                  <span
                    style={{
                      fontSize: "11px",
                      color: "var(--text-muted)",
                      fontWeight: 600,
                    }}
                  >
                    {t("settings.stockRestrictionHint") ||
                      "If enabled, sale bills cannot exceed available stock."}
                  </span>
                </div>
                <div
                  onClick={() =>
                    setEnableStockRestriction(!enableStockRestriction)
                  }
                  style={{
                    width: "52px",
                    height: "28px",
                    borderRadius: "14px",
                    backgroundColor: enableStockRestriction
                      ? "var(--primary-main)"
                      : "#e2e8f0",
                    position: "relative",
                    cursor: "pointer",
                    transition: "background-color 0.2s",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: "2px",
                      left: enableStockRestriction ? "26px" : "2px",
                      width: "24px",
                      height: "24px",
                      borderRadius: "50%",
                      backgroundColor: "#fff",
                      boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                      transition: "left 0.2s cubic-bezier(0.16, 1, 0.3, 1)",
                    }}
                  />
                </div>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "0.75rem",
                marginTop: "0.5rem",
              }}
            >
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
                {saving
                  ? t("common.saving") || "Saving..."
                  : t("common.save") || "Save Changes"}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Preview Section */}
      {!loading && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "1rem",
            maxWidth: 640,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                height: "3px",
                width: "16px",
                backgroundColor: "#94a3b8",
                borderRadius: "2px",
              }}
            />
            <p
              style={{
                margin: 0,
                fontSize: "10px",
                fontWeight: 900,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.2em",
              }}
            >
              {t("settings.preview") || "Calculation Preview"}
            </p>
          </div>

          <div
            className="premium-card"
            style={{
              padding: "1.5rem",
              backgroundColor: "#f8fafc",
              border: "1.5px dashed var(--border-main)",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "0.75rem",
              }}
            >
              <span
                style={{ fontSize: "12px", fontWeight: 700, color: "#64748b" }}
              >
                Sample Subtotal
              </span>
              <span
                style={{ fontSize: "13px", fontWeight: 900, color: "#1e293b" }}
              >
                ₹ 1,000.00
              </span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "0.75rem",
              }}
            >
              <span
                style={{ fontSize: "12px", fontWeight: 700, color: "#64748b" }}
              >
                {t("settings.taxSection") || "Tax"} (
                {taxType === "PERCENTAGE"
                  ? `${taxValue || 0}%`
                  : `₹${taxValue || 0}`}
                )
              </span>
              <span
                style={{ fontSize: "13px", fontWeight: 900, color: "#1e293b" }}
              >
                ₹{" "}
                {(taxType === "PERCENTAGE"
                  ? 1000 * (Number(taxValue) / 100)
                  : Number(taxValue)
                ).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "1rem",
              }}
            >
              <span
                style={{ fontSize: "12px", fontWeight: 700, color: "#64748b" }}
              >
                {t("settings.serviceSection") || "Service Charge"} (
                {serviceChargeType === "PERCENTAGE"
                  ? `${serviceChargeValue || 0}%`
                  : `₹${serviceChargeValue || 0}`}
                )
              </span>
              <span
                style={{ fontSize: "13px", fontWeight: 900, color: "#1e293b" }}
              >
                ₹{" "}
                {(serviceChargeType === "PERCENTAGE"
                  ? 1000 * (Number(serviceChargeValue) / 100)
                  : Number(serviceChargeValue)
                ).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>
            <div
              style={{
                height: "1px",
                backgroundColor: "var(--border-main)",
                marginBottom: "1rem",
              }}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 900,
                  color: "var(--text-main)",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                }}
              >
                Total Balance Impact
              </span>
              <span
                style={{
                  fontSize: "18px",
                  fontWeight: 950,
                  color: "var(--primary-main)",
                }}
              >
                ₹{" "}
                {(
                  1000 +
                  (taxType === "PERCENTAGE"
                    ? 1000 * (Number(taxValue) / 100)
                    : Number(taxValue)) +
                  (serviceChargeType === "PERCENTAGE"
                    ? 1000 * (Number(serviceChargeValue) / 100)
                    : Number(serviceChargeValue))
                ).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
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
