import { useState } from 'react';

export function useMenuState() {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  const openMenu = (id: string) => {
    setOpenMenuId(id);
  };

  const closeMenu = () => {
    setOpenMenuId(null);
  };

  const isMenuOpen = (id: string) => {
    return openMenuId === id;
  };

  const toggleMenu = (id: string) => {
    setOpenMenuId(prev => prev === id ? null : id);
  };

  return {
    openMenuId,
    openMenu,
    closeMenu,
    isMenuOpen,
    toggleMenu
  };
}