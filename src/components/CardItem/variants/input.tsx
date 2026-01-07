import React, { useState, MouseEvent } from 'react';

import { useAppStore } from '../../../store';
import { useLang } from '../../../hooks/useLang';
import { validateInput } from '../../../utils/helpers';

type InputCardProps = {
  startIcon: React.ReactNode;
  onChange?: (value: string) => void;
  onEnter?: (value: string) => void;
  onSubmit?: (value: string) => void;
  inputType?: 'text' | 'password' | 'number' | 'email' | string;
};

const InputCard = ({
  startIcon,
  onChange,
  onEnter,

  onSubmit,
  inputType = 'text',
}: InputCardProps) => {
  const store = useAppStore((store) => store);
  const { appearance } = store.config;
  const t = useLang();

  const [isFocused, setIsFocused] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [isValid, setIsValid] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputValue(value);
    const valid = validateInput(inputType, value);
    setIsValid(valid);
    onChange?.(value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && isValid) {
      onEnter?.(inputValue);
    }
  };

  const handleMouseEnter = (e: MouseEvent<HTMLDivElement>) => {
    if (!isFocused) {
      e.currentTarget.style.borderColor = appearance.accentColor;
      e.currentTarget.style.transition = 'border-color 0.35s ease-in-out';
    }
  };
  const handleMouseLeave = (e: MouseEvent<HTMLDivElement>) => {
    if (!isFocused) {
      e.currentTarget.style.borderColor = appearance.borderColor;
    }
  };

  return (
    <div
      className={`bluxcc:flex bluxcc:transition-colors bluxcc:duration-300 bluxcc:h-14! bluxcc:w-full bluxcc:items-center bluxcc:py-2 bluxcc:pr-3 bluxcc:pl-2`}
      style={{
        fontFamily: appearance.fontFamily,
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
        style={{ cursor: 'text' }}
        className={`bluxcc:ml-4 bluxcc:relative bluxcc:flex bluxcc:h-full bluxcc:flex-1 bluxcc:items-center`}
      >
        <input
          id="bluxcc-input"
          type={inputType}
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={t('email')}
          className="bluxcc:mr-1 bluxcc:h-full bluxcc:w-full bluxcc:bg-transparent bluxcc:outline-hidden
              bluxcc:focus:outline-hidden bluxcc:text-base bluxcc:placeholder:text-base!"
          style={{
            color: appearance.textColor,
            fontFamily: appearance.fontFamily,
            ['--input-text-color' as any]:
              appearance.textColor as React.CSSProperties,
          }}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            setIsFocused(false);
            if (!validateInput('email', inputValue)) {
              setIsValid(false);
            }
          }}
        />
        <div className="bluxcc:flex bluxcc:h-10 bluxcc:w-25 bluxcc:items-center bluxcc:justify-center bluxcc:bg-transparent">
          <button
            id="bluxcc-button"
            disabled={!isValid}
            onClick={() => onSubmit?.(inputValue)}
            className={`bluxcc:absolute bluxcc:right-0 bluxcc:flex bluxcc:h-8 bluxcc:w-17! bluxcc:items-center bluxcc:justify-center bluxcc:border bluxcc:text-sm! bluxcc:font-medium bluxcc:transition-[border-radius,background,border-color] bluxcc:duration-200`}
            style={{
              background: appearance.fieldBackground,
              borderRadius: appearance.borderRadius,
              fontFamily: appearance.fontFamily,
              borderColor: isValid
                ? appearance.accentColor
                : appearance.borderColor,
              color: isValid ? appearance.accentColor : '#999999',
              borderWidth: appearance.borderWidth,
            }}
          >
            {t('submit')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default InputCard;
