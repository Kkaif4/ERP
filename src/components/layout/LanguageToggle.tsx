"use client";

import { useTranslation } from "@/lib/i18n";
import { useState, useRef, useEffect } from "react";
import { Globe, X } from "lucide-react";

export function LanguageToggle() {
    const { language, setLanguage } = useTranslation();
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const languages = [
        { code: "en", name: "English", short: "EN" },
        { code: "hi", name: "हिन्दी", short: "हि" },
        { code: "mr", name: "मराठी", short: "म" },
    ] as const;

    const currentShort = languages.find(l => l.code === language)?.short || "EN";

    return (
        <div
            ref={containerRef}
            className="hidden lg:flex no-print"
            style={{
                position: "fixed",
                bottom: "24px",
                right: "24px",
                zIndex: 9999,
            }}
        >
            {/* Button wrapper — this is the relative anchor */}
            <div style={{ position: "relative", width: "56px", height: "56px" }}>

                {/* Dropdown — positioned upward & to the left from the button */}
                <div
                    style={{
                        position: "absolute",
                        bottom: "64px",
                        right: "0",
                        width: "180px",
                        padding: "12px",
                        backgroundColor: "#fff",
                        border: "1px solid #e5e7eb",
                        borderRadius: "16px",
                        boxShadow: "0 20px 50px rgba(0,0,0,0.12)",
                        transition: "all 0.3s ease",
                        transformOrigin: "bottom right",
                        opacity: isOpen ? 1 : 0,
                        transform: isOpen ? "translateY(0) scale(1)" : "translateY(8px) scale(0.95)",
                        pointerEvents: isOpen ? "auto" : "none",
                    }}
                >
                    {languages.map((lang, i) => (
                        <button
                            key={lang.code}
                            onClick={() => {
                                setLanguage(lang.code);
                                setIsOpen(false);
                            }}
                            style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                width: "100%",
                                padding: "12px 16px",
                                marginBottom: i < languages.length - 1 ? "6px" : "0",
                                borderRadius: "12px",
                                fontSize: "15px",
                                fontWeight: 500,
                                cursor: "pointer",
                                transition: "all 0.2s ease",
                                border: language === lang.code ? "1px solid transparent" : "1px solid #e5e7eb",
                                backgroundColor: language === lang.code ? "#059669" : "#fff",
                                color: language === lang.code ? "#fff" : "#475569",
                                boxShadow: language === lang.code ? "0 4px 12px rgba(5,150,105,0.25)" : "none",
                                outline: "none",
                            }}
                        >
                            <span>{lang.name}</span>
                            <span
                                style={{
                                    fontSize: "10px",
                                    fontWeight: 800,
                                    width: "24px",
                                    height: "24px",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    borderRadius: "6px",
                                    backgroundColor: language === lang.code ? "rgba(255,255,255,0.2)" : "#f1f5f9",
                                    color: language === lang.code ? "#fff" : "#94a3b8",
                                }}
                            >
                                {lang.short}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Circle Button */}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    style={{
                        width: "56px",
                        height: "56px",
                        borderRadius: "50%",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "none",
                        cursor: "pointer",
                        transition: "all 0.3s ease",
                        backgroundColor: isOpen ? "#1e293b" : "#059669",
                        boxShadow: isOpen
                            ? "0 10px 25px rgba(0,0,0,0.2)"
                            : "0 10px 30px rgba(5,150,105,0.3)",
                        outline: "none",
                    }}
                >
                    {isOpen ? (
                        <X size={22} color="#fff" />
                    ) : (
                        <>
                            <Globe size={16} color="rgba(255,255,255,0.5)" />
                            <span style={{ fontSize: "11px", fontWeight: 900, color: "#fff", lineHeight: 1, marginTop: "2px" }}>
                                {currentShort}
                            </span>
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}
