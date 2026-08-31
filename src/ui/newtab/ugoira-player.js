import { unzipSync } from "../../shared/fflate.module.js";

export class UgoiraPlayer {
  #cache = new Map();

  constructor({ doc = document, runtime, fetchAction, cacheLimit = 2 }) {
    this.doc = doc;
    this.runtime = runtime;
    this.fetchAction = fetchAction;
    this.frames = [];
    this.index = 0;
    this.playing = false;
    this.token = 0;
    this.animationFrame = null;
    this.canvas = null;
    this.context = null;
    this.cacheLimit = cacheLimit;
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
    this.frames = [];
    this.index = 0;
    if (!payload?.zipUrl || !payload.frames?.length) return;
    try {
      this.frames = await this.#decode(payload);
      await Promise.all(this.frames.slice(0, 1).map(({ image }) => this.#waitForImage(image)));
      this.play();
      this.#setButtonAvailable(true);
    } catch (error) {
      console.warn("Ugoira playback unavailable", error);
      this.#setButtonAvailable(false);
    }
  }

  stop() {
    this.token += 1;
    if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
    this.animationFrame = null;
    this.playing = false;
    this.#renderButton();
    if (this.canvas && this.context) {
      this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.canvas.style.display = "none";
    }
    this.doc.getElementById("backgroundImage")?.classList.remove("animating");
    this.doc.getElementById("foregroundImage")?.classList.remove("animating");
  }

  pause() {
    this.token += 1;
    if (this.animationFrame) cancelAnimationFrame(this.animationFrame);
    this.animationFrame = null;
    this.playing = false;
    this.#renderButton();
  }

  play() {
    if (!this.frames.length) return;
    this.playing = true;
    this.#renderButton();
    const canvas = this.#getCanvas();
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
      if (elapsed >= delay && this.frames[(this.index + 1) % this.frames.length].image.complete) {
        elapsed %= delay;
        this.index = (this.index + 1) % this.frames.length;
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
    for (const frames of this.#cache.values()) this.#releaseFrames(frames);
    this.#cache.clear();
    this.frames = [];
    this.canvas?.remove();
    this.canvas = null;
    this.context = null;
  }

  async #decode(payload) {
    if (this.#cache.has(payload.zipUrl)) {
      const cached = this.#cache.get(payload.zipUrl);
      this.#cache.delete(payload.zipUrl);
      this.#cache.set(payload.zipUrl, cached);
      return cached;
    }
    const dataUrl = await this.runtime.send(
      { action: this.fetchAction, url: payload.zipUrl },
      { timeout: 30_000, retries: 3 }
    );
    if (!dataUrl) throw new Error("UGOIRA_DOWNLOAD_FAILED");
    const binary = atob(dataUrl.split(",")[1]);
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
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
    while (this.#cache.size >= this.cacheLimit) {
      const oldestKey = this.#cache.keys().next().value;
      this.#releaseFrames(this.#cache.get(oldestKey));
      this.#cache.delete(oldestKey);
    }
    this.#cache.set(payload.zipUrl, frames);
    return frames;
  }

  #waitForImage(image) {
    if (image.complete) return Promise.resolve();
    return new Promise((resolve) => {
      image.addEventListener("load", resolve, { once: true });
      image.addEventListener("error", resolve, { once: true });
    });
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
    this.context.filter = "blur(18px)";
    this.context.drawImage(image, cover.x, cover.y, cover.width, cover.height);
    this.context.filter = "none";
    this.context.drawImage(image, contain.x, contain.y, contain.width, contain.height);
    return true;
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
