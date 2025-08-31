import { useState } from "preact/hooks";
import htm from "htm";
import { h } from "preact";

import { ArrowRight } from "../../assets/Icons";
import hexToRgba from "../../utils/hexToRgba";
import { useLang } from "../../hooks/useLang";
import { IAppearance } from "../../types";

const html = htm.bind(h);

type CardItemProps = {
  variant?: "social" | "default" | "input";
  startIcon: preact.ComponentChildren;
  endArrow?: boolean;
  isRecent?: boolean;
  label?: string;
  onClick?: () => void;
  onChange?: (value: string) => void;
  onEnter?: (value: string) => void;
  onSubmit?: (value: string) => void;
  inputType?: "text" | "password" | "number" | "email" | string;
  appearance: IAppearance;
};

export function CardItem({
  variant = "default",
  startIcon,
  endArrow,
  isRecent,
  label,
  onClick,
  onChange,
  onEnter,
  onSubmit,
  appearance,
  inputType = "text",
}: CardItemProps) {
  const t = useLang();

  const [inputValue, setInputValue] = useState(label || "");
  const [isValid, setIsValid] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const validateInput = (value: string) => {
    if (inputType === "email") {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
    }
    return value.trim() !== "";
  };

  const handleInputChange = (e: any) => {
    const value = e.target.value;
    setInputValue(value);
    setIsValid(validateInput(value));
    onChange?.(value);
  };

  const handleKeyDown = (e: any) => {
    if (e.key === "Enter" && isValid) {
      onEnter?.(inputValue);
    }
  };

  const onMouseEnter = (e: any) => {
    if (variant !== "social" && !isFocused) {
      e.currentTarget.style.borderColor = appearance.accentColor;
      e.currentTarget.style.transition = "border-color 0.35s ease-in-out";
    }
  };

  const onMouseLeave = (e: any) => {
    if (variant !== "social" && !isFocused) {
      e.currentTarget.style.borderColor = appearance.borderColor;
    }
  };

  return html`
    <div
      onClick=${variant === "input" ? undefined : onClick}
      className=${`bluxcc:flex bluxcc:!h-14 bluxcc:w-full bluxcc:items-center bluxcc:border bluxcc:py-2 bluxcc:pr-3.5 bluxcc:pl-[10px] ${
        variant === "input" ? "bluxcc:cursor-text" : "bluxcc:cursor-pointer"
      }`}
      style=${{
        borderRadius: appearance.borderRadius,
        color: appearance.textColor,
        borderColor: isFocused
          ? appearance.accentColor
          : appearance.borderColor,
        backgroundColor: appearance.fieldBackground,
        borderWidth: appearance.outlineWidth ?? appearance.borderWidth,
      }}
      onMouseEnter=${onMouseEnter}
      onMouseLeave=${onMouseLeave}
    >
      <span
        style=${{
          backgroundColor: appearance.background,
          borderRadius: appearance.borderRadius,
          borderColor: appearance.borderColor,
          borderWidth: appearance.outlineWidth ?? appearance.borderWidth,
        }}
        class="bluxcc:flex bluxcc:size-10 bluxcc:shrink-0 bluxcc:items-center bluxcc:justify-center bluxcc:overflow-hidden bluxcc:border bluxcc:transition-[border-radius] bluxcc:duration-300"
      >
        ${startIcon}
      </span>

      <div
        class="bluxcc:relative bluxcc:ml-4 bluxcc:flex bluxcc:h-full bluxcc:flex-1 bluxcc:items-center"
      >
        ${variant === "input"
          ? html`
              <input
                id="bluxcc-input"
                type=${inputType}
                value=${inputValue}
                onInput=${handleInputChange}
                onKeyDown=${handleKeyDown}
                placeholder=${t("email")}
                class="bluxcc:mr-1 bluxcc:h-full bluxcc:w-full bluxcc:bg-transparent bluxcc:outline-hidden bluxcc:focus:outline-hidden"
                style=${{ color: appearance.textColor }}
                onFocus=${() => setIsFocused(true)}
                onBlur=${() => {
                  setIsFocused(false);
                  if (!validateInput(inputValue)) {
                    setIsValid(false);
                  }
                }}
              />
              <div
                class="bluxcc:flex bluxcc:h-10 bluxcc:w-[100px] bluxcc:items-center bluxcc:justify-center bluxcc:bg-transparent"
              >
                <button
                  disabled=${!isValid}
                  onClick=${() => onSubmit?.(inputValue)}
                  class="bluxcc:absolute bluxcc:right-0 bluxcc:flex bluxcc:h-8 bluxcc:w-[68px]! bluxcc:items-center bluxcc:justify-center bluxcc:border bluxcc:!text-sm bluxcc:font-medium bluxcc:transition-[border-radius,background,border-color] bluxcc:duration-200"
                  style=${{
                    background: appearance.fieldBackground,
                    borderRadius: appearance.borderRadius,
                    borderColor: isValid
                      ? appearance.accentColor
                      : appearance.borderColor,
                    color: isValid ? appearance.accentColor : "#999999",
                    borderWidth: appearance.outlineWidth
                      ? appearance.borderWidth
                      : "1px",
                  }}
                >
                  ${t("submit")}
                </button>
              </div>
            `
          : html`
              <span class="bluxcc:font-medium bluxcc:select-none"
                >${label}</span
              >
            `}
      </div>

      ${isRecent &&
      html`
        <div
          class="bluxcc:px-2 bluxcc:py-1 bluxcc:text-xs bluxcc:font-normal"
          style=${{
            color: appearance.accentColor,
            borderRadius: appearance.borderRadius,
            backgroundColor: `${hexToRgba(appearance.accentColor, 0.1)}`,
          }}
        >
          ${t("recent")}
        </div>
      `}
      ${endArrow &&
      html`
        <span class="bluxcc:ml-auto bluxcc:flex bluxcc:items-center">
          <${ArrowRight} fill=${hexToRgba(appearance.textColor, 0.7)} />
        </span>
      `}
    </div>
  `;
}
