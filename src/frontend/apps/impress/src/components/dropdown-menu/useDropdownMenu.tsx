import { useState } from 'react';

export const useDropdownMenu = () => {
  const [isOpen, setIsOpen] = useState(false);

  const onOpenChange = (isOpen: boolean) => {
    setIsOpen(isOpen);
  };

  return {
    isOpen,
    onOpenChange,
  };
};
