/**
 * Hide Icons Vault – main.mjs – v1.0.0
 */

const MODULE_ID   = "hide-icons-vault";
const SETTING_HID = "hiddenData";
const SETTING_POS = "vaultPosition";
const SETTING_TABS_ENABLED = "tabVaultEnabled";
const SETTING_TABS_HID     = "hiddenTabs";
const SETTING_BADGE_STYLE  = "badgeStyle";
const SETTING_BADGE_COLOR  = "badgeColor";

let _fullControlsCache = [];
let _fullTabsCache     = []; // { name, icon, label }

/* ── Helpers ─────────────────────────────────────────────────────────────── */

function toArray(c) {
  if (!c) return [];
  if (Array.isArray(c)) return c;
  if (typeof c.contents !== "undefined") return Array.from(c.contents);
  if (typeof c.values === "function")    return Array.from(c.values());
  return Object.values(c);
}

const getActiveControlName = () => ui.controls?.control?.name ?? null;
const getActiveToolName    = () => ui.controls?.tool?.name    ?? null;

function getHidden() {
  try { return game.settings.get(MODULE_ID, SETTING_HID) ?? { layers: [], tools: [] }; }
  catch { return { layers: [], tools: [] }; }
}
const saveHidden = (data) => game.settings.set(MODULE_ID, SETTING_HID, data);

async function activateRobust(controlName, toolName) {
  try {
    await ui.controls?.activate({ control: controlName, tool: toolName });
    if (getActiveControlName() === controlName &&
        (!toolName || getActiveToolName() === toolName)) return;
  } catch { /* fallback */ }
  const layerBtn = document.querySelector(
    `#scene-controls-layers button[data-control="${CSS.escape(controlName)}"]`
  );
  if (layerBtn) {
    layerBtn.click();
    if (toolName) setTimeout(() => {
      document.querySelector(`#scene-controls-tools button[data-tool="${CSS.escape(toolName)}"]`)?.click();
    }, 35);
  } else {
    ui.controls?.activate({ control: controlName, tool: toolName })
      .catch(() => ui.controls?.render({ controls: controlName, tool: toolName }));
  }
  setTimeout(() => {
    if (getActiveControlName() === controlName && (!toolName || getActiveToolName() === toolName)) return;
    document.querySelector(`#scene-controls-layers button[data-control="${CSS.escape(controlName)}"]`)?.click();
  }, 80);
}

async function sanitizeHiddenData() {
  if (!_fullControlsCache.length) return;
  const validLayers = new Set(_fullControlsCache.map(c => c.name));
  const validTools  = new Set(_fullControlsCache.flatMap(c => c.tools.map(t => `${c.name}::${t.name}`)));
  const hidden = getHidden();
  const newL = hidden.layers.filter(l => validLayers.has(l.name));
  const newT = hidden.tools .filter(t => validTools .has(`${t.controlName}::${t.name}`));
  if (newL.length !== hidden.layers.length || newT.length !== hidden.tools.length)
    await saveHidden({ layers: newL, tools: newT });
}

/* ── Instructions dialog ─────────────────────────────────────────────────── */

function instructionsHTML() {
  return `<div class="hiv-instructions">
    <div class="hiv-instr-section">
      <p><strong>Hide Icons Vault</strong> has two independent vaults:
      the <strong>Layers Control Vault</strong> (left bar) and the
      <strong>Sidebar Tab Vault</strong> (right bar, enable in Module Settings).
      All settings are per-client — no effect on other users.</p>
    </div>

    <div class="hiv-instr-section">
      <div class="hiv-instr-heading"><i class="fas fa-map"></i> Layers Control Vault</div>
      <ul>
        <li><strong>Drag</strong> any layer or tool icon onto the vault button (🔒) in the Layers Control bar to hide it.</li>
        <li>Hiding a <em>layer</em> removes it and all its tools from the bar.</li>
        <li><strong>Click</strong> a hidden layer to activate it. Hover to see its tools in a side sub-panel.</li>
        <li>Hidden <em>tools</em> are grouped by layer — click the layer icon to expand/collapse.</li>
        <li><strong>Right-click</strong> any icon to restore it. Or drag it back to the bar.</li>
      </ul>
    </div>

    <div class="hiv-instr-section">
      <div class="hiv-instr-heading"><i class="fas fa-th-list"></i> Sidebar Tab Vault</div>
      <ul>
        <li>Enable in <strong>Module Settings → Enable Sidebar Tab Vault</strong>.</li>
        <li><strong>Drag</strong> any sidebar tab onto the vault button (🔒) in the sidebar tabs bar.</li>
        <li><strong>Click</strong> a hidden tab to <em>activate</em> it — it stays hidden in the bar.</li>
        <li><strong>Right-click</strong> or <strong>drag out</strong> to restore a tab to the sidebar bar.</li>
      </ul>
    </div>

    <div class="hiv-instr-section">
      <div class="hiv-instr-heading"><i class="fas fa-undo"></i> Restoring</div>
      <ul>
        <li>Use <strong>↺</strong> in either vault panel header to restore all icons from that vault.</li>
        <li><strong>Reset All Hidden Icons</strong> in Module Settings resets the Layers Control Vault.</li>
      </ul>
    </div>

    <div class="hiv-instr-section">
      <div class="hiv-instr-heading"><i class="fas fa-circle"></i> Badge Style</div>
      <ul>
        <li><strong>Count</strong> — shows the number of hidden items (default).</li>
        <li><strong>Dot</strong> — shows a small dot when the vault has items, without a number.</li>
        <li><strong>Color</strong> — tints the vault icon with a custom color. Use the color picker in settings to choose your color.</li>
        <li><strong>None</strong> — no visual indicator on the vault button.</li>
      </ul>
      <p>The same badge style applies to both the Layers Control Vault and the Sidebar Tab Vault.</p>
    </div>

    <div class="hiv-instr-footer">
      <p>Both vaults are independent. Resetting one does not affect the other.</p>
    </div>
  </div>`;
}

class HIVInstructionsMenu extends foundry.applications.api.ApplicationV2 {
  static DEFAULT_OPTIONS = { id: "hiv-instructions-menu", window: { title: "Hide Icons Vault — Instructions" } };
  async _renderHTML() { return ""; }
  async render() { showInstructions(); }
}

async function showInstructions() {
  await foundry.applications.api.DialogV2.wait({
    window:  { title: "Hide Icons Vault — Instructions" },
    classes: ["hiv-dialog"],
    content: instructionsHTML(),
    buttons: [{ action: "close", label: "Close", icon: "fas fa-times", default: true }],
  });
}

/* ── Reset dialog ────────────────────────────────────────────────────────── */

class HIVResetMenu extends foundry.applications.api.ApplicationV2 {
  static DEFAULT_OPTIONS = { id: "hiv-reset-menu", window: { title: "Hide Icons Vault — Reset" } };
  async _renderHTML() { return ""; }
  async render() { showResetDialog(); }
}

