import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function AdminPage() {
    const session = await getSession();
    if (!session || session.role !== "SUPER_ADMIN") redirect("/login");

    // Fetch platform-level stats
    const [totalOrgs, totalUsers, totalBills, totalFarmers, totalCustomers] =
        await Promise.all([
            prisma.organization.count(),
            prisma.user.count(),
            prisma.bill.count(),
            prisma.farmer.count(),
            prisma.customer.count(),
        ]);

    // Recent organizations
    const recentOrgs = await prisma.organization.findMany({
        orderBy: { createdAt: "desc" },
        take: 8,
        include: {
            _count: { select: { users: true, bills: true, farmers: true } },
            subscriptions: {
                orderBy: { createdAt: "desc" },
                take: 1,
                include: { plan: { select: { name: true } } },
            },
        },
    });

    const platformStats = [
        { label: "Organizations", value: totalOrgs, emoji: "🏢" },
        { label: "Total Users", value: totalUsers, emoji: "👤" },
        { label: "Total Bills", value: totalBills, emoji: "🧾" },
        { label: "Farmers", value: totalFarmers, emoji: "🌾" },
        { label: "Customers", value: totalCustomers, emoji: "🛒" },
    ];

    return (
        <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>

            {/* Header section with Premium accent line */}
            <div style={{ position: "relative" }}>
                <h1
                    style={{
                        fontSize: "1.875rem",
                        fontWeight: 900,
                        color: "var(--text-main)",
                        letterSpacing: "-0.02em",
                        margin: 0,
                    }}
                >
                    Platform Overview
                </h1>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "4px" }}>
                    <div style={{ height: "3px", width: "32px", backgroundColor: "var(--primary-main)", borderRadius: "2px" }} />
                    <p style={{ margin: 0, fontSize: "11px", color: "var(--primary-main)", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.2em" }}>
                        Sabzi Mandi ERP Global Admin
                    </p>
                </div>
            </div>

            {/* Platform Stat Cards */}
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                    gap: "1.5rem",
                }}
            >
                {platformStats.map((stat) => (
                    <div
                        key={stat.label}
                        className="premium-card"
                        style={{
                            padding: "2rem",
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between",
                        }}
                    >
                        <div style={{
                            width: "54px",
                            height: "54px",
                            backgroundColor: "var(--bg-main)",
                            borderRadius: "16px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            fontSize: "26px",
                            marginBottom: "1.5rem",
                            border: "1px solid var(--border-main)"
                        }}>
                            {stat.emoji}
                        </div>
                        <div>
                            <p style={{ margin: "0 0 4px", fontSize: "11px", fontWeight: 800, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
                                {stat.label}
                            </p>
                            <p style={{ margin: 0, fontSize: "2rem", fontWeight: 900, color: "var(--text-main)", letterSpacing: "-0.02em" }}>
                                {stat.value.toLocaleString()}
                            </p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Organizations Table Card */}
            <div className="premium-card" style={{ overflow: "hidden" }}>
                <div
                    style={{
                        padding: "1.75rem 2rem",
                        borderBottom: "1px solid var(--border-main)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        background: "#fff"
                    }}
                >
                    <h3 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 900, color: "var(--text-main)", letterSpacing: "-0.01em" }}>
                        Active Organizations
                    </h3>
                    <span className="accent-badge">
                        {totalOrgs} groups
                    </span>
                </div>

                {recentOrgs.length === 0 ? (
                    <div style={{ padding: "4rem", textAlign: "center", color: "var(--text-muted)", fontSize: "14px", fontWeight: 700 }}>
                        No organizations registered yet.
                    </div>
                ) : (
                    <div>
                        <div
                            className="table-head"
                            style={{
                                display: "grid",
                                gridTemplateColumns: "2fr 1fr 1fr 1fr 120px",
                                padding: "1.25rem 2rem",
                                gap: "1rem",
                            }}
                        >
                            <span>Organization</span>
                            <span>Users</span>
                            <span>Bills</span>
                            <span>Plan</span>
                            <span>Status</span>
                        </div>

                        {recentOrgs.map((org) => {
                            const subscription = org.subscriptions[0];
                            return (
                                <div
                                    key={org.id}
                                    className="table-row"
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns: "2fr 1fr 1fr 1fr 120px",
                                        padding: "1.5rem 2rem",
                                        gap: "1rem",
                                        alignItems: "center",
                                    }}
                                >
                                    <div>
                                        <p style={{ margin: 0, fontSize: "14px", fontWeight: 800, color: "var(--text-main)" }}>
                                            {org.name}
                                        </p>
                                        <p style={{ margin: "2px 0 0", fontSize: "12px", color: "var(--text-muted)", fontWeight: 600 }}>
                                            /{org.slug}
                                        </p>
                                    </div>
                                    <span style={{ fontSize: "14px", fontWeight: 800, color: "var(--text-muted)" }}>
                                        {org._count.users}
                                    </span>
                                    <span style={{ fontSize: "14px", fontWeight: 800, color: "var(--text-muted)" }}>
                                        {org._count.bills}
                                    </span>
                                    <span style={{ fontSize: "12px", fontWeight: 900, color: "var(--primary-main)", textTransform: "uppercase", letterSpacing: "0.12em" }}>
                                        {subscription?.plan?.name ?? "No Plan"}
                                    </span>
                                    <span>
                                        <span
                                            style={{
                                                display: "inline-block",
                                                padding: "6px 14px",
                                                borderRadius: "20px",
                                                fontSize: "10px",
                                                fontWeight: 900,
                                                textTransform: "uppercase",
                                                letterSpacing: "0.12em",
                                                backgroundColor: org.isActive ? "var(--primary-glow)" : "#fef2f2",
                                                color: org.isActive ? "var(--primary-main)" : "#ef4444",
                                                border: `1px solid ${org.isActive ? "rgba(21, 128, 61, 0.2)" : "rgba(239, 68, 68, 0.2)"}`
                                            }}
                                        >
                                            {org.isActive ? "Active" : "Inactive"}
                                        </span>
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
