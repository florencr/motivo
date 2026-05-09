import { getCatalogData } from "@/lib/catalog";
import { getCurrentUser } from "@/lib/session-user";
import { getActiveListingFeatureOptions, getActiveListingTagOptions } from "@/lib/site-data";
import { redirect } from "next/navigation";
import SellForm from "./sell-form";

export const dynamic = "force-dynamic";

export default async function SellPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (!(user.role === "DEALER" || user.role === "PRIVATE_SELLER")) redirect("/");

  const { vehicleTypes, vehicleSegments, makes, models } = await getCatalogData();
  const [tagOptions, featureOptions] = await Promise.all([
    getActiveListingTagOptions(),
    getActiveListingFeatureOptions(),
  ]);

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-3xl font-bold text-slate-900">Shto mjet</h1>
        <p className="mt-2 text-sm text-slate-600">Krijo një listim të publikuar mjeti.</p>
        <SellForm
          vehicleTypes={vehicleTypes}
          vehicleSegments={vehicleSegments}
          makes={makes}
          models={models}
          tagOptions={tagOptions}
          featureOptions={featureOptions}
        />
      </div>
    </main>
  );
}
