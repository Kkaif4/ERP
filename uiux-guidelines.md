# 🟢 Architectural Emerald v2.0 — UI/UX Guidelines

**Framework:** Next.js + Tailwind CSS v4 + shadcn/ui  
**Status:** Reflects actual existing implementation. Do NOT replace inline styles with shadcn/Tailwind unless migrating a full page intentionally.

---

## 1. CSS Custom Properties (Design Tokens)

These legacy tokens are used **everywhere** in inline styles. Do not remove or rename them.

```css
/* globals.css :root — Legacy tokens in active use */
--text-main:     hsl(222 47% 11%)   /* #0f172a — all body/heading text */
--text-muted:    hsl(215 16% 47%)   /* #64748b — secondary/label text */
--primary-main:  hsl(142 72% 29%)   /* #15803d — Emerald (Farmers/Purchase) */
--primary-glow:  rgba(21,128,61,0.1)/* Shadow on emerald buttons */
--bg-main:       hsl(210 40% 98%)   /* #f8fafc — page background, skeleton bg */
--border-main:   hsl(214 32% 91%)   /* #e2e8f0 — card/input borders */
--surface-card:  #ffffff            /* Card background */
```

**New HSL tokens** (added for shadcn compatibility, safe to use in new components):

```css
--background: 210 40% 98%     --foreground: 222 47% 11%
--primary: 142 72% 29%        --primary-foreground: 0 0% 100%
--muted: 215 16% 47%          --muted-foreground: 215 25% 27%
--border: 214 32% 91%         --input: 214 32% 91%
--card: 0 0% 100%             --card-foreground: 222 47% 11%
--accent-sky: 199 89% 32%     /* #0369a1 — Customers/Sales */
--accent-violet: 263 83% 62%  /* #7c3aed — Payments/Ledger */
--accent-amber: 35 92% 37%    /* #b45309 — Warnings */
--accent-red: 0 72% 51%       /* #dc2626 — Danger */
```

---

## 2. Page-Level Color Contexts

Each section of the app uses a specific accent color for header bars, CTA buttons, icon badges, focus borders, and active filter tabs.

| Context | Hex | CSS Var | Pages |
|---|---|---|---|
| **Farmers / Purchase** | `#15803d` | `var(--primary-main)` | Farmers, Purchase Bills |
| **Customers / Sales** | `#0369a1` | `var(--accent-sky)` | Customers, Sale Bills |
| **Payments / Ledger** | `#7c3aed` | `var(--accent-violet)` | Payments, Items, Staff |
| **Expenses** | `#e11d48` | — (crimson) | Expenses |
| **Warnings / Pending** | `#b45309` | `var(--accent-amber)` | Balance owed, Reports |
| **Danger / Delete** | `#dc2626` | `var(--accent-red)` | Destructive actions |

**Icon badge background:** `rgba(R,G,B,0.08)` or `\`${color}18\`` (hex 10% opacity)

---

## 3. Date Format Standard

> **All dates displayed to the user MUST use `dd-mm-yyyy` format consistently.**

### ✅ Canonical `fmtDate` Function

Use this everywhere a date needs to be displayed in a table cell, card, or label:

```ts
const fmtDate = (d: string | Date) =>
  new Date(d).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
// Output → "04/03/2026" (en-IN uses dd/mm/yyyy separator)
// Or use manual: new Date(d).toLocaleDateString("en-GB") → "04/03/2026"
```

> **Critical bug found during audit:**  
> - `expenses/page.tsx` line 142: uses `{ day: "numeric", month: "short", year: "numeric" }` → outputs "4 Mar 2026" ❌  
> - `staff/page.tsx` line 193: uses `new Date(member.createdAt).toLocaleDateString()` (no args, browser locale) ❌  
> - `payments/page.tsx`: uses `{ day: "numeric", month: "short", year: "numeric" }` → outputs "4 Mar 2026" ❌  
>  
> **These pages need to be migrated to the canonical function above.**  
> **Do NOT touch bill print/PDF generation code** (`/api/reports/*/pdf`, `downloadPDF`, `printPDF` calls).

### Date Input Fields

All `<input type="date">` values are stored/sent in ISO format (`yyyy-mm-dd`), which is correct for APIs. Only the **displayed** value needs to be `dd-mm-yyyy`.

---

## 4. Sortable Date Columns

Every table with a Date column **must support click-to-sort**. Pattern:

```tsx
const [sortDir, setSortDir] = useState<"asc" | "desc">("desc"); // newest first by default

const sorted = [...data].sort((a, b) => {
  const diff = new Date(a.date).getTime() - new Date(b.date).getTime();
  return sortDir === "asc" ? diff : -diff;
});

// Table header cell:
<th
  onClick={() => setSortDir(d => d === "asc" ? "desc" : "asc")}
  style={{
    padding: "10px 20px", fontSize: "10px", fontWeight: 900,
    color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em",
    cursor: "pointer", userSelect: "none", whiteSpace: "nowrap",
  }}
>
  {t("common.date")}{" "}
  <span style={{ opacity: 0.5 }}>{sortDir === "asc" ? "↑" : "↓"}</span>
</th>
```

**Default sort order:** newest first (`"desc"`).  
**Scope:** Expenses table, Payments table, Bills table, Reports tables.

---

## 5. Date Range Filtering

Tables with date data must support a **From / To** date range filter. Place it in the toolbar row (same row as search input), to the right of the search bar.

```tsx
const [dateFrom, setDateFrom] = useState("");
const [dateTo, setDateTo] = useState("");

// Filter logic (client-side for now):
const filtered = data.filter(row => {
  const d = new Date(row.date).getTime();
  const from = dateFrom ? new Date(dateFrom).getTime() : 0;
  const to = dateTo ? new Date(dateTo + "T23:59:59").getTime() : Infinity;
  return d >= from && d <= to;
});

// UI (inside toolbar next to search):
<div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
  <input
    type="date"
    value={dateFrom}
    onChange={e => setDateFrom(e.target.value)}
    max={dateTo || undefined}
    style={{
      padding: "8px 12px", borderRadius: "10px",
      border: "1.5px solid var(--border-main)", fontSize: "12px",
      fontWeight: 700, backgroundColor: "#f8fafc", outline: "none",
      color: "var(--text-main)", cursor: "pointer",
    }}
  />
  <span style={{ fontSize: "12px", fontWeight: 700, color: "#94a3b8" }}>→</span>
  <input
    type="date"
    value={dateTo}
    onChange={e => setDateTo(e.target.value)}
    min={dateFrom || undefined}
    style={{
      padding: "8px 12px", borderRadius: "10px",
      border: "1.5px solid var(--border-main)", fontSize: "12px",
      fontWeight: 700, backgroundColor: "#f8fafc", outline: "none",
      color: "var(--text-main)", cursor: "pointer",
    }}
  />
  {(dateFrom || dateTo) && (
    <button
      onClick={() => { setDateFrom(""); setDateTo(""); }}
      style={{ padding: "6px 10px", borderRadius: "8px", border: "none",
        backgroundColor: "#f1f5f9", color: "#94a3b8", cursor: "pointer",
        fontSize: "11px", fontWeight: 800 }}
    >
      Clear
    </button>
  )}
</div>
```

**Scope:** Expenses, Payments, Bills list pages. **Do NOT** add to Items or Staff (no date column in their tables).

---

## 6. Section-by-Section Audit Notes

