import { unzipSync } from "../../shared/fflate.module.js";
import { storageLocalGet } from "../../shared/browser-api.js";
import { safeCallable } from "../../shared/callable.js";

export class UgoiraPlayer {
  constructor({ doc = document, fetchImpl = fetch, storageGet = storageLocalGet }) {
    this.doc = doc;
    this.fetchImpl = safeCallable(fetchImpl);
    this.storageGet = storageGet;
    this.frames = [];
    this.index = 0;
    this.playing = false;
    this.token = 0;
    this.animationFrame = null;
    this.canvas = null;
    this.context = null;
    this.resizeCanvas = () => {
      if (!this.canvas) return;
      const bounds = this.doc.body.getBoundingClientRect();
      this.canvas.width = bounds.width || window.innerWidth;
      this.canvas.height = bounds.height || window.innerHeight;
    };
  }

  bind() {
    this.doc.getElementById("playPauseButton")?.addEventListener("click", (event) => {
      event.stopPropagation();
      this.toggle();
    });
    this.doc.getElementById("container")?.addEventListener("click", () => {
      if (this.frames.length) this.toggle();
    });
    window.addEventListener("resize", this.resizeCanvas, { passive: true });
  }

  async load(payload) {
    this.stop();
    if (!payload?.zipUrl || !payload.frames?.length) return;
    const loadToken = this.token;
    let frames = [];
    try {
      frames = await this.#decode(payload);
      if (loadToken !== this.token) return this.#releaseFrames(frames);
      await this.#waitForImage(frames[0].image);
      if (loadToken !== this.token) return this.#releaseFrames(frames);
      this.frames = frames;
      this.play();
      this.#setButtonAvailable(true);
    } catch (error) {
      this.#releaseFrames(frames);
      if (loadToken !== this.token) return;
      this.frames = [];
      console.warn("Ugoira playback unavailable", error);
      this.#setButtonAvailable(false);
    }
  }

  stop() {
    this.token += 1;
    if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
    this.animationFrame = null;
    this.playing = false;
    this.#setButtonAvailable(false);
    if (this.canvas) {
      this.context?.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.canvas.style.display = "none";
    }
    this.doc.getElementById("backgroundImage")?.classList.remove("animating");
    this.doc.getElementById("foregroundImage")?.classList.remove("animating");
    this.#releaseFrames(this.frames);
    this.frames = [];
    this.index = 0;
  }

  pause() {
    this.token += 1;
    if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
    this.animationFrame = null;
    this.playing = false;
    this.#renderButton();
  }

  play() {
    if (!this.frames.length || this.playing) return;
    const canvas = this.#getCanvas();
    if (!this.context) throw new Error("UGOIRA_CANVAS_UNAVAILABLE");
    this.playing = true;
    this.#renderButton();
    canvas.style.display = "block";
    const bounds = this.doc.body.getBoundingClientRect();
    canvas.width = bounds.width || window.innerWidth;
    canvas.height = bounds.height || window.innerHeight;
    const token = this.token;
    let previous = performance.now();
    let elapsed = 0;

    const animate = (timestamp) => {
      if (!this.playing || token !== this.token) return;
      elapsed += timestamp - previous;
      previous = timestamp;
      const frame = this.frames[this.index];
      const delay = Math.max(1, Number(frame.delay) || 60);
      if (elapsed >= delay) {
        const nextIndex = this.#nextDrawableIndex();
        if (nextIndex != null) {
          elapsed %= delay;
          this.index = nextIndex;
        }
      }
      if (this.#draw(this.frames[this.index].image)) {
        this.doc.getElementById("backgroundImage")?.classList.add("animating");
        this.doc.getElementById("foregroundImage")?.classList.add("animating");
      }
      this.animationFrame = requestAnimationFrame(animate);
    };
    this.animationFrame = requestAnimationFrame(animate);
  }

  toggle() {
    if (this.playing) this.pause();
    else this.play();
  }

  destroy() {
    this.stop();
    window.removeEventListener("resize", this.resizeCanvas);
    this.canvas?.remove();
    this.canvas = null;
    this.context = null;
  }

