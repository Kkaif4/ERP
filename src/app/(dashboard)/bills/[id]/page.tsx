"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
    Printer,
    Download,
    ArrowLeft,
    FileText,
    User,
    Calendar,
    Hash,
    Loader2,
    CheckCircle2,
    Building2,
    Phone,
    MapPin
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import Link from "next/link";
import { toast } from "sonner";

export default function BillDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const { t } = useTranslation();
    const [bill, setBill] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBill = async () => {
            try {
                const res = await fetch(`/api/bills/${id}`);
                if (!res.ok) throw new Error("Failed to fetch bill");
                const data = await res.json();
                setBill(data);
            } catch (error) {
                console.error("Error:", error);
                toast.error("Failed to load bill details");
                router.push("/bills");
            } finally {
                setLoading(false);
            }
        };
        fetchBill();
    }, [id, router]);

    const handlePrint = () => {
        window.print();
    };

    if (loading) {
        return (
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "60vh" }}>
                <Loader2 className="animate-spin" size={32} color="var(--primary-main)" />
            </div>
        );
    }

    if (!bill) return null;

    const isPurchase = bill.type === "PURCHASE";
    const partyLabel = isPurchase ? "Farmer" : "Customer";
    const partyData = isPurchase ? bill.farmer : bill.customer;

    return (
        <div className="bill-view-container">
            {/* --- Action Header (Hidden during print) --- */}
            <div className="no-print" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
                <Link
                    href="/bills"
                    style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "8px",
                        color: "var(--text-muted)",
                        fontSize: "13px",
                        fontWeight: 800,
                        textDecoration: "none",
                        textTransform: "uppercase",
                        letterSpacing: "0.1em"
                    }}
                >
                    <ArrowLeft size={16} />
                    Back to History
                </Link>
                <div style={{ display: "flex", gap: "10px" }}>
                    <button
                        onClick={handlePrint}
                        className="print-btn"
                        style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "10px 20px",
                            backgroundColor: "var(--primary-main)",
                            color: "#fff",
                            borderRadius: "12px",
                            border: "none",
                            fontWeight: 800,
                            fontSize: "13px",
                            cursor: "pointer",
                            boxShadow: "0 10px 15px -3px rgba(21,128,61,0.2)"
                        }}
                    >
                        <Printer size={18} /> Print Bill
                    </button>
                </div>
            </div>

            {/* --- THE BILL DOCUMENT --- */}
            <div className="bill-document premium-card">

                {/* --- Business Header --- */}
                <div className="bill-header">
                    <div className="business-info">
                        <h1 className="business-name">{bill.organization.name}</h1>
                        {bill.organization.address && (
                            <div className="info-item">
                                <MapPin size={14} />
                                <span>{bill.organization.address}</span>
                            </div>
                        )}
                        {bill.organization.phone && (
                            <div className="info-item">
                                <Phone size={14} />
                                <span>+91 {bill.organization.phone}</span>
                            </div>
                        )}
                    </div>
                    <div className="bill-type-badge">
                        <div className="type-label">{isPurchase ? "PURCHASE BILL" : "SALE BILL"}</div>
                        <div className="bill-id">#{bill.billNumber}</div>
                    </div>
                </div>

                <div className="divider" />

                {/* --- Party & Bill Metadata --- */}
                <div className="metadata-grid">
                    <div className="party-section">
                        <p className="section-title">{partyLabel} Details</p>
                        <h2 className="party-name">{partyData?.name}</h2>
                        <div className="info-item">
                            <Phone size={14} />
                            <span>{partyData?.mobile}</span>
                        </div>
                        {partyData?.address && (
                            <div className="info-item">
                                <MapPin size={14} />
                                <span>{partyData?.address}</span>
                            </div>
                        )}
                    </div>
                    <div className="bill-section">
                        <p className="section-title">Bill Information</p>
                        <div className="metadata-row">
                            <Calendar size={14} />
                            <span><strong>Date:</strong> {new Date(bill.billDate).toLocaleDateString("en-IN", { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                        </div>
                        <div className="metadata-row">
                            <Hash size={14} />
                            <span><strong>Ref #:</strong> {bill.billNumber}</span>
                        </div>
                        <div className="metadata-row">
                            <User size={14} />
                            <span><strong>Recorded By:</strong> {bill.createdBy.name}</span>
                        </div>
                    </div>
                </div>

                {/* --- Line Items Table --- */}
                <div className="items-container">
                    <table className="items-table">
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Item Description</th>
                                <th className="text-right">Qty (Units)</th>
                                <th className="text-right">Qty (KG)</th>
                                <th className="text-right">Price</th>
                                <th className="text-right">Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            {bill.items.map((item: any, idx: number) => (
                                <tr key={item.id}>
                                    <td>{idx + 1}</td>
                                    <td>
                                        <div className="item-name">{item.item.name}</div>
                                        <div className="item-mode">{item.pricingMode.replace('_', ' ')}</div>
                                    </td>
                                    <td className="text-right">{Number(item.quantityUnits).toFixed(2)}</td>
                                    <td className="text-right">{Number(item.quantityKg).toFixed(2)}</td>
                                    <td className="text-right">₹ {Number(item.pricePerUnit).toLocaleString("en-IN")}</td>
                                    <td className="text-right font-bold">₹ {Number(item.total).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* --- Summary Section --- */}
                <div className="summary-section">
                    <div className="summary-left">
                        <div className="status-indicator">
                            <CheckCircle2 size={16} />
                            <span>Payment Status: Partially Paid</span>
                        </div>
                        <div className="terms-box">
                            <p><strong>Terms:</strong> This is a computer generated bill. No signature required.</p>
                        </div>
                    </div>
                    <div className="summary-right">
                        <div className="summary-row">
                            <span>Subtotal</span>
                            <span>₹ {Number(bill.subtotal).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                        </div>
                        {Number(bill.labourCharges) > 0 && (
                            <div className="summary-row">
                                <span>Labour Charges</span>
                                <span>₹ {Number(bill.labourCharges).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                            </div>
                        )}
                        {Number(bill.freightCharges) > 0 && (
                            <div className="summary-row">
                                <span>Freight Charges</span>
                                <span>₹ {Number(bill.freightCharges).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                            </div>
                        )}
                        {Number(bill.taxAmount) > 0 && (
                            <div className="summary-row">
                                <span>Tax</span>
                                <span>₹ {Number(bill.taxAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                            </div>
                        )}
                        <div className="summary-row total">
                            <span>Net Total</span>
                            <span>₹ {Number(bill.netTotal).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</span>
                        </div>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .bill-view-container {
                    padding-bottom: 4rem;
                    animation: fadeIn 0.4s ease-out;
                }

                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }

                .bill-document {
                    background-color: #fff;
                    padding: 3rem;
                    border-radius: 24px;
                    border: 1px solid var(--border-main);
                    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.05);
                }

                .bill-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-start;
                    margin-bottom: 2rem;
                }

                .business-name {
                    font-size: 2.5rem;
                    font-weight: 900;
                    color: var(--text-main);
                    margin: 0 0 1rem;
                    letter-spacing: -0.03em;
                }

                .info-item {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    color: var(--text-muted);
                    font-size: 14px;
                    font-weight: 600;
                    margin-bottom: 4px;
                }

                .bill-type-badge {
                    text-align: right;
                    background: var(--primary-main);
                    color: #fff;
                    padding: 1.5rem 2.5rem;
                    border-radius: 16px;
                }

                .type-label {
                    font-size: 11px;
                    font-weight: 900;
                    letter-spacing: 0.2em;
                    opacity: 0.8;
                }

                .bill-id {
                    font-size: 1.5rem;
                    font-weight: 900;
                    margin-top: 4px;
                }

                .divider {
                    height: 1px;
                    background: #f1f5f9;
                    margin: 2.5rem 0;
                }

                .metadata-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 4rem;
                    margin-bottom: 3rem;
                }

                .section-title {
                    font-size: 10px;
                    font-weight: 900;
                    color: var(--text-muted);
                    text-transform: uppercase;
                    letter-spacing: 0.2em;
                    margin-bottom: 1.25rem;
                }

                .party-name {
                    font-size: 1.75rem;
                    font-weight: 900;
                    color: var(--text-main);
                    margin: 0 0 1rem;
                    letter-spacing: -0.01em;
                }

                .metadata-row {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    margin-bottom: 12px;
                    color: var(--text-main);
                    font-size: 14px;
                }

                .items-table {
                    width: 100%;
                    border-collapse: collapse;
                    margin-bottom: 3rem;
                }

                .items-table th {
                    text-align: left;
                    padding: 1rem 1.5rem;
                    font-size: 11px;
                    font-weight: 900;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                    color: var(--text-muted);
                    border-bottom: 2px solid #f1f5f9;
                }

                .items-table td {
                    padding: 1.25rem 1.5rem;
                    border-bottom: 1px solid #f1f5f9;
                    font-size: 14px;
                    color: var(--text-main);
                }

                .item-name {
                    font-weight: 800;
                }

                .item-mode {
                    font-size: 10px;
                    font-weight: 800;
                    color: var(--text-muted);
                    text-transform: uppercase;
                    margin-top: 2px;
                }

                .summary-section {
                    display: grid;
                    grid-template-columns: 1fr 340px;
                    gap: 4rem;
                }

                .status-indicator {
                    display: inline-flex;
                    align-items: center;
                    gap: 8px;
                    padding: 8px 16px;
                    background-color: #f0fdf4;
                    color: #15803d;
                    border-radius: 99px;
                    font-size: 12px;
                    font-weight: 800;
                    margin-bottom: 1.5rem;
                }

                .terms-box {
                    background: #f8fafc;
                    padding: 1.5rem;
                    border-radius: 12px;
                    font-size: 12px;
                    color: var(--text-muted);
                    line-height: 1.6;
                }

                .summary-row {
                    display: flex;
                    justify-content: space-between;
                    padding: 10px 0;
                    font-size: 14px;
                    font-weight: 700;
                    color: var(--text-muted);
                }

                .summary-row.total {
                    margin-top: 1rem;
                    padding-top: 1.5rem;
                    border-top: 2px solid #f1f5f9;
                    font-size: 1.5rem;
                    font-weight: 900;
                    color: var(--text-main);
                }

                .text-right { text-align: right !important; }
                .font-bold { font-weight: 900 !important; }

                @media print {
                    .no-print { display: none !important; }
                    .bill-document { 
                        box-shadow: none !important; 
                        border: none !important; 
                        padding: 0 !important;
                        margin: 0 !important;
                    }
                    body { background: white !important; }
                }
            `}</style>
        </div>
    );
}
