import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";

export const SubmitShortcut = Extension.create({
  name: "submitShortcut",

  addOptions() {
    return {
      key: "Enter",
      mod: true,
      onSubmit: (() => {}) as () => void,
    };
  },

  addKeyboardShortcuts() {
    const modKey = this.options.mod ? "Mod" : "";
    const key = modKey ? `${modKey}-${this.options.key}` : this.options.key;
    return {
      [key]: () => {
        this.options.onSubmit();
        return true;
      },
    };
  },
});
