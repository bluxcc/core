import { h } from "preact";
import { useState } from "preact/hooks";
import htm from "htm";

import { IAppearance } from "../../types";

const html = htm.bind(h);

type InputFieldProps = {
  label?: string;
  placeholder?: string;
  error?: string;
  type?: "text" | "password" | "number";
  iconRight?: preact.ComponentChildren;
  iconLeft?: preact.ComponentChildren;
  button?: string | preact.ComponentChildren;
  onButtonClick?: () => void;
  value?: string;
  autoFocus?: boolean;
  onChange?: (e: Event) => void;
  customLabel?: preact.ComponentChildren;
  className?: string;
  appearance: IAppearance;
};

type CustomButtonProps = {
  button: string | preact.ComponentChildren;
  onButtonClick?: () => void;
  appearance: IAppearance;
};

const CustomButton = ({
  button,
  onButtonClick,
  appearance,
}: CustomButtonProps) => {
  return html`
    <button
      onClick=${onButtonClick}
      style=${{
        borderRadius: appearance.borderRadius,
        color: appearance.textColor,
        borderColor: appearance.borderColor,
        backgroundColor: appearance.background,
        borderWidth: appearance.outlineWidth ?? appearance.borderWidth,
      }}
      class="bluxcc:border bluxcc:!px-3 bluxcc:!py-1 bluxcc:!text-sm bluxcc:font-medium bluxcc:transition-all bluxcc:duration-300"
    >
      ${button}
    </button>
  `;
};

const InputField = ({
  label,
  autoFocus,
  type = "text",
  placeholder = "Input",
  error,
  iconRight,
  iconLeft,
  button,
  onButtonClick,
  customLabel,
  value,
  className,
  onChange,
  appearance,
}: InputFieldProps) => {
  const [isFocused, setIsFocused] = useState(false);

  const onMouseEnter = (e: MouseEvent) => {
    const el = e.currentTarget as HTMLDivElement;
    if (!isFocused && !error) {
      el.style.borderColor = appearance.accentColor;
      el.style.transition = "border-color 0.35s ease-in-out";
    }
  };

  const onMouseLeave = (e: MouseEvent) => {
    const el = e.currentTarget as HTMLDivElement;
    if (!isFocused) {
      el.style.borderColor = error ? "#ec2929" : appearance.borderColor;
    }
  };

  const getBorderAndRingColor = () => {
    if (error) return "#ec2929";
    if (isFocused) return appearance.accentColor;
    return appearance.borderColor;
  };

  return html`
    <div class="bluxcc:flex bluxcc:w-full bluxcc:flex-col">
      ${label &&
      html`
        <label
          style=${{ color: error ? "#ec2929" : appearance.textColor }}
          class="bluxcc:mb-1 bluxcc:ml-2 bluxcc:flex bluxcc:justify-between bluxcc:text-sm"
        >
          <span>${label}</span>
          <span>${customLabel}</span>
        </label>
      `}
      <div
        class="bluxcc:flex bluxcc:h-14 bluxcc:w-full bluxcc:items-center bluxcc:border bluxcc:px-4 bluxcc:py-2 bluxcc:transition-all bluxcc:duration-300 ${className}"
        onFocus=${() => setIsFocused(true)}
        onBlur=${() => setIsFocused(false)}
        onMouseEnter=${onMouseEnter}
        onMouseLeave=${onMouseLeave}
        style=${{
          "--tw-ring-color": getBorderAndRingColor(),
          borderRadius: appearance.borderRadius,
          borderColor: getBorderAndRingColor(),
          backgroundColor: appearance.fieldBackground,
          borderWidth: appearance.outlineWidth ?? appearance.borderWidth,
        }}
      >
        ${iconLeft && html`<div class="bluxcc:mr-2">${iconLeft}</div>`}
        <input
          id="bluxcc-input"
          autocomplete="off"
          min=${type === "number" ? 1 : undefined}
          type=${type}
          autofocus=${autoFocus}
          value=${value}
          placeholder=${placeholder}
          class="bluxcc:!mr-2 bluxcc:bg-transparent bluxcc:outline-hidden"
          style=${{
            color: appearance.textColor,
            width: !button ? "100%" : "90%",
          }}
          onInput=${onChange}
        />
        ${button &&
        html`<${CustomButton}
          button=${button}
          onButtonClick=${onButtonClick}
          appearance=${appearance}
        />`}
        ${iconRight && html`<div class="bluxcc:ml-2">${iconRight}</div>`}
      </div>
      ${error &&
      html`
        <p
          class="bluxcc:mt-1 bluxcc:ml-2 bluxcc:text-xs bluxcc:text-alert-error"
        >
          ${error}
        </p>
      `}
    </div>
  `;
};

export default InputField;
