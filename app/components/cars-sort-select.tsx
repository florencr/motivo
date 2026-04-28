"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

type CarsSortSelectProps = {
  value: string;
};

export default function CarsSortSelect({ value }: CarsSortSelectProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function onSortChange(nextSort: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", nextSort);
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <select
      id="sort"
      name="sort"
      value={value}
      onChange={(e) => onSortChange(e.target.value)}
      className="h-10 rounded-lg border border-slate-300 bg-white px-3 text-sm text-slate-700 outline-none focus:border-slate-500"
    >
      <option value="newest">Newest</option>
      <option value="price_asc">Price: Low to High</option>
      <option value="price_desc">Price: High to Low</option>
      <option value="year_asc">Oldest</option>
      <option value="mileage_asc">Mileage: Low to High</option>
      <option value="mileage_desc">Mileage: High to Low</option>
    </select>
  );
}
