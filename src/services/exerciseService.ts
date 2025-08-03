import { 
  ExerciseDatabase, 
  Exercise, 
  BodyPart, 
  Equipment, 
  Muscle, 
  ExerciseFilters, 
  ExerciseSearchResult,
  WorkoutExercise 
} from '../types/exerciseData';

class ExerciseService {
  private database: ExerciseDatabase | null = null;
  private isLoading = false;
  private loadPromise: Promise<void> | null = null;

  /**
   * Initialize the exercise database by loading all data
   */
  async initialize(): Promise<void> {
    if (this.database) return;
    if (this.isLoading && this.loadPromise) return this.loadPromise;

    this.isLoading = true;
    this.loadPromise = this.loadData();
    await this.loadPromise;
    this.isLoading = false;
  }

  /**
   * Load exercise data from JSON files
   */
  private async loadData(): Promise<void> {
    try {
      // Import the transformed data
      const bodyPartsData = require('../data/exercises/bodyparts-normalized.json') as BodyPart[];
      const equipmentsData = require('../data/exercises/equipments-normalized.json') as Equipment[];
      const musclesData = require('../data/exercises/muscles-normalized.json') as Muscle[];
      const exercisesData = require('../data/exercises/exercises.json') as Exercise[];

      // Create lookup maps for efficient querying
      const bodyPartMap = new Map(bodyPartsData.map(bp => [bp.id, bp]));
      const equipmentMap = new Map(equipmentsData.map(eq => [eq.id, eq]));
      const muscleMap = new Map(musclesData.map(m => [m.id, m]));
      const exerciseMap = new Map(exercisesData.map(ex => [ex.id, ex]));

      this.database = {
        bodyParts: bodyPartsData,
        equipments: equipmentsData,
        muscles: musclesData,
        exercises: exercisesData,
        bodyPartMap,
        equipmentMap,
        muscleMap,
        exerciseMap
      };

      console.log(`Loaded ${exercisesData.length} exercises with full database`);
    } catch (error) {
      console.error('Failed to load exercise data:', error);
      throw new Error('Exercise data not available. Run the download script first.');
    }
  }

  /**
   * Get all body parts
   */
  async getBodyParts(): Promise<BodyPart[]> {
    await this.initialize();
    return this.database!.bodyParts;
  }

  /**
   * Get all equipment types
   */
  async getEquipments(): Promise<Equipment[]> {
    await this.initialize();
    return this.database!.equipments;
  }

  /**
   * Get all muscles
   */
  async getMuscles(): Promise<Muscle[]> {
    await this.initialize();
    return this.database!.muscles;
  }

  /**
   * Get exercise by ID
   */
  async getExerciseById(exerciseId: string): Promise<Exercise | undefined> {
    await this.initialize();
    return this.database!.exerciseMap.get(exerciseId);
  }

  /**
   * Search exercises with filters
   */
  async searchExercises(filters: ExerciseFilters = {}): Promise<ExerciseSearchResult> {
    await this.initialize();
    
    let filteredExercises = [...this.database!.exercises];
    
    // Apply filters
    if (filters.bodyPartIds && filters.bodyPartIds.length > 0) {
      filteredExercises = filteredExercises.filter(exercise =>
        exercise.bodyPartIds.some(id => filters.bodyPartIds!.includes(id))
      );
    }

    if (filters.equipmentIds && filters.equipmentIds.length > 0) {
      filteredExercises = filteredExercises.filter(exercise =>
        exercise.equipmentIds.some(id => filters.equipmentIds!.includes(id))
      );
    }

    if (filters.targetMuscleIds && filters.targetMuscleIds.length > 0) {
      filteredExercises = filteredExercises.filter(exercise =>
        exercise.targetMuscleIds.some(id => filters.targetMuscleIds!.includes(id))
      );
    }

    if (filters.difficulty && filters.difficulty.length > 0) {
      filteredExercises = filteredExercises.filter(exercise =>
        exercise.difficulty && filters.difficulty!.includes(exercise.difficulty)
      );
    }

    if (filters.searchTerm) {
      const searchTerm = filters.searchTerm.toLowerCase();
      filteredExercises = filteredExercises.filter(exercise =>
        exercise.name.toLowerCase().includes(searchTerm) ||
        exercise.instructions.some(instruction => 
          instruction.toLowerCase().includes(searchTerm)
        )
      );
    }

    return {
      exercises: filteredExercises,
      totalCount: filteredExercises.length,
      appliedFilters: filters
    };
  }

