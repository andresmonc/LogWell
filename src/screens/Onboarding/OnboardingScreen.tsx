import React, { useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Dimensions,
  Platform,
  Animated,
  TouchableOpacity,
} from 'react-native';
import {
  Text,
  Button,
  useTheme,
  TextInput,
  SegmentedButtons,
  Surface,
  ProgressBar,
  IconButton,
  Chip,
} from 'react-native-paper';
import { useNutritionStore } from '../../stores/nutritionStore';
import type { ActivityLevel, FitnessGoal, WeightLossRate, NutritionGoals } from '../../types/nutrition';
import { calculateBMR, calculateTDEE, calculateGoalsFromTDEE } from '../../utils/nutritionCalculators';
import {
  cmToInches,
  inchesToCm,
  kgToLbs,
  lbsToKg,
  inchesToFeetInches,
  feetInchesToInches,
  type UnitSystem,
} from '../../utils/unitConversions';
import { showError } from '../../utils/alertUtils';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Onboarding steps
type OnboardingStep = 'welcome' | 'goal' | 'weight-loss-rate' | 'profile' | 'summary';

const STEPS: OnboardingStep[] = ['welcome', 'goal', 'weight-loss-rate', 'profile', 'summary'];

interface OnboardingData {
  fitnessGoal: FitnessGoal;
  weightLossRate: WeightLossRate;
  name: string;
  age: string;
  gender: 'male' | 'female' | undefined;
  heightFeet: string;
  heightInches: string;
  heightCm: string;
  weight: string;
  activityLevel: ActivityLevel;
  unitSystem: UnitSystem;
}

