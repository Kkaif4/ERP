"use client";

import { useState, useEffect } from "react";
import { useTranslation } from "@/lib/i18n";
import {
    Package,
    Plus,
    Search,
    Tag,
    Loader2,
    X,
} from "lucide-react";
import { toast } from "sonner";

interface Item {
    id: string;
    name: string;
    unit: string;
}

export default function ItemsPage() {
    const { t } = useTranslation();
    const [items, setItems] = useState<Item[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form state
    const [formData, setFormData] = useState({ name: "", unit: "KG" });
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchItems();
    }, [search]);

    const fetchItems = async () => {
        try {
            const res = await fetch(`/api/items?search=${encodeURIComponent(search)}`);
            const data = await res.json();
            setItems(data);
        } catch (err) {
            toast.error(t("master.items.errorLoad"));
        } finally {
            setLoading(false);
        }
    };

    const handleAddItem = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.unit) {
            toast.error(t("master.farmers.emptyFields"));
            return;
        }

        setSubmitting(true);
        try {
            const res = await fetch("/api/items", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (res.ok) {
                toast.success(t("master.items.successAdd"));
                setIsModalOpen(false);
                setFormData({ name: "", unit: "KG" });
                fetchItems();
            } else {
                toast.error(t("master.items.errorAdd"));
            }
        } catch (err) {
            toast.error(t("master.items.errorAdd"));
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="space-y-6 pb-20 lg:pb-0">
            {/* Header Area */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">
                        {t("master.items.title")}
                    </h1>
                    <p className="text-slate-500 font-bold text-xs uppercase tracking-[0.2em] mt-1">
                        {items.length} {t("nav.items")}
                    </p>
                </div>

                <button
                    onClick={() => setIsModalOpen(true)}
                    className="flex items-center justify-center gap-2 bg-[#15803d] text-white px-6 py-4 rounded-2xl font-black text-sm shadow-xl shadow-emerald-100 hover:scale-105 active:scale-95 transition-all w-full sm:w-auto"
                >
                    <Plus size={20} />
                    {t("master.items.addItem")}
                </button>
            </div>

            {/* Search Bar */}
            <div className="relative group">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#15803d] transition-colors" size={20} />
                <input
                    type="text"
                    placeholder={t("master.items.searchPlaceholder")}
                    className="w-full pl-14 pr-6 py-5 bg-white border border-slate-200 rounded-[1.5rem] font-bold text-slate-700 focus:outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-[#15803d] transition-all shadow-sm"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                />
            </div>

            {/* Items Grid */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="animate-spin text-[#15803d]" size={40} />
                </div>
            ) : items.length === 0 ? (
                <div className="bg-white rounded-[2rem] p-12 text-center border-2 border-dashed border-slate-100">
                    <Package size={48} className="mx-auto text-slate-200 mb-4" />
                    <p className="text-slate-400 font-bold">{t("master.items.noItems")}</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {items.map((item) => (
                        <div
                            key={item.id}
                            className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:border-emerald-100 transition-all group flex flex-col items-center text-center"
                        >
                            <div className="w-14 h-14 bg-emerald-50 rounded-[1.25rem] flex items-center justify-center text-[#15803d] mb-4 group-hover:bg-[#15803d] group-hover:text-white transition-all">
                                <Package size={24} />
                            </div>

                            <h3 className="text-base font-black text-slate-800 tracking-tight group-hover:text-[#15803d] transition-colors line-clamp-2 min-h-[3rem] flex items-center">
                                {item.name}
                            </h3>

                            <div className="mt-2 text-[10px] font-black bg-slate-100 text-slate-500 px-3 py-1.5 rounded-lg uppercase tracking-widest flex items-center gap-1.5">
                                <Tag size={10} />
                                {t(`master.items.units.${item.unit}`)}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Add Item Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => !submitting && setIsModalOpen(false)} />

                    <div className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="px-8 pt-8 pb-4 flex items-center justify-between">
                            <h2 className="text-2xl font-black text-slate-800 tracking-tight">
                                {t("master.items.addItem")}
                            </h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:bg-slate-200 transition-all"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleAddItem} className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] pl-1">
                                    {t("master.items.itemName")} *
                                </label>
                                <input
                                    required
                                    type="text"
                                    className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-[#15803d] focus:bg-white rounded-2xl font-bold transition-all outline-none"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] pl-1">
                                    {t("master.items.itemUnit")} *
                                </label>
                                <select
                                    required
                                    className="w-full px-6 py-4 bg-slate-50 border-2 border-transparent focus:border-[#15803d] focus:bg-white rounded-2xl font-bold transition-all outline-none appearance-none"
                                    value={formData.unit}
                                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                                >
                                    <option value="KG">{t("master.items.units.KG")}</option>
                                    <option value="BAG">{t("master.items.units.BAG")}</option>
                                    <option value="PCS">{t("master.items.units.PCS")}</option>
                                    <option value="CRATE">{t("master.items.units.CRATE")}</option>
                                    <option value="QUINTAL">{t("master.items.units.QUINTAL")}</option>
                                </select>
                            </div>

                            <div className="flex gap-4 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="flex-1 px-8 py-4 rounded-2xl font-black text-sm text-slate-500 bg-slate-100 hover:bg-slate-200 transition-all"
                                >
                                    {t("master.actions.cancel")}
                                </button>
                                <button
                                    disabled={submitting}
                                    type="submit"
                                    className="flex-[2] px-8 py-4 rounded-2xl font-black text-sm text-white bg-[#15803d] shadow-xl shadow-emerald-100 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {submitting ? <Loader2 className="animate-spin" size={20} /> : t("master.actions.save")}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
