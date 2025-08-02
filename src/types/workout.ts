export interface WorkoutSet {
  id: string;
  weight: string;
  reps: string;
  completed: boolean;
  previousWeight?: string;
  previousReps?: string;
}

export interface Exercise {
  id: string;
  name: string;
  sets: WorkoutSet[];
  notes: string;
}

export interface WorkoutSession {
  id?: string;
  routineId: string;
  routineName: string;
  startTime: Date;
  exercises: Exercise[];
  completed?: boolean;
  completedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface WorkoutRoutine {
  id: string;
  name: string;
  exercises: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkoutStats {
  totalSets: number;
  totalVolume: number;
  duration: number;
}