export default function OnboardingScreen() {
  const theme = useTheme();
  const { createUserProfile, updateUserProfile, userProfile } = useNutritionStore();
  
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  
  const [currentStep, setCurrentStep] = useState<OnboardingStep>('welcome');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [data, setData] = useState<OnboardingData>({
    fitnessGoal: 'maintenance',
    weightLossRate: 1,
    name: '',
    age: '',
    gender: undefined,
    heightFeet: '',
    heightInches: '',
    heightCm: '',
    weight: '',
    activityLevel: 'moderately-active',
    unitSystem: 'imperial',
  });

  const currentStepIndex = STEPS.indexOf(currentStep);
  const progress = (currentStepIndex + 1) / STEPS.length;

  // Skip weight-loss-rate step if not weight loss goal
  const getNextStep = (fromStep: OnboardingStep): OnboardingStep | null => {
    const currentIndex = STEPS.indexOf(fromStep);
    let nextIndex = currentIndex + 1;
    
    // Skip weight-loss-rate if not weight loss goal
    if (STEPS[nextIndex] === 'weight-loss-rate' && data.fitnessGoal !== 'weight-loss') {
      nextIndex++;
    }
    
    return nextIndex < STEPS.length ? STEPS[nextIndex] : null;
  };

  const getPreviousStep = (fromStep: OnboardingStep): OnboardingStep | null => {
    const currentIndex = STEPS.indexOf(fromStep);
    let prevIndex = currentIndex - 1;
    
    // Skip weight-loss-rate when going back if not weight loss goal
    if (STEPS[prevIndex] === 'weight-loss-rate' && data.fitnessGoal !== 'weight-loss') {
      prevIndex--;
    }
    
    return prevIndex >= 0 ? STEPS[prevIndex] : null;
  };

  const animateTransition = (callback: () => void) => {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
    
    setTimeout(callback, 150);
  };

  const goToNextStep = () => {
    const nextStep = getNextStep(currentStep);
    if (nextStep) {
      animateTransition(() => setCurrentStep(nextStep));
    }
  };

  const goToPreviousStep = () => {
    const prevStep = getPreviousStep(currentStep);
    if (prevStep) {
      animateTransition(() => setCurrentStep(prevStep));
    }
  };

  const handleComplete = async () => {
    setIsSubmitting(true);
    
    try {
      // Convert height to cm
      let heightCm: number | undefined;
      if (data.unitSystem === 'imperial') {
        const feet = parseFloat(data.heightFeet) || 0;
        const inches = parseFloat(data.heightInches) || 0;
        if (feet > 0 || inches > 0) {
          const totalInches = feetInchesToInches(feet, inches);
          heightCm = inchesToCm(totalInches);
        }
      } else {
        heightCm = parseFloat(data.heightCm) || undefined;
      }
      
      // Convert weight to kg
      let weightKg: number | undefined;
      if (data.unitSystem === 'imperial') {
        const weightLbs = parseFloat(data.weight);
        if (weightLbs) {
          weightKg = lbsToKg(weightLbs);
        }
      } else {
        weightKg = parseFloat(data.weight) || undefined;
      }
      
      const age = parseFloat(data.age);
      
      // Calculate goals based on profile
      let goals: NutritionGoals;
      let goalsSource: 'default' | 'calculated' = 'default';
      
      if (age && heightCm && weightKg && data.gender && data.activityLevel) {
        const bmr = calculateBMR(weightKg, heightCm, age, data.gender);
        const tdee = calculateTDEE(bmr, data.activityLevel);
        goals = calculateGoalsFromTDEE(tdee, 'balanced', data.fitnessGoal, data.weightLossRate);
        goalsSource = 'calculated';
      } else {
        goals = {
          calories: 2000,
          protein: 150,
          carbs: 250,
          fat: 67,
        };
      }
      
      const profileData = {
        name: data.name.trim() || undefined,
        age: age || undefined,
        height: heightCm,
        weight: weightKg,
        gender: data.gender,
        activityLevel: data.activityLevel,
        unitSystem: data.unitSystem,
        fitnessGoal: data.fitnessGoal,
        weightLossRate: data.fitnessGoal === 'weight-loss' ? data.weightLossRate : undefined,
        goals,
        goalsSource,
        onboardingCompleted: true,
      };
      
      if (userProfile) {
        await updateUserProfile(profileData);
      } else {
        await createUserProfile(profileData);
      }
    } catch (error) {
      console.error('Error completing onboarding:', error);
      showError('Failed to save profile. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 'welcome':
        return true;
      case 'goal':
        return !!data.fitnessGoal;
      case 'weight-loss-rate':
        return !!data.weightLossRate;
      case 'profile':
        // Require minimum: age, gender, weight, height, activity level
        const hasAge = !!data.age && parseFloat(data.age) > 0;
        const hasGender = !!data.gender;
        const hasWeight = !!data.weight && parseFloat(data.weight) > 0;
        const hasActivity = !!data.activityLevel;
        let hasHeight = false;
        if (data.unitSystem === 'imperial') {
          hasHeight = !!(data.heightFeet && parseFloat(data.heightFeet) > 0);
        } else {
          hasHeight = !!(data.heightCm && parseFloat(data.heightCm) > 0);
        }
        return hasAge && hasGender && hasWeight && hasHeight && hasActivity;
      case 'summary':
        return true;
      default:
        return false;
    }
  };

  // Calculate preview values for summary
  const getPreviewValues = () => {
    let heightCm: number | undefined;
    if (data.unitSystem === 'imperial') {
      const feet = parseFloat(data.heightFeet) || 0;
      const inches = parseFloat(data.heightInches) || 0;
      if (feet > 0 || inches > 0) {
        heightCm = inchesToCm(feetInchesToInches(feet, inches));
      }
    } else {
      heightCm = parseFloat(data.heightCm);
    }
    
    let weightKg: number | undefined;
    if (data.unitSystem === 'imperial') {
      const weightLbs = parseFloat(data.weight);
      if (weightLbs) {
        weightKg = lbsToKg(weightLbs);
      }
    } else {
      weightKg = parseFloat(data.weight);
    }
    
    const age = parseFloat(data.age);
    
    if (age && heightCm && weightKg && data.gender && data.activityLevel) {
      const bmr = Math.round(calculateBMR(weightKg, heightCm, age, data.gender));
      const tdee = Math.round(calculateTDEE(bmr, data.activityLevel));
      const goals = calculateGoalsFromTDEE(tdee, 'balanced', data.fitnessGoal, data.weightLossRate);
      return { bmr, tdee, goals };
    }
    
    return null;
  };

  const renderWelcomeStep = () => (
    <View style={styles.stepContainer}>
      <View style={styles.welcomeContent}>
        <Text style={[styles.welcomeEmoji]}>🍎</Text>
        <Text variant="headlineLarge" style={[styles.title, { color: theme.colors.onSurface }]}>
          Welcome to LogWell
        </Text>
        <Text variant="bodyLarge" style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}>
          Let's set up your profile to get personalized nutrition goals that work for you.
        </Text>
        <View style={styles.featureList}>
          <FeatureItem icon="✓" text="Track your daily nutrition" />
          <FeatureItem icon="✓" text="Get personalized calorie goals" />
          <FeatureItem icon="✓" text="Monitor your progress" />
          <FeatureItem icon="✓" text="All data stays on your device" />
        </View>
      </View>
    </View>
  );

  const renderGoalStep = () => (
    <View style={styles.stepContainer}>
      <Text variant="headlineSmall" style={[styles.stepTitle, { color: theme.colors.onSurface }]}>
        What's your goal?
      </Text>
      <Text variant="bodyMedium" style={[styles.stepSubtitle, { color: theme.colors.onSurfaceVariant }]}>
        We'll customize your nutrition targets based on your goal.
      </Text>
      
      <View style={styles.goalOptions}>
        <GoalOption
          title="Lose Weight"
          description="Create a calorie deficit to lose fat"
          icon="📉"
          selected={data.fitnessGoal === 'weight-loss'}
          onPress={() => setData({ ...data, fitnessGoal: 'weight-loss' })}
          theme={theme}
        />
        <GoalOption
          title="Maintain Weight"
          description="Keep your current weight stable"
          icon="⚖️"
          selected={data.fitnessGoal === 'maintenance'}
          onPress={() => setData({ ...data, fitnessGoal: 'maintenance' })}
          theme={theme}
        />
        <GoalOption
          title="Gain Weight"
          description="Build muscle and gain mass"
          icon="📈"
          selected={data.fitnessGoal === 'weight-gain'}
          onPress={() => setData({ ...data, fitnessGoal: 'weight-gain' })}
          theme={theme}
        />
        <GoalOption
          title="Body Recomposition"
          description="Lose fat while building muscle"
          icon="💪"
          selected={data.fitnessGoal === 'body-recomposition'}
          onPress={() => setData({ ...data, fitnessGoal: 'body-recomposition' })}
          theme={theme}
        />
      </View>
    </View>
  );

  const renderWeightLossRateStep = () => (
    <View style={styles.stepContainer}>
      <Text variant="headlineSmall" style={[styles.stepTitle, { color: theme.colors.onSurface }]}>
        How fast do you want to lose weight?
      </Text>
      <Text variant="bodyMedium" style={[styles.stepSubtitle, { color: theme.colors.onSurfaceVariant }]}>
        Slower rates are easier to maintain and preserve muscle mass.
      </Text>
      
      <View style={styles.rateOptions}>
        <RateOption
          rate={0.5}
          title="Easy"
          description="0.5 lb per week"
          detail="~250 cal deficit • Sustainable"
          selected={data.weightLossRate === 0.5}
          onPress={() => setData({ ...data, weightLossRate: 0.5 })}
          theme={theme}
          color={theme.colors.primary}
        />
        <RateOption
          rate={1}
          title="Moderate"
          description="1 lb per week"
          detail="~500 cal deficit • Recommended"
          selected={data.weightLossRate === 1}
          onPress={() => setData({ ...data, weightLossRate: 1 })}
          theme={theme}
          color={theme.colors.primary}
          recommended
        />
        <RateOption
          rate={1.5}
          title="Aggressive"
          description="1.5 lbs per week"
          detail="~750 cal deficit • Challenging"
          selected={data.weightLossRate === 1.5}
          onPress={() => setData({ ...data, weightLossRate: 1.5 })}
          theme={theme}
          color="#FF9800"
        />
        <RateOption
          rate={2}
          title="Very Aggressive"
          description="2 lbs per week"
          detail="~1000 cal deficit • Maximum safe rate"
          selected={data.weightLossRate === 2}
          onPress={() => setData({ ...data, weightLossRate: 2 })}
          theme={theme}
          color={theme.colors.error}
        />
      </View>
      
      <Surface style={[styles.warningBox, { backgroundColor: theme.colors.errorContainer }]}>
        <Text style={[styles.warningText, { color: theme.colors.onErrorContainer }]}>
          💡 Losing more than 2 lbs/week is not recommended as it can lead to muscle loss and is hard to sustain.
        </Text>
      </Surface>
    </View>
  );

  const renderProfileStep = () => (
    <View style={styles.stepContainer}>
      <Text variant="headlineSmall" style={[styles.stepTitle, { color: theme.colors.onSurface }]}>
        Tell us about yourself
      </Text>
      <Text variant="bodyMedium" style={[styles.stepSubtitle, { color: theme.colors.onSurfaceVariant }]}>
        This helps us calculate your daily calorie needs accurately.
      </Text>
      
      <View style={styles.formSection}>
        <TextInput
          label="Name (optional)"
          value={data.name}
          onChangeText={(text) => setData({ ...data, name: text })}
          mode="outlined"
          style={styles.input}
        />
        
        <TextInput
          label="Age *"
          value={data.age}
          onChangeText={(text) => setData({ ...data, age: text })}
          mode="outlined"
          keyboardType="numeric"
          style={styles.input}
        />
        
        <Text variant="titleSmall" style={styles.inputLabel}>Gender *</Text>
        <SegmentedButtons
          value={data.gender || ''}
          onValueChange={(value) => setData({ ...data, gender: value as 'male' | 'female' })}
          buttons={[
            { value: 'male', label: 'Male' },
            { value: 'female', label: 'Female' },
          ]}
          style={styles.segmentedButtons}
        />
        
        <Text variant="titleSmall" style={styles.inputLabel}>Units</Text>
        <SegmentedButtons
          value={data.unitSystem}
          onValueChange={(value) => setData({ ...data, unitSystem: value as UnitSystem })}
          buttons={[
            { value: 'imperial', label: 'Imperial (ft/lb)' },
            { value: 'metric', label: 'Metric (cm/kg)' },
          ]}
          style={styles.segmentedButtons}
        />
        
        {data.unitSystem === 'imperial' ? (
          <View style={styles.heightRow}>
            <TextInput
              label="Height (feet) *"
              value={data.heightFeet}
              onChangeText={(text) => setData({ ...data, heightFeet: text })}
              mode="outlined"
              keyboardType="numeric"
              style={[styles.input, styles.heightInput]}
            />
            <TextInput
              label="Inches"
              value={data.heightInches}
              onChangeText={(text) => setData({ ...data, heightInches: text })}
              mode="outlined"
              keyboardType="numeric"
              style={[styles.input, styles.heightInput]}
            />
          </View>
        ) : (
          <TextInput
            label="Height (cm) *"
            value={data.heightCm}
            onChangeText={(text) => setData({ ...data, heightCm: text })}
            mode="outlined"
            keyboardType="numeric"
            style={styles.input}
          />
        )}
        
        <TextInput
          label={data.unitSystem === 'imperial' ? 'Weight (lbs) *' : 'Weight (kg) *'}
          value={data.weight}
          onChangeText={(text) => setData({ ...data, weight: text })}
          mode="outlined"
          keyboardType="decimal-pad"
          style={styles.input}
        />
        
        <Text variant="titleSmall" style={styles.inputLabel}>Activity Level *</Text>
        <View style={styles.activityOptions}>
          <ActivityOption
            level="sedentary"
            title="Sedentary"
            description="Little to no exercise"
            selected={data.activityLevel === 'sedentary'}
            onPress={() => setData({ ...data, activityLevel: 'sedentary' })}
            theme={theme}
          />
          <ActivityOption
            level="lightly-active"
            title="Lightly Active"
            description="Light exercise 1-3 days/week"
            selected={data.activityLevel === 'lightly-active'}
            onPress={() => setData({ ...data, activityLevel: 'lightly-active' })}
            theme={theme}
          />
          <ActivityOption
            level="moderately-active"
            title="Moderately Active"
            description="Moderate exercise 3-5 days/week"
            selected={data.activityLevel === 'moderately-active'}
            onPress={() => setData({ ...data, activityLevel: 'moderately-active' })}
            theme={theme}
          />
          <ActivityOption
            level="very-active"
            title="Very Active"
            description="Hard exercise 6-7 days/week"
            selected={data.activityLevel === 'very-active'}
            onPress={() => setData({ ...data, activityLevel: 'very-active' })}
            theme={theme}
          />
          <ActivityOption
            level="extremely-active"
            title="Extremely Active"
            description="Very hard exercise, physical job"
            selected={data.activityLevel === 'extremely-active'}
            onPress={() => setData({ ...data, activityLevel: 'extremely-active' })}
            theme={theme}
          />
        </View>
      </View>
    </View>
  );

  const renderSummaryStep = () => {
    const preview = getPreviewValues();
    const goalLabels: Record<FitnessGoal, string> = {
      'weight-loss': 'Lose Weight',
      'maintenance': 'Maintain Weight',
      'weight-gain': 'Gain Weight',
      'body-recomposition': 'Body Recomposition',
    };
    
    const weightDisplay = data.unitSystem === 'imperial' 
      ? `${data.weight} lbs`
      : `${data.weight} kg`;
    
    const heightDisplay = data.unitSystem === 'imperial'
      ? `${data.heightFeet}'${data.heightInches || '0'}"`
      : `${data.heightCm} cm`;
    
    return (
      <View style={styles.stepContainer}>
        <Text variant="headlineSmall" style={[styles.stepTitle, { color: theme.colors.onSurface }]}>
          Your Personalized Plan
        </Text>
        <Text variant="bodyMedium" style={[styles.stepSubtitle, { color: theme.colors.onSurfaceVariant }]}>
          Here's what we've calculated for you.
        </Text>
        
        {preview ? (
          <>
            <Surface style={[styles.summaryCard, { backgroundColor: theme.colors.primaryContainer }]}>
              <Text variant="titleMedium" style={{ color: theme.colors.onPrimaryContainer }}>
                Daily Calorie Target
              </Text>
              <Text variant="displaySmall" style={[styles.calorieNumber, { color: theme.colors.onPrimaryContainer }]}>
                {preview.goals.calories}
              </Text>
              <Text variant="bodyMedium" style={{ color: theme.colors.onPrimaryContainer }}>
                calories per day
              </Text>
            </Surface>
            
            <View style={styles.macrosRow}>
              <MacroCard
                label="Protein"
                value={preview.goals.protein}
                unit="g"
                color={theme.colors.primary}
                theme={theme}
              />
              <MacroCard
                label="Carbs"
                value={preview.goals.carbs}
                unit="g"
                color="#FF9800"
                theme={theme}
              />
              <MacroCard
                label="Fat"
                value={preview.goals.fat}
                unit="g"
                color="#9C27B0"
                theme={theme}
              />
            </View>
            
            <Surface style={[styles.detailsCard, { backgroundColor: theme.colors.surfaceVariant }]}>
              <DetailRow label="Goal" value={goalLabels[data.fitnessGoal]} />
              {data.fitnessGoal === 'weight-loss' && (
                <DetailRow label="Target Loss" value={`${data.weightLossRate} lb/week`} />
              )}
              <DetailRow label="TDEE" value={`${preview.tdee} cal/day`} />
              <DetailRow label="BMR" value={`${preview.bmr} cal/day`} />
              <DetailRow label="Weight" value={weightDisplay} />
              <DetailRow label="Height" value={heightDisplay} />
            </Surface>
          </>
        ) : (
          <Surface style={[styles.summaryCard, { backgroundColor: theme.colors.errorContainer }]}>
            <Text style={{ color: theme.colors.onErrorContainer }}>
              Unable to calculate goals. Please go back and fill in all required fields.
            </Text>
          </Surface>
        )}
      </View>
    );
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'welcome':
        return renderWelcomeStep();
      case 'goal':
        return renderGoalStep();
      case 'weight-loss-rate':
        return renderWeightLossRateStep();
      case 'profile':
        return renderProfileStep();
      case 'summary':
        return renderSummaryStep();
      default:
        return null;
    }
  };

  // Web-specific scrollable content
  const scrollableContent = (
    <Animated.View style={{ opacity: fadeAnim }}>
      {renderCurrentStep()}
    </Animated.View>
  );

  return (
    <View style={[
      styles.container, 
      { backgroundColor: theme.colors.background },
      Platform.OS === 'web' && { display: 'flex' as any, flexDirection: 'column' as any, height: '100%' as any, overflow: 'hidden' as any }
    ]}>
      {/* Header with back button and progress */}
      {currentStep !== 'welcome' && (
        <View style={styles.headerContainer}>
          <IconButton
            icon="arrow-left"
            size={24}
            onPress={goToPreviousStep}
            style={styles.backButton}
          />
          <View style={styles.progressContainer}>
            <ProgressBar
              progress={progress}
              color={theme.colors.primary}
              style={styles.progressBar}
            />
            <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
              Step {currentStepIndex + 1} of {STEPS.length}
            </Text>
          </View>
          <View style={styles.backButtonPlaceholder} />
        </View>
      )}
      
      {/* Content */}
      {Platform.OS === 'web' ? (
        <div style={{ 
          display: 'flex',
          flexDirection: 'column',
          flexGrow: 1,
          flexShrink: 1,
          flexBasis: 0,
          overflowY: 'auto', 
          overflowX: 'hidden',
          paddingLeft: 20, 
          paddingRight: 20,
          paddingTop: 10,
          paddingBottom: 100,
          minHeight: 0,
        }}>
          {scrollableContent}
        </div>
      ) : (
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={true}
          keyboardShouldPersistTaps="handled"
        >
          {scrollableContent}
        </ScrollView>
      )}
        
      {/* Bottom button */}
      <View style={[styles.bottomContainer, { backgroundColor: theme.colors.background }]}>
        {currentStep === 'summary' ? (
          <Button
            mode="contained"
            onPress={handleComplete}
            loading={isSubmitting}
            disabled={isSubmitting}
            style={styles.button}
            contentStyle={styles.buttonContent}
          >
            Get Started
          </Button>
        ) : (
          <Button
            mode="contained"
            onPress={goToNextStep}
            disabled={!canProceed()}
            style={styles.button}
            contentStyle={styles.buttonContent}
          >
            {currentStep === 'welcome' ? "Let's Go" : 'Continue'}
          </Button>
        )}
      </View>
    </View>
  );
}

