import PDFDocument from "@react-pdf/pdfkit";
import {
  Bill,
  BillItem,
  Item,
  Farmer,
  Customer,
  Organization,
  BusinessConfig,
} from "../../prisma/generated";
import QRCode from "qrcode";
import path from "path";
import fs from "fs";

type BillWithRelations = Bill & {
  items: (BillItem & { item: Item })[];
  farmer?: Farmer | null;
  customer?: Customer | null;
  organization: Organization;
};

// Colors from the premium UI
const COLORS = {
  primary: "#15803d",
  secondary: "#475569",
  border: "#cbd5e1",
  text: "#1a1a1a",
  muted: "#94a3b8",
  background: "#f8fafc",
};

const FONTS = {
  regular: path.join(process.cwd(), "public/fonts/Mukta-Regular.ttf"),
  bold: path.join(process.cwd(), "public/fonts/Mukta-Bold.ttf"),
};

const PAGE_SIZES: Record<string, any> = {
  A4: [595.28, 841.89],
  A5: [419.53, 595.28],
  LEGAL: [612, 1008],
  FOLIO: [612, 936],
  THERMAL_80: 226.77, // ~80mm
  THERMAL_58: 164.41, // ~58mm
};

const TRANSLATIONS: any = {
  en: {
    purchaseBill: "PURCHASE BILL",
    saleBill: "SALE BILL",
    billNo: "Bill No",
    date: "Date",
    farmerDetails: "FARMER DETAILS",
    customerDetails: "CUSTOMER DETAILS",
    mobile: "Mobile",
    village: "Village",
    scanToPay: "SCAN TO PAY",
    sr: "SR.",
    itemDescription: "ITEM DESCRIPTION",
    units: "UNITS",
    weight: "WEIGHT",
    rate: "RATE",
    total: "TOTAL",
    grossTotal: "Gross Total:",
    adjustments: "Adjustments:",
    taxFee: "Tax/Fee:",
    commission: "Commission:",
    netTotal: "Net Total:",
    jurisdiction: "Subject to {{city}} jurisdiction.",
    generatedBy: "COMPUTER GENERATED BILL - MANDI ERP PREMIUM",
    reportPeriod: "Report Period",
    generatedOn: "Generated on",
    totalamount: "Total Amount",
    totalcount: "Total Count",
    totalpayments: "Total Payments",
    count: "Count",
    totalexpenses: "Total Expenses",
    paymentsreceived: "Payments Received",
    paymentspaid: "Payments Paid",
    expenses: "Expenses",
    totalsales: "Total Sales",
    totalpurchases: "Total Purchases",
    tradesummary: "Trade Summary",
    cashflowexpenses: "Cash Flow & Expenses",
    bill: "Bill #",
    party: "Party Name",
    qtykg: "Qty (KG)",
    qtyunits: "Qty (Units)",
    amount: "Amount",
    mode: "Mode",
    type: "Type",
    category: "Category",
    description: "Description",
    farmerpurchase: "Farmer Purchase History",
    customersale: "Customer Sales History",
    paymenthistory: "Payment History",
    dailysummary: "Daily Transaction Summary",
    expensereport: "Business Expense Report",
    billnumber: "Bill #",
    totalkg: "Qty (KG)",
    totalunits: "Qty (Units)",
    othersamount: "Others Amount",
  },
  mr: {
    purchaseBill: "खरेदी बिल",
    saleBill: "विक्री बिल",
    billNo: "बिल क्र",
    date: "तारीख",
    farmerDetails: "शेतकरी तपशील",
    customerDetails: "ग्राहक तपशील",
    mobile: "मोबाईल",
    village: "गाव",
    scanToPay: "पेमेंटसाठी स्कॅन करा",
    sr: "क्र.",
    itemDescription: "वस्तूचे वर्णन",
    units: "नग",
    weight: "वजन (KG)",
    rate: "दर",
    total: "एकूण",
    grossTotal: "एकूण रक्कम:",
    adjustments: "समायोजन (खर्च):",
    taxFee: "कर/मार्केट फी:",
    commission: "कमिशन:",
    netTotal: "निव्वळ एकूण:",
    jurisdiction: "{{city}} न्यायक्षेत्राच्या अधीन.",
    generatedBy: "संगणक व्युत्पन्न बिल - मंडी ईआरपी प्रीमियम",
    reportPeriod: "अहवाल कालावधी",
    generatedOn: "व्युत्पन्न दिनांक",
    totalamount: "एकूण रक्कम",
    totalcount: "एकूण संख्या",
    totalpayments: "एकूण येणी/देयणी",
    count: "संख्या",
    totalexpenses: "एकूण खर्च",
    paymentsreceived: "प्राप्त देयके",
    paymentspaid: "दिलेली देयके",
    expenses: "खर्च",
    totalsales: "एकूण विक्री",
    totalpurchases: "एकूण खरेदी",
    tradesummary: "व्यापार सारांश",
    cashflowexpenses: "रोख प्रवाह आणि खर्च",
    bill: "बिल #",
    party: "पार्टीचे नाव",
    qtykg: "वजन (किलो)",
    qtyunits: "नग (यूनिट)",
    amount: "रक्कम",
    mode: "मोड",
    type: "प्रकार",
    category: "श्रेणी",
    description: "तपशील",
    farmerpurchase: "शेतकरी खरेदी इतिहास",
    customersale: "ग्राहक विक्री इतिहास",
    paymenthistory: "पेमेंट इतिहास",
    dailysummary: "दैनंदिन व्यवहार सारांश",
    expensereport: "व्यवसाय खर्च अहवाल",
    billnumber: "बिल #",
    totalkg: "वजन (किलो)",
    totalunits: "नग (यूनिट)",
    othersamount: "इतर रक्कम",
  },
  hi: {
    purchaseBill: "खरीद बिल",
    saleBill: "बिक्री बिल",
    billNo: "बिल क्र",
    date: "तारीख",
    farmerDetails: "किसान विवरण",
    customerDetails: "ग्राहक विवरण",
    mobile: "मोबाइल",
    village: "गांव",
    scanToPay: "भुगतान के लिए स्कैन करें",
    sr: "क्र.",
    itemDescription: "वस्तु विवरण",
    units: "नग",
    weight: "वजन (KG)",
    rate: "दर",
    total: "कुल",
    grossTotal: "कुल राशि:",
    adjustments: "समायोजन (खर्च):",
    taxFee: "कर/मार्केट शुल्क:",
    commission: "कमीशन:",
    netTotal: "शुद्ध कुल:",
    jurisdiction: "{{city}} न्यायक्षेत्र के अधीन।",
    generatedBy: "कंप्यूटर जनरेटेड बिल - मंडी ईआरपी प्रीमियम",
    reportPeriod: "रिपोर्ट अवधि",
    generatedOn: "जनरेट किया गया",
    totalamount: "कुल राशि",
    totalcount: "कुल संख्या",
    totalpayments: "कुल भुगतान",
    count: "संख्या",
    totalexpenses: "कुल खर्च",
    paymentsreceived: "प्राप्त भुगतान",
    paymentspaid: "भुगतान किया गया",
    expenses: "खर्च",
    totalsales: "कुल बिक्री",
    totalpurchases: "कुल खरीद",
    tradesummary: "व्यापार सारांश",
    cashflowexpenses: "नकद प्रवाह और खर्च",
    bill: "बिल #",
    party: "पार्टी का नाम",
    qtykg: "मात्रा (किलो)",
    qtyunits: "मात्रा (यूनिट)",
    amount: "रकम",
    mode: "मोड",
    type: "प्रकार",
    category: "श्रेणी",
    description: "विवरण",
    farmerpurchase: "किसान खरीद इतिहास",
    customersale: "ग्राहक बिक्री इतिहास",
    paymenthistory: "भुगतान इतिहास",
    dailysummary: "दैनिक लेनदेन सारांश",
    expensereport: "व्यवसाय व्यय रिपोर्ट",
    billnumber: "बिल #",
    totalkg: "मात्रा (किलो)",
    totalunits: "मात्रा (यूनिट)",
    othersamount: "अन्य राशि",
  },
};

