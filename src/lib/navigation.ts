import { LucideIcon } from "lucide-react";
import {
    LayoutDashboard,
    ReceiptText,
    Users,
    UserSearch,
    Package,
    WalletCards,
    BarChart3,
    Settings,
    ShieldCheck,
} from "lucide-react";

export interface NavItem {
    key: string;
    href: string;
    icon: LucideIcon;
    adminOnly?: boolean;
}

export const mainNav: NavItem[] = [
    { key: "dashboard", href: "/dashboard", icon: LayoutDashboard },
    { key: "bills", href: "/bills", icon: ReceiptText },
];

export const masterNav: NavItem[] = [
    { key: "farmers", href: "/farmers", icon: Users },
    { key: "customers", href: "/customers", icon: UserSearch },
    { key: "items", href: "/items", icon: Package },
];

export const financeNav: NavItem[] = [
    { key: "payments", href: "/payments", icon: WalletCards },
    { key: "reports", href: "/reports", icon: BarChart3, adminOnly: true },
];

export const systemNav: NavItem[] = [
    { key: "settings", href: "/settings", icon: Settings, adminOnly: true },
    { key: "staff", href: "/staff", icon: ShieldCheck, adminOnly: true },
];
