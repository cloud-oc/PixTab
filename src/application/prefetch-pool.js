export class PrefetchPool {
  #current = null;
  #items = [];
  #knownIds = new Set();
  #jobs = new Set();
  #generation = 0;
  #persistTimer = null;
  #persistTask = Promise.resolve();
  #deepFillTimer = null;
  #deepFillActive = false;

  constructor({
    capacity = 8,
    eagerCapacity = 4,
    concurrency = 3,
    backgroundDelayMs = 1500,
    persistDelayMs = 250,
    maxPersistBytes = 7_000_000,
    sessionStore,
    cacheKey = "artworkQueueCache",
    setTimer = setTimeout,
    clearTimer = clearTimeout
  }) {
    this.capacity = capacity;
    this.eagerCapacity = Math.min(eagerCapacity, capacity);
    this.concurrency = concurrency;
    this.backgroundDelayMs = backgroundDelayMs;
    this.persistDelayMs = persistDelayMs;
    this.maxPersistBytes = maxPersistBytes;
    this.sessionStore = sessionStore;
    this.cacheKey = cacheKey;
    // Browser timer functions are Web IDL methods in some extension contexts.
    // Calling a stored native function as `this.setTimer()` changes its receiver
    // and can throw `TypeError: Illegal invocation` in Chrome service workers.
    this.setTimer = (...args) => setTimer(...args);
    this.clearTimer = (...args) => clearTimer(...args);
    this.producer = null;
  }

  async restore() {
    const state = await this.sessionStore.get({ [this.cacheKey]: null });
    this.#current = state[this.cacheKey]?.current || null;
    const items = state[this.cacheKey]?.items;
    this.#items = [];
    this.#knownIds.clear();
    if (this.#current) this.#remember(this.#current);
    for (const item of Array.isArray(items) ? items : []) {
      if (this.#items.length >= this.capacity || this.#isDuplicate(item)) continue;
      this.#items.push(item);
      this.#remember(item);
    }
  }

  invalidate() {
    this.#generation += 1;
    this.producer = null;
    this.#current = null;
    this.#items = [];
    this.#knownIds.clear();
    this.#cancelDeepFill();
    this.#schedulePersist();
  }

  attachProducer(producer) {
    this.producer = producer;
    this.refill();
  }

  async take({ advance = true } = {}) {
    if (!advance && this.#current) return this.#current;
    let value = this.#items.shift() || null;
    if (value) this.#forget(value);
    while (!value && this.#jobs.size) {
      await Promise.race(this.#jobs);
      value = this.#items.shift() || null;
      if (value) this.#forget(value);
    }
    if (!value) value = await this.producer?.();
    if (!advance && value) {
      this.#current = value;
      this.#remember(value);
    }
    this.#schedulePersist();
    this.#deepFillActive = false;
    this.refill();
    return value || null;
  }

  refill() {
    if (!this.producer) return;
    const target = this.#deepFillActive ? this.capacity : this.eagerCapacity;
    const concurrency = this.#items.length ? this.concurrency : 1;
    while (this.#jobs.size < concurrency && this.#items.length + this.#jobs.size < target) {
      const generation = this.#generation;
      const producer = this.producer;
      let accepted = false;
      let job;
      job = Promise.resolve()
        .then(() => producer())
        .then((value) => {
          if (value && generation === this.#generation && this.#items.length < this.capacity && !this.#isDuplicate(value)) {
            this.#items.push(value);
            this.#remember(value);
            accepted = true;
            this.#schedulePersist();
          }
        })
        .catch(() => undefined)
        .finally(() => {
          this.#jobs.delete(job);
          if (generation !== this.#generation || accepted) this.refill();
        });
      this.#jobs.add(job);
    }
    const queued = this.#items.length + this.#jobs.size;
    if (!this.#deepFillActive && queued >= this.eagerCapacity && queued < this.capacity) this.#scheduleDeepFill();
    if (this.#deepFillActive && queued >= this.capacity) this.#deepFillActive = false;
  }

  snapshot() {
    return { capacity: this.capacity, current: this.#current, items: [...this.#items] };
  }

  async flushPersistence() {
    if (this.#persistTimer) {
      this.clearTimer(this.#persistTimer);
      this.#persistTimer = null;
    }
    await this.#persist();
  }

  #scheduleDeepFill() {
    if (this.#deepFillTimer) return;
    this.#deepFillTimer = this.setTimer(() => {
      this.#deepFillTimer = null;
      this.#deepFillActive = true;
      this.refill();
    }, this.backgroundDelayMs);
  }

  #cancelDeepFill() {
    if (this.#deepFillTimer) this.clearTimer(this.#deepFillTimer);
    this.#deepFillTimer = null;
    this.#deepFillActive = false;
  }

  #schedulePersist() {
    if (this.#persistTimer) return;
    this.#persistTimer = this.setTimer(() => {
      this.#persistTimer = null;
      void this.#persist();
    }, this.persistDelayMs);
  }

  async #persist() {
    const snapshot = this.#persistentSnapshot();
    this.#persistTask = this.#persistTask
      .catch(() => undefined)
      .then(() => this.#writeSnapshot(snapshot));
    await this.#persistTask;
  }

  async #writeSnapshot(snapshot) {
    try {
      await Promise.resolve(this.sessionStore.set({ [this.cacheKey]: snapshot }));
    } catch {
      if (snapshot.items.length < 2) return;
      const reduced = { ...snapshot, items: snapshot.items.slice(0, Math.ceil(snapshot.items.length / 2)) };
      await Promise.resolve(this.sessionStore.set({ [this.cacheKey]: reduced })).catch(() => undefined);
    }
  }

  #persistentSnapshot() {
    const items = [];
    let bytes = 64;
    let current = null;
    if (this.#current) {
      const currentBytes = this.#estimateItemBytes(this.#current);
      if (bytes + currentBytes <= this.maxPersistBytes) {
        current = this.#current;
        bytes += currentBytes;
      }
    }
    for (const item of this.#items) {
      const itemBytes = this.#estimateItemBytes(item);
      if (bytes + itemBytes > this.maxPersistBytes) break;
      items.push(item);
      bytes += itemBytes;
    }
    return { capacity: this.capacity, current, items };
  }

  #estimateItemBytes(item) {
    const image = typeof item?.imageObjectUrl === "string" ? item.imageObjectUrl : "";
    const avatar = typeof item?.profileImageUrl === "string" ? item.profileImageUrl : "";
    const metadata = { ...item };
    if (typeof item?.imageObjectUrl === "string") metadata.imageObjectUrl = "";
    if (typeof item?.profileImageUrl === "string") metadata.profileImageUrl = "";
    return (JSON.stringify(metadata).length + image.length + avatar.length) * 2;
  }

  #identity(item) {
    return item?.illustId == null ? null : String(item.illustId);
  }

  #isDuplicate(item) {
    const id = this.#identity(item);
    return id ? this.#knownIds.has(id) : false;
  }

  #remember(item) {
    const id = this.#identity(item);
    if (id) this.#knownIds.add(id);
  }

  #forget(item) {
    const id = this.#identity(item);
    if (id) this.#knownIds.delete(id);
  }
}
