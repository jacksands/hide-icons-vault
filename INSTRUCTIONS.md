# Hide Icons Vault v1.0.0 — Instructions

## What it does

**Hide Icons Vault** has two independent vaults:

- **Layers Control Vault** — hides layer and tool icons from the Layers Control bar (left side of screen)
- **Sidebar Tab Vault** — hides tab icons from the sidebar tabs bar (right side of screen)

All settings are **per-client** — each user manages their own vault independently.

---

## Layers Control Vault

### Hiding icons

1. **Drag** any layer icon or tool icon from the Layers Control bar.
2. Drop it onto the **vault button** (🔒) at the bottom (or top) of the bar.
3. The icon disappears from the bar and the vault badge count increases.

> Hiding a *layer* removes it and all its tools from the bar.

### The Vault panel

Click the vault button to open the panel:

- **Hidden layers** appear at the top — click to activate, hover to see their tools in a side sub-panel.
- **Hidden tools** are grouped by their parent layer. Click the layer icon to expand/collapse the group. Click any tool to activate it.
- **Right-click** any icon to restore it to the bar immediately.
- **↺** in the panel header — restore everything at once (with confirmation).

### Restoring layer/tool icons

| Method | How |
|---|---|
| **Right-click** | Right-click any icon in the vault panel |
| **Drag out** | Drag an icon from the vault panel onto the Layers Control bar |
| **↺ (panel)** | Restores all icons from *that vault only* |
| **Reset All** | **Module Settings → Reset All Hidden Icons** restores *both vaults at once* |

---

## Sidebar Tab Vault

Enable it first in **Module Settings → Enable Sidebar Tab Vault**.

Once enabled, a vault button (🔒) appears at the bottom of the sidebar tabs bar.

### Hiding tabs

1. **Drag** any sidebar tab icon onto the vault button.
2. The tab disappears from the sidebar bar and the vault badge count increases.

### Using hidden tabs

- **Click** any icon in the tab vault panel to **activate that tab** — the sidebar opens to that tab without restoring the icon to the bar.
- **Right-click** any icon to **restore it** to the sidebar bar.
- **Drag** an icon from the panel back to the sidebar bar to restore it.
- **↺** in the panel header — restore all hidden tabs (with confirmation).

---

## Badge Style

The vault button can show a visual indicator when it has hidden items. Choose your preferred style in **Module Settings → Vault Badge Style**:

| Style | Description |
|---|---|
| **Count** | Shows the number of hidden items (default) |
| **Dot** | Shows a small dot — no number |
| **Color** | Tints the vault icon with a custom color (set with the color picker below) |
| **None** | No indicator on the vault button |

The same badge style applies to both the Layers Control Vault and the Sidebar Tab Vault.

---

## Module Settings

| Setting | Description |
|---|---|
| **Open Instructions** | Opens this dialog |
| **Reset All Hidden Icons** | Restores every hidden icon and tab — resets both vaults at once |
| **Vault Button Position** | Place the layers vault button at the top or bottom of the bar |
| **Show section labels** | Toggle section headers inside the layers vault panel |
| **Vault Badge Style** | Choose how the vault button indicates hidden items (Count / Dot / Color / None) |
| **Badge Color** | Color used when Badge Style is set to Color |
| **Enable Sidebar Tab Vault** | Adds a vault button to the sidebar tabs bar |

---

## Tips

- Both vaults are completely independent — resetting one does not affect the other.
- Vault badges show the count of currently hidden icons/tabs.
- If a hidden icon no longer exists (e.g. a module was disabled), it is automatically removed from the vault on the next load.
- All data is saved per client. Other users keep their own vault settings.

---

## ⚠️ Known Limitations

Hide Icons Vault detects controls using standard Foundry HTML attributes. Modules that inject controls with non-standard structures — such as **Mass Edit** and **Notebook** (at this date) — may not be draggable or may not hide correctly. Installing **lib-wrapper** is recommended to reduce conflicts with other modules that patch the same Foundry methods.
