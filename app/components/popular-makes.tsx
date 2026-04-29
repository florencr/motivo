const popularMakes = [
  {
    name: "Mercedes-Benz",
    logoUrl:
      "https://upload.wikimedia.org/wikipedia/commons/9/90/Mercedes-Logo.svg",
  },
  {
    name: "BMW",
    logoUrl:
      "https://upload.wikimedia.org/wikipedia/commons/4/44/BMW.svg",
  },
  {
    name: "Audi",
    logoUrl:
      "https://upload.wikimedia.org/wikipedia/commons/6/6f/Audi_logo_detail.svg",
  },
  {
    name: "Volkswagen",
    logoUrl:
      "https://upload.wikimedia.org/wikipedia/commons/6/6d/Volkswagen_logo_2019.svg",
  },
  {
    name: "Toyota",
    logoUrl:
      "https://upload.wikimedia.org/wikipedia/commons/9/9d/Toyota_carlogo.svg",
  },
  {
    name: "Porsche",
    logoUrl:
      "https://upload.wikimedia.org/wikipedia/en/8/8c/Porsche_logo.svg",
  },
  {
    name: "Land Rover",
    logoUrl:
      "https://upload.wikimedia.org/wikipedia/commons/e/e0/Land_Rover_logo_black.svg",
  },
  {
    name: "Tesla",
    logoUrl:
      "https://upload.wikimedia.org/wikipedia/commons/b/bd/Tesla_Motors.svg",
  },
];

export default function PopularMakes() {
  return (
    <section className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">
        <h2 className="text-xl font-semibold text-slate-900">Popular Makes</h2>
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {popularMakes.map((make) => (
            <a
              key={make.name}
              href={`/cars?vehicleType=cars&make=${encodeURIComponent(make.name)}`}
              className="flex items-center gap-3 rounded-xl border border-slate-200 px-3 py-3 transition hover:border-slate-400 hover:bg-slate-50"
            >
              <img
                src={make.logoUrl}
                alt={`${make.name} logo`}
                className="h-9 w-9 rounded bg-white object-contain p-1"
                loading="lazy"
              />
              <span className="text-sm font-medium text-slate-800">{make.name}</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}
