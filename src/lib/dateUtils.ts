/**
 * Canonical date formatter — always outputs dd/mm/yyyy (en-IN locale).
 * Use this everywhere a date is displayed to the user.
 * Do NOT use this for bill print / PDF generation code.
 */
export const fmtDate = (d: string | Date): string =>
    new Date(d).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });

/**
 * Short date for mobile cards — dd/mm only.
 */
export const fmtDateShort = (d: string | Date): string =>
    new Date(d).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "2-digit",
    });
