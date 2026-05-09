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
      <option value="newest">Më të rejat</option>
      <option value="price_asc">Çmimi: më i ulët në më të lartë</option>
      <option value="price_desc">Çmimi: më i lartë në më të ulët</option>
      <option value="year_asc">Më të vjetrat</option>
      <option value="mileage_asc">Kilometrazhi: më i ulët në më të lartë</option>
      <option value="mileage_desc">Kilometrazhi: më i lartë në më të ulët</option>
    </select>
  );
}
