"use client";

import React, { useEffect, useState } from "react";
import { X } from "lucide-react";

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    icon?: React.ReactNode;
    maxWidth?: string;
}

const CRIMSON = "#e11d48";
const CRIMSON_BG = "rgba(225, 29, 72, 0.05)";

export const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    title,
    subtitle,
    children,
    icon,
    maxWidth = "580px",
}) => {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "unset";
        }
        return () => {
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    if (!mounted || !isOpen) return null;

    return (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
            <div className="modal-content premium-modal" style={{ maxWidth }}>
                <div className="modal-header">
                    <div className="title-section">
                        {icon && (
                            <div className="icon-badge">
                                {icon}
                            </div>
                        )}
                        <div>
                            <h2 className="modal-title">{title}</h2>
                            {subtitle && <p className="modal-subtitle">{subtitle}</p>}
                        </div>
                    </div>
                    <button onClick={onClose} className="close-btn-round">
                        <X size={20} />
                    </button>
                </div>

                <div className="modal-body">
                    {children}
                </div>
            </div>

            <style jsx>{`
                .modal-overlay {
                    position: fixed;
                    inset: 0;
                    background: rgba(15, 23, 42, 0.4);
                    backdrop-filter: blur(8px);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 1000;
                    animation: fadeIn 0.3s ease-out;
                    padding: 1rem;
                }

                .premium-modal {
                    background: #fff;
                    border-radius: 24px;
                    width: 100%;
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
                    overflow: hidden;
                    animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                    position: relative;
                }

                .modal-header {
                    padding: 24px 32px;
                    background: linear-gradient(to bottom, #f8fafc, #fff);
                    border-bottom: 1px solid #f1f5f9;
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                }

                .title-section {
                    display: flex;
                    gap: 16px;
                    align-items: center;
                }

                .icon-badge {
                    width: 48px;
                    height: 48px;
                    background: ${CRIMSON_BG};
                    color: ${CRIMSON};
                    border-radius: 14px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .modal-title {
                    font-size: 1.25rem;
                    font-weight: 900;
                    color: #0f172a;
                    margin: 0;
                    letter-spacing: -0.02em;
                }

                .modal-subtitle {
                    margin: 2px 0 0;
                    font-size: 13px;
                    color: #64748b;
                    font-weight: 600;
                }

                .close-btn-round {
                    width: 32px;
                    height: 32px;
                    border-radius: 50%;
                    border: none;
                    background: #f1f5f9;
                    color: #64748b;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .close-btn-round:hover {
                    background: #e2e8f0;
                    color: #0f172a;
                    transform: rotate(90deg);
                }

                .modal-body {
                    padding: 32px;
                }

                @keyframes fadeIn {
                    from { opacity: 0; }
                    to { opacity: 1; }
                }

                @keyframes slideUp {
                    from { opacity: 0; transform: translateY(20px) scale(0.98); }
                    to { opacity: 1; transform: translateY(0) scale(1); }
                }

                @media (max-width: 640px) {
                    .premium-modal { 
                        border-radius: 20px 20px 0 0; 
                        position: fixed; 
                        bottom: 0; 
                        top: auto; 
                        margin-bottom: 0;
                    }
                    .modal-overlay {
                        align-items: flex-end;
                        padding: 0;
                    }
                }
            `}</style>
        </div>
    );
};
