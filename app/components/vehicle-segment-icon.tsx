import { CarFront, Caravan, CarTaxiFront, Mountain, Package, Sailboat, Shield, Truck, Waves, Zap } from "lucide-react";

export const VEHICLE_SEGMENT_ICON_OPTIONS = [
  { value: "sedan", label: "Sedan" },
  { value: "suv", label: "SUV" },
  { value: "hatchback", label: "Hatchback" },
  { value: "coupe", label: "Coupe" },
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

export function VehicleSegmentIcon({ icon, className = "h-4 w-4" }: { icon?: string | null; className?: string }) {
  const key = (icon || "sedan").toLowerCase();
  const strokeWidth = 1.8;

  if (key === "suv") return <Mountain className={className} strokeWidth={strokeWidth} />;
  if (key === "hatchback") return <CarTaxiFront className={className} strokeWidth={strokeWidth} />;
  if (key === "coupe") return <Shield className={className} strokeWidth={strokeWidth} />;
  if (key === "wagon") return <Package className={className} strokeWidth={strokeWidth} />;
  if (key === "van") return <Caravan className={className} strokeWidth={strokeWidth} />;
  if (key === "pickup") return <Truck className={className} strokeWidth={strokeWidth} />;
  if (key === "sport") return <Zap className={className} strokeWidth={strokeWidth} />;
  if (key === "adventure") return <Waves className={className} strokeWidth={strokeWidth} />;
  if (key === "motoboat") return <Waves className={className} strokeWidth={strokeWidth} />;
  if (key === "yacht") return <Sailboat className={className} strokeWidth={strokeWidth} />;
  if (key === "sailing") return <Sailboat className={className} strokeWidth={strokeWidth} />;
  if (key === "boat") return <Sailboat className={className} strokeWidth={strokeWidth} />;
  return <CarFront className={className} strokeWidth={strokeWidth} />;
}
