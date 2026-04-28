import { getCurrentUser } from "@/lib/session-user";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const isSeller = user.role === "DEALER" || user.role === "PRIVATE_SELLER";
  if (!isSeller) redirect("/");

  return <>{children}</>;
}
