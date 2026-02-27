"use client";

/**
 * Utility to generate a print-friendly window with consistent styling.
 * @param title - The title of the document (appears in the PDF filename/tab)
 * @param htmlContent - The inner HTML of the report body
 */
export function openPrintWindow(title: string, htmlContent: string) {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
        alert("Please allow popups to download/print reports.");
        return;
    }

    const fullHtml = `
        <!DOCTYPE html>
        <html>
        <head>
            <title>${title} - Preview</title>
            <style>
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
                .preview-header {
                    position: sticky;
                    top: 0;
                    left: 0;
                    right: 0;
                    background: #15803d;
                    color: white;
                    padding: 15px 40px;
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    z-index: 1000;
                    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
                }
                .preview-header h2 {
                    margin: 0;
                    font-size: 16px;
                    font-weight: 800;
                    letter-spacing: 0.05em;
                }
                .print-btn {
                    background: white;
                    color: #15803d;
                    border: none;
                    padding: 10px 24px;
                    border-radius: 8px;
                    font-weight: 800;
                    font-size: 13px;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .print-btn:hover {
                    background: #f0fdf4;
                    transform: translateY(-1px);
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
                    .no-print, .preview-header { display: none !important; }
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
            </style>
        </head>
        <body>
            <div class="preview-header">
                <h2>REPORT PREVIEW</h2>
                <button onclick="cleanAndPrint()" class="print-btn">PRINT REPORT</button>
            </div>

            <div class="print-container" id="printable-content">
                <div class="report-header">
                    <div class="brand">
                        <div class="logo-placeholder"></div>
                        <div>
                            <p class="brand-name">Mandi ERP</p>
                            <p style="margin:0; font-size:10px; color:#666;">PREMIUM ENTERPRISE SOLUTION</p>
                        </div>
                    </div>
                    <div class="report-title-section">
                        <h1>${title}</h1>
                        <div class="report-meta">
                            Generated on: ${new Date().toLocaleString()}
                        </div>
                    </div>
                </div>

                ${htmlContent}

                <div class="print-footer">
                    &copy; 2026 Mandi ERP. Internal and Confidential.
                </div>
            </div>

            <script>
                function cleanAndPrint() {
                    const content = document.getElementById('printable-content').innerHTML;
                    const style = document.head.querySelector('style').innerHTML;
                    
                    const printWin = window.open('', '_blank');
                    printWin.document.write('<!DOCTYPE html><html><head><title>${title}</title><style>' + style + '</style></head><body>' + content + '</body></html>');
                    printWin.document.close();
                    
                    // Small delay to ensure styles are loaded in the new window
                    setTimeout(() => {
                        printWin.print();
                        // Optional: printWin.close() after print? 
                        // Users usually prefer closing it themselves.
                    }, 500);
                }
            </script>
        </body>
        </html>
    `;

    printWindow.document.write(fullHtml);
    printWindow.document.close();
}
