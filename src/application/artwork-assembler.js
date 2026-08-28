import {
  acceptsArtwork,
  createArtworkDto,
  createUgoiraDto,
  normalizeArtworkType,
  preferredImageUrl,
  profileImageUrl
} from "../domain/artwork.js";
import { blobToDataUrl } from "../infrastructure/network/download-manager.js";

export class ArtworkAssembler {
  constructor(client) {
    this.client = client;
  }

  async assemble(candidate, preferences) {
    const detail = candidate?.detail;
    if (!detail || !acceptsArtwork(detail, preferences)) return null;
    const imageUrl = preferredImageUrl(detail);
    if (!imageUrl) return null;

    const avatarUrl = profileImageUrl(detail, candidate.profileUrl);
    const metadataRequest = normalizeArtworkType(detail.illustType ?? detail.type) === "ugoira"
      ? this.client.ugoira(detail.illustId)
      : Promise.resolve(null);
    const [imageBlob, avatarBlob, metadata] = await Promise.all([
      this.client.image(imageUrl),
      avatarUrl ? this.client.image(avatarUrl) : Promise.resolve(null),
      metadataRequest
    ]);
    if (!imageBlob) return null;

    const imageData = await blobToDataUrl(imageBlob);
    let avatarData = avatarUrl || "";
    if (avatarBlob) {
      try {
        avatarData = await blobToDataUrl(avatarBlob);
      } catch {
        avatarData = avatarUrl || "";
      }
    }
    return createArtworkDto(detail, imageData, avatarData, createUgoiraDto(metadata?.body));
  }
}
