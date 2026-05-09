import { cache } from "react";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@/app/generated/prisma/enums";

export type DealerPublicCard = {
  id: string;
  companySlug: string;
  companyName: string | null;
  name: string;
  companyLogoUrl: string | null;
  companySlogan: string | null;
  profileDescription: string | null;
  address: string | null;
  phone: string | null;
  email: string;
  dealerRating: number | null;
  dealerReviewCount: number;
};

export const getDealerByPublicSlug = cache(
  async (slug: string): Promise<DealerPublicCard | null> => {
    const dealer = await prisma.user.findFirst({
      where: {
        companySlug: { equals: slug, mode: "insensitive" },
        role: UserRole.DEALER,
        isActive: true,
      },
      select: {
        id: true,
        companySlug: true,
        companyName: true,
        name: true,
        companyLogoUrl: true,
        companySlogan: true,
        profileDescription: true,
        address: true,
        phone: true,
        email: true,
        dealerRating: true,
        dealerReviewCount: true,
      },
    });
    if (!dealer || !dealer.companySlug) return null;
    const canonicalSlug = dealer.companySlug;
    return {
      id: dealer.id,
      companySlug: canonicalSlug,
      companyName: dealer.companyName,
      name: dealer.name,
      companyLogoUrl: dealer.companyLogoUrl,
      companySlogan: dealer.companySlogan,
      profileDescription: dealer.profileDescription,
      address: dealer.address,
      phone: dealer.phone,
      email: dealer.email,
      dealerRating:
        dealer.dealerRating != null ? Number(dealer.dealerRating) : null,
      dealerReviewCount: dealer.dealerReviewCount,
    };
  },
);
