const CARET_ICON = `
  <svg class="custom-select__icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z" transform="scale(0.09375)" />
  </svg>`;

export class CustomSelect {
  static active = null;

  constructor(select, { observe = true } = {}) {
    this.select = select;
    this.doc = select.ownerDocument;
    this.typeahead = "";
    this.typeaheadTimer = null;
    this.wrapper = this.doc.createElement("div");
    this.wrapper.className = "custom-select";
    this.wrapper.dataset.selectId = select.id;
    this.button = this.doc.createElement("button");
    this.button.type = "button";
    this.button.className = "custom-select__button";
    this.button.id = `${select.id}CustomButton`;
    this.button.setAttribute("role", "combobox");
    this.button.setAttribute("aria-haspopup", "listbox");
    this.button.setAttribute("aria-expanded", "false");
    this.value = this.doc.createElement("span");
    this.value.className = "custom-select__value";
    this.list = this.doc.createElement("div");
    this.list.className = "custom-select__list";
    this.list.id = `${select.id}CustomList`;
    this.list.setAttribute("role", "listbox");
    this.list.hidden = true;
    this.button.setAttribute("aria-controls", this.list.id);
    this.button.append(this.value);
    this.button.insertAdjacentHTML("beforeend", CARET_ICON);
    select.after(this.wrapper);
    this.wrapper.append(this.button, this.list);
    select.classList.add("custom-select__native");
    select.tabIndex = -1;
    select.setAttribute("aria-hidden", "true");
    this.#bind();
    this.refresh();
    if (observe) {
      this.observer = new MutationObserver(() => this.refresh());
      this.observer.observe(select, { subtree: true, childList: true, characterData: true, attributes: true });
    }
  }

  refresh() {
    const selected = this.select.selectedOptions[0] || this.select.options[0];
    this.value.textContent = selected?.textContent || "";
    this.button.disabled = this.select.disabled;
    this.button.setAttribute("aria-labelledby", this.#labelledBy());
    this.list.replaceChildren(...Array.from(this.select.options, (option, index) => {
      const item = this.doc.createElement("button");
      item.type = "button";
      item.className = "custom-select__option";
      item.id = `${this.select.id}CustomOption${index}`;
      item.dataset.value = option.value;
      item.textContent = option.textContent;
      item.disabled = option.disabled;
      item.setAttribute("role", "option");
      item.setAttribute("aria-selected", String(option.value === this.select.value));
      item.tabIndex = -1;
      return item;
    }));
  }

  open() {
    if (this.button.disabled || !this.list.hidden) return;
    CustomSelect.active?.close();
    CustomSelect.active = this;
    this.list.hidden = false;
    this.button.setAttribute("aria-expanded", "true");
    this.wrapper.classList.add("open");
    this.#placeList();
    this.#focusOption(this.select.selectedIndex < 0 ? 0 : this.select.selectedIndex);
  }

  close({ restoreFocus = false } = {}) {
    if (this.list.hidden) return;
    this.list.hidden = true;
    this.button.setAttribute("aria-expanded", "false");
    this.button.removeAttribute("aria-activedescendant");
    this.wrapper.classList.remove("open", "drop-up");
    if (CustomSelect.active === this) CustomSelect.active = null;
    if (restoreFocus) this.button.focus({ preventScroll: true });
  }

  #bind() {
    this.button.addEventListener("click", () => this.list.hidden ? this.open() : this.close({ restoreFocus: true }));
    this.button.addEventListener("keydown", (event) => this.#onKeydown(event));
    this.list.addEventListener("click", (event) => {
      const option = event.target.closest(".custom-select__option");
      if (!option || option.disabled) return;
      this.#select(option.dataset.value);
    });
    this.select.addEventListener("change", () => {
      this.refresh();
      this.close();
    });
    this.select.addEventListener("focus", () => this.button.focus());
  }

  #onKeydown(event) {
    const options = this.#enabledOptions();
    const current = this.list.querySelector('[role="option"][data-active="true"]');
    let index = Math.max(0, options.indexOf(current));
    if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
      event.preventDefault();
      if (this.list.hidden) this.open();
      if (event.key === "ArrowDown") index = Math.min(options.length - 1, index + 1);
      if (event.key === "ArrowUp") index = Math.max(0, index - 1);
      if (event.key === "Home") index = 0;
      if (event.key === "End") index = options.length - 1;
      this.#focusElement(options[index]);
      return;
    }
    if ((event.key === "Enter" || event.key === " ") && !this.list.hidden) {
      event.preventDefault();
      if (current) this.#select(current.dataset.value);
      return;
    }
    if (event.key === "Escape") {
      event.preventDefault();
      this.close({ restoreFocus: true });
      return;
    }
    if (event.key === "Tab") {
      this.close();
      return;
    }
    if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) this.#typeToSelect(event.key);
  }

  #select(value) {
    if (this.select.value !== value) {
      this.select.value = value;
      this.select.dispatchEvent(new Event("change", { bubbles: true }));
    } else {
      this.refresh();
      this.close();
    }
    this.button.focus({ preventScroll: true });
  }

  #focusOption(index) {
    this.#focusElement(this.#enabledOptions()[index]);
  }

  #focusElement(option) {
    if (!option) return;
    this.list.querySelectorAll("[data-active]").forEach((item) => item.removeAttribute("data-active"));
    option.dataset.active = "true";
    this.button.setAttribute("aria-activedescendant", option.id);
    option.scrollIntoView?.({ block: "nearest" });
  }

  #enabledOptions() {
    return Array.from(this.list.querySelectorAll(".custom-select__option:not(:disabled)"));
  }

  #typeToSelect(character) {
    clearTimeout(this.typeaheadTimer);
    this.typeahead += character.toLocaleLowerCase();
    const match = this.#enabledOptions().find((option) => option.textContent.trim().toLocaleLowerCase().startsWith(this.typeahead));
    if (match) {
      if (this.list.hidden) this.open();
      this.#focusElement(match);
    }
    this.typeaheadTimer = setTimeout(() => { this.typeahead = ""; }, 600);
  }

  #placeList() {
    this.wrapper.classList.remove("drop-up");
    const rect = this.button.getBoundingClientRect();
    const listHeight = Math.min(this.list.scrollHeight, 240);
    const spaceBelow = window.innerHeight - rect.bottom;
    if (spaceBelow < listHeight + 12 && rect.top > spaceBelow) this.wrapper.classList.add("drop-up");
  }

  #labelledBy() {
    const label = this.select.labels?.[0];
    if (label && !label.id) label.id = `${this.select.id}Label`;
    return label ? `${label.id} ${this.button.id}` : this.button.id;
  }
}

export class CustomSelectManager {
  constructor(doc = document) {
    this.doc = doc;
    this.controls = [];
  }

  initialize() {
    this.controls = Array.from(
      this.doc.querySelectorAll("select:not(.custom-select__native)"),
      (select) => new CustomSelect(select, { observe: false })
    );
    this.doc.addEventListener("pointerdown", (event) => {
      const active = CustomSelect.active;
      if (active && !active.wrapper.contains(event.target)) active.close();
    });
  }

  refresh() {
    this.controls.forEach((control) => control.refresh());
  }
}
