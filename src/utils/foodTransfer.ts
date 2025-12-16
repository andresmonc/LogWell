// Simple utility for transferring selected foods between screens
// This is a temporary solution to avoid navigation stack issues

import type { Food } from '../types/nutrition';

interface PendingFood {
  food: Food;
  timestamp: number;
}

let pendingFood: PendingFood | null = null;

export const setPendingFood = (food: Food) => {
  pendingFood = {
    food,
    timestamp: Date.now()
  };
};

export const getPendingFood = (): PendingFood | null => {
  return pendingFood;
};

export const clearPendingFood = () => {
  pendingFood = null;
};
