"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  ShoppingCart,
  Plus,
  Trash2,
  Calculator,
  Save,
  Search,
  X,
  UserCircle,
  Package,
  TrendingUp,
  Clock,
  Loader2,
  Info,
  UserPlus,
  ArrowRight,
} from "lucide-react";
import { useTranslation } from "@/lib/i18n";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createPortal } from "react-dom";

import { saleBillSchema } from "@/lib/schemas";
import Tooltip from "@/components/ui/Tooltip";
import { AddPartyModal } from "@/components/modals/AddPartyModal";
import { useUser } from "@/components/providers/UserContext";

/* ─── Types ─── */
interface Customer {
  id: string;
  name: string;
  mobile: string;
}
interface Item {
  id: string;
  name: string;
  defaultPricingMode: "WEIGHT" | "WEIGHT_KG" | "UNIT";
  availableKg: number;
  availableUnits: number;
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
  availableKg: number;
  availableUnits: number;
}
interface BusinessConfig {
  taxType: "PERCENTAGE" | "FIXED";
  taxValue: number;
  serviceChargeType: "PERCENTAGE" | "FIXED";
  serviceChargeValue: number;
  enableStockRestriction: boolean;
  billingMethod: "STANDARD" | "CUSTOM";
}

/* ─── Page ─── */
export default function NewSaleBillPage() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useUser();
  const isAdmin = user?.role === "ORG_ADMIN" || user?.role === "SUPER_ADMIN";

  /* ── State ── */
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(
    null,
  );
  const [lines, setLines] = useState<BillLine[]>([]);
  const [config, setConfig] = useState<BusinessConfig | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);

  // Customer search
  const [customerSearch, setCustomerSearch] = useState("");
  const [debouncedCustomerSearch, setDebouncedCustomerSearch] = useState("");
  const [customersList, setCustomersList] = useState<Customer[]>([]);
  const [isCustomerDropdownOpen, setIsCustomerDropdownOpen] = useState(false);
  const [isCustomerLoading, setIsCustomerLoading] = useState(false);
  const [customerPage, setCustomerPage] = useState(1);
  const [hasMoreCustomers, setHasMoreCustomers] = useState(true);
  const [munimRef, setMunimRef] = useState("");

  // Item search
  const [itemSearch, setItemSearch] = useState("");
  const [debouncedItemSearch, setDebouncedItemSearch] = useState("");
  const [itemsList, setItemsList] = useState<Item[]>([]);
  const [isItemDropdownOpen, setIsItemDropdownOpen] = useState(false);
  const [isItemLoading, setIsItemLoading] = useState(false);
  const [itemPage, setItemPage] = useState(1);
  const [hasMoreItems, setHasMoreItems] = useState(true);

  /* ── Refs ── */
  const customerSearchRef = useRef<HTMLDivElement>(null);
  const customerInputRef = useRef<HTMLInputElement>(null);
  const itemSearchRef = useRef<HTMLDivElement>(null);
  const itemInputRef = useRef<HTMLInputElement>(null);
  const qtyRefs = useRef<Map<string, HTMLInputElement>>(new Map());
  const qtyKgRefs = useRef<Map<string, HTMLInputElement>>(new Map());
  const priceRefs = useRef<Map<string, HTMLInputElement>>(new Map());
  const [mounted, setMounted] = useState(false);

  // Keyboard navigation focus
  const [focusedCustomerIndex, setFocusedCustomerIndex] = useState(-1);
  const [focusedItemIndex, setFocusedItemIndex] = useState(-1);

  // Reset focus when search changes
  useEffect(() => setFocusedCustomerIndex(0), [customersList]);
  useEffect(() => setFocusedItemIndex(0), [itemsList]);

  // Scroll active elements into view
  useEffect(() => {
    if (isItemDropdownOpen && focusedItemIndex >= 0) {
      document
        .getElementById(`item-option-${focusedItemIndex}`)
        ?.scrollIntoView({ block: "nearest" });
    }
  }, [focusedItemIndex, isItemDropdownOpen]);

  useEffect(() => {
    if (isCustomerDropdownOpen && focusedCustomerIndex >= 0) {
      document
        .getElementById(`customer-option-${focusedCustomerIndex}`)
        ?.scrollIntoView({ block: "nearest" });
    }
  }, [focusedCustomerIndex, isCustomerDropdownOpen]);

  useEffect(() => setMounted(true), []);

  /* ── Fetch config ── */
  useEffect(() => {
    fetch("/api/config")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => d && setConfig(d))
      .catch(() => {});
  }, []);

  /* ── Debounce customer search ── */
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedCustomerSearch(customerSearch);
      setCustomerPage(1);
      setHasMoreCustomers(true);
    }, 400);
    return () => clearTimeout(timer);
  }, [customerSearch]);

  /* ── Debounce item search ── */
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedItemSearch(itemSearch);
      setItemPage(1);
      setHasMoreItems(true);
    }, 400);
    return () => clearTimeout(timer);
  }, [itemSearch]);

  /* ── Fetch customers ── */
  useEffect(() => {
    if (!isCustomerDropdownOpen) return;
    const controller = new AbortController();
    const fetchCustomers = async () => {
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
      } catch {
        /* abort or network error */
      } finally {
        setIsCustomerLoading(false);
      }
    };
    fetchCustomers();
    return () => controller.abort();
  }, [debouncedCustomerSearch, customerPage, isCustomerDropdownOpen]);

  /* ── Fetch items ── */
  useEffect(() => {
    if (!isItemDropdownOpen) return;
    const controller = new AbortController();
    const fetchItems = async () => {
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
      } catch {
        /* abort or network error */
      } finally {
        setIsItemLoading(false);
      }
    };
    fetchItems();
    return () => controller.abort();
  }, [debouncedItemSearch, itemPage, isItemDropdownOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        customerSearchRef.current &&
        !customerSearchRef.current.contains(event.target as Node)
      ) {
        setIsCustomerDropdownOpen(false);
      }
      if (
        itemSearchRef.current &&
        !itemSearchRef.current.contains(event.target as Node)
      ) {
        setIsItemDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  /* ── Dropdown Positioning ── */
  const [customerDropdownStyle, setCustomerDropdownStyle] =
    useState<React.CSSProperties>({});
  const [itemDropdownStyle, setItemDropdownStyle] =
    useState<React.CSSProperties>({});

  const updateDropdownPositions = useCallback(() => {
    if (isCustomerDropdownOpen && customerSearchRef.current) {
      const rect = customerSearchRef.current.getBoundingClientRect();
      setCustomerDropdownStyle({
        position: "fixed",
        top: rect.bottom + 8,
        left: rect.left,
        width: rect.width,
        zIndex: 9999,
      });
    }
    if (isItemDropdownOpen && itemSearchRef.current) {
      const rect = itemSearchRef.current.getBoundingClientRect();
      setItemDropdownStyle({
        position: "fixed",
        top: rect.bottom + 8,
        left: rect.left,
        width: rect.width,
        zIndex: 9999,
      });
    }
  }, [isCustomerDropdownOpen, isItemDropdownOpen]);

  useEffect(() => {
    updateDropdownPositions();
    if (isCustomerDropdownOpen || isItemDropdownOpen) {
      window.addEventListener("scroll", updateDropdownPositions, true);
      window.addEventListener("resize", updateDropdownPositions);
      return () => {
        window.removeEventListener("scroll", updateDropdownPositions, true);
        window.removeEventListener("resize", updateDropdownPositions);
      };
    }
  }, [isCustomerDropdownOpen, isItemDropdownOpen, updateDropdownPositions]);

  /* ── Calculations ── */
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
  const netTotal = subtotal + taxAmount + serviceChargeAmount;

  const isStockError = (line: BillLine) => {
    if (!config?.enableStockRestriction) return false;
    const q = parseFloat(line.quantity) || 0;
    if (line.pricingMode === "WEIGHT" || line.pricingMode === "WEIGHT_KG") {
      return q > line.availableKg;
    }
    return q > line.availableUnits;
  };
  const hasAnyStockError = lines.some(isStockError);

  const canSubmit =
    !isSubmitting &&
    lines.length > 0 &&
    !hasAnyStockError &&
    !!selectedCustomer &&
    lines.every(
      (l) =>
        parseFloat(l.price) > 0 &&
        (parseFloat(l.quantity) > 0 ||
          parseFloat(l.quantityKg) > 0 ||
          parseFloat(l.quantityUnits) > 0),
    );

  const fmt = (n: number) => `₹ ${n.toLocaleString("en-IN")}`;

  /* ── Line operations ── */
  const addLine = useCallback(
    (item: Item) => {
      const newIdx = lines.length;
      setLines((prev) => [
        ...prev,
        {
          itemId: item.id,
          itemName: item.name,
          pricingMode: item.defaultPricingMode,
          quantity: "",
          quantityKg: "",
          quantityUnits: "",
          price: "",
          total: 0,
          availableKg: item.availableKg || 0,
          availableUnits: item.availableUnits || 0,
        },
      ]);
      setItemSearch("");
      setIsItemDropdownOpen(false);
      // Focus quantity after render
      requestAnimationFrame(() => {
        setTimeout(() => {
          const dRef = qtyRefs.current.get(`desktop-${newIdx}`);
          const mRef = qtyRefs.current.get(`mobile-${newIdx}`);
          if (dRef && dRef.offsetParent !== null) {
            dRef.focus();
            dRef.select();
          } else if (mRef && mRef.offsetParent !== null) {
            mRef.focus();
            mRef.select();
          }
        }, 50);
      });
    },
    [lines],
  );

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

    // Sync quantity
    if (l.pricingMode === "WEIGHT" || l.pricingMode === "WEIGHT_KG") {
      l.quantity = l.quantityKg;
    } else {
      l.quantity = l.quantityUnits;
    }

    const q = parseFloat(l.quantity) || 0;
    const p = parseFloat(l.price) || 0;

    if (l.pricingMode === "WEIGHT") {
      l.total = (q / 10) * p;
    } else {
      l.total = q * p;
    }

    setLines(newLines);
  };

  const removeLine = (index: number) =>
    setLines(lines.filter((_, i) => i !== index));

  /* ── Submit ── */
  const handleSubmit = useCallback(async () => {
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
      munimRef: munimRef ? parseInt(munimRef) : undefined,
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
        if (config?.billingMethod === "CUSTOM") {
          // Keep items, reset customer
          setSelectedCustomer(null);
          setCustomerSearch("");
          setIsCustomerDropdownOpen(false);
          setTimeout(() => customerInputRef.current?.focus(), 100);
        } else {
          // Standard bill logic: redirect to bills list
          router.push("/bills");
        }
      } else {
        const err = await res.json();
        toast.error(err.error || t("bills.purchase.error"));
      }
    } catch {
      toast.error(t("bills.purchase.error"));
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedCustomer, lines, config, t, router, munimRef]);

  /* ── Ctrl+Enter global shortcut ── */
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        if (canSubmit) handleSubmit();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [canSubmit, handleSubmit]);

  /* ── Keyboard: Qty → Price ── */
  const focusVisible = (
    baseRefMap: Map<string, HTMLInputElement>,
    index: number,
  ) => {
    const dRef = baseRefMap.get(`desktop-${index}`);
    const mRef = baseRefMap.get(`mobile-${index}`);
    if (dRef && dRef.offsetParent !== null) {
      dRef.focus();
      dRef.select();
      return true;
    }
    if (mRef && mRef.offsetParent !== null) {
      mRef.focus();
      mRef.select();
      return true;
    }
    return false;
  };

  const handleQuantityEnter = (index: number) => {
    const didFocusKg = focusVisible(qtyKgRefs.current, index);
    if (!didFocusKg) {
      handleQuantityKgEnter(index);
    }
  };

  const handleQuantityKgEnter = (index: number) => {
    focusVisible(priceRefs.current, index);
  };

  /* ── Keyboard: Price Enter → Item Search ── */
  const handlePriceEnter = () => {
    if (itemInputRef.current) {
      itemInputRef.current.focus();
      itemInputRef.current.select();
    }
  };

  /* ── Keyboard: Item Search Enter → Add first item from list ── */
  const handleItemSearchEnter = () => {
    if (itemsList.length > 0) {
      const safeIndex = Math.min(
        Math.max(0, focusedItemIndex),
        itemsList.length - 1,
      );
      const selected = itemsList[safeIndex];
      if (!selected) return;
      if (
        config?.enableStockRestriction &&
        selected.availableKg <= 0 &&
        selected.availableUnits <= 0
      ) {
        toast.error("Item is out of stock");
        return;
      }
      addLine(selected);
    } else if (itemSearch.trim()) {
      toast.error("No items found matching your search");
    }
  };

  const handleItemKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleItemSearchEnter();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedItemIndex((prev) =>
        prev < itemsList.length - 1 ? prev + 1 : prev,
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedItemIndex((prev) => (prev > 0 ? prev - 1 : 0));
    }
  };

  /* ── Keyboard: Customer Enter → Select first or submit ── */
  const handleCustomerEnter = () => {
    if (selectedCustomer) {
      if (canSubmit) {
        handleSubmit();
      } else {
        itemInputRef.current?.focus();
      }
    } else if (!selectedCustomer && customersList.length > 0) {
      const safeIndex = Math.min(
        Math.max(0, focusedCustomerIndex),
        customersList.length - 1,
      );
      const selected = customersList[safeIndex];
      if (!selected) return;
      setSelectedCustomer(selected);
      setCustomerSearch("");
      setIsCustomerDropdownOpen(false);
      setTimeout(() => {
        if (lines.length === 0) {
          itemInputRef.current?.focus();
        } else {
          customerInputRef.current?.focus();
        }
      }, 100);
    }
  };

  const handleCustomerKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleCustomerEnter();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setFocusedCustomerIndex((prev) =>
        prev < customersList.length - 1 ? prev + 1 : prev,
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setFocusedCustomerIndex((prev) => (prev > 0 ? prev - 1 : 0));
    }
  };

  /* ─────────────────────── RENDER ─────────────────────── */
  return (
    <div className="flex flex-col gap-8">
      {/* ── Header ── */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-3xl font-black text-[var(--text-main)] tracking-tight leading-tight m-0">
            {t("bills.sale.title")}
          </h1>
          <div className="flex items-center gap-2.5 mt-1.5">
            <div className="h-[3px] w-6 bg-sky-700 rounded-sm" />
            <p className="m-0 text-[11px] font-extrabold text-[var(--text-muted)] uppercase tracking-[0.15em] flex items-center gap-1.5">
              <Clock size={12} />
              {t("bills.sale.subtitle")}
            </p>
          </div>
        </div>
        <Link
          href="/bills"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-100 text-slate-500 rounded-xl font-extrabold text-sm no-underline transition-colors hover:bg-slate-200 hover:text-slate-900"
        >
          <X size={16} /> {t("common.cancel")}
        </Link>
      </div>

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-6 xl:gap-8 items-start">
        {/* ════════ LEFT COLUMN — Items ════════ */}
        <div className="flex flex-col gap-6 w-full min-w-0">
          {/* ── Items Card ── */}
          <div className="premium-card overflow-visible relative z-30 flex-1">
            {/* Items header + search */}
            <div className="flex items-center justify-between flex-wrap gap-4 px-5 py-4 border-b border-[var(--border-main)] bg-gradient-to-r from-white to-slate-50">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 bg-sky-700/10 rounded-[10px] flex items-center justify-center text-sky-700">
                  <Package size={18} strokeWidth={2} />
                </div>
                <p className="m-0 text-sm font-black text-[var(--text-muted)] uppercase tracking-[0.2em]">
                  {t("bills.purchase.billItems")}
                </p>
              </div>

              {/* Item search */}
              <div ref={itemSearchRef} className="relative flex-1 min-w-0">
                <Plus
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  size={16}
                />
                <input
                  ref={itemInputRef}
                  type="text"
                  placeholder={t("bills.purchase.addItem")}
                  value={itemSearch}
                  onFocus={() => {
                    setIsItemDropdownOpen(true);
                    setFocusedItemIndex(0);
                  }}
                  onChange={(e) => setItemSearch(e.target.value)}
                  onKeyDown={handleItemKeyDown}
                  className="w-full box-border py-2.5 pl-11 pr-3 bg-slate-100 border-[1.5px] border-slate-200 rounded-xl text-[13px] font-bold text-[var(--text-main)] outline-none transition-all focus:border-sky-700 focus:bg-white"
                />

                {/* Item dropdown */}
                {mounted &&
                  isItemDropdownOpen &&
                  (debouncedItemSearch.length > 0 || itemsList.length > 0) &&
                  createPortal(
                    <div
                      style={itemDropdownStyle}
                      className="bg-white border border-[var(--border-main)] rounded-[14px] shadow-[0_20px_40px_rgba(0,0,0,0.1)] p-1 max-h-60 overflow-y-auto"
                      onMouseDown={(e) => e.stopPropagation()}
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
                      {itemsList.map((item, index) => {
                        const outOfStock =
                          config?.enableStockRestriction &&
                          item.availableKg <= 0 &&
                          item.availableUnits <= 0;
                        const isFocused = index === focusedItemIndex;
                        return (
                          <button
                            key={item.id}
                            id={`item-option-${index}`}
                            onMouseDown={() => {
                              if (outOfStock) return;
                              addLine(item);
                            }}
                            disabled={!!outOfStock}
                            className={`w-full block text-left px-3.5 py-2.5 border-none bg-transparent rounded-[10px] text-[13px] font-bold text-slate-800 transition-colors ${
                              outOfStock
                                ? "opacity-50 cursor-not-allowed"
                                : isFocused
                                  ? "bg-sky-100 cursor-pointer shadow-sm text-sky-950 ring-1 ring-sky-200"
                                  : "cursor-pointer hover:bg-sky-50"
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              <span>{item.name}</span>
                              <span
                                className={`text-[11px] font-extrabold ${
                                  item.availableKg <= 0 &&
                                  item.availableUnits <= 0
                                    ? "text-red-500"
                                    : "text-emerald-500"
                                }`}
                              >
                                {item.availableKg > 0
                                  ? `${item.availableKg} KG`
                                  : item.availableUnits > 0
                                    ? `${item.availableUnits} Units`
                                    : config?.enableStockRestriction
                                      ? t("bills.sale.noStock")
                                      : "No Stock"}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                      {isItemLoading && (
                        <div className="p-2.5 text-center">
                          <Loader2
                            size={16}
                            className="animate-spin text-[var(--primary-main)] mx-auto"
                          />
                        </div>
                      )}
                      {!isItemLoading &&
                        itemsList.length === 0 &&
                        debouncedItemSearch.length > 0 && (
                          <p className="p-2.5 m-0 text-center text-xs text-slate-400 font-bold">
                            No items found
                          </p>
                        )}
                    </div>,
                    document.body,
                  )}
              </div>
            </div>

            {/* Items table / empty state */}
            {lines.length === 0 ? (
              <div className="py-16 px-4 text-center text-slate-300">
                <ShoppingCart size={40} className="mx-auto mb-4 opacity-40" />
                <p className="m-0 text-xs font-extrabold uppercase tracking-[0.15em]">
                  {t("bills.purchase.emptyItems")}
                </p>
              </div>
            ) : (
              <>
                {/* Desktop table */}
                <table className="w-full border-collapse bill-items-table">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="px-5 py-3 text-left text-[14px] font-black text-slate-400 uppercase tracking-wide">
                        {t("bills.purchase.item")}
                      </th>
                      <th className="px-4 py-3 text-center text-[14px] font-black text-slate-400 uppercase tracking-wide">
                        {t("bills.purchase.quantity")} (Units)
                      </th>
                      <th className="px-4 py-3 text-center text-[14px] font-black text-slate-400 uppercase tracking-wide">
                        {t("bills.purchase.quantity")} (KG)
                      </th>
                      <th className="px-4 py-3 text-center text-[14px] font-black text-slate-400 uppercase tracking-wide">
                        {t("bills.purchase.price")}
                      </th>
                      <th className="px-5 py-3 text-right text-[14px] font-black text-slate-400 uppercase tracking-wide">
                        <div className="flex items-center justify-end gap-1">
                          {t("bills.purchase.total")}
                          <Tooltip content={t("bills.purchase.totalTooltip")}>
                            <Info
                              size={14}
                              className="cursor-help opacity-70"
                            />
                          </Tooltip>
                        </div>
                      </th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((line, idx) => (
                      <tr key={idx} className="border-b border-slate-100">
                        {/* Item name + pricing mode badge + stock */}
                        <td className="px-5 py-4">
                          <p className="m-0 font-extrabold text-sm text-slate-800">
                            {line.itemName}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[14px] font-extrabold text-sky-700 bg-sky-700/[0.08] px-2 py-0.5 rounded-md uppercase">
                              {line.pricingMode === "WEIGHT"
                                ? "per 10 KG"
                                : line.pricingMode === "WEIGHT_KG"
                                  ? "per KG"
                                  : "per Unit"}
                            </span>
                            <span
                              className={`text-[11px] font-extrabold px-2 py-0.5 rounded-md ${
                                line.availableKg <= 0 &&
                                line.availableUnits <= 0
                                  ? "text-red-500 bg-red-500/[0.08]"
                                  : "text-slate-500 bg-slate-50"
                              }`}
                            >
                              Stock:{" "}
                              {line.pricingMode === "UNIT"
                                ? `${line.availableUnits} Units`
                                : `${line.availableKg} KG`}
                            </span>
                          </div>
                        </td>

                        {/* Qty Units */}
                        <td className="px-4 py-4">
                          <input
                            ref={(el) => {
                              if (el) qtyRefs.current.set(`desktop-${idx}`, el);
                              else qtyRefs.current.delete(`desktop-${idx}`);
                            }}
                            type="text"
                            inputMode="decimal"
                            value={line.quantityUnits}
                            onChange={(e) =>
                              updateLine(idx, "quantityUnits", e.target.value)
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleQuantityEnter(idx);
                              }
                            }}
                            onFocus={(e) => e.target.select()}
                            className={`w-[60px] block mx-auto p-2 text-center rounded-[10px] font-extrabold text-sm outline-none transition-all ${
                              isStockError(line)
                                ? "bg-red-50 border-[1.5px] border-red-500 focus:bg-red-50/80"
                                : "bg-slate-100 border-[1.5px] border-slate-200 focus:border-sky-700 focus:bg-white"
                            }`}
                          />
                          {isStockError(line) && (
                            <p className="mt-1 text-[10px] font-extrabold text-red-500 text-center m-0">
                              {t("bills.sale.availableStock", {
                                amount:
                                  line.pricingMode === "UNIT"
                                    ? `${line.availableUnits} Units`
                                    : `${line.availableKg} KG`,
                              })}
                            </p>
                          )}
                        </td>

                        {/* Qty KG */}
                        <td className="px-4 py-4">
                          <input
                            ref={(el) => {
                              if (el)
                                qtyKgRefs.current.set(`desktop-${idx}`, el);
                              else qtyKgRefs.current.delete(`desktop-${idx}`);
                            }}
                            type="text"
                            inputMode="decimal"
                            value={line.quantityKg}
                            onChange={(e) =>
                              updateLine(idx, "quantityKg", e.target.value)
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleQuantityKgEnter(idx);
                              }
                            }}
                            onFocus={(e) => e.target.select()}
                            className={`w-[70px] block mx-auto p-2 text-center rounded-[10px] font-extrabold text-sm outline-none transition-all ${
                              isStockError(line)
                                ? "bg-red-50 border-[1.5px] border-red-500 focus:bg-red-50/80"
                                : "bg-slate-100 border-[1.5px] border-slate-200 focus:border-sky-700 focus:bg-white"
                            }`}
                          />
                          {isStockError(line) && (
                            <p className="mt-1 text-[10px] font-extrabold text-red-500 text-center m-0">
                              {t("bills.sale.availableStock", {
                                amount:
                                  line.pricingMode === "UNIT"
                                    ? `${line.availableUnits} Units`
                                    : `${line.availableKg} KG`,
                              })}
                            </p>
                          )}
                        </td>

                        {/* Price */}
                        <td className="px-4 py-4">
                          <div className="relative w-[100px] mx-auto">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] font-extrabold text-slate-400">
                              ₹
                            </span>
                            <input
                              ref={(el) => {
                                if (el)
                                  priceRefs.current.set(`desktop-${idx}`, el);
                                else priceRefs.current.delete(`desktop-${idx}`);
                              }}
                              type="text"
                              inputMode="decimal"
                              value={line.price}
                              onChange={(e) =>
                                updateLine(idx, "price", e.target.value)
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handlePriceEnter();
                                }
                              }}
                              onFocus={(e) => e.target.select()}
                              className="w-full box-border p-2 pl-6 text-center bg-slate-100 border-[1.5px] border-slate-200 rounded-[10px] font-extrabold text-sm outline-none transition-all focus:border-sky-700 focus:bg-white"
                            />
                          </div>
                        </td>

                        {/* Total */}
                        <td className="px-5 py-4 text-right font-black text-[15px] text-slate-900">
                          {fmt(line.total)}
                        </td>

                        {/* Delete */}
                        <td className="px-4 py-4">
                          <button
                            onClick={() => removeLine(idx)}
                            className="w-[34px] h-[34px] border-none bg-slate-50 rounded-[10px] cursor-pointer flex items-center justify-center text-slate-300 transition-all hover:bg-red-50 hover:text-red-500"
                          >
                            <Trash2 size={15} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Mobile cards */}
                <div className="bill-items-mobile">
                  {lines.map((line, idx) => (
                    <div
                      key={idx}
                      className="px-6 py-5 border-b border-slate-100"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <p className="m-0 font-extrabold text-[15px] text-slate-800">
                            {line.itemName}
                          </p>
                          <span className="text-[14px] font-extrabold text-sky-700 bg-sky-700/[0.08] px-2 py-0.5 rounded-md uppercase">
                            {line.pricingMode === "WEIGHT"
                              ? "per 10 KG"
                              : line.pricingMode === "WEIGHT_KG"
                                ? "per KG"
                                : "per Unit"}
                          </span>
                        </div>
                        <button
                          onClick={() => removeLine(idx)}
                          className="w-8 h-8 border-none bg-slate-50 rounded-lg cursor-pointer flex items-center justify-center text-slate-300"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-3">
                        {/* Units */}
                        <div>
                          <p className="m-0 mb-1.5 text-[14px] font-extrabold text-slate-400 uppercase tracking-wide">
                            Qty (Units)
                          </p>
                          <input
                            ref={(el) => {
                              if (el) qtyRefs.current.set(`mobile-${idx}`, el);
                              else qtyRefs.current.delete(`mobile-${idx}`);
                            }}
                            type="text"
                            inputMode="decimal"
                            value={line.quantityUnits}
                            onChange={(e) =>
                              updateLine(idx, "quantityUnits", e.target.value)
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleQuantityEnter(idx);
                              }
                            }}
                            onFocus={(e) => e.target.select()}
                            className={`w-full box-border p-2.5 text-center rounded-[10px] font-extrabold text-[15px] outline-none ${
                              isStockError(line)
                                ? "bg-red-50 border-[1.5px] border-red-500"
                                : "bg-slate-50 border-[1.5px] border-transparent focus:border-sky-700 focus:bg-white"
                            }`}
                          />
                        </div>
                        {/* KG */}
                        <div>
                          <p className="m-0 mb-1.5 text-[14px] font-extrabold text-slate-400 uppercase tracking-wide">
                            {t("bills.purchase.quantity")} (KG)
                          </p>
                          <input
                            ref={(el) => {
                              if (el)
                                qtyKgRefs.current.set(`mobile-${idx}`, el);
                              else qtyKgRefs.current.delete(`mobile-${idx}`);
                            }}
                            type="text"
                            inputMode="decimal"
                            value={line.quantityKg}
                            onChange={(e) =>
                              updateLine(idx, "quantityKg", e.target.value)
                            }
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleQuantityKgEnter(idx);
                              }
                            }}
                            onFocus={(e) => e.target.select()}
                            className={`w-full box-border p-2.5 text-center rounded-[10px] font-extrabold text-[15px] outline-none ${
                              isStockError(line)
                                ? "bg-red-50 border-[1.5px] border-red-500"
                                : "bg-slate-50 border-[1.5px] border-transparent focus:border-sky-700 focus:bg-white"
                            }`}
                          />
                        </div>
                        {/* Price */}
                        <div>
                          <p className="m-0 mb-1.5 text-[14px] font-extrabold text-slate-400 uppercase tracking-wide">
                            {t("bills.purchase.price")}
                          </p>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-extrabold text-slate-400">
                              ₹
                            </span>
                            <input
                              ref={(el) => {
                                if (el)
                                  priceRefs.current.set(`mobile-${idx}`, el);
                                else priceRefs.current.delete(`mobile-${idx}`);
                              }}
                              type="text"
                              inputMode="decimal"
                              value={line.price}
                              onChange={(e) =>
                                updateLine(idx, "price", e.target.value)
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  handlePriceEnter();
                                }
                              }}
                              onFocus={(e) => e.target.select()}
                              className="w-full box-border p-2.5 pl-7 text-center bg-slate-50 border-[1.5px] border-transparent rounded-[10px] font-extrabold text-[15px] outline-none focus:border-sky-700 focus:bg-white"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Total row */}
                      <div className="flex items-center justify-between mt-3 p-2.5 px-3.5 bg-slate-50 rounded-[10px]">
                        <span className="text-[14px] font-extrabold text-slate-400 uppercase tracking-wide">
                          {t("bills.purchase.total")}
                        </span>
                        <span className="font-black text-[17px] text-slate-900">
                          {fmt(line.total)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* ════════ RIGHT COLUMN — Customer & Summary ════════ */}
        <div className="lg:sticky lg:top-24 h-fit flex flex-col gap-6 w-full min-w-0">
          {/* ── Customer Card ── */}
          <div className="premium-card p-5 relative z-40 bg-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-sky-700/10 rounded-lg flex items-center justify-center text-sky-700">
                  <UserCircle size={16} strokeWidth={2.5} />
                </div>
                <p className="m-0 text-[13px] font-black text-slate-500 uppercase tracking-[0.15em]">
                  {t("bills.sale.selectCustomer")}
                </p>
              </div>
              {isAdmin && !selectedCustomer && (
                <button
                  type="button"
                  onClick={() => setIsCustomerModalOpen(true)}
                  className="w-8 h-8 bg-sky-50 rounded-lg text-sky-600 flex items-center justify-center transition-colors hover:bg-sky-100"
                  title={t("master.customers.addCustomer")}
                >
                  <UserPlus size={16} strokeWidth={2.5} />
                </button>
              )}
            </div>

            {selectedCustomer ? (
              <>
                {/* Selected customer card */}
                <div className="flex items-center justify-between p-3.5 bg-sky-50 border border-sky-100 rounded-[14px] mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-sky-700 text-white rounded-[10px] flex items-center justify-center font-black text-lg">
                      {selectedCustomer.name.charAt(0)}
                    </div>
                    <div>
                      <p className="m-0 font-black text-[14px] text-sky-950 leading-tight">
                        {selectedCustomer.name}
                      </p>
                      <p className="m-0 mt-0.5 text-[11px] font-bold text-sky-600">
                        {selectedCustomer.mobile}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedCustomer(null);
                      setTimeout(() => customerInputRef.current?.focus(), 50);
                    }}
                    className="w-8 h-8 rounded-full border-none bg-white flex items-center justify-center text-slate-400 shadow-sm transition-all hover:bg-red-50 hover:text-red-500 cursor-pointer"
                  >
                    <X size={16} strokeWidth={2.5} />
                  </button>
                </div>

                {/* Submit hint input */}
                <input
                  ref={customerInputRef}
                  readOnly
                  placeholder="Press Enter to create bill..."
                  className="w-full box-border py-3 px-4 bg-sky-700/[0.04] border border-sky-700/10 rounded-[12px] text-[13px] font-extrabold text-sky-700 text-center cursor-default outline-none select-none"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleCustomerEnter();
                    }
                  }}
                  onFocus={(e) => e.target.select()}
                />
              </>
            ) : (
              <div ref={customerSearchRef} className="relative">
                <Search
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                  size={16}
                />
                <input
                  ref={customerInputRef}
                  type="text"
                  placeholder={t("bills.sale.customerPlaceholder")}
                  value={customerSearch}
                  onFocus={() => {
                    setIsCustomerDropdownOpen(true);
                    setFocusedCustomerIndex(0);
                  }}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  onKeyDown={handleCustomerKeyDown}
                  className="w-full box-border py-3 pl-10 pr-3.5 bg-slate-50 border border-slate-200 rounded-[12px] text-[13px] font-bold text-slate-800 outline-none transition-all focus:border-sky-700 focus:bg-white focus:ring-4 focus:ring-sky-700/10"
                />

                {/* Customer dropdown */}
                {mounted &&
                  isCustomerDropdownOpen &&
                  (debouncedCustomerSearch.length > 0 ||
                    customersList.length > 0) &&
                  createPortal(
                    <div
                      style={customerDropdownStyle}
                      className="bg-white border border-slate-200 rounded-[14px] shadow-xl p-1.5 max-h-[250px] overflow-y-auto"
                      onMouseDown={(e) => e.stopPropagation()}
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
                      {customersList.map((c, index) => {
                        const isFocused = index === focusedCustomerIndex;
                        return (
                          <button
                            key={c.id}
                            id={`customer-option-${index}`}
                            onMouseDown={() => {
                              setSelectedCustomer(c);
                              setCustomerSearch("");
                              setIsCustomerDropdownOpen(false);
                              setTimeout(() => {
                                if (lines.length === 0) {
                                  itemInputRef.current?.focus();
                                } else {
                                  customerInputRef.current?.focus();
                                }
                              }, 100);
                            }}
                            className={`w-full flex flex-col gap-0.5 px-3 py-2.5 border-none bg-transparent cursor-pointer rounded-[10px] transition-colors text-left ${
                              isFocused
                                ? "bg-sky-100 ring-1 ring-sky-200"
                                : "hover:bg-sky-50"
                            }`}
                          >
                            <p className="m-0 font-extrabold text-slate-800 text-[13px]">
                              {c.name}
                            </p>
                            <p className="m-0 text-[11px] text-slate-500 font-bold">
                              {c.mobile}
                            </p>
                          </button>
                        );
                      })}
                      {isCustomerLoading && (
                        <div className="p-3 text-center">
                          <Loader2
                            size={16}
                            className="animate-spin text-sky-700 mx-auto"
                          />
                        </div>
                      )}
                      {!isCustomerLoading &&
                        customersList.length === 0 &&
                        debouncedCustomerSearch.length > 0 && (
                          <p className="p-3 m-0 text-center text-xs text-slate-400 font-bold">
                            No customers found
                          </p>
                        )}
                    </div>,
                    document.body,
                  )}
              </div>
            )}
          </div>

          <div className="premium-card p-5 bg-slate-900 border-none text-white">
            {/* Header */}
            <div className="flex items-center gap-2.5 mb-6">
              <div className="w-9 h-9 bg-white/[0.07] rounded-[10px] flex items-center justify-center">
                <Calculator size={18} className="text-blue-400" />
              </div>
              <p className="m-0 text-sm font-black uppercase tracking-[0.2em] text-slate-400">
                {t("bills.purchase.summary")}
              </p>
            </div>

            {/* Subtotal */}
            <div className="flex justify-between items-center mb-3.5">
              <span className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wide">
                {t("bills.purchase.subtotal")}
              </span>
              <span className="text-[13px] font-extrabold text-slate-400">
                {fmt(subtotal)}
              </span>
            </div>

            <div className="h-px bg-white/[0.07] my-4" />

            {/* Tax + Service Charge */}
            {[
              {
                label: `${t("bills.purchase.tax")} ${config ? `(${config.taxValue}${config.taxType === "PERCENTAGE" ? "%" : "₹"})` : ""}`,
                value: fmt(taxAmount),
                tooltip: t("bills.sale.taxTooltip", {
                  value: config?.taxValue,
                  type:
                    config?.taxType === "PERCENTAGE"
                      ? t("bills.sale.taxPercentage")
                      : t("bills.sale.taxFixed"),
                }),
              },
              {
                label: `${t("bills.purchase.serviceCharge")} ${config ? `(${config.serviceChargeValue}${config.serviceChargeType === "PERCENTAGE" ? "%" : "₹"})` : ""}`,
                value: fmt(serviceChargeAmount),
                tooltip: t("bills.sale.serviceChargeTooltip", {
                  value: config?.serviceChargeValue,
                  type:
                    config?.serviceChargeType === "PERCENTAGE"
                      ? t("bills.sale.scPercentage")
                      : t("bills.sale.scFixed"),
                }),
              },
            ].map(({ label, value, tooltip }) => (
              <div
                key={label}
                className="flex justify-between items-center mb-3.5"
              >
                <div className="text-[11px] font-extrabold text-slate-500 uppercase tracking-wide flex items-center gap-1">
                  {label}
                  <Tooltip content={tooltip}>
                    <Info size={11} className="cursor-help opacity-70" />
                  </Tooltip>
                </div>
                <span className="text-[13px] font-extrabold text-slate-400">
                  {value}
                </span>
              </div>
            ))}

            <div className="h-px bg-white/[0.07] my-4" />

            {/* Total Payable */}
            <div className="mt-6 p-5 bg-white/[0.04] rounded-[14px] border border-white/[0.06]">
              <div className="flex items-center gap-1.5 mb-2">
                <TrendingUp size={13} className="text-blue-400" />
                <div className="text-[14px] font-black text-blue-400 uppercase tracking-[0.15em] flex items-center gap-1">
                  {t("bills.sale.payable")}
                  <Tooltip content={t("bills.sale.payableTooltip")}>
                    <Info size={13} className="cursor-help opacity-70" />
                  </Tooltip>
                </div>
              </div>
              <p className="m-0 text-4xl font-black text-slate-800 tracking-tight leading-none">
                <span className="text-xl text-slate-600 mr-1">₹</span>
                {netTotal.toLocaleString("en-IN")}
              </p>
            </div>

            {/* Submit button */}
            <button
              disabled={!canSubmit}
              onClick={handleSubmit}
              className={`w-full mt-5 py-3.5 border-none rounded-[14px] font-black text-[13px] uppercase tracking-wide flex items-center justify-center gap-2 transition-all ${
                canSubmit
                  ? "bg-sky-700 text-white cursor-pointer shadow-[0_8px_16px_rgba(3,105,161,0.3)] hover:bg-sky-800"
                  : "bg-slate-800 text-slate-600 cursor-not-allowed"
              }`}
            >
              {isSubmitting ? (
                <Loader2 size={20} className="animate-spin" />
              ) : (
                <>
                  <Save size={18} /> {t("bills.purchase.confirm")} (Ctrl+Enter)
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── Responsive styles ── */}
      <style>{`
        input[type=number]::-webkit-inner-spin-button,
        input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; }
        .bill-items-table { display: none; }
        .bill-items-mobile { display: block; }
        .sale-bill-grid { grid-template-columns: 1fr; }
        @media (min-width: 768px) {
          .bill-items-table { display: table; }
          .bill-items-mobile { display: none; }
        }
      `}</style>

      <AddPartyModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        type="CUSTOMER"
        onSuccess={() => {
          setCustomerPage(1);
          setHasMoreCustomers(true);
        }}
      />
    </div>
  );
}
