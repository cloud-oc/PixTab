const numericArtworkTypes = Object.freeze({ 0: "illust", 1: "manga", 2: "ugoira" });

export function normalizeArtworkType(value) {
  return numericArtworkTypes[value] ?? value ?? null;
}

export function acceptsArtwork(detail, preferences) {
  if (preferences.aiType && detail.aiType != null && Number(detail.aiType) !== Number(preferences.aiType)) return false;
  const bookmarks = detail.bookmarkCount ?? detail.bookmarkCountPublic ?? null;
  if (preferences.blt != null && bookmarks != null && bookmarks < preferences.blt) return false;
  if (preferences.bgt != null && bookmarks != null && bookmarks > preferences.bgt) return false;
  if (preferences.mode === "safe" && detail.xRestrict !== 0) return false;
  if (preferences.mode === "r18" && detail.xRestrict !== 1) return false;

  const actualType = normalizeArtworkType(detail.illustType ?? detail.type);
  const requestedType = preferences.type;
  if (requestedType && requestedType !== "all" && actualType) {
    const accepted = requestedType === "illust_and_ugoira"
      ? actualType === "illust" || actualType === "ugoira"
      : actualType === requestedType;
    if (!accepted) return false;
  }
  if (preferences.minWidthPx != null && (!detail.width || detail.width < preferences.minWidthPx)) return false;
  if (preferences.minHeightPx != null && (!detail.height || detail.height < preferences.minHeightPx)) return false;
  return true;
}

export function preferredImageUrl(detail) {
  return detail.urls?.regular ?? detail.urls?.small ?? detail.urls?.thumb ?? null;
}

export function profileImageUrl(detail, fallback = null) {
  return fallback ?? detail.userIllusts?.[detail.illustId]?.url ?? detail.profileImageUrl ?? null;
}

export function createArtworkDto(detail, imageDataUrl, avatarDataUrl, ugoira = null) {
  const dto = {
    userName: detail.userName,
    userId: detail.userId,
    userIdUrl: `https://www.pixiv.net/users/${detail.userId}`,
    illustId: detail.illustId,
    illustIdUrl: `https://www.pixiv.net/artworks/${detail.illustId}`,
    title: detail.title,
    imageObjectUrl: imageDataUrl,
    profileImageUrl: avatarDataUrl || ""
  };
  if (ugoira) dto.ugoira = ugoira;
  return dto;
}

export function createUgoiraDto(metadata) {
  if (!metadata?.frames?.length) return null;
  const zipUrl = metadata.originalSrc ?? metadata.src ?? metadata.zip_urls?.medium ?? null;
  if (!zipUrl) return null;
  return {
    zipUrl,
    mimeType: metadata.mime_type || "image/jpeg",
    frames: metadata.frames.map(({ file, delay }) => ({ file, delay }))
  };
}
