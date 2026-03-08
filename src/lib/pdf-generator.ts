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
  vehicleAgent?: {
    id: string;
    name: string;
    vehicleNumber?: string | null;
  } | null;
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
    vehicleAgent: "Transport",
    munimRef: "Munim Ref",
    vehicleagentreport: "Vehicle Agent Report",
    agentname: "Agent Name",
    vehiclenumber: "Vehicle Number",
    totalbillamount: "Total Bill Amount",
    totalbills: "Total Bills",
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
    vehicleAgent: "वाहन प्रतिनिधी",
    munimRef: "मुनिम संदर्भ",
    vehicleagentreport: "वाहन प्रतिनिधी अहवाल",
    agentname: "प्रतिनिधीचे नाव",
    vehiclenumber: "वाहन क्रमांक",
    totalbillamount: "एकूण बिल रक्कम",
    totalbills: "एकूण बिले",
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
    vehicleAgent: "वाहन एजेंट",
    munimRef: "मुनीम संदर्भ",
    vehicleagentreport: "वाहन एजेंट रिपोर्ट",
    agentname: "एजेंट का नाम",
    vehiclenumber: "वाहन नंबर",
    totalbillamount: "कुल बिल राशि",
    totalbills: "कुल बिल",
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
  const isThermal = pageSize.startsWith("THERMAL");

  return new Promise(async (resolve, reject) => {
    try {
      // Calculate dynamic exact height for thermal
      let docSize: any = PAGE_SIZES[pageSize] || "A4";
      if (isThermal) {
        // Precise dynamic height calculation
        const tempDoc = new PDFDocument({
          size: [PAGE_SIZES[pageSize], 2000],
          margin: 10,
        });
        try {
          if (fs.existsSync(FONTS.regular))
            tempDoc.registerFont("Main", fs.readFileSync(FONTS.regular));
          tempDoc
            .font(fs.existsSync(FONTS.regular) ? "Main" : "Helvetica")
            .fontSize(9);
        } catch (e) {}

        const is58 = pageSize === "THERMAL_58";
        const cwItem = is58 ? 65 : 100;

        let exactHeight = 110; // Header and business info
        exactHeight += 40; // Party details

        if (bill.type === "SALE" && config?.upiId) exactHeight += 110; // QR section

        exactHeight += 30; // Table header

        bill.items.forEach((item) => {
          const itemName = item.item.name;
          const titleHeight = tempDoc.heightOfString(itemName, {
            width: cwItem,
          });
          exactHeight += Math.max(titleHeight, 10) + 8; // Item row height + padding
        });

        exactHeight += 120; // Totals section (increased for safety)
        exactHeight += 60; // Footer
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
          .fontSize(9)
          .text("Vegetable Commission Agent", margin, 35, {
            align: "center",
            width: contentWidth,
          });
        doc
          .fontSize(9)
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
          .fontSize(9)
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
          .fontSize(9)
          .text(`${t("billNo", lang)}: #${bill.billNumber}`, margin, 80);
        const formattedBillDate = new Date(bill.billDate).toLocaleDateString(
          lang === "en" ? "en-IN" : lang === "mr" ? "mr-IN" : "hi-IN",
          { day: "2-digit", month: "short", year: "numeric" },
        );
        doc.text(`${t("date", lang)}: ${formattedBillDate}`, margin, 94);
        if (bill.munimRef) {
          doc.text(`${t("munimRef", lang)}: #${bill.munimRef}`, margin, 108);
        }

        doc
          .moveTo(margin, 105)
          .lineTo(width - margin, 105)
          .strokeColor(COLORS.border)
          .dash(2, { space: 2 })
          .lineWidth(1)
          .stroke();
        doc.undash();
      } else {
        // Standard Header Format - Centered (Matching UI)
        doc
          .fillColor(COLORS.text)
          .font(currentBold)
          .fontSize(28)
          .text(bill.organization.name.toUpperCase(), margin, 40, {
            align: "center",
            width: contentWidth,
            characterSpacing: 1,
          });

        let headerY = 70;
        if (bill.organization.address) {
          doc
            .fillColor(COLORS.text)
            .font(currentBold)
            .fontSize(10)
            .text(bill.organization.address, margin, headerY, {
              align: "center",
              width: contentWidth,
            });
          headerY += 14;
        }

        if (bill.organization.phone) {
          doc
            .fillColor(COLORS.text)
            .font(currentFont)
            .fontSize(9)
            .text(`Ph: +91 ${bill.organization.phone}`, margin, headerY, {
              align: "center",
              width: contentWidth,
            });
        }
      }

      // 2. Party & Details Sections
      let currentY = 130;

      if (isThermal) {
        // Single column layout for Thermal to save space
        const party = bill.type === "PURCHASE" ? bill.farmer : bill.customer;
        doc
          .fillColor(COLORS.secondary)
          .font(currentBold)
          .fontSize(8)
          .text(
            bill.type === "PURCHASE"
              ? t("farmerDetails", lang)
              : t("customerDetails", lang),
            margin,
            currentY,
          );

        currentY += 12;
        doc
          .fillColor(COLORS.text)
          .font(currentBold)
          .fontSize(9)
          .text(party?.name || "N/A", margin, currentY);

        currentY += 12;
        doc.font(currentFont).fontSize(9).fillColor(COLORS.secondary);

        if (party?.mobile) {
          doc.text(
            `${t("mobile", lang)}: +91 ${party.mobile}`,
            margin,
            currentY,
          );
          currentY += 12;
        }
        if ((party as any)?.village) {
          doc.text(
            `${t("village", lang)}: ${(party as any).village}`,
            margin,
            currentY,
          );
          currentY += 12;
        }

        if (bill.type === "PURCHASE" && bill.vehicleAgent) {
          doc
            .fillColor(COLORS.secondary)
            .font(currentBold)
            .fontSize(8)
            .text(t("vehicleAgent", lang), margin, currentY);
          currentY += 12;
          doc
            .fillColor(COLORS.text)
            .font(currentBold)
            .fontSize(9)
            .text(
              `${bill.vehicleAgent.name}${bill.vehicleAgent.vehicleNumber ? ` (${bill.vehicleAgent.vehicleNumber})` : ""}`,
              margin,
              currentY,
            );
          currentY += 12;
        }
      } else {
        // Bordered Party & Details Sections (Excel Look)
        const gridTop = currentY;
        const gridHeight = 100;
        const colWidth = contentWidth / 2;

        // Outer Border
        doc
          .lineWidth(1.5)
          .rect(margin, gridTop, contentWidth, gridHeight)
          .stroke(COLORS.text);

        // Vertical Divider
        doc
          .lineWidth(1)
          .moveTo(margin + colWidth, gridTop)
          .lineTo(margin + colWidth, gridTop + gridHeight)
          .stroke(COLORS.text);

        // Row Dividers in Right Cell
        const rowH = gridHeight / 4;
        for (let i = 1; i < 4; i++) {
          doc
            .moveTo(margin + colWidth, gridTop + i * rowH)
            .lineTo(margin + contentWidth, gridTop + i * rowH)
            .stroke(COLORS.text);
        }

        // Left Cell Content: Party Info
        const partyData =
          bill.type === "PURCHASE" ? bill.farmer : bill.customer;
        doc
          .fillColor(COLORS.secondary)
          .font(currentBold)
          .fontSize(8)
          .text(
            (bill.type === "PURCHASE"
              ? "Farmer Information:"
              : "Customer Information:"
            ).toUpperCase(),
            margin + 10,
            gridTop + 8,
          );

        let partyMetaY = gridTop + 25;
        const drawPartyRow = (label: string, value: string) => {
          doc.fillColor(COLORS.secondary).font(currentBold).fontSize(9);
          doc.text(label, margin + 10, partyMetaY);
          doc
            .fillColor(COLORS.text)
            .text(value, margin + 80, partyMetaY, { width: colWidth - 90 });
          partyMetaY += 15;
        };

        drawPartyRow("Name:", partyData?.name?.toUpperCase() || "N/A");
        drawPartyRow("Mobile:", partyData?.mobile || "---");
        drawPartyRow(
          "Address:",
          (
            partyData?.address ||
            (bill.type === "PURCHASE" ? (bill.farmer as any)?.village : "") ||
            "---"
          ).toUpperCase(),
        );

        // Right Cell Content: Bill Info Grid
        const billInfo = [
          { label: "Bill Number", value: `#${bill.billNumber}` },
          {
            label: "Date",
            value: new Date(bill.billDate).toLocaleDateString(
              lang === "en" ? "en-IN" : lang === "mr" ? "mr-IN" : "hi-IN",
              { day: "2-digit", month: "short", year: "numeric" },
            ),
          },
          { label: "Munim Ref", value: bill.munimRef || "---" },
          {
            label: "Vehicle No.",
            value: bill.vehicleAgent?.vehicleNumber || "---",
          },
        ];

        billInfo.forEach((info, i) => {
          const y = gridTop + i * rowH;
          // Label BG
          doc
            .fillColor("#f9fafb")
            .rect(margin + colWidth + 1, y + 1, 80, rowH - 2)
            .fill();

          doc
            .fillColor(COLORS.text)
            .font(currentBold)
            .fontSize(9)
            .text(info.label, margin + colWidth + 8, y + (rowH - 9) / 2);

          doc
            .font(currentBold)
            .fontSize(10)
            .text(info.value, margin + colWidth + 90, y + (rowH - 10) / 2, {
              align: "right",
              width: colWidth - 100,
            });
        });

        currentY = gridTop + gridHeight + 20;
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

          if (isThermal) {
            // In thermal, we draw the QR centered and push Y down
            currentY += 50;
            doc.image(qrBuffer, (width - 70) / 2, currentY, { width: 70 });
            doc
              .font(currentFont)
              .fontSize(8)
              .text(t("scanToPay", lang), margin, currentY + 75, {
                align: "center",
                width: contentWidth,
              });
            currentY += 80;
          } else {
            doc.image(qrBuffer, width - margin - 80, currentY - 20, {
              width: 70,
            });
            doc
              .font(currentFont)
              .fontSize(7)
              .text(t("scanToPay", lang), width - margin - 80, currentY + 55, {
                width: 70,
                align: "center",
              });
          }
        } catch (e) {}
      }

      currentY += isThermal ? 20 : 60;

      // 3. Items Table
      const tableTop = currentY;

      if (isThermal) {
        doc.fillColor(COLORS.secondary).font(currentBold).fontSize(8);

        const is58 = pageSize === "THERMAL_58";
        const cwItem = is58 ? 65 : 100;
        const cwUnit = is58 ? 23 : 30;
        const cwKg = is58 ? 23 : 30;
        const cwPrice = is58 ? 33 : 46;

        doc.font(currentBold).fontSize(9);
        doc.text(t("item", lang), margin, tableTop, { width: cwItem });
        doc.text(t("units", lang), margin + cwItem, tableTop, {
          align: "right",
          width: cwUnit,
        });
        doc.text(t("kg", lang), margin + cwItem + cwUnit, tableTop, {
          align: "right",
          width: cwKg,
        });
        doc.text(t("price", lang), margin + cwItem + cwUnit + cwKg, tableTop, {
          align: "right",
          width: cwPrice,
        });

        currentY = tableTop + 25;
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
          const is58 = pageSize === "THERMAL_58";
          const cwItem = is58 ? 65 : 100;
          const cwUnit = is58 ? 23 : 30;
          const cwKg = is58 ? 23 : 30;
          const cwPrice = is58 ? 33 : 46;

          if (currentY > doc.page.height - 100) {
            doc.addPage();
            currentY = 20;
          }

          const itemY = currentY;
          const itemName = `${i + 1}. ${item.item.name}`;
          const titleHeight = doc.heightOfString(itemName, { width: cwItem });

          doc
            .font(currentFont)
            .fontSize(is58 ? 8 : 9)
            .text(itemName, margin, itemY, { width: cwItem });

          doc
            .fontSize(9)
            .fillColor(COLORS.text)
            .text(
              Number(item.quantityUnits).toFixed(1),
              margin + cwItem,
              itemY,
              {
                align: "right",
                width: cwUnit,
              },
            );

          doc.text(
            Number(item.quantityKg).toFixed(1),
            margin + cwItem + cwUnit,
            itemY,
            {
              align: "right",
              width: cwKg,
            },
          );

          doc
            .font(currentBold)
            .text(
              Number(item.pricePerUnit).toLocaleString("en-IN"),
              margin + cwItem + cwUnit + cwKg,
              itemY,
              { align: "right", width: cwPrice },
            );

          currentY += Math.max(titleHeight, 10) + 8;
          doc
            .moveTo(margin, currentY - 4)
            .lineTo(width - margin, currentY - 4)
            .strokeColor("#f1f5f9")
            .dash(1, { space: 2 })
            .lineWidth(0.5)
            .stroke();
          doc.undash();
        });
      } else {
        // Excel Table Look
        const cols = {
          sr: 35,
          desc: 215,
          kg: 65,
          unt: 65,
          rate: 65,
          amount: 70,
        };

        const tableHeaderBottom = tableTop + 25;
        const rowHeight = 22;
        const minRows = Math.max(bill.items.length, 5);
        const tableHeight = 25 + minRows * rowHeight + 25; // Header + Rows + Footer

        // Header Fill
        doc
          .fillColor("#f1f5f9")
          .rect(margin, tableTop, contentWidth, 25)
          .fill();

        // Outer Border for Table
        doc
          .lineWidth(1.5)
          .rect(margin, tableTop, contentWidth, tableHeight)
          .stroke(COLORS.text);

        // Header Text & Dividers
        doc.fillColor(COLORS.text).font(currentBold).fontSize(9);
        let xOff = margin;

        const drawHeaderCol = (
          label: string,
          width: number,
          align: "left" | "right" | "center" = "left",
        ) => {
          doc.text(label, xOff, tableTop + 8, { width: width, align: align });
          xOff += width;
          if (xOff < margin + contentWidth) {
            doc
              .lineWidth(1)
              .moveTo(xOff, tableTop)
              .lineTo(xOff, tableTop + tableHeight)
              .stroke(COLORS.text);
          }
        };

        drawHeaderCol("SI", cols.sr, "center");
        drawHeaderCol("Item Description", cols.desc);
        drawHeaderCol("Qty (Kg)", cols.kg, "center");
        drawHeaderCol("Qty (Unt)", cols.unt, "center");
        drawHeaderCol("Rate", cols.rate, "right");
        drawHeaderCol("Amount", cols.amount, "right");

        // Horizontal line after header
        doc
          .moveTo(margin, tableHeaderBottom)
          .lineTo(margin + contentWidth, tableHeaderBottom)
          .stroke(COLORS.text);

        currentY = tableHeaderBottom;
        doc.font(currentFont).fillColor(COLORS.text).fontSize(10);

        bill.items.forEach((item, i) => {
          if (currentY + rowHeight > doc.page.height - 100) {
            doc.addPage();
            currentY = 50;
          }

          const itemY = currentY;
          let curX = margin;

          doc.text(`${i + 1}`, curX, itemY + 6, {
            width: cols.sr,
            align: "center",
          });
          curX += cols.sr;
          doc.text(item.item.name.toUpperCase(), curX + 5, itemY + 6, {
            width: cols.desc - 10,
          });
          curX += cols.desc;
          doc.text(Number(item.quantityKg).toFixed(2), curX, itemY + 6, {
            width: cols.kg,
            align: "center",
          });
          curX += cols.kg;
          doc.text(Number(item.quantityUnits).toFixed(1), curX, itemY + 6, {
            width: cols.unt,
            align: "center",
          });
          curX += cols.unt;
          doc.text(Number(item.pricePerUnit).toFixed(2), curX, itemY + 6, {
            width: cols.rate,
            align: "right",
          });
          curX += cols.rate;
          doc.text(
            Number(item.total).toLocaleString("en-IN", {
              minimumFractionDigits: 2,
            }),
            curX - 5,
            itemY + 6,
            { width: cols.amount, align: "right" },
          );

          currentY += rowHeight;
          if (i < bill.items.length - 1 || minRows > bill.items.length) {
            doc
              .moveTo(margin, currentY)
              .lineTo(margin + contentWidth, currentY)
              .stroke(COLORS.text);
          }
        });

        // Fill empty rows if needed
        for (let i = bill.items.length; i < minRows; i++) {
          if (i > bill.items.length) {
            currentY += rowHeight;
          }
          if (i < minRows - 1) {
            doc
              .moveTo(margin, currentY + rowHeight)
              .lineTo(margin + contentWidth, currentY + rowHeight)
              .stroke(COLORS.text);
          }
        }

        // Subtotal Footer Row in Table
        const footerY = tableTop + tableHeight - 25;
        doc
          .moveTo(margin, footerY)
          .lineTo(margin + contentWidth, footerY)
          .stroke(COLORS.text);
        doc
          .fillColor("#f9fafb")
          .rect(margin + 1, footerY + 1, contentWidth - 2, 23)
          .fill();

        doc.fillColor(COLORS.text).font(currentBold).fontSize(10);
        doc.text("SUBTOTALS", margin, footerY + 7, {
          width: cols.sr + cols.desc,
          align: "right",
        });

        const totals = bill.items.reduce(
          (acc, item) => ({
            weight: acc.weight + Number(item.quantityKg),
            units: acc.units + Number(item.quantityUnits),
            total: acc.total + Number(item.total),
          }),
          { weight: 0, units: 0, total: 0 },
        );

        doc.text(
          totals.weight.toFixed(2),
          margin + cols.sr + cols.desc,
          footerY + 7,
          { width: cols.kg, align: "center" },
        );
        doc.text(
          totals.units.toFixed(1),
          margin + cols.sr + cols.desc + cols.kg,
          footerY + 7,
          { width: cols.unt, align: "center" },
        );
        doc.text(
          `₹${totals.total.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
          margin + contentWidth - cols.amount - 5,
          footerY + 7,
          { width: cols.amount, align: "right" },
        );

        currentY = tableTop + tableHeight + 20;
      }

      // 4. Totals & Adjustments (Split Section)
      currentY += 10;
      if (!isThermal) {
        const splitY = currentY;
        const leftWidth = contentWidth * 0.55;
        const rightWidth = contentWidth * 0.45;
        const sectionHeight = 160;

        // Draw outer border for the footer section
        doc
          .lineWidth(1.5)
          .rect(margin, splitY, contentWidth, sectionHeight)
          .stroke(COLORS.text);

        // Vertical divider
        doc
          .lineWidth(1)
          .moveTo(margin + leftWidth, splitY)
          .lineTo(margin + leftWidth, splitY + sectionHeight)
          .stroke(COLORS.text);

        // --- Left Side: Adjustments & QR ---
        let leftY = splitY + 10;
        doc
          .fillColor(COLORS.text)
          .font(currentBold)
          .fontSize(10)
          .text("ADJUSTMENTS & CHARGES:", margin + 12, leftY);
        leftY += 20;

        const leftColX = margin + 12;
        const leftValX = margin + leftWidth - 12;

        const drawAdjRow = (
          label: string,
          value: string,
          isNegative = false,
        ) => {
          doc.fillColor(COLORS.secondary).font(currentFont).fontSize(9);
          doc.text(label, leftColX, leftY);
          doc
            .fillColor(COLORS.text)
            .font(currentBold)
            .text(value, leftColX, leftY, {
              align: "right",
              width: leftWidth - 24,
            });
          leftY += 15;
        };

        if (bill.type === "PURCHASE") {
          // Always show all farmer charges even if 0
          drawAdjRow(
            "Labour / Hamali",
            `- ₹${Number(bill.labourCharges || 0).toFixed(2)}`,
          );
          drawAdjRow(
            "Freight / Vehicle",
            `- ₹${Number(bill.freightCharges || 0).toFixed(2)}`,
          );
          drawAdjRow(
            "Advance Adjusted",
            `- ₹${Number(bill.advanceDeduction || 0).toFixed(2)}`,
          );
          drawAdjRow(
            `Others (${bill.othersNote || "Misc"})`,
            `- ₹${Number(bill.othersAmount || 0).toFixed(2)}`,
          );
        } else {
          if (Number(bill.taxAmount) > 0)
            drawAdjRow(
              "Market Fee / Tax",
              `+ ₹${Number(bill.taxAmount).toFixed(2)}`,
            );
          if (Number(bill.serviceChargeAmount) > 0)
            drawAdjRow(
              "Commission",
              `+ ₹${Number(bill.serviceChargeAmount).toFixed(2)}`,
            );
          if (
            Number(bill.taxAmount || 0) === 0 &&
            Number(bill.serviceChargeAmount || 0) === 0
          ) {
            doc
              .fillColor(COLORS.muted)
              .font(currentFont)
              .fontSize(9)
              .text("No extra charges.", leftColX, leftY);
          }
        }

        // UPI QR for Sales on Left Side
        if (bill.type === "SALE" && config?.upiId) {
          const upiString = `upi://pay?pa=${config.upiId}&pn=${encodeURIComponent(bill.organization.name)}&am=${bill.netTotal}&cu=INR`;
          try {
            // Reusing logic for QR but placing it in the left box
            const qrDataUrl = await QRCode.toDataURL(upiString, {
              margin: 1,
              scale: 2,
            });
            const qrBuffer = Buffer.from(qrDataUrl.split(",")[1], "base64");
            doc.image(qrBuffer, margin + 20, splitY + sectionHeight - 65, {
              width: 50,
            });
            doc
              .fillColor(COLORS.text)
              .font(currentBold)
              .fontSize(8)
              .text(
                "SCAN TO PAY VIA UPI",
                margin + 80,
                splitY + sectionHeight - 55,
              );
            doc
              .font(currentFont)
              .text(config.upiId, margin + 80, splitY + sectionHeight - 45);
          } catch (e) {}
        }

        // --- Right Side: Totals & Black Box ---
        let rightY = splitY;
        const rightColX = margin + leftWidth + 10;
        const rightValX = margin + contentWidth - 10;
        const rightCellWidth = rightWidth - 20;

        const drawTotalRow = (label: string, value: string, isNet = false) => {
          doc
            .fillColor(isNet ? COLORS.text : COLORS.secondary)
            .font(isNet ? currentBold : currentFont)
            .fontSize(isNet ? 11 : 9);
          doc.text(label.toUpperCase(), rightColX, rightY + 8);
          doc.text(value, rightColX, rightY + 8, {
            align: "right",
            width: rightCellWidth,
          });
          rightY += 28;
          doc
            .lineWidth(1)
            .moveTo(margin + leftWidth, rightY)
            .lineTo(margin + contentWidth, rightY)
            .stroke(COLORS.text);
        };

        const itemsSubtotal = bill.items.reduce(
          (acc, item) => acc + Number(item.total),
          0,
        );

        drawTotalRow(
          "Gross Subtotal",
          `₹${Number(bill.grossTotal || itemsSubtotal).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
        );

        const totalExp =
          bill.type === "PURCHASE"
            ? Number(bill.labourCharges || 0) +
              Number(bill.freightCharges || 0) +
              Number(bill.advanceDeduction || 0) +
              Number(bill.othersAmount || 0)
            : Number(bill.taxAmount || 0) +
              Number(bill.serviceChargeAmount || 0);

        drawTotalRow(
          bill.type === "PURCHASE" ? "Total Deductions" : "Total Additions",
          `${bill.type === "PURCHASE" ? "-" : "+"} ₹${totalExp.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
        );

        drawTotalRow(
          "Net Bill Total",
          `₹${Number(bill.netTotal).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
          true,
        );

        drawTotalRow(
          "Previous Balance",
          `₹${Number(bill.previousBalance).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
        );

        // FINAL BLACK BOX
        const blackBoxHeight = splitY + sectionHeight - rightY;
        doc
          .fillColor("#000000")
          .rect(
            margin + leftWidth + 1,
            rightY + 1,
            rightWidth - 2,
            blackBoxHeight - 2,
          )
          .fill();

        doc
          .fillColor("#ffffff")
          .font(currentBold)
          .fontSize(8)
          .text(
            "FINAL AMOUNT PAYABLE",
            margin + leftWidth,
            rightY + blackBoxHeight / 2 - 12,
            { align: "center", width: rightWidth },
          );

        const finalAmt =
          bill.finalAmount != null
            ? Number(bill.finalAmount)
            : Number(bill.previousBalance) + Number(bill.netTotal);
        doc
          .fontSize(18)
          .text(
            `₹${finalAmt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
            margin + leftWidth,
            rightY + blackBoxHeight / 2 + 2,
            { align: "center", width: rightWidth },
          );

        currentY = splitY + sectionHeight + 20;
      } else {
        // Thermal Mode Totals
        const summaryStartX = margin;
        const summaryWidth = contentWidth;

        const drawSummaryRow = (
          label: string,
          value: string,
          isTotal = false,
        ) => {
          doc
            .fillColor(COLORS.text)
            .font(isTotal ? currentBold : currentFont)
            .fontSize(isTotal ? 10 : 9);

          const labelWidth = contentWidth * 0.5;
          const valWidth = contentWidth * 0.5;
          const valX = summaryStartX + labelWidth;

          doc.text(label, summaryStartX, currentY, { width: labelWidth });
          doc.text(value, valX, currentY, {
            align: "right",
            width: valWidth,
          });
          currentY += 15;
        };

        const itemsSubtotal = bill.items.reduce(
          (acc, item) => acc + Number(item.total),
          0,
        );
        drawSummaryRow(
          t("grossTotal", lang),
          `₹${Number(bill.grossTotal || itemsSubtotal).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
        );

        if (bill.type === "PURCHASE") {
          const totalExp =
            Number(bill.labourCharges || 0) +
            Number(bill.freightCharges || 0) +
            Number(bill.advanceDeduction || 0) +
            Number(bill.othersAmount || 0);
          if (totalExp > 0)
            drawSummaryRow(
              t("adjustments", lang),
              `- ₹${totalExp.toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
            );
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

        doc
          .moveTo(margin, currentY)
          .lineTo(width - margin, currentY)
          .strokeColor(COLORS.border)
          .dash(2, { space: 2 })
          .lineWidth(1)
          .stroke();
        doc.undash();
        currentY += 5;

        drawSummaryRow(
          t("netTotal", lang),
          `₹${Number(bill.netTotal).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`,
          true,
        );
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
