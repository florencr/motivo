"use client";

import Image from "next/image";
import { useState } from "react";

type CarGalleryProps = {
  photos: string[];
  title: string;
  containerClassName?: string;
  frameClassName?: string;
  imageClassName?: string;
  showThumbnails?: boolean;
  /** Used as `sizes` for next/image. Defaults to a generic responsive value. */
  sizes?: string;
  /** Mark the gallery's first image as LCP-priority. */
  priorityFirstPhoto?: boolean;
};

export default function CarGallery({
  photos,
  title,
  containerClassName,
  frameClassName,
  imageClassName,
  showThumbnails = false,
  sizes = "(max-width: 1024px) 100vw, 720px",
  priorityFirstPhoto = false,
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
        className={`relative w-full overflow-hidden bg-slate-200 ${frameClasses} ${imageClassName ?? "h-52"}`}
      >
        {hasPhotos ? (
          <Image
            key={currentPhoto}
            src={currentPhoto}
            alt={`Foto e ${title} nr. ${index + 1}`}
            fill
            sizes={sizes}
            className="object-cover"
            priority={priorityFirstPhoto && index === 0}
            unoptimized={!currentPhoto.startsWith("/")}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-slate-500">
            Pa foto
          </div>
        )}

        {hasPhotos && photos.length > 1 && (
          <>
            <button
              type="button"
              onClick={showPrev}
              aria-label="Foto e mëparshme"
              className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/60 px-3 py-2 text-white hover:bg-black/80"
            >
              ←
            </button>
            <button
              type="button"
              onClick={showNext}
              aria-label="Foto tjetër"
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
                aria-label={`Shfaq foton ${photoIndex + 1}`}
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
              aria-label={`Hap miniaturën ${photoIndex + 1}`}
              className={`relative shrink-0 overflow-hidden rounded-lg border-2 transition ${
                photoIndex === index
                  ? "border-slate-900"
                  : "border-transparent hover:border-slate-400"
              }`}
            >
              <Image
                src={photo}
                alt={`Miniatura e ${title} nr. ${photoIndex + 1}`}
                width={96}
                height={64}
                className="h-16 w-24 object-cover"
                unoptimized={!photo.startsWith("/")}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
