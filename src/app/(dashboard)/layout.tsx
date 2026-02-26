import { getSession } from "@/lib/auth";
import { AppShell } from "@/components/layout/AppShell";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getSession();

    if (!session) {
        redirect("/login");
    }

    return (
        <AppShell user={{ name: session.name, role: session.role }}>
            {children}
        </AppShell>
    );
}
