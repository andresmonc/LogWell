import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { 
  Card, 
  Title, 
  Text, 
  Button, 
  List,
  useTheme,
  TextInput,
  SegmentedButtons
} from 'react-native-paper';
import { useNutritionStore } from '../../stores/nutritionStore';
import type { ProfileScreenProps } from '../../types/navigation';
import type { ActivityLevel, NutritionGoals } from '../../types/nutrition';
import { FormModal } from '../../components';
import { useFormModal } from '../../hooks/useFormModal';
import { calculateBMR, calculateTDEE, calculateGoalsFromTDEE } from '../../utils/nutritionCalculators';

import { showError, showMultiOptionAlert, showConfirmation } from '../../utils/alertUtils';
import { showSuccess } from '../../utils/errorHandler';
import { sharedStyles } from '../../utils/sharedStyles';
import { 
  cmToInches, 
  inchesToCm, 
  kgToLbs, 
  lbsToKg, 
  inchesToFeetInches, 
  feetInchesToInches,
  formatHeight,
  formatWeight,
  type UnitSystem
} from '../../utils/unitConversions';
import { hasCompleteProfile, hasBasicProfile, areGoalsPersonalized, isMinimalProfile } from '../../utils/profileHelpers';

function ProfileScreen({ navigation }: ProfileScreenProps<'ProfileHome'>) {
  const theme = useTheme();
  
  const { 
    userProfile, 
    createUserProfile, 
    updateUserProfile, 
    updateNutritionGoals,
    initializeApp,
    storageService,
    chatGptApiKey,
    saveChatGptApiKey,
    deleteChatGptApiKey
  } = useNutritionStore();
  
  const goalsModal = useFormModal();
  const profileModal = useFormModal();
  const apiKeyModal = useFormModal();
  const tdeeModal = useFormModal();
  
  // Goals form state
  const [goalCalories, setGoalCalories] = useState('');
  const [goalProtein, setGoalProtein] = useState('');
  const [goalCarbs, setGoalCarbs] = useState('');
  const [goalFat, setGoalFat] = useState('');
  
  // Profile form state
  const [profileName, setProfileName] = useState('');
  const [profileAge, setProfileAge] = useState('');
  const [profileHeight, setProfileHeight] = useState('');
  const [profileWeight, setProfileWeight] = useState('');
  const [profileHeightFeet, setProfileHeightFeet] = useState('');
  const [profileHeightInches, setProfileHeightInches] = useState('');
  const [profileGender, setProfileGender] = useState<'male' | 'female' | undefined>(undefined);
  const [profileActivity, setProfileActivity] = useState<ActivityLevel>('moderately-active');
  const [unitSystem, setUnitSystem] = useState<UnitSystem>('imperial');
  
  // API Key form state
  const [apiKeyInput, setApiKeyInput] = useState('');

  useEffect(() => {
    initializeApp();
  }, []);

  useEffect(() => {
    if (userProfile) {
      // Populate goals form
      setGoalCalories(userProfile.goals.calories.toString());
      setGoalProtein(userProfile.goals.protein.toString());
      setGoalCarbs(userProfile.goals.carbs.toString());
      setGoalFat(userProfile.goals.fat.toString());
      
      // Set unit system preference (default to imperial)
      const preferredUnit = userProfile.unitSystem || 'imperial';
      setUnitSystem(preferredUnit);
      
      // Populate profile form
      setProfileName(userProfile.name || '');
      setProfileAge(userProfile.age?.toString() || '');
      
      // Convert stored metric values to display units
      if (userProfile.height) {
        if (preferredUnit === 'imperial') {
          const totalInches = cmToInches(userProfile.height);
          const { feet, inches } = inchesToFeetInches(totalInches);
          setProfileHeightFeet(feet.toString());
          setProfileHeightInches(inches.toString());
          setProfileHeight('');
        } else {
          setProfileHeight(userProfile.height.toString());
          setProfileHeightFeet('');
          setProfileHeightInches('');
        }
      } else {
        setProfileHeight('');
        setProfileHeightFeet('');
        setProfileHeightInches('');
      }
      
      if (userProfile.weight) {
        if (preferredUnit === 'imperial') {
          setProfileWeight(Math.round(kgToLbs(userProfile.weight)).toString());
        } else {
          setProfileWeight(userProfile.weight.toString());
        }
      } else {
        setProfileWeight('');
      }
      
      setProfileGender(userProfile.gender);
      setProfileActivity(userProfile.activityLevel || 'moderately-active');
    } else {
      // Default to imperial for new users
      setUnitSystem('imperial');
    }
  }, [userProfile]);

  const handleUpdateGoals = async () => {
    try {
      // Require at least basic profile info before setting goals
      if (!userProfile && !hasBasicProfile(userProfile)) {
        showError('Please create your profile first before setting goals. This helps us provide personalized recommendations.');
        goalsModal.close();
        profileModal.open();
        return;
      }

      const goals: NutritionGoals = {
        calories: parseFloat(goalCalories) || 2000,
        protein: parseFloat(goalProtein) || 150,
        carbs: parseFloat(goalCarbs) || 250,
        fat: parseFloat(goalFat) || 67,
      };

      if (userProfile) {
        await updateUserProfile({ 
          goals,
          goalsSource: 'manual' as const
        });
      } else {
        await createUserProfile({
          goals,
          goalsSource: 'manual' as const,
          name: 'User',
        });
      }

      goalsModal.close();
      showSuccess('Nutrition goals updated successfully!');
    } catch (error) {
      showError('Failed to update goals. Please try again.');
    }
  };

  const handleUpdateProfile = async () => {
    try {
      const age = parseFloat(profileAge);
      
      // Convert height to cm (stored internally)
      let height: number | undefined;
      if (unitSystem === 'imperial') {
        const feet = parseFloat(profileHeightFeet) || 0;
        const inches = parseFloat(profileHeightInches) || 0;
        if (feet > 0 || inches > 0) {
          const totalInches = feetInchesToInches(feet, inches);
          height = inchesToCm(totalInches);
        }
      } else {
        const heightCm = parseFloat(profileHeight);
        height = heightCm || undefined;
      }
      
      // Convert weight to kg (stored internally)
      let weight: number | undefined;
      if (unitSystem === 'imperial') {
        const weightLbs = parseFloat(profileWeight);
        if (weightLbs) {
          weight = lbsToKg(weightLbs);
        }
      } else {
        const weightKg = parseFloat(profileWeight);
        weight = weightKg || undefined;
      }
      
      const profileData = {
        name: profileName.trim() || undefined,
        age: age || undefined,
        height: height,
        weight: weight,
        gender: profileGender,
        activityLevel: profileActivity,
        unitSystem: unitSystem,
      };

      // Calculate goals from TDEE if we have all required data
      let goals: NutritionGoals | undefined;
      let goalsSource: 'default' | 'manual' | 'calculated' = 'default';
      
      const hadCompleteProfile = userProfile ? hasCompleteProfile(userProfile) : false;
      const nowHasCompleteProfile = !!(age && height && weight && profileGender && profileActivity);
      
      if (nowHasCompleteProfile) {
        // TypeScript guard: we know these are defined because of nowHasCompleteProfile check
        const validAge = age!;
        const validHeight = height!;
        const validWeight = weight!;
        const validGender = profileGender!;
        
        const bmr = Math.round(calculateBMR(validWeight, validHeight, validAge, validGender));
        const tdee = Math.round(calculateTDEE(bmr, profileActivity));
        goals = calculateGoalsFromTDEE(tdee, 'balanced', 'maintenance');
        goalsSource = 'calculated';
      }

      if (userProfile) {
        const updatedProfile: any = {
          ...profileData,
        };

        // If we just completed the profile and user doesn't have personalized goals, offer to calculate
        if (nowHasCompleteProfile && !hadCompleteProfile) {
          const currentGoalsSource = userProfile.goalsSource || 'default';
          
          // If goals are defaults or minimal, automatically update with calculated goals
          if (currentGoalsSource === 'default' || isMinimalProfile(userProfile)) {
            updatedProfile.goals = goals;
            updatedProfile.goalsSource = 'calculated';
          } else {
            // If they have manual goals, ask if they want to recalculate
            if (age && height && weight && profileGender && profileActivity) {
              const bmr = Math.round(calculateBMR(weight, height, age, profileGender));
              const tdee = Math.round(calculateTDEE(bmr, profileActivity));
              profileModal.close();
              showConfirmation({
                title: 'Recalculate Goals?',
                message: `We can calculate personalized goals based on your profile (TDEE: ${tdee} cal/day). Would you like to update your goals?`,
                confirmText: 'Update Goals',
                cancelText: 'Keep Current',
                onConfirm: async () => {
                  await updateUserProfile({
                    ...profileData,
                    goals: goals!,
                    goalsSource: 'calculated',
                  });
                  showSuccess('Goals updated based on your profile!');
                },
                onCancel: async () => {
                  await updateUserProfile(profileData);
                },
              });
              return;
            }
          }
        } else if (goals && (!userProfile.goalsSource || userProfile.goalsSource === 'default')) {
          // If we have calculated goals and current goals are defaults, update them
          updatedProfile.goals = goals;
          updatedProfile.goalsSource = 'calculated';
        }

        await updateUserProfile(updatedProfile);
      } else {
        // New profile - use calculated goals if available, otherwise defaults
        await createUserProfile({
          ...profileData,
          goals: goals || {
            calories: 2000,
            protein: 150,
            carbs: 250,
            fat: 67,
          },
          goalsSource: goals ? 'calculated' : 'default',
        });
      }

      profileModal.close();
      showSuccess('Profile updated successfully!');
    } catch (error) {
      showError('Failed to update profile. Please try again.');
    }
  };

  const getBMR = (): number | null => {
    if (!userProfile?.age || !userProfile?.height || !userProfile?.weight || !userProfile?.gender) {
      return null;
    }

    const { age, height, weight, gender } = userProfile;
    
    return Math.round(calculateBMR(weight, height, age, gender));
  };

  const getTDEE = (): number | null => {
    const bmr = getBMR();
    if (!bmr || !userProfile?.activityLevel) return null;

    return Math.round(calculateTDEE(bmr, userProfile.activityLevel));
  };

  const handleCalculateGoalsFromTDEE = async (goalType: 'maintenance' | 'weight-loss' | 'weight-gain' | 'body-recomposition' = 'maintenance') => {
    try {
      const bmr = getBMR();
      if (!bmr || !userProfile?.activityLevel) {
        showError('Please complete your profile (age, height, weight, gender, activity level) to calculate goals from TDEE.');
        return;
      }

      const tdee = getTDEE();
      if (!tdee) {
        showError('Unable to calculate TDEE. Please check your profile information.');
        return;
      }

      const calculatedGoals = calculateGoalsFromTDEE(tdee, 'balanced', goalType);
      
      // Format goal type name for display
      const goalTypeName = goalType === 'body-recomposition' 
        ? 'body recomposition' 
        : goalType.replace('-', ' ');
      
      if (userProfile) {
        await updateUserProfile({ 
          goals: calculatedGoals,
          goalsSource: 'calculated' as const
        });
        showSuccess(`Goals updated based on TDEE (${tdee} cal/day) for ${goalTypeName}!`);
      } else {
        await createUserProfile({
          name: 'User',
          goals: calculatedGoals,
          goalsSource: 'calculated' as const,
        });
        showSuccess(`Profile created with goals based on TDEE (${tdee} cal/day) for ${goalTypeName}!`);
      }
    } catch (error) {
      showError('Failed to calculate goals. Please try again.');
    }
  };

  const handleClearData = () => {
    showMultiOptionAlert({
      title: 'Clear All Data',
      message: 'This will permanently delete all your food logs, foods, and profile data. This action cannot be undone.',
      options: [
        { text: 'Cancel', style: 'cancel', onPress: () => {} },
        {
          text: 'Clear All Data',
          style: 'destructive',
          onPress: async () => {
            try {
              await useNutritionStore.getState().storageService.clearAllData();
              await initializeApp();
              showSuccess('All data has been cleared.');
            } catch (error) {
              showError('Failed to clear data. Please try again.');
            }
          },
        },
      ]
    });
  };

  const handleOpenApiKeyModal = () => {
    setApiKeyInput(chatGptApiKey || '');
    apiKeyModal.open();
  };

  const handleSaveApiKey = async () => {
    try {
      if (apiKeyInput.trim()) {
        await saveChatGptApiKey(apiKeyInput.trim());
        showSuccess('ChatGPT API key saved successfully!');
      } else {
        await deleteChatGptApiKey();
        showSuccess('ChatGPT API key removed successfully!');
      }
      apiKeyModal.close();
    } catch (error) {
      showError('Failed to save API key. Please try again.');
    }
  };

  const bmr = getBMR();
  const tdee = getTDEE();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={styles.scrollView}>
        {/* Profile Info */}
        <Card style={styles.card}>
          <Card.Content>
            <Title>Profile Information</Title>
            {userProfile ? (
              <View style={styles.profileInfo}>
                <View style={styles.infoRow}>
                  <Text variant="bodyMedium" style={styles.infoLabel}>Name</Text>
                  <Text variant="bodyLarge" style={styles.infoValue}>{userProfile.name || 'Not set'}</Text>
                </View>
                {userProfile.age && (
                  <View style={styles.infoRow}>
                    <Text variant="bodyMedium" style={styles.infoLabel}>Age</Text>
                    <Text variant="bodyLarge" style={styles.infoValue}>{userProfile.age} years</Text>
                  </View>
                )}
                {userProfile.height && (
                  <View style={styles.infoRow}>
                    <Text variant="bodyMedium" style={styles.infoLabel}>Height</Text>
                    <Text variant="bodyLarge" style={styles.infoValue}>{formatHeight(userProfile.height, userProfile.unitSystem || 'imperial')}</Text>
                  </View>
                )}
                {userProfile.weight && (
                  <View style={styles.infoRow}>
                    <Text variant="bodyMedium" style={styles.infoLabel}>Weight</Text>
                    <Text variant="bodyLarge" style={styles.infoValue}>{formatWeight(userProfile.weight, userProfile.unitSystem || 'imperial')}</Text>
                  </View>
                )}
                {userProfile.gender && (
                  <View style={styles.infoRow}>
                    <Text variant="bodyMedium" style={styles.infoLabel}>Gender</Text>
                    <Text variant="bodyLarge" style={styles.infoValue}>{userProfile.gender.charAt(0).toUpperCase() + userProfile.gender.slice(1)}</Text>
                  </View>
                )}
                {userProfile.activityLevel && (
                  <View style={styles.infoRow}>
                    <Text variant="bodyMedium" style={styles.infoLabel}>Activity</Text>
                    <Text variant="bodyLarge" style={styles.infoValue} numberOfLines={2}>{userProfile.activityLevel.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}</Text>
                  </View>
                )}
              </View>
            ) : (
              <View>
                <Text variant="bodyMedium" style={styles.emptyText}>
                  No profile information set
                </Text>
                <Text variant="bodySmall" style={[styles.emptyText, { marginTop: 8, fontStyle: 'italic' }]}>
                  Set up your profile to get personalized nutrition goals based on your age, height, weight, and activity level.
                </Text>
              </View>
            )}
            <Button 
              mode="outlined" 
              onPress={profileModal.open}
              style={styles.button}
              icon="account-edit"
            >
              {userProfile ? 'Edit Profile' : 'Create Profile'}
            </Button>
          </Card.Content>
        </Card>

        {/* Nutrition Goals */}
        <Card style={styles.card}>
          <Card.Content>
            <Title>Nutrition Goals</Title>
            {userProfile?.goals ? (
              <>
                {!areGoalsPersonalized(userProfile) && (
                  <Text variant="bodySmall" style={[styles.warningText, { color: theme.colors.error }]}>
                    ⚠️ Using default goals. Set up your profile to get personalized recommendations.
                  </Text>
                )}
                {userProfile.goalsSource === 'calculated' && (
                  <Text variant="bodySmall" style={[styles.infoText, { color: theme.colors.primary }]}>
                    ✓ Goals calculated from your profile
                  </Text>
                )}
                <View style={styles.goalsInfo}>
                  <View style={styles.infoRow}>
                    <Text variant="bodyMedium" style={styles.infoLabel}>Calories</Text>
                    <Text variant="bodyLarge" style={styles.infoValue}>
                      <Text style={styles.infoValueBold}>{userProfile.goals.calories}</Text>
                      <Text style={styles.infoUnit}> cal/day</Text>
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text variant="bodyMedium" style={styles.infoLabel}>Protein</Text>
                    <Text variant="bodyLarge" style={styles.infoValue}>
                      <Text style={styles.infoValueBold}>{userProfile.goals.protein}</Text>
                      <Text style={styles.infoUnit}>g/day</Text>
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text variant="bodyMedium" style={styles.infoLabel}>Carbs</Text>
                    <Text variant="bodyLarge" style={styles.infoValue}>
                      <Text style={styles.infoValueBold}>{userProfile.goals.carbs}</Text>
                      <Text style={styles.infoUnit}>g/day</Text>
                    </Text>
                  </View>
                  <View style={styles.infoRow}>
                    <Text variant="bodyMedium" style={styles.infoLabel}>Fat</Text>
                    <Text variant="bodyLarge" style={styles.infoValue}>
                      <Text style={styles.infoValueBold}>{userProfile.goals.fat}</Text>
                      <Text style={styles.infoUnit}>g/day</Text>
                    </Text>
                  </View>
                </View>
              </>
            ) : (
              <View>
                <Text variant="bodyMedium" style={styles.emptyText}>
                  No nutrition goals set
                </Text>
                {!userProfile && (
                  <Text variant="bodySmall" style={[styles.emptyText, { marginTop: 8 }]}>
                    Create your profile first to get personalized goal recommendations.
                  </Text>
                )}
              </View>
            )}
            <View style={styles.goalButtons}>
              <Button 
                mode="outlined" 
                onPress={goalsModal.open}
                style={[styles.button, styles.buttonFlex]}
                icon="target"
              >
                {userProfile?.goals ? 'Update' : 'Set Goals'}
              </Button>
              {tdee && (
                <Button 
                  mode="contained" 
                  onPress={tdeeModal.open}
                  style={[styles.button, styles.buttonFlex]}
                  icon="calculator"
                >
                  Use TDEE
                </Button>
              )}
            </View>
          </Card.Content>
        </Card>

        {/* Health Metrics */}
        {bmr && (
          <Card style={styles.card}>
            <Card.Content>
              <Title>Health Metrics</Title>
              <View style={styles.metricsInfo}>
                <View style={styles.infoRow}>
                  <Text variant="bodyMedium" style={styles.infoLabel}>BMR</Text>
                  <View>
                    <Text variant="bodyLarge" style={styles.infoValue}>
                      <Text style={styles.infoValueBold}>{bmr}</Text>
                      <Text style={styles.infoUnit}> cal/day</Text>
                    </Text>
                    <Text variant="bodySmall" style={styles.metricSubtext}>Base Metabolic Rate</Text>
                  </View>
                </View>
                {tdee && (
                  <View style={styles.infoRow}>
                    <Text variant="bodyMedium" style={styles.infoLabel}>TDEE</Text>
                    <View>
                      <Text variant="bodyLarge" style={styles.infoValue}>
                        <Text style={styles.infoValueBold}>{tdee}</Text>
                        <Text style={styles.infoUnit}> cal/day</Text>
                      </Text>
                      <Text variant="bodySmall" style={styles.metricSubtext}>Total Daily Energy</Text>
                    </View>
                  </View>
                )}
                <Text variant="bodySmall" style={styles.metricNote}>
                  💡 BMR calculated using Mifflin-St Jeor equation
                </Text>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Settings */}
        <Card style={styles.card}>
          <Card.Content>
            <Title>Settings</Title>
            <List.Item
              title="ChatGPT API Key"
              description={chatGptApiKey ? "API key configured" : "Configure your OpenAI API key"}
              left={(props) => <List.Icon {...props} icon="key" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={handleOpenApiKeyModal}
            />
            <List.Item
              title="About LogWell"
              description="Learn more about the app"
              left={(props) => <List.Icon {...props} icon="information" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => showSuccess('LogWell is a local-only nutrition tracking app that keeps your data private and secure on your device.', 6000)}
            />
            <List.Item
              title="Export Data"
              description="Export your nutrition data"
              left={(props) => <List.Icon {...props} icon="export" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => showSuccess('Data export feature will be available soon!', 4000)}
            />
            <List.Item
              title="Clear All Data"
              description="Reset the app and clear all data"
              left={(props) => <List.Icon {...props} icon="delete-forever" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={handleClearData}
            />
          </Card.Content>
        </Card>
      </ScrollView>

      {/* Goals Modal */}
      <FormModal
        visible={goalsModal.visible}
        onDismiss={goalsModal.close}
        title="Nutrition Goals"
        onSubmit={handleUpdateGoals}
        submitLabel="Save Goals"
      >
        <TextInput
          label="Daily Calories"
          value={goalCalories}
          onChangeText={setGoalCalories}
          style={sharedStyles.input}
          mode="outlined"
          keyboardType="numeric"
        />
        
        <TextInput
          label="Daily Protein (g)"
          value={goalProtein}
          onChangeText={setGoalProtein}
          style={sharedStyles.input}
          mode="outlined"
          keyboardType="decimal-pad"
        />
        
        <TextInput
          label="Daily Carbs (g)"
          value={goalCarbs}
          onChangeText={setGoalCarbs}
          style={sharedStyles.input}
          mode="outlined"
          keyboardType="decimal-pad"
        />
        
        <TextInput
          label="Daily Fat (g)"
          value={goalFat}
          onChangeText={setGoalFat}
          style={sharedStyles.input}
          mode="outlined"
          keyboardType="decimal-pad"
        />
      </FormModal>

      {/* Profile Modal */}
      <FormModal
        visible={profileModal.visible}
        onDismiss={profileModal.close}
        title="Profile Information"
        onSubmit={handleUpdateProfile}
        submitLabel="Save Profile"
      >
        <TextInput
          label="Name"
          value={profileName}
          onChangeText={setProfileName}
          style={sharedStyles.input}
          mode="outlined"
        />
        
        <TextInput
          label="Age"
          value={profileAge}
          onChangeText={setProfileAge}
          style={sharedStyles.input}
          mode="outlined"
          keyboardType="numeric"
        />
        
        <Text variant="titleSmall" style={sharedStyles.sectionLabel}>
          Units
        </Text>
        <SegmentedButtons
          value={unitSystem}
          onValueChange={(value) => {
            const newUnit = value as UnitSystem;
            setUnitSystem(newUnit);
            
            // Convert existing values when switching units
            if (userProfile?.height) {
              if (newUnit === 'imperial') {
                const totalInches = cmToInches(userProfile.height);
                const { feet, inches } = inchesToFeetInches(totalInches);
                setProfileHeightFeet(feet.toString());
                setProfileHeightInches(inches.toString());
                setProfileHeight('');
              } else {
                setProfileHeight(userProfile.height.toString());
                setProfileHeightFeet('');
                setProfileHeightInches('');
              }
            }
            
            if (userProfile?.weight) {
              if (newUnit === 'imperial') {
                setProfileWeight(Math.round(kgToLbs(userProfile.weight)).toString());
              } else {
                setProfileWeight(userProfile.weight.toString());
              }
            }
          }}
          buttons={[
            { value: 'imperial', label: 'Imperial (ft/in, lbs)' },
            { value: 'metric', label: 'Metric (cm, kg)' },
          ]}
          style={sharedStyles.segmentedButtons}
        />
        
        {unitSystem === 'imperial' ? (
          <>
            <TextInput
              label="Height (feet)"
              value={profileHeightFeet}
              onChangeText={setProfileHeightFeet}
              style={sharedStyles.input}
              mode="outlined"
              keyboardType="numeric"
              placeholder="5"
            />
            <TextInput
              label="Height (inches)"
              value={profileHeightInches}
              onChangeText={setProfileHeightInches}
              style={sharedStyles.input}
              mode="outlined"
              keyboardType="numeric"
              placeholder="10"
            />
          </>
        ) : (
          <TextInput
            label="Height (cm)"
            value={profileHeight}
            onChangeText={setProfileHeight}
            style={sharedStyles.input}
            mode="outlined"
            keyboardType="numeric"
          />
        )}
        
        <TextInput
          label={unitSystem === 'imperial' ? 'Weight (lbs)' : 'Weight (kg)'}
          value={profileWeight}
          onChangeText={setProfileWeight}
          style={sharedStyles.input}
          mode="outlined"
          keyboardType="decimal-pad"
        />
        
        <Text variant="titleSmall" style={sharedStyles.sectionLabel}>
          Gender
        </Text>
        <SegmentedButtons
          value={profileGender || ''}
          onValueChange={(value) => setProfileGender(value as 'male' | 'female' | undefined)}
          buttons={[
            { value: 'male', label: 'Male' },
            { value: 'female', label: 'Female' },
          ]}
          style={sharedStyles.segmentedButtons}
        />
        
        <Text variant="titleSmall" style={sharedStyles.sectionLabel}>
          Activity Level
        </Text>
        <SegmentedButtons
          value={profileActivity}
          onValueChange={(value) => setProfileActivity(value as ActivityLevel)}
          buttons={[
            { value: 'sedentary', label: 'Idle' },
            { value: 'lightly-active', label: 'Light' },
            { value: 'moderately-active', label: 'Moderate' },
            { value: 'very-active', label: 'Active' },
          ]}
          style={sharedStyles.segmentedButtons}
        />
      </FormModal>

        {/* TDEE Goals Modal */}
        <FormModal
          visible={tdeeModal.visible}
          onDismiss={tdeeModal.close}
          title="Calculate Goals from TDEE"
          onSubmit={() => {}}
          submitLabel=""
          cancelLabel="Cancel"
        >
          <Text style={[sharedStyles.sectionLabel, { marginBottom: 16 }]}>
            Your TDEE is {tdee} cal/day. Choose your goal:
          </Text>
          <Button
            mode="contained"
            onPress={() => {
              handleCalculateGoalsFromTDEE('weight-loss');
              tdeeModal.close();
            }}
            style={[sharedStyles.input, { marginBottom: 12 }]}
            icon="trending-down"
          >
            Weight Loss
          </Button>
          <Button
            mode="contained"
            onPress={() => {
              handleCalculateGoalsFromTDEE('body-recomposition');
              tdeeModal.close();
            }}
            style={[sharedStyles.input, { marginBottom: 12 }]}
            icon="dumbbell"
          >
            Body Recomposition
          </Button>
          <Button
            mode="contained"
            onPress={() => {
              handleCalculateGoalsFromTDEE('maintenance');
              tdeeModal.close();
            }}
            style={[sharedStyles.input, { marginBottom: 12 }]}
            icon="trending-neutral"
          >
            Maintenance
          </Button>
          <Button
            mode="contained"
            onPress={() => {
              handleCalculateGoalsFromTDEE('weight-gain');
              tdeeModal.close();
            }}
            style={sharedStyles.input}
            icon="trending-up"
          >
            Weight Gain
          </Button>
        </FormModal>

        {/* API Key Modal */}
        <FormModal
          visible={apiKeyModal.visible}
          onDismiss={apiKeyModal.close}
          title="ChatGPT API Key"
          onSubmit={handleSaveApiKey}
          submitLabel="Save API Key"
        >
          <Text style={sharedStyles.sectionLabel}>
            Enter your OpenAI API key to enable ChatGPT features. Your key is stored locally and securely on your device.
          </Text>
          <TextInput
            label="API Key"
            value={apiKeyInput}
            onChangeText={setApiKeyInput}
            mode="outlined"
            style={sharedStyles.input}
            secureTextEntry
            placeholder="sk-..."
            autoCapitalize="none"
            autoCorrect={false}
          />
        </FormModal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    padding: 16,
  },
  card: {
    marginBottom: 16,
  },
  profileInfo: {
    marginVertical: 12,
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  infoLabel: {
    opacity: 0.6,
    flex: 1,
  },
  infoValue: {
    flex: 2,
    textAlign: 'right',
    flexWrap: 'wrap',
  },
  infoValueBold: {
    fontWeight: '700',
    fontSize: 16,
  },
  infoUnit: {
    opacity: 0.6,
    fontSize: 14,
  },
  goalsInfo: {
    marginVertical: 12,
    gap: 8,
  },
  metricsInfo: {
    marginVertical: 12,
    gap: 12,
  },
  metricSubtext: {
    opacity: 0.5,
    fontSize: 11,
    textAlign: 'right',
    marginTop: 2,
  },
  metricNote: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
    opacity: 0.6,
    lineHeight: 18,
  },
  emptyText: {
    opacity: 0.7,
    marginVertical: 12,
  },
  warningText: {
    marginBottom: 8,
    fontWeight: '500',
  },
  infoText: {
    marginBottom: 8,
    fontWeight: '500',
  },
  button: {
    marginTop: 12,
  },
  goalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  buttonFlex: {
    flex: 1,
  },
});

export default ProfileScreen;