export interface WorkoutSet {
  id: string;
  // Strength training fields
  weight: string;
  reps: string;
  // Cardio training fields
  duration?: string; // in minutes
  distance?: string; // in miles or km
  completed: boolean;
  previousWeight?: string;
  previousReps?: string;
  previousDuration?: string;
  previousDistance?: string;
}

export interface WorkoutExercise {
  id: string;
  name: string;
  exerciseType: 'strength' | 'cardio'; // Determines which fields to use in sets
  catalogExerciseId?: string; // Reference to exercise catalog for exercise details
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

export interface WorkoutRoutine {
  id: string;
  name: string;
  exercises: WorkoutExercise[];
  createdAt: Date;
  updatedAt: Date;
}

export interface WorkoutStats {
  totalSets: number;
  totalVolume: number; // For strength: weight × reps
  duration: number; // Total workout duration in seconds
  totalCardioDistance?: number; // Total distance for cardio exercises
  totalCardioDuration?: number; // Total duration for cardio exercises (in minutes)
}