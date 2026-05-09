export function getListingReference(id: string) {
  let hash = 0;

  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  }

  const code = hash.toString(36).toUpperCase().padStart(7, "0").slice(-7);
  return `MTV-${code}`;
}
