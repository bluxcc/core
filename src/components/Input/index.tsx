import React, { useState, MouseEvent } from 'react';

import { IAppearance } from '../../types';
import { useAppStore } from '../../store';
import { hexToRgba } from '../../utils/helpers';
import { useLang } from '../../hooks/useLang';

type InputFieldProps = {
  label?: string;
  placeholder?: string;
  error?: string;
  type?: 'text' | 'password' | 'number';
  iconRight?: React.ReactNode;
  iconLeft?: React.ReactNode;
  button?: string | React.ReactNode;
  onButtonClick?: () => void;
  value?: string;
  autoFocus?: boolean;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  customLabel?: React.ReactNode;
  className?: string;
  optionalField?: boolean;
};

type CustomButtonProps = {
  button: string | React.ReactNode;
  onButtonClick?: () => void;
  appearance: IAppearance;
};

const CustomButton = ({
  button,
  onButtonClick,
  appearance,
}: CustomButtonProps) => {
  return (
    <button
      onClick={onButtonClick}
      id="bluxcc-button"
      style={{
        borderRadius: appearance.borderRadius,
        color: appearance.textColor,
        borderColor: appearance.borderColor,
        background: appearance.background,
        borderWidth: appearance.borderWidth,
      }}
      className="bluxcc:border bluxcc:px-3! bluxcc:py-1! bluxcc:text-sm! bluxcc:font-medium bluxcc:transition-all bluxcc:duration-300"
    >
      {button}
    </button>
  );
};

const InputField = ({
  label,
  autoFocus,
  type = 'text',
  placeholder = 'Input',
  error,
  iconRight,
  iconLeft,
  button,
  optionalField = false,
  onButtonClick,
  customLabel,
  value,
  className,
  onChange,
}: InputFieldProps) => {
  const appearance = useAppStore((store) => store.config.appearance);
  const [isFocused, setIsFocused] = useState(false);
  const t = useLang();

  const onMouseEnter = (e: MouseEvent<HTMLDivElement>) => {
    if (!isFocused && !error) {
      e.currentTarget.style.borderColor = appearance.accentColor;
      e.currentTarget.style.transition = 'border-color 0.35s ease-in-out';
    }
  };

  const onMouseLeave = (e: MouseEvent<HTMLDivElement>) => {
    if (!isFocused) {
      e.currentTarget.style.borderColor = error
        ? '#ec2929'
        : appearance.borderColor;
    }
  };

  const getBorderAndRingColor = () => {
    if (error) return '#ec2929';
    if (isFocused) return appearance.accentColor;
    return appearance.borderColor;
  };

  return (
    <div className="bluxcc:flex bluxcc:w-full bluxcc:flex-col">
      {label && (
        <label
          style={{ color: error ? '#ec2929' : appearance.textColor }}
          className={`bluxcc:mb-2 bluxcc:ml-4 bluxcc:flex bluxcc:justify-between bluxcc:text-xs`}
        >
          <span>
            {label}{' '}
            {optionalField && (
              <span
                style={{ color: hexToRgba(appearance.textColor, 0.7) }}
                className="bluxcc:text-[10px]"
              >
                ({t('optional')})
              </span>
            )}
          </span>
          <span>{customLabel}</span>
        </label>
      )}
      <div
        className={`bluxcc:flex bluxcc:h-14 bluxcc:w-full bluxcc:items-center bluxcc:px-4 bluxcc:py-2 bluxcc:transition-all bluxcc:duration-300 ${className}`}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
        style={
          {
            '--tw-ring-color': getBorderAndRingColor(),
            border: `${appearance.borderWidth} solid ${getBorderAndRingColor()}`,
            borderRadius: appearance.borderRadius,
            backgroundColor: appearance.fieldBackground,
          } as React.CSSProperties
        }
      >
        {iconLeft && <div className="bluxcc:mr-2">{iconLeft}</div>}
        <input
          id="bluxcc-input"
          autoComplete="off"
          min={type === 'number' ? 1 : undefined}
          type={type}
          autoFocus={autoFocus}
          value={value}
          placeholder={placeholder}
          className="bluxcc:mr-2! bluxcc:bg-transparent bluxcc:outline-hidden bluxcc:text-base bluxcc:font-medium"
          style={{
            fontFamily: appearance.fontFamily,
            color: appearance.textColor,
            width: !button ? '100%' : '90%',
          }}
          onChange={onChange}
        />
        {button && (
          <CustomButton
            button={button}
            onButtonClick={onButtonClick}
            appearance={appearance}
          />
        )}
        {iconRight && <div className="bluxcc:ml-4">{iconRight}</div>}
      </div>
      {!optionalField && (
        <div className="bluxcc:mt-1 bluxcc:text-xs bluxcc:ml-4 bluxcc:h-4">
          {error ? <p className={`bluxcc:text-alert-error`}>{error}</p> : ''}
        </div>
      )}
    </div>
  );
};

export default InputField;
