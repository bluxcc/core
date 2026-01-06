import React, {
  useRef,
  useEffect,
  ChangeEvent,
  KeyboardEvent,
  ClipboardEvent,
} from 'react';

import { useAppStore } from '../../store';

interface OTPInputProps {
  otp: string[];
  setOtp: (otp: string[]) => void;
  error?: boolean;
}

const OTPInput: React.FC<OTPInputProps> = ({ otp, setOtp, error }) => {
  const LENGTH = otp.length;
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);
  const appearance = useAppStore((store) => store.config.appearance);

  useEffect(() => {
    if (error) {
      setTimeout(() => inputsRef.current[0]?.focus(), 1001);
    }
  }, [error]);

  const handleChange = (
    index: number,
    e: ChangeEvent<HTMLInputElement>,
  ): void => {
    const value = e.target.value.replace(/\D/g, '');
    if (!value) return;

    const newOtp = [...otp];
    newOtp[index] = value[0];
    setOtp(newOtp);

    if (index < LENGTH - 1 && value) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>): void => {
    e.preventDefault();
    const pasteData = e.clipboardData
      .getData('text')
      .replace(/\D/g, '')
      .slice(0, LENGTH);
    if (!pasteData) return;

    const newOtp = [
      ...pasteData.split(''),
      ...Array(LENGTH - pasteData.length).fill(''),
    ];
    setOtp(newOtp);
    setTimeout(() => inputsRef.current[LENGTH - 1]?.focus(), 0);
  };

  const handleKeyDown = (
    index: number,
    e: KeyboardEvent<HTMLInputElement>,
  ): void => {
    if (e.key === 'Backspace') {
      const newOtp = [...otp];
      if (newOtp[index]) {
        newOtp[index] = '';
        setOtp(newOtp);
      } else if (index > 0) {
        inputsRef.current[index - 1]?.focus();
        newOtp[index - 1] = '';
        setOtp(newOtp);
      }
    }
  };

  const getInputStyle = (digit: string): React.CSSProperties =>
    ({
      fontFamily: appearance.fontFamily,
      borderRadius: appearance.borderRadius,
      color: appearance.accentColor,
      background: appearance.fieldBackground,
      '--tw-ring-color': error ? '#FF6666' : appearance.accentColor,
      borderColor: error
        ? '#FF6666'
        : digit
          ? appearance.accentColor
          : appearance.borderColor,
      borderWidth: appearance.borderWidth,
    }) as React.CSSProperties;

  return (
    <div className="bluxcc:flex bluxcc:gap-1">
      {otp.map((digit, index) => (
        <input
          autoFocus={index === 0}
          key={index}
          ref={(el) => {
            inputsRef.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(index, e)}
          onPaste={handlePaste}
          onKeyDown={(e) => handleKeyDown(index, e)}
          className="bluxcc:h-14 bluxcc:w-12 bluxcc:border bluxcc:text-center bluxcc:text-lg bluxcc:outline-hidden bluxcc:focus:ring-1"
          style={getInputStyle(digit)}
        />
      ))}
    </div>
  );
};

export default OTPInput;
