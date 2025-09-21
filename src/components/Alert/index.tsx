import React from "react";
import { ErrorIcon, InfoIcon, SuccessIcon, WarnIcon } from "../../assets/Icons";
import { AlertType, useAppStore } from "../../store";

interface AlertProps {
  type: AlertType;
  message: string;
  className?: string;
}

const variantStyles: Record<
  AlertType,
  { container: string; text: string; icon: React.ReactNode }
> = {
  error: {
    container: "bluxcc:bg-light-red-50 bluxcc:border bluxcc:border-alert-error",
    text: "bluxcc:text-alert-error",
    icon: <ErrorIcon />,
  },
  success: {
    container: "bluxcc:bg-white bluxcc:border bluxcc:border-alert-success",
    text: "bluxcc:text-alert-success",
    icon: <SuccessIcon />,
  },
  info: {
    container: "bluxcc:bg-light-blue-50 bluxcc:border bluxcc:border-alert-info",
    text: "bluxcc:text-alert-info",
    icon: <InfoIcon />,
  },
  warn: {
    container: "bluxcc:bg-white bluxcc:border bluxcc:border-alert-warning",
    text: "bluxcc:text-alert-warning",
    icon: <WarnIcon />,
  },
  none: {
    container: "",
    text: "",
    icon: null,
  },
};

const Alert: React.FC<AlertProps> = ({ type, message, className = "" }) => {
  const { container, text, icon } = variantStyles[type];
  const appearance = useAppStore((store) => store.config.appearance);

  return (
    <div
      style={{ borderRadius: appearance.borderRadius }}
      className={`bluxcc:flex bluxcc:items-center bluxcc:gap-2 bluxcc:px-3 bluxcc:h-10 bluxcc:max-w-[184px] ${container} ${text} ${className}`}
    >
      {icon}
      <span className="bluxcc:text-sm bluxcc:font-medium bluxcc:select-none">
        {message}
      </span>
    </div>
  );
};

export default Alert;
