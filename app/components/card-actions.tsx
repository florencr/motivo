"use client";

import { useState } from "react";

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
    <div className="flex items-center gap-3">
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
        className={`inline-flex h-10 items-center justify-center rounded-lg border text-sm font-medium transition ${
          isWishlisted
            ? "border-slate-900 bg-slate-900 text-white"
            : "border-slate-300 text-slate-700 hover:border-slate-500 hover:bg-slate-100"
        } ${showTextLabels ? "gap-2 px-3" : "w-10 text-lg"}`}
      >
        <span>{isWishlisted ? "♥" : "♡"}</span>
        {showTextLabels && <span>Add to wishlist</span>}
      </button>
      <button
        type="button"
        onClick={() => setIsCompared((value) => !value)}
        aria-label={`Add ${carTitle} to compare`}
        className={`inline-flex h-10 items-center justify-center rounded-lg border text-sm font-medium transition ${
          isCompared
            ? "border-slate-900 bg-slate-900 text-white"
            : "border-slate-300 text-slate-700 hover:border-slate-500 hover:bg-slate-100"
        } ${showTextLabels ? "gap-2 px-3" : "w-10 text-base"}`}
      >
        <span>⇄</span>
        {showTextLabels && <span>Add to compare</span>}
      </button>
      {showShareButton && (
        <button
          type="button"
          aria-label={`Share ${carTitle}`}
          className={`inline-flex h-10 items-center justify-center rounded-lg border text-sm font-medium transition border-slate-300 text-slate-700 hover:border-slate-500 hover:bg-slate-100 ${
            showTextLabels ? "gap-2 px-3" : "w-10 text-base"
          }`}
        >
          <span>↗</span>
          {showTextLabels && <span>Share</span>}
        </button>
      )}
    </div>
  );
}
