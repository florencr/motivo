import { getCatalogData } from "@/lib/catalog";
import { getCurrentUser } from "@/lib/session-user";
import { redirect } from "next/navigation";
import SellForm from "./sell-form";

export default async function SellPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!(user.role === "DEALER" || user.role === "PRIVATE_SELLER")) redirect("/");

  const { vehicleTypes, makes, models } = await getCatalogData();

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-bold text-slate-900">Add Vehicle</h1>
        <p className="mt-2 text-sm text-slate-600">Create a published vehicle listing.</p>
        <SellForm vehicleTypes={vehicleTypes} makes={makes} models={models} />
      </div>
    </main>
  );
}
