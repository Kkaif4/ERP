
FUNCTIONAL REQUIREMENTS DOCUMENT
Vegetable Trading Billing & Ledger System
Version 2.0  |  February 2026
Prepared by: Product & UX Team

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. Document Overview
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
This Functional Requirements Document (FRD) describes the complete feature set, user
journeys, business rules, and current UI/UX implementation standards for the Vegetable
Trading Billing & Ledger System — a Next.js web application built for small to mid-size
vegetable trading businesses in India.

Version 2.0 reflects the actual implemented state of the application, including the
"Architectural Emerald" design system and all UI/UX patterns that are live in the codebase.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2. Target Users & Real-World Pain Points
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
2.1 Business Owner (Admin)
A vegetable mandi owner or small wholesaler who manages daily purchases from farmers and
daily sales to shopkeepers, hotels, and distributors. Typically 35–60 years old, literate
in their regional language, familiar with basic Android phones.

Real Pain Points
• Writing bills by hand in a ledger book takes time and causes errors.
• Forgetting which farmer or customer has a pending balance.
• Calculating tax, service charges, freight and labour manually is error-prone.
• No record of who collected payment — disputes between staff are common.

2.2 Staff Users
Counter staff who create bills and record payments. Speed and simplicity are their top
priorities — they cannot afford to slow down a buyer waiting at the counter.

Real Pain Points
• Complex screens with too many fields cause mistakes and slow them down.
• They often forget to add freight or labour charges while billing.
• They need to quickly find a farmer or customer from a long list.
• They need instant confirmation that the bill was saved correctly.

2.3 Farmers & Customers (Indirect Users)
Farmers and customers do not log in. Staff must be able to retrieve and communicate a
balance in under 10 seconds during a phone call.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
3. Technology Stack
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Framework:      Next.js (App Router, TypeScript)
• Styling:        Tailwind CSS + Vanilla CSS (globals.css for design system tokens)
• UI Components:  React — all pages are client-side ("use client") components
• Icons:          Lucide React
• Notifications:  Sonner (toast notifications)
• Auth:           JWT (stored in HTTP-only cookie), bcrypt password hashing
• Database:       PostgreSQL (Prisma ORM)
• i18n:           Custom translation hook (useTranslation) — en, hi, mr supported
• Image Processing: Sharp (server-side WebP optimization)
• QR Generation:  qrcode.react (UPI dynamic codes)
• Routing:        Next.js App Router

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
4. Design System — "Architectural Emerald"
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
All pages share a single, unified visual language defined in globals.css. Any new page or
component MUST follow these rules exactly.

4.1 CSS Variables (defined in globals.css)
  --primary-main:   #15803d   (emerald green — primary CTA colour)
  --primary-glow:   rgba(21,128,61,0.08)   (tinted backgrounds)
  --text-main:      #0f172a   (headings, values)
  --text-muted:     #94a3b8   (labels, metadata)
  --border-main:    #e2e8f0   (card and input borders)
  --bg-main:        #f8fafc   (page background, input backgrounds)

4.2 Core UI Class: .premium-card
  background: #ffffff
  border: 1px solid var(--border-main)
  border-radius: 20px
  box-shadow: 0 4px 24px rgba(0,0,0,0.04)
  transition: box-shadow 0.2s, transform 0.2s
  hover: translateY(-2px), elevated shadow

  Used for: every card, panel, and section container across all pages.

4.3 Typography Scale
  Page Title (h1):   font-size: 1.875rem, font-weight: 900, letter-spacing: -0.02em
  Section Header:    font-size: 1.125rem, font-weight: 900
  Label / Badge:     font-size: 10–11px, font-weight: 800–900, uppercase, tracking: 0.15–0.2em
  Body / Item name:  font-size: 13–15px, font-weight: 700–800
  Supporting text:   font-size: 11–12px, font-weight: 600–700, color: var(--text-muted)

