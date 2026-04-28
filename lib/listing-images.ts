type JsonLikeObject = Record<string, unknown>;

function isJsonObject(value: unknown): value is JsonLikeObject {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function getImageUrlsFromFeatures(features: unknown): string[] {
  if (!isJsonObject(features)) return [];
  const raw = features.imageUrls;
  if (!Array.isArray(raw)) return [];
  return raw.filter((item): item is string => typeof item === "string" && item.length > 0);
}

