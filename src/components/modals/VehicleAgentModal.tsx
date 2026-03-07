"use client";

import { useState } from "react";
import { useTranslation } from "@/lib/i18n";
import { Truck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { vehicleAgentSchema } from "@/lib/schemas";
import { Modal } from "@/components/ui/Modal";

interface VehicleAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (agent: any) => void;
}

export function VehicleAgentModal({
  isOpen,
  onClose,
  onSuccess,
}: VehicleAgentModalProps) {
  const { t } = useTranslation();
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    vehicleNumber: "",
  });

  const accentColor = "#15803d"; // Same as farmer

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = vehicleAgentSchema.safeParse(formData);
    if (!result.success) {
      toast.error(result.error.issues[0].message);
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/vehicle-agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        const result = await res.json();
        toast.success("Vehicle agent created successfully");
        setFormData({ name: "", vehicleNumber: "" });
        onSuccess?.(result);
        onClose();
      } else {
        const result = await res.json();
        toast.error(result.error || "Failed to create vehicle agent");
      }
    } catch {
      toast.error("Failed to create vehicle agent");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => !submitting && onClose()}
      title="Add New Vehicle Agent"
      icon={<Truck size={20} />}
      maxWidth="480px"
    >
      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}
      >
        <div>
          <p
            style={{
              margin: "0 0 8px",
              fontSize: "10px",
              fontWeight: 900,
              color: "#94a3b8",
              textTransform: "uppercase",
              letterSpacing: "0.15em",
            }}
          >
            Agent Name *
          </p>
          <input
            required
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Enter agent name"
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "12px 16px",
              backgroundColor: "#f8fafc",
              border: "1.5px solid var(--border-main)",
              borderRadius: "12px",
              fontSize: "15px",
              fontWeight: 700,
              color: "var(--text-main)",
              outline: "none",
              transition: "all 0.2s",
            }}
            onFocusCapture={(e) => {
              e.currentTarget.style.borderColor = accentColor;
              e.currentTarget.style.backgroundColor = "#fff";
            }}
            onBlurCapture={(e) => {
              e.currentTarget.style.borderColor = "var(--border-main)";
              e.currentTarget.style.backgroundColor = "#f8fafc";
            }}
          />
        </div>

        <div>
          <p
            style={{
              margin: "0 0 8px",
              fontSize: "10px",
              fontWeight: 900,
              color: "#94a3b8",
              textTransform: "uppercase",
              letterSpacing: "0.15em",
            }}
          >
            Vehicle Number (Optional)
          </p>
          <input
            type="text"
            value={formData.vehicleNumber}
            onChange={(e) =>
              setFormData({ ...formData, vehicleNumber: e.target.value })
            }
            placeholder="e.g. MH-12-AB-1234"
            style={{
              width: "100%",
              boxSizing: "border-box",
              padding: "12px 16px",
              backgroundColor: "#f8fafc",
              border: "1.5px solid var(--border-main)",
              borderRadius: "12px",
              fontSize: "15px",
              fontWeight: 700,
              color: "var(--text-main)",
              outline: "none",
              transition: "all 0.2s",
            }}
            onFocusCapture={(e) => {
              e.currentTarget.style.borderColor = accentColor;
              e.currentTarget.style.backgroundColor = "#fff";
            }}
            onBlurCapture={(e) => {
              e.currentTarget.style.borderColor = "var(--border-main)";
              e.currentTarget.style.backgroundColor = "#f8fafc";
            }}
          />
        </div>

        <div style={{ display: "flex", gap: "0.75rem", paddingTop: "0.5rem" }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              flex: 1,
              padding: "12px",
              border: "none",
              backgroundColor: "#f1f5f9",
              borderRadius: "12px",
              fontWeight: 800,
              fontSize: "13px",
              color: "#64748b",
              cursor: "pointer",
              transition: "all 0.2s",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.backgroundColor = "#e2e8f0")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.backgroundColor = "#f1f5f9")
            }
          >
            {t("master.actions.cancel")}
          </button>
          <button
            disabled={submitting}
            type="submit"
            style={{
              flex: 2,
              padding: "12px",
              border: "none",
              backgroundColor: accentColor,
              borderRadius: "12px",
              fontWeight: 900,
              fontSize: "13px",
              color: "#fff",
              cursor: submitting ? "not-allowed" : "pointer",
              boxShadow: "0 8px 16px rgba(21,128,61,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "8px",
              transition: "all 0.2s",
              opacity: submitting ? 0.7 : 1,
            }}
          >
            {submitting ? (
              <Loader2
                size={18}
                style={{ animation: "spin 0.6s linear infinite" } as any}
              />
            ) : (
              t("master.actions.save")
            )}
          </button>
        </div>
      </form>
      <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
            `}</style>
    </Modal>
  );
}
