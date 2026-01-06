import React from 'react';
import { CopyIcon, ErrorIcon, SuccessIcon, WarnIcon } from '../../assets/Icons';
import { AlertType, useAppStore } from '../../store';
import { isBackgroundDark } from '../../utils/helpers';

interface AlertProps {
  type: AlertType;
  message: string;
  className?: string;
}

const variantStyles: Record<
  AlertType,
  {
    baseBg: string;
    darkBg: string;
    container: string;
    text: string;
    icon: React.ReactNode;
  }
> = {
  error: {
    baseBg: 'bluxcc:bg-light-red-50',
    darkBg: 'bluxcc:bg-[#D6000033]',
    container: 'bluxcc:border bluxcc:border-alert-error',
    text: 'bluxcc:text-alert-error',
    icon: <ErrorIcon />,
  },
  success: {
    baseBg: 'bluxcc:bg-white',
    darkBg: 'bluxcc:bg-[#00D66E33]',
    container: 'bluxcc:border bluxcc:border-alert-success',
    text: 'bluxcc:text-alert-success',
    icon: <SuccessIcon />,
  },
  copy: {
    baseBg: 'bluxcc:bg-light-blue-50',
    darkBg: 'bluxcc:bg-[#005DF333]',
    container: 'bluxcc:border bluxcc:border-alert-info',
    text: 'bluxcc:text-alert-info',
    icon: <CopyIcon />,
  },
  warn: {
    baseBg: 'bluxcc:bg-white',
    darkBg: 'bluxcc:bg-[#FA8F0233]',
    container: 'bluxcc:border bluxcc:border-alert-warning',
    text: 'bluxcc:text-alert-warning',
    icon: <WarnIcon />,
  },
  none: {
    baseBg: '',
    darkBg: '',
    container: '',
    text: '',
    icon: null,
  },
};

const Alert: React.FC<AlertProps> = ({ type, message, className = '' }) => {
  const appearance = useAppStore((store) => store.config.appearance);
  const isDarkBg = isBackgroundDark(appearance.background);

  const { baseBg, darkBg, container, text, icon } = variantStyles[type];
  const backgroundClass = isDarkBg ? darkBg : baseBg;

  return (
    <div
      style={{
        borderRadius: appearance.borderRadius,
        fontFamily: appearance.fontFamily,
      }}
      className={`
        bluxcc:flex bluxcc:items-center bluxcc:gap-2
        bluxcc:px-3 bluxcc:h-10 bluxcc:max-w-46
        ${backgroundClass}
        ${container}
        ${text}
        ${className}
      `}
    >
      {icon}
      <span className="bluxcc:text-sm bluxcc:font-medium bluxcc:select-none">
        {message}
      </span>
    </div>
  );
};

export default Alert;
