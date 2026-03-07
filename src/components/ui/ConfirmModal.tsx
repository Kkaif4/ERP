"use client";

import React from "react";
import { Modal } from "./Modal";
import { Button } from "./Button";
import { AlertTriangle, CheckCircle2, Info, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  loading?: boolean;
  variant?: "primary" | "danger" | "success" | "info";
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  loading = false,
  variant = "primary",
}) => {
  const getIcon = () => {
    switch (variant) {
      case "danger":
        return <AlertTriangle size={24} className="text-red-600" />;
      case "success":
        return <CheckCircle2 size={24} className="text-emerald-600" />;
      case "info":
        return <Info size={24} className="text-blue-600" />;
      default:
        return <AlertTriangle size={24} className="text-emerald-600" />;
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case "danger":
        return {
          bg: "rgba(225, 29, 72, 0.1)",
          color: "#e11d48",
          btn: "danger" as const,
        };
      case "success":
        return {
          bg: "rgba(16, 185, 129, 0.1)",
          color: "#10b981",
          btn: "primary" as const,
        };
      case "info":
        return {
          bg: "rgba(59, 130, 246, 0.1)",
          color: "#3b82f6",
          btn: "primary" as const, // We don't have an 'info' button variant, primary works
        };
      default:
        return {
          bg: "rgba(16, 185, 129, 0.1)",
          color: "#10b981",
          btn: "primary" as const,
        };
    }
  };

  const styles = getVariantStyles();

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      maxWidth="480px"
      icon={
        <div
          style={{
            width: "48px",
            height: "48px",
            backgroundColor: styles.bg,
            borderRadius: "14px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: styles.color,
          }}
        >
          {getIcon()}
        </div>
      }
    >
      <div className="space-y-6">
        <p className="text-sm font-medium leading-relaxed text-slate-500">
          {message}
        </p>

        <div className="flex items-center justify-end gap-3 mt-8">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={loading}
            className="font-bold px-6"
          >
            {cancelText}
          </Button>
          <Button
            variant={styles.btn}
            onClick={onConfirm}
            loading={loading}
            className={cn(
              "font-black px-8",
              variant === "primary" &&
                "shadow-[0_8px_20px_rgba(21,128,61,0.2)]",
            )}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};
