export interface WorkoutSet {
  id: string;
  weight: string;
  reps: string;
  completed: boolean;
  previousWeight?: string;
  previousReps?: string;
}

export interface WorkoutExercise {
  id: string;
  name: string;
  timerSeconds: number;
  sets: WorkoutSet[];
  notes: string;
}

export interface WorkoutSession {
  id?: string;
  routineId: string;
  routineName: string;
  startTime: Date;
  exercises: WorkoutExercise[];
  completed?: boolean;
  completedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface RoutineExercise {
  name: string;
  targetSets: number;
}

export interface WorkoutRoutine {
  id: string;
  name: string;
  exercises: RoutineExercise[];
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkoutStats {
  totalSets: number;
  totalVolume: number;
  duration: number;
}