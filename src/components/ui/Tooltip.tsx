"use client";

import React, { useState } from "react";

interface TooltipProps {
    content: string;
    children: React.ReactNode;
}

export default function Tooltip({ content, children }: TooltipProps) {
    const [isVisible, setIsVisible] = useState(false);

    return (
        <span
            style={{
                position: "relative",
                display: "inline-flex",
                alignItems: "center",
            }}
            onMouseEnter={() => setIsVisible(true)}
            onMouseLeave={() => setIsVisible(false)}
        >
            {children}
            {isVisible && (
                <div
                    style={{
                        position: "absolute",
                        bottom: "100%",
                        left: "50%",
                        transform: "translateX(-50%)",
                        marginBottom: "8px",
                        padding: "8px 12px",
                        backgroundColor: "#1e293b",
                        color: "#fff",
                        fontSize: "12px",
                        fontWeight: 600,
                        borderRadius: "8px",
                        whiteSpace: "pre-wrap",
                        width: "max-content",
                        maxWidth: "240px",
                        zIndex: 1000,
                        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                        animation: "fadeIn 0.2s ease-out",
                    }}
                >
                    {content}
                    <div
                        style={{
                            position: "absolute",
                            top: "100%",
                            left: "50%",
                            transform: "translateX(-50%)",
                            borderWidth: "5px",
                            borderStyle: "solid",
                            borderColor: "#1e293b transparent transparent transparent",
                        }}
                    />
                </div>
            )}
            <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translate(-50%, 4px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }
      `}</style>
        </span>
    );
}
