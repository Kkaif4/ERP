"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Printer,
  ArrowLeft,
  Loader2,
  Phone,
  MapPin,
  Download,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import { DateTime } from "luxon";
import { downloadPDF, printPDF } from "@/lib/print";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

type PageSize = "A4" | "A5" | "LEGAL" | "FOLIO" | "THERMAL_80" | "THERMAL_58";

export default function BillDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { t, language } = useTranslation();
  const [bill, setBill] = useState<any>(null);
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [pageSize, setPageSize] = useState<PageSize>("A4");
  const [scale, setScale] = useState(1);
  const [docHeight, setDocHeight] = useState(0);
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

  useEffect(() => {
    const updateScale = () => {
      if (typeof window !== "undefined" && billRef.current) {
        const width = window.innerWidth;
        const isMobile = width < 640;
        const containerPadding = isMobile ? 32 : width < 1024 ? 48 : 80;
        const availableWidth = width - containerPadding;

        let targetWidth = 800; // Default for A4/Legal/Folio
        if (pageSize === "A5") targetWidth = 560;
        if (pageSize === "THERMAL_80") targetWidth = 302;
        if (pageSize === "THERMAL_58") targetWidth = 219;

        // On mobile for A4/A5, we prefer reflow over scaling.
        // We only scale if really needed, but mostly we let CSS handle it.
        const isStandardSize = !pageSize.startsWith("THERMAL");

        if (isMobile && isStandardSize) {
          setScale(1); // Disable scaling on mobile for standard sizes, use reflow
        } else if (availableWidth < targetWidth) {
          const newScale = availableWidth / targetWidth;
          setScale(newScale);
        } else {
          setScale(1);
        }

        // Capture height after a short delay to ensure layout is stable
        setTimeout(() => {
          if (billRef.current) {
            setDocHeight(billRef.current.offsetHeight);
          }
        }, 150);
      }
    };

    updateScale();
    window.addEventListener("resize", updateScale);
    const timer = setTimeout(updateScale, 500);

    return () => {
      window.removeEventListener("resize", updateScale);
      clearTimeout(timer);
    };
  }, [bill, loading, pageSize]);

  const handlePrint = () => {
    printPDF(`/api/bills/${id}/pdf`, { pageSize, lang: language });
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
    <div
      className={`bill-view-container page-${pageSize.toLowerCase()} ${pageSize.startsWith("THERMAL") ? "thermal-mode" : ""}`}
    >
      {/* --- Action Header (Hidden during print) --- */}
      <div className="no-print action-header">
        <div className="action-header-left">
          <button onClick={() => router.back()} className="back-button">
            <ArrowLeft size={18} /> {t("bills.details.back") || "Back"}
          </button>

          <div className="page-size-selector">
            <span className="selector-label">
              {t("bills.details.pageSize") || "Page Size"}:
            </span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(e.target.value as PageSize)}
              className="size-select"
            >
              <option value="A4">A4</option>
              <option value="A5">A5</option>
              <option value="LEGAL">LEGAL</option>
              <option value="FOLIO">FOLIO</option>
              <option value="THERMAL_80">Thermal (80mm)</option>
              <option value="THERMAL_58">Thermal (58mm)</option>
            </select>
          </div>
        </div>

        <div className="action-header-right">
          <button onClick={handlePrint} className="print-button">
            <Printer size={18} /> {t("bills.details.print") || "Print"}
          </button>
          <button
            onClick={() =>
              downloadPDF(
                `/api/bills/${id}/pdf`,
                `bill-${bill.billNumber}.pdf`,
                { pageSize, lang: language },
              )
            }
            className="download-button"
          >
            <Download size={18} />{" "}
            {t("bills.details.downloadPdf") || "Download PDF"}
          </button>
        </div>
      </div>

      {/* --- THE BILL DOCUMENT --- */}
      <div
        className="bill-scaling-wrapper"
        style={{
          width: "100%",
          overflow: "hidden",
          height: scale < 1 && docHeight ? `${docHeight * scale}px` : "auto",
        }}
      >
        <div
          className={`bill-document premium-card ${pageSize.startsWith("THERMAL") ? "thermal-receipt" : ""}`}
          ref={billRef}
          style={{
            transform:
              scale < 1 &&
              pageSize !== "THERMAL_80" &&
              pageSize !== "THERMAL_58"
                ? `scale(${scale})`
                : "none",
            transformOrigin: "top center",
            transition: "transform 0.2s ease-out",
            width:
              scale < 1 &&
              pageSize !== "THERMAL_80" &&
              pageSize !== "THERMAL_58"
                ? pageSize === "A5"
                  ? "560px"
                  : "800px"
                : pageSize === "THERMAL_80"
                  ? "226pt"
                  : pageSize === "THERMAL_58"
                    ? "164pt"
                    : "100%",
            maxWidth:
              pageSize === "THERMAL_80"
                ? "302px"
                : pageSize === "THERMAL_58"
                  ? "219px"
                  : "210mm",
            margin: "0 auto",
            boxShadow: pageSize.startsWith("THERMAL") ? "none" : undefined,
            border: pageSize.startsWith("THERMAL")
              ? "1px solid #eee"
              : undefined,
            borderRadius: pageSize.startsWith("THERMAL") ? "0" : "16px",
          }}
        >
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
            </div>
          </div>

          <div className="divider" />

          {/* --- Party Information Section --- */}
          <div className="party-details-section">
            <div className="party-card">
              <h4
                style={{
                  margin: "0 0 10px",
                  fontSize: "11px",
                  color: "#000000ff",
                  textTransform: "uppercase",
                  letterSpacing: "0.15em",
                  borderBottom: "1px solid #eee",
                  paddingBottom: "6px",
                  fontWeight: pageSize.startsWith("THERMAL") ? 600 : 700,
                }}
              >
                {isPurchase
                  ? t("bills.details.farmerDetails") || "Farmer Details"
                  : t("bills.details.customerDetails") || "Customer Details"}
              </h4>
              <span
                style={{
                  color: "#94a3b8",
                  fontWeight: 700,
                  fontSize: pageSize.startsWith("THERMAL") ? "11px" : "13px",
                }}
              >
                {isPurchase ? (
                  <span style={{ color: "#94a3b8", fontWeight: 700 }}>
                    {t("bills.details.farmerName") || "Farmer"}:
                  </span>
                ) : (
                  <span style={{ color: "#94a3b8", fontWeight: 700 }}>
                    {t("bills.details.customerName") || "Name"}:
                  </span>
                )}
              </span>{" "}
              <span
                style={{
                  fontSize: pageSize.startsWith("THERMAL") ? "11px" : "11px",
                  fontWeight: 600,
                }}
              >
                {partyName}
                {partyMobile && (
                  <p
                    style={{
                      margin: "2px 0 0",
                      fontSize: "11px",
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
              </span>
              {isPurchase && bill.farmer?.village && (
                <p
                  style={{
                    margin: "2px 0 0",
                    fontSize: "11px",
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
            </div>
          </div>

          <div
            className="items-container"
            style={{
              overflowX: "auto",
              width: "100%",
              WebkitOverflowScrolling: "touch",
            }}
          >
            {pageSize.startsWith("THERMAL") ? (
              <Table className="w-full mb-8 text-xs border-collapse">
                <TableHeader>
                  <TableRow className="border-b border-dashed border-[#ccc] hover:bg-transparent">
                    <TableHead className="h-8 px-0 text-left font-bold text-[#64748b]">
                      {t("bills.details.item") || "Item"}
                    </TableHead>
                    <TableHead className="h-8 px-0 text-right font-bold text-[#64748b]">
                      {t("bills.details.units") || "Unit"}
                    </TableHead>
                    <TableHead className="h-8 px-0 text-right font-bold text-[#64748b]">
                      {t("bills.details.weight") || "KG"}
                    </TableHead>
                    <TableHead className="h-8 px-0 text-right font-bold text-[#64748b]">
                      {t("bills.details.price") || "Price"}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bill.items.map((item: any, idx: number) => (
                    <TableRow key={item.id} className="border-b border-dashed border-[#eee] hover:bg-transparent">
                      <TableCell className="py-1.5 px-0 text-[11px]">
                        {idx + 1}. {item.item.name}
                      </TableCell>
                      <TableCell className="py-1.5 px-0 text-right text-[11px]">
                        {Number(item.quantityUnits).toFixed(1)}
                      </TableCell>
                      <TableCell className="py-1.5 px-0 text-right text-[11px]">
                        {Number(item.quantityKg).toFixed(1)}
                      </TableCell>
                      <TableCell className="py-1.5 px-0 text-right font-semibold text-[11px]">
                        {Number(item.pricePerUnit).toLocaleString("en-IN")}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter className="bg-transparent border-t border-dashed border-[#ccc] font-bold">
                  <TableRow className="hover:bg-transparent">
                    <TableCell className="py-2 px-0 text-[10px]">
                      {t("bills.details.totals") || "TOTALS"}
                    </TableCell>
                    <TableCell className="py-2 px-0 text-right text-[11px]">
                      {totalUnits}
                    </TableCell>
                    <TableCell className="py-2 px-0 text-right text-[11px]">
                      {totalWeight.toFixed(1)}
                    </TableCell>
                    <TableCell className="py-2 px-0 text-right">
                      {Number(itemsSubtotal).toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                      })}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            ) : (
              <Table className="w-full mb-8 min-w-[650px] border-collapse">
                <TableHeader>
                  <TableRow className="bg-[#f8fafc] border-b-2 border-[#eee] hover:bg-[#f8fafc]">
                    <TableHead className="h-14 pl-8 pr-4 text-left text-[11px] font-black uppercase tracking-[0.2em] text-[#94a3b8]">
                      {t("bills.details.srNo") || "Sr."}
                    </TableHead>
                    <TableHead className="h-14 px-4 text-left text-[11px] font-black uppercase tracking-[0.2em] text-[#94a3b8]">
                      {t("bills.details.item") || "Item"}
                    </TableHead>
                    <TableHead className="h-14 px-4 text-right text-[11px] font-black uppercase tracking-[0.2em] text-[#94a3b8]">
                      {t("bills.details.units") || "Unit"}
                    </TableHead>
                    <TableHead className="h-14 px-4 text-right text-[11px] font-black uppercase tracking-[0.2em] text-[#94a3b8]">
                      {t("bills.details.weight") || "Weight"}
                    </TableHead>
                    <TableHead className="h-14 pl-4 pr-8 text-right text-[11px] font-black uppercase tracking-[0.2em] text-[#94a3b8]">
                      {t("bills.details.price") || "Price"}
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bill.items.map((item: any, idx: number) => (
                    <TableRow key={item.id} className="hover:bg-transparent">
                      <TableCell className="pl-8 pr-4 py-5 border-b border-[#eee] text-[14px] text-[#475569] font-medium tabular-nums">
                        {idx + 1}
                      </TableCell>
                      <TableCell className="px-4 py-5 border-b border-[#eee] text-[14px] text-[#1e293b]">
                        <div className="font-bold">{item.item.name}</div>
                      </TableCell>
                      <TableCell className="px-4 py-5 border-b border-[#eee] text-right text-[14px] text-[#475569] font-medium tabular-nums">
                        {Number(item.quantityUnits).toFixed(1)}
                      </TableCell>
                      <TableCell className="px-4 py-5 border-b border-[#eee] text-right text-[14px] text-[#475569] font-medium tabular-nums">
                        {Number(item.quantityKg).toFixed(1)}
                      </TableCell>
                      <TableCell className="pl-4 pr-8 py-5 border-b border-[#eee] text-right text-[14px] text-[#0f172a] font-bold tabular-nums">
                        <span className="text-[12px] font-semibold text-[#64748b]/70 mr-0.5">₹</span>
                        {Number(item.pricePerUnit).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
                <TableFooter className="bg-[#fdfdfd] border-t-2 border-[#eee] font-black">
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={2} className="p-3 pl-8 text-left text-[12px] font-black uppercase tracking-widest text-[#94a3b8]">
                      {t("bills.details.totals") || "TOTALS"}
                    </TableCell>
                    <TableCell className="p-3 text-right text-[14px] font-black text-[#1e293b] tabular-nums">
                      {totalUnits}
                    </TableCell>
                    <TableCell className="p-3 text-right text-[14px] font-black text-[#1e293b] tabular-nums">
                      {totalWeight.toFixed(2)}
                    </TableCell>
                    <TableCell className="p-3 pr-8 text-right text-[16px] font-black text-[#0f172a] tabular-nums">
                      <span className="text-[13px] font-semibold text-[#64748b]/70 mr-0.5">₹</span>
                      {Number(itemsSubtotal).toLocaleString("en-IN", {
                        minimumFractionDigits: 2,
                      })}
                    </TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            )}
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
                    <span>
                      {t("bills.details.labour") || "Labour / Hamali"}
                    </span>
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
                    {t("bills.details.currentBillTotal") ||
                      "Current Bill Total"}
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
                  <span>
                    {t("bills.details.finalAmount") || "FINAL AMOUNT"}
                  </span>
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
      </div>

      <style jsx global>{`
        .bill-view-container {
          padding-bottom: 5rem;
          animation: fadeIn 0.4s ease-out;
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100%;
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
          max-width: 900px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
          padding: 16px 20px;
          background: white;
          border-radius: 16px;
          border: 1.5px solid var(--border-main);
          gap: 16px;
          flex-wrap: wrap;
          margin-left: auto;
          margin-right: auto;
        }

        .action-header-left,
        .action-header-right {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .back-button {
          display: flex;
          align-items: center;
          gap: 8px;
          font-weight: 700;
          color: var(--text-muted);
          font-size: 14px;
          margin-right: 8px;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
        }

        .page-size-selector {
          display: flex;
          align-items: center;
          gap: 10px;
          white-space: nowrap;
        }

        .selector-label {
          font-size: 12px;
          font-weight: 700;
          color: var(--text-muted);
        }

        .size-select {
          padding: 8px 12px;
          border-radius: 10px;
          border: 1.5px solid var(--border-main);
          font-size: 13px;
          font-weight: 700;
          background: #f8fafc;
          cursor: pointer;
        }

        .print-button,
        .download-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 10px 16px;
          border-radius: 12px;
          font-weight: 700;
          font-size: 13px;
          white-space: nowrap;
          cursor: pointer;
          border: none;
        }

        .print-button {
          border: 1.5px solid #000;
          background: transparent;
          color: black;
        }

        .download-button {
          background: black;
          color: white;
        }

        @media (max-width: 768px) {
          .action-header {
            margin-left: 16px;
            margin-right: 16px;
            max-width: calc(100% - 32px);
            padding: 12px 16px;
            gap: 12px;
          }

          .action-header-left {
            display: flex;
            align-items: center;
            gap: 10px;
            flex-wrap: wrap;
            width: 100%;
          }

          .page-size-selector {
            gap: 6px;
          }

          .selector-label {
            display: none;
          }

          .size-select {
            padding: 6px 10px;
            font-size: 12px;
          }

          .action-header-right {
            width: 100%;
            display: flex;
            gap: 10px;
          }

          .print-button,
          .download-button {
            flex: 1;
            padding: 10px 12px;
            font-size: 12px;
            gap: 6px;
          }

          .print-button svg,
          .download-button svg {
            width: 16px;
            height: 16px;
          }
        }

        @media (max-width: 640px) {
          .action-header {
            margin-left: 12px;
            margin-right: 12px;
            max-width: calc(100% - 24px);
            flex-direction: column;
            align-items: stretch;
            padding: 12px;
            gap: 10px;
          }

          .action-header-left {
            flex-direction: column;
            width: 100%;
            gap: 10px;
          }

          .back-button {
            font-size: 13px;
            margin-right: 0;
          }

          .page-size-selector {
            width: 100%;
            gap: 8px;
          }

          .selector-label {
            display: inline;
            font-size: 11px;
          }

          .size-select {
            flex: 1;
            padding: 6px 8px;
            font-size: 11px;
          }

          .action-header-right {
            width: 100%;
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 8px;
          }

          .print-button,
          .download-button {
            padding: 9px 10px;
            font-size: 11px;
          }

          .print-button svg,
          .download-button svg {
            width: 14px;
            height: 14px;
          }
        }

        /* --- Bill Document Styles --- */
        .bill-document {
          background-color: #fff;
          padding: 40px;
          border-radius: 0; /* Traditional for bills */
          border: 1px solid #e2e8f0;
          width: 800px; /* Fixed width to maintain layout */
          min-height: 297mm;
          color: #000;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.05);
          margin: 0 auto;
        }

        .bill-header {
          display: grid;
          grid-template-columns: 100px 1fr 180px;
          gap: 20px;
          align-items: start;
        }

        .party-details-section {
          margin-bottom: 1.5rem;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 2rem;
          border: 1.5px solid #eee;
          border-radius: 12px;
          padding: 1.5rem;
        }

        .thermal-mode .party-details-section {
          display: block;
          border: none;
          border-bottom: 1px dashed #eee;
          border-radius: 0;
          padding: 0.5rem 0;
        }

        @media screen and (max-width: 1024px) {
          .bill-document {
            width: 100%;
            padding: 32px 24px;
            max-width: 900px;
          }

          .bill-header {
            grid-template-columns: 80px 1fr 150px;
            gap: 16px;
          }

          .business-logo {
            width: 70px;
            height: 70px;
          }

          .business-name {
            font-size: 20px;
          }

          .business-desc {
            font-size: 11px;
          }

          .bill-meta-block {
            padding: 10px;
          }

          .party-details-section {
            gap: 1.5rem;
            padding: 1.2rem;
          }
        }

        @media screen and (max-width: 768px) {
          .bill-view-container {
            padding-left: 12px;
            padding-right: 12px;
            padding-bottom: 4rem;
          }

          .bill-document {
            width: calc(100% - 24px);
            padding: 24px 16px;
            border-radius: 8px;
            min-height: auto;
            transform: none !important;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.08);
          }

          .bill-header {
            display: grid;
            grid-template-columns: 70px 1fr;
            gap: 12px;
            align-items: start;
          }

          .business-logo {
            width: 60px;
            height: 60px;
            grid-column: 1;
            grid-row: 1;
          }

          .business-info {
            grid-column: 2;
            grid-row: 1;
          }

          .business-name {
            font-size: 18px;
            margin-bottom: 2px;
          }

          .business-desc {
            font-size: 10px;
            margin-bottom: 8px;
          }

          .business-meta {
            gap: 2px;
          }

          .info-item {
            font-size: 10px;
          }

          .bill-meta-block {
            grid-column: 1 / -1;
            text-align: left;
            background: #f8fafc;
            padding: 8px 12px;
            border-radius: 6px;
            margin-top: 8px;
          }

          .meta-field {
            font-size: 11px;
            margin-bottom: 2px;
          }

          .meta-label {
            margin-right: 4px;
          }

          .meta-value {
            font-size: 11px;
          }

          .party-details-section {
            grid-template-columns: 1fr;
            gap: 1rem;
            padding: 1rem;
            margin-bottom: 1rem;
          }

          .party-card h4 {
            font-size: 10px;
          }

          .party-card span {
            font-size: 11px;
          }

          .items-container {
            border: 1px solid #eee;
            border-radius: 6px;
            margin-bottom: 1.5rem;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            width: 100%;
          }

          .items-container table {
            font-size: 12px !important;
            width: 100%;
            min-width: 500px;
          }

          .items-container th {
            padding: 10px 6px !important;
            font-size: 10px !important;
            white-space: nowrap;
          }

          .items-container td {
            padding: 8px 6px !important;
            font-size: 11px !important;
          }

          .summary-grid {
            grid-template-columns: 1fr !important;
            gap: 20px !important;
            margin-top: 1.5rem;
          }

          .charges-section {
            order: 2;
          }

          .final-summary {
            width: 100%;
            order: 1;
          }

          .summary-box {
            padding: 12px;
            border-radius: 6px;
          }

          .summary-row {
            font-size: 12px;
            margin-bottom: 6px;
          }

          .main-total {
            font-size: 16px;
            margin-top: 10px;
            padding-top: 10px;
          }

          .upi-section {
            margin-top: 12px;
            gap: 12px;
            padding: 10px;
            border-radius: 8px;
          }

          .bill-footer {
            padding-top: 20px;
            flex-direction: column;
            align-items: center;
            text-align: center;
            gap: 8px;
          }

          .footer-terms p {
            font-size: 9px;
          }

          .footer-page {
            font-size: 9px;
          }
        }

        @media screen and (max-width: 480px) {
          .bill-view-container {
            padding-left: 8px;
            padding-right: 8px;
            padding-bottom: 3rem;
          }

          .bill-document {
            width: calc(100% - 16px);
            padding: 16px 12px;
            border-radius: 6px;
          }

          .bill-header {
            display: flex;
            flex-direction: column;
            align-items: center;
            text-align: center;
            gap: 10px;
          }

          .business-logo {
            width: 50px;
            height: 50px;
          }

          .business-name {
            font-size: 16px;
          }

          .business-desc {
            font-size: 9px;
          }

          .business-meta {
            gap: 0;
          }

          .info-item {
            font-size: 9px;
            justify-content: center;
          }

          .bill-meta-block {
            width: 100%;
            text-align: center;
            padding: 6px;
          }

          .meta-field {
            font-size: 10px;
            margin-bottom: 1px;
          }

          .divider {
            margin: 12px 0;
          }

          .party-details-section {
            padding: 0.75rem;
            margin-bottom: 0.75rem;
          }

          .party-card h4 {
            font-size: 9px;
            margin-bottom: 6px;
          }

          .party-card span {
            font-size: 10px;
          }

          .party-card p {
            font-size: 10px;
          }

          .items-container table {
            font-size: 11px !important;
          }

          .items-container th {
            padding: 6px 4px !important;
            font-size: 9px !important;
            white-space: nowrap;
          }

          .items-container td {
            padding: 5px 3px !important;
            font-size: 10px !important;
          }

          .summary-box {
            padding: 10px;
          }

          .summary-row {
            font-size: 11px;
            margin-bottom: 5px;
          }

          .main-total {
            font-size: 14px;
            margin-top: 8px;
            padding-top: 8px;
          }

          .charge-item {
            font-size: 11px;
            margin-bottom: 6px;
          }

          .upi-section {
            flex-direction: column;
            align-items: center;
            gap: 8px;
            padding: 8px;
            margin-top: 10px;
          }

          .upi-label {
            font-size: 9px;
          }

          .upi-id {
            font-size: 10px;
          }
        }

        @media screen and (max-width: 360px) {
          .bill-document {
            width: calc(100% - 16px);
            padding: 12px;
          }

          .items-container {
            margin-bottom: 1rem;
          }

          .items-container table {
            font-size: 10px !important;
            min-width: 450px;
          }

          .items-container th {
            padding: 4px 2px !important;
            font-size: 8px !important;
          }

          .items-container td {
            padding: 4px 2px !important;
            font-size: 9px !important;
          }
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

          /* Thermal printing adjustments */
          .page-thermal_80 .bill-document {
            width: 302px !important;
            max-width: 302px !important;
            margin: 0 !important;
            padding: 0 10px !important;
            border: none !important;
            box-shadow: none !important;
          }
          .page-thermal_58 .bill-document {
            width: 219px !important;
            max-width: 219px !important;
            margin: 0 !important;
            padding: 0 5px !important;
            border: none !important;
            box-shadow: none !important;
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

        /* Thermal Web Preview Styles */
        .bill-document.thermal-receipt {
          font-family: "Mukta", sans-serif !important;
          padding: 10px !important;
          border-radius: 0 !important;
          margin-top: 1rem !important;
          border: 1px dashed #ccc !important;
          box-shadow: none !important;
          background: #fff;
          min-height: auto;
        }

        .thermal-mode .bill-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
          gap: 8px;
        }

        .thermal-mode .business-logo {
          width: 50px;
          height: 50px;
        }

        .thermal-mode .business-name {
          font-size: 16px;
          margin-bottom: 2px;
        }

        .thermal-mode .business-desc {
          font-size: 11px;
          margin: 0 0 4px;
        }

        .thermal-mode .business-meta .info-item {
          font-size: 11px;
          justify-content: center;
        }

        .thermal-mode .bill-meta-block {
          width: 100%;
          text-align: center;
          border: none;
          border-bottom: 1px dashed #e2e8f0;
          border-radius: 0;
          padding: 8px 0;
          margin-top: 8px;
        }

        .thermal-mode .meta-field {
          justify-content: space-between;
          font-size: 11px;
          padding: 0 10px;
        }

        .thermal-mode .divider {
          display: none;
        }

        /* Party Grid Thermal */
        .thermal-mode .party-grid,
        .thermal-mode > div:nth-child(3) {
          display: flex !important;
          flex-direction: column !important;
          gap: 10px !important;
          padding: 10px 0 !important;
          border: none !important;
          border-bottom: 1px dashed #e2e8f0 !important;
          border-radius: 0 !important;
          margin-bottom: 1rem !important;
        }

        .thermal-mode h4 {
          font-size: 10px !important;
          border-bottom: none !important;
          padding-bottom: 0 !important;
          margin-bottom: 4px !important;
          text-align: center;
        }

        .thermal-mode .party-name,
        .thermal-mode .party-info-row {
          font-size: 11px !important;
          text-align: left;
          justify-content: flex-start;
        }

        .thermal-mode p {
          font-size: 11px !important;
          text-align: left;
        }

        /* Table Thermal */
        .thermal-mode .items-container {
          overflow: hidden;
        }

        .thermal-mode table {
          min-width: 100% !important;
          font-size: 10px;
        }

        .thermal-mode th {
          padding: 6px 4px !important;
          font-size: 9px !important;
          border-bottom: 1px dashed #e2e8f0 !important;
          background: transparent !important;
        }

        .thermal-mode td {
          padding: 6px 4px !important;
          font-size: 10px !important;
          border: none !important;
          border-bottom: 1px dashed #f1f5f9 !important;
        }

        .thermal-mode .summary-grid {
          display: flex;
          flex-direction: column;
          gap: 15px;
          margin-top: 15px;
        }

        .thermal-mode .summary-box {
          background: transparent;
          border: none;
          padding: 0;
        }

        .thermal-mode .summary-row {
          font-size: 11px;
          padding: 2px 0;
        }

        .thermal-mode .main-total {
          font-size: 14px;
          border-top: 1px dashed #000;
          padding-top: 8px;
          margin-top: 8px;
        }

        .thermal-mode .upi-section {
          flex-direction: column;
          text-align: center;
          border: none;
          padding: 0;
          margin-top: 15px;
        }

        .thermal-mode .bill-footer {
          padding-top: 20px;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          text-align: center;
        }
      `}</style>
    </div>
  );
}
