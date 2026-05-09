import { Bus, Car, Bike, Ship, Truck, Van } from "lucide-react";

export const VEHICLE_TYPE_ICON_OPTIONS = [
  { value: "car", label: "Car" },
  { value: "motorcycle", label: "Motorcycle" },
  { value: "truck", label: "Truck" },
  { value: "van", label: "Van" },
  { value: "bus", label: "Bus" },
  { value: "boat", label: "Boat" },
] as const;

export type VehicleTypeIconKey = (typeof VEHICLE_TYPE_ICON_OPTIONS)[number]["value"];

/** When `icon` is null, pick a sensible Lucide key from the vehicle type slug (e.g. boats → boat). */
export function inferVehicleTypeIconKey(typeSlug?: string | null): VehicleTypeIconKey {
  const s = (typeSlug ?? "").toLowerCase().trim();
  if (!s) return "car";
  if (s.includes("motor") || s.includes("motoc") || s === "bikes" || s === "bike")
    return "motorcycle";
  if (s.includes("truck") || s.includes("kamion")) return "truck";
  if (
    s.includes("boat") ||
    s === "marine" ||
    s === "watercraft" ||
    s.includes("varka")
  )
    return "boat";
  if (s.includes("van") || s.includes("furgon")) return "van";
  if (s.includes("bus")) return "bus";
  return "car";
}

export function VehicleTypeIcon({
  icon,
  typeSlug,
  className = "h-4 w-4",
}: {
  icon?: string | null;
  /** Vehicle type slug from DB; used when `icon` is unset */
  typeSlug?: string | null;
  className?: string;
}) {
  const trimmed = icon?.trim();
  const key = (trimmed || inferVehicleTypeIconKey(typeSlug)).toLowerCase();

  const strokeWidth = 1.8;
  if (key === "motorcycle") {
    return <Bike className={className} strokeWidth={strokeWidth} />;
  }
  if (key === "truck") {
    return <Truck className={className} strokeWidth={strokeWidth} />;
  }
  if (key === "van") {
    return <Van className={className} strokeWidth={strokeWidth} />;
  }
  if (key === "bus") {
    return <Bus className={className} strokeWidth={strokeWidth} />;
  }
  if (key === "boat") {
    return <Ship className={className} strokeWidth={strokeWidth} />;
  }

  return <Car className={className} strokeWidth={strokeWidth} />;
}
