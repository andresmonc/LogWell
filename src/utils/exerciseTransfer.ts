// Simple utility for transferring exercises between screens
// This is a temporary solution to avoid navigation stack issues

interface PendingExercises {
  exercises: Array<{
    id: string;
    name: string;
    target: string;
  }>;
  timestamp: number;
}

let pendingExercises: PendingExercises | null = null;

export const setPendingExercises = (exercises: PendingExercises['exercises']) => {
  pendingExercises = {
    exercises,
    timestamp: Date.now()
  };
};

export const getPendingExercises = (): PendingExercises | null => {
  return pendingExercises;
};

export const clearPendingExercises = () => {
  pendingExercises = null;
};