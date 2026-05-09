"use client";

import { useState } from "react";

type ExpandableTextProps = {
  text: string;
  className?: string;
  collapsedLines?: number;
  moreLabel?: string;
  lessLabel?: string;
};

export default function ExpandableText({
  text,
  className = "mt-1 text-sm text-slate-600",
  collapsedLines = 3,
  moreLabel = "Lexo më shumë",
  lessLabel = "Shfaq më pak",
}: ExpandableTextProps) {
  const [expanded, setExpanded] = useState(false);

  if (!text || !text.trim()) return null;

  const trimmed = text.trim();
  const isLong = trimmed.length > 180 || trimmed.split("\n").length > collapsedLines;

  if (!isLong) {
    return <p className={className}>{trimmed}</p>;
  }

  return (
    <div>
      <p
        className={className}
        style={
          expanded
            ? undefined
            : {
                display: "-webkit-box",
                WebkitLineClamp: collapsedLines,
                WebkitBoxOrient: "vertical",
                overflow: "hidden",
              }
        }
      >
        {trimmed}
      </p>
      <button
        type="button"
        onClick={() => setExpanded((prev) => !prev)}
        className="mt-1 text-xs font-semibold text-slate-700 underline hover:text-slate-900"
      >
        {expanded ? lessLabel : moreLabel}
      </button>
    </div>
  );
}