async function showResetDialog() {
  const yes = await foundry.applications.api.DialogV2.confirm({
    window:  { title: "Hide Icons Vault — Reset" },
    classes: ["hiv-dialog"],
    content: `<div class="hiv-reset-dialog">
      <div class="hiv-reset-icon"><i class="fas fa-triangle-exclamation"></i></div>
      <div class="hiv-reset-title">Restore all hidden icons?</div>
      <div class="hiv-reset-body">
        Every icon currently stored in the Vault will be
        <strong>returned to its original position</strong> in the Scene Controls bar.
      </div>
      <div class="hiv-reset-hint">
        This only affects your client — other users keep their own vault settings.
        You will need to hide icons again manually if you change your mind.
      </div>
    </div>`,
    yes: { label: "Restore All Icons", icon: "fas fa-undo" },
    no:  { label: "Cancel", icon: "fas fa-times", default: true },
  });
  if (yes) {
    await saveHidden({ layers: [], tools: [] });
    ui.controls?.render();
    ui.notifications?.info("Hide Icons Vault: all icons restored.");
  }
}

/* ── Badge helper — shared by Vault and TabVault ─────────────────────────── */

function applyBadge(btn, badgeEl, hasItems) {
  const style = (() => {
    try { return game.settings.get(MODULE_ID, SETTING_BADGE_STYLE); } catch { return "count"; }
  })();
  const color = (() => {
    try { return game.settings.get(MODULE_ID, SETTING_BADGE_COLOR); } catch { return "#e45f2b"; }
  })();

  // Remove all badge-related state first
  btn.classList.remove("hiv-badge-color-mode");
  btn.style.removeProperty("--hiv-badge-color");
  btn.closest("li")?.classList.toggle("hiv-has-items", hasItems);

  if (!hasItems) {
    if (badgeEl) badgeEl.textContent = "";
    btn.closest("li")?.classList.remove("hiv-has-items");
    return;
  }

  if (style === "none") {
    if (badgeEl) badgeEl.textContent = "";
    btn.closest("li")?.classList.remove("hiv-has-items");
  } else if (style === "dot") {
    if (badgeEl) badgeEl.textContent = "•";
  } else if (style === "color") {
    if (badgeEl) badgeEl.textContent = "";
    btn.closest("li")?.classList.remove("hiv-has-items");
    btn.classList.add("hiv-badge-color-mode");
    btn.style.setProperty("--hiv-badge-color", color);
  } else {
    // "count" (default)
    if (badgeEl) {
      const count = parseInt(badgeEl.dataset.count ?? "0");
      badgeEl.textContent = String(count);
    }
  }
}

/* ── Settings + patch ────────────────────────────────────────────────────── */

Hooks.once("init", () => {

  game.settings.registerMenu(MODULE_ID, "instructions", {
    name:       "Instructions",
    label:      "Open Instructions",
    hint:       "How to hide, restore and manage icons in the Vault.",
    icon:       "fas fa-book",
    type:       HIVInstructionsMenu,
    restricted: false,
  });

  game.settings.registerMenu(MODULE_ID, "resetAll", {
    name:       "Reset — Restore All Hidden Icons",
    label:      "Reset All Hidden Icons",
    hint:       "Immediately restore every hidden icon back to the controls bar.",
    icon:       "fas fa-undo",
    type:       HIVResetMenu,
    restricted: false,
  });

  game.settings.register(MODULE_ID, SETTING_HID, {
    scope: "client", config: false, type: Object, default: { layers: [], tools: [] }
  });

  game.settings.register(MODULE_ID, SETTING_POS, {
    name:  "HIV.Settings.VaultPosition",
    hint:  "HIV.Settings.VaultPositionHint",
    scope: "client", config: true, type: String,
    choices: { top: "HIV.Settings.VaultPositionTop", bottom: "HIV.Settings.VaultPositionBottom" },
    default: "bottom",
    onChange: () => ui.controls?.render()
  });

  game.settings.register(MODULE_ID, SETTING_BADGE_STYLE, {
    name:  "HIV.Settings.BadgeStyle",
    hint:  "HIV.Settings.BadgeStyleHint",
    scope: "client", config: true, type: String,
    choices: {
      count: "HIV.Settings.BadgeStyleCount",
      dot:   "HIV.Settings.BadgeStyleDot",
      color: "HIV.Settings.BadgeStyleColor",
      none:  "HIV.Settings.BadgeStyleNone",
    },
    default: "count",
    onChange: () => { Vault._updateBadge(); TabVault._updateBadge(); }
  });

  game.settings.register(MODULE_ID, SETTING_BADGE_COLOR, {
    name:  "HIV.Settings.BadgeColor",
    hint:  "HIV.Settings.BadgeColorHint",
    scope: "client", config: true, type: String, default: "#e45f2b",
    onChange: () => { Vault._updateBadge(); TabVault._updateBadge(); }
  });

  game.settings.register(MODULE_ID, SETTING_TABS_ENABLED, {
    name:  "HIV.Settings.TabVaultEnabled",
    hint:  "HIV.Settings.TabVaultEnabledHint",
    scope: "client", config: true, type: Boolean, default: false,
    onChange: (v) => { if (v) TabVault.init(); else TabVault.destroy(); }
  });

  game.settings.register(MODULE_ID, SETTING_TABS_HID, {
    scope: "client", config: false, type: Array, default: []
  });

  /* ── _prepareContext wrapper ─────────────────────────────────────────── */
  const filterFn = function(wrapped, ...args) {
    const result = wrapped(...args);
    const applyFilter = (data) => {
      if (!data) return data;
      const hidden      = getHidden();
      const rawControls = toArray(data.controls);

      _fullControlsCache = rawControls.map(ctrl => ({
        name:  ctrl.name,
        title: ctrl.title ?? ctrl.tooltip ?? ctrl.label ?? ctrl.name,
        icon:  ctrl.icon  ?? "",
        tools: toArray(ctrl.tools).map(t => ({
          name: t?.name, title: t?.title ?? t?.tooltip ?? t?.label ?? t?.name,
          icon: t?.icon ?? "", controlName: ctrl.name
        }))
      }));

      if (!hidden.layers.length && !hidden.tools.length) return data;

      const filteredControls = rawControls
        .filter(ctrl => !hidden.layers.some(l => l.name === ctrl.name))
        .map(ctrl => {
          const hiddenTools = hidden.tools.filter(ht => ht.controlName === ctrl.name);
          if (!hiddenTools.length) return ctrl;
          const copy = Object.create(Object.getPrototypeOf(ctrl));
          Object.assign(copy, ctrl);
          const orig    = ctrl.tools;
          const isArr   = Array.isArray(orig);
          const hasCont = typeof orig?.contents !== "undefined";
          const hasVals = typeof orig?.values   === "function";
          const arr     = toArray(orig).filter(t => !hiddenTools.some(ht => ht.name === t?.name));
          if (copy.activeTool && hiddenTools.some(ht => ht.name === copy.activeTool))
            copy.activeTool = arr[0]?.name ?? "";
          if (isArr) {
            copy.tools = arr;
          } else if (hasCont || hasVals) {
            try {
              const Coll = orig?.constructor;
              if (Coll) {
                const coll = new Coll(); let used = false;
                for (const t of arr) { if (typeof coll.set === "function") { coll.set(t.name, t); used = true; } }
                copy.tools = used ? coll : arr;
              } else { copy.tools = new Map(arr.map(t => [t.name, t])); }
            } catch { copy.tools = new Map(arr.map(t => [t.name, t])); }
          } else {
            const keep = new Set(arr.map(t => t?.name));
            copy.tools = Object.fromEntries(Object.entries(orig ?? {}).filter(([k,v]) => keep.has(v?.name ?? k)));
          }
          return copy;
        });

      const activeControlName = getActiveControlName() ?? filteredControls?.[0]?.name ?? rawControls?.[0]?.name;
      let filteredTools = toArray(data.tools);
      if (filteredTools.length) {
        const hiddenForActive = hidden.tools.filter(ht => ht.controlName === activeControlName);
        if (hiddenForActive.length) {
          const hide = new Set(hiddenForActive.map(ht => ht.name));
          filteredTools = filteredTools.filter(t => !hide.has(t?.name));
        }
      }

      sanitizeHiddenData().catch(() => {});
      return { ...data, controls: filteredControls, tools: filteredTools };
    };
    if (result?.then) return result.then(applyFilter);
    return applyFilter(result);
  };

  let patched = false;
  if (typeof libWrapper !== "undefined" && libWrapper?.is_fallback !== true) {
    try {
      libWrapper.register(MODULE_ID,
        "foundry.applications.ui.SceneControls.prototype._prepareContext", filterFn, "WRAPPER");
      patched = true;
      console.log(`[${MODULE_ID}] libWrapper patch OK`);
    } catch(e) { console.warn(`[${MODULE_ID}] libWrapper failed:`, e?.message ?? e); }
  }
  if (!patched) {
    const Sc = foundry?.applications?.ui?.SceneControls;
    if (Sc?.prototype?._prepareContext) {
      const orig = Sc.prototype._prepareContext;
      Sc.prototype._prepareContext = function(...args) { return filterFn.call(this, orig.bind(this), ...args); };
      console.log(`[${MODULE_ID}] Manual patch OK`);
    }
  }
  console.log(`[${MODULE_ID}] v1.0.0 init OK`);
});

