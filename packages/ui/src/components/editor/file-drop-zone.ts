import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";

export interface FileDropZoneOptions {
  onFileDrop?: (files: File[]) => void;
}

const fileDropKey = new PluginKey("fileDrop");

export const FileDropZone = Extension.create<FileDropZoneOptions>({
  name: "fileDropZone",

  addOptions() {
    return { onFileDrop: undefined };
  },

  addProseMirrorPlugins() {
    const onDrop = this.options.onFileDrop;
    return [
      new Plugin({
        key: fileDropKey,
        props: {
          handleDrop(view, event) {
            if (!event.dataTransfer?.files?.length) return false;
            const files = Array.from(event.dataTransfer.files);
            if (onDrop && files.length > 0) {
              onDrop(files);
              return true;
            }
            return false;
          },
        },
      }),
    ];
  },
});