### Expenses (`/expenses`)
- **Color:** Crimson `#e11d48`
- **Table columns:** Date · Category · Payment Mode · Description · Amount · Actions
- **Date issue:** Uses `{ day: "numeric", month: "short" }` → migrate to `dd-mm-yyyy`
- **Missing:** Date range filter ← needs adding, Date column sort ← needs adding
- **Export:** PDF + CSV export buttons exist in toolbar (do not remove or modify)
- **Modal form:** Uses `type="date"` input correctly for entry

### Payments (`/payments`)
- **Color:** Violet `#7c3aed`
- **Table columns:** Date · Party · Mode · Bill Ref · Notes · Amount
- **Date issue:** Uses `{ day: "numeric", month: "short", year: "numeric" }` → migrate
- **Missing:** Date range filter ← needs adding, Date column sort ← needs adding
- **Mobile:** Has a separate mobile card list (`.pay-mobile`) — apply date fix there too
- **Tabs:** ALL / FARMER / CUSTOMER filter tabs use Violet for active state

### Items (`/items`)
- **Color:** Violet `#7c3aed`
- **Layout:** Card grid (`minmax(220px, 1fr)`) — no date column in UI
- **Date:** `createdAt` not displayed in card UI — no date fix needed
- **Special:** Active/Inactive toggle button per card (admin only)
- **Pricing mode badges:** 3 types with sky/amber/emerald color coding

### Staff (`/staff`)
- **Color:** Violet `#7c3aed`
- **Layout:** Card grid (`minmax(300px, 1fr)`)
- **Date issue:** Line 193 uses `new Date(member.createdAt).toLocaleDateString()` (no args) → migrate to `fmtDate`
- **No table** → no sort/filter needed, just fix the joined date display

### Reports (`/reports`, `/reports/financial`, `/reports/operational`, `/reports/insights`)
- **Color:** Amber `#b45309`
- **⚠️ Do NOT modify:** Any PDF generation code, `downloadPDF()` / `printPDF()` calls, or `/api/reports/*/pdf` API endpoints
- **Date inputs** on filter forms should use `type="date"` (correct), display as `dd-mm-yyyy`
- **Operational/Financial tables:** Apply date sort + date range filter pattern above

---

## 7. Typography (As Used in Production)

| Element | Inline Style | Notes |
|---|---|---|
| **Page H1** | `fontSize: "1.875rem", fontWeight: 900, letterSpacing: "-0.02em", color: "var(--text-main)"` | Every page top title |
| **Section H3** | `fontSize: "1.125rem", fontWeight: 900, letterSpacing: "-0.01em"` | Card/panel headers |
| **Table header** | `fontSize: "10px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em", color: "#94a3b8"` | All `<th>` cells |
| **Label / Badge** | `fontSize: "10–11px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em"` | Stat labels, form labels |
| **Body / Name** | `fontSize: "13–14px", fontWeight: 700–800, color: "var(--text-main)"` | Party names, amounts |
| **Supporting** | `fontSize: "12px", fontWeight: 600–700, color: "#64748b"` | Secondary info |
| **Amount (large)** | `fontSize: "1.875rem", fontWeight: 900, letterSpacing: "-0.02em"` | Stat values |

---

## 8. The `.premium-card` Class

All content containers use the `premium-card` CSS class. Always pair with inline style for padding.

```tsx
<div className="premium-card" style={{ padding: "1.75rem" }}>        {/* standard card */}
<div className="premium-card" style={{ overflow: "hidden" }}>         {/* table container */}
<div className="premium-card" style={{ padding: "1rem 1.25rem" }}>   {/* search bar */}
```

**Do NOT** replace `.premium-card` with shadcn `<Card>` on existing pages.

---

## 9. Page Header Pattern

```tsx
<div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
  <div>
    <h1 style={{ fontSize: "1.875rem", fontWeight: 900, color: "var(--text-main)", letterSpacing: "-0.02em", margin: 0, lineHeight: 1.2 }}>
      {title}
    </h1>
    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "6px" }}>
      <div style={{ height: "3px", width: "24px", backgroundColor: PAGE_COLOR, borderRadius: "2px" }} />
      <p style={{ margin: 0, fontSize: "11px", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.15em", display: "flex", alignItems: "center", gap: "6px" }}>
        <Clock size={12} /> {subtitle}
      </p>
    </div>
  </div>
  {/* CTA button */}
</div>
```

---

## 10. CTA Button Pattern

```tsx
<button
  style={{
    display: "inline-flex", alignItems: "center", gap: "8px",
    padding: "10px 20px", backgroundColor: PAGE_COLOR, color: "#fff",
    borderRadius: "12px", fontWeight: 800, fontSize: "14px",
    border: "none", cursor: "pointer",
    boxShadow: `0 8px 16px rgba(R,G,B,0.2)`,
    transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
    letterSpacing: "0.02em",
  }}
  onMouseEnter={e => { e.currentTarget.style.transform = "translateY(-2px)"; }}
  onMouseLeave={e => { e.currentTarget.style.transform = "translateY(0)"; }}
>
  <Plus size={16} strokeWidth={3} /> {label}
</button>
```

---

## 11. Search Input Pattern

```tsx
<div className="premium-card" style={{ padding: "1rem 1.25rem" }}>
  <div style={{ position: "relative" }}>
    <Search style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} size={18} />
    <input type="text"
      style={{ width: "100%", boxSizing: "border-box", padding: "12px 12px 12px 52px",
        backgroundColor: "#f8fafc", border: "1.5px solid var(--border-main)",
        borderRadius: "12px", fontSize: "14px", fontWeight: 700, outline: "none" }}
      onFocusCapture={e => { e.currentTarget.style.borderColor = PAGE_COLOR; e.currentTarget.style.backgroundColor = "#fff"; }}
      onBlurCapture={e => { e.currentTarget.style.borderColor = "var(--border-main)"; e.currentTarget.style.backgroundColor = "#f8fafc"; }}
    />
  </div>
</div>
```

---

## 12. Toolbar Row (Search + Date Range)

When a page has both search and date range filter, combine them in one row:

```tsx
<div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid #f1f5f9",
  display: "flex", gap: "1rem", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap" }}>
  {/* Left: search */}
  <div style={{ position: "relative", minWidth: "240px" }}>
    {/* search input */}
  </div>
  {/* Center/Right: date range */}
  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
    {/* from / to date inputs + clear button — see Section 5 */}
  </div>
  {/* Far right: export buttons (if any) */}
  <div style={{ display: "flex", gap: "8px" }}>
    {/* PDF / CSV buttons */}
  </div>
</div>
```

---

## 13. Data Table Pattern (Standard)

Standard tables used on legacy pages:

```tsx
<thead>
  <tr style={{ backgroundColor: "#f8fafc" }}>
    {/* Sortable date column */}
    <th onClick={toggleSort} style={{ padding: "10px 20px", fontSize: "10px", fontWeight: 900,
      color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em",
      cursor: "pointer", userSelect: "none" }}>
      DATE <span style={{ opacity: 0.5 }}>{sortDir === "asc" ? "↑" : "↓"}</span>
    </th>
    {/* Other columns — not sortable unless specified */}
  </tr>
</thead>
<tbody>
  <tr style={{ borderTop: "1px solid #f1f5f9", cursor: "pointer", transition: "background 0.1s" }}
    onMouseEnter={e => e.currentTarget.style.backgroundColor = "#fafafa"}
    onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}>
    <td style={{ padding: "14px 20px", fontSize: "12px", fontWeight: 700, color: "#64748b" }}>
      {fmtDate(row.date)}  {/* Always use canonical fmtDate */}
    </td>
  </tr>
</tbody>
```

