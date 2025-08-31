import { useRef, useEffect } from "preact/hooks";
import htm from "htm";
import { h } from "preact";
import { IAppearance } from "../../types";

interface OTPInputProps {
  otp: string[];
  setOtp: (otp: string[]) => void;
  error?: boolean;
  appearance: IAppearance;
}

const html = htm.bind(h);

export function OTPInput({ otp, setOtp, error, appearance }: OTPInputProps) {
  const LENGTH = otp.length;

  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (error) {
      setTimeout(() => inputsRef.current[0]?.focus(), 1001);
    }
  }, [error]);

  const handleChange = (index: number, e: any) => {
    const value = e.target.value.replace(/\D/g, "");
    if (!value) return;

    const newOtp = [...otp];
    newOtp[index] = value[0];
    setOtp(newOtp);

    if (index < LENGTH - 1 && value) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: any) => {
    e.preventDefault();
    const pasteData = e.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, LENGTH);

    if (!pasteData) return;

    const newOtp = [
      ...pasteData.split(""),
      ...Array(LENGTH - pasteData.length).fill(""),
    ];
    setOtp(newOtp);
    setTimeout(() => inputsRef.current[LENGTH - 1]?.focus(), 0);
  };

  const handleKeyDown = (index: number, e: any) => {
    if (e.key === "Backspace") {
      const newOtp = [...otp];
      if (newOtp[index]) {
        newOtp[index] = "";
        setOtp(newOtp);
      } else if (index > 0) {
        inputsRef.current[index - 1]?.focus();
        newOtp[index - 1] = "";
        setOtp(newOtp);
      }
    }
  };

  const getInputStyle = (digit: string) => ({
    borderRadius: appearance.borderRadius,
    color: appearance.accentColor,
    background: appearance.fieldBackground,
    "--tw-ring-color": error ? "#FF6666" : appearance.accentColor,
    borderColor: error
      ? "#FF6666"
      : digit
      ? appearance.accentColor
      : appearance.borderColor,
    borderWidth: appearance.outlineWidth ?? appearance.borderWidth,
  });

  return html`
    <div class="bluxcc:flex bluxcc:gap-1">
      ${otp.map(
        (digit, index) => html`
          <input
            autofocus=${index === 0}
            key=${index}
            ref=${(el: any) => (inputsRef.current[index] = el)}
            type="text"
            inputmode="numeric"
            maxlength="1"
            value=${digit}
            onInput=${(e: any) => handleChange(index, e)}
            onPaste=${handlePaste}
            onKeyDown=${(e: any) => handleKeyDown(index, e)}
            class="bluxcc:h-14 bluxcc:w-12 bluxcc:border bluxcc:text-center bluxcc:text-lg bluxcc:outline-hidden bluxcc:focus:ring-1"
            style=${getInputStyle(digit)}
          />
        `
      )}
    </div>
  `;
}
