import React, { useState, MouseEvent } from 'react';

import { useAppStore } from '../../../store';
import { useLang } from '../../../hooks/useLang';
import { ArrowRight } from '../../../assets/Icons';
import { hexToRgba } from '../../../utils/helpers';

type ButtonCardProps = {
  size?: 'small' | 'medium';
  startIcon: React.ReactNode;
  endArrow?: boolean;
  isRecent?: boolean;
  label?: string;
  onClick?: () => void;
};

const ButtonCard = ({
  size = 'medium',
  startIcon,
  endArrow,
  isRecent = false,
  label,
  onClick,
}: ButtonCardProps) => {
  const store = useAppStore((store) => store);
  const [isFocused, setIsFocused] = useState(false);

  const { appearance } = store.config;
  const t = useLang();

  const handleMouseEnter = (e: MouseEvent<HTMLButtonElement>) => {
    setIsFocused(true);

    if (!isFocused) {
      e.currentTarget.style.borderColor = appearance.accentColor;
      e.currentTarget.style.transition = 'border-color 0.35s ease-in-out';
    }
  };
  const handleMouseLeave = (e: MouseEvent<HTMLButtonElement>) => {
    setIsFocused(false);

    if (!isFocused) {
      e.currentTarget.style.borderColor = appearance.borderColor;
    }
  };
  return (
    <button
      type="button"
      onClick={onClick}
      className={`bluxcc:flex bluxcc:transition-colors bluxcc:duration-300
          ${
            size === 'small'
              ? 'bluxcc:size-24 bluxcc:flex-col bluxcc:items-center bluxcc:justify-center bluxcc:gap-2 bluxcc:py-4'
              : 'bluxcc:h-14! bluxcc:w-full bluxcc:items-center bluxcc:py-2 bluxcc:pr-3 bluxcc:pl-2'
          }
        `}
      style={{
        borderRadius: appearance.borderRadius,
        borderColor: isFocused
          ? appearance.accentColor
          : appearance.borderColor,
        backgroundColor: appearance.fieldBackground,
        borderWidth: appearance.borderWidth,
        color: appearance.textColor,
      }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <span
        style={{
          background: appearance.background,
          borderRadius: appearance.borderRadius,
          borderColor: appearance.borderColor,
          borderWidth: appearance.borderWidth,
        }}
        className="bluxcc:flex bluxcc:size-10 bluxcc:shrink-0 bluxcc:items-center bluxcc:justify-center bluxcc:overflow-hidden bluxcc:transition-all bluxcc:duration-300"
      >
        {startIcon}
      </span>

      <div
        className={`${
          size === 'small' ? 'bluxcc:mt-0' : 'bluxcc:ml-4'
        } bluxcc:relative bluxcc:flex bluxcc:h-full bluxcc:flex-1 bluxcc:items-center`}
      >
        <span
          className={`${
            size === 'small'
              ? 'bluxcc:text-sm bluxcc:leading-4'
              : 'bluxcc:text-base'
          } bluxcc:font-medium bluxcc:select-none`}
        >
          {label}
        </span>
      </div>
      {isRecent && (
        <div
          className={`bluxcc:px-2 bluxcc:py-1 bluxcc:text-xs bluxcc:font-normal`}
          style={{
            color: appearance.accentColor,
            borderRadius: appearance.borderRadius,
            backgroundColor: `${hexToRgba(appearance.accentColor, 0.15)}`,
          }}
        >
          {t('recent')}
        </div>
      )}

      {endArrow && size === 'medium' && (
        <span className="bluxcc:ml-auto bluxcc:flex bluxcc:items-center">
          <ArrowRight fill={`${hexToRgba(appearance.textColor, 0.7)}`} />
        </span>
      )}
    </button>
  );
};

export default ButtonCard;
