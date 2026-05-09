import { getCatalogData } from "@/lib/catalog";
import { getActiveListingFeatureOptions, getActiveListingTagOptions } from "@/lib/site-data";
import SellForm from "@/app/sell/sell-form";

export const dynamic = "force-dynamic";

export default async function DashboardSellPage() {
  const { vehicleTypes, vehicleSegments, makes, models } = await getCatalogData();
  const [tagOptions, featureOptions] = await Promise.all([
    getActiveListingTagOptions(),
    getActiveListingFeatureOptions(),
  ]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
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
  );
}
