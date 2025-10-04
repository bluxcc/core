import React from 'react';

import { useAppStore } from '../../store';
import { getContrastColor, hexToRgba } from '../../utils/helpers';

type ButtonSize = 'small' | 'medium' | 'large';
type ButtonVariant = 'outline' | 'text' | 'fill' | 'tonal';
type ButtonState = 'enabled' | 'disabled' | 'selected';

interface ButtonProps {
  size?: ButtonSize;
  variant?: ButtonVariant;
  state?: ButtonState;
  children: React.ReactNode;
  startIcon?: React.ReactNode;
  endIcon?: React.ReactNode;
  onClick?: () => void;
  style?: React.CSSProperties;
  className?: string;
  type?: 'button' | 'submit';
}

const buttonBase =
  'bluxcc:flex bluxcc:justify-center bluxcc:items-center bluxcc:px-[10px] bluxcc:transition-all bluxcc:duration-300 bluxcc:w-full';

const sizeClasses: Record<ButtonSize, string> = {
  small: 'bluxcc:h-8 bluxcc:!text-sm bluxcc:gap-1',
  medium: 'bluxcc:h-10 bluxcc:!text-sm bluxcc:gap-1',
  large: 'bluxcc:h-[52px] bluxcc:!text-base bluxcc:gap-1',
};

const Button = ({
  size = 'large',
  variant = 'outline',
  state = 'enabled',
  children,
  startIcon,
  endIcon,
  onClick,
  style,
  className,
  type,
}: ButtonProps) => {
  const appearance = useAppStore((store) => store.config.appearance);

  const baseStyle: React.CSSProperties = {
    borderRadius: appearance.borderRadius,
    cursor: state === 'disabled' ? 'not-allowed' : 'pointer',
    opacity: state === 'disabled' ? 0.5 : 1,
    pointerEvents: state === 'disabled' ? 'none' : undefined,
    ...style,
  };

  if (variant === 'outline') {
    Object.assign(baseStyle, {
      border: `1px solid ${appearance.borderColor}`,
      color: appearance.accentColor,
      backgroundColor: appearance.fieldBackground,
      borderWidth: appearance.borderWidth,
    });
  } else if (variant === 'fill') {
    Object.assign(baseStyle, {
      backgroundColor: appearance.accentColor,
      fontWeight: '500',
      color: getContrastColor(appearance.accentColor),
    });
  } else if (variant === 'text') {
    Object.assign(baseStyle, {
      color: appearance.accentColor,
      backgroundColor: 'transparent',
    });
  } else if (variant === 'tonal') {
    Object.assign(baseStyle, {
      color: appearance.accentColor,
      backgroundColor: hexToRgba(appearance.accentColor, 0.1),
    });
  }

  if (state === 'selected') {
    baseStyle.boxShadow = `0 0 0 2px ${appearance.accentColor}`;
  }

  return (
    <button
      type={type ? type : 'button'}
      onClick={onClick}
      disabled={state === 'disabled'}
      className={`${buttonBase} ${sizeClasses[size]} ${className ?? ''
        } bluxcc:transition-all bluxcc:duration-300`}
      style={baseStyle}
    >
      {startIcon && <span>{startIcon}</span>}
      <span>{children}</span>
      {endIcon && <span>{endIcon}</span>}
    </button>
  );
};

export default Button;
