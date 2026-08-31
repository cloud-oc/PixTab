import { describe, expect, it, vi } from "vitest";
import { ArtworkAssembler } from "../src/application/artwork-assembler.js";
import { defaultPreferences } from "../src/domain/preferences.js";

const candidate = {
  detail: {
    illustId: "42",
    illustType: 2,
    userId: "7",
    userName: "Artist",
    title: "Animation",
    urls: { regular: "https://i.pximg.net/preview.jpg" },
    width: 800,
    height: 800,
    xRestrict: 0,
    aiType: 0
  }
};

describe("ArtworkAssembler", () => {
  it("rejects an Ugoira candidate when its playback metadata is unavailable", async () => {
    const client = {
      image: vi.fn(async () => new Blob(["image"], { type: "image/jpeg" })),
      ugoira: vi.fn(async () => null)
    };

    const artwork = await new ArtworkAssembler(client).assemble(candidate, {
      ...defaultPreferences,
      type: "ugoira",
      aiType: null
    });

    expect(artwork).toBeNull();
    expect(client.ugoira).toHaveBeenCalledWith("42");
  });
});
