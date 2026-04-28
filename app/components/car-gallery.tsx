"use client";

import { useState } from "react";

type CarGalleryProps = {
  photos: string[];
  title: string;
  containerClassName?: string;
  frameClassName?: string;
  imageClassName?: string;
  showThumbnails?: boolean;
};

export default function CarGallery({
  photos,
  title,
  containerClassName,
  frameClassName,
  imageClassName,
  showThumbnails = false,
}: CarGalleryProps) {
  const frameClasses = frameClassName ?? "rounded-t-xl rounded-b-none";
  const [index, setIndex] = useState(0);

  const hasPhotos = photos.length > 0;
  const currentPhoto = hasPhotos ? photos[index] : "";

  function showPrev() {
    if (!hasPhotos) return;
    setIndex((prev) => (prev === 0 ? photos.length - 1 : prev - 1));
  }

  function showNext() {
    if (!hasPhotos) return;
    setIndex((prev) => (prev === photos.length - 1 ? 0 : prev + 1));
  }

  return (
    <div className={containerClassName ?? ""}>
      <div
        className={`relative overflow-hidden bg-slate-200 ${frameClasses}`}
      >
        {hasPhotos ? (
          <img
            src={currentPhoto}
            alt={`${title} photo ${index + 1}`}
            className={`h-52 w-full object-cover ${imageClassName ?? ""}`}
            loading="lazy"
          />
        ) : (
          <div className="flex h-52 items-center justify-center text-sm text-slate-500">
            No photo
          </div>
        )}

        {hasPhotos && photos.length > 1 && (
          <>
            <button
              type="button"
              onClick={showPrev}
              aria-label="Previous photo"
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 px-3 py-2 text-white hover:bg-black/80"
            >
              ←
            </button>
            <button
              type="button"
              onClick={showNext}
              aria-label="Next photo"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 px-3 py-2 text-white hover:bg-black/80"
            >
              →
            </button>
            <div className="absolute bottom-2 right-2 rounded bg-black/60 px-2 py-1 text-xs text-white">
              {index + 1}/{photos.length}
            </div>
          </>
        )}

        {!showThumbnails && hasPhotos && photos.length > 1 && (
          <div className="absolute bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/45 px-2 py-1">
            {photos.map((_, photoIndex) => (
              <button
                key={photoIndex}
                type="button"
                onClick={() => setIndex(photoIndex)}
                aria-label={`Show photo ${photoIndex + 1}`}
                className={`h-2.5 w-2.5 rounded-full transition ${
                  photoIndex === index ? "bg-white" : "bg-white/50 hover:bg-white/80"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {showThumbnails && hasPhotos && photos.length > 1 && (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {photos.map((photo, photoIndex) => (
            <button
              key={photoIndex}
              type="button"
              onClick={() => setIndex(photoIndex)}
              aria-label={`Open thumbnail ${photoIndex + 1}`}
              className={`shrink-0 overflow-hidden rounded-lg border-2 transition ${
                photoIndex === index
                  ? "border-slate-900"
                  : "border-transparent hover:border-slate-400"
              }`}
            >
              <img
                src={photo}
                alt={`${title} thumbnail ${photoIndex + 1}`}
                className="h-16 w-24 object-cover"
                loading="lazy"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
