"use client";

import { useState, useEffect } from "react";
import {
  ShoppingCart,
  Plus,
  Trash2,
  Calculator,
  Save,
  Search,
  ArrowRight,
  X,
  UserCircle,
  Package,
  TrendingUp,
  Clock,
  Loader2,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { saleBillSchema } from "@/lib/schemas";

interface Customer {
  id: string;
  name: string;
  mobile: string;
}
interface Item {
  id: string;
  name: string;
  defaultPricingMode: "WEIGHT" | "WEIGHT_KG" | "UNIT";
}
interface BillLine {
  itemId: string;
  itemName: string;
  pricingMode: "WEIGHT" | "WEIGHT_KG" | "UNIT";
  quantity: string;
  quantityKg: string;
  quantityUnits: string;
  price: string;
  total: number;
}
interface BusinessConfig {
  taxType: "PERCENTAGE" | "FIXED";
  taxValue: number;
  serviceChargeType: "PERCENTAGE" | "FIXED";
  serviceChargeValue: number;
}

export default function NewSaleBillPage() {
  const { t } = useTranslation();
  const router = useRouter();

  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [lines, setLines] = useState<BillLine[]>([]);
  const [config, setConfig] = useState<BusinessConfig | null>(null);
  const [customerSearch, setCustomerSearch] = useState("");
  const [customersList, setCustomersList] = useState<Customer[]>([]);
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const [itemSearch, setItemSearch] = useState("");
  const [itemsList, setItemsList] = useState<Item[]>([]);
  const [isItemDropdownOpen, setIsItemDropdownOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [customerPage, setCustomerPage] = useState(1);
  const [hasMoreCustomers, setHasMoreCustomers] = useState(true);
  const [isCustomerLoading, setIsCustomerLoading] = useState(false);
  const [debouncedCustomerSearch, setDebouncedCustomerSearch] = useState("");

  const [itemPage, setItemPage] = useState(1);
  const [hasMoreItems, setHasMoreItems] = useState(true);
  const [isItemLoading, setIsItemLoading] = useState(false);
  const [debouncedItemSearch, setDebouncedItemSearch] = useState("");

  useEffect(() => {
    fetch("/api/config")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setConfig(d))
      .catch(() => {});
  }, []);

  // Debounce customer search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedCustomerSearch(customerSearch);
      setCustomerPage(1);
      setHasMoreCustomers(true);
    }, 400);
    return () => clearTimeout(timer);
  }, [customerSearch]);

  // Debounce item search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedItemSearch(itemSearch);
      setItemPage(1);
      setHasMoreItems(true);
    }, 400);
    return () => clearTimeout(timer);
  }, [itemSearch]);

  useEffect(() => {
    if (!isCustomerDropdownOpen) return;
    const controller = new AbortController();
    const fetchCustomersList = async () => {
      if (!hasMoreCustomers && customerPage !== 1) return;
      setIsCustomerLoading(true);
      try {
        const res = await fetch(
          `/api/customers?search=${encodeURIComponent(debouncedCustomerSearch)}&page=${customerPage}&limit=20`,
          { signal: controller.signal },
        );
        const result = await res.json();
        if (result.data) {
          setCustomersList((prev) =>
            customerPage === 1 ? result.data : [...prev, ...result.data],
          );
          setHasMoreCustomers(
            result.pagination.page < result.pagination.totalPages,
          );
        }
      } finally {
        setIsCustomerLoading(false);
      }
    };
    fetchCustomersList();
    return () => controller.abort();
  }, [debouncedCustomerSearch, customerPage, isCustomerDropdownOpen]);

  useEffect(() => {
    if (!isItemDropdownOpen) return;
    const controller = new AbortController();
    const fetchItemsList = async () => {
      if (!hasMoreItems && itemPage !== 1) return;
      setIsItemLoading(true);
      try {
        const res = await fetch(
          `/api/items?search=${encodeURIComponent(debouncedItemSearch)}&page=${itemPage}&limit=20&activeOnly=true`,
          { signal: controller.signal },
        );
        const result = await res.json();
        if (result.data) {
          setItemsList((prev) =>
            itemPage === 1 ? result.data : [...prev, ...result.data],
          );
          setHasMoreItems(
            result.pagination.page < result.pagination.totalPages,
          );
        }
      } finally {
        setIsItemLoading(false);
      }
    };
    fetchItemsList();
    return () => controller.abort();
  }, [debouncedItemSearch, itemPage, isItemDropdownOpen]);

  const addLine = (item: Item) => {
    setLines([
      ...lines,
      {
        itemId: item.id,
        itemName: item.name,
        pricingMode: item.defaultPricingMode,
        quantity: "",
        quantityKg: "",
        quantityUnits: "",
        price: "",
        total: 0,
      },
    ]);
    setItemSearch("");
    setIsItemDropdownOpen(false);
  };
  const updateLine = (index: number, field: keyof BillLine, value: any) => {
    const newLines = [...lines];
    if (
      field === "quantity" ||
      field === "quantityKg" ||
      field === "quantityUnits" ||
      field === "price"
    ) {
      if (value !== "" && !/^\d*\.?\d{0,2}$/.test(value)) return;
    }
    (newLines[index] as any)[field] = value;
    const l = newLines[index];

    // Auto-sync the virtual "quantity" based on what the pricing mode expects
    if (l.pricingMode === "WEIGHT" || l.pricingMode === "WEIGHT_KG") {
      l.quantity = l.quantityKg;
    } else {
      l.quantity = l.quantityUnits;
    }

    const q = parseFloat(l.quantity) || 0;
    const p = parseFloat(l.price) || 0;

    if (l.pricingMode === "WEIGHT") {
      l.total = (q / 10) * p;
    } else if (l.pricingMode === "WEIGHT_KG") {
      l.total = q * p;
    } else {
      l.total = q * p;
    }
    setLines(newLines);
  };
  const removeLine = (index: number) =>
    setLines(lines.filter((_, i) => i !== index));

  const subtotal = lines.reduce((acc, l) => acc + l.total, 0);
  const taxAmount = config
    ? config.taxType === "PERCENTAGE"
      ? subtotal * (config.taxValue / 100)
      : Number(config.taxValue)
    : 0;
  const serviceChargeAmount = config
    ? config.serviceChargeType === "PERCENTAGE"
      ? subtotal * (config.serviceChargeValue / 100)
      : Number(config.serviceChargeValue)
    : 0;
  const grossTotal = subtotal + taxAmount + serviceChargeAmount;
  const netTotal = grossTotal;

  const handleSubmit = async () => {
    const data = {
      customerId: selectedCustomer?.id || "",
      items: lines.map((l) => ({
        itemId: l.itemId,
        pricingMode: l.pricingMode,
        quantity: parseFloat(l.quantity) || 0,
        quantityKg: parseFloat(l.quantityKg) || 0,
        quantityUnits: parseFloat(l.quantityUnits) || 0,
        pricePerUnit: parseFloat(l.price) || 0,
      })),
    };

    const result = saleBillSchema.safeParse(data);
    if (!result.success) {
      toast.error(result.error.issues[0].message);
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch("/api/bills/sale", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        toast.success(t("bills.purchase.success"));
        router.push("/bills");
      } else {
        const err = await res.json();
        toast.error(err.error || t("bills.purchase.error"));
      }
    } catch {
      toast.error(t("bills.purchase.error"));
    } finally {
      setIsSubmitting(false);
    }
  };

  const fmt = (n: number) => `₹ ${n.toLocaleString("en-IN")}`;

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: "2rem",
        overflowX: "hidden",
      }}
    >
      {/* ── Header ── */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "1rem",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "1.875rem",
              fontWeight: 900,
              color: "var(--text-main)",
              letterSpacing: "-0.02em",
              margin: 0,
              lineHeight: 1.2,
            }}
          >
            {t("bills.sale.title")}
          </h1>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              marginTop: "6px",
            }}
          >
            <div
              style={{
                height: "3px",
                width: "24px",
                backgroundColor: "#0369a1",
                borderRadius: "2px",
              }}
            />
            <p
              style={{
                margin: 0,
                fontSize: "11px",
                fontWeight: 800,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.15em",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              <Clock size={12} />
              {t("bills.sale.subtitle")}
            </p>
          </div>
        </div>
        <Link
          href="/bills"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 20px",
            backgroundColor: "#f1f5f9",
            color: "#64748b",
            borderRadius: "12px",
            fontWeight: 800,
            fontSize: "14px",
            textDecoration: "none",
            transition: "all 0.2s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#e2e8f0";
            e.currentTarget.style.color = "#0f172a";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#f1f5f9";
            e.currentTarget.style.color = "#64748b";
          }}
        >
          <X size={16} /> {t("common.cancel")}
        </Link>
      </div>

      {/* ── Main Grid ── */}
      <div
        style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1.5rem" }}
        className="sale-bill-grid"
      >
        {/* Left Column */}
        <div
          style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
        >
          {/* Customer Card */}
          <div className="premium-card" style={{ padding: "1.75rem" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "1.25rem",
              }}
            >
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  backgroundColor: "rgba(3,105,161,0.1)",
                  borderRadius: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#0369a1",
                }}
              >
                <UserCircle size={18} strokeWidth={2} />
              </div>
              <p
                style={{
                  margin: 0,
                  fontSize: "14px",
                  fontWeight: 900,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.2em",
                }}
              >
                {t("bills.sale.selectCustomer")}
              </p>
            </div>

            {selectedCustomer ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "1rem 1.25rem",
                  backgroundColor: "rgba(3,105,161,0.06)",
                  border: "1.5px solid rgba(3,105,161,0.15)",
                  borderRadius: "16px",
                }}
              >
                <div
                  style={{ display: "flex", alignItems: "center", gap: "12px" }}
                >
                  <div
                    style={{
                      width: "44px",
                      height: "44px",
                      backgroundColor: "#0369a1",
                      color: "#fff",
                      borderRadius: "12px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontWeight: 900,
                      fontSize: "18px",
                    }}
                  >
                    {selectedCustomer.name.charAt(0)}
                  </div>
                  <div>
                    <p
                      style={{
                        margin: 0,
                        fontWeight: 900,
                        fontSize: "15px",
                        color: "#0c4a6e",
                      }}
                    >
                      {selectedCustomer.name}
                    </p>
                    <p
                      style={{
                        margin: "2px 0 0",
                        fontSize: "12px",
                        fontWeight: 700,
                        color: "#0369a1",
                        opacity: 0.7,
                      }}
                    >
                      {selectedCustomer.mobile}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  style={{
                    width: "36px",
                    height: "36px",
                    borderRadius: "50%",
                    border: "none",
                    backgroundColor: "#fff",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#94a3b8",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.08)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.color = "#ef4444";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.color = "#94a3b8";
                  }}
                >
                  <X size={18} />
                </button>
              </div>
            ) : (
              <div style={{ position: "relative" }}>
                <Search
                  style={{
                    position: "absolute",
                    left: "16px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#94a3b8",
                  }}
                  size={18}
                />
                <input
                  type="text"
                  placeholder={t("bills.sale.customerPlaceholder")}
                  value={customerSearch}
                  onFocus={() => setIsCustomerDropdownOpen(true)}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "14px 14px 14px 52px",
                    backgroundColor: "#f1f5f9",
                    border: "1.5px solid #e2e8f0",
                    borderRadius: "14px",
                    fontSize: "14px",
                    fontWeight: 700,
                    color: "var(--text-main)",
                    outline: "none",
                    transition: "all 0.2s",
                  }}
                  onFocusCapture={(e) => {
                    e.currentTarget.style.borderColor = "#0369a1";
                    e.currentTarget.style.backgroundColor = "#fff";
                  }}
                  onBlurCapture={(e) => {
                    e.currentTarget.style.borderColor = "#e2e8f0";
                    e.currentTarget.style.backgroundColor = "#f1f5f9";
                  }}
                />
                {isCustomerDropdownOpen &&
                  (debouncedCustomerSearch.length > 0 ||
                    customersList.length > 0) && (
                    <div
                      style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        right: 0,
                        marginTop: "8px",
                        backgroundColor: "#fff",
                        border: "1px solid var(--border-main)",
                        borderRadius: "16px",
                        boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
                        zIndex: 100,
                        padding: "6px",
                        maxHeight: "280px",
                        overflowY: "auto",
                      }}
                      onScroll={(e) => {
                        const { scrollTop, scrollHeight, clientHeight } =
                          e.currentTarget;
                        if (
                          scrollHeight - scrollTop <= clientHeight + 50 &&
                          hasMoreCustomers &&
                          !isCustomerLoading
                        ) {
                          setCustomerPage((p) => p + 1);
                        }
                      }}
                    >
                      {customersList.map((c) => (
                        <button
                          key={c.id}
                          onMouseDown={() => {
                            setSelectedCustomer(c);
                            setCustomerSearch("");
                            setIsCustomerDropdownOpen(false);
                          }}
                          style={{
                            width: "100%",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            padding: "12px 14px",
                            border: "none",
                            backgroundColor: "transparent",
                            cursor: "pointer",
                            borderRadius: "12px",
                            transition: "background 0.15s",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor =
                              "rgba(3,105,161,0.06)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor =
                              "transparent";
                          }}
                        >
                          <div style={{ textAlign: "left" }}>
                            <p
                              style={{
                                margin: 0,
                                fontWeight: 800,
                                color: "#1e293b",
                                fontSize: "14px",
                              }}
                            >
                              {c.name}
                            </p>
                            <p
                              style={{
                                margin: "2px 0 0",
                                fontSize: "12px",
                                color: "#94a3b8",
                                fontWeight: 600,
                              }}
                            >
                              {c.mobile}
                            </p>
                          </div>
                          <ArrowRight size={16} color="#cbd5e1" />
                        </button>
                      ))}
                      {isCustomerLoading && (
                        <div style={{ padding: "12px", textAlign: "center" }}>
                          <Loader2
                            size={18}
                            style={{ animation: "spin 0.6s linear infinite" }}
                            color="var(--primary-main)"
                          />
                        </div>
                      )}
                      {!isCustomerLoading &&
                        customersList.length === 0 &&
                        debouncedCustomerSearch.length > 0 && (
                          <p
                            style={{
                              padding: "12px",
                              margin: 0,
                              textAlign: "center",
                              fontSize: "12px",
                              color: "#94a3b8",
                              fontWeight: 700,
                            }}
                          >
                            No customers found
                          </p>
                        )}
                    </div>
                  )}
              </div>
            )}
          </div>

          {/* Items Card */}
          <div className="premium-card" style={{ overflow: "hidden" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "1rem",
                padding: "1.5rem 1.75rem",
                borderBottom: "1px solid var(--border-main)",
                background:
                  "linear-gradient(to right, rgba(255,255,255,1), rgba(248,250,252,1))",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "10px" }}
              >
                <div
                  style={{
                    width: "36px",
                    height: "36px",
                    backgroundColor: "rgba(3,105,161,0.1)",
                    borderRadius: "10px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#0369a1",
                  }}
                >
                  <Package size={18} strokeWidth={2} />
                </div>
                <p
                  style={{
                    margin: 0,
                    fontSize: "14px",
                    fontWeight: 900,
                    color: "var(--text-muted)",
                    textTransform: "uppercase",
                    letterSpacing: "0.2em",
                  }}
                >
                  {t("bills.purchase.billItems")}
                </p>
              </div>
              <div style={{ position: "relative", flex: "1", minWidth: 0 }}>
                <Plus
                  style={{
                    position: "absolute",
                    left: "14px",
                    top: "50%",
                    transform: "translateY(-50%)",
                    color: "#94a3b8",
                  }}
                  size={16}
                />
                <input
                  type="text"
                  placeholder={t("bills.purchase.addItem")}
                  value={itemSearch}
                  onFocus={() => setIsItemDropdownOpen(true)}
                  onChange={(e) => setItemSearch(e.target.value)}
                  style={{
                    width: "100%",
                    boxSizing: "border-box",
                    padding: "10px 12px 10px 44px",
                    backgroundColor: "#f1f5f9",
                    border: "1.5px solid #e2e8f0",
                    borderRadius: "12px",
                    fontSize: "13px",
                    fontWeight: 700,
                    color: "var(--text-main)",
                    outline: "none",
                    transition: "all 0.2s",
                  }}
                  onFocusCapture={(e) => {
                    e.currentTarget.style.borderColor = "#0369a1";
                    e.currentTarget.style.backgroundColor = "#fff";
                  }}
                  onBlurCapture={(e) => {
                    e.currentTarget.style.borderColor = "#e2e8f0";
                    e.currentTarget.style.backgroundColor = "#f1f5f9";
                  }}
                />
                {isItemDropdownOpen &&
                  (debouncedItemSearch.length > 0 || itemsList.length > 0) && (
                    <div
                      style={{
                        position: "absolute",
                        top: "100%",
                        left: 0,
                        right: 0,
                        marginTop: "8px",
                        backgroundColor: "#fff",
                        border: "1px solid var(--border-main)",
                        borderRadius: "14px",
                        boxShadow: "0 20px 40px rgba(0,0,0,0.1)",
                        zIndex: 100,
                        padding: "4px",
                        maxHeight: "240px",
                        overflowY: "auto",
                      }}
                      onScroll={(e) => {
                        const { scrollTop, scrollHeight, clientHeight } =
                          e.currentTarget;
                        if (
                          scrollHeight - scrollTop <= clientHeight + 50 &&
                          hasMoreItems &&
                          !isItemLoading
                        ) {
                          setItemPage((p) => p + 1);
                        }
                      }}
                    >
                      {itemsList.map((item) => (
                        <button
                          key={item.id}
                          onMouseDown={() => addLine(item)}
                          style={{
                            width: "100%",
                            display: "block",
                            textAlign: "left",
                            padding: "10px 14px",
                            border: "none",
                            backgroundColor: "transparent",
                            cursor: "pointer",
                            borderRadius: "10px",
                            fontSize: "13px",
                            fontWeight: 700,
                            color: "#1e293b",
                            transition: "background 0.15s",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor =
                              "rgba(3,105,161,0.06)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor =
                              "transparent";
                          }}
                        >
                          {item.name}
                        </button>
                      ))}
                      {isItemLoading && (
                        <div style={{ padding: "10px", textAlign: "center" }}>
                          <Loader2
                            size={16}
                            style={{ animation: "spin 0.6s linear infinite" }}
                            color="var(--primary-main)"
                          />
                        </div>
                      )}
                      {!isItemLoading &&
                        itemsList.length === 0 &&
                        debouncedItemSearch.length > 0 && (
                          <p
                            style={{
                              padding: "10px",
                              margin: 0,
                              textAlign: "center",
                              fontSize: "12px",
                              color: "#94a3b8",
                              fontWeight: 700,
                            }}
                          >
                            No items found
                          </p>
                        )}
                    </div>
                  )}
              </div>
            </div>

            {lines.length === 0 ? (
              <div
                style={{
                  padding: "4rem",
                  textAlign: "center",
                  color: "#e2e8f0",
                }}
              >
                <ShoppingCart
                  size={40}
                  style={{ margin: "0 auto 1rem", opacity: 0.4 }}
                />
                <p
                  style={{
                    margin: 0,
                    fontSize: "12px",
                    fontWeight: 800,
                    textTransform: "uppercase",
                    letterSpacing: "0.15em",
                  }}
                >
                  {t("bills.purchase.emptyItems")}
                </p>
              </div>
            ) : (
              <div>
                {/* Desktop Table */}
                <table
                  style={{ width: "100%", borderCollapse: "collapse" }}
                  className="bill-items-table"
                >
                  <thead>
                    <tr style={{ backgroundColor: "#f8fafc" }}>
                      <th
                        style={{
                          padding: "12px 20px",
                          textAlign: "left",
                          fontSize: "14px",
                          fontWeight: 900,
                          color: "#94a3b8",
                          textTransform: "uppercase",
                          letterSpacing: "0.1em",
                        }}
                      >
                        {t("bills.purchase.item")}
                      </th>
                      <th
                        style={{
                          padding: "12px 16px",
                          textAlign: "center",
                          fontSize: "14px",
                          fontWeight: 900,
                          color: "#94a3b8",
                          textTransform: "uppercase",
                          letterSpacing: "0.1em",
                        }}
                      >
                        {t("bills.purchase.quantity")} (Units)
                      </th>
                      <th
                        style={{
                          padding: "12px 16px",
                          textAlign: "center",
                          fontSize: "14px",
                          fontWeight: 900,
                          color: "#94a3b8",
                          textTransform: "uppercase",
                          letterSpacing: "0.1em",
                        }}
                      >
                        {t("bills.purchase.quantity")} (KG)
                      </th>
                      <th
                        style={{
                          padding: "12px 16px",
                          textAlign: "center",
                          fontSize: "14px",
                          fontWeight: 900,
                          color: "#94a3b8",
                          textTransform: "uppercase",
                          letterSpacing: "0.1em",
                        }}
                      >
                        {t("bills.purchase.price")}
                      </th>
                      <th
                        style={{
                          padding: "12px 20px",
                          textAlign: "right",
                          fontSize: "14px",
                          fontWeight: 900,
                          color: "#94a3b8",
                          textTransform: "uppercase",
                          letterSpacing: "0.1em",
                        }}
                      >
                        {t("bills.purchase.total")}
                      </th>
                      <th style={{ padding: "12px 16px" }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((line, idx) => (
                      <tr
                        key={idx}
                        style={{ borderBottom: "1px solid #f1f5f9" }}
                      >
                        <td style={{ padding: "16px 20px" }}>
                          <p
                            style={{
                              margin: 0,
                              fontWeight: 800,
                              fontSize: "14px",
                              color: "#1e293b",
                            }}
                          >
                            {line.itemName}
                          </p>
                          <span
                            style={{
                              fontSize: "14px",
                              fontWeight: 800,
                              color: "#0369a1",
                              backgroundColor: "rgba(3,105,161,0.08)",
                              padding: "2px 8px",
                              borderRadius: "6px",
                              textTransform: "uppercase",
                            }}
                          >
                            {line.pricingMode === "WEIGHT"
                              ? "per 10 KG"
                              : line.pricingMode === "WEIGHT_KG"
                                ? "per KG"
                                : "per Unit"}
                          </span>
                        </td>
                        <td style={{ padding: "16px" }}>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={line.quantityUnits}
                            onChange={(e) =>
                              updateLine(idx, "quantityUnits", e.target.value)
                            }
                            style={{
                              width: "60px",
                              display: "block",
                              margin: "0 auto",
                              padding: "8px",
                              textAlign: "center",
                              backgroundColor: "#f1f5f9",
                              border: "1.5px solid #e2e8f0",
                              borderRadius: "10px",
                              fontWeight: 800,
                              fontSize: "14px",
                              outline: "none",
                              transition: "all 0.2s",
                            }}
                            onFocusCapture={(e) => {
                              e.currentTarget.style.borderColor = "#0369a1";
                              e.currentTarget.style.backgroundColor = "#fff";
                            }}
                            onBlurCapture={(e) => {
                              e.currentTarget.style.borderColor = "#e2e8f0";
                              e.currentTarget.style.backgroundColor = "#f1f5f9";
                            }}
                          />
                        </td>
                        <td style={{ padding: "16px" }}>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={line.quantityKg}
                            onChange={(e) =>
                              updateLine(idx, "quantityKg", e.target.value)
                            }
                            style={{
                              width: "70px",
                              display: "block",
                              margin: "0 auto",
                              padding: "8px",
                              textAlign: "center",
                              backgroundColor: "#f1f5f9",
                              border: "1.5px solid #e2e8f0",
                              borderRadius: "10px",
                              fontWeight: 800,
                              fontSize: "14px",
                              outline: "none",
                              transition: "all 0.2s",
                            }}
                            onFocusCapture={(e) => {
                              e.currentTarget.style.borderColor = "#0369a1";
                              e.currentTarget.style.backgroundColor = "#fff";
                            }}
                            onBlurCapture={(e) => {
                              e.currentTarget.style.borderColor = "#e2e8f0";
                              e.currentTarget.style.backgroundColor = "#f1f5f9";
                            }}
                          />
                        </td>
                        <td style={{ padding: "16px" }}>
                          <div
                            style={{
                              position: "relative",
                              width: "100px",
                              margin: "0 auto",
                            }}
                          >
                            <span
                              style={{
                                position: "absolute",
                                left: "10px",
                                top: "50%",
                                transform: "translateY(-50%)",
                                fontSize: "11px",
                                fontWeight: 800,
                                color: "#94a3b8",
                              }}
                            >
                              ₹
                            </span>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={line.price}
                              onChange={(e) =>
                                updateLine(idx, "price", e.target.value)
                              }
                              style={{
                                width: "100%",
                                boxSizing: "border-box",
                                padding: "8px 8px 8px 24px",
                                textAlign: "center",
                                backgroundColor: "#f1f5f9",
                                border: "1.5px solid #e2e8f0",
                                borderRadius: "10px",
                                fontWeight: 800,
                                fontSize: "14px",
                                outline: "none",
                                transition: "all 0.2s",
                              }}
                              onFocusCapture={(e) => {
                                e.currentTarget.style.borderColor = "#0369a1";
                                e.currentTarget.style.backgroundColor = "#fff";
                              }}
                              onBlurCapture={(e) => {
                                e.currentTarget.style.borderColor = "#e2e8f0";
                                e.currentTarget.style.backgroundColor =
                                  "#f1f5f9";
                              }}
                            />
                          </div>
                        </td>
                        <td
                          style={{
                            padding: "16px 20px",
                            textAlign: "right",
                            fontWeight: 900,
                            fontSize: "15px",
                            color: "#0f172a",
                          }}
                        >
                          {fmt(line.total)}
                        </td>
                        <td style={{ padding: "16px" }}>
                          <button
                            onClick={() => removeLine(idx)}
                            style={{
                              width: "34px",
                              height: "34px",
                              border: "none",
                              backgroundColor: "#f8fafc",
                              borderRadius: "10px",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#cbd5e1",
                              transition: "all 0.2s",
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = "#fef2f2";
                              e.currentTarget.style.color = "#ef4444";
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = "#f8fafc";
                              e.currentTarget.style.color = "#cbd5e1";
                            }}
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Mobile Cards */}
                <div className="bill-items-mobile">
                  {lines.map((line, idx) => (
                    <div
                      key={idx}
                      style={{
                        padding: "1.25rem 1.5rem",
                        borderBottom: "1px solid #f1f5f9",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          marginBottom: "1rem",
                        }}
                      >
                        <div>
                          <p
                            style={{
                              margin: 0,
                              fontWeight: 800,
                              fontSize: "15px",
                              color: "#1e293b",
                            }}
                          >
                            {line.itemName}
                          </p>
                          <span
                            style={{
                              fontSize: "14px",
                              fontWeight: 800,
                              color: "#0369a1",
                              backgroundColor: "rgba(3,105,161,0.08)",
                              padding: "2px 8px",
                              borderRadius: "6px",
                              textTransform: "uppercase",
                            }}
                          >
                            {line.pricingMode === "WEIGHT"
                              ? "per 10 KG"
                              : line.pricingMode === "WEIGHT_KG"
                                ? "per KG"
                                : "per Unit"}
                          </span>
                        </div>
                        <button
                          onClick={() => removeLine(idx)}
                          style={{
                            width: "32px",
                            height: "32px",
                            border: "none",
                            backgroundColor: "#f8fafc",
                            borderRadius: "8px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#cbd5e1",
                          }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                      <div
                        style={{
                          display: "grid",
                          gridTemplateColumns: "1fr 1fr 1fr",
                          gap: "0.75rem",
                        }}
                      >
                        <div>
                          <p
                            style={{
                              margin: "0 0 6px",
                              fontSize: "14px",
                              fontWeight: 800,
                              color: "#94a3b8",
                              textTransform: "uppercase",
                              letterSpacing: "0.1em",
                            }}
                          >
                            Qty (Units)
                          </p>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={line.quantityUnits}
                            onChange={(e) =>
                              updateLine(idx, "quantityUnits", e.target.value)
                            }
                            style={{
                              width: "100%",
                              boxSizing: "border-box",
                              padding: "10px",
                              textAlign: "center",
                              backgroundColor: "#f8fafc",
                              border: "1.5px solid transparent",
                              borderRadius: "10px",
                              fontWeight: 800,
                              fontSize: "15px",
                              outline: "none",
                            }}
                            onFocusCapture={(e) => {
                              e.currentTarget.style.borderColor = "#0369a1";
                              e.currentTarget.style.backgroundColor = "#fff";
                            }}
                            onBlurCapture={(e) => {
                              e.currentTarget.style.borderColor = "transparent";
                              e.currentTarget.style.backgroundColor = "#f8fafc";
                            }}
                          />
                        </div>
                        <div>
                          <p
                            style={{
                              margin: "0 0 6px",
                              fontSize: "14px",
                              fontWeight: 800,
                              color: "#94a3b8",
                              textTransform: "uppercase",
                              letterSpacing: "0.1em",
                            }}
                          >
                            {t("bills.purchase.quantity")} (KG)
                          </p>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={line.quantityKg}
                            onChange={(e) =>
                              updateLine(idx, "quantityKg", e.target.value)
                            }
                            style={{
                              width: "100%",
                              boxSizing: "border-box",
                              padding: "10px",
                              textAlign: "center",
                              backgroundColor: "#f8fafc",
                              border: "1.5px solid transparent",
                              borderRadius: "10px",
                              fontWeight: 800,
                              fontSize: "15px",
                              outline: "none",
                            }}
                            onFocusCapture={(e) => {
                              e.currentTarget.style.borderColor = "#0369a1";
                              e.currentTarget.style.backgroundColor = "#fff";
                            }}
                            onBlurCapture={(e) => {
                              e.currentTarget.style.borderColor = "transparent";
                              e.currentTarget.style.backgroundColor = "#f8fafc";
                            }}
                          />
                        </div>
                        <div>
                          <p
                            style={{
                              margin: "0 0 6px",
                              fontSize: "14px",
                              fontWeight: 800,
                              color: "#94a3b8",
                              textTransform: "uppercase",
                              letterSpacing: "0.1em",
                            }}
                          >
                            {t("bills.purchase.price")}
                          </p>
                          <div style={{ position: "relative" }}>
                            <span
                              style={{
                                position: "absolute",
                                left: "12px",
                                top: "50%",
                                transform: "translateY(-50%)",
                                fontSize: "12px",
                                fontWeight: 800,
                                color: "#94a3b8",
                              }}
                            >
                              ₹
                            </span>
                            <input
                              type="text"
                              inputMode="decimal"
                              value={line.price}
                              onChange={(e) =>
                                updateLine(idx, "price", e.target.value)
                              }
                              style={{
                                width: "100%",
                                boxSizing: "border-box",
                                padding: "10px 10px 10px 28px",
                                textAlign: "center",
                                backgroundColor: "#f8fafc",
                                border: "1.5px solid transparent",
                                borderRadius: "10px",
                                fontWeight: 800,
                                fontSize: "15px",
                                outline: "none",
                              }}
                              onFocusCapture={(e) => {
                                e.currentTarget.style.borderColor = "#0369a1";
                                e.currentTarget.style.backgroundColor = "#fff";
                              }}
                              onBlurCapture={(e) => {
                                e.currentTarget.style.borderColor =
                                  "transparent";
                                e.currentTarget.style.backgroundColor =
                                  "#f8fafc";
                              }}
                            />
                          </div>
                        </div>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          marginTop: "0.75rem",
                          padding: "10px 14px",
                          backgroundColor: "#f8fafc",
                          borderRadius: "10px",
                        }}
                      >
                        <span
                          style={{
                            fontSize: "14px",
                            fontWeight: 800,
                            color: "#94a3b8",
                            textTransform: "uppercase",
                            letterSpacing: "0.1em",
                          }}
                        >
                          {t("bills.purchase.total")}
                        </span>
                        <span
                          style={{
                            fontWeight: 900,
                            fontSize: "17px",
                            color: "#0f172a",
                          }}
                        >
                          {fmt(line.total)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column — Summary */}
        <div style={{ position: "sticky", top: "6rem", height: "fit-content" }}>
          <div
            className="premium-card"
            style={{
              padding: "1.75rem",
              backgroundColor: "#0f172a",
              border: "none",
              color: "#fff",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "1.5rem",
              }}
            >
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  backgroundColor: "rgba(255,255,255,0.07)",
                  borderRadius: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Calculator size={18} color="#60a5fa" />
              </div>
              <p
                style={{
                  margin: 0,
                  fontSize: "14px",
                  fontWeight: 900,
                  textTransform: "uppercase",
                  letterSpacing: "0.2em",
                  color: "#94a3b8",
                }}
              >
                {t("bills.purchase.summary")}
              </p>
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "0.875rem",
              }}
            >
              <span
                style={{
                  fontSize: "11px",
                  fontWeight: 800,
                  color: "#64748b",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                }}
              >
                {t("bills.purchase.subtotal")}
              </span>
              <span
                style={{ fontSize: "13px", fontWeight: 800, color: "#94a3b8" }}
              >
                {fmt(subtotal)}
              </span>
            </div>

            <div
              style={{
                height: "1px",
                backgroundColor: "rgba(255,255,255,0.07)",
                margin: "1rem 0",
              }}
            />

            {[
              {
                label: `${t("bills.purchase.tax")} ${config ? `(${config.taxValue}${config.taxType === "PERCENTAGE" ? "%" : "₹"})` : ""}`,
                value: fmt(taxAmount),
              },
              {
                label: `${t("bills.purchase.serviceCharge")} ${config ? `(${config.serviceChargeValue}${config.serviceChargeType === "PERCENTAGE" ? "%" : "₹"})` : ""}`,
                value: fmt(serviceChargeAmount),
              },
            ].map(({ label, value }) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "0.875rem",
                }}
              >
                <span
                  style={{
                    fontSize: "11px",
                    fontWeight: 800,
                    color: "#64748b",
                    textTransform: "uppercase",
                    letterSpacing: "0.1em",
                  }}
                >
                  {label}
                </span>
                <span
                  style={{
                    fontSize: "13px",
                    fontWeight: 800,
                    color: "#94a3b8",
                  }}
                >
                  {value}
                </span>
              </div>
            ))}

            <div
              style={{
                height: "1px",
                backgroundColor: "rgba(255,255,255,0.07)",
                margin: "1rem 0",
              }}
            />

            <div
              style={{
                marginTop: "1.5rem",
                padding: "1.25rem",
                backgroundColor: "rgba(255,255,255,0.04)",
                borderRadius: "14px",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  marginBottom: "0.5rem",
                }}
              >
                <TrendingUp size={13} color="#60a5fa" />
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: 900,
                    color: "#60a5fa",
                    textTransform: "uppercase",
                    letterSpacing: "0.15em",
                  }}
                >
                  {t("bills.sale.payable")}
                </span>
              </div>
              <p
                style={{
                  margin: 0,
                  fontSize: "2.25rem",
                  fontWeight: 900,
                  color: "#fff",
                  letterSpacing: "-0.03em",
                  lineHeight: 1,
                }}
              >
                <span
                  style={{
                    fontSize: "1.25rem",
                    color: "#475569",
                    marginRight: "4px",
                  }}
                >
                  ₹
                </span>
                {netTotal.toLocaleString("en-IN")}
              </p>
            </div>

            <button
              disabled={isSubmitting || lines.length === 0}
              onClick={handleSubmit}
              style={{
                width: "100%",
                marginTop: "1.25rem",
                padding: "14px",
                border: "none",
                borderRadius: "14px",
                cursor:
                  isSubmitting || lines.length === 0
                    ? "not-allowed"
                    : "pointer",
                backgroundColor:
                  isSubmitting || lines.length === 0 ? "#1e293b" : "#0369a1",
                color: isSubmitting || lines.length === 0 ? "#475569" : "#fff",
                fontWeight: 900,
                fontSize: "13px",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "8px",
                transition: "all 0.2s",
                boxShadow:
                  isSubmitting || lines.length === 0
                    ? "none"
                    : "0 8px 16px rgba(3,105,161,0.3)",
              }}
            >
              {isSubmitting ? (
                <div
                  style={{
                    width: "20px",
                    height: "20px",
                    border: "2px solid rgba(255,255,255,0.2)",
                    borderTopColor: "#fff",
                    borderRadius: "50%",
                    animation: "spin 0.6s linear infinite",
                  }}
                />
              ) : (
                <>
                  <Save size={18} /> {t("bills.purchase.confirm")}
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <style>{`
                @keyframes spin { to { transform: rotate(360deg); } }
                input[type=number]::-webkit-inner-spin-button, input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; }
                .bill-items-table { display: none; }
                .bill-items-mobile { display: block; }
                .sale-bill-grid { grid-template-columns: 1fr; }
                .charges-grid { grid-template-columns: 1fr; }
                @media (min-width: 640px) {
                    .charges-grid { grid-template-columns: repeat(3, 1fr); }
                }
                @media (min-width: 768px) {
                    .bill-items-table { display: table; }
                    .bill-items-mobile { display: none; }
                }
                @media (min-width: 1024px) {
                    .sale-bill-grid { grid-template-columns: 1fr 340px; }
                }
            `}</style>
    </div>
  );
}