---

## 13.1 Premium Table Pattern (shadcn/ui)

For all new implementation or refactored pages, use shadcn `Table` components with enhanced padding and heights for a "WOW" effect.

| Element | Class Name / Style | Notes |
|---|---|---|
| **TableHeader Row** | `bg-[#f8fafc] hover:bg-[#f8fafc]` | Subtle off-white header bg |
| **TableHead** | `h-14 px-8 text-[11px] font-black uppercase tracking-[0.2em] text-[#94a3b8]` | Taller header with muted, widely spaced labels |
| **TableRow** | `border-b border-[#f1f5f9] hover:bg-[#f8fafc] transition-colors group` | Smooth hover effect |
| **TableCell** | `px-8 py-5 text-[14px] font-bold text-[#1e293b] tabular-nums` | Body font for data cells |
| **Supporting Text**| `text-[12px] font-semibold text-[#64748b]/70` | Used for metadata (dates, prefixes) |
| **TableFooter** | `bg-[#fdfdfd] border-t-2 border-[#eee] font-black` | Bold, distinct footer |

### ✅ Visual Principles:
1. **Typographic Contrast**: Use "Label" style (`text-[11px] black uppercase`) for headers to distinguish from "Body" style (`text-[14px] bold`) data.
2. **Financial Alignment**: Amounts MUST be `text-right` with `tabular-nums`.
3. **Muted Currency**: The `₹` symbol should use "Supporting Text" style (muted) while the figure is "Body" style (bold).
4. **Breathability**: Maintain `py-5` and `px-8` (edge padding) for a premium feel.
5. **No Visual Noise**: Avoid `t("common.purchase")` strings like "COMMON.PURCHASE". Use stripped keys like "PURCHASE" or "SALE" in clean accent badges.

### ✅ Implementation Example (shadcn):

```tsx
<Table>
  <TableHeader>
    <TableRow className="bg-[#f8fafc] hover:bg-[#f8fafc]">
      <TableHead className="h-14 px-6 text-[11px] font-black uppercase tracking-[0.2em] text-[#94a3b8]">
        {t("common.date")}
      </TableHead>
      <TableHead className="h-14 px-6 text-right text-[11px] font-black uppercase tracking-[0.2em] text-[#94a3b8]">
        {t("common.amount")}
      </TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {data.map((row) => (
      <TableRow key={row.id} className="border-b border-[#f1f5f9] hover:bg-[#f8fafc] transition-colors">
        <TableCell className="px-6 py-5">{fmtDate(row.date)}</TableCell>
        <TableCell className="px-6 py-5 text-right font-bold tabular-nums">
          ₹{row.amount.toLocaleString("en-IN")}
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

---

## 14. Badge / Pill Patterns

```tsx
{/* Type badge (PURCHASE/SALE, FARMER/CUSTOMER) */}
<span style={{ padding: "4px 10px", borderRadius: "8px", fontSize: "10px", fontWeight: 900,
  textTransform: "uppercase", letterSpacing: "0.05em",
  backgroundColor: `rgba(R,G,B,0.08)`, color: PAGE_COLOR,
  border: `1px solid rgba(R,G,B,0.2)` }}>TYPE</span>

{/* Mode badge (CASH/UPI/BANK) */}
<span style={{ padding: "4px 10px", borderRadius: "7px", fontSize: "11px", fontWeight: 900,
  textTransform: "uppercase", letterSpacing: "0.05em",
  backgroundColor: "#f8fafc", color: "#64748b" }}>CASH</span>

{/* Status badge (Active/Inactive) */}
<div style={{ padding: "4px 10px", borderRadius: "8px", fontSize: "10px", fontWeight: 900,
  textTransform: "uppercase", letterSpacing: "0.05em",
  backgroundColor: isActive ? "rgba(16,185,129,0.1)" : "rgba(239,68,68,0.1)",
  color: isActive ? "#10b981" : "#ef4444" }}>
  {isActive ? "Active" : "Inactive"}
</div>
```

---

## 15. Modal (Existing Custom `<Modal>` Component)

The existing `src/components/ui/Modal.tsx` is used on all pages (expenses, items, staff, payments). Do NOT replace with shadcn Dialog.

```tsx
<Modal isOpen={isOpen} onClose={onClose} title="..." subtitle="..." icon={<Icon size={20} />} maxWidth="560px">
  {/* Form content */}
</Modal>
```

**Modal form input style:**

```css
.form-group input, .form-group select, .form-group textarea {
  padding: 12px 14px;
  background-color: #f8fafc;
  border: 1.5px solid var(--border-main);
  border-radius: 12px;
  font-size: 14px; font-weight: 700;
  outline: none; transition: all 0.2s;
}
.form-group input:focus { border-color: PAGE_COLOR; background-color: #fff; }
```

---

## 16. Internationalization (i18n) Standards

All user-facing text must be wrapped in the `t()` function from `@/lib/i18n`. This ensures the application remains accessible in English, Marathi, and Hindi.

### Core Principles
- **No Hardcoded Strings**: Strictly forbid hardcoded English strings in JSX.
- **Common Keys**: Use `t("common.date")`, `t("common.amount")`, `t("common.actions")`, etc., for recurring labels.
- **Dynamic Content**: Use interpolation for counts and totals, e.g., `t("expenses.subtitle", { count: n, total: sum })`.
- **Table Headers**: All table columns must use i18n keys.
- **Placeholders**: Input placeholders and button text must be internationalized.

### Usage in Components
```tsx
import { useTranslation } from "@/lib/i18n";

export function MyComponent() {
  const { t } = useTranslation();
  return (
    <TableHead>{t("common.date")}</TableHead>
  );
}
```

### Date Formatting
Always use `fmtDate` from `@/lib/dateUtils` which respects the standard `dd-mm-yyyy` display format across all languages.

---

## 17. Layout Rules

| Rule | Value |
|---|---|
| **Page root gap** | `display: "flex", flexDirection: "column", gap: "2rem"` |
| **Entity card grid** | `repeat(auto-fill, minmax(280px, 1fr)), gap: 1rem` |
| **Stat card grid** | `repeat(auto-fit, minmax(180–200px, 1fr)), gap: 1rem` |
| **Items grid** | `repeat(auto-fill, minmax(220px, 1fr)), gap: 1rem` |
| **Staff grid** | `repeat(auto-fill, minmax(300px, 1fr)), gap: 1.5rem` |
| **Mobile bottom padding** | Applied automatically by `AppShell` |

---

## 17. Skeleton / Loading Pattern

```tsx
<div className="premium-card" style={{ height: "220px", animation: "pulse 1.5s ease-in-out infinite", opacity: 0.5 }} />
// Required @keyframes in page's <style>:
// @keyframes pulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 0.8; } }
// @keyframes spin  { to { transform: rotate(360deg); } }
```

---

## 18. New Component Standards (New Pages Only)

When building new pages from scratch, use Tailwind + shadcn instead of inline styles:

| Old Pattern | New Standard |
|---|---|
| `.premium-card` + inline padding | `<Card>` from `@/components/ui/card.tsx` |
| Inline H1 w/ font-weight 900 | `className="text-3xl font-black tracking-tighter text-foreground"` |
| Manual header div | `<PageHeader>` from `@/components/ui/PageHeader.tsx` |
| Raw `<input>` with inline styles | `<Input>` from `@/components/ui/input.tsx` |
| Inline `<button>` with hover handlers | `<Button variant="primary">` from `@/components/ui/button.tsx` |

> **Rule:** On existing pages, keep inline styles as-is. Migrate only when rewriting an entire page.

---

## 19. Protected Code — Do Not Touch

The following must **never** be modified as part of UI/UX work:

- `src/lib/print.ts` — `downloadPDF()` and `printPDF()` functions
- `src/app/api/reports/*/pdf/route.ts` — All PDF generation API routes
- `src/components/reports/` — All report rendering components
- Bill print layout / print CSS (`@media print`) in any file


---

## 20. Mobile Responsiveness

This app is primarily used on mobile phones at agricultural markets (mandis). **Mobile-first** behaviour is required on every page.

### 20.1 Breakpoints

The app uses three breakpoints via CSS `@media` inside `<style>` blocks (since most layout is inline-styled):

| Name | Min-width | Usage |
|---|---|---|
| `sm` | `640px` | Stack → row for small controls |
| `md` | `768px` | Show desktop table headers, switch table ↔ card |
| `lg` | `1024px` | Show sidebar, hide bottom nav, expand grids |

### 20.2 Navigation — Mobile vs Desktop

| Element | Mobile (<1024px) | Desktop (≥1024px) |
|---|---|---|
| **Sidebar** | Hidden | Visible (`Sidebar.tsx`) |
| **Bottom Nav** | Fixed, 80px tall at bottom | Hidden (`lg:hidden` on `<nav>`) |
| **Top Header** | Shows "Mandi ERP" title | Shows user profile only |

`AppShell` automatically adds `pb-[calc(5rem+env(safe-area-inset-bottom,0px))]` on mobile so content clears the bottom nav. **Do not add manual bottom padding on individual pages.**

### 20.3 Page Layout — Mobile Stack

Every page root wrapper:
```tsx
// On mobile: single column stack
// On desktop: layout-container adds px-10
<div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
```

Page header CTA area must wrap on small screens:
```tsx
<div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between",
  flexWrap: "wrap",   {/* ← required — allows button to drop below title on narrow screens */}
  gap: "1rem" }}>
