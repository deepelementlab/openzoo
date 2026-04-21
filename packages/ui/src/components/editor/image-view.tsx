import { Node, mergeAttributes } from "@tiptap/core";
import { ReactNodeViewRenderer } from "@tiptap/react";
import { NodeViewWrapper } from "@tiptap/react";

function ImageViewComponent({ node }: { node: { attrs: { src: string; alt?: string; title?: string } } }) {
  return (
    <NodeViewWrapper className="inline-block" data-drag-handle>
      <img
        src={node.attrs.src}
        alt={node.attrs.alt || ""}
        title={node.attrs.title || ""}
        className="max-w-full rounded-md border my-2"
      />
    </NodeViewWrapper>
  );
}

export const ImageView = Node.create({
  name: "image",

  addOptions() {
    return { inline: false, allowBase64: true, HTMLAttributes: {} };
  },

  inline() {
    return this.options.inline;
  },

  group() {
    return this.options.inline ? "inline" : "block";
  },

  draggable: true,

  addAttributes() {
    return {
      src: { default: null },
      alt: { default: null },
      title: { default: null },
    };
  },

  parseHTML() {
    return [{ tag: "img[src]" }];
  },

  renderHTML({ HTMLAttributes }) {
    return ["img", mergeAttributes(this.options.HTMLAttributes, HTMLAttributes)];
  },

  addNodeView() {
    return ReactNodeViewRenderer(ImageViewComponent);
  },

  addCommands() {
    return {
      setImage:
        (options: { src: string; alt?: string; title?: string }) =>
        ({ commands }) => {
          return commands.insertContent({ type: this.name, attrs: options });
        },
    };
  },
});