4.4 Page Header Pattern (ALL pages must use this)
  ┌─────────────────────────────────────────────────────────────┐
  │  [Page Title — 1.875rem, weight 900]                        │
  │  [━━━] [LABEL TEXT · Date/Context — 11px uppercase muted]  │
  │                                          [Action Button →]  │
  └─────────────────────────────────────────────────────────────┘
  • The 3px accent bar (24px wide) sits left of the label text
  • Accent bar colour: var(--primary-main) or page-specific colour
  • Action buttons: 10px 20px padding, 12px border-radius, weight 800

4.5 Input Field Standard
  All input fields use inline style objects (NOT Tailwind pl-X classes) to guarantee
  no icon/text overlap on any device:

    padding: "12–14px 12px 12–14px 52px"   (when left icon is present)
    padding: "12–14px 16px"                 (plain input, no icon)
    background-color: #f8fafc
    border: 1.5px solid var(--border-main)
    border-radius: 12–14px
    font-weight: 700
    font-size: 14–15px
    transition: border-color 0.2s, background-color 0.2s
    focus: border-color = page accent colour, background = #fff

  Icon (Search, Plus, ₹ symbol):
    position: absolute, left: 16px, top: 50%, transform: translateY(-50%)

  Currency prefix (₹ inside price fields):
    position: absolute, left: 10–12px
    font-size: 11–12px, font-weight: 800, color: #94a3b8
    input padding-left: 24–28px (sufficient clearance)

4.6 Button Standards
  Primary CTA (green):
    background: var(--primary-main) | border-radius: 12px | padding: 10px 20px
    font-weight: 800 | box-shadow: 0 8px 16px var(--primary-glow)
    hover: translateY(-2px), elevated shadow

  Secondary / Cancel:
    background: #f1f5f9 | color: #64748b | border-radius: 12px
    hover: background #e2e8f0, color #0f172a

  Destructive / Delete (icon button):
    default: background #f8fafc, color #cbd5e1 | border-radius: 10px | size: 34px
    hover: background #fef2f2, color #ef4444

4.7 Dropdown / Autocomplete Pattern
  • Positioned absolutely below the input field (top: 100%, margin-top: 8px)
  • background: #fff | border: 1px solid var(--border-main)
  • border-radius: 14–16px | box-shadow: 0 20px 40px rgba(0,0,0,0.1) | z-index: 100
  • Inner padding: 4–6px (wraps all items)
  • Each option: hover background = page tint colour at ~6% opacity
  • border-radius: 10–12px per option

4.8 Colour Accents by Page/Context
  Purchase Bill / Farmers:  #15803d (emerald green) — matches --primary-main
  Sale Bill / Customers:    #0369a1 (sky blue)
  Payments:                 #7c3aed (violet)
  Warnings / Pending:       #b45309 (amber)
  Danger / Due balance:     #dc2626 (red)

4.9 Unified Modal Pattern (.premium-modal)
  All modals must use the centralized `<Modal />` component from `src/components/ui/Modal.tsx`.
  Inline modal implementations are forbidden.

  Standard Styles:
    • Backdrop: background: rgba(15, 23, 42, 0.4), backdrop-filter: blur(8px)
    • Container: background: #fff, border-radius: 24px, overflow: hidden
    • Header: padding: 24px 32px, unified icon-badge + title/subtitle layout
    • Footer: padding: 32px, right-aligned buttons [Cancel] [Primary Action]
    • Animation: slide-up + fade (0.4s cubic-bezier(0.16, 1, 0.3, 1))

  Usage:
    ```tsx
    <Modal isOpen={show} onClose={() => setShow(false)} title="Add Item">
       {/* Form Content */}
    </Modal>
    ```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
5. Layout & Navigation
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
5.1 AppShell (src/components/layout/AppShell.tsx)
• Desktop (≥1024px): Fixed left sidebar (Sidebar.tsx) + scrollable main content
• Mobile (<1024px):  Fixed bottom tab bar (BottomNav.tsx) + full-width main content
• Main content area bottom padding (mobile):
    padding-bottom: calc(5rem + env(safe-area-inset-bottom, 0px))
    This clears the 80px (h-20) bottom nav including safe area on notched phones.
    Removed automatically on desktop via CSS media query.