```

### 20.4 Card Grids — Auto-Responsive

Use `auto-fill` + `minmax` so grids collapse naturally without explicit breakpoints:

| Grid | Column definition | Behaviour |
|---|---|---|
| Entity cards (Farmers, Customers) | `repeat(auto-fill, minmax(280px, 1fr))` | 1 col @<600px, 2 col @>600px, 3+ col @>900px |
| Stat cards (Dashboard, Payments) | `repeat(auto-fit, minmax(200px, 1fr))` | 1 col @<420px, 2 col @>420px |
| Items | `repeat(auto-fill, minmax(220px, 1fr))` | 1 col @<460px |
| Staff | `repeat(auto-fill, minmax(300px, 1fr))` | 1 col @<640px, 2+ col @>640px |

**Never use fixed column counts** (`grid-cols-2`, `grid-cols-3`) on entity/stat grids — they break on small phones.

### 20.5 Tables — Dual View Pattern

Data tables (Payments, Expenses, Bills) **must not overflow on mobile.** Use the dual-view pattern:

```tsx
{/* Desktop table — hidden on mobile */}
<div className="pay-table-wrap" style={{ overflowX: "auto" }}>
  <table>...</table>
</div>

{/* Mobile cards — shown on mobile */}
<div className="pay-mobile">
  {data.map(row => (
    <div style={{ padding: "1rem 1.25rem", borderTop: "1px solid #f1f5f9",
      display: "flex", alignItems: "center", justifyContent: "space-between", gap: "0.75rem" }}>
      {/* Condensed card: avatar + name + date + amount */}
    </div>
  ))}
</div>

{/* Toggle CSS — required in page's <style> block */}
<style>{`
  .pay-table-wrap { display: block; }
  .pay-mobile     { display: none; }
  @media (max-width: 768px) {
    .pay-table-wrap { display: none; }
    .pay-mobile     { display: block; }
  }
`}</style>
```

**Mobile card content** for a transaction row:
- Left: 40×40 avatar badge (party initial) + name + date/mode
- Right: amount in page accent color + `>` chevron

### 20.6 Toolbar — Mobile Stacking

The toolbar row (search + date range + export buttons) must use `flexWrap: "wrap"`:

```tsx
<div style={{ padding: "1rem 1.5rem", borderBottom: "1px solid #f1f5f9",
  display: "flex", gap: "1rem", alignItems: "center",
  justifyContent: "space-between",
  flexWrap: "wrap" }}>           {/* ← stacks vertically on narrow screens */}
  {/* search — minWidth: "240px" so it holds width before wrapping */}
  {/* date range — hidden on mobile if space is tight, or placed below */}
  {/* export buttons — always visible */}
</div>
```

On very small screens (< 480px), the date range inputs can be moved into a collapsible filter row:
```tsx
const [showFilters, setShowFilters] = useState(false);
// Show a "Filter" button on mobile that toggles the date range inputs
```

### 20.7 Search Input — Full Width on Mobile

The search input must always be `width: "100%"` and `boxSizing: "border-box"`. The card container constrains the width.

```tsx
// Correct — search responds to container width:
<div className="premium-card" style={{ padding: "1rem 1.25rem" }}>
  <div style={{ position: "relative" }}>
    <input style={{ width: "100%", boxSizing: "border-box", padding: "12px 12px 12px 52px", ... }} />
  </div>
</div>
```

### 20.8 Modal — Bottom Sheet on Mobile

The existing `Modal.tsx` automatically becomes a **bottom sheet on mobile** via its built-in `@media (max-width: 640px)` CSS:
```css
@media (max-width: 640px) {
  .premium-modal {
    border-radius: 20px 20px 0 0;
    position: fixed; bottom: 0; top: auto;
  }
  .modal-overlay { align-items: flex-end; padding: 0; }
}
```

**Modal form grids** must collapse to single column:
```tsx
// 2-col on desktop, 1-col on mobile (via CSS in <style> block):
.form-grid { grid-template-columns: 1fr 1fr; }
@media (max-width: 640px) {
  .form-grid { grid-template-columns: 1fr; }
  .form-group.full-width { grid-column: span 1; }
}
```

### 20.9 Touch Targets

All tappable elements must meet a **44×44px minimum touch target**:

```tsx
{/* Buttons — minimum size */}
style={{ minHeight: "44px", minWidth: "44px", padding: "10px 20px" }}

{/* Icon-only action buttons (edit/delete) — 34×34 visible + 5px padding each side */}
style={{ padding: "10px", margin: "-5px" }}

{/* Table rows (on mobile card view) — comfortable tap zone */}
style={{ padding: "1rem 1.25rem" }}   {/* ≈ 52px minimum row height */}

{/* Bottom nav tabs */}
// Already 80px tall nav bar, individual tabs are 48×48 icon + label
```

### 20.10 Typography — Mobile Adjustments

H1 page titles (`1.875rem / 900`) are correct on all screen sizes — do not reduce them.

For supporting text that becomes too dense at mobile widths, use:
```tsx
// Wrap label instead of truncate
style={{ wordBreak: "break-word" }}