// Helper Components

function FeatureItem({ icon, text }: { icon: string; text: string }) {
  return (
    <View style={styles.featureItem}>
      <Text style={styles.featureIcon}>{icon}</Text>
      <Text variant="bodyMedium" style={styles.featureText}>{text}</Text>
    </View>
  );
}

function GoalOption({
  title,
  description,
  icon,
  selected,
  onPress,
  theme,
}: {
  title: string;
  description: string;
  icon: string;
  selected: boolean;
  onPress: () => void;
  theme: any;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.goalOption,
        {
          backgroundColor: selected ? theme.colors.primaryContainer : theme.colors.surfaceVariant,
          borderColor: selected ? theme.colors.primary : 'transparent',
          borderWidth: selected ? 2 : 0,
        },
      ]}
    >
      <Text style={styles.goalIcon}>{icon}</Text>
      <View style={styles.goalTextContainer}>
        <Text
          variant="titleMedium"
          style={{ color: selected ? theme.colors.onPrimaryContainer : theme.colors.onSurfaceVariant }}
        >
          {title}
        </Text>
        <Text
          variant="bodySmall"
          style={{ color: selected ? theme.colors.onPrimaryContainer : theme.colors.onSurfaceVariant, opacity: 0.8 }}
        >
          {description}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

function RateOption({
  rate,
  title,
  description,
  detail,
  selected,
  onPress,
  theme,
  color,
  recommended,
}: {
  rate: WeightLossRate;
  title: string;
  description: string;
  detail: string;
  selected: boolean;
  onPress: () => void;
  theme: any;
  color: string;
  recommended?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.rateOption,
        {
          backgroundColor: selected ? theme.colors.primaryContainer : theme.colors.surfaceVariant,
          borderColor: selected ? color : 'transparent',
          borderWidth: selected ? 2 : 0,
        },
      ]}
    >
      <View style={styles.rateContent}>
        <View style={styles.rateHeader}>
          <Text
            variant="titleMedium"
            style={{ color: selected ? theme.colors.onPrimaryContainer : theme.colors.onSurfaceVariant }}
          >
            {title}
          </Text>
          {recommended && (
            <Chip compact mode="flat" style={{ backgroundColor: theme.colors.primary }}>
              <Text style={{ color: theme.colors.onPrimary, fontSize: 10 }}>Recommended</Text>
            </Chip>
          )}
        </View>
        <Text
          variant="bodyMedium"
          style={{ color: selected ? theme.colors.onPrimaryContainer : theme.colors.onSurfaceVariant }}
        >
          {description}
        </Text>
        <Text
          variant="bodySmall"
          style={{ color: selected ? theme.colors.onPrimaryContainer : theme.colors.onSurfaceVariant, opacity: 0.7 }}
        >
          {detail}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

