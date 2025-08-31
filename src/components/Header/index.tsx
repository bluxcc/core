import htm from "htm";
import { h } from "preact";
import { IAppearance } from "../../types";

import { ArrowLeft, Close } from "../../assets/Icons";
import hexToRgba from "../../utils/hexToRgba";

interface HeaderProps {
  icon?: "info" | "back";
  onInfo?: () => void;
  onBack?: () => void;
  title: string;
  closeButton?: boolean;
  onClose: () => void;
  appearance: IAppearance;
}

const html = htm.bind(h);

export const Header = ({
  icon,
  onInfo,
  onBack,
  title,
  appearance,
  closeButton = false,
  onClose,
}: HeaderProps) => {
  return html`
    <div
      class="bluxcc:flex bluxcc:w-full bluxcc:items-center bluxcc:justify-between bluxcc:pb-5"
    >
      ${icon === "info"
        ? html`
            <div
              onClick=${onInfo}
              class="bluxcc:flex bluxcc:size-5 bluxcc:items-center bluxcc:justify-center bluxcc:cursor-pointer"
            >
              <!-- Example if you add InfoIcon later -->
              <!-- <InfoIcon fill=${appearance.textColor} /> -->
            </div>
          `
        : icon === "back"
        ? html`
            <div
              onClick=${onBack}
              class="bluxcc:flex bluxcc:size-5 bluxcc:items-center bluxcc:justify-center bluxcc:cursor-pointer"
            >
              <${ArrowLeft} fill=${hexToRgba(appearance.textColor, 0.7)} />
            </div>
          `
        : html`<div class="bluxcc:size-5" />`}

      <p
        class="bluxcc:grow bluxcc:text-center bluxcc:text-base bluxcc:font-medium bluxcc:select-none"
      >
        ${title}
      </p>

      ${closeButton
        ? html`
            <div onClick=${onClose} class="bluxcc:size-5 bluxcc:cursor-pointer">
              <${Close} fill=${hexToRgba(appearance.textColor, 0.7)} />
            </div>
          `
        : html`<div class="bluxcc:size-5" />`}
    </div>
  `;
};