// Hide non-critical columns on mobile (use dual-view instead)
// Amount column: always show. Party name: truncate with maxWidth
style={{ maxWidth: "120px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
```

### 20.11 Dashboard Mobile Layout

The Dashboard uses `.dashboard-bottom-grid` for the bottom section (Recent Bills + Quick Links panel):

```css
/* Default: stacked on mobile */
.dashboard-bottom-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

/* Desktop: side by side */
@media (min-width: 1024px) {
  .dashboard-bottom-grid {
    grid-template-columns: 1fr 320px;
  }
}
```

The Quick Links panel (`320px`) goes **below** the Recent Bills list on mobile.

### 20.12 Safe Area Insets (iOS)

The Bottom Nav uses `pb-safe` which maps to `env(safe-area-inset-bottom)`. Content padding in `AppShell`:
```
pb-[calc(5rem + env(safe-area-inset-bottom, 0px))]
```

This is **already applied globally by AppShell** — do not add it per page.

For iOS home indicator clearance on modals pushed via bottom sheet, the `Modal.tsx` `bottom: 0` covers this automatically.

### 20.13 Mobile Checklist (Per Page)

When building or reviewing a page, verify:

- [ ] Page header wraps correctly (`flexWrap: "wrap"`)
- [ ] Card grids use `auto-fill / minmax` not fixed columns
- [ ] Data tables have dual view (desktop table + mobile card list)
- [ ] Toolbar wraps on small screens (`flexWrap: "wrap"`)
- [ ] Modal form grids collapse to 1 column on mobile
- [ ] All buttons have ≥ 44px touch target
- [ ] No horizontal scroll on mobile (check `overflow-x: hidden` on body)
- [ ] Date range filter is accessible (collapsible if needed on small screens)
- [ ] Content is not hidden behind bottom nav (AppShell handles this automatically)

---

## 21. Paginated Dropdown (Infinite-Scroll Party Search)

This pattern is used whenever the user must select a **Farmer or Customer** inside a modal form (e.g. Payments, Bills). It is a custom searchable dropdown with server-side pagination triggered by scroll.

> **Currently used in:** `payments/page.tsx` (party selector inside Record Payment modal)  
> **Not yet documented anywhere else in codebase** — use this as the reference pattern for all similar pickers.

### 21.1 State Required

```ts
const [partySearch, setPartySearch] = useState("");
const [debouncedPartySearch, setDebouncedPartySearch] = useState("");
const [partyResults, setPartyResults] = useState<Party[]>([]);
const [selectedParty, setSelectedParty] = useState<Party | null>(null);
const [showPartyDrop, setShowPartyDrop] = useState(false);
const [partyPage, setPartyPage] = useState(1);
const [hasMoreParties, setHasMoreParties] = useState(true);
const [isPartyLoading, setIsPartyLoading] = useState(false);

// Debounce search input (400ms)
useEffect(() => {
  const t = setTimeout(() => {
    setDebouncedPartySearch(partySearch);
    setPartyPage(1);
    setHasMoreParties(true);
  }, 400);
  return () => clearTimeout(t);
}, [partySearch]);

// Fetch on search/page change
useEffect(() => {
  if (!showPartyDrop) return;
  const controller = new AbortController();
  const fetch = async () => {
    if (!hasMoreParties && partyPage !== 1) return;
    setIsPartyLoading(true);
    const res = await fetch(`/api/farmers?search=${debouncedPartySearch}&page=${partyPage}&limit=20`, { signal: controller.signal });
    const result = await res.json();
    if (result.data) {
      setPartyResults(prev => partyPage === 1 ? result.data : [...prev, ...result.data]);
      setHasMoreParties(result.pagination.page < result.pagination.totalPages);
    }
    setIsPartyLoading(false);
  };
  fetch();
  return () => controller.abort();
}, [debouncedPartySearch, partyPage, showPartyDrop]);
```

### 21.2 Selected State (Party Chosen)

When a party is selected, replace the search input with a **selected chip**:

```tsx
{selectedParty ? (
  <div style={{
    display: "flex", alignItems: "center", justifyContent: "space-between",
    padding: "12px 16px",
    backgroundColor: partyType === "FARMER" ? "rgba(21,128,61,0.06)" : "rgba(3,105,161,0.06)",
    border: `1.5px solid ${partyType === "FARMER" ? "rgba(21,128,61,0.2)" : "rgba(3,105,161,0.2)"}`,
    borderRadius: "12px",
  }}>
    <div>
      <p style={{ margin: 0, fontSize: "14px", fontWeight: 800, color: "var(--text-main)" }}>
        {selectedParty.name}
      </p>
      <p style={{ margin: 0, fontSize: "11px", fontWeight: 700, color: "#94a3b8" }}>
        Balance: ₹{Number(selectedParty.balance).toLocaleString("en-IN")}
      </p>
    </div>
    {/* Clear button */}
    <button type="button" onClick={() => setSelectedParty(null)}
      style={{ width: "28px", height: "28px", borderRadius: "50%", border: "none",
        backgroundColor: "#f1f5f9", cursor: "pointer", display: "flex",
        alignItems: "center", justifyContent: "center" }}>
      <X size={14} color="#64748b" />
    </button>
  </div>
) : (
  /* Search input + dropdown — see 21.3 */
)}
```

### 21.3 Search Input + Dropdown Panel

```tsx
<div style={{ position: "relative" }}>
  {/* Search input */}
  <Search style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} size={16} />
  <input
    type="text"
    value={partySearch}
    onChange={e => { setPartySearch(e.target.value); setShowPartyDrop(true); }}
    onFocus={() => setShowPartyDrop(true)}
    onBlurCapture={() => setTimeout(() => setShowPartyDrop(false), 150)}  // 150ms delay for click to register
    style={{ width: "100%", boxSizing: "border-box", padding: "12px 12px 12px 42px",
      backgroundColor: "#f1f5f9", border: "1.5px solid #e2e8f0",
      borderRadius: "12px", fontSize: "14px", fontWeight: 700, outline: "none" }}
    onFocusCapture={e => { e.currentTarget.style.borderColor = PAGE_COLOR; e.currentTarget.style.backgroundColor = "#fff"; }}
  />

  {/* Dropdown panel — only when open and has content */}
  {showPartyDrop && (debouncedPartySearch.length > 0 || partyResults.length > 0) && (
    <div
      onScroll={e => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        // Trigger next page when 50px from bottom
        if (scrollHeight - scrollTop <= clientHeight + 50 && hasMoreParties && !isPartyLoading) {
          setPartyPage(p => p + 1);
        }
      }}
      style={{
        position: "absolute", top: "100%", left: 0, right: 0, marginTop: "6px",
        backgroundColor: "#fff", border: "1px solid var(--border-main)",
        borderRadius: "14px", boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
        zIndex: 10, padding: "6px",
        maxHeight: "200px",   // ← fixed height, scrollable
        overflowY: "auto",
      }}
    >
      {/* Result rows */}
      {partyResults.map(p => (
        <button
          key={p.id}
          type="button"
          onMouseDown={() => { setSelectedParty(p); setPartySearch(""); setShowPartyDrop(false); }}
          style={{ width: "100%", textAlign: "left", padding: "10px 12px",
            borderRadius: "10px", border: "none", background: "none", cursor: "pointer",
            display: "flex", justifyContent: "space-between", alignItems: "center" }}
          onMouseEnter={e => e.currentTarget.style.backgroundColor = PAGE_BG}
          onMouseLeave={e => e.currentTarget.style.backgroundColor = "transparent"}
        >
          {/* Left: name + mobile */}
          <div>
            <p style={{ margin: 0, fontSize: "13px", fontWeight: 800, color: "var(--text-main)" }}>{p.name}</p>
            <p style={{ margin: 0, fontSize: "11px", fontWeight: 600, color: "#94a3b8" }}>{p.mobile}</p>
          </div>
          {/* Right: balance with CR/DR label */}
          <span style={{ fontSize: "12px", fontWeight: 800, color: Number(p.balance) > 0 ? "#15803d" : "#d97706" }}>
            ₹{Math.abs(Number(p.balance)).toLocaleString("en-IN")}
            <span style={{ fontSize: "9px", marginLeft: "2px" }}>{Number(p.balance) > 0 ? "CR" : "DR"}</span>
          </span>
        </button>
      ))}

      {/* Loading spinner at bottom (while fetching next page) */}
      {isPartyLoading && (
        <div style={{ padding: "12px", textAlign: "center" }}>
          <Loader2 size={16} style={{ animation: "spin 0.6s linear infinite" }} color={PAGE_COLOR} />
        </div>
      )}

      {/* Empty state */}
      {!isPartyLoading && partyResults.length === 0 && debouncedPartySearch.length > 0 && (
        <p style={{ padding: "12px", margin: 0, textAlign: "center", fontSize: "12px", color: "#94a3b8", fontWeight: 700 }}>
          No results found
        </p>
      )}
    </div>
  )}
