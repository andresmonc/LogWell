import { useState } from 'react';
import type { FormModalState } from '../types/ui';

export function useFormModal(initialVisible = false): FormModalState {
  const [visible, setVisible] = useState(initialVisible);

  return {
    visible,
    open: () => setVisible(true),
    close: () => setVisible(false),
    toggle: () => setVisible(!visible),
  };
}