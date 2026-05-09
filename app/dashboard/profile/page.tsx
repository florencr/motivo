import { getCurrentUser } from "@/lib/session-user";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import ProfileForm from "./profile-form";

export default async function DashboardProfilePage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const profile = await prisma.user.findUnique({
    where: { id: user.id },
    select: {
      name: true,
      email: true,
      phone: true,
      address: true,
      avatarUrl: true,
      profileDescription: true,
    },
  });

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <h1 className="text-3xl font-bold text-slate-900">Profili i llogarisë</h1>
      <p className="mt-2 text-sm text-slate-600">
        Informacioni personal i kontaktit që shfaqet në listime dhe te blerësit.
      </p>

      <ProfileForm
        initialName={profile?.name ?? ""}
        email={profile?.email ?? ""}
        initialPhone={profile?.phone ?? ""}
        initialAddress={profile?.address ?? ""}
        initialAvatarUrl={profile?.avatarUrl ?? ""}
        initialProfileDescription={profile?.profileDescription ?? ""}
      />
    </div>
  );
}
