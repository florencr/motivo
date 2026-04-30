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

export function VehicleTypeIcon({ icon, className = "h-4 w-4" }: { icon?: string | null; className?: string }) {
  const key = (icon || "car").toLowerCase();

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
