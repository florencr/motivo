import type { ReactNode } from "react";
import { getVehicleTypePageConfig } from "@/lib/vehicle-type-pages";
import { getDealerByPublicSlug } from "@/lib/dealer-public-page";
import DealerSiteChrome from "@/app/components/dealer-site-chrome";

type SlugLayoutProps = {
  children: ReactNode;
  params: Promise<{ slug: string }>;
};

export default async function SlugLayout({ children, params }: SlugLayoutProps) {
  const { slug } = await params;

  if (getVehicleTypePageConfig(slug)) {
    return <>{children}</>;
  }

  const dealer = await getDealerByPublicSlug(slug);
  if (!dealer) {
    return <>{children}</>;
  }

  return <DealerSiteChrome dealer={dealer}>{children}</DealerSiteChrome>;
}
