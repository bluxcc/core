import React, { useEffect, useRef, useState } from 'react';

import { useIsMobile } from '../../hooks/useIsMobile';
import { useDynamicHeight } from '../../hooks/useDynamicHeight';
import { useModalAnimation } from '../../hooks/useModalAnimation';
import { IAppearance } from '../../types';
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll';

interface ModalProps {
  isOpen: boolean;
  isSticky?: boolean;
  onClose?: () => void;
  children: React.ReactNode;
  appearance: IAppearance;
}

const Modal = ({
  isOpen,
  onClose = () => {},
  children,
  isSticky = false,
  appearance,
}: ModalProps) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const isMobile = useIsMobile();
  const { isClosing, handleClose } = useModalAnimation(isOpen, 300);
  const { height, isHeightReady, reset } = useDynamicHeight(contentRef, [
    isOpen,
    children,
  ]);

  useEffect(() => {
    if (isOpen && isMobile) {
      setIsAnimating(false);

      const id = requestAnimationFrame(() => {
        setIsAnimating(true);
      });

      return () => cancelAnimationFrame(id);
    }
  }, [isOpen, isMobile]);

  useLockBodyScroll(isOpen);

  useEffect(() => {
    if (!isOpen) reset();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* backdrop */}
      <div
        className={`bluxcc:fixed bluxcc:inset-0 bluxcc:z-40 bluxcc:bg-black/20 bluxcc:!backdrop-blur-[1px] ${
          isClosing && !isSticky
            ? 'bluxcc:animate-fadeOut'
            : 'bluxcc:animate-fadeIn'
        }`}
        onClick={isSticky ? () => {} : onClose}
      />

      {/* modal */}
      <div
        className={`bluxcc:absolute bluxcc:inset-0 bluxcc:z-9999 bluxcc:flex bluxcc:items-center bluxcc:justify-center ${
          isClosing && !isSticky && 'bluxcc:animate-fadeOut'
        }`}
        onClick={(e) =>
          e.target === e.currentTarget && handleClose(onClose) && !isSticky
        }
      >
        <div
          className={`bluxcc:box-border bluxcc:!shadow-[0px_4px_80px_0px_#00000008] ${
            isMobile
              ? 'bluxcc:fixed bluxcc:bottom-0 bluxcc:left-0 bluxcc:w-full bluxcc:!rounded-b-none'
              : 'bluxcc:relative bluxcc:!w-[360px]'
          }`}
          style={{
            height:
              typeof height === 'number'
                ? `${isMobile ? height + 20 : height}px`
                : height,
            transition: isHeightReady
              ? `height 350ms ease-in-out, border-radius 350ms, opacity 350ms ease-out, outline 350ms ease-out, color 350ms ease-out${
                  isMobile ? ', transform 350ms ease-out' : ''
                }`
              : `border-radius 350ms, opacity 350ms ease-out${
                  isMobile ? ', transform 350ms ease-out' : ''
                }`,
            transform: isMobile
              ? isClosing
                ? 'translateY(100%)'
                : isAnimating
                  ? 'translateY(0%)'
                  : 'translateY(80%)'
              : '',
            background: appearance.background,
            opacity: isClosing && !isSticky ? '0' : '1',
            color: appearance.textColor,
            fontFamily: appearance.font,
            letterSpacing: '-0.04px',
            borderRadius: appearance.borderRadius,
            outline: `${appearance.outlineWidth} 'solid' ${appearance.borderColor}`,
            overflow: 'hidden',
          }}
        >
          <div
            ref={contentRef}
            className="bluxcc:px-6 bluxcc:pb-4"
            style={{
              fontFamily: appearance.font,
              opacity: isHeightReady ? 1 : 0,
              transition: 'opacity 200ms ease-in-out',
            }}
          >
            {children}
          </div>
        </div>
      </div>
    </>
  );
};

export default Modal;
