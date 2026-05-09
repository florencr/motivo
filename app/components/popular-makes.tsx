import type { PopularMakeFromListings } from "@/lib/catalog";

type PopularMakesProps = {
  makes: PopularMakeFromListings[];
};

function MakeInitialsMark({ name }: { name: string }) {
  const letters = name
    .replace(/[^a-zA-Z0-9\s]/g, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
  const text = letters.length > 0 ? letters.slice(0, 2) : name.slice(0, 2).toUpperCase();

  return (
    <span
      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-xs font-bold tracking-tight text-slate-700"
      aria-hidden="true"
    >
      {text}
    </span>
  );
}

export default function PopularMakes({ makes }: PopularMakesProps) {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h3 className="text-xl font-semibold text-slate-900">Markat më të njohura</h3>
        <p className="mt-1 text-sm text-slate-600">Bazuar në listimet e publikuara në katalogun tënd.</p>
        {makes.length === 0 ? (
          <p className="mt-4 text-sm text-slate-600">
            Ende nuk ka listime të publikuara — markat e njohura do të shfaqen këtu sapo shitësit të listojnë mjete.
          </p>
        ) : (
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {makes.map((make) => (
              <a
                key={make.id}
                href={`/${encodeURIComponent(make.vehicleTypeSlug)}?make=${encodeURIComponent(make.name)}`}
                className="flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-3 transition hover:border-slate-400 hover:bg-slate-50"
              >
                {make.logoUrl ? (
                  <img
                    src={make.logoUrl}
                    alt={`${make.name} logo`}
                    className="h-9 w-9 shrink-0 rounded-lg border border-slate-200 object-contain bg-white p-1"
                    loading="lazy"
                  />
                ) : (
                  <MakeInitialsMark name={make.name} />
                )}
                <span className="min-w-0 flex-1 text-sm font-medium text-slate-800">{make.name}</span>
              </a>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
