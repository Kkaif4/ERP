"use client";

/**
 * Utility to generate a print-friendly window with consistent styling.
 * @param title - The title of the document (appears in the PDF filename/tab)
 * @param htmlContent - The inner HTML of the report body
 */
/**
 * Utility to download or print a PDF from a given API URL with optional parameters.
 * @param url - The base API endpoint
 * @param filename - The desired filename
 * @param options - pageSize and lang preferences
 */
export async function downloadPDF(
    url: string,
    filename: string,
    options: { pageSize?: string; lang?: string } = {}
) {
    const fullUrl = appendParams(url, { ...options, inline: "false" });
    try {
        const response = await fetch(fullUrl);
        if (!response.ok) throw new Error("Failed to download PDF");

        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = blobUrl;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(blobUrl);
        document.body.removeChild(a);
    } catch (error) {
        console.error("PDF Download Error:", error);
    }
}

/**
 * Directly triggers the system print dialog for the generated PDF.
 */
export async function printPDF(
    url: string,
    options: { pageSize?: string; lang?: string } = {}
) {
    const fullUrl = appendParams(url, { ...options, inline: "true", print: "true" });
    try {
        const response = await fetch(fullUrl);
        if (!response.ok) throw new Error("Failed to fetch PDF for printing");

        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);

        const iframe = document.createElement("iframe");
        iframe.style.display = "none";
        iframe.src = blobUrl;
        document.body.appendChild(iframe);

        iframe.onload = () => {
            // Small delay to ensure PDF is rendered in the iframe before printing
            setTimeout(() => {
                iframe.contentWindow?.focus();
                iframe.contentWindow?.print();
            }, 500);

            // Wait longer before cleaning up to ensure print dialog is handled
            setTimeout(() => {
                window.URL.revokeObjectURL(blobUrl);
                document.body.removeChild(iframe);
            }, 10000);
        };
    } catch (error) {
        console.error("PDF Print Error:", error);
    }
}

function appendParams(url: string, params: Record<string, string | undefined>): string {
    const urlObj = new URL(url, window.location.origin);
    Object.entries(params).forEach(([key, val]) => {
        if (val) urlObj.searchParams.set(key, val);
    });
    return urlObj.toString();
}