</div>
```

### 21.4 Key Behaviours

| Behaviour | How it's implemented |
|---|---|
| **Trigger open** | `onFocus` on the search input |
| **Close on blur** | `onBlurCapture` with `150ms setTimeout` — gives time for `onMouseDown` to fire |
| **Use `onMouseDown` not `onClick`** | Prevents blur from closing dropdown before selection fires |
| **Debounce** | 400ms delay on `partySearch` → `debouncedPartySearch` |
| **Infinite scroll** | `onScroll` checks if within 50px of bottom → increments `partyPage` |
| **Page reset** | `partyPage` resets to 1 when search term changes |
| **Result accumulation** | Page 1 replaces array; pages 2+ append: `prev => partyPage === 1 ? data : [...prev, ...data]` |
| **Abort on unmount** | `AbortController` in every `useEffect` fetch |

### 21.5 Mobile Behaviour

- Dropdown `maxHeight: 200px` keeps it visible on small screens
- On very small viewports, the modal scrolls (`maxHeight: 90vh, overflowY: auto`) so the dropdown remains accessible
- Touch users: `onMouseDown` works on touch events too (`pointerdown` alternative if needed)

---

## 22. Bottom Nav — "More" Button & Overflow Menu

### 22.1 Current Issue (Bug)

The "More" button in `BottomNav.tsx` uses `opacity-0 scale-50` on the label when inactive — making it **completely invisible** when not selected. This breaks visual affordance: the user cannot tell the button is tappable.

```tsx
// ❌ Current — label is invisible when not active
<span className={`text-[11px] font-bold uppercase tracking-tight ${
  isMenuOpen ? "text-emerald-700" : "text-slate-400 opacity-0 scale-50"
} transition-all duration-300`}>
  {t("nav.more")}
</span>
```

### 22.2 Correct "More" Button Spec

The More button must always show its label and icon. It should match the visual language of the other 4 primary nav tabs exactly.

```tsx
{/* ✅ Correct — always visible, consistent with other tabs */}
<button
  onClick={() => setIsMenuOpen(!isMenuOpen)}
  className="flex flex-col items-center justify-center gap-1.5 min-w-[72px] py-1 transition-all duration-300"
>
  {/* Icon container — same 48×48 pill as primary tabs */}
  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-300 ${
    isMenuOpen
      ? "bg-emerald-600 text-white shadow-lg shadow-emerald-200"
      : "bg-slate-100 text-slate-500"   // ← visible resting state
  }`}>
    <MoreHorizontal size={22} strokeWidth={isMenuOpen ? 2.5 : 2} />
  </div>
  {/* Label — always visible */}
  <span className={`text-[10px] font-black uppercase tracking-tight transition-colors duration-200 ${
    isMenuOpen ? "text-emerald-700" : "text-slate-400"
  }`}>
    {t("nav.more")}
  </span>
</button>
```

### 22.3 Bottom Nav Bar Layout Standards

The nav bar contains **5 equal slots** (4 primary tabs + More). Each slot must:

| Property | Value | Reason |
|---|---|---|
| `min-w` | `72px` | Fits 5 slots in a 360px viewport |
| `h` of bar | `80px` (h-20) | Comfortable tap height + label space |
| `py` on each tab | `py-1` (4px top + bottom) | Centers icon + label vertically within bar |
| Icon container | `w-12 h-12` (48×48) | 44px minimum touch target |
| Label | `text-[10px]` font-black | Readable at small size; uppercase with tracking |
| Gap between icon + label | `gap-1.5` (6px) | Prevents cramping |
| Bar background | `bg-white/80 backdrop-blur-xl` | Glass effect over content |

**All 5 tabs (including More) must look identical in their resting state.** Inactive icon containers should use `bg-slate-100 text-slate-500`, not plain text or invisible styling.

### 22.4 Overflow Menu Panel Standards

The slide-up menu (shown when More is tapped) must be well-padded and centred:

```tsx
<div className="
  absolute bottom-24 left-4 right-4   /* 16px margin from screen edges */
  bg-white rounded-[2rem]             /* 32px radius — premium feel */
  shadow-[0_20px_50px_rgba(0,0,0,0.2)]
  p-8                                 /* 32px internal padding — key for content breathing room */
  border border-slate-100
  max-h-[80vh] overflow-y-auto        /* scrollable on small phones */
  animate-in slide-in-from-bottom-10 fade-in duration-300
">
  {/* Drag handle — centred pill at top */}
  <div className="flex items-center justify-center mb-8">
    <div className="w-16 h-1.5 bg-slate-200 rounded-full" onClick={close} />
  </div>

  {/* Sections — spaced generously */}
  <div className="space-y-10 mb-10">
    {/* Section label */}
    <p className="px-2 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">
      SECTION NAME
    </p>
    {/* Nav items — full width rows */}
    <Link className="flex items-center gap-5 px-5 py-4 rounded-[1.5rem] transition-all duration-300
      text-slate-600 font-medium hover:bg-slate-50
      [active]:bg-emerald-50 [active]:text-emerald-700">
      {/* 40×40 icon box */}
      <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-slate-100 text-slate-400">
        <Icon size={20} />
      </div>
      <span className="flex-1 text-[16px]">{label}</span>
      <ChevronRight size={16} className="opacity-20" />
    </Link>
  </div>
</div>
```

### 22.5 Menu Item Spacing Rules

| Element | Padding | Notes |
|---|---|---|
| Menu panel | `p-8` (32px all sides) | Non-negotiable — gives breathing room |
| Section label | `px-2 mb-4` | Small top label for group |
| Nav link row | `px-5 py-4` | 16px top/bottom = ~56px row height (comfortable) |
| Language grid gap | `gap-3` (12px) | Between EN / हि / म pills |
| Language pill | `py-4` | Tall enough to be tappable |
| Between sections | `space-y-10` (40px) | Clear visual separation |
| Bottom section (logout) | `border-t pt-8 pb-4` | Separated from nav items |

### 22.6 Backdrop Spec

```tsx
<div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
  onClick={close} />
```

- `bg-slate-900/60` — 60% dark tint (strong but not black)
- `backdrop-blur-sm` — 4px blur on content underneath
- Click-to-dismiss on the backdrop

### 22.7 Active State in Menu

Nav items inside the overflow menu use the same active pattern as sidebar items:

```
Active:   bg-emerald-50  text-emerald-700  icon: bg-emerald-600 text-white  shadow-lg
Inactive: text-slate-600 icon: bg-slate-100 text-slate-400
```

### 22.8 Summary — What Must Be Fixed in `BottomNav.tsx`