function t(key: string, lang: string, data?: any) {
  const dict = TRANSLATIONS[lang] || TRANSLATIONS.en;
  const sanitizedKey = key.toLowerCase().replace(/_/g, "");
  let val =
    dict[key] ||
    dict[sanitizedKey] ||
    TRANSLATIONS.en[key] ||
    TRANSLATIONS.en[sanitizedKey] ||
    key;

  if (data) {
    Object.keys(data).forEach((k) => {
      val = val.replace(`{{${k}}}`, data[k]);
    });
  }
  return val;
}

export async function generateBillPDF(
  bill: BillWithRelations,
  config?: BusinessConfig | null,
  options: { pageSize?: string; lang?: string } = {},
): Promise<Buffer> {
  const pageSize = options.pageSize || config?.defaultPageSize || "A4";
  const lang = options.lang || "mr";
  const isHindiOrMarathi = lang === "mr" || lang === "hi";
  const isThermal = pageSize.startsWith("THERMAL");

  return new Promise(async (resolve, reject) => {
    try {
      // Calculate dynamic exact height for thermal
      let docSize: any = PAGE_SIZES[pageSize] || "A4";
      if (isThermal) {
        let exactHeight = 240; // Headings and party details
        exactHeight += bill.items.length * 32; // Items table
        exactHeight += 10 + 15; // Padding + Gross Total

        if (bill.type === "PURCHASE") {
          const exp =
            Number(bill.labourCharges || 0) +
            Number(bill.freightCharges || 0) +
            Number(bill.advanceDeduction || 0) +
            Number(bill.othersAmount || 0);
          if (exp > 0) exactHeight += 15;
        } else {
          if (Number(bill.taxAmount) > 0) exactHeight += 15;
          if (Number(bill.serviceChargeAmount) > 0) exactHeight += 15;
        }
        exactHeight += 5 + 15; // Dash + Net Total
        exactHeight += 10 + 10 + 12 + 20; // Footer + Bottom Margin

        docSize = [PAGE_SIZES[pageSize], exactHeight];
      }

      const doc = new PDFDocument({
        size: docSize,
        margin: isThermal ? 10 : 40,
        bufferPages: true,
      });

      // Fix for thermal printers interpreting transparent as black
      if (isThermal) {
        doc.rect(0, 0, doc.page.width, doc.page.height).fill("#ffffff");
      }

      const buffers: Buffer[] = [];
      doc.on("data", (chunk: any) => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", (err: any) => reject(err));

      // Register Essential Fonts with robustness
      try {
        if (fs.existsSync(FONTS.regular)) {
          doc.registerFont("Main", fs.readFileSync(FONTS.regular));
        }
        if (fs.existsSync(FONTS.bold)) {
          doc.registerFont("Main-Bold", fs.readFileSync(FONTS.bold));
        }
      } catch (fontErr) {
        console.error("Font registration failed:", fontErr);
      }

      const canUseMain = fs.existsSync(FONTS.regular);
      const canUseBold = fs.existsSync(FONTS.bold);

      const currentFont = canUseMain ? "Main" : "Helvetica";
      const currentBold = canUseBold ? "Main-Bold" : "Helvetica-Bold";

      const width = doc.page.width;
      const margin = isThermal ? 10 : 40;
      const contentWidth = width - margin * 2;

      // 1. Logo & Business Header
      if (config?.logoBase64 && !isThermal) {
        try {
          const base64Data =
            config.logoBase64.split(",")[1] || config.logoBase64;
          const logoBuffer = Buffer.from(base64Data, "base64");

          // Basic image format check (PNG or JPEG)
          const isPng =
            logoBuffer.length > 4 &&
            logoBuffer[0] === 0x89 &&
            logoBuffer[1] === 0x50 &&
            logoBuffer[2] === 0x4e &&
            logoBuffer[3] === 0x47;
          const isJpeg =
            logoBuffer.length > 3 &&
            logoBuffer[0] === 0xff &&
            logoBuffer[1] === 0xd8 &&
            logoBuffer[2] === 0xff;

          if (isPng || isJpeg) {
            doc.image(logoBuffer, margin, 35, { width: 50 });
          }
        } catch (e) {}
      }

      if (isThermal) {
        // Thermal Header Format
        doc
          .fillColor(COLORS.text)
          .font(currentBold)
          .fontSize(14)
          .text(bill.organization.name.toUpperCase(), margin, 20, {
            align: "center",
            width: contentWidth,
          });
        doc
          .font(currentFont)
          .fontSize(8)
          .text("Vegetable Commission Agent", margin, 35, {
            align: "center",
            width: contentWidth,
          });
        doc
          .fontSize(8)
          .text(
            `${bill.organization.address || ""} | +91 ${bill.organization.phone || ""}`,
            margin,
            45,
            { align: "center", width: contentWidth },
          );

        doc
          .moveTo(margin, 60)
          .lineTo(width - margin, 60)
          .strokeColor(COLORS.border)
          .dash(2, { space: 2 })
          .lineWidth(1)
          .stroke();
        doc.undash();

        doc
          .font(currentBold)
          .fontSize(10)
          .text(
            bill.type === "PURCHASE"
              ? t("purchaseBill", lang)
              : t("saleBill", lang),
            margin,
            65,
            { align: "center", width: contentWidth },
          );
        doc
          .font(currentFont)
          .fontSize(8)
          .text(`${t("billNo", lang)}: #${bill.billNumber}`, margin, 80);
        const formattedBillDate = new Date(bill.billDate).toLocaleDateString(
          lang === "en" ? "en-IN" : lang === "mr" ? "mr-IN" : "hi-IN",
          { day: "2-digit", month: "short", year: "numeric" },
        );
        doc.text(`${t("date", lang)}: ${formattedBillDate}`, margin, 90);

        doc
          .moveTo(margin, 105)
          .lineTo(width - margin, 105)
          .strokeColor(COLORS.border)
          .dash(2, { space: 2 })
          .lineWidth(1)
          .stroke();
        doc.undash();
      } else {
        // Standard Header Format
        doc
          .fillColor(COLORS.primary)
          .font(currentBold)
          .fontSize(22)
          .text(
            bill.organization.name.toUpperCase(),
            config?.logoBase64 ? 100 : margin,
            40,
          );

        doc
          .fillColor(COLORS.secondary)
          .font(currentFont)
          .fontSize(10)
          .text(
            "Vegetable Commission Agent & Wholesaler",
            config?.logoBase64 ? 100 : margin,
            65,
          );

        doc
          .fillColor(COLORS.muted)
          .fontSize(9)
          .text(
            `${bill.organization.address || ""} | +91 ${bill.organization.phone || ""}`,
            config?.logoBase64 ? 100 : margin,
            80,
          );

        // Right side Header (Bill Info)
        doc
          .fillColor(COLORS.primary)
          .font(currentBold)
          .fontSize(16)
          .text(
            bill.type === "PURCHASE"
              ? t("purchaseBill", lang)
              : t("saleBill", lang),
            margin,
            40,
            { align: "right", width: contentWidth },
          );

        doc
          .fillColor(COLORS.secondary)
          .font(currentFont)
          .fontSize(10)
          .text(`${t("billNo", lang)}: #${bill.billNumber}`, margin, 60, {
            align: "right",
            width: contentWidth,
          });

        const formattedBillDate = new Date(bill.billDate).toLocaleDateString(
          lang === "en" ? "en-IN" : lang === "mr" ? "mr-IN" : "hi-IN",
          { day: "2-digit", month: "short", year: "numeric" },
        );
        doc.text(`${t("date", lang)}: ${formattedBillDate}`, margin, 75, {
          align: "right",
          width: contentWidth,
        });

        // Divider
        doc
          .moveTo(margin, 110)
          .lineTo(width - margin, 110)
          .strokeColor(COLORS.border)
          .lineWidth(1)
          .stroke();
      }

      // 2. Party & Details Sections
      let currentY = 130;

      // Background for section titles
      doc.rect(margin, currentY, contentWidth, 20).fill("#f8fafc");
      doc
        .fillColor(COLORS.secondary)
        .font(currentBold)
        .fontSize(9)
        .text(
          bill.type === "PURCHASE"
            ? t("farmerDetails", lang)
            : t("customerDetails", lang),
          margin + 10,
          currentY + 6,
        );

      currentY += 30;
      const party = bill.type === "PURCHASE" ? bill.farmer : bill.customer;
      doc
        .fillColor(COLORS.text)
        .font(currentBold)
        .fontSize(12)
        .text(party?.name || "N/A", margin + 10, currentY);

      if (party?.mobile) {
        doc
          .fillColor(COLORS.secondary)
          .font(currentFont)
          .fontSize(10)
          .text(
            `${t("mobile", lang)}: +91 ${party.mobile}`,
            margin + 10,
            currentY + 15,
          );
      }
      if ((party as any)?.village) {
        doc
          .fillColor(COLORS.secondary)
          .font(currentFont)
          .fontSize(10)
          .text(
            `${t("village", lang)}: ${(party as any).village}`,
            margin + 200,
            currentY,
          );
      }

      // QR Code for Sales
      if (bill.type === "SALE" && config?.upiId) {
        const upiString = `upi://pay?pa=${config.upiId}&pn=${encodeURIComponent(bill.organization.name)}&am=${bill.netTotal}&cu=INR`;
        try {
          const qrDataUrl = await QRCode.toDataURL(upiString, {
            margin: 1,
            scale: 2,
          });
          const qrBuffer = Buffer.from(qrDataUrl.split(",")[1], "base64");
          doc.image(qrBuffer, width - margin - 80, currentY - 20, {
            width: 70,
          });
          doc
            .fontSize(7)
            .text(t("scanToPay", lang), width - margin - 80, currentY + 55, {
              width: 70,
              align: "center",
            });
        } catch (e) {}
      }

      currentY += 60;

      // 3. Items Table
      const tableTop = currentY;

      if (isThermal) {
        doc.fillColor(COLORS.secondary).font(currentBold).fontSize(8);

        let xPos = margin;
        doc.text("Item / Rate", xPos, tableTop);
        doc.text("Qty", xPos + 100, tableTop, { align: "right", width: 40 });
        doc.text("Total", width - margin - 50, tableTop, {
          align: "right",
          width: 50,
        });

        currentY = tableTop + 15;
        doc
          .moveTo(margin, currentY)
          .lineTo(width - margin, currentY)
          .strokeColor(COLORS.border)
          .dash(2, { space: 2 })
          .lineWidth(0.5)
          .stroke();
        doc.undash();
        currentY += 5;

        doc.font(currentFont).fillColor(COLORS.text).fontSize(9);

        bill.items.forEach((item, i) => {
          if (currentY > doc.page.height - 100) {
            doc.addPage();
            currentY = 20;
          }

          const itemY = currentY;
          doc
            .font(currentBold)
            .text(`${i + 1}. ${item.item.name}`, margin, itemY);

          currentY += 12;
          doc.font(currentFont).fillColor(COLORS.secondary).fontSize(8);
          doc.text(
            `₹${Number(item.pricePerUnit).toLocaleString("en-IN")}`,
            margin + 10,
            currentY,
          );

          const qty =
            Number(item.quantityUnits) > 0
              ? Number(item.quantityUnits).toFixed(1) + "u"
              : Number(item.quantityKg).toFixed(1) + "kg";
          doc
            .fillColor(COLORS.text)
            .text(qty, margin + 100, currentY, { align: "right", width: 40 });

          doc
            .font(currentBold)
            .text(
              `₹${Number(item.total).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
              width - margin - 50,
              currentY,
              { align: "right", width: 50 },
            );

          currentY += 15;
          doc
            .moveTo(margin, currentY)
            .lineTo(width - margin, currentY)
            .strokeColor("#f1f5f9")
            .dash(1, { space: 2 })
            .lineWidth(0.5)
            .stroke();
          doc.undash();
          currentY += 5;
        });
      } else {
        doc
          .fillColor(COLORS.background)
          .rect(margin, tableTop, contentWidth, 25)
          .fill();
        doc.fillColor(COLORS.secondary).font(currentBold).fontSize(9);

        const cols = {
          sr: 30,
          desc: 180,
          units: 60,
          weight: 80,
          rate: 70,
          total: 80,
        };

        let xPos = margin + 10;
        doc.text(t("sr", lang), xPos, tableTop + 8);
        xPos += cols.sr;
        doc.text(t("itemDescription", lang), xPos, tableTop + 8);
        xPos += cols.desc;
        doc.text(t("units", lang), xPos, tableTop + 8, {
          align: "right",
          width: cols.units,
        });
        xPos += cols.units + 10;
        doc.text(t("weight", lang), xPos, tableTop + 8, {
          align: "right",
          width: cols.weight,
        });
        xPos += cols.weight + 10;
        doc.text(t("rate", lang), xPos, tableTop + 8, {
          align: "right",
          width: cols.rate,
        });
        xPos += cols.rate + 10;
        doc.text(t("total", lang), xPos, tableTop + 8, {
          align: "right",
          width: cols.total,
        });

        currentY = tableTop + 30;
        doc.font(currentFont).fillColor(COLORS.text).fontSize(10);

        bill.items.forEach((item, i) => {
          if (currentY > doc.page.height - 150) {
            doc.addPage();
            currentY = 50;
            // Redraw Table Header on new page
            doc
              .fillColor(COLORS.background)
              .rect(margin, currentY - 10, contentWidth, 25)
              .fill();
            doc.fillColor(COLORS.secondary).font(currentBold).fontSize(9);
            let hX = margin + 10;
            doc.text(t("sr", lang), hX, currentY - 2);
            hX += cols.sr;
            doc.text(t("itemDescription", lang), hX, currentY - 2);
            hX += cols.desc;
            doc.text(t("units", lang), hX, currentY - 2, {
              align: "right",
              width: cols.units,
            });
            hX += cols.units + 10;
            doc.text(t("weight", lang), hX, currentY - 2, {
              align: "right",
              width: cols.weight,
            });
            hX += cols.weight + 10;
            doc.text(t("rate", lang), hX, currentY - 2, {
              align: "right",
              width: cols.rate,
            });
            hX += cols.rate + 10;
            doc.text(t("total", lang), hX, currentY - 2, {
              align: "right",
              width: cols.total,
            });
            currentY += 25;
            doc.font(currentFont).fillColor(COLORS.text).fontSize(10);
          }

          const itemY = currentY;
          let curX = margin + 10;
          doc.text(`${i + 1}`, curX, itemY);
          curX += cols.sr;
          doc.text(item.item.name, curX, itemY);
          curX += cols.desc;
          doc.text(Number(item.quantityUnits).toFixed(1), curX, itemY, {
            align: "right",
            width: cols.units,
          });
          curX += cols.units + 10;
          doc.text(Number(item.quantityKg).toFixed(2), curX, itemY, {
            align: "right",
            width: cols.weight,
          });
          curX += cols.weight + 10;
          doc.text(
            `₹${Number(item.pricePerUnit).toLocaleString("en-IN")}`,
            curX,
            itemY,
            { align: "right", width: cols.rate },
          );
          curX += cols.rate + 10;
          doc.text(
            `₹${Number(item.total).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
            curX,
            itemY,
            { align: "right", width: cols.total },
          );

          currentY += 25;
          doc
            .moveTo(margin, currentY - 5)
            .lineTo(width - margin, currentY - 5)
            .strokeColor("#f1f5f9")
            .lineWidth(0.5)
            .stroke();
        });
      }

      // 4. Totals
      currentY += 10;
      const summaryX = isThermal ? margin : width - margin - 220;
      const summaryWidth = isThermal ? contentWidth : 220;

      const drawSummaryRow = (
        label: string,
        value: string,
        isTotal = false,
      ) => {
        doc
          .fillColor(isTotal ? COLORS.primary : COLORS.secondary)
          .font(isTotal ? currentBold : currentFont)
          .fontSize(isTotal ? (isThermal ? 10 : 12) : isThermal ? 9 : 10);
        doc.text(label, summaryX, currentY);
        doc.text(value, summaryX + (isThermal ? 50 : 100), currentY, {
          align: "right",
          width: isThermal ? contentWidth - 50 : 100,
        });
        currentY += isThermal ? 15 : 20;
      };

      drawSummaryRow(
        t("grossTotal", lang),
        `₹${Number(bill.grossTotal || bill.netTotal).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
      );

      if (bill.type === "PURCHASE") {
        const totalExp =
          Number(bill.labourCharges || 0) +
          Number(bill.freightCharges || 0) +
          Number(bill.advanceDeduction || 0) +
          Number(bill.othersAmount || 0);
        if (totalExp > 0) {
          drawSummaryRow(
            t("adjustments", lang),
            `- ₹${totalExp.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
          );
        }
      } else {
        if (Number(bill.taxAmount) > 0)
          drawSummaryRow(
            t("taxFee", lang),
            `+ ₹${Number(bill.taxAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
          );
        if (Number(bill.serviceChargeAmount) > 0)
          drawSummaryRow(
            t("commission", lang),
            `+ ₹${Number(bill.serviceChargeAmount).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
          );
      }

      if (isThermal) {
        doc
          .moveTo(margin, currentY)
          .lineTo(width - margin, currentY)
          .strokeColor(COLORS.border)
          .dash(2, { space: 2 })
          .lineWidth(1)
          .stroke();
        doc.undash();
        currentY += 5;
      }

      drawSummaryRow(
        t("netTotal", lang),
        `₹${Number(bill.netTotal).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
        true,
      );

      if (!isThermal) {
        doc
          .rect(summaryX - 10, currentY - 75, summaryWidth + 10, 85)
          .strokeColor(COLORS.border)
          .lineWidth(1)
          .stroke();
      }

      // Footer
      if (isThermal) {
        currentY += 10;
        doc
          .moveTo(margin, currentY)
          .lineTo(width - margin, currentY)
          .strokeColor(COLORS.border)
          .dash(2, { space: 2 })
          .lineWidth(1)
          .stroke();
        doc.undash();
        currentY += 10;
        const city = config?.city || "Latur";
        doc
          .font(currentFont)
          .fontSize(8)
          .fillColor(COLORS.muted)
          .text(t("jurisdiction", lang, { city }), margin, currentY, {
            align: "center",
            width: contentWidth,
          });
        currentY += 12;
        doc.fontSize(7).text(t("generatedBy", lang), margin, currentY, {
          align: "center",
          width: contentWidth,
        });
      } else {
        const city = config?.city || "Latur";
        doc
          .font(currentFont)
          .fontSize(8)
          .fillColor(COLORS.muted)
          .text(
            t("jurisdiction", lang, { city }),
            margin,
            doc.page.height - 60,
            {
              align: "left",
            },
          )
          .text(t("generatedBy", lang), 0, doc.page.height - 60, {
            align: "right",
            width: contentWidth + margin,
          });
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

export interface ReportData {
  title: string;
  startDate?: string;
  endDate?: string;
  columns: {
    key: string;
    label: string;
    align?: "left" | "right" | "center";
  }[];
  data: any[];
  summaryItems?: { label: string; value: string; isBold?: boolean }[];
  dailySummary?: {
    trade: { label: string; value: string }[];
    cashFlow: { label: string; value: string }[];
  };
}

export async function generateReportPDF(
  report: ReportData,
  organization: Organization,
  config?: BusinessConfig | null,
  options: { pageSize?: string; lang?: string } = {},
): Promise<Buffer> {
  const pageSize = options.pageSize || config?.defaultPageSize || "A4";
  const lang = options.lang || "mr";
  const isHindiOrMarathi = lang === "mr" || lang === "hi";

  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: PAGE_SIZES[pageSize] || "A4",
        margin: 40,
        bufferPages: true,
      });

      const buffers: Buffer[] = [];
      doc.on("data", (chunk: any) => buffers.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(buffers)));
      doc.on("error", (err: any) => reject(err));

      // Register Essential Fonts
      try {
        if (fs.existsSync(FONTS.regular)) {
          doc.registerFont("Main", fs.readFileSync(FONTS.regular));
        }
        if (fs.existsSync(FONTS.bold)) {
          doc.registerFont("Main-Bold", fs.readFileSync(FONTS.bold));
        }
      } catch (fontErr) {
        console.error("Font registration failed:", fontErr);
      }

      const canUseMain = fs.existsSync(FONTS.regular);
      const canUseBold = fs.existsSync(FONTS.bold);

      const currentFont = canUseMain ? "Main" : "Helvetica";
      const currentBold = canUseBold ? "Main-Bold" : "Helvetica-Bold";

      const width = doc.page.width;
      const margin = 40;
      const contentWidth = width - margin * 2;

      // Header
      if (config?.logoBase64) {
        try {
          const base64Data =
            config.logoBase64.split(",")[1] || config.logoBase64;
          const logoBuffer = Buffer.from(base64Data, "base64");
          doc.image(logoBuffer, margin, 35, { width: 40 });
        } catch (e) {}
      }

      doc
        .fillColor(COLORS.primary)
        .font(currentBold)
        .fontSize(18)
        .text(
          organization.name.toUpperCase(),
          config?.logoBase64 ? 90 : margin,
          40,
        );

      doc
        .fillColor(COLORS.secondary)
        .font(currentFont)
        .fontSize(12)
        .text(t(report.title, lang), config?.logoBase64 ? 90 : margin, 62);

      if (report.startDate) {
        const startStr = new Date(report.startDate).toLocaleDateString(
          lang === "en" ? "en-IN" : lang === "mr" ? "mr-IN" : "hi-IN",
        );
        const endStr = new Date(report.endDate || "").toLocaleDateString(
          lang === "en" ? "en-IN" : lang === "mr" ? "mr-IN" : "hi-IN",
        );
        doc
          .fillColor(COLORS.muted)
          .fontSize(9)
          .text(
            `${t("reportPeriod", lang)}: ${startStr} - ${endStr}`,
            config?.logoBase64 ? 90 : margin,
            77,
          );
      }

      doc
        .moveTo(margin, 100)
        .lineTo(width - margin, 100)
        .strokeColor(COLORS.primary)
        .lineWidth(2)
        .stroke();

      let currentY = 120;

      // Summary Boxes
      if (report.summaryItems && report.summaryItems.length > 0) {
        const boxCount = Math.min(report.summaryItems.length, 4);
        const boxWidth = (contentWidth - (boxCount - 1) * 10) / boxCount;
        let boxX = margin;
        report.summaryItems.forEach((item, idx) => {
          if (idx < 4) {
            doc
              .rect(boxX, currentY, boxWidth, 45)
              .fillAndStroke("#f8fafc", COLORS.border);
            // Translate common labels like "Total Amount" if found
            const translatedLabel = t(item.label, lang);
            doc
              .fillColor(COLORS.secondary)
              .fontSize(7)
              .font(currentBold)
              .text(translatedLabel.toUpperCase(), boxX + 8, currentY + 10);
            doc
              .fillColor(item.isBold ? COLORS.primary : COLORS.text)
              .fontSize(12)
              .font(currentBold)
              .text(item.value, boxX + 8, currentY + 22, {
                width: boxWidth - 10,
              });
            boxX += boxWidth + 10;
          }
        });
        currentY += 65;
      }

      // Daily Summary (Trade & Cash Flow)
      if (report.dailySummary) {
        const sections = [
          { title: "Trade Summary", data: report.dailySummary.trade },
          { title: "Cash Flow & Expenses", data: report.dailySummary.cashFlow },
        ];

        sections.forEach((section) => {
          if (currentY > doc.page.height - 150) {
            doc.addPage();
            currentY = 50;
          }

          const translatedTitle = t(section.title, lang);
          doc
            .fillColor(COLORS.background)
            .rect(margin, currentY, contentWidth, 20)
            .fill();
          doc
            .fillColor(COLORS.primary)
            .font(currentBold)
            .fontSize(10)
            .text(translatedTitle.toUpperCase(), margin + 10, currentY + 5);
          currentY += 25;

          section.data.forEach((item) => {
            const translatedItemLabel = t(item.label, lang);
            doc
              .fillColor(COLORS.secondary)
              .font(currentFont)
              .fontSize(9)
              .text(translatedItemLabel, margin + 20, currentY);
            doc
              .fillColor(COLORS.text)
              .font(currentBold)
              .fontSize(9)
              .text(item.value, margin + 200, currentY, {
                align: "right",
                width: contentWidth - 210,
              });
            currentY += 18;
          });
          currentY += 10;
        });
      }

      // Table
      if (report.data && report.data.length > 0) {
        const colWidth = contentWidth / report.columns.length;
        doc
          .fillColor("#f1f5f9")
          .rect(margin, currentY, contentWidth, 25)
          .fill();
        doc.fillColor(COLORS.secondary).font(currentBold).fontSize(8);

        report.columns.forEach((col, i) => {
          const translatedLabel = t(col.key || col.label, lang);
          doc.text(
            translatedLabel.toUpperCase(),
            margin + i * colWidth + 5,
            currentY + 8,
            { width: colWidth - 10, align: col.align || "left" },
          );
        });

        currentY += 30;
        doc.font(currentFont).fillColor(COLORS.text).fontSize(8);

        report.data.forEach((row) => {
          if (currentY > doc.page.height - 80) {
            doc.addPage();
            currentY = 50;
          }
          report.columns.forEach((col, i) => {
            const val = String(row[col.key] || "-");
            doc.text(val, margin + i * colWidth + 5, currentY, {
              width: colWidth - 10,
              align: col.align || "left",
            });
          });
          currentY += 20;
          doc
            .moveTo(margin, currentY - 5)
            .lineTo(width - margin, currentY - 5)
            .strokeColor("#f1f5f9")
            .lineWidth(0.5)
            .stroke();
        });
      }

      // Footer
      const generatedOnStr = new Date().toLocaleString(
        lang === "en" ? "en-IN" : lang === "mr" ? "mr-IN" : "hi-IN",
      );
      doc
        .fontSize(8)
        .fillColor(COLORS.muted)
        .text(
          `${t("generatedOn", lang)}: ${generatedOnStr} | Mandi ERP Premium`,
          margin,
          doc.page.height - 50,
          { align: "center", width: contentWidth },
        );

      doc.end();
    } catch (e) {
      reject(e);
    }
  });
}
