import { useEffect, useState } from 'react';

interface ModalAnimationState {
  isOpening: boolean;
  isClosing: boolean;
}

export const useModalAnimation = (isOpen: boolean, duration = 300) => {
  const [state, setState] = useState<ModalAnimationState>({
    isOpening: false,
    isClosing: false,
  });

  useEffect(() => {
    if (isOpen) {
      setState({ isOpening: true, isClosing: false });
      const timer = setTimeout(() => {
        setState({ isOpening: false, isClosing: false });
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [isOpen, duration]);

  const handleClose = (onClose: () => void) => {
    setState({ isOpening: false, isClosing: true });
    const timer = setTimeout(() => {
      setState({ isOpening: false, isClosing: false });
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  };

  return {
    ...state,
    handleClose,
  };
};
