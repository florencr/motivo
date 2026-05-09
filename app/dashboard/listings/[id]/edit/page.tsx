import { notFound, redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/session-user";
import { prisma } from "@/lib/prisma";
import { getCatalogData } from "@/lib/catalog";
import {
  getActiveListingFeatureOptions,
  getActiveListingTagOptions,
} from "@/lib/site-data";
import SellForm, { type SellFormInitial } from "@/app/sell/sell-form";

export const dynamic = "force-dynamic";

type EditPageParams = { params: Promise<{ id: string }> };

export default async function EditListingPage({ params }: EditPageParams) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const { id } = await params;

  const listing = await prisma.listing.findUnique({
    where: { id },
    select: {
      id: true,
      slug: true,
      sellerId: true,
      title: true,
      makeId: true,
      modelId: true,
      year: true,
      mileageKm: true,
      price: true,
      fuelType: true,
      transmission: true,
      city: true,
      description: true,
      hasAlbanianPlates: true,
      isCustomsPaid: true,
      isTaxRefundable: true,
      engineCapacity: true,
      powerHp: true,
      features: true,
      make: { select: { vehicleTypeId: true, segmentId: true } },
    },
  });

  if (!listing || listing.sellerId !== user.id) {
    notFound();
  }

  const { vehicleTypes, vehicleSegments, makes, models } = await getCatalogData();
  const [tagOptions, featureOptions] = await Promise.all([
    getActiveListingTagOptions(),
    getActiveListingFeatureOptions(),
  ]);

  const featuresJson = (listing.features as Record<string, unknown> | null) ?? {};
  const selectedFeatures = Array.isArray(featuresJson?.selectedFeatures)
    ? (featuresJson.selectedFeatures as unknown[]).filter(
        (v): v is string => typeof v === "string",
      )
    : [];
  const selectedTags = Array.isArray(featuresJson?.selectedTags)
    ? (featuresJson.selectedTags as unknown[]).filter(
        (v): v is string => typeof v === "string",
      )
    : [];
  const imageUrls = Array.isArray(featuresJson?.imageUrls)
    ? (featuresJson.imageUrls as unknown[]).filter(
        (v): v is string => typeof v === "string",
      )
    : [];

  const registrationStatus: SellFormInitial["registrationStatus"] =
    listing.hasAlbanianPlates == null && listing.isCustomsPaid == null
      ? ""
      : listing.hasAlbanianPlates
      ? "albanian_plates"
      : listing.isCustomsPaid
      ? "customs_paid"
      : "taxes_due";

  const initial: SellFormInitial = {
    title: listing.title,
    vehicleTypeId: listing.make?.vehicleTypeId ?? "",
    segmentId: listing.make?.segmentId ?? "",
    makeId: listing.makeId,
    modelId: listing.modelId,
    year: listing.year,
    mileageKm: listing.mileageKm,
    price: Number(listing.price),
    fuelType: listing.fuelType,
    transmission: listing.transmission,
    city: listing.city ?? "",
    description: listing.description,
    selectedFeatures,
    selectedTags,
    registrationStatus,
    isTaxRefundable: listing.isTaxRefundable,
    engineCapacity: listing.engineCapacity,
    powerHp: listing.powerHp,
    imageUrls,
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Modifiko listimin</h1>
          <p className="mt-1 text-sm text-slate-600">
            Përditëso informacionin e mjetit tënd.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`/makina/${listing.slug || listing.id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded border border-slate-300 px-3 py-1.5 text-xs text-slate-700 hover:border-slate-500 hover:bg-slate-50"
          >
            Shiko në faqe
          </a>
          <a
            href="/dashboard/listings"
            className="rounded border border-slate-300 px-3 py-1.5 text-xs text-slate-700 hover:border-slate-500 hover:bg-slate-50"
          >
            Kthehu te listimet
          </a>
        </div>
      </div>

      <SellForm
        vehicleTypes={vehicleTypes}
        vehicleSegments={vehicleSegments}
        makes={makes}
        models={models}
        tagOptions={tagOptions}
        featureOptions={featureOptions}
        mode="edit"
        listingId={listing.id}
        initial={initial}
      />
    </div>
  );
}
