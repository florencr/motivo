import { getCurrentUser } from "@/lib/session-user";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import DashboardSidebar from "./dashboard-sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  const h = await headers();
  const currentPath = h.get("x-pathname") || "/dashboard/sell";

  if (!user) {
    redirect(`/login?next=${encodeURIComponent(currentPath)}`);
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="flex min-h-screen">
        <DashboardSidebar showCompany={user.role === "DEALER"} />
        <main className="min-w-0 flex-1 p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
