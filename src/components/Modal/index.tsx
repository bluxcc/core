import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';

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
  isBodyMount: boolean;
  /** Parent passed to createConfig. Used to pin horizontal placement. */
  mountElement?: HTMLElement;
}

const syncOverlayToParent = (overlay: HTMLDivElement, host: HTMLElement) => {
  const { left, width } = host.getBoundingClientRect();
  const nextLeft = `${left}px`;
  const nextWidth = `${width}px`;

  if (overlay.style.left !== nextLeft) {
    overlay.style.left = nextLeft;
  }

  if (overlay.style.width !== nextWidth) {
    overlay.style.width = nextWidth;
  }
};

const Modal = ({
  isOpen,
  onClose = () => { },
  children,
  isSticky = false,
  appearance,
  isPersistent,
  isBodyMount,
  mountElement,
}: ModalProps) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const isMobile = useIsMobile();
  const { isClosing, handleClose } = useModalAnimation(isOpen, 250);
  const { height, isHeightReady, reset } = useDynamicHeight(contentRef, [
    isOpen,
    children,
  ]);

  // Parent mount: stay in the viewport vertically (middle of the page) while
  // matching the parent's horizontal box, so a sidebar layout can offset the
  // modal without it scrolling off-screen with the parent.
  useLayoutEffect(() => {
    if (isBodyMount || !isOpen || !mountElement) return;

    const overlay = overlayRef.current;

    if (!overlay) return;

    const sync = () => syncOverlayToParent(overlay, mountElement);

    sync();

    // Keep left/width in sync during CSS animations and other layout shifts
    // that move the parent without changing its own size (so ResizeObserver
    // alone would miss them).
    let frame = requestAnimationFrame(function tick() {
      sync();
      frame = requestAnimationFrame(tick);
    });

    window.addEventListener('resize', sync);
    window.addEventListener('scroll', sync, true);
    window.visualViewport?.addEventListener('resize', sync);
    window.visualViewport?.addEventListener('scroll', sync);

    const observer = new ResizeObserver(sync);
    for (
      let node: HTMLElement | null = mountElement;
      node;
      node = node.parentElement
    ) {
      observer.observe(node);
    }

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('resize', sync);
      window.removeEventListener('scroll', sync, true);
      window.visualViewport?.removeEventListener('resize', sync);
      window.visualViewport?.removeEventListener('scroll', sync);
      observer.disconnect();
      overlay.style.left = '';
      overlay.style.width = '';
    };
  }, [isBodyMount, isOpen, mountElement]);

  useLayoutEffect(() => {
    const overlay = overlayRef.current;

    if (!overlay) return;

    overlay.style.pointerEvents = isPersistent ? 'none' : '';

    return () => {
      overlay.style.pointerEvents = '';
    };
  }, [isOpen, isPersistent]);

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
          className={`bluxcc:fixed bluxcc:inset-0 bluxcc:z-9999998 ${isClosing && !isSticky
              ? 'bluxcc:animate-fadeOut'
              : 'bluxcc:animate-fadeIn'
            }`}
          style={{
            backdropFilter: `blur(${appearance.backdropBlur})`,
            WebkitBackdropFilter: `blur(${appearance.backdropBlur})`,
            backgroundColor: appearance.backdropColor,
          }}
          onClick={(e) => {
            e.stopPropagation();
            if (!isSticky) {
              onClose();
            }
          }}
        />
      )}

      {/* modal */}
      <div
        ref={overlayRef}
        className={`${isBodyMount
            ? 'bluxcc:fixed bluxcc:inset-0'
            : 'bluxcc:fixed bluxcc:top-0 bluxcc:bottom-0'
          } bluxcc:z-9999999 bluxcc:flex bluxcc:items-center bluxcc:justify-center ${isClosing && !isSticky && 'bluxcc:animate-fadeOut'
          }`}
        onClick={(e) => {
          e.stopPropagation();
          if (e.target === e.currentTarget && !isSticky) {
            handleClose(onClose);
          }
        }}
      >
        <div
          id="bluxcc-modal"
          onClick={(e) => e.stopPropagation()}
          className={`bluxcc:box-border ${isMobile
              ? 'bluxcc:fixed bluxcc:bottom-0 bluxcc:left-0 bluxcc:w-full bluxcc:rounded-b-none!'
              : 'bluxcc:relative bluxcc:w-90!'
            }`}
          style={{
            pointerEvents: isPersistent ? 'auto' : undefined,
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
