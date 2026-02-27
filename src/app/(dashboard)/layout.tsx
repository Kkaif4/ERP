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
        <AppShell user={{
            id: session.userId,
            name: session.name,
            role: session.role,
            organizationId: session.organizationId
        }}>
            {children}
        </AppShell>
    );
}
