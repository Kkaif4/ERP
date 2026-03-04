"use client";

import { useState, useEffect, useMemo } from "react";
import { useTranslation } from "@/lib/i18n";
import { ArrowDownUp, ChevronDown, Plus, Search, Loader2, ReceiptText, Clock, Trash2, Edit2, Download, FileSpreadsheet, FileText, CreditCard, Printer, ChevronRight, X } from "lucide-react";
import { toast } from "sonner";
import { expenseSchema } from "@/lib/schemas";
import { downloadPDF, printPDF } from "@/lib/print";
import { Modal } from "@/components/ui/Modal";
import { fmtDate } from "@/lib/dateUtils";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface Expense {
    id: string;
    expenseDate: string;
    amount: number;
    paymentMode: string;
    category: string | null;
    description: string | null;
    createdBy: { name: string };
}

const CRIMSON = "#e11d48";
const CRIMSON_BG = "rgba(225,29,72,0.08)";

export default function ExpensesPage() {
    const { t, language } = useTranslation();
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [dateSort, setDateSort] = useState<"asc" | "desc">("desc");
    const [showModal, setShowModal] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [editingExpense, setEditingExpense] = useState<Expense | null>(null);
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");

    const [form, setForm] = useState({
        amount: "",
        paymentMode: "CASH",
        category: "",
        description: "",
        expenseDate: new Date().toISOString().split("T")[0],
    });

    const fetchExpenses = async () => {
        setLoading(true);
        try {
            const res = await fetch("/api/expenses");
            const result = await res.json();
            if (Array.isArray(result)) {
                setExpenses(result);
            }
        } catch (err: any) {
            toast.error("Failed to load expenses");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchExpenses();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const data = {
            amount: parseFloat(form.amount),
            paymentMode: form.paymentMode,
            category: form.category || undefined,
            description: form.description || undefined,
            expenseDate: form.expenseDate,
        };

        const result = expenseSchema.safeParse(data);
        if (!result.success) {
            toast.error(result.error.issues[0].message);
            return;
        }

        setSubmitting(true);
        try {
            const url = editingExpense ? `/api/expenses/${editingExpense.id}` : "/api/expenses";
            const method = editingExpense ? "PATCH" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            });

            if (res.ok) {
                toast.success(editingExpense ? "Expense updated" : "Expense recorded");
                setShowModal(false);
                resetForm();
                fetchExpenses();
            } else {
                const err = await res.json();
                toast.error(err.error || "Failed to save expense");
            }
        } catch {
            toast.error("Failed to save expense");
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this expense?")) return;
        try {
            const res = await fetch(`/api/expenses/${id}`, { method: "DELETE" });
            if (res.ok) {
                toast.success("Expense deleted");
                fetchExpenses();
            } else {
                toast.error("Failed to delete expense");
            }
        } catch {
            toast.error("Error deleting expense");
        }
    };

    const resetForm = () => {
        setForm({
            amount: "",
            paymentMode: "CASH",
            category: "",
            description: "",
            expenseDate: new Date().toISOString().split("T")[0],
        });
        setEditingExpense(null);
    };

    const openEdit = (exp: Expense) => {
        setEditingExpense(exp);
        setForm({
            amount: exp.amount.toString(),
            paymentMode: exp.paymentMode,
            category: exp.category || "",
            description: exp.description || "",
            expenseDate: new Date(exp.expenseDate).toISOString().split("T")[0],
        });
        setShowModal(true);
    };

    const fmt = (n: number) => `₹ ${Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2 })}`;

    const filtered = useMemo(() => {
        return expenses
            .filter(e => {
                const matchesSearch = (e.description?.toLowerCase() || "").includes(search.toLowerCase()) ||
                    (e.category?.toLowerCase() || "").includes(search.toLowerCase());

                const expTime = new Date(e.expenseDate).getTime();
                const start = fromDate ? new Date(fromDate).getTime() : -Infinity;
                const end = toDate ? new Date(toDate).setHours(23, 59, 59, 999) : Infinity;

                return matchesSearch && expTime >= start && expTime <= end;
            })
            .sort((a, b) => {
                const dateA = new Date(a.expenseDate).getTime();
                const dateB = new Date(b.expenseDate).getTime();
                return dateSort === "desc" ? dateB - dateA : dateA - dateB;
            });
    }, [expenses, search, fromDate, toDate, dateSort]);

    const totalAmount = filtered.reduce((s, e) => s + Number(e.amount), 0);

    const handleExportPDF = () => {
        downloadPDF(
            `/api/reports/operational/pdf?type=EXPENSE_REPORT&startDate=${form.expenseDate}&endDate=${form.expenseDate}`,
            `expenses_${new Date().toISOString().split("T")[0]}.pdf`,
            { lang: language }
        );
    };

    const handlePrintPDF = () => {
        printPDF(`/api/reports/operational/pdf?type=EXPENSE_REPORT&startDate=${form.expenseDate}&endDate=${form.expenseDate}`, { lang: language });
    };

    const handleExportExcel = () => {
        const headers = [
            t("common.date"),
            t("expenses.table.category"),
            t("expenses.table.paymentMode"),
            t("expenses.table.description"),
            t("common.amount")
        ];
        const rows = filtered.map(exp => [
            fmtDate(exp.expenseDate).replace(/,/g, ""),
            (exp.category || t("expenses.general")).replace(/,/g, ""),
            t(`expenses.paymentModes.${exp.paymentMode}`),
            (exp.description || "-").replace(/,/g, " "),
            exp.amount.toString()
        ]);
        const csvContent = "\uFEFF" + headers.join(",") + "\n"
            + rows.map(r => r.join(",")).join("\n");
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `expenses_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
            {/* Header */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
                <div>
                    <h1 style={{ fontSize: "1.875rem", fontWeight: 900, color: "var(--text-main)", letterSpacing: "-0.02em", margin: 0, lineHeight: 1.2 }}>
                        {t("expenses.title")}
                    </h1>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "6px" }}>
                        <div style={{ height: "3px", width: "24px", backgroundColor: CRIMSON, borderRadius: "2px" }} />
                        <p style={{ margin: 0, fontSize: "11px", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.15em", display: "flex", alignItems: "center", gap: "6px" }}>
                            <Clock size={12} /> {t("expenses.subtitle", { count: filtered.length, total: fmt(totalAmount) })}
                        </p>
                    </div>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                    <button
                        onClick={() => { resetForm(); setShowModal(true); }}
                        style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "10px 20px", backgroundColor: CRIMSON, color: "#fff", borderRadius: "12px", fontWeight: 800, fontSize: "14px", border: "none", cursor: "pointer", boxShadow: "0 8px 16px rgba(225,29,72,0.2)", transition: "all 0.2s" }}
                    >
                        <Plus size={16} strokeWidth={3} /> {t("expenses.recordBtn")}
                    </button>
                </div>
            </div>

            {/* ── Filters & Search Area ── */}
            <div className="premium-card" style={{ padding: "1.25rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "1.5rem" }}>

                    {/* Search Input */}
                    <div style={{ flex: 1, minWidth: "260px", position: "relative" }}>
                        <Search style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} size={18} />
                        <input
                            type="text"
                            placeholder={t("expenses.searchPlaceholder")}
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{
                                width: "100%",
                                padding: "14px 14px 14px 56px",
                                backgroundColor: "#f8fafc",
                                border: "1px solid var(--border-main)",
                                borderRadius: "16px",
                                fontSize: "14px",
                                fontWeight: 700,
                                color: "var(--text-main)",
                                outline: "none",
                                transition: "all 0.2s ease",
                                boxShadow: "inset 0 2px 4px 0 rgba(0,0,0,0.02)"
                            }}
                            className="focus:ring-2 focus:ring-rose-500/10 focus:border-rose-500/50"
                        />
                    </div>

                    <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            <span style={{ fontSize: "10px", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase" }}>{t("common.from") || "From"}</span>
                            <input
                                type="date"
                                value={fromDate}
                                onChange={(e) => setFromDate(e.target.value)}
                                style={{ padding: "8px", borderRadius: "10px", border: "1.5px solid var(--border-main)", fontSize: "12px", fontWeight: 700, outline: "none" }}
                            />
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            <span style={{ fontSize: "10px", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase" }}>{t("common.to") || "To"}</span>
                            <input
                                type="date"
                                value={toDate}
                                onChange={(e) => setToDate(e.target.value)}
                                style={{ padding: "8px", borderRadius: "10px", border: "1.5px solid var(--border-main)", fontSize: "12px", fontWeight: 700, outline: "none" }}
                            />
                        </div>
                        {(fromDate || toDate) && (
                            <button
                                onClick={() => { setFromDate(""); setToDate(""); }}
                                style={{ padding: "8px", borderRadius: "10px", border: "none", backgroundColor: "#f1f5f9", color: "#64748b", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                                title="Clear dates"
                            >
                                <X size={14} />
                            </button>
                        )}
                        <div style={{ width: "1px", height: "24px", backgroundColor: "#e2e8f0", margin: "0 4px" }} />
                        <button onClick={handlePrintPDF} className="secondary-btn" title={t("common.print")}><Printer size={16} /></button>
                        <button onClick={handleExportPDF} className="secondary-btn" title={t("common.downloadPdf")}><FileText size={16} /></button>
                        <button onClick={handleExportExcel} className="secondary-btn" title={t("common.exportCsv")}><FileSpreadsheet size={16} /></button>
                    </div>
                </div>
            </div>

            {/* ── Expenses List ── */}
            <div className="premium-card overflow-hidden">
                {loading ? (
                    <div style={{ padding: "3rem", display: "flex", justifyContent: "center" }}><Loader2 size={32} color={CRIMSON} className="animate-spin" /></div>
                ) : filtered.length === 0 ? (
                    <div style={{ padding: "4rem", textAlign: "center" }}>
                        <ReceiptText size={40} color="#e2e8f0" style={{ margin: "0 auto 1rem", display: "block" }} />
                        <p style={{ fontWeight: 700, color: "#94a3b8", fontSize: "13px" }}>{t("expenses.noExpenses")}</p>
                    </div>
                ) : (
                    <div className="border border-gray-200 rounded-none overflow-hidden">
                        <Table className="border-collapse">
                            <TableHeader>
                                <TableRow className="bg-gray-100 border-b-2 border-gray-300 sticky top-0 z-10">
                                    {[
                                        { label: t("common.date"), key: "date" },
                                        { label: t("expenses.table.category"), key: "category" },
                                        { label: t("expenses.table.paymentMode"), key: "mode" },
                                        { label: t("expenses.table.description"), key: "desc" },
                                        { label: t("common.amount"), key: "amount", align: "right" as const },
                                        { label: t("common.actions"), key: "actions", align: "right" as const }
                                    ].map((h, idx) => (
                                        <TableHead
                                            key={h.key}
                                            onClick={h.key === "date" ? () => setDateSort(s => s === "asc" ? "desc" : "asc") : undefined}
                                            className={cn(
                                                "h-10 px-4 text-[11px] font-semibold uppercase tracking-wider text-gray-600 border-r border-gray-200 last:border-r-0 whitespace-nowrap",
                                                (h.align === "right") && "text-right",
                                                h.key === "date" && "cursor-pointer select-none"
                                            )}
                                        >
                                            <div className={cn(
                                                "flex items-center gap-1",
                                                h.align === "right" ? "justify-end" : "justify-start"
                                            )}>
                                                {h.label}
                                                {h.key === "date" && (
                                                    <span className={cn("text-xs", dateSort === "desc" ? "text-blue-600" : "text-gray-400")}>
                                                        {dateSort === "desc" ? "↓" : "↑"}
                                                    </span>
                                                )}
                                            </div>
                                        </TableHead>
                                    ))}
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filtered.map(exp => (
                                    <TableRow key={exp.id} className="even:bg-gray-50/50 odd:bg-white hover:bg-blue-50/30 transition-colors border-b border-gray-200 last:border-b-0">
                                        <TableCell className="border-r border-gray-200">
                                            <span className="text-[14px] font-bold text-gray-500">{fmtDate(exp.expenseDate)}</span>
                                        </TableCell>
                                        <TableCell className="border-r border-gray-200">
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded border border-gray-200 bg-gray-50 text-gray-600 uppercase tracking-wider">
                                                {exp.category || t("expenses.general")}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-[14px] font-medium text-gray-600 border-r border-gray-200">
                                            {t(`expenses.paymentModes.${exp.paymentMode}`)}
                                        </TableCell>
                                        <TableCell className="text-[14px] font-normal text-gray-400 italic border-r border-gray-200 max-w-[200px] truncate">
                                            {exp.description || "—"}
                                        </TableCell>
                                        <TableCell className="text-right text-[14px] font-bold text-gray-900 tabular-nums border-l border-gray-200 bg-gray-50/30">
                                            <span className="text-[11px] font-medium text-gray-400 mr-0.5">₹</span>
                                            {exp.amount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <button onClick={() => openEdit(exp)} className="p-1 text-gray-400 hover:text-blue-600 transition-colors">
                                                    <Edit2 size={14} />
                                                </button>
                                                <button onClick={() => handleDelete(exp.id)} className="p-1 text-gray-400 hover:text-red-600 transition-colors">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>

            {/* Modal */}
            <Modal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                title={editingExpense ? t("expenses.modal.titleEdit") : t("expenses.modal.titleRecord")}
                subtitle={editingExpense ? t("expenses.modal.subtitleEdit") : t("expenses.modal.subtitleRecord")}
                icon={editingExpense ? <Edit2 size={20} /> : <Plus size={20} />}
            >
                <form onSubmit={handleSubmit} className="modal-form-content">
                    <div className="form-grid">
                        <div className="form-group">
                            <label><Clock size={14} /> {t("common.date")}</label>
                            <input
                                type="date"
                                value={form.expenseDate}
                                onChange={e => setForm({ ...form, expenseDate: e.target.value })}
                                required
                                max={new Date().toISOString().split("T")[0]}
                            />
                        </div>

                        <div className="form-group highlight">
                            <label><ReceiptText size={14} /> {t("expenses.modal.amount")}</label>
                            <input
                                type="number"
                                step="0.01"
                                value={form.amount}
                                onChange={e => setForm({ ...form, amount: e.target.value })}
                                required
                                placeholder="0.00"
                            />
                        </div>

                        <div className="form-group">
                            <label><CreditCard size={14} /> {t("expenses.table.paymentMode")}</label>
                            <select
                                value={form.paymentMode}
                                onChange={e => setForm({ ...form, paymentMode: e.target.value })}
                                required
                            >
                                <option value="CASH">{t("expenses.paymentModes.CASH")}</option>
                                <option value="BANK_TRANSFER">{t("expenses.paymentModes.BANK_TRANSFER")}</option>
                                <option value="OTHER">{t("expenses.paymentModes.OTHER")}</option>
                            </select>
                        </div>

                        <div className="form-group">
                            <label><Search size={14} /> {t("expenses.modal.category")}</label>
                            <input
                                type="text"
                                value={form.category}
                                onChange={e => setForm({ ...form, category: e.target.value })}
                                placeholder="Rent, Electricity, Tea, etc."
                            />
                        </div>
                    </div>

                    <div className="form-group full-width" style={{ marginTop: "24px" }}>
                        <label><FileText size={14} /> {t("expenses.modal.description")}</label>
                        <textarea
                            value={form.description}
                            onChange={e => setForm({ ...form, description: e.target.value })}
                            placeholder="Enter additional details or justification..."
                            rows={3}
                        />
                    </div>

                    <div className="modal-footer-actions">
                        <button
                            type="button"
                            onClick={() => setShowModal(false)}
                            className="cancel-btn"
                        >
                            {t("common.cancel")}
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="submit-btn-premium"
                        >
                            {submitting ? (
                                <><Loader2 size={18} className="animate-spin" /> {t("common.saving")}</>
                            ) : editingExpense ? (
                                t("expenses.modal.submitEdit")
                            ) : (
                                t("expenses.modal.submitRecord")
                            )}
                        </button>
                    </div>
                </form>
            </Modal>

            <style jsx>{`
                .modal-form-content {
                    display: flex;
                    flex-direction: column;
                    gap: 20px;
                }

                .form-grid {
                    display: grid;
                    grid-template-columns: 1fr 1fr;
                    gap: 16px;
                }

                .form-group {
                    display: flex;
                    flex-direction: column;
                    gap: 8px;
                }

                .form-group.full-width {
                    grid-column: span 2;
                }

                .form-group label {
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    font-size: 10px;
                    font-weight: 900;
                    color: #94a3b8;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                }

                .form-group input, 
                .form-group select, 
                .form-group textarea {
                    width: 100%;
                    padding: 12px 14px;
                    background-color: #f8fafc;
                    border: 1.5px solid var(--border-main);
                    border-radius: 12px;
                    font-size: 14px;
                    font-weight: 700;
                    color: var(--text-main);
                    outline: none;
                    transition: all 0.2s;
                }

                .form-group input:focus, 
                .form-group select:focus, 
                .form-group textarea:focus {
                    border-color: ${CRIMSON};
                    background-color: #fff;
                    box-shadow: 0 0 0 4px ${CRIMSON_BG};
                }

                .form-group.highlight input {
                    border-color: ${CRIMSON};
                    font-size: 1.25rem;
                    color: ${CRIMSON};
                }

                .modal-footer-actions {
                    margin-top: 12px;
                    display: flex;
                    gap: 12px;
                }

                .cancel-btn {
                    flex: 1;
                    padding: 12px;
                    background: #f1f5f9;
                    border: none;
                    border-radius: 12px;
                    font-weight: 800;
                    font-size: 13px;
                    color: #64748b;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .cancel-btn:hover {
                    background: #e2e8f0;
                }

                .submit-btn-premium {
                    flex: 2;
                    padding: 12px;
                    background: ${CRIMSON};
                    color: #fff;
                    border: none;
                    border-radius: 12px;
                    font-weight: 900;
                    font-size: 13px;
                    cursor: pointer;
                    box-shadow: 0 8px 16px ${CRIMSON_BG};
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 8px;
                    transition: all 0.2s;
                }

                .submit-btn-premium:hover:not(:disabled) {
                    transform: translateY(-2px);
                    box-shadow: 0 12px 20px ${CRIMSON_BG};
                }

                .submit-btn-premium:disabled {
                    opacity: 0.7;
                    cursor: not-allowed;
                }

                .secondary-btn { padding: 8px; border-radius: 8px; border: 1.5px solid #e2e8f0; background: #fff; color: #64748b; cursor: pointer; transition: all 0.2s; }
                .secondary-btn:hover { border-color: ${CRIMSON}; color: ${CRIMSON}; background: ${CRIMSON_BG}; }
                .hover-icon { background: none; border: none; cursor: pointer; border-radius: 6px; display: flex; align-items: center; justify-content: center; transition: all 0.2s; }
                .hover-icon:hover { background: #f1f5f9; transform: scale(1.1); }
            `}</style>
        </div>
    );
}
