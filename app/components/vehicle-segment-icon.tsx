import {
  Car,
  CarFront,
  Caravan,
  CarTaxiFront,
  Sailboat,
  Shield,
  Truck,
  Waves,
  Zap,
} from "lucide-react";

const SIMPLE_CAR_BODY_KEYS = new Set(["suv", "coupe", "convertible", "wagon"]);

function isCarLikeVehicleType(vehicleTypeSlug?: string | null): boolean {
  const vt = (vehicleTypeSlug ?? "").toLowerCase().trim();
  if (!vt) return true;
  if (vt.includes("truck") || vt.includes("kamion")) return false;
  if (vt.includes("boat") || vt === "marine" || vt.includes("varka")) return false;
  if (
    vt.includes("motor") ||
    vt.includes("motoc") ||
    vt === "bikes" ||
    vt === "bike"
  )
    return false;
  return true;
}

function isSafeHttpUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === "https:" || u.protocol === "http:";
  } catch {
    return false;
  }
}

export const VEHICLE_SEGMENT_ICON_OPTIONS = [
  { value: "sedan", label: "Sedan" },
  { value: "suv", label: "SUV" },
  { value: "hatchback", label: "Hatchback" },
  { value: "coupe", label: "Coupe" },
  { value: "convertible", label: "Convertible" },
  { value: "wagon", label: "Wagon" },
  { value: "van", label: "Van" },
  { value: "pickup", label: "Pickup" },
  { value: "sport", label: "Sport" },
  { value: "adventure", label: "Adventure" },
  { value: "motoboat", label: "Motorboat" },
  { value: "yacht", label: "Yacht" },
  { value: "sailing", label: "Sailing" },
  { value: "boat", label: "Boat" },
] as const;

/** When `icon` is null, infer from segment + vehicle type slugs (e.g. boats/yacht → yacht). */
export function inferVehicleSegmentIconKey(
  segmentSlug?: string | null,
  vehicleTypeSlug?: string | null,
): string {
  const seg = (segmentSlug ?? "").toLowerCase().trim();
  const vt = (vehicleTypeSlug ?? "").toLowerCase().trim();
  if (seg && vt) {
    if (vt.includes("boat") || vt === "marine") {
      if (seg.includes("yacht")) return "yacht";
      if (seg.includes("sail")) return "sailing";
      if (seg.includes("jet") || seg.includes("ski")) return "motoboat";
      if (seg.includes("motorboat") || seg === "motorboat" || seg === "motoboat") return "motoboat";
      if (seg.includes("rib")) return "boat";
      return "boat";
    }
    if (vt.includes("truck")) {
      return "pickup";
    }
    if (vt.includes("motor") || vt === "bikes" || vt === "bike") {
      if (seg.includes("scooter")) return "hatchback";
      if (seg.includes("naked") || seg.includes("sport")) return "sport";
      if (seg.includes("touring")) return "adventure";
      if (seg.includes("adventure")) return "adventure";
      if (seg.includes("cruiser")) return "coupe";
      return "sedan";
    }
    const car: Record<string, string> = {
      sedan: "sedan",
      hatchback: "hatchback",
      suv: "suv",
      coupe: "coupe",
      convertible: "convertible",
      wagon: "wagon",
      van: "van",
    };
    if (car[seg]) return car[seg];
  }
  return "sedan";
}

export function VehicleSegmentIcon({
  icon,
  iconUrl,
  segmentSlug,
  vehicleTypeSlug,
  className = "h-4 w-4",
}: {
  icon?: string | null;
  /** When set (https/http image URL), shown instead of Lucide icon */
  iconUrl?: string | null;
  segmentSlug?: string | null;
  vehicleTypeSlug?: string | null;
  className?: string;
}) {
  const url = iconUrl?.trim();
  if (url && isSafeHttpUrl(url)) {
    return (
      <img
        src={url}
        alt=""
        className={`${className} object-contain`}
        loading="lazy"
        referrerPolicy="no-referrer"
      />
    );
  }

  const trimmed = icon?.trim();
  const key = (trimmed || inferVehicleSegmentIconKey(segmentSlug, vehicleTypeSlug)).toLowerCase();
  const strokeWidth = 1.8;

  if (isCarLikeVehicleType(vehicleTypeSlug) && SIMPLE_CAR_BODY_KEYS.has(key)) {
    return <Car className={className} strokeWidth={strokeWidth} />;
  }
  if (key === "hatchback") return <CarTaxiFront className={className} strokeWidth={strokeWidth} />;
  if (key === "coupe") return <Shield className={className} strokeWidth={strokeWidth} />;
  if (key === "van") return <Caravan className={className} strokeWidth={strokeWidth} />;
  if (key === "pickup") return <Truck className={className} strokeWidth={strokeWidth} />;
  if (key === "sport") return <Zap className={className} strokeWidth={strokeWidth} />;
  if (key === "adventure") return <Waves className={className} strokeWidth={strokeWidth} />;
  if (key === "motoboat" || key === "motorboat") return <Waves className={className} strokeWidth={strokeWidth} />;
  if (key === "yacht") return <Sailboat className={className} strokeWidth={strokeWidth} />;
  if (key === "sailing") return <Sailboat className={className} strokeWidth={strokeWidth} />;
  if (key === "boat") return <Sailboat className={className} strokeWidth={strokeWidth} />;
  return <CarFront className={className} strokeWidth={strokeWidth} />;
}