| Issue | Fix |
|---|---|
| More button label `opacity-0 scale-50` when inactive | Change to always visible: `text-slate-400` at rest |
| More button icon no background at rest | Add `bg-slate-100 text-slate-500` for resting state |
| Tab `py` padding missing | Add `py-1` to each tab link/button for vertical centering |
| Drag handle colour too faint | Use `bg-slate-200` instead of `bg-slate-100 opacity-50` |

---

## 23. Bills, Farmers & Customers Pages + `AddPartyModal`

### 23.1 Page Colour Contexts

| Page | Accent colour | Usage |
|---|---|---|
| **Farmers** | `#15803d` (Emerald) | Header accent bar, CTA button, card initial badge, search focus, "View Ledger" footer |
| **Customers** | `#0369a1` (Sky) | Same roles as Farmers but Sky blue |
| **Bills** | `var(--primary-main)` = Emerald for Purchase, `#0369a1` for Sale | Both colours coexist — one per bill type |

### 23.2 Farmers & Customers — Entity Card Grid

Both pages are **identical in structure**, differing only in colour and i18n keys. The pattern is:

```
Page root (flex column gap-2rem)
  ├── Header (h1 + accent bar + date subtitle + CTA button, flexWrap)
  ├── Search bar (premium-card + Search icon + debounced input)
  ├── Grid / Skeleton / Empty state
  │     └── premium-card per entity (padding 1.75rem, cursor pointer)
  │           ├── Top row: initial avatar (48×48) + balance (right-aligned)
  │           ├── H3 name
  │           ├── Contact rows (Phone 32×32 icon box + address)
  │           └── Footer (border-top + "View Ledger" label + ArrowRight icon)
  ├── Pagination (premium-card, Previous/Next buttons)
  └── AddPartyModal
```

**Entity card anatomy:**

```tsx
<div className="premium-card" style={{ padding: "1.75rem", cursor: "pointer" }}
  onClick={() => router.push(`/${type}/${entity.id}`)}>

  {/* Top row */}
  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "1.25rem" }}>
    {/* Initial avatar */}
    <div style={{ width: "48px", height: "48px", backgroundColor: "rgba(R,G,B,0.08)", borderRadius: "14px",
      display: "flex", alignItems: "center", justifyContent: "center",
      color: PAGE_COLOR, fontWeight: 900, fontSize: "20px",
      border: "1px solid rgba(R,G,B,0.15)", flexShrink: 0 }}>
      {entity.name.charAt(0).toUpperCase()}
    </div>
    {/* Balance — right aligned */}
    <div style={{ textAlign: "right" }}>
      <p style={{ margin: 0, fontSize: "10px", fontWeight: 900, color: "#94a3b8",
        textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: "4px" }}>
        BALANCE
      </p>
      <p style={{ margin: 0, fontSize: "1.25rem", fontWeight: 900,
        color: entity.balance > 0 ? "#d97706" : "#16a34a" }}>   {/* amber = owes us, green = advance */}
        ₹ {entity.balance.toLocaleString("en-IN")}
      </p>
    </div>
  </div>

  <h3 style={{ margin: "0 0 1rem", fontSize: "1.125rem", fontWeight: 900, color: "var(--text-main)", letterSpacing: "-0.01em" }}>
    {entity.name}
  </h3>

  {/* Contact details */}
  <div style={{ display: "flex", flexDirection: "column", gap: "0.625rem" }}>
    <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#64748b" }}>
      <div style={{ width: "32px", height: "32px", backgroundColor: "#f8fafc", borderRadius: "8px",
        display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        <Phone size={14} />
      </div>
      <span style={{ fontSize: "13px", fontWeight: 700 }}>{entity.mobile}</span>
    </div>
    {entity.address && (
      <div style={{ display: "flex", alignItems: "flex-start", gap: "10px", color: "#64748b" }}>
        <div style={{ width: "32px", height: "32px", backgroundColor: "#f8fafc", borderRadius: "8px",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "2px" }}>
          <MapPin size={14} />
        </div>
        <span style={{ fontSize: "13px", fontWeight: 600, lineHeight: 1.4 }}>{entity.address}</span>
      </div>
    )}
  </div>

  {/* Footer — View Ledger */}
  <div style={{ marginTop: "1.25rem", paddingTop: "1.25rem", borderTop: "1px solid #f1f5f9",
    display: "flex", alignItems: "center", justifyContent: "space-between", color: PAGE_COLOR }}>
    <span style={{ fontSize: "11px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.15em" }}>
      VIEW LEDGER
    </span>
    <ArrowRight size={16} />
  </div>
</div>
```

**Balance colour rule:**
- Farmer: `balance > 0` → `#d97706` (amber = we owe farmer money) | `<= 0` → `#16a34a` (green = farmer owes us)
- Customer: `balance > 0` → `#dc2626` (red = customer owes us) | `<= 0` → `#16a34a` (green = advance/credit)

### 23.3 Bills Page — Dual View Pattern (Tailwind, not CSS-in-style)

> **Key difference from Payments page:** Bills uses Tailwind `hidden lg:block` / `lg:hidden` classes instead of CSS-in-`<style>` media queries. Both approaches are valid — do not mix them within the same page.

```tsx
{/* Desktop table */}
<div className="hidden lg:block"> {/* ← Tailwind, not CSS-in-style */}
  <table> ... </table>
</div>

{/* Mobile card list */}
<div className="lg:hidden divide-y divide-slate-100">
  {bills.map(bill => (
    <Link href={`/bills/${bill.id}`} style={{ textDecoration: "none", color: "inherit" }}>
      <div style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1rem" }}
        className="active:bg-slate-50 transition-colors">
        {/* Top row: type icon + bill number + date — right: amount + type badge */}
        {/* Bottom row: party pill with user icon + ArrowRight */}
      </div>
    </Link>
  ))}
</div>
```

**Mobile card row anatomy (Bills):**

```tsx
{/* Row 1: bill number + amount */}
<div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
  {/* Left: 36×36 icon box + billNumber (font-900 uppercase) + date (muted) */}
  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
    <div style={{ width: "36px", height: "36px", borderRadius: "10px",
      backgroundColor: bill.type === "PURCHASE" ? "rgba(21,128,61,0.08)" : "rgba(3,105,161,0.08)",
      color: bill.type === "PURCHASE" ? "var(--primary-main)" : "#0369a1", paddingLeft: "10px",
      display: "flex", alignItems: "center" }}>
      {bill.type === "PURCHASE" ? <ArrowDownLeft size={16}/> : <ArrowUpRight size={16}/>}
    </div>
    <div>
      <p style={{ fontSize: "13px", fontWeight: 900, color: "var(--text-main)",
        textTransform: "uppercase", letterSpacing: "0.05em", margin: 0 }}>{bill.billNumber}</p>
      <p style={{ fontSize: "11px", fontWeight: 700, color: "var(--text-muted)", margin: 0 }}>
        {fmtDate(bill.billDate)}  {/* ← use canonical dd-mm-yyyy */}
      </p>
    </div>
  </div>
  {/* Right: amount + type label */}
  <div style={{ textAlign: "right" }}>
    <p style={{ fontSize: "15px", fontWeight: 900, color: "var(--text-main)", margin: 0 }}>
      ₹ {bill.netTotal.toLocaleString("en-IN")}
    </p>
    <span style={{ fontSize: "9px", fontWeight: 900, textTransform: "uppercase",
      color: bill.type === "PURCHASE" ? "var(--primary-main)" : "#0369a1", opacity: 0.8 }}>
      {bill.type}
    </span>
  </div>
</div>

{/* Row 2: party name pill */}
<div style={{ display: "flex", alignItems: "center", justifyContent: "space-between",
  backgroundColor: "#f8fafc", padding: "10px 14px", borderRadius: "12px" }}>
  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
    <User size={14} className="text-slate-400" />
    <span style={{ fontSize: "13px", fontWeight: 800, color: "var(--text-main)" }}>{bill.party}</span>
  </div>
  <ArrowRight size={14} className="text-slate-300" />
</div>
```