/* ── Vault UI ─────────────────────────────────────────────────────────────── */

const Vault = {
  _dragData: null,

  init() {
    Hooks.on("renderSceneControls", (_app, html) => this._onRender(html));

    const mo = new MutationObserver(() => {
      const layers = document.getElementById("scene-controls-layers");
      if (!layers) return;
      if (!layers.querySelector(".hiv-vault-btn")) this._onRender(layers.closest("#scene-controls") ?? document);
      if (document.querySelector(".hiv-vault-btn")) mo.disconnect();
    });
    mo.observe(document.body, { childList: true, subtree: true });

    document.addEventListener("pointerdown", (e) => {
      const panel = document.getElementById("hiv-panel");
      const sub   = document.getElementById("hiv-sub-panel");
      const btn   = document.querySelector(".hiv-vault-btn");
      const inPanel = panel?.contains(e.target);
      const inSub   = sub?.contains(e.target);
      const inBtn   = btn?.contains(e.target);
      // Close sub-panel if clicking outside both panels
      if (sub?.classList.contains("hiv-open") && !inSub && !inPanel && !inBtn) {
        this._closeSubPanel();
      }
      // Close main panel if clicking outside everything
      if (panel?.classList.contains("hiv-open") && !inPanel && !inSub && !inBtn) {
        this._closePanel();
      }
    }, true);

    document.addEventListener("drop", (e) => {
      const d = this._dragData;
      if (!d || (d.type !== "restore-layer" && d.type !== "restore-tool")) return;
      if (!e.target.closest?.(".hiv-vault-li")) {
        e.preventDefault(); e.stopPropagation();
        if (d.type === "restore-layer") this._restoreLayer(d.name);
        else this._restoreTool(d.controlName, d.name);
      }
    }, true);

    console.log(`[${MODULE_ID}] Vault ready`);
  },

  _onRender(html) {
    const root = html instanceof HTMLElement ? html : (html[0] ?? html);
    if (!root) return;
    const sc = root.id === "scene-controls" ? root
      : root.querySelector("#scene-controls") ?? root.closest("#scene-controls") ?? root;
    sc.querySelectorAll(".hiv-vault-li").forEach(el => el.remove());
    this._makeDraggable(sc);
    this._injectVaultButton(sc);
    this._ensurePanels();
    this._updateBadge();
    if (document.getElementById("hiv-panel")?.classList.contains("hiv-open"))
      this._populatePanel(document.getElementById("hiv-panel"));
  },

  _makeDraggable(sc) {
    sc.querySelectorAll("#scene-controls-layers li").forEach(li => {
      if (li.classList.contains("hiv-vault-li")) return;
      const btn = li.querySelector("button[data-control]");
      const controlName = btn?.dataset.control;
      if (!controlName) return;
      li.setAttribute("draggable", "true");
      if (li._hivDS) li.removeEventListener("dragstart", li._hivDS);
      if (li._hivDE) li.removeEventListener("dragend",   li._hivDE);
      li._hivDS = (e) => this._dragStart(e, { type: "layer", name: controlName });
      li._hivDE = (e) => this._dragEnd(e);
      li.addEventListener("dragstart", li._hivDS);
      li.addEventListener("dragend",   li._hivDE);
    });
    const activeControl = getActiveControlName();
    sc.querySelectorAll("#scene-controls-tools li").forEach(li => {
      const btn = li.querySelector("button[data-tool]") ?? li.querySelector("button[data-action='tool']");
      const toolName = btn?.dataset.tool ?? btn?.getAttribute?.("data-tool");
      if (!toolName || !activeControl) return;
      li.setAttribute("draggable", "true");
      if (li._hivDS) li.removeEventListener("dragstart", li._hivDS);
      if (li._hivDE) li.removeEventListener("dragend",   li._hivDE);
      li._hivDS = (e) => this._dragStart(e, { type: "tool", name: toolName, controlName: activeControl });
      li._hivDE = (e) => this._dragEnd(e);
      li.addEventListener("dragstart", li._hivDS);
      li.addEventListener("dragend",   li._hivDE);
    });
  },

  _injectVaultButton(sc) {
    const layersList = sc.querySelector("#scene-controls-layers");
    if (!layersList) return;
    const label = game.i18n.localize("HIV.VaultTooltip");
    const li  = document.createElement("li");
    li.className = "hiv-vault-li";
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "control ui-control layer icon fa-solid fa-vault hiv-vault-btn";
    btn.dataset.tooltip = label;
    btn.setAttribute("aria-label", label); btn.setAttribute("aria-expanded", "false"); btn.setAttribute("role", "button");
    btn.dataset.action = "hiv-vault-toggle";
    queueMicrotask(() => {
      const c = getComputedStyle(btn, "::before").content;
      if (!c || c === "none" || c === '""') { btn.classList.remove("fa-vault"); btn.classList.add("fa-lock"); }
    });
    const badge = document.createElement("span"); badge.className = "hiv-badge";
    btn.appendChild(badge); li.appendChild(btn);
    li.addEventListener("dragover", (e) => {
      const d = this._dragData;
      if (d?.type === "layer" || d?.type === "tool") {
        e.preventDefault(); e.stopPropagation(); e.dataTransfer.dropEffect = "move";
        btn.classList.add("hiv-drag-over");
      }
    });
    li.addEventListener("dragleave", (e) => { if (!li.contains(e.relatedTarget)) btn.classList.remove("hiv-drag-over"); });
    li.addEventListener("drop", (e) => {
      e.preventDefault(); e.stopPropagation(); btn.classList.remove("hiv-drag-over");
      const d = this._dragData; if (d?.type === "layer" || d?.type === "tool") this._hide(d);
    });
    btn.addEventListener("click", (e) => { e.stopPropagation(); this._togglePanel(li); });
    const position = game.settings.get(MODULE_ID, SETTING_POS);
    if (position === "top") layersList.insertBefore(li, layersList.firstChild);
    else layersList.appendChild(li);

    const scRoot  = sc.matches?.("#scene-controls") ? sc : sc.querySelector?.("#scene-controls") ?? sc;
    const aside   = sc.closest?.("aside") ?? sc.parentElement?.closest?.("aside");
    const targets = [scRoot, scRoot.querySelector?.("#scene-controls-layers"),
                     scRoot.querySelector?.("#scene-controls-tools"), aside].filter(Boolean);
    for (const tgt of targets) {
      if (tgt._hivRestore) continue; tgt._hivRestore = true;
      tgt.addEventListener("dragover", (e) => {
        const d = this._dragData;
        if (!d || (d.type !== "restore-layer" && d.type !== "restore-tool")) return;
        if (e.target.closest?.(".hiv-vault-li")) return;
        e.preventDefault(); e.stopPropagation(); e.dataTransfer.dropEffect = "move";
      }, true);
      tgt.addEventListener("drop", async (e) => {
        const d = this._dragData;
        if (!d || (d.type !== "restore-layer" && d.type !== "restore-tool")) return;
        if (e.target.closest?.(".hiv-vault-li")) return;
        e.preventDefault(); e.stopPropagation();
        if (d.type === "restore-layer") await this._restoreLayer(d.name);
        else await this._restoreTool(d.controlName, d.name);
      }, true);
    }
  },

  _ensurePanels() {
    if (!document.getElementById("hiv-panel")) { const el = document.createElement("div"); el.id = "hiv-panel"; document.body.appendChild(el); }
    if (!document.getElementById("hiv-sub-panel")) { const el = document.createElement("div"); el.id = "hiv-sub-panel"; document.body.appendChild(el); }
  },

  _togglePanel(anchor) {
    const panel = document.getElementById("hiv-panel");
    if (!panel) return;
    if (panel.classList.contains("hiv-open")) this._closePanel(); else this._openPanel(anchor);
  },
  _openPanel(anchor) {
    const panel = document.getElementById("hiv-panel"); if (!panel) return;
    this._populatePanel(panel); this._positionNextTo(panel, anchor);
    panel.classList.add("hiv-open"); document.querySelector(".hiv-vault-btn")?.setAttribute("aria-expanded", "true");
  },
  _closePanel() {
    document.getElementById("hiv-panel")?.classList.remove("hiv-open");
    document.querySelector(".hiv-vault-btn")?.setAttribute("aria-expanded", "false");
    this._closeSubPanel();
  },
  _closeSubPanel() { document.getElementById("hiv-sub-panel")?.classList.remove("hiv-open"); },
  _refreshPanel() {
    const panel = document.getElementById("hiv-panel");
    if (panel?.classList.contains("hiv-open")) this._populatePanel(panel);
  },
  _positionNextTo(el, anchor) {
    const ar = anchor.getBoundingClientRect();
    el.style.cssText = `position:fixed; left:${ar.right + 6}px; top:${ar.top}px; right:auto; bottom:auto;`;
    requestAnimationFrame(() => {
      const eh = el.offsetHeight, wh = window.innerHeight;
      if (ar.top + eh > wh - 8) el.style.top = `${Math.max(8, wh - eh - 8)}px`;
    });
  },

  _populatePanel(panel) {
    panel.innerHTML = "";
    const hidden  = getHidden();
    const all = _fullControlsCache.length > 0 ? _fullControlsCache
      : toArray(ui.controls?.controls).map(c => ({
          name: c.name, title: c.title ?? c.name, icon: c.icon ?? "",
          tools: toArray(c.tools).map(t => ({ name: t.name, title: t.title ?? t.name, icon: t.icon ?? "", controlName: c.name }))
        }));

    // Header — ↺  spacer  ✕
    const header = document.createElement("div"); header.className = "hiv-panel-header";
    const resetBtn = document.createElement("button"); resetBtn.type = "button";
    resetBtn.className = "hiv-panel-btn hiv-panel-btn--reset"; resetBtn.innerHTML = "↺";
    resetBtn.title = game.i18n.localize("HIV.Settings.ResetHidden");
    resetBtn.addEventListener("click", async (e) => { e.stopPropagation(); showResetDialog(); });
    header.appendChild(resetBtn);
    const spacer = document.createElement("div"); spacer.className = "hiv-header-spacer";
    header.appendChild(spacer);
    const closeBtn = document.createElement("button"); closeBtn.type = "button";
    closeBtn.className = "hiv-panel-btn hiv-panel-btn--close"; closeBtn.innerHTML = "✕"; closeBtn.title = "Close";
    closeBtn.addEventListener("click", (e) => { e.stopPropagation(); this._closePanel(); });
    header.appendChild(closeBtn);
    panel.appendChild(header);

    const hasL = hidden.layers.length > 0;
    const hasT = hidden.tools.length  > 0;
    if (!hasL && !hasT) {
      const msg = document.createElement("div"); msg.className = "hiv-empty-msg";
      msg.textContent = game.i18n.localize("HIV.VaultEmpty"); panel.appendChild(msg); return;
    }

    // Layers ocultos
    if (hasL) {
      for (const entry of hidden.layers) {
        const ctrl = all.find(c => c.name === entry.name);
        if (ctrl) panel.appendChild(this._makeLayerItem(ctrl));
      }
    }

    // Thin divider between layers and tool-groups (only when both sections present)
    if (hasL && hasT) {
      const div = document.createElement("div");
      div.className = "hiv-section-divider";
      panel.appendChild(div);
    }

    // Tools ocultas — agrupadas por layer pai, abre sub-painel lateral (igual hidden layers)
    if (hasT) {
      const groups = new Map();
      // Preserve cache order
      for (const c of all) {
        const toolsForCtrl = hidden.tools.filter(t => t.controlName === c.name);
        if (toolsForCtrl.length) groups.set(c.name, { ctrl: c, entries: toolsForCtrl });
      }
      for (const [, { ctrl: parentCtrl, entries: toolEntries }] of groups) {
        const localTitle = game.i18n.localize(parentCtrl.title);
        const displayTitle = (localTitle && localTitle !== parentCtrl.title) ? localTitle : (parentCtrl.title ?? "");

        // Build the tool list for the sub-panel (only hidden tools of this layer)
        const hiddenToolsForGroup = toolEntries
          .map(e => parentCtrl.tools.find(t => t.name === e.name))
          .filter(Boolean);

        // Item button — looks exactly like a layer item, opens sub-panel on click/hover
        const div = document.createElement("div");
        div.className = "hiv-vault-item hiv-is-toolgroup";
        div.setAttribute("data-tooltip", displayTitle);
        div.setAttribute("aria-label", displayTitle);
        this._appendIcon(div, parentCtrl);

        // Click opens sub-panel with only the hidden tools of this group
        div.addEventListener("click", (e) => {
          e.stopPropagation();
          this._openSubPanel(div, { name: parentCtrl.name, tools: hiddenToolsForGroup });
        });
        div.addEventListener("mouseenter", () => {
          this._openSubPanel(div, { name: parentCtrl.name, tools: hiddenToolsForGroup });
        });
        div.addEventListener("contextmenu", (e) => { e.preventDefault(); e.stopPropagation(); });
        panel.appendChild(div);
      }
    }
  },

  _sectionLabel(key) {
    const d = document.createElement("div"); d.className = "hiv-section-label";
    d.textContent = game.i18n.localize(key); return d;
  },

  _toolGroupHeader(ctrl) {
    const div = document.createElement("div"); div.className = "hiv-tool-group-header";
    const iconWrap = document.createElement("span"); iconWrap.className = "hiv-tool-group-icon";
    this._appendIcon(iconWrap, ctrl); div.appendChild(iconWrap);
    const name = document.createElement("span"); name.className = "hiv-tool-group-name";
    name.textContent = ctrl.title; div.appendChild(name);
    return div;
  },

  _makeLayerItem(ctrl) {
    const localTitle = game.i18n.localize(ctrl.title);
    const displayTitle = (localTitle && localTitle !== ctrl.title) ? localTitle : (ctrl.title ?? "");
    const div = document.createElement("div");
    div.className = "hiv-vault-item hiv-is-layer";
    div.setAttribute("draggable", "true");
    div.setAttribute("data-tooltip", displayTitle);
    div.setAttribute("aria-label", displayTitle);
    if (getActiveControlName() === ctrl.name) div.classList.add("hiv-active");
    this._appendIcon(div, ctrl);
    // Click: activate layer AND open sub-panel
    div.addEventListener("click", (e) => {
      e.stopPropagation();
      activateRobust(ctrl.name);
      this._openSubPanel(div, ctrl);
    });
    // Hover opens sub-panel — no auto-close on mouseleave
    div.addEventListener("mouseenter", () => this._openSubPanel(div, ctrl));
    div.addEventListener("dragstart",   (e) => this._dragStart(e, { type: "restore-layer", name: ctrl.name }));
    div.addEventListener("dragend",     (e) => this._dragEnd(e));
    div.addEventListener("contextmenu", async (e) => { e.preventDefault(); e.stopPropagation(); await this._restoreLayer(ctrl.name); });
    return div;
  },

  _makeToolItem(tool, controlName) {
    const div = document.createElement("div");
    div.className = "hiv-vault-item"; div.setAttribute("draggable", "true");
    div.setAttribute("data-tooltip", tool.title); div.setAttribute("aria-label", tool.title);
    if (getActiveControlName() === controlName && getActiveToolName() === tool.name) div.classList.add("hiv-active");
    this._appendIcon(div, tool);
    div.addEventListener("click",       (e) => { e.stopPropagation(); activateRobust(controlName, tool.name); });
    div.addEventListener("dragstart",   (e) => this._dragStart(e, { type: "restore-tool", name: tool.name, controlName }));
    div.addEventListener("dragend",     (e) => this._dragEnd(e));
    div.addEventListener("contextmenu", async (e) => { e.preventDefault(); e.stopPropagation(); await this._restoreTool(controlName, tool.name); });
    return div;
  },

  _openSubPanel(anchor, ctrl) {
    const sub = document.getElementById("hiv-sub-panel"); const panel = document.getElementById("hiv-panel");
    if (!sub) return; sub.innerHTML = "";
    const tools = ctrl?.tools ?? []; if (!tools.length) { sub.classList.remove("hiv-open"); return; }
    // Sub-panel header with close button
    const subHeader = document.createElement("div");
    subHeader.className = "hiv-sub-header";
    const subClose = document.createElement("button");
    subClose.type = "button"; subClose.className = "hiv-panel-btn hiv-panel-btn--close";
    subClose.innerHTML = "✕"; subClose.title = "Close";
    subClose.addEventListener("click", (e) => { e.stopPropagation(); this._closeSubPanel(); });
    subHeader.appendChild(subClose);
    sub.appendChild(subHeader);

    for (const tool of tools) {
      const localToolTitle = game.i18n.localize(tool.title);
      const displayToolTitle = (localToolTitle && localToolTitle !== tool.title) ? localToolTitle : (tool.title ?? "");
      const item = document.createElement("div"); item.className = "hiv-vault-item";
      item.setAttribute("draggable", "true");
      item.setAttribute("data-tooltip", displayToolTitle); item.setAttribute("aria-label", displayToolTitle);
      this._appendIcon(item, tool);
      if (getActiveControlName() === ctrl.name && getActiveToolName() === tool.name) item.classList.add("hiv-active");
      item.addEventListener("click", (e) => { e.stopPropagation(); activateRobust(ctrl.name, tool.name); });
      item.addEventListener("dragstart", (e) => this._dragStart(e, { type: "restore-tool", name: tool.name, controlName: ctrl.name }));
      item.addEventListener("dragend",   (e) => this._dragEnd(e));
      item.addEventListener("contextmenu", async (e) => { e.preventDefault(); e.stopPropagation(); await this._restoreTool(ctrl.name, tool.name); });
      sub.appendChild(item);
    }
    const pr = panel?.getBoundingClientRect() ?? anchor.getBoundingClientRect(); const ar = anchor.getBoundingClientRect();
    sub.style.cssText = `position:fixed; left:${pr.right + 6}px; top:${ar.top}px; right:auto; bottom:auto;`;
    requestAnimationFrame(() => { const sh = sub.offsetHeight, wh = window.innerHeight; if (ar.top + sh > wh - 8) sub.style.top = `${Math.max(8, wh - sh - 8)}px`; });
    sub.classList.add("hiv-open");
    // Sub-panel stays open until user clicks X or outside — no auto-close on mouseleave
  },

  _appendIcon(el, data) {
    const icon = data.icon ?? "";
    if (!icon) { el.insertAdjacentHTML("beforeend", '<i class="fa-solid fa-circle-question"></i>'); return; }
    if (icon.trim().startsWith("<")) { el.insertAdjacentHTML("beforeend", icon); return; }
    if (/\.(svg|png|webp|jpg)/i.test(icon)) { const img = document.createElement("img"); img.src = icon; img.alt = ""; el.appendChild(img); return; }
    const i = document.createElement("i"); i.className = icon.includes("fa-") ? icon : `fas ${icon}`; el.appendChild(i);
  },

  _updateBadge() {
    const btn = document.querySelector(".hiv-vault-btn"); if (!btn) return;
    const { layers, tools } = getHidden();
    const count = (layers?.length ?? 0) + (tools?.length ?? 0);
    const badge = btn.querySelector(".hiv-badge");
    if (badge) badge.dataset.count = String(count);
    applyBadge(btn, badge, count > 0);
  },

  _dragStart(e, payload) {
    this._dragData = payload;
    try { e.dataTransfer.setData("application/json", JSON.stringify(payload)); e.dataTransfer.setData("text/plain", JSON.stringify(payload)); } catch {}
    e.dataTransfer.effectAllowed = "move";
    document.querySelector(".hiv-vault-btn")?.classList.add("hiv-drag-over");
    e.currentTarget.classList.add("hiv-drag-ghost");
  },
  _dragEnd(e) {
    this._dragData = null;
    document.querySelector(".hiv-vault-btn")?.classList.remove("hiv-drag-over");
    e.currentTarget?.classList.remove("hiv-drag-ghost");
  },

  async _hide(payload) {
    const hidden = getHidden();
    if (payload.type === "layer") { if (!hidden.layers.some(l => l.name === payload.name)) hidden.layers.push({ name: payload.name }); }
    else { if (!hidden.tools.some(t => t.name === payload.name && t.controlName === payload.controlName)) hidden.tools.push({ name: payload.name, controlName: payload.controlName }); }
    await saveHidden(hidden); ui.controls?.render();
  },
  async _restoreLayer(name) {
    const hidden = getHidden(); hidden.layers = hidden.layers.filter(l => l.name !== name);
    await saveHidden(hidden); ui.controls?.render();
    this._closeSubPanel();
    this._refreshPanel();
  },
  async _restoreTool(controlName, name) {
    const hidden = getHidden(); hidden.tools = hidden.tools.filter(t => !(t.name === name && t.controlName === controlName));
    await saveHidden(hidden); ui.controls?.render();
    // Refresh sub-panel in-place if still open (group may still have other tools)
    this._refreshSubPanel(controlName);
    this._refreshPanel();
  },

  _refreshSubPanel(controlName) {
    const sub = document.getElementById("hiv-sub-panel");
    if (!sub?.classList.contains("hiv-open")) return;

    // Find the remaining hidden tools for this group
    const hidden = getHidden();
    const remaining = hidden.tools.filter(t => t.controlName === controlName);
    if (!remaining.length) { this._closeSubPanel(); return; }

    // Find the anchor item still in the main panel for this group
    const panel = document.getElementById("hiv-panel");
    const anchor = panel?.querySelector(`.hiv-vault-item.hiv-is-toolgroup[aria-label]`);

    // Re-build sub-panel content with updated tool list
    const parentCtrl = _fullControlsCache.find(c => c.name === controlName);
    if (!parentCtrl) { this._closeSubPanel(); return; }

    const hiddenToolsForGroup = remaining
      .map(e => parentCtrl.tools.find(t => t.name === e.name))
      .filter(Boolean);

    this._openSubPanel(anchor ?? sub, { name: parentCtrl.name, tools: hiddenToolsForGroup });
  }
};

