import htm from "htm";
import { h } from "preact";
import { IAppearance } from "../../types";

const html = htm.bind(h);

type ButtonProps = {
  endIcon?: preact.ComponentChildren;
  startIcon?: preact.ComponentChildren;
  className?: string;
  onClick?: ({ x }: { x?: any }) => void;
  children: preact.ComponentChildren;
  size?: "small" | "medium" | "large";
  variant?: "outline" | "text" | "fill";
  state?: "enabled" | "disabled" | "selected";
  style?: Record<string, string | number>;
  appearance: IAppearance;
};

export function Button({
  size = "large",
  variant = "outline",
  state = "enabled",
  children,
  startIcon,
  endIcon,
  onClick,
  style,
  className,
  appearance,
}: ButtonProps) {
  const sizeClasses: Record<string, string> = {
    small: "bluxcc:h-8 bluxcc:!text-sm bluxcc:gap-1",
    medium: "bluxcc:h-10 bluxcc:!text-sm bluxcc:gap-2",
    large: "bluxcc:h-[52px] bluxcc:!text-base bluxcc:gap-2",
  };

  const baseStyle: Record<string, string | number> = {
    borderRadius: appearance.borderRadius,
    cursor: state === "disabled" ? "not-allowed" : "pointer",
    opacity: state === "disabled" ? 0.5 : 1,
    pointerEvents: state === "disabled" ? "none" : "auto",
    ...style,
  };

  if (variant === "outline") {
    Object.assign(baseStyle, {
      border: `1px solid ${appearance.borderColor}`,
      color: appearance.accentColor,
      backgroundColor: appearance.background,
    });
  } else if (variant === "fill") {
    Object.assign(baseStyle, {
      backgroundColor: appearance.accentColor,
      fontWeight: "500",
      color: "#fff",
    });
  } else if (variant === "text") {
    Object.assign(baseStyle, {
      color: appearance.accentColor,
      backgroundColor: "transparent",
    });
  }

  if (state === "selected") {
    baseStyle.boxShadow = `0 0 0 2px ${appearance.accentColor}`;
  }

  return html`
    <button
      onclick=${onClick}
      disabled=${state === "disabled"}
      class="${sizeClasses[size]} ${className ?? ""}"
      style=${baseStyle}
    >
      ${startIcon ? html`<span>${startIcon}</span>` : null}
      <span>${children}</span>
      ${endIcon ? html`<span>${endIcon}</span>` : null}
    </button>
  `;
}
