# 🔒 Hide Icons Vault – Version 1.0.0

<!-- screenshot-logo -->

**Hide Icons Vault** lets you declutter your Foundry VTT interface by hiding unwanted icons from the Layers Control bar and the Sidebar tabs bar. Hidden icons are stored in a compact vault panel and can be activated at any time without being restored to the bar.

All settings are **per-client** — each user manages their own vault independently, with no effect on other players.

---

## 🗂 Layers Control Vault

The Layers Control Vault adds a vault button (🔒) to the Layers Control bar on the left side of the screen.

<!-- screenshot-layers-vault -->

### Hiding Layers and Tools

1. **Drag** any layer icon or tool icon from the Layers Control bar.
2. Drop it onto the **vault button** (🔒) to hide it.
3. The icon disappears from the bar and the badge on the vault button updates.

> Hiding a *layer* removes it **and all its tools** from the bar.

### Using the Vault Panel

Click the vault button to open the panel:

- **Hidden layers** appear at the top — click to activate, hover to see their tools in a side sub-panel.
- **Hidden tools** are grouped by their parent layer icon. Click the layer icon to expand or collapse the group.
- **Right-click** any icon to restore it to the bar immediately.
- **↺** in the panel header restores everything at once (with confirmation).

<!-- screenshot-vault-panel -->

### Restoring Icons

| Method | How |
|---|---|
| **Right-click** | Right-click any icon in the vault panel |
| **Drag out** | Drag an icon from the vault panel back onto the Layers Control bar |
| **Reset All** | Click ↺ in the panel header, or use **Reset All Hidden Icons** in Module Settings |

---

## 🗃 Sidebar Tab Vault

The Sidebar Tab Vault is **disabled by default**. Enable it in **Module Settings → Enable Sidebar Tab Vault**.

Once enabled, a vault button (🔒) appears at the bottom of the sidebar tabs bar on the right side of the screen.

<!-- screenshot-tab-vault -->

### Hiding Tabs

1. **Drag** any sidebar tab icon onto the vault button.
2. The tab disappears from the sidebar bar and the vault badge updates.

### Using Hidden Tabs

- **Click** any icon in the tab vault panel to **activate that tab** — the sidebar opens to that tab without restoring the icon to the bar.
- **Right-click** any icon to **restore it** to the sidebar bar.
- **Drag** an icon from the panel back to the sidebar bar to restore it.
- **↺** in the panel header restores all hidden tabs (with confirmation).

---

## 🔵 Badge Style

The vault button shows a visual indicator when it has hidden items. Choose your preferred style in **Module Settings → Vault Badge Style**:

<!-- screenshot-badge-styles -->

| Style | Description |
|---|---|
| **Count** | Shows the number of hidden items (default) |
| **Dot** | Shows a small dot — no number |
| **Color** | Tints the vault icon with a custom color |
| **None** | No indicator on the vault button |

The **Color** option includes a color picker in Module Settings. The same badge style applies to both vaults.

---

## ⚙ Module Settings

<!-- screenshot-settings -->

| Setting | Description |
|---|---|
| **Open Instructions** | Opens the in-game instructions dialog |
| **Reset All Hidden Icons** | Restores every hidden layer/tool icon to the Layers Control bar |
| **Vault Button Position** | Place the layers vault button at the top or bottom of the bar |
| **Vault Badge Style** | How the vault button indicates hidden items (Count / Dot / Color / None) |
| **Badge Color** | Color used to tint the vault icon when Badge Style is set to Color |
| **Enable Sidebar Tab Vault** | Adds a vault button to the sidebar tabs bar |

---

## 💡 Tips

- Both vaults are completely independent — resetting one does not affect the other.
- If a hidden icon no longer exists (e.g. a module was disabled), it is automatically removed from the vault on the next load.
- You can place the layers vault button at the top or bottom of the bar depending on your preference.
- All data is saved per client. Other users keep their own vault settings.

---

# License

legal code: https://creativecommons.org/licenses/by-nc/4.0/
