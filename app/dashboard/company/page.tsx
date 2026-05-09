import { getCurrentUser } from "@/lib/session-user";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import CompanyForm from "./company-form";

export default async function DashboardCompanyPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role !== "DEALER") redirect("/dashboard/profile");

  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      companyName: true,
      companySlug: true,
      companySlogan: true,
      companyLogoUrl: true,
      taxId: true,
      dealerLicenseNo: true,
      profileDescription: true,
    },
  });

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-3xl font-bold text-slate-900">Profili i kompanisë</h1>
      <p className="mt-2 text-sm text-slate-600">
        Informacioni publik që shfaqet në faqen tuaj të koncesionarit dhe në çdo listim.
      </p>

      <CompanyForm
        initialCompanyName={profile?.companyName ?? ""}
        initialCompanySlug={profile?.companySlug ?? ""}
        initialCompanySlogan={profile?.companySlogan ?? ""}
        initialCompanyLogoUrl={profile?.companyLogoUrl ?? ""}
        initialTaxId={profile?.taxId ?? ""}
        initialDealerLicenseNo={profile?.dealerLicenseNo ?? ""}
        initialProfileDescription={profile?.profileDescription ?? ""}
      />
    </div>
  );
}
