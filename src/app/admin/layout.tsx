import { getSession } from "@/lib/auth";
import { redirect } from "next/navigation";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getSession();

    if (!session) redirect("/login");
    if (session.role !== "SUPER_ADMIN") redirect("/dashboard");

    return (
        <div
            style={{
                minHeight: "100vh",
                backgroundColor: "var(--bg-main)",
                color: "var(--text-main)",
                fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
            }}
        >
            {/* Admin Top Bar */}
            <header
                className="glass-header layout-container"
                style={{
                    height: "72px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    position: "sticky",
                    top: 0,
                    zIndex: 50,
                }}
            >
                <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                    <div
                        style={{
                            width: "42px",
                            height: "42px",
                            backgroundColor: "var(--primary-main)",
                            borderRadius: "14px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            boxShadow: "0 8px 16px var(--primary-glow)",
                        }}
                    >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        </svg>
                    </div>
                    <div className="hidden sm:block">
                        <p style={{ margin: 0, fontSize: "16px", fontWeight: 900, color: "var(--text-main)", letterSpacing: "-0.01em" }}>Mandi ERP</p>
                        <p style={{ margin: 0, fontSize: "10px", fontWeight: 800, color: "var(--primary-main)", textTransform: "uppercase", letterSpacing: "0.2em" }}>
                            Admin Console
                        </p>
                    </div>
                </div>


                <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <a
                        href="/dashboard"
                        className="back-btn"
                        style={{
                            fontSize: "12px",
                            fontWeight: 800,
                            color: "var(--text-muted)",
                            textDecoration: "none",
                            padding: "8px 16px",
                            borderRadius: "12px",
                            border: "1px solid var(--border-main)",
                            transition: "all 0.2s",
                            backgroundColor: "#fff",
                        }}
                    >
                        ← Dashboard
                    </a>
                    <form action="/api/auth/logout" method="POST">
                        <button
                            type="submit"
                            style={{
                                fontSize: "12px",
                                fontWeight: 800,
                                color: "#ef4444",
                                background: "none",
                                border: "1px solid rgba(239, 68, 68, 0.1)",
                                padding: "8px 16px",
                                borderRadius: "12px",
                                cursor: "pointer",
                                fontFamily: "inherit",
                                transition: "all 0.2s",
                            }}
                        >
                            Logout
                        </button>
                    </form>
                </div>
            </header>

            <main className="layout-container py-10" style={{ maxWidth: "1400px" }}>
                {children}
            </main>

            <style>{`
                .back-btn:hover {
                    color: var(--primary-main) !important;
                    border-color: var(--primary-main) !important;
                    box-shadow: 0 4px 12px var(--primary-glow);
                }
            `}</style>
        </div>
    );
}