• Global header: sticky top-0, height 80px (h-20), backdrop-blur-xl

5.2 Bottom Navigation (BottomNav.tsx)
  Tabs (in order): Dashboard | Bills | Search | Payments | More
  Active state: text-primary + bg-primary/10 icon background, scale-110
  Position: fixed bottom-0, z-50, pb-safe (CSS env safe area)

5.3 Page Content Wrapper
  Every page content area uses:
    display: "flex", flexDirection: "column", gap: "2rem"
  This provides consistent 32px vertical spacing between all sections.
  Max page width is unconstrained — the sidebar handles the layout boundary.

5.4 Content Padding
  Applied by AppShell main tag: padding 1.5rem (desktop), 1rem (mobile)
  (class: layout-container)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
6. User Roles & Permissions
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
6.1 Admin (Business Owner)
One admin per business. Created during initial setup. Cannot self-register afterwards.
Role stored in JWT session. Role is passed to AppShell → Sidebar to filter navigation.

Permissions:
  Manage Staff Users | Manage Farmers | Manage Customers | Item Master
  Tax & Charge Config | View All Reports | Export Reports | Audit Logs
  Delete/Modify Bills (admin-only, with audit record)

6.2 Staff User
Created by Admin. Multiple staff can exist. Every action is logged.

Allowed: Create purchase & sale bills | Record payments | View farmer/customer profiles
Restricted: Tax/charge settings | Delete records | Modify completed bills | Audit logs

Implementation note: Staff screens hide (not just disable) admin controls entirely.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
7. Dashboard Page (/dashboard)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
7.1 Page Header
  Title: "Overview" (translated) | Accent: var(--primary-main)
  Sub-label: Clock icon + Today's full date (localised per language setting)
  Right side: "Purchase Bill" (green) + "Sale Bill" (blue) quick-action buttons

7.2 Stat Cards (4-card grid, auto-fit minmax 200px)
  Each card: .premium-card | padding: 2rem | coloured border per stat
  Stats displayed:
    • Today's Bills count         (emerald)
    • Today's Payments count      (blue)
    • Farmer Payable balance (₹)  (amber)
    • Customer Due balance (₹)    (violet)
  Values: 1.875rem, weight 900 — largest element on the card
  Icon: 48×48px tinted square, top-right of card
  Skeleton loading: pulsing grey boxes shown while API loads

7.3 Recent Bills Panel
  Left panel (wider): Last N bills as a responsive list
  Desktop view: Grid table — Bill # | Party | Type | Amount | Time
  Mobile view: Flex rows — Bill # + party name left, amount + chevron right
  Type badges: PURCHASE (orange tint) | SALE (green tint)
  "View All →" link opens /dashboard/bills

7.4 Quick Links Panel
  Right panel (320px fixed on desktop, full-width stacked on mobile):
  Links: Farmers | Customers | Payments | All Bills
  Each link: icon square + label + ArrowRight
  Bottom CTA: "Create Bill" full-width green button → /dashboard/bills/purchase/new

7.5 API
  GET /api/dashboard/stats → { todayBills, todayPayments, totalFarmers,
    totalCustomers, pendingFarmerBalance, pendingCustomerBalance, recentBills[] }

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
8. Bills History Page (/dashboard/bills)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
8.1 Page Header
  Title: "Bills" (translated) | Accent: var(--primary-main)
  Right: "Purchase Bill" (green) + "Sale Bill" (blue) action buttons

8.2 Filter & Search Bar (.premium-card container)
  Filter tabs: ALL | PURCHASE | SALE (pill tabs, white active background)
  Search input: "Find by Bill # or Party Name..."
    → padding: "14px 14px 14px 56px" (accounts for Search icon at left: 16px)

