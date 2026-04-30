import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/session-user";
import { redirect } from "next/navigation";

const LISTING_EXPIRY_DAYS = 30;

function formatDate(value: Date) {
  return value.toLocaleDateString("en-GB");
}

function getExpiryDate(createdAt: Date) {
  const expiry = new Date(createdAt);
  expiry.setDate(expiry.getDate() + LISTING_EXPIRY_DAYS);
  return expiry;
}

type UserProfilePageProps = {
  params: Promise<{ id: string }>;
};

export default async function AdminUserProfilePage({ params }: UserProfilePageProps) {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) redirect("/login");
  if (sessionUser.role !== "ADMIN") redirect("/");

  const { id } = await params;
  const user = await prisma.user.findUnique({
    where: { id },
    include: {
      listings: {
        orderBy: { createdAt: "desc" },
        include: {
          make: {
            include: {
              vehicleType: true,
              segment: true,
            },
          },
        },
      },
    },
  });

  if (!user) {
    return (
      <main className="space-y-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h1 className="text-2xl font-bold text-slate-900">User not found</h1>
          <a href="/admin/users" className="mt-3 inline-block text-sm text-slate-700 underline">
            Back to users
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{user.name}</h1>
            <p className="mt-1 text-sm text-slate-600">Role: {user.role}</p>
            <p className="mt-1 text-sm text-slate-600">
              Rating: {user.dealerRating != null ? Number(user.dealerRating).toFixed(1) : "0.0"} / 5 (
              {user.dealerReviewCount} reviews)
            </p>
          </div>
          <a href="/admin/users" className="text-sm text-slate-700 underline">
            Back to users
          </a>
        </div>

        <div className="mt-5 grid gap-3 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm sm:grid-cols-2">
          <p>
            <span className="font-semibold text-slate-800">Profile type:</span>{" "}
            <span className="text-slate-700">{user.sellerType ?? "-"}</span>
          </p>
          <p>
            <span className="font-semibold text-slate-800">Full name:</span>{" "}
            <span className="text-slate-700">{user.name}</span>
          </p>
          <p>
            <span className="font-semibold text-slate-800">Email:</span>{" "}
            <span className="text-slate-700">{user.email}</span>
          </p>
          <p>
            <span className="font-semibold text-slate-800">Phone:</span>{" "}
            <span className="text-slate-700">{user.phone ?? "-"}</span>
          </p>
          <p>
            <span className="font-semibold text-slate-800">Address:</span>{" "}
            <span className="text-slate-700">{user.address ?? "-"}</span>
          </p>
          <p>
            <span className="font-semibold text-slate-800">Company:</span>{" "}
            <span className="text-slate-700">{user.companyName ?? "-"}</span>
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Listings</h2>
        {user.listings.length === 0 ? (
          <p className="mt-3 text-sm text-slate-600">No listings for this user.</p>
        ) : (
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-slate-200 text-slate-600">
                <tr>
                  <th className="py-2">Type</th>
                  <th className="py-2">Name</th>
                  <th className="py-2">Category</th>
                  <th className="py-2">#No</th>
                  <th className="py-2">Date Added</th>
                  <th className="py-2">Expiration</th>
                </tr>
              </thead>
              <tbody>
                {user.listings.map((listing) => (
                  <tr key={listing.id} className="border-b border-slate-100">
                    <td className="py-2 text-slate-700">{listing.make.vehicleType.name}</td>
                    <td className="py-2 text-slate-800">{listing.title}</td>
                    <td className="py-2 text-slate-700">{listing.make.segment?.name ?? "-"}</td>
                    <td className="py-2 text-slate-700">{listing.id.slice(0, 8)}</td>
                    <td className="py-2 text-slate-700">{formatDate(listing.createdAt)}</td>
                    <td className="py-2 text-slate-700">{formatDate(getExpiryDate(listing.createdAt))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