  /**
   * Get exercises by body part name
   */
  async getExercisesByBodyPart(bodyPartName: string): Promise<Exercise[]> {
    await this.initialize();
    
    const bodyPart = this.database!.bodyParts.find(bp => 
      bp.name.toLowerCase() === bodyPartName.toLowerCase()
    );
    
    if (!bodyPart) return [];
    
    return this.database!.exercises.filter(exercise =>
      exercise.bodyPartIds.includes(bodyPart.id)
    );
  }

  /**
   * Get exercises by equipment name
   */
  async getExercisesByEquipment(equipmentName: string): Promise<Exercise[]> {
    await this.initialize();
    
    const equipment = this.database!.equipments.find(eq => 
      eq.name.toLowerCase() === equipmentName.toLowerCase()
    );
    
    if (!equipment) return [];
    
    return this.database!.exercises.filter(exercise =>
      exercise.equipmentIds.includes(equipment.id)
    );
  }

  /**
   * Get popular exercises (first 50 for now - could be enhanced with usage tracking)
   */
  async getPopularExercises(limit = 50): Promise<Exercise[]> {
    await this.initialize();
    return this.database!.exercises.slice(0, limit);
  }

  /**
   * Convert Exercise to WorkoutExercise for backward compatibility
   */
  convertToWorkoutExercise(exercise: Exercise): WorkoutExercise {
    return {
      id: exercise.id,
      name: exercise.name,
      target: exercise.primaryBodyPart || 'General',
      image: exercise.localGifPath,
      exerciseData: exercise
    };
  }

  /**
   * Search exercises and return in WorkoutExercise format for compatibility
   */
  async searchWorkoutExercises(searchTerm?: string, bodyPart?: string): Promise<WorkoutExercise[]> {
    const filters: ExerciseFilters = {};
    
    if (searchTerm) {
      filters.searchTerm = searchTerm;
    }
    
    if (bodyPart) {
      const bodyPartObj = this.database?.bodyParts.find(bp => 
        bp.name.toLowerCase() === bodyPart.toLowerCase()
      );
      if (bodyPartObj) {
        filters.bodyPartIds = [bodyPartObj.id];
      }
    }

    const result = await this.searchExercises(filters);
    return result.exercises.map(exercise => this.convertToWorkoutExercise(exercise));
  }

  /**
   * Get recommended exercises based on a given exercise (same muscle groups)
   */
  async getRecommendedExercises(exerciseId: string, limit = 5): Promise<Exercise[]> {
    await this.initialize();
    
    const exercise = await this.getExerciseById(exerciseId);
    if (!exercise) return [];

    // Find exercises that target similar muscles
    const similarExercises = this.database!.exercises
      .filter(ex => 
        ex.id !== exerciseId && // Exclude the same exercise
        ex.targetMuscleIds.some(muscleId => exercise.targetMuscleIds.includes(muscleId))
      )
      .slice(0, limit);

    return similarExercises;
  }

  /**
   * Get database statistics
   */
  async getStats() {
    await this.initialize();
    
    return {
      totalExercises: this.database!.exercises.length,
      totalBodyParts: this.database!.bodyParts.length,
      totalEquipments: this.database!.equipments.length,
      totalMuscles: this.database!.muscles.length,
      difficultyBreakdown: {
        beginner: this.database!.exercises.filter(ex => ex.difficulty === 'beginner').length,
        intermediate: this.database!.exercises.filter(ex => ex.difficulty === 'intermediate').length,
        advanced: this.database!.exercises.filter(ex => ex.difficulty === 'advanced').length,
      }
    };
  }
}

// Export singleton instance
export const exerciseService = new ExerciseService();