/* ── Color picker injection for badge color setting ─────────────────────── */

Hooks.on("renderSettingsConfig", (_app, html) => {
  const root = html instanceof jQuery ? html[0] : html;
  const section = root?.querySelector(`section[data-tab="${MODULE_ID}"]`)
                ?? root?.querySelector(`[data-tab="${MODULE_ID}"]`);
  if (!section) return;

  const textInput = section.querySelector(`input[name="${MODULE_ID}.${SETTING_BADGE_COLOR}"]`);
  if (!textInput || textInput._hivPickerInjected) return;
  textInput._hivPickerInjected = true;

  const wrapper = document.createElement("div");
  wrapper.style.cssText = "display:flex; align-items:center; gap:6px;";
  textInput.parentNode.insertBefore(wrapper, textInput);
  wrapper.appendChild(textInput);
  textInput.style.cssText = "flex:1; min-width:0; font-family:monospace; font-size:12px;";

  const swatch = document.createElement("input");
  swatch.type  = "color";
  swatch.value = textInput.value || "#e45f2b";
  swatch.style.cssText = "width:2.8rem;height:2.2rem;padding:2px 3px;cursor:pointer;border:1px solid #3a3020;border-radius:4px;background:#1a1a1a;flex-shrink:0;";

  swatch.addEventListener("input", () => {
    textInput.value = swatch.value;
    textInput.dispatchEvent(new Event("change", { bubbles: true }));
  });
  textInput.addEventListener("input", () => {
    const v = textInput.value.trim();
    if (/^#[0-9a-fA-F]{6}$/.test(v)) swatch.value = v;
  });
  wrapper.appendChild(swatch);
});

Hooks.once("ready", () => {
  Vault.init();
  if (game.settings.get(MODULE_ID, SETTING_TABS_ENABLED)) TabVault.init();
  game.modules.get(MODULE_ID).api = { Vault, TabVault };
  console.log(`[${MODULE_ID}] v1.0.0 ready`);
});

/* ═══════════════════════════════════════════════════════════════════════════
   Tab Vault — hides sidebar tab buttons from #sidebar-tabs
   ═══════════════════════════════════════════════════════════════════════════ */

function getHiddenTabs() {
  try { return game.settings.get(MODULE_ID, SETTING_TABS_HID) ?? []; }
  catch { return []; }
}
const saveHiddenTabs = (arr) => game.settings.set(MODULE_ID, SETTING_TABS_HID, arr);

async function activateTab(tabName) {
  // v13 public API (activateTab is deprecated since v13, changeTab is the replacement)
  try {
    if (typeof ui.sidebar?.changeTab === "function") {
      ui.sidebar.changeTab(tabName, "primary");
      return;
    }
  } catch { /* fallback */ }
  // Fallback: click the button directly
  const btn = document.querySelector(`#sidebar-tabs button[data-tab="${CSS.escape(tabName)}"]`);
  if (btn) { btn.click(); return; }
  // Last resort: old deprecated API (logs warning but still works in v13)
  try { await ui.sidebar?.activateTab?.(tabName); } catch {}
}

const TabVault = {
  _dragData:   null,
  _hookId:     null,
  _moTabVault: null,

  init() {
    if (this._hookId) return; // already initialised

    // Hook fires every time the Sidebar (re-)renders
    this._hookId = Hooks.on("renderSidebar", (_app, html) => this._onRender(html));

    // MutationObserver fallback for first load
    this._moTabVault = new MutationObserver(() => {
      const nav = document.getElementById("sidebar-tabs");
      if (!nav) return;
      if (!nav.querySelector(".hiv-tab-vault-li")) {
        this._onRender(nav.closest("aside") ?? document.body);
      }
      if (nav.querySelector(".hiv-tab-vault-li")) this._moTabVault.disconnect();
    });
    this._moTabVault.observe(document.body, { childList: true, subtree: true });

    // Close tab panel on outside click
    document.addEventListener("pointerdown", (e) => {
      const panel = document.getElementById("hiv-tab-panel");
      if (!panel?.classList.contains("hiv-open")) return;
      const btn = document.querySelector(".hiv-tab-vault-btn");
      if (!panel.contains(e.target) && !btn?.contains(e.target))
        this._closePanel();
    }, true);

    // Global drop fallback for restore
    document.addEventListener("drop", (e) => {
      const d = this._dragData;
      if (d?.type !== "restore-tab") return;
      if (!e.target.closest?.(".hiv-tab-vault-li")) {
        e.preventDefault(); e.stopPropagation();
        this._restoreTab(d.name);
      }
    }, true);

    console.log(`[${MODULE_ID}] TabVault init OK`);
  },

  destroy() {
    if (this._hookId) { Hooks.off("renderSidebar", this._hookId); this._hookId = null; }
    this._moTabVault?.disconnect(); this._moTabVault = null;
    document.getElementById("hiv-tab-panel")?.remove();
    // Restore all tabs to DOM visibility
    document.querySelectorAll("#sidebar-tabs li.hiv-tab-hidden").forEach(li => {
      li.classList.remove("hiv-tab-hidden");
    });
    document.querySelector(".hiv-tab-vault-li")?.remove();
    console.log(`[${MODULE_ID}] TabVault destroyed`);
  },

  _onRender(html) {
    const root = html instanceof HTMLElement ? html : (html[0] ?? html);
    if (!root) return;
    const nav = root.id === "sidebar-tabs" ? root
      : root.querySelector("#sidebar-tabs") ?? root.closest("#sidebar-tabs");
    if (!nav) return;

    // Snapshot tabs BEFORE hiding (so we always have icon+label)
    this._snapshotTabs(nav);

    // Remove any previously injected vault button
    nav.querySelectorAll(".hiv-tab-vault-li").forEach(el => el.remove());

    this._hideTabs(nav);
    this._injectVaultButton(nav);
    this._ensurePanel();
    this._updateBadge();

    if (document.getElementById("hiv-tab-panel")?.classList.contains("hiv-open"))
      this._populatePanel(document.getElementById("hiv-tab-panel"));
  },

  _snapshotTabs(nav) {
    const menu = nav.querySelector("menu");
    if (!menu) return;
    const snapshot = [];
    menu.querySelectorAll("li:not(.hiv-tab-vault-li)").forEach(li => {
      const btn = li.querySelector("button[data-tab]");
      if (!btn) return;
      const tabName = btn.dataset.tab;
      if (!tabName) return;

      // Icon: read from button class (fa-* classes), same pattern as LayerControls
      const iconClass = Array.from(btn.classList)
        .filter(c => c.startsWith("fa-") && c !== "fa-solid" && c !== "fa-regular" && c !== "fa-brands")
        .map(c => `fa-solid ${c}`)
        .join(" ") || "fa-solid fa-circle-question";

      const label = btn.getAttribute("aria-label") ?? btn.dataset.tooltip ?? tabName;

      snapshot.push({ name: tabName, icon: iconClass, label });
    });
    if (snapshot.length) _fullTabsCache = snapshot;
  },

  _hideTabs(nav) {
    const hiddenTabs = new Set(getHiddenTabs());
    if (!hiddenTabs.size) return;
    const menu = nav.querySelector("menu");
    if (!menu) return;
    menu.querySelectorAll("li:not(.hiv-tab-vault-li)").forEach(li => {
      const btn = li.querySelector("button[data-tab]");
      if (btn && hiddenTabs.has(btn.dataset.tab)) {
        li.classList.add("hiv-tab-hidden");
      } else {
        li.classList.remove("hiv-tab-hidden");
      }
    });
  },

  _injectVaultButton(nav) {
    const menu = nav.querySelector("menu");
    if (!menu) return;

    const li = document.createElement("li");
    li.className = "hiv-tab-vault-li";

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "ui-control plain icon fa-solid fa-vault hiv-tab-vault-btn";
    btn.setAttribute("aria-label", "Tab Vault");
    btn.setAttribute("data-tooltip", "Tab Vault");
    btn.setAttribute("aria-expanded", "false");

    // Fallback icon
    queueMicrotask(() => {
      const c = getComputedStyle(btn, "::before").content;
      if (!c || c === "none" || c === '""') {
        btn.classList.remove("fa-vault"); btn.classList.add("fa-lock");
      }
    });

    const badge = document.createElement("span");
    badge.className = "hiv-badge hiv-tab-badge";
    btn.appendChild(badge);
    li.appendChild(btn);

    // Drop → hide tab
    li.addEventListener("dragover", (e) => {
      if (this._dragData?.type === "tab") {
        e.preventDefault(); e.stopPropagation();
        e.dataTransfer.dropEffect = "move";
        btn.classList.add("hiv-drag-over");
      }
    });
    li.addEventListener("dragleave", (e) => {
      if (!li.contains(e.relatedTarget)) btn.classList.remove("hiv-drag-over");
    });
    li.addEventListener("drop", (e) => {
      e.preventDefault(); e.stopPropagation();
      btn.classList.remove("hiv-drag-over");
      if (this._dragData?.type === "tab") this._hideTab(this._dragData.name);
    });

    btn.addEventListener("click", (e) => { e.stopPropagation(); this._togglePanel(li); });

    // Make existing tab LIs draggable
    menu.querySelectorAll("li:not(.hiv-tab-vault-li)").forEach(li => {
      const tabBtn = li.querySelector("button[data-tab]");
      if (!tabBtn) return;
      const tabName = tabBtn.dataset.tab;
      li.setAttribute("draggable", "true");
      if (li._hivTabDS) li.removeEventListener("dragstart", li._hivTabDS);
      if (li._hivTabDE) li.removeEventListener("dragend",   li._hivTabDE);
      li._hivTabDS = (e) => {
        this._dragData = { type: "tab", name: tabName };
        try {
          e.dataTransfer.setData("text/plain", JSON.stringify({ type: "tab", name: tabName }));
        } catch {}
        e.dataTransfer.effectAllowed = "move";
        btn.classList.add("hiv-drag-over");
        li.classList.add("hiv-drag-ghost");
      };
      li._hivTabDE = (e) => {
        this._dragData = null;
        btn.classList.remove("hiv-drag-over");
        e.currentTarget?.classList.remove("hiv-drag-ghost");
      };
      li.addEventListener("dragstart", li._hivTabDS);
      li.addEventListener("dragend",   li._hivTabDE);
    });

    // Restore: drag from tab panel back to sidebar nav
    if (!nav._hivTabRestore) {
      nav._hivTabRestore = true;
      nav.addEventListener("dragover", (e) => {
        if (this._dragData?.type !== "restore-tab") return;
        if (e.target.closest?.(".hiv-tab-vault-li")) return;
        e.preventDefault(); e.stopPropagation();
        e.dataTransfer.dropEffect = "move";
      }, true);
      nav.addEventListener("drop", async (e) => {
        if (this._dragData?.type !== "restore-tab") return;
        if (e.target.closest?.(".hiv-tab-vault-li")) return;
        e.preventDefault(); e.stopPropagation();
        await this._restoreTab(this._dragData.name);
      }, true);
    }

    menu.appendChild(li);
  },

  _ensurePanel() {
    if (!document.getElementById("hiv-tab-panel")) {
      const el = document.createElement("div");
      el.id = "hiv-tab-panel";
      document.body.appendChild(el);
    }
  },

  _togglePanel(anchor) {
    const panel = document.getElementById("hiv-tab-panel");
    if (!panel) return;
    if (panel.classList.contains("hiv-open")) this._closePanel();
    else this._openPanel(anchor);
  },
  _openPanel(anchor) {
    const panel = document.getElementById("hiv-tab-panel");
    if (!panel) return;
    this._populatePanel(panel);
    this._positionNextTo(panel, anchor);
    panel.classList.add("hiv-open");
    document.querySelector(".hiv-tab-vault-btn")?.setAttribute("aria-expanded", "true");
  },
  _closePanel() {
    document.getElementById("hiv-tab-panel")?.classList.remove("hiv-open");
    document.querySelector(".hiv-tab-vault-btn")?.setAttribute("aria-expanded", "false");
  },
  _positionNextTo(el, anchor) {
    // Sidebar is on the right — panel opens to the LEFT of the button
    const ar = anchor.getBoundingClientRect();
    el.style.cssText = `position:fixed; right:${window.innerWidth - ar.left + 6}px; top:${ar.top}px; left:auto; bottom:auto;`;
    requestAnimationFrame(() => {
      const eh = el.offsetHeight, wh = window.innerHeight;
      if (ar.top + eh > wh - 8) el.style.top = `${Math.max(8, wh - eh - 8)}px`;
    });
  },

  _populatePanel(panel) {
    panel.innerHTML = "";
    const hidden = getHiddenTabs();

    // Header: ↺  spacer  ✕
    const header = document.createElement("div"); header.className = "hiv-panel-header";
    const resetBtn = document.createElement("button"); resetBtn.type = "button";
    resetBtn.className = "hiv-panel-btn hiv-panel-btn--reset"; resetBtn.innerHTML = "↺";
    resetBtn.title = "Restore all hidden tabs";
    resetBtn.addEventListener("click", async (e) => {
      e.stopPropagation();
      await this._resetAll();
    });
    header.appendChild(resetBtn);
    const spacer = document.createElement("div"); spacer.className = "hiv-header-spacer";
    header.appendChild(spacer);
    const closeBtn = document.createElement("button"); closeBtn.type = "button";
    closeBtn.className = "hiv-panel-btn hiv-panel-btn--close"; closeBtn.innerHTML = "✕";
    closeBtn.addEventListener("click", (e) => { e.stopPropagation(); this._closePanel(); });
    header.appendChild(closeBtn);
    panel.appendChild(header);

    if (!hidden.length) {
      const msg = document.createElement("div"); msg.className = "hiv-empty-msg";
      msg.textContent = "Drag sidebar tabs here to hide them";
      panel.appendChild(msg); return;
    }

    for (const tabName of hidden) {
      const tabData = _fullTabsCache.find(t => t.name === tabName);
      if (!tabData) continue;

      const div = document.createElement("div");
      div.className = "hiv-vault-item";
      div.setAttribute("draggable", "true");
      div.setAttribute("data-tooltip", tabData.label);
      div.setAttribute("aria-label", tabData.label);

      // Icon
      const i = document.createElement("i");
      i.className = tabData.icon;
      div.appendChild(i);

      // Click: just activate the tab (keep it hidden in bar)
      div.addEventListener("click", async (e) => {
        e.stopPropagation();
        await activateTab(tabName);
        this._closePanel();
      });

      // Right-click: restore only
      div.addEventListener("contextmenu", async (e) => {
        e.preventDefault(); e.stopPropagation();
        await this._restoreTab(tabName);
      });

      // Drag to restore
      div.addEventListener("dragstart", (e) => {
        this._dragData = { type: "restore-tab", name: tabName };
        try { e.dataTransfer.setData("text/plain", JSON.stringify(this._dragData)); } catch {}
        e.dataTransfer.effectAllowed = "move";
        div.classList.add("hiv-drag-ghost");
      });
      div.addEventListener("dragend", (e) => {
        this._dragData = null;
        div.classList.remove("hiv-drag-ghost");
      });

      panel.appendChild(div);
    }
  },

  _updateBadge() {
    const btn = document.querySelector(".hiv-tab-vault-btn");
    if (!btn) return;
    const count = getHiddenTabs().length;
    const badge = btn.querySelector(".hiv-tab-badge");
    if (badge) badge.dataset.count = String(count);
    applyBadge(btn, badge, count > 0);
  },

  async _hideTab(name) {
    const hidden = getHiddenTabs();
    if (hidden.includes(name)) return;
    hidden.push(name);
    await saveHiddenTabs(hidden);
    // Hide directly in DOM — no full re-render needed
    const li = document.querySelector(
      `#sidebar-tabs li:not(.hiv-tab-vault-li):has(button[data-tab="${CSS.escape(name)}"])`
    );
    if (li) li.classList.add("hiv-tab-hidden");
    // Update panel and badge
    const panel = document.getElementById("hiv-tab-panel");
    if (panel?.classList.contains("hiv-open")) this._populatePanel(panel);
    this._updateBadge();
  },

  async _restoreTab(name) {
    const hidden = getHiddenTabs().filter(t => t !== name);
    await saveHiddenTabs(hidden);
    // Restore directly in DOM — no full re-render needed
    const li = document.querySelector(
      `#sidebar-tabs li:not(.hiv-tab-vault-li):has(button[data-tab="${CSS.escape(name)}"])`
    );
    if (li) li.classList.remove("hiv-tab-hidden");
    // Refresh panel and badge in-place
    const panel = document.getElementById("hiv-tab-panel");
    if (panel?.classList.contains("hiv-open")) this._populatePanel(panel);
    this._updateBadge();
  },

  async _resetAll() {
    const yes = await foundry.applications.api.DialogV2.confirm({
      window:  { title: "Hide Icons Vault — Reset Tabs" },
      classes: ["hiv-dialog"],
      content: `<div class="hiv-reset-dialog">
        <div class="hiv-reset-icon"><i class="fas fa-triangle-exclamation"></i></div>
        <div class="hiv-reset-title">Restore all hidden tabs?</div>
        <div class="hiv-reset-body">Every hidden sidebar tab will be <strong>returned to the sidebar</strong>.</div>
        <div class="hiv-reset-hint">This only affects your client.</div>
      </div>`,
      yes: { label: "Restore All Tabs", icon: "fas fa-undo" },
      no:  { label: "Cancel", icon: "fas fa-times", default: true },
    });
    if (yes) {
      await saveHiddenTabs([]);
      // Restore all hidden tab LIs directly in DOM
      document.querySelectorAll("#sidebar-tabs li.hiv-tab-hidden").forEach(li => {
        li.classList.remove("hiv-tab-hidden");
      });
      this._closePanel();
      this._updateBadge();
    }
  }
};
