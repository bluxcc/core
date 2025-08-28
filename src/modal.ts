import htm from "htm";
import { h, render } from "preact";

const html = htm.bind(h);

type ModalProps = {
  title: string;
  content: string | any;
  onClose?: () => void;
};

export function showModal({ title, content, onClose }: ModalProps) {
  const container = document.createElement("div");
  document.body.appendChild(container);

  const handleClose = () => {
    render(null, container);
    document.body.removeChild(container);
    if (onClose) onClose();
  };

  const modal = html`
    <div
      style="
        position: fixed;
        top: 0; left: 0;
        width: 100%; height: 100%;
        background: rgba(0,0,0,0.5);
        display: flex;
        justify-content: center;
        align-items: center;
        animation: fadeIn 0.2s ease;
      "
    >
      <div
        style="
          background: #fff;
          padding: 2rem;
          border-radius: 8px;
          min-width: 300px;
          animation: scaleIn 0.2s ease;
        "
      >
        <h2>${title}</h2>
        <div>${content}</div>
        <button style="margin-top: 1rem;" onclick=${handleClose}>Close</button>
      </div>
    </div>
    <style>
      @keyframes fadeIn {
        from {
          opacity: 0;
        }
        to {
          opacity: 1;
        }
      }
      @keyframes scaleIn {
        from {
          transform: scale(0.9);
        }
        to {
          transform: scale(1);
        }
      }
    </style>
  `;

  render(modal, container);
}