function ActivityOption({
  level,
  title,
  description,
  selected,
  onPress,
  theme,
}: {
  level: ActivityLevel;
  title: string;
  description: string;
  selected: boolean;
  onPress: () => void;
  theme: any;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.activityOption,
        {
          backgroundColor: selected ? theme.colors.primaryContainer : theme.colors.surfaceVariant,
          borderColor: selected ? theme.colors.primary : 'transparent',
          borderWidth: selected ? 2 : 0,
        },
      ]}
    >
      <Text
        variant="titleSmall"
        style={{ color: selected ? theme.colors.onPrimaryContainer : theme.colors.onSurfaceVariant }}
      >
        {title}
      </Text>
      <Text
        variant="bodySmall"
        style={{ color: selected ? theme.colors.onPrimaryContainer : theme.colors.onSurfaceVariant, opacity: 0.8 }}
      >
        {description}
      </Text>
    </TouchableOpacity>
  );
}

function MacroCard({
  label,
  value,
  unit,
  color,
  theme,
}: {
  label: string;
  value: number;
  unit: string;
  color: string;
  theme: any;
}) {
  return (
    <Surface style={[styles.macroCard, { backgroundColor: theme.colors.surfaceVariant }]}>
      <View style={[styles.macroIndicator, { backgroundColor: color }]} />
      <Text variant="titleLarge" style={[styles.macroValue, { color: theme.colors.onSurfaceVariant }]}>
        {value}
      </Text>
      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
        {unit} {label}
      </Text>
    </Surface>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text variant="bodyMedium" style={{ opacity: 0.7 }}>{label}</Text>
      <Text variant="bodyMedium" style={{ fontWeight: '600' }}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 8,
  },
  backButton: {
    margin: 0,
  },
  backButtonPlaceholder: {
    width: 48,
  },
  progressContainer: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
  },
  progressBar: {
    width: '100%',
    height: 6,
    borderRadius: 3,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 100,
  },
  stepContainer: {
    // Allow content to determine height
  },
  welcomeContent: {
    alignItems: 'center',
    paddingTop: 60,
  },
  welcomeEmoji: {
    fontSize: 64,
    marginBottom: 24,
  },
  title: {
    textAlign: 'center',
    fontWeight: '700',
    marginBottom: 12,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 32,
    paddingHorizontal: 20,
  },
  featureList: {
    alignSelf: 'stretch',
    gap: 12,
    marginTop: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
  },
  featureIcon: {
    fontSize: 18,
    color: '#4CAF50',
  },
  featureText: {
    flex: 1,
  },
  stepTitle: {
    fontWeight: '700',
    marginBottom: 8,
  },
  stepSubtitle: {
    marginBottom: 24,
  },
  goalOptions: {
    gap: 12,
  },
  goalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 16,
  },
  goalIcon: {
    fontSize: 32,
  },
  goalTextContainer: {
    flex: 1,
  },
  rateOptions: {
    gap: 12,
  },
  rateOption: {
    padding: 16,
    borderRadius: 12,
  },
  rateContent: {
    gap: 4,
  },
  rateHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  warningBox: {
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
  },
  warningText: {
    lineHeight: 20,
  },
  formSection: {
    gap: 8,
  },
  input: {
    marginBottom: 8,
  },
  inputLabel: {
    marginTop: 16,
    marginBottom: 8,
  },
  segmentedButtons: {
    marginBottom: 8,
  },
  heightRow: {
    flexDirection: 'row',
    gap: 12,
  },
  heightInput: {
    flex: 1,
  },
  activityOptions: {
    gap: 8,
  },
  activityOption: {
    padding: 12,
    borderRadius: 12,
  },
  summaryCard: {
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  calorieNumber: {
    fontWeight: '700',
    marginVertical: 8,
  },
  macrosRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  macroCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  macroIndicator: {
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: 8,
  },
  macroValue: {
    fontWeight: '700',
    marginBottom: 2,
  },
  detailsCard: {
    padding: 16,
    borderRadius: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  bottomContainer: {
    padding: 20,
    paddingBottom: 30,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  button: {
    borderRadius: 28,
  },
  buttonContent: {
    paddingVertical: 8,
  },
});
