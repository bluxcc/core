import htm from "htm";
import { h } from "preact";

const html = htm.bind(h);

type BackdropProps = {
  isClosing: boolean;
  isSticky?: boolean;
  onClose: () => void;
};

export function ModalBackdrop({
  isClosing,
  isSticky = false,
  onClose,
}: BackdropProps) {
  return html`
    <div
      class="bluxcc:fixed bluxcc:inset-0 bluxcc:z-40 bluxcc:bg-black/10 bluxcc:!backdrop-blur-[1px] ${isClosing &&
      !isSticky
        ? "bluxcc:animate-fadeOut"
        : "bluxcc:animate-fadeIn"}"
      onclick=${onClose}
    />
  `;
}
