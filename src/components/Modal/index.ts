import htm from "htm";
import { h, render } from "preact";
import { ModalBackdrop } from "./Backdrop";

const html = htm.bind(h);

type ModalProps = {
  isOpen: boolean;
  onClose?: () => void;
  children: any;
  isSticky?: boolean;
  appearance?: {
    background: string;
    textColor: string;
    font: string;
    borderColor: string;
    borderWidth: string | number;
    borderRadius: string | number;
  };
};

export function showModal({
  isOpen,
  onClose = () => {},
  children,
  isSticky = false,
  appearance = {
    background: "#fff",
    textColor: "#000",
    font: "sans-serif",
    borderColor: "#ddd",
    borderWidth: "1px",
    borderRadius: "8px",
  },
}: ModalProps) {
  if (!isOpen) return;

  const container = document.createElement("div");
  document.body.appendChild(container);

  let isClosing = false;

  const handleClose = () => {
    isClosing = true;
    renderModal(); // re-render with closing state
    setTimeout(() => {
      render(null, container);
      document.body.removeChild(container);
      onClose();
    }, 250); // match fadeOut animation time
  };

  const renderModal = () => {
    const modal = html`
      ${ModalBackdrop({
        isClosing,
        isSticky,
        onClose: handleClose,
      })}
      <div
        class="bluxcc:absolute bluxcc:inset-0 bluxcc:z-[9999] bluxcc:flex bluxcc:items-center bluxcc:justify-center"
        onclick=${(e: any) => e.target === e.currentTarget && handleClose()}
      >
        <div
          class="bluxcc:box-border bluxcc:!shadow-[0px_4px_80px_0px_#00000008] bluxcc:relative bluxcc:!w-[360px] bluxcc:animate-fadeIn"
          style=${{
            backgroundColor: appearance.background,
            color: appearance.textColor,
            fontFamily: appearance.font,
            outlineStyle: "solid",
            outlineColor: appearance.borderColor,
            outlineWidth: appearance.borderWidth,
            borderRadius: appearance.borderRadius,
            overflow: "hidden",
            opacity: isClosing && !isSticky ? "0" : "1",
            transition: "opacity 250ms ease-in-out",
          }}
        >
          <div class="bluxcc:px-6 bluxcc:pt-5 bluxcc:pb-4">${children}</div>
        </div>
      </div>
    `;

    render(modal, container);
  };

  renderModal();

  return {
    close: handleClose,
  };
}
