import type { TopRatedSeller } from "@/lib/catalog";

function StarsRow({ rating }: { rating: number }) {
  const clamped = Math.min(5, Math.max(0, rating));
  return (
    <div className="flex items-center gap-0.5 text-amber-500" aria-hidden>
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star}>{clamped >= star ? "★" : "☆"}</span>
      ))}
    </div>
  );
}

export default function TopRatedSellers({ sellers }: { sellers: TopRatedSeller[] }) {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h3 className="text-xl font-semibold text-slate-900">Top Rated Dealers/Sellers</h3>
        <p className="mt-1 text-sm text-slate-600">Highest rated profiles based on buyer reviews.</p>
        {sellers.length === 0 ? (
          <p className="mt-4 text-sm text-slate-600">No ratings yet.</p>
        ) : (
          <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {sellers.map((seller) => {
              const label = seller.companyName?.trim() || seller.name;
              const isDealer = seller.role === "DEALER";
              return (
                <div
                  key={seller.id}
                  className={`rounded-xl border border-slate-200 px-3 py-3 ${
                    isDealer ? "transition hover:border-slate-400 hover:bg-slate-50" : ""
                  }`}
                >
                  {isDealer ? (
                    <a href={`/dealers/${seller.id}`} className="truncate text-sm font-semibold text-slate-900 hover:underline">
                      {label}
                    </a>
                  ) : (
                    <p className="truncate text-sm font-semibold text-slate-900">{label}</p>
                  )}
                  <p className="mt-0.5 text-xs text-slate-600">{seller.role === "DEALER" ? "Dealer" : "Private seller"}</p>
                  <div className="mt-2">
                    <StarsRow rating={seller.dealerRating} />
                  </div>
                  <p className="mt-1 text-xs text-slate-700">
                    {seller.dealerRating.toFixed(1)} / 5 ({seller.dealerReviewCount})
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
