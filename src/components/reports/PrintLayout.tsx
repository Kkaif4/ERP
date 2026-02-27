"use client";

import React from "react";

/**
 * Common wrapper for print documents.
 * Encapsulates styles and base structure to ensure consistency across reports.
 */
export const PrintLayout: React.FC<{
    title: string;
    children: React.ReactNode;
}> = ({ title, children }) => {
    return (
        <div className="print-container">
            <style>{`
                @page {
                    margin: 1.5cm;
                    size: A4;
                }
                body {
                    font-family: 'Inter', -apple-system, sans-serif;
                    color: #1a1a1a;
                    line-height: 1.5;
                    margin: 0;
                    padding: 0;
                    -webkit-print-color-adjust: exact;
                }
                .print-container {
                    padding: 40px;
                    max-width: 1000px;
                    margin: 0 auto;
                }
                .report-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 30px;
                    border-bottom: 2px solid #15803d;
                    padding-bottom: 15px;
                }
                .brand {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                .logo-placeholder {
                    width: 40px;
                    height: 40px;
                    background-color: #15803d;
                    border-radius: 8px;
                }
                .brand-name {
                    font-size: 20px;
                    font-weight: 900;
                    color: #15803d;
                    margin: 0;
                }
                .report-title-section {
                    text-align: right;
                }
                .report-title-section h1 {
                    margin: 0;
                    font-size: 24px;
                    font-weight: 800;
                    text-transform: uppercase;
                    letter-spacing: -0.02em;
                }
                .report-meta {
                    font-size: 12px;
                    color: #666;
                    margin-top: 5px;
                }
                .stats-grid {
                    display: grid;
                    grid-template-columns: repeat(2, 1fr);
                    gap: 20px;
                    margin-bottom: 30px;
                }
                .stat-box {
                    background: #f8fafc;
                    border: 1px solid #e2e8f0;
                    padding: 15px;
                    border-radius: 8px;
                }
                .stat-label {
                    font-size: 10px;
                    font-weight: 800;
                    color: #64748b;
                    text-transform: uppercase;
                    margin-bottom: 5px;
                }
                .stat-value {
                    font-size: 20px;
                    font-weight: 800;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-top: 20px;
                    font-size: 12px;
                }
                th {
                    background-color: #f1f5f9;
                    color: #475569;
                    text-align: left;
                    padding: 12px 10px;
                    border-bottom: 1px solid #cbd5e1;
                    font-weight: 800;
                    text-transform: uppercase;
                }
                td {
                    padding: 10px;
                    border-bottom: 1px solid #f1f5f9;
                    vertical-align: top;
                }
                .text-right { text-align: right; }
                .font-bold { font-weight: 700; }
                
                tr {
                    break-inside: avoid;
                    page-break-inside: avoid;
                }

                @media print {
                    .no-print { display: none !important; }
                    body { padding: 0; }
                    .print-container { padding: 0; margin: 0; max-width: none; }
                }
                
                .print-footer {
                    position: fixed;
                    bottom: 0;
                    width: 100%;
                    text-align: center;
                    font-size: 10px;
                    color: #94a3b8;
                    padding: 10px 0;
                    border-top: 1px solid #f1f5f9;
                    background: white;
                }
            `}</style>

            <div className="report-header">
                <div className="brand">
                    <div className="logo-placeholder"></div>
                    <div>
                        <p className="brand-name">Mandi ERP</p>
                        <p style={{ margin: 0, fontSize: "10px", color: "#666" }}>PREMIUM ENTERPRISE SOLUTION</p>
                    </div>
                </div>
                <div className="report-title-section">
                    <h1>{title}</h1>
                    <div className="report-meta">
                        Generated on: {new Date().toLocaleString()}
                    </div>
                </div>
            </div>

            <div className="report-content">
                {children}
            </div>

            <div className="print-footer">
                &copy; 2026 Mandi ERP. Internal and Confidential.
            </div>
        </div>
    );
};
