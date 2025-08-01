import { useState } from 'react';

export interface FormModalState {
  visible: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

export function useFormModal(initialVisible = false): FormModalState {
  const [visible, setVisible] = useState(initialVisible);

  return {
    visible,
    open: () => setVisible(true),
    close: () => setVisible(false),
    toggle: () => setVisible(!visible),
  };
}