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

export function getSelectedTagsFromFeatures(features: unknown): string[] {
  if (!isJsonObject(features)) return [];
  const candidates = [features.selectedTags, features.tags];
  for (const raw of candidates) {
    if (Array.isArray(raw)) {
      const tags = raw.filter((item): item is string => typeof item === "string" && item.length > 0);
      if (tags.length > 0) return tags;
    }
    if (typeof raw === "string" && raw.trim().length > 0) {
      return raw
        .split(",")
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
    }
  }
  return [];
}

export function getFeatureListFromFeatures(features: unknown): string[] {
  if (!isJsonObject(features)) return [];
  const raw = features.features;
  if (Array.isArray(raw)) {
    return raw.filter((item): item is string => typeof item === "string" && item.length > 0);
  }
  if (typeof raw === "string" && raw.trim().length > 0) {
    return raw
      .split(",")
      .map((item) => item.trim())
      .filter((item) => item.length > 0);
  }
  return [];
}

