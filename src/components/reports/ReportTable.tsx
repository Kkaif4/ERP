"use client";

import { useState, useMemo } from "react";
import { useTranslation } from "@/lib/i18n";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

interface Column {
    key: string;
    label: string;
    align?: "left" | "center" | "right";
    render?: (value: any, item: any) => React.ReactNode;
}

interface ReportTableProps {
    columns: Column[];
    data: any[];
    emptyMessage?: string;
}

export default function ReportTable({ columns, data, emptyMessage }: ReportTableProps) {
    const { t } = useTranslation();
    const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

    const sortedData = useMemo(() => {
        const hasDateCol = columns.some(c => c.key === "date");
        if (!hasDateCol) return data;

        return [...data].sort((a, b) => {
            const valA = a.date || a.createdAt;
            const valB = b.date || b.createdAt;
            if (!valA || !valB) return 0;
            const dateA = new Date(valA).getTime();
            const dateB = new Date(valB).getTime();
            if (isNaN(dateA) || isNaN(dateB)) return 0;
            return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
        });
    }, [data, sortOrder, columns]);

    return (
        <div className="premium-card overflow-hidden">
            <div className="overflow-x-auto border border-gray-200 rounded-none overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow className="bg-gray-100 border-b-2 border-gray-300 sticky top-0 z-10">
                            {columns.map((col, idx) => (
                                <TableHead
                                    key={col.key}
                                    onClick={col.key === "date" ? () => setSortOrder(s => s === "asc" ? "desc" : "asc") : undefined}
                                    className={cn(
                                        "h-10 px-4 text-[11px] font-semibold uppercase tracking-wider text-gray-600 border-r border-gray-200 last:border-r-0 whitespace-nowrap",
                                        col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left",
                                        col.key === "date" && "cursor-pointer select-none"
                                    )}
                                >
                                    <div className={cn(
                                        "flex items-center gap-1",
                                        col.align === "right" ? "justify-end" : "justify-start"
                                    )}>
                                        {col.label}
                                        {col.key === "date" && (
                                            <span className={cn("text-xs", sortOrder === "desc" ? "text-blue-600" : "text-gray-400")}>
                                                {sortOrder === "desc" ? "↓" : "↑"}
                                            </span>
                                        )}
                                    </div>
                                </TableHead>
                            ))}
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.length === 0 ? (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className="h-32 text-center text-sm font-medium text-gray-400"
                                >
                                    {emptyMessage || t("reports.noData")}
                                </TableCell>
                            </TableRow>
                        ) : (
                            sortedData.map((item, idx) => (
                                <TableRow
                                    key={idx}
                                    className="even:bg-gray-50/50 odd:bg-white hover:bg-blue-50/30 transition-colors border-b border-gray-200 last:border-b-0"
                                >
                                    {columns.map((col, colIdx) => (
                                        <TableCell
                                            key={col.key}
                                            className={cn(
                                                "border-r border-gray-200 last:border-r-0",
                                                col.align === "right" && "text-right",
                                                col.align === "center" && "text-center",
                                                (colIdx === 0 || col.key === "date" || col.key === "party") ? "text-[14px] font-bold text-gray-900" : "text-[14px] text-gray-900",
                                                (col.key === "amount" || col.key === "netTotal" || col.key === "balance" || col.key === "othersAmount" || col.key === "totalKg" || col.key === "totalUnits") && "font-bold tabular-nums border-l border-gray-200 bg-gray-50/30"
                                            )}
                                        >
                                            <div className={cn("text-[14px]")}>
                                                {col.render ? col.render(item[col.key], item) : item[col.key]}
                                            </div>
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}