8.3 Bills List
  Desktop: Table with columns — Bill # | Party | Type | Amount | Date | Time
  Mobile: Vertical card stack — one bill per row as flex item
    Left: Badge (#number) + Party name + type badge
    Right: ₹ Amount + chevron
  Skeleton: 4 shimmer rows while loading
  Empty state: ReceiptText icon + "No bills found" message

8.4 Bill type badge colours:
  PURCHASE: bg rgba(234,88,12,0.08) | text #ea580c | border rgba(234,88,12,0.2)
  SALE:     bg rgba(21,128,61,0.08) | text #15803d | border rgba(21,128,61,0.2)

8.5 API
  GET /api/bills?type=ALL|PURCHASE|SALE&search=...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
9. New Purchase Bill (/dashboard/bills/purchase/new)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
9.1 Page Header
  Title: t("bills.purchase.title") | Accent: var(--primary-main) (emerald)
  Right: "Cancel" button → /dashboard/bills (grey pill style)

9.2 Layout Grid
  Mobile:  Single column (grid-template-columns: 1fr)
  Desktop (≥1024px): Two columns — main content left | summary panel right (340px)
  CSS class: .purchase-bill-grid (responsive via @media rules in <style>)
  overflowX: hidden on root container to prevent horizontal scroll

9.3 Farmer Selection Card (.premium-card)
  Header: UserCircle icon (emerald tint) + "SELECT FARMER" label
  States:
    Empty: Search input (padding-left 52px for Search icon)
      → autocomplete dropdown on type (min 2 chars)
      → Dropdown: white card, emerald hover tint, ArrowRight per option
    Selected: Farmer chip — avatar letter (emerald square) + name + mobile
      → X button (circle, 36px) to deselect
      → Background: rgba(21,128,61,0.06), border: rgba(21,128,61,0.15)

9.4 Items Card (.premium-card, overflow: hidden)
  Header bar: Package icon (emerald) + "BILL ITEMS" + item search input (right)
    Item search: padding "10px 12px 10px 44px" for Plus icon
    Dropdown: same pattern as farmer dropdown, emerald hover
  Empty state: Truck icon (faded) + "No items added" text
  Desktop (≥768px): <table> shown, .purchase-items-mobile hidden
  Mobile (<768px): .purchase-items-table hidden, card list shown

  Desktop table columns: Item | Qty | Price | Total | [delete]
    Qty input: 80px wide, centered, padding 8px
    Price input: 100px wide, ₹ prefix at left:10px, padding-left: 24px
    Delete button: 34×34px, red hover
  Mobile card per item:
    Top: item name + pricing badge | X delete button
    Grid: Qty input | Price input (with ₹ prefix)
    Bottom strip: "TOTAL" label + ₹ value

9.5 Summary Panel (.premium-card, bg: #0f172a dark)
  Header: Calculator icon (emerald tint) + "SUMMARY" label
  Rows: Subtotal | Labour | Freight | Advance | Others
  Net Total box: TrendingUp (green) + "NET TOTAL" label + large ₹ amount
  Confirm button: full width, emerald, disabled (dark + grey text) when no items

9.6 Calculation Logic
  subtotal = Σ line.total
  line.total = quantity × price            (UNIT mode)
  line.total = (quantity ÷ 10) × price    (WEIGHT mode)
  netTotal = subtotal − (labour + freight + advance + others)

9.7 Others Note
  Available when 'Others' amount is > 0. A text area for explaining miscellaneous charges.
  Note is saved with the bill and appears in reports and detail views.

9.7 API Calls
  GET /api/config → BusinessConfig (taxType, taxValue, serviceChargeType, serviceChargeValue)
  GET /api/farmers?search=... → Farmer[]
  GET /api/items?search=... → Item[]
  POST /api/bills/purchase → { farmerId, items: [{ itemId, pricingMode, quantity, pricePerUnit }] }

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
10. New Sale Bill (/dashboard/bills/sale/new)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
10.1 Page Header
  Title: t("bills.sale.title") | Accent: #0369a1 (sky blue)
  Right: "Cancel" button → /dashboard/bills

10.2 Layout Grid
  Mobile:  Single column (.sale-bill-grid: grid-template-columns: 1fr)
  Desktop: Two columns — main left | summary right (340px, sticky top: 6rem)
  CSS class: .sale-bill-grid
  overflowX: hidden on root container

10.3 Customer Selection Card (.premium-card)
  Identical pattern to Farmer card but uses blue (#0369a1) accents throughout.

10.4 Items Card (.premium-card, overflow: hidden)
  Identical pattern to Purchase Bill items card but uses blue accents.
  .bill-items-table / .bill-items-mobile responsive classes

10.5 Extra Charges Section
  3 side-by-side cards on ≥640px, stacked (1 col) on mobile
  CSS class: .charges-grid
    Mobile:  grid-template-columns: 1fr
    ≥640px:  grid-template-columns: repeat(3, 1fr)
  Cards:
    Labour Charges   → amber (#b45309) icon + input
    Freight Charges  → violet (#7c3aed) icon + input
    Advance Payment  → blue (#0369a1) icon + input
  Each card: .premium-card | 1.25rem padding | icon + label header | ₹ input
  Input: padding "12px 12px 12px 36px" (for ₹ symbol at left: 14px)

10.6 Summary Panel (.premium-card, bg: #0f172a dark)
  Rows: Subtotal | Labour | Freight | [divider] | Tax | Service Charge | [divider]
        Gross Total | Advance (shown in red as deduction)
  Net Payable box: TrendingUp (blue) + "PAYABLE" label + large ₹ amount
  Note below: shows customer name or placeholder in a muted info box
  Confirm button: full width, blue (#0369a1)

10.7 Calculation Logic (Mandatory order)
  subtotal = Σ line.total
  subtotalWithCharges = subtotal + labourCharges + freightCharges
  tax = subtotalWithCharges × (taxValue/100) or fixed
  serviceCharge = subtotalWithCharges × (scValue/100) or fixed
  grossTotal = subtotalWithCharges + tax + serviceCharge
  netTotal = grossTotal − advanceDeduction

10.8 API Calls
  GET /api/config | GET /api/customers?search=... | GET /api/items?search=...
  POST /api/bills/sale → { customerId, labourCharges, freightCharges,
    advanceDeduction, items: [{ itemId, pricingMode, quantity, pricePerUnit }] }

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
11. Farmers Page (/dashboard/farmers)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
11.1 Page Header
  Title: t("master.farmers.title") | Accent: var(--primary-main) (emerald)
  Sub-label: Clock icon + count of farmers + today's date
  Right: "Add Farmer" button (emerald, +16px icon)

11.2 Search Bar (.premium-card)
  Single search input inside a card
  padding: "12px 12px 12px 52px" | Search icon at left: 16px
  focus: border-color #15803d | background #fff

11.3 Farmer Cards Grid
  display: grid | grid-template-columns: repeat(auto-fill, minmax(280px, 1fr))
  Each card (.premium-card, padding 1.75rem, cursor pointer):
    Top row: Avatar letter (48×48, emerald tint square) | Balance (right aligned)
    Balance colour: amber (#d97706) if balance > 0, green (#16a34a) if ≤ 0
    Name: 1.125rem, weight 900
    Phone row: icon square (32×32, #f8fafc bg) + mobile number
    Address row (if present): MapPin icon + address text
    Bottom row (border-top): "View Ledger" + ArrowRight (emerald)

11.4 Add Farmer Modal
  Trigger: "Add Farmer" header button
  Backdrop: rgba(15,23,42,0.6) + backdrop-blur(8px) | click outside to close
  Panel: bg #fff | max-width 480px | border-radius 24px | box-shadow large
  Fields: Name (required) | Mobile (required) | Address (textarea, optional) | Opening Balance (optional) | Balance Type (Due/Advance)
  Field labels: 10px, weight 900, uppercase, muted — above each input
  Input style: same standard (padding 12px 16px, no icon, 12px border-radius)
  Footer: [Cancel (grey)] + [Save (emerald, 2× flex)]
  Loader: Loader2 spinning icon shown on submit

11.5 Loading state
  3 skeleton .premium-card boxes at h-220px with pulse animation

11.6 API
  GET /api/farmers?search=... | POST /api/farmers

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
12. Customers Page (/dashboard/customers)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Identical pattern to Farmers page with the following differences:
  Accent colour: #0369a1 (sky blue) throughout
  Balance colour: red (#dc2626) if balance > 0 (customer owes money), green if ≤ 0
  Header button: "Add Customer"
  Modal title: "Add Customer"
  Fields: Same as Farmer (Name, Mobile, Address, Opening Balance, Balance Type)
  API: GET /api/customers?search=... | POST /api/customers

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
13. Pricing Rules
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
13.1 Weight-Based (WEIGHT mode)
  Quantity entered in KG. Price entered per 10 KG.
  Total = (quantity ÷ 10) × price
  UI badge: "per 10 KG" (blue/green tinted pill)
  Example: 50 KG × ₹120/10KG = ₹600

13.2 Unit-Based (UNIT mode)
  Quantity in crates/units. Price per unit.
  Total = quantity × price
  UI badge: "per Unit"
  Example: 5 crates × ₹800 = ₹4,000

  Mode comes from item.defaultPricingMode. Displayed as a badge on each line row.
  Staff can override by changing the item's default at the item master level.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
14. Payment & Ledger System
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
14.1 Payment Recording
  Fields: Amount (₹) | Date (default: today) | Mode (Cash/Bank/Other) | Notes
  Supports partial payments — one bill can have multiple payment records.
  RecordedBy: auto-logged from JWT session.

14.2 Ledger View
  Chronological list: Date | Description (e.g., Bill #, Payment, Opening Balance) | Amount In/Out | Running Balance
  Current balance shown prominently at top.
  Designed to be read aloud on a phone call with a farmer or customer.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
15. Tax & Service Charge Configuration
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Admin configures once via /api/config. Staff cannot modify.

  Field                  Type               Scope
  Tax                    % or Fixed ₹       Customer sale bills only
  Service Charge         % or Fixed ₹       Customer sale bills only
  Labour Charges         Fixed ₹ (manual)   Entered per sale bill
  Freight Charges        Fixed ₹ (manual)   Entered per sale bill
  Advance Deduction      Fixed ₹ (manual)   Entered per bill, deducted last
  Others Amount          Fixed ₹ (manual)   Miscellaneous charges/deductions

Purchase bills deduct labour, freight, advance, and others from the item subtotal.
Sale bills apply tax and service charge to (subtotal + labour + freight).

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
16. Internationalisation (i18n)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Supported languages: English (en) | Hindi (hi) | Marathi (mr)
Implementation: useTranslation() hook → calls t("key.sub.key")
Translation files: src/lib/i18n/{module}/{language}.json

Date formatting:
  en → en-IN locale | hi → hi-IN locale | mr → mr-IN locale
  Applied to all date displays in dashboards and headers.

Rules for new pages:
  • All user-visible strings MUST use t("...") — no hardcoded English
  • Add matching keys to all 3 language files before deploying

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
17. API Error Handling Standard
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
All API calls in page components must follow this pattern:
  1. Check r.ok before parsing (if (!r.ok) throw or return null)
  2. Parse text first, then JSON.parse — never call r.json() directly
     (prevents crash on empty 204 responses or HTML error pages)
  3. Wrap in try/catch — log errors to console, show toast.error on failure
  4. Sonner toast is the only user-facing error feedback mechanism

Example:
  const r = await fetch("/api/...");
  if (r.ok) { const text = await r.text(); if (text) setData(JSON.parse(text)); }

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
18. Audit Trail & Returns
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
18.1 Audit Log (Backend Only)
Stored in AuditLog table. Currently lacks a dedicated Admin UI.
  Event              Data Recorded
  Bill Created       User, bill ID, farmer/customer, total, timestamp
  Payment Recorded   User, amount, mode, bill reference, timestamp
  Record Modified    User, field changed, old/new value, timestamp
  Login / Logout     User, IP address, timestamp

18.2 Returns (Pending UI)
Schema support exists for Return and ReturnItem. UI for processing returns is planned for v2.1.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
19. Expense Management Module
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
19.1 Module Overview
The Expense Module manages all normal business-related expenses and integrates them into
financial reporting.
This module supports:
• Manual expense recording by Admin only
• Expense reporting
• Profit calculation impact
Expenses are tracked independently from customer and farmer ledgers.

19.2 Expense Entry
1. Only the Admin user is allowed to create expense entries.
2. Staff users do not have permission to create expenses.

Required Fields:
1. Expense date
2. Expense amount
3. Payment mode (Cash / Bank / Other)
4. Category (Rent, Electricity, Tea, etc.)
5. Description / notes
6. Created by user (Admin)
7. Timestamp

Validation Rules:
1. Expense amount must be greater than zero.
2. Expense date cannot be in the future.
3. Payment mode selection is mandatory.

19.3 Editing & Deletion
1. Only the Admin user may edit or delete expense entries.
2. Editing or deletion creates an audit log entry.
3. Deletion uses a "soft delete" pattern (deletedAt timestamp) to preserve financial history.

19.4 Financial Integration & Profit Impact
1. Expenses are included in Profit calculation reports and Financial summaries.
2. Expenses reduce net profit.
3. Profit is computed as: Profit = Earnings (Commissions/Charges) - Business Expenses.

19.5 Audit Requirements
Each expense action (Create, Update, Delete) stores:
• User ID
• Timestamp
• Action performed
• Previous value (if modified)
• New value
Audit records are immutable and stored in the AuditLog table.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
20. Reports
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
20.1 Operational (Admin + Staff)
  • Farmer Purchase History (filter by date)
  • Customer Sales History (filter by date)
  • Payment History (filter by date, mode)
  • Daily Transaction Summary
  • Business Expense Report (filter by date, category)

20.2 Financial (Admin only)
  • Outstanding Dues | Farmer Payables | Customer Receivables

20.3 Business Insights (Admin only)
  • Daily Profit Summary | Monthly Profit Analysis
  • Top Customers | Top Farmers | Item-wise Sales Trends

All reports: prominent date range picker at top, default = Today.
Most important number in largest text at top of each report.
Export: PDF and Excel.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
21. Security
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• JWT stored in HTTP-only cookie (not localStorage)
• Passwords: bcrypt hashed
• Session decoded in server-side layouts (src/app/(dashboard)/layout.tsx)
  → user.name and user.role passed to AppShell as props
• Role-based access enforced on all API route handlers
• Admin cannot be deleted from the system
• All protected pages check session; redirect to /login if not authenticated

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
22. Product Roadmap (Future Improvements)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Feature                          Priority
  Dashboard Visualizations         High (Charts for sales/profit trends)
  Audit Log Viewer                 High (Admin interface for system transparency)
  Bill Returns UI                  High (Full lifecycle for rejected/returned goods)
  Bulk Payment Collection          Medium (Quick-pay for multiple due bills)
  Advanced Filter/Search           Medium (Global search and deeper report filtering)
  Native Mobile App (PWA)          Medium (Better offline/shortcut support)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
23. Non-Goals (Explicitly Out of Scope for v2.0)
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Feature                          Reason
  Payment Gateway Integration      Cash/bank only; not required in v2
  GST Filing Automation            Deferred to future version
  Accounting Software Integration  Out of scope for v2
  Multi-Branch Support             Single location only
  Permanent Inventory / Stock      Not needed; daily veg trading confirmed by owner
  Offline Mode                     Progressive enhancement; not implemented in v2

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
23. Glossary
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Term                  Meaning
Kisan / Farmer        Supplier who sells vegetables to the business
Customer / Buyer      Person or shop that buys vegetables from the business
Mandi                 Wholesale vegetable market
Pending Balance       Amount owed (to farmer) or receivable (from customer)
Hamali / Labour       Manual loading/unloading charge on customer bill
Dhulai / Freight      Transportation charge on customer bill
Advance               Pre-payment received; deducted from final bill total
Gross Total           Bill amount before advance deduction
Net Total / Payable   Final amount after all charges and advance deduction
premium-card          CSS class for the standard card component (white bg, shadow, rounded)
Architectural Emerald The name of the application design system
FRD                   Functional Requirements Document
WEIGHT mode           Pricing calculated per 10 KG
UNIT mode             Pricing calculated per unit/crate
AppShell              The root layout component wrapping all dashboard pages
BottomNav             Fixed mobile bottom tab bar (hidden on desktop)
Modal                 Centralized UI component for all dialogs and forms

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
24. Opening Balance Entry
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
24.1 Feature Description
The system allows the Admin to enter an initial account balance when creating a new farmer
or customer. This is required to carry forward previous dues or advance payments that
existed before using the system.

24.2 Functional Requirements
1. Opening Balance Field
   • During creation, a numeric Opening Balance field is provided (default: 0).
   • Supports both outstanding dues and advance/credit balances.
2. Balance Type Selection
   • Type selector: [Receivable / Payable Due] or [Advance / Credit Balance].
   • For Customers: Due (Customer owes money) | Advance (Business owes value).
   • For Farmers: Due (Business owes money) | Advance (Farmer has been pre-paid).
3. Ledger Entry Creation
   • Entering an opening balance automatically creates a ledger entry.
   • Record includes: Entity Type, Entity ID, Amount, Type, Creation Date, and Reference.
4. Validation & Rules
   • Amount must be ≥ 0.
   • Balance is included in the running running ledger total.
   • Opening balance is IMMUTABLE after creation. Corrections require a separate adjustment entry.

24.3 Reporting Impact
• Opening balance entries appear at the top of the ledger history.
• Opening balances are factored into all due calculations and financial reports.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
25. Unified Bill Format Specification
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
25.1 Overview
A professional, unified document structure used for both Farmer (Purchase) and Customer (Sale)
bills. Designed for high readability, branding consistency, and mobile payment efficiency.

25.2 Bill Header Section
• Business Information: Centered at top. Includes Business Name, Address, Description, Contact.
• Metadata (Top Right): Bill Number, Date, Location Jurisdiction.
• Brand Identity: Supports a custom business logo (stored as optimized WebP Base64).

25.3 Party Information Section
• Farmer Bill: Displays Name, Village/Address, Mobile.
• Customer Bill: Displays Name, Mobile, Bill Date.

25.4 Item Details Table (Dual Quantity Structure)
The table MUST display both physical count and weight:
1. Sr. No.
2. Item Name & Mode (e.g., Tomato - per 10 KG)
3. Units (Crates / Qty)
4. Weight (KG)
5. Rate (Price per calculated unit)
6. Amount (Line Total)
Footer Totals: Sum of Units, Sum of Weight, Sum of Amount.

25.5 Charges & Adjustments Section
• For Farmer Bills: Deductions (Commission, Advance, Labour/Hamali, Freight, Others).
• For Customer Bills: Additions (Labour, Freight, Tax, Service Charge) and Deductions (Advance).

25.6 Summary Section (Bottom-Right)
• Gross Amount: Total from items table.
• Total Charges: Aggregate of all adjustments.
• Net Total: The final payable/receivable amount.
• Labels: "Net Payable" (Farmer) vs "Final Amount / Total Due" (Customer).

25.7 Branding & Payment Features
• Dynamic UPI QR Code: Generated in the summary area for Sale Bills. Pre-fills the
  Amount and Business Name for instant mobile payments using `upi://` protocol.
• Logo Storage: Business logos are uploaded via Settings, processed server-side using
  Sharp (resized and converted to WebP), and stored as a Base64 string in the database
  to avoid reliance on 3rd party file providers (Vercel-native approach).

25.8 Print Layout & Page Sizes
The system supports the following standard Indian paper sizes:
1. A4 Size: 210 × 297 mm (Standard office)
2. A5 Size: 148 × 210 mm (Compact/Half-page)
3. Legal Size: 216 × 356 mm (Long traditional)
4. Folio / F4 Size: ~215 × 330 mm (Older accounting registers)

Selection Behavior:
• User selects page size during print preview.
• Default page size can be saved in Business Settings.
• Layout scales dynamically using CSS `@media print` rules.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
— End of Document — Version 2.0 | February 2026
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
