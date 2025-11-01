import React, { useState } from 'react';

import InputCard from './variants/input';
import ButtonCard from './variants/button';

type CardItemProps = {
  variant?: 'social' | 'default' | 'input';
  size?: 'small' | 'medium';
  startIcon: React.ReactNode;
  endArrow?: boolean;
  isRecent?: boolean;
  label?: string;
  onClick?: () => void;
  onChange?: (value: string) => void;
  onEnter?: (value: string) => void;
  onSubmit?: (value: string) => void;
  inputType?: 'text' | 'password' | 'number' | 'email' | string;
};

const CardItem = ({
  variant = 'default',
  size = 'medium',
  startIcon,
  endArrow,
  isRecent = false,
  label,
  onClick,
  onChange,
  onEnter,
  onSubmit,
  inputType = 'text',
}: CardItemProps) => {
  return variant === 'input' ? (
    <InputCard
      onEnter={onEnter}
      onSubmit={onSubmit}
      onChange={onChange}
      inputType={inputType}
      startIcon={startIcon}
    />
  ) : (
    <ButtonCard
      size={size}
      label={label}
      onClick={onClick}
      isRecent={isRecent}
      endArrow={endArrow}
      startIcon={startIcon}
    />
  );
};

export default CardItem;