**Bill date issue:** Line 273 uses `{ day: '2-digit', month: 'short', year: 'numeric' }` → "04 Mar 2026" ❌  
**Fix:** Use canonical `fmtDate()` returning `dd/mm/yyyy`.

### 23.4 Bills Page — Filter Tabs

The Bills page has a 3-tab segment control (ALL / PURCHASE / SALE) inside the search card:

```tsx
<div style={{ display: "flex", backgroundColor: "#f1f5f9", padding: "4px", borderRadius: "14px", gap: "4px" }}>
  {["ALL", "PURCHASE", "SALE"].map(opt => (
    <button key={opt}
      style={{
        border: "none", padding: "10px 20px", borderRadius: "10px",
        fontSize: "11px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.1em",
        cursor: "pointer", transition: "all 0.2s ease",
        backgroundColor: filter === opt ? "#fff" : "transparent",
        color: filter === opt ? "var(--text-main)" : "var(--text-muted)",
        boxShadow: filter === opt ? "0 4px 6px -1px rgba(0,0,0,0.05)" : "none",
      }}>
      {opt === "ALL" ? "All Bills" : opt}
    </button>
  ))}
</div>
```

**Active tab:** white pill with subtle box-shadow on `#f1f5f9` tray.  
**This same pattern is used in** Payments (FARMER/CUSTOMER/ALL tabs in violet styling).

### 23.5 `AddPartyModal` Component — Reusable API

Location: `src/components/modals/AddPartyModal.tsx`

This is the **single shared modal** for both "Add Farmer" and "Add Customer". Drive everything via the `type` prop:

```tsx
<AddPartyModal
  isOpen={isModalOpen}
  onClose={() => setIsModalOpen(false)}
  type="FARMER"          // or "CUSTOMER"
  onSuccess={() => fetchList()}
/>
```

**Props:**

| Prop | Type | Description |
|---|---|---|
| `isOpen` | `boolean` | Controls modal visibility |
| `onClose` | `() => void` | Called when user dismisses (blocked during submit) |
| `type` | `"FARMER" \| "CUSTOMER"` | Drives accent colour, i18n keys, API endpoint, validation schema |
| `onSuccess` | `() => void` | Called after successful POST — use to re-fetch the list |

**Accent colour by type:**
- `FARMER` → `#15803d` (Emerald)
- `CUSTOMER` → `#0369a1` (Sky)

**Form fields:**

| Field | Input type | Notes |
|---|---|---|
| Name | `text` | Required |
| Mobile | `tel` | Digits only, max 10, stripped via `replace(/\D/g, "").slice(0, 10)` |
| Address | `textarea rows={2}` | Optional, `resize: "none"` |
| Opening Balance | `number step="0.01"` | ₹ prefix icon at `left: 12px` |
| Balance Type | `select` | `DUE` or `ADVANCE` |

**Form layout:** All fields in a single column (`flexDirection: "column", gap: "1.25rem"`), except Opening Balance + Balance Type which share a `grid-cols-2` row.

**Footer buttons:**

```tsx
<div style={{ display: "flex", gap: "0.75rem", paddingTop: "0.5rem" }}>
  {/* Cancel — flex:1, background #f1f5f9 */}
  <button type="button" style={{ flex: 1, padding: "12px", borderRadius: "12px",
    backgroundColor: "#f1f5f9", fontWeight: 800, fontSize: "13px", color: "#64748b", border: "none" }}>
    Cancel
  </button>
  {/* Submit — flex:2 (wider), accent background, spinner during submit */}
  <button type="submit" disabled={submitting}
    style={{ flex: 2, padding: "12px", borderRadius: "12px", backgroundColor: accentColor,
      fontWeight: 900, fontSize: "13px", color: "#fff", border: "none",
      boxShadow: `0 8px 16px rgba(R,G,B,0.2)`, opacity: submitting ? 0.7 : 1 }}>
    {submitting ? <Loader2 size={18} style={{ animation: "spin 0.6s linear infinite" }} /> : "Save"}
  </button>
</div>
```

**Validation:** Uses `farmerSchema` / `customerSchema` from `@/lib/schemas` via `zod.safeParse`. Show first error via `toast.error`.

**API:** `POST /api/farmers` or `POST /api/customers` with JSON body: `{ name, mobile, address, openingBalance, openingBalanceType }`.

### 23.6 Pagination Pattern (All List Pages)

All paginated list pages (Farmers, Customers, Bills, Payments) share this pagination footer:

```tsx
{pagination.totalPages > 1 && (
  <div className="premium-card" style={{ marginTop: "2rem", padding: "1.25rem",
    display: "flex", alignItems: "center", justifyContent: "space-between" }}>
    <p style={{ margin: 0, fontSize: "12px", fontWeight: 700, color: "var(--text-muted)" }}>
      Page {pagination.page} of {pagination.totalPages} ({pagination.total} total)
    </p>
    <div style={{ display: "flex", gap: "0.5rem" }}>
      <button
        onClick={() => handlePageChange(Math.max(1, pagination.page - 1))}
        disabled={pagination.page === 1}
        style={{
          padding: "8px 16px", borderRadius: "10px", border: "1px solid var(--border-main)",
          backgroundColor: pagination.page === 1 ? "#f8fafc" : "#fff",
          fontSize: "12px", fontWeight: 800,
          color: pagination.page === 1 ? "#cbd5e1" : "var(--text-main)",
          cursor: pagination.page === 1 ? "not-allowed" : "pointer",
        }}>
        Previous
      </button>
      <button
        onClick={() => handlePageChange(Math.min(pagination.totalPages, pagination.page + 1))}
        disabled={pagination.page === pagination.totalPages}
        style={{
          padding: "8px 16px", borderRadius: "10px", border: "1px solid var(--border-main)",
          backgroundColor: pagination.page === pagination.totalPages ? "#f8fafc" : "#fff",
          fontSize: "12px", fontWeight: 800,
          color: pagination.page === pagination.totalPages ? "#cbd5e1" : "var(--text-main)",
          cursor: pagination.page === pagination.totalPages ? "not-allowed" : "pointer",
        }}>
        Next
      </button>
    </div>
  </div>
)}
```

**Disabled state:** `#f8fafc` background, `#cbd5e1` text, `cursor: not-allowed`.  
**On page change:** Call `window.scrollTo({ top: 0, behavior: "smooth" })` on entity list pages.

### 23.7 AddPartyModal — Mobile Notes

- `Modal.tsx` already handles bottom-sheet at `max-width: 640px`
- The 2-column grid (`gridTemplateColumns: "1fr 1fr"`) for Opening Balance / Type needs to collapse at mobile:

```tsx
// Add to <style> block in AddPartyModal:
@media (max-width: 480px) {
  .opening-balance-grid { grid-template-columns: 1fr !important; }
}
```

- Footer buttons (`flex: 1` / `flex: 2`) already work on mobile since they're flex children
- Mobile keyboard pushing the modal: Modal has `maxHeight: 90vh, overflowY: auto` — works correctly
