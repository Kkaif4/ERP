"use client";

import { useState, useEffect, useRef } from "react";
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
  MapPin,
  Smartphone,
  Scale,
  Layers,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import Link from "next/link";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import { DateTime } from "luxon";

type PageSize = "A4" | "A5" | "LEGAL" | "FOLIO";

export default function BillDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { t } = useTranslation();
  const [bill, setBill] = useState<any>(null);
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [pageSize, setPageSize] = useState<PageSize>("A4");
  const billRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchBillAndConfig = async () => {
      try {
        const [billRes, configRes] = await Promise.all([
          fetch(`/api/bills/${id}`),
          fetch("/api/config"),
        ]);

        if (!billRes.ok) throw new Error("Failed to fetch bill");
        const billData = await billRes.json();
        setBill(billData);

        if (configRes.ok) {
          const configData = await configRes.json();
          setConfig(configData);
          if (configData.defaultPageSize) {
            setPageSize(configData.defaultPageSize as PageSize);
          }
        }
      } catch (error) {
        console.error("Error:", error);
        toast.error("Failed to load bill details");
        router.push("/bills");
      } finally {
        setLoading(false);
      }
    };
    fetchBillAndConfig();
  }, [id, router]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "60vh",
        }}
      >
        <Loader2
          className="animate-spin"
          size={32}
          color="var(--primary-main)"
        />
      </div>
    );
  }

  if (!bill) return null;

  const isPurchase = bill.type === "PURCHASE";
  const partyLabel = isPurchase ? "Farmer" : "Customer";
  const partyData = isPurchase ? bill.farmer : bill.customer;
  const partyName = partyData?.name || "N/A";
  const partyMobile = partyData?.mobile || "";

  // UPI QR Construction: upi://pay?pa=VPA&pn=NAME&am=AMOUNT&cu=INR
  const upiString = config?.upiId
    ? `upi://pay?pa=${config.upiId}&pn=${encodeURIComponent(bill.organization.name)}&am=${bill.netTotal}&cu=INR`
    : "";

  const totals = bill.items.reduce(
    (acc: any, item: any) => ({
      units: acc.units + Number(item.quantityUnits),
      weight: acc.weight + Number(item.quantityKg),
      itemSubtotal: acc.itemSubtotal + Number(item.total),
    }),
    { units: 0, weight: 0, itemSubtotal: 0 },
  );

  const itemsSubtotal = totals.itemSubtotal;

  const totalExpenses = isPurchase
    ? Number(bill.labourCharges || 0) +
      Number(bill.freightCharges || 0) +
      Number(bill.advanceDeduction || 0) +
      Number(bill.othersAmount || 0)
    : 0;

  const totalUnits = totals.units.toFixed(1);
  const totalWeight = totals.weight;

  return (
    <div className={`bill-view-container page-${pageSize.toLowerCase()}`}>
      {/* --- Action Header (Hidden during print) --- */}
      <div
        className="no-print"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "2rem",
          padding: "12px 20px",
          background: "white",
          borderRadius: "16px",
          border: "1.5px solid var(--border-main)",
        }}
      >
        <button
          onClick={() => router.back()}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontWeight: 700,
            color: "var(--text-muted)",
            fontSize: "14px",
            marginRight: "16px",
          }}
        >
          <ArrowLeft size={18} /> {t("bills.details.back") || "Back to History"}
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span
              style={{
                fontSize: "12px",
                fontWeight: 800,
                color: "var(--text-muted)",
              }}
            >
              {t("bills.details.pageSize") || "Page Size"}:
            </span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(e.target.value as PageSize)}
              style={{
                padding: "8px 12px",
                borderRadius: "10px",
                border: "1.5px solid var(--border-main)",
                fontSize: "12px",
                fontWeight: 700,
                outline: "none",
                cursor: "pointer",
              }}
            >
              <option value="A4">A4</option>
              <option value="A5">A5</option>
              <option value="LEGAL">Legal</option>
              <option value="FOLIO">Folio</option>
            </select>
          </div>
          <button
            onClick={() => window.print()}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 20px",
              background: "black",
              color: "white",
              borderRadius: "12px",
              fontWeight: 700,
              fontSize: "14px",
            }}
          >
            <Printer size={18} /> {t("bills.details.print") || "Print Bill"}
          </button>
        </div>
      </div>

      {/* --- THE BILL DOCUMENT --- */}
      <div className="bill-document premium-card" ref={billRef}>
        {/* --- Business Header Section (Centered) --- */}
        <div className="bill-header">
          <div className="business-logo-container">
            {config?.logoBase64 && (
              <img
                src={config.logoBase64}
                alt="Business Logo"
                className="business-logo"
              />
            )}
          </div>
          <div className="business-info">
            <h1 className="business-name">{bill.organization.name}</h1>
            <p className="business-desc">
              Vegetable Commission Agent & Wholesaler
            </p>
            <div className="business-meta">
              {bill.organization.address && (
                <div className="info-item">
                  <MapPin size={12} />
                  <span>{bill.organization.address}</span>
                </div>
              )}
              {bill.organization.phone && (
                <div className="info-item">
                  <Phone size={12} />
                  <span>+91 {bill.organization.phone}</span>
                </div>
              )}
            </div>
          </div>
          <div className="bill-meta-block">
            <div className="meta-field">
              <span className="meta-label">
                {t("bills.details.billNo") || "Bill No"}:
              </span>
              <span className="meta-value">#{bill.billNumber}</span>
            </div>
            <div className="meta-field">
              <span className="meta-label">
                {t("bills.details.date") || "Date"}:
              </span>
              <span className="meta-value">
                {bill?.billDate
                  ? DateTime.fromISO(bill.billDate).toFormat("dd-MMM-yyyy")
                  : "N/A"}
              </span>
            </div>
            <div className="meta-jurisdiction">
              {t("bills.details.jurisdiction", {
                city: config?.city || "Latur",
              })}
            </div>
          </div>
        </div>

        <div className="divider" />

        {/* --- Party Information Section --- */}
        <div
          style={{
            marginBottom: "2rem",
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "2rem",
            border: "1.5px solid #eee",
            borderRadius: "12px",
            padding: "1.5rem",
          }}
        >
          <div>
            <h4
              style={{
                margin: "0 0 10px",
                fontSize: "11px",
                color: "#64748b",
                textTransform: "uppercase",
                letterSpacing: "0.15em",
                borderBottom: "1px solid #eee",
                paddingBottom: "6px",
              }}
            >
              {isPurchase
                ? t("bills.details.farmerDetails") || "Farmer Details"
                : t("bills.details.customerDetails") || "Customer Details"}
            </h4>
            <p
              style={{
                margin: "0",
                fontSize: "16px",
                color: "#000",
                fontWeight: 800,
              }}
            >
              {partyName}
            </p>
            {isPurchase && bill.farmer?.village && (
              <p
                style={{
                  margin: "4px 0 0",
                  fontSize: "13px",
                  color: "#475569",
                  fontWeight: 600,
                }}
              >
                <span style={{ color: "#94a3b8", fontWeight: 700 }}>
                  {t("bills.details.village") || "Village"}:
                </span>{" "}
                {bill.farmer.village}
              </p>
            )}
            {partyMobile && (
              <p
                style={{
                  margin: "4px 0 0",
                  fontSize: "13px",
                  color: "#475569",
                  fontWeight: 600,
                }}
              >
                <span style={{ color: "#94a3b8", fontWeight: 700 }}>
                  {t("bills.details.mobile") || "Mobile"}:
                </span>{" "}
                {partyMobile}
              </p>
            )}
          </div>
        </div>

        {/* --- Item Details Table --- */}
        <div className="items-container">
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              marginBottom: "2rem",
            }}
          >
            <thead>
              <tr
                style={{
                  background: "#f8fafc",
                  borderBottom: "2px solid #eee",
                }}
              >
                <th
                  style={{
                    padding: "12px",
                    textAlign: "left",
                    fontSize: "11px",
                    color: "#64748b",
                    textTransform: "uppercase",
                    fontWeight: 800,
                  }}
                >
                  {t("bills.details.srNo") || "Sr."}
                </th>
                <th
                  style={{
                    padding: "12px",
                    textAlign: "left",
                    fontSize: "11px",
                    color: "#64748b",
                    textTransform: "uppercase",
                    fontWeight: 800,
                  }}
                >
                  {t("bills.details.description") || "Item Description"}
                </th>
                <th
                  style={{
                    padding: "12px",
                    textAlign: "right",
                    fontSize: "11px",
                    color: "#64748b",
                    textTransform: "uppercase",
                    fontWeight: 800,
                  }}
                >
                  {t("bills.details.units") || "Units"}
                </th>
                <th
                  style={{
                    padding: "12px",
                    textAlign: "right",
                    fontSize: "11px",
                    color: "#64748b",
                    textTransform: "uppercase",
                    fontWeight: 800,
                  }}
                >
                  {t("bills.details.weight") || "Weight (KG)"}
                </th>
                <th
                  style={{
                    padding: "12px",
                    textAlign: "right",
                    fontSize: "11px",
                    color: "#64748b",
                    textTransform: "uppercase",
                    fontWeight: 800,
                  }}
                >
                  {t("bills.details.rate") || "Rate"}
                </th>
                <th
                  style={{
                    padding: "12px",
                    textAlign: "right",
                    fontSize: "11px",
                    color: "#64748b",
                    textTransform: "uppercase",
                    fontWeight: 800,
                  }}
                >
                  {t("bills.details.amount") || "Amount"}
                </th>
              </tr>
            </thead>
            <tbody>
              {bill.items.map((item: any, idx: number) => (
                <tr key={item.id}>
                  <td
                    style={{
                      padding: "12px",
                      borderBottom: "1px solid #eee",
                      fontSize: "13px",
                      color: "#475569",
                    }}
                  >
                    {idx + 1}
                  </td>
                  <td
                    style={{
                      padding: "12px",
                      borderBottom: "1px solid #eee",
                      fontSize: "13px",
                      color: "#475569",
                    }}
                  >
                    <div style={{ fontWeight: 600 }}>{item.item.name}</div>
                    <div
                      style={{
                        fontSize: "10px",
                        color: "#94a3b8",
                        textTransform: "uppercase",
                        marginTop: "4px",
                      }}
                    >
                      {item.pricingMode.replace("_", " ")}
                    </div>
                  </td>
                  <td
                    style={{
                      padding: "12px",
                      borderBottom: "1px solid #eee",
                      textAlign: "right",
                      fontSize: "13px",
                      color: "#475569",
                    }}
                  >
                    {Number(item.quantityUnits).toFixed(1)}
                  </td>
                  <td
                    style={{
                      padding: "12px",
                      borderBottom: "1px solid #eee",
                      textAlign: "right",
                      fontSize: "13px",
                      color: "#475569",
                    }}
                  >
                    {Number(item.quantityKg).toFixed(2)}
                  </td>
                  <td
                    style={{
                      padding: "12px",
                      borderBottom: "1px solid #eee",
                      textAlign: "right",
                      fontSize: "13px",
                      color: "#475569",
                    }}
                  >
                    ₹{Number(item.pricePerUnit).toLocaleString("en-IN")}
                  </td>
                  <td
                    style={{
                      padding: "12px",
                      borderBottom: "1px solid #eee",
                      textAlign: "right",
                      fontSize: "14px",
                      fontWeight: 700,
                      color: "#000",
                    }}
                  >
                    ₹
                    {Number(item.total).toLocaleString("en-IN", {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr
                style={{
                  borderTop: "2px solid #eee",
                  fontWeight: 900,
                  background: "#fdfdfd",
                }}
              >
                <td
                  colSpan={2}
                  style={{
                    padding: "12px",
                    textAlign: "left",
                    fontSize: "12px",
                  }}
                >
                  {t("bills.details.totals") || "TOTALS"}
                </td>
                <td
                  style={{
                    padding: "12px",
                    textAlign: "right",
                    fontSize: "14px",
                  }}
                >
                  {totalUnits}
                </td>
                <td
                  style={{
                    padding: "12px",
                    textAlign: "right",
                    fontSize: "14px",
                  }}
                >
                  {totalWeight.toFixed(2)}
                </td>
                <td style={{ padding: "12px", textAlign: "right" }}>-</td>
                <td
                  style={{
                    padding: "12px",
                    textAlign: "right",
                    fontSize: "16px",
                    color: "#000",
                  }}
                >
                  ₹
                  {itemsSubtotal.toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* --- Charges & Summary Section --- */}
        <div className="summary-grid">
          {isPurchase ? (
            <div className="charges-section">
              <p className="section-label">
                {t("bills.details.chargesSection") || "Charges & Adjustments"}
              </p>
              <div className="charges-list">
                {/* Farmer Specific Charges */}
                <div className="charge-item">
                  <span>{t("bills.details.labour") || "Labour / Hamali"}</span>
                  <span>- ₹{Number(bill.labourCharges).toFixed(2)}</span>
                </div>
                <div className="charge-item">
                  <span>
                    {t("bills.details.freight") || "Freight / Vehicle"}
                  </span>
                  <span>- ₹{Number(bill.freightCharges).toFixed(2)}</span>
                </div>
                <div className="charge-item deduction">
                  <span>
                    {t("bills.details.advance") || "Advance Adjusted"}
                  </span>
                  <span>- ₹{Number(bill.advanceDeduction).toFixed(2)}</span>
                </div>
                <div className="charge-item">
                  <span>
                    {t("bills.details.others") || "Others"} (
                    {bill.othersNote || "Adjustment"})
                  </span>
                  <span>- ₹{Number(bill.othersAmount).toFixed(2)}</span>
                </div>
              </div>
            </div>
          ) : (
            <div />
          )}

          <div className="final-summary">
            <div className="summary-box">
              <div className="summary-row">
                <span>{t("bills.details.grossTotal") || "Gross Total"}</span>
                <span>
                  ₹
                  {Number(
                    !isPurchase
                      ? itemsSubtotal
                      : bill.grossTotal || itemsSubtotal,
                  ).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                </span>
              </div>

              {isPurchase && totalExpenses > 0 && (
                <div className="summary-row" style={{ color: "#dc2626" }}>
                  <span>
                    {t("bills.details.totalExpenses") || "Total Expenses"}
                  </span>
                  <span>- ₹{totalExpenses.toFixed(2)}</span>
                </div>
              )}

              {!isPurchase && (
                <>
                  <div className="summary-row">
                    <span style={{ fontSize: "12px", color: "#64748b" }}>
                      {t("bills.details.tax") || "Market Fee / Tax"}
                    </span>
                    <span style={{ fontSize: "12px", color: "#64748b" }}>
                      + ₹{Number(bill.taxAmount).toFixed(2)}
                    </span>
                  </div>
                  <div className="summary-row">
                    <span style={{ fontSize: "12px", color: "#64748b" }}>
                      {t("bills.details.commission") || "Commission"}
                    </span>
                    <span style={{ fontSize: "12px", color: "#64748b" }}>
                      + ₹{Number(bill.serviceChargeAmount).toFixed(2)}
                    </span>
                  </div>
                </>
              )}
              <div
                className="summary-row"
                style={{ fontWeight: 800, color: "var(--primary-main)" }}
              >
                <span>
                  {t("bills.details.currentBillTotal") || "Current Bill Total"}
                </span>
                <span>
                  ₹
                  {Number(bill.netTotal).toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>

              <div
                className="summary-row"
                style={{
                  color: "#64748b",
                  borderTop: "1px dashed #e2e8f0",
                  paddingTop: "8px",
                  marginTop: "8px",
                }}
              >
                <span>
                  {t("bills.details.previousBalance") || "Previous Balance"}
                </span>
                <span>
                  ₹
                  {Number(bill.previousBalance).toLocaleString("en-IN", {
                    minimumFractionDigits: 2,
                  })}
                </span>
              </div>

              <div className="summary-row main-total">
                <span>{t("bills.details.finalAmount") || "FINAL AMOUNT"}</span>
                <span>
                  ₹
                  {Number(bill.finalAmount || bill.netTotal).toLocaleString(
                    "en-IN",
                    { minimumFractionDigits: 2 },
                  )}
                </span>
              </div>
            </div>

            {!isPurchase && upiString && (
              <div className="upi-section">
                <div className="upi-qr">
                  <QRCodeSVG value={upiString} size={100} level="M" />
                </div>
                <div className="upi-info">
                  <p className="upi-label">
                    {t("bills.details.scanToPay") || "Scan to Pay via UPI"}
                  </p>
                  <p className="upi-id">{config.upiId}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* --- Footer Section --- */}
        <div className="bill-footer">
          <div className="footer-terms">
            <p>
              {t("bills.details.footerTerms2", {
                city: config?.city || "Latur",
              })}
            </p>
          </div>
          <div className="footer-page">
            {t("bills.details.page") || "Page"} 1 of 1
          </div>
        </div>
      </div>

      <style jsx global>{`
        .bill-view-container {
          padding-bottom: 5rem;
          animation: fadeIn 0.4s ease-out;
          display: flex;
          flex-direction: column;
          align-items: center;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .action-header {
          width: 100%;
          max-width: 800px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .back-link {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: var(--text-muted);
          font-size: 13px;
          font-weight: 800;
          text-decoration: none;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .page-selector {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #fff;
          padding: 8px 12px;
          border-radius: 12px;
          border: 1.5px solid var(--border-main);
          color: var(--text-muted);
        }

        .page-select {
          border: none;
          background: none;
          font-size: 12px;
          font-weight: 800;
          color: var(--text-main);
          outline: none;
          cursor: pointer;
        }

        .print-btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px 24px;
          background-color: var(--primary-main);
          color: #fff;
          border-radius: 12px;
          border: none;
          fontweight: 900;
          fontsize: 13px;
          cursor: pointer;
          box-shadow: 0 10px 15px -3px rgba(21, 128, 61, 0.2);
        }

        /* --- Bill Document Styles --- */
        .bill-document {
          background-color: #fff;
          padding: 40px;
          border-radius: 0; /* Traditional for bills */
          border: 1px solid #e2e8f0;
          width: 210mm; /* A4 width */
          min-height: 297mm;
          color: #000;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.05);
        }

        .bill-header {
          display: grid;
          grid-template-columns: 100px 1fr 180px;
          gap: 20px;
          align-items: start;
        }

        .business-logo {
          width: 80px;
          height: 80px;
          object-fit: contain;
        }

        .business-name {
          font-size: 24px;
          font-weight: 900;
          margin: 0;
          color: #000;
          letter-spacing: -0.02em;
        }

        .business-desc {
          font-size: 12px;
          font-weight: 700;
          color: #64748b;
          margin: 4px 0 12px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .business-meta {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .info-item {
          display: flex;
          align-items: center;
          gap: 6px;
          font-size: 11px;
          font-weight: 600;
          color: #475569;
        }

        .bill-meta-block {
          text-align: right;
          border: 1.5px solid #f1f5f9;
          padding: 12px;
          border-radius: 8px;
        }

        .meta-field {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          margin-bottom: 4px;
        }

        .meta-label {
          font-weight: 700;
          color: #64748b;
          margin-right: 8px;
        }
        .meta-value {
          font-weight: 900;
          color: #000;
        }

        .meta-jurisdiction {
          font-size: 9px;
          font-weight: 800;
          color: #94a3b8;
          text-transform: uppercase;
          margin-top: 8px;
          border-top: 1px solid #f1f5f9;
          padding-top: 6px;
        }

        .divider {
          height: 2px;
          background: #000;
          margin: 24px 0;
        }

        .party-grid {
          display: flex;
          justify-content: space-between;
          align-items: start;
          margin-bottom: 24px;
        }

        .section-label {
          font-size: 10px;
          font-weight: 900;
          color: #94a3b8;
          text-transform: uppercase;
          letter-spacing: 0.1em;
          margin-bottom: 8px;
        }

        .party-name {
          font-size: 20px;
          font-weight: 950;
          margin: 0 0 8px;
        }

        .party-info-row {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          font-weight: 700;
          color: #475569;
          margin-bottom: 4px;
        }

        .status-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 14px;
          border-radius: 99px;
          font-size: 11px;
          font-weight: 900;
          text-transform: uppercase;
        }

        .status-badge.pending {
          background: #fef2f2;
          color: #dc2626;
          border: 1px solid #fee2e2;
        }
        .status-badge.paid {
          background: #f0fdf4;
          color: #16a34a;
          border: 1px solid #dcfce7;
        }

        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-bottom: 24px;
        }

        .items-table th {
          text-align: left;
          padding: 10px;
          font-size: 11px;
          font-weight: 900;
          text-transform: uppercase;
          background: #f8fafc;
          border: 1.5px solid #e2e8f0;
        }

        .items-table td {
          padding: 10px;
          border: 1px solid #e2e8f0;
          font-size: 13px;
        }

        .item-mode-badge {
          display: inline-block;
          font-size: 9px;
          font-weight: 800;
          color: #64748b;
          text-transform: uppercase;
          margin-top: 2px;
        }

        .table-footer td {
          background: #f8fafc;
          border-top: 2px solid #000;
        }

        .summary-grid {
          display: grid;
          grid-template-columns: 1fr 280px;
          gap: 40px;
          margin-top: 24px;
        }

        .charge-item {
          display: flex;
          justify-content: space-between;
          font-size: 12px;
          font-weight: 700;
          color: #475569;
          margin-bottom: 8px;
        }

        .charge-item.deduction {
          color: #dc2626;
        }

        .summary-box {
          background: #f8fafc;
          padding: 16px;
          border-radius: 8px;
          border: 1.5px solid #e2e8f0;
        }

        .summary-row {
          display: flex;
          justify-content: space-between;
          font-size: 13px;
          font-weight: 700;
          margin-bottom: 8px;
        }

        .main-total {
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1.5px solid #e2e8f0;
          font-size: 18px;
          font-weight: 950;
          color: #000;
        }

        .upi-section {
          margin-top: 20px;
          display: flex;
          align-items: center;
          gap: 15px;
          padding: 12px;
          border: 1.5px dashed #e2e8f0;
          border-radius: 12px;
        }

        .upi-label {
          font-size: 10px;
          font-weight: 900;
          color: #64748b;
          margin: 0;
        }
        .upi-id {
          font-size: 11px;
          font-weight: 800;
          color: #000;
          margin: 2px 0 0;
        }

        .bill-footer {
          margin-top: auto;
          padding-top: 40px;
          display: flex;
          justify-content: space-between;
          align-items: end;
        }

        .footer-terms p {
          font-size: 10px;
          font-weight: 600;
          color: #94a3b8;
          margin: 0;
        }

        .footer-page {
          font-size: 10px;
          font-weight: 800;
          color: #94a3b8;
        }

        /* --- Page Size Adjustments --- */
        .page-a5 .bill-document {
          width: 148mm;
          min-height: 210mm;
          padding: 20px;
        }

        .page-legal .bill-document {
          width: 216mm;
          min-height: 356mm;
        }

        .page-folio .bill-document {
          width: 215mm;
          min-height: 330mm;
        }

        @media print {
          /* 1. Hide everything except the main content path */
          header,
          aside,
          nav,
          .no-print,
          [role="navigation"],
          [data-sonner-toaster],
          .fixed,
          .sticky {
            display: none !important;
            visibility: hidden !important;
          }

          /* 2. Reset ALL container layouts to avoid overflow/extra pages */
          html,
          body,
          #__next,
          .flex,
          .flex-col,
          main,
          .bill-view-container,
          [data-shell-content="true"] {
            display: block !important;
            height: auto !important;
            min-height: 0 !important;
            overflow: visible !important;
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            background: white !important;
            box-shadow: none !important;
            border: none !important;
            transform: none !important;
          }

          /* 3. Force Bill Document to fit exactly */
          .bill-document {
            display: block !important;
            box-shadow: none !important;
            border: none !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            min-height: auto !important;
          }

          /* 4. Global consistency resets */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          .no-print {
            display: none !important;
          }

          @page {
            margin: 15mm;
            size: auto;
          }
        }

        .text-right {
          text-align: right !important;
        }
        .text-center {
          text-align: center !important;
        }
        .font-bold {
          font-weight: 850 !important;
        }
        .font-black {
          font-weight: 950 !important;
        }
      `}</style>
    </div>
  );
}