  async #decode(payload) {
    const bytes = await this.#downloadArchive(payload.zipUrl);
    const archive = unzipSync(bytes);
    const frames = payload.frames.flatMap(({ file, delay }) => {
      const contents = archive[file];
      if (!contents) return [];
      const url = URL.createObjectURL(new Blob([contents], { type: payload.mimeType || "image/jpeg" }));
      const image = new Image();
      image.src = url;
      image.decode?.().catch(() => undefined);
      return [{ image, url, delay: delay || 60 }];
    });
    if (!frames.length) throw new Error("UGOIRA_EMPTY_ARCHIVE");
    return frames;
  }

  async #downloadArchive(url) {
    const preferences = await this.storageGet({ reverseProxyDomain: "" }).catch(() => ({}));
    const domain = String(preferences.reverseProxyDomain || "").trim();
    const proxied = domain && url.includes("i.pximg.net") ? url.replace("i.pximg.net", domain) : null;
    const candidates = [...new Set([proxied, url].filter(Boolean))];
    for (const candidate of candidates) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(new DOMException("UGOIRA_TIMEOUT", "TimeoutError")), 90_000);
      try {
        const response = await this.fetchImpl(candidate, { signal: controller.signal });
        if (!response.ok) continue;
        const buffer = await response.arrayBuffer();
        if (buffer.byteLength) return new Uint8Array(buffer);
      } catch {
        // A configured mirror may be unavailable; retry the original Pixiv URL.
      } finally {
        clearTimeout(timer);
      }
    }
    throw new Error("UGOIRA_DOWNLOAD_FAILED");
  }

  #waitForImage(image) {
    if (image.complete) {
      return image.naturalWidth ? Promise.resolve() : Promise.reject(new Error("UGOIRA_FRAME_DECODE_FAILED"));
    }
    return new Promise((resolve, reject) => {
      image.addEventListener("load", resolve, { once: true });
      image.addEventListener("error", () => reject(new Error("UGOIRA_FRAME_DECODE_FAILED")), { once: true });
    });
  }

  #nextDrawableIndex() {
    for (let offset = 1; offset <= this.frames.length; offset += 1) {
      const index = (this.index + offset) % this.frames.length;
      const image = this.frames[index].image;
      if (!image.complete) return null;
      if (image.naturalWidth) return index;
    }
    return null;
  }

  #getCanvas() {
    if (this.canvas) return this.canvas;
    this.canvas = this.doc.createElement("canvas");
    this.canvas.id = "ugoiraCanvas";
    Object.assign(this.canvas.style, {
      position: "fixed", inset: "0", width: "100%", height: "100%",
      objectFit: "contain", zIndex: "0", pointerEvents: "none"
    });
    (this.doc.getElementById("container") || this.doc.body).appendChild(this.canvas);
    this.context = this.canvas.getContext("2d");
    return this.canvas;
  }

  #releaseFrames(frames = []) {
    for (const frame of frames) URL.revokeObjectURL(frame.url);
  }

  #draw(image) {
    if (!image?.complete || !image.naturalWidth || !this.context) return false;
    const width = this.canvas.width;
    const height = this.canvas.height;
    const imageRatio = image.naturalWidth / image.naturalHeight;
    const canvasRatio = width / height;
    const cover = imageRatio > canvasRatio
      ? { width: height * imageRatio, height, x: (width - height * imageRatio) / 2, y: 0 }
      : { width, height: width / imageRatio, x: 0, y: (height - width / imageRatio) / 2 };
    const contain = imageRatio > canvasRatio
      ? { width, height: width / imageRatio, x: 0, y: (height - width / imageRatio) / 2 }
      : { width: height * imageRatio, height, x: (width - height * imageRatio) / 2, y: 0 };
    try {
      this.context.filter = "blur(18px)";
      this.context.drawImage(image, cover.x, cover.y, cover.width, cover.height);
      this.context.filter = "none";
      this.context.drawImage(image, contain.x, contain.y, contain.width, contain.height);
      return true;
    } catch {
      this.context.filter = "none";
      return false;
    }
  }

  #renderButton() {
    const button = this.doc.getElementById("playPauseButton");
    const path = button?.querySelector("path");
    path?.setAttribute("d", this.playing
      ? "M200,32H160a16,16,0,0,0-16,16V208a16,16,0,0,0,16,16h40a16,16,0,0,0,16-16V48A16,16,0,0,0,200,32Zm0,176H160V48h40ZM96,32H56A16,16,0,0,0,40,48V208a16,16,0,0,0,16,16H96a16,16,0,0,0,16-16V48A16,16,0,0,0,96,32Zm0,176H56V48H96Z"
      : "M232.4,114.49,88.32,26.35a16,16,0,0,0-16.2-.3A15.86,15.86,0,0,0,64,39.87V216.13A15.94,15.94,0,0,0,80,232a16.07,16.07,0,0,0,8.36-2.35L232.4,141.51a15.81,15.81,0,0,0,0-27ZM80,215.94V40l143.83,88Z");
    button?.classList.toggle("playing", this.playing);
    button?.classList.toggle("paused", !this.playing);
  }

  #setButtonAvailable(available) {
    const button = this.doc.getElementById("playPauseButton");
    if (!available) button?.classList.add("hidden");
    else {
      button?.classList.remove("hidden");
      this.#renderButton();
    }
  }
}
