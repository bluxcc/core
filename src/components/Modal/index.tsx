import React, { useEffect, useRef, useState } from 'react';

import { IAppearance } from '../../types';
import { useIsMobile } from '../../hooks/useIsMobile';
import { useDynamicHeight } from '../../hooks/useDynamicHeight';
import { useModalAnimation } from '../../hooks/useModalAnimation';
import { useLockBodyScroll } from '../../hooks/useLockBodyScroll';

interface ModalProps {
  isOpen: boolean;
  isSticky?: boolean;
  onClose?: () => void;
  children: React.ReactNode;
  appearance: IAppearance;
  isPersistent: boolean;
}

const Modal = ({
  isOpen,
  onClose = () => { },
  children,
  isSticky = false,
  appearance,
  isPersistent,
}: ModalProps) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const isMobile = useIsMobile();
  const { isClosing, handleClose } = useModalAnimation(isOpen, 250);
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
      {!isPersistent && (
        <div
          className={`bluxcc:fixed bluxcc:inset-0 bluxcc:z-40 ${isClosing && !isSticky
              ? 'bluxcc:animate-fadeOut'
              : 'bluxcc:animate-fadeIn'
            }`}
          style={{
            backdropFilter: `blur(${appearance.backdropBlur})`,
            WebkitBackdropFilter: `blur(${appearance.backdropBlur})`,
            backgroundColor: appearance.backdropColor,
          }}
          onClick={isSticky ? () => { } : onClose}
        />
      )}

      {/* modal */}
      <div
        className={`bluxcc:absolute bluxcc:inset-0 bluxcc:z-9999999 bluxcc:flex bluxcc:items-center bluxcc:justify-center ${isClosing && !isSticky && 'bluxcc:animate-fadeOut'
          }`}
        onClick={(e) => {
          if (e.target === e.currentTarget && !isSticky) {
            handleClose(onClose);
          }
        }}
      >
        <div
          id="bluxcc-modal"
          className={`bluxcc:box-border ${isMobile
              ? 'bluxcc:fixed bluxcc:bottom-0 bluxcc:left-0 bluxcc:w-full bluxcc:rounded-b-none!'
              : 'bluxcc:relative bluxcc:w-90!'
            }`}
          style={{
            height:
              typeof height === 'number'
                ? `${isMobile ? height + 20 : height}px`
                : height,
            transition: isHeightReady
              ? `height 250ms ease-in-out, border-radius 250ms, opacity 250ms ease-out, outline 250ms ease-out, color 250ms ease-out${isMobile ? ', transform 250ms ease-out' : ''
              }`
              : `border-radius 250ms, opacity 250ms ease-out${isMobile ? ', transform 250ms ease-out' : ''
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
            fontFamily: appearance.fontFamily,
            letterSpacing: '-0.04px',
            borderRadius: appearance.outlineRadius ?? appearance.borderRadius,
            outline: `${appearance.outlineWidth ?? appearance.borderWidth} solid ${appearance.outlineColor ?? appearance.borderColor}`,
            overflow: 'hidden',
            boxShadow: appearance.boxShadow,
          }}
        >
          <div
            ref={contentRef}
            className="bluxcc:px-6 bluxcc:pb-4"
            style={{
              fontFamily: appearance.fontFamily,
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
