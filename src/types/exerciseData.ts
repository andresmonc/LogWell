// ExerciseDB Data Types with normalized structure and local paths

export interface BodyPart {
  id: string;
  name: string;
}

export interface Equipment {
  id: string;
  name: string;
}

export interface Muscle {
  id: string;
  name: string;
}

// Raw exercise data from ExerciseDB API
export interface RawExercise {
  exerciseId: string;
  name: string;
  gifUrl: string;
  targetMuscles: string[];
  bodyParts: string[];
  equipments: string[];
  secondaryMuscles: string[];
  instructions: string[];
}

// Normalized exercise data with ID relationships and local paths
export interface Exercise {
  id: string; // Using exerciseId from raw data
  name: string;
  localGifPath: string; // Local path to downloaded GIF
  targetMuscleIds: string[]; // References to Muscle.id
  bodyPartIds: string[]; // References to BodyPart.id
  equipmentIds: string[]; // References to Equipment.id
  secondaryMuscleIds: string[]; // References to Muscle.id
  instructions: string[];
  
  // Additional computed fields for easier querying
  difficulty?: 'beginner' | 'intermediate' | 'advanced';
  primaryBodyPart?: string; // Most relevant body part
  primaryMuscle?: string; // Most relevant target muscle
}

// Complete exercise database structure
export interface ExerciseDatabase {
  bodyParts: BodyPart[];
  equipments: Equipment[];
  muscles: Muscle[];
  exercises: Exercise[];
  
  // Lookup maps for efficient querying
  bodyPartMap: Map<string, BodyPart>;
  equipmentMap: Map<string, Equipment>;
  muscleMap: Map<string, Muscle>;
  exerciseMap: Map<string, Exercise>;
}

// Query filters for searching exercises
export interface ExerciseFilters {
  bodyPartIds?: string[];
  equipmentIds?: string[];
  targetMuscleIds?: string[];
  difficulty?: ('beginner' | 'intermediate' | 'advanced')[];
  searchTerm?: string;
}

// Exercise search result
export interface ExerciseSearchResult {
  exercises: Exercise[];
  totalCount: number;
  appliedFilters: ExerciseFilters;
}

// For backward compatibility with existing workout types
export interface WorkoutExercise {
  id: string;
  name: string;
  target: string; // Primary body part name
  image?: string; // Local GIF path
  lastPerformed?: string;
  exerciseData?: Exercise; // Reference to full exercise data
}