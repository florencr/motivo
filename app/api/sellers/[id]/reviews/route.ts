import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUserFromRequest } from "@/lib/session-user";

function clampRating(value: unknown) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.min(5, Math.max(1, Math.round(n)));
}

async function refreshSellerAggregate(reviewedUserId: string) {
  const agg = await prisma.sellerReview.aggregate({
    where: { reviewedUserId },
    _avg: { averageRating: true },
    _count: { _all: true },
  });

  await prisma.user.update({
    where: { id: reviewedUserId },
    data: {
      dealerRating: agg._avg.averageRating ?? 0,
      dealerReviewCount: agg._count._all ?? 0,
    },
  });
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const seller = await prisma.user.findUnique({
    where: { id },
    select: { id: true, dealerRating: true, dealerReviewCount: true },
  });
  if (!seller) return NextResponse.json({ error: "seller not found" }, { status: 404 });

  const reviews = await prisma.sellerReview.findMany({
    where: { reviewedUserId: id },
    orderBy: { createdAt: "desc" },
    take: 5,
    select: {
      id: true,
      responsivenessRating: true,
      realityMatchRating: true,
      overallExperienceRating: true,
      averageRating: true,
      comment: true,
      createdAt: true,
      reviewer: { select: { name: true } },
    },
  });

  return NextResponse.json({
    rating: seller.dealerRating ?? 0,
    reviewCount: seller.dealerReviewCount ?? 0,
    reviews,
  });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSessionUserFromRequest(req);
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { id: reviewedUserId } = await params;
  if (user.id === reviewedUserId) {
    return NextResponse.json({ error: "you cannot rate yourself" }, { status: 400 });
  }

  const reviewedUser = await prisma.user.findUnique({
    where: { id: reviewedUserId },
    select: { id: true, role: true },
  });
  if (!reviewedUser) return NextResponse.json({ error: "seller not found" }, { status: 404 });

  if (!(reviewedUser.role === "DEALER" || reviewedUser.role === "PRIVATE_SELLER")) {
    return NextResponse.json({ error: "target user is not a seller" }, { status: 400 });
  }

  const body = await req.json();
  const responsivenessRating = clampRating(body?.responsivenessRating);
  const realityMatchRating = clampRating(body?.realityMatchRating);
  const overallExperienceRating = clampRating(body?.overallExperienceRating);
  const comment = body?.comment ? String(body.comment).trim() : null;

  if (!responsivenessRating || !realityMatchRating || !overallExperienceRating) {
    return NextResponse.json({ error: "all 3 ratings are required (1-5)" }, { status: 400 });
  }

  const averageRating =
    (responsivenessRating + realityMatchRating + overallExperienceRating) / 3;

  const review = await prisma.sellerReview.upsert({
    where: {
      reviewerId_reviewedUserId: {
        reviewerId: user.id,
        reviewedUserId,
      },
    },
    update: {
      responsivenessRating,
      realityMatchRating,
      overallExperienceRating,
      averageRating,
      comment,
    },
    create: {
      reviewerId: user.id,
      reviewedUserId,
      responsivenessRating,
      realityMatchRating,
      overallExperienceRating,
      averageRating,
      comment,
    },
  });

  await refreshSellerAggregate(reviewedUserId);
  return NextResponse.json({ review });
}
