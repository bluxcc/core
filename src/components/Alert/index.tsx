import React from "react";
import { ErrorIcon, InfoIcon, SuccessIcon, WarnIcon } from "../../assets/Icons";
import { AlertType, useAppStore } from "../../store";

type AlertVariant = AlertType;

interface AlertProps {
  type: AlertVariant;
  message: string;
  className?: string; // allows external styling overrides
}

const variantStyles: Record<
  AlertVariant,
  { bg: string; text: string; border: string; icon: React.ReactNode }
> = {
  error: {
    bg: "bluxcc:bg-light-red-50",
    text: "bluxcc:text-alert-error",
    border: "bluxcc:border bluxcc:border-alert-error",
    icon: <ErrorIcon />,
  },
  success: {
    bg: "bluxcc:bg-white",
    text: "bluxcc:text-alert-success",
    border: "bluxcc:border bluxcc:border-alert-success",
    icon: <SuccessIcon />,
  },
  info: {
    bg: "bluxcc:bg-light-blue-50",
    text: "bluxcc:text-alert-info",
    border: "bluxcc:border bluxcc:border-alert-info",
    icon: <InfoIcon />,
  },
  warn: {
    bg: "bluxcc:bg-white",
    text: "bluxcc:text-alert-warning",
    border: "bluxcc:border bluxcc:border-alert-warning",
    icon: <WarnIcon />,
  },
  none: {
    bg: "",
    text: "",
    border: "",
    icon: "",
  },
};

const Alert: React.FC<AlertProps> = ({ type, message, className }) => {
  const style = variantStyles[type];
  const appearance = useAppStore((store) => store.config.appearance);

  return (
    <div
      style={{ borderRadius: appearance.borderRadius }}
      className={`bluxcc:flex bluxcc:items-center bluxcc:gap-2 bluxcc:px-3 bluxcc:h-10 bluxcc:max-w-[184px] ${style.bg} ${style.text} ${style.border} ${className}`}
    >
      {style.icon}
      <span className="bluxcc:text-sm bluxcc:font-medium bluxcc:select-none">
        {message}
      </span>
    </div>
  );
};

export default Alert;
