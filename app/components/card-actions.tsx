"use client";

import { useState } from "react";
import { GitCompareArrows, Heart, Share2 } from "lucide-react";

type CardActionsProps = {
  carTitle: string;
  viewHref: string;
  showViewButton?: boolean;
  showTextLabels?: boolean;
  showShareButton?: boolean;
};

export default function CardActions({
  carTitle,
  viewHref,
  showViewButton = true,
  showTextLabels = false,
  showShareButton = false,
}: CardActionsProps) {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isCompared, setIsCompared] = useState(false);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {showViewButton && (
        <a
          href={viewHref}
          className="inline-flex h-10 items-center justify-center rounded-lg bg-slate-900 px-4 text-sm font-semibold text-white transition hover:bg-slate-700"
        >
          View Car
        </a>
      )}
      <button
        type="button"
        onClick={() => setIsWishlisted((value) => !value)}
        aria-label={`Add ${carTitle} to wishlist`}
        className={`inline-flex h-10 items-center justify-center rounded-lg border transition ${
          isWishlisted
            ? "border-slate-900 bg-slate-900 text-white"
            : "border-slate-300 text-slate-700 hover:border-slate-500 hover:bg-slate-100"
        } ${showTextLabels ? "gap-1.5 px-2.5 text-xs font-medium" : "w-10 text-base"}`}
      >
        <Heart className={`h-5 w-5 ${isWishlisted ? "fill-current" : ""}`} strokeWidth={2} />
        {showTextLabels && <span>Add to wishlist</span>}
      </button>
      <button
        type="button"
        onClick={() => setIsCompared((value) => !value)}
        aria-label={`Add ${carTitle} to compare`}
        className={`inline-flex h-10 items-center justify-center rounded-lg border transition ${
          isCompared
            ? "border-slate-900 bg-slate-900 text-white"
            : "border-slate-300 text-slate-700 hover:border-slate-500 hover:bg-slate-100"
        } ${showTextLabels ? "gap-1.5 px-2.5 text-xs font-medium" : "w-10 text-base"}`}
      >
        <GitCompareArrows className="h-5 w-5" strokeWidth={2} />
        {showTextLabels && <span>Add to compare</span>}
      </button>
      {showShareButton && (
        <button
          type="button"
          aria-label={`Share ${carTitle}`}
          className={`inline-flex h-10 items-center justify-center rounded-lg border transition border-slate-300 text-slate-700 hover:border-slate-500 hover:bg-slate-100 ${
            showTextLabels ? "gap-1.5 px-2.5 text-xs font-medium" : "w-10 text-base"
          }`}
        >
          <Share2 className="h-5 w-5" strokeWidth={2} />
          {showTextLabels && <span>Share</span>}
        </button>
      )}
    </div>
  );
}
