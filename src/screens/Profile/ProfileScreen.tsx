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

import { showSuccess, showError, showMultiOptionAlert } from '../../utils/alertUtils';
import { sharedStyles } from '../../utils/sharedStyles';

export default function ProfileScreen({ navigation }: ProfileScreenProps<'ProfileHome'>) {
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
  
  // Goals form state
  const [goalCalories, setGoalCalories] = useState('');
  const [goalProtein, setGoalProtein] = useState('');
  const [goalCarbs, setGoalCarbs] = useState('');
  const [goalFat, setGoalFat] = useState('');
  const [goalWater, setGoalWater] = useState('');
  
  // Profile form state
  const [profileName, setProfileName] = useState('');
  const [profileAge, setProfileAge] = useState('');
  const [profileHeight, setProfileHeight] = useState('');
  const [profileWeight, setProfileWeight] = useState('');
  const [profileGender, setProfileGender] = useState<'male' | 'female' | 'other'>('other');
  const [profileActivity, setProfileActivity] = useState<ActivityLevel>('moderately-active');
  
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
      setGoalWater((userProfile.goals.water || 2000).toString());
      
      // Populate profile form
      setProfileName(userProfile.name || '');
      setProfileAge(userProfile.age?.toString() || '');
      setProfileHeight(userProfile.height?.toString() || '');
      setProfileWeight(userProfile.weight?.toString() || '');
      setProfileGender(userProfile.gender || 'other');
      setProfileActivity(userProfile.activityLevel || 'moderately-active');
    }
  }, [userProfile]);

  const handleUpdateGoals = async () => {
    try {
      const goals: NutritionGoals = {
        calories: parseFloat(goalCalories) || 2000,
        protein: parseFloat(goalProtein) || 150,
        carbs: parseFloat(goalCarbs) || 250,
        fat: parseFloat(goalFat) || 67,
        water: parseFloat(goalWater) || 2000,
      };

      if (userProfile) {
        await updateNutritionGoals(goals);
      } else {
        await createUserProfile({
          goals,
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
      const profileData = {
        name: profileName.trim() || undefined,
        age: parseFloat(profileAge) || undefined,
        height: parseFloat(profileHeight) || undefined,
        weight: parseFloat(profileWeight) || undefined,
        gender: profileGender,
        activityLevel: profileActivity,
      };

      if (userProfile) {
        await updateUserProfile(profileData);
      } else {
        await createUserProfile({
          ...profileData,
          goals: {
            calories: 2000,
            protein: 150,
            carbs: 250,
            fat: 67,
          },
        });
      }

      profileModal.close();
      showSuccess('Profile updated successfully!');
    } catch (error) {
      showError('Failed to update profile. Please try again.');
    }
  };

  const calculateBMR = () => {
    if (!userProfile?.age || !userProfile?.height || !userProfile?.weight || !userProfile?.gender) {
      return null;
    }

    const { age, height, weight, gender } = userProfile;
    
    // Mifflin-St Jeor Equation
    let bmr: number;
    if (gender === 'male') {
      bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
      bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    }

    return Math.round(bmr);
  };

  const calculateTDEE = () => {
    const bmr = calculateBMR();
    if (!bmr || !userProfile?.activityLevel) return null;

    const activityMultipliers = {
      'sedentary': 1.2,
      'lightly-active': 1.375,
      'moderately-active': 1.55,
      'very-active': 1.725,
      'extremely-active': 1.9,
    };

    return Math.round(bmr * activityMultipliers[userProfile.activityLevel]);
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

  const bmr = calculateBMR();
  const tdee = calculateTDEE();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView style={styles.scrollView}>
        {/* Profile Info */}
        <Card style={styles.card}>
          <Card.Content>
            <Title>Profile Information</Title>
            {userProfile ? (
              <View style={styles.profileInfo}>
                <Text variant="bodyLarge" style={styles.profileItem}>
                  Name: {userProfile.name || 'Not set'}
                </Text>
                {userProfile.age && (
                  <Text variant="bodyLarge" style={styles.profileItem}>
                    Age: {userProfile.age} years
                  </Text>
                )}
                {userProfile.height && userProfile.weight && (
                  <Text variant="bodyLarge" style={styles.profileItem}>
                    Height: {userProfile.height}cm, Weight: {userProfile.weight}kg
                  </Text>
                )}
                {userProfile.gender && (
                  <Text variant="bodyLarge" style={styles.profileItem}>
                    Gender: {userProfile.gender.charAt(0).toUpperCase() + userProfile.gender.slice(1)}
                  </Text>
                )}
                {userProfile.activityLevel && (
                  <Text variant="bodyLarge" style={styles.profileItem}>
                    Activity: {userProfile.activityLevel.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </Text>
                )}
              </View>
            ) : (
              <Text variant="bodyMedium" style={styles.emptyText}>
                No profile information set
              </Text>
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
              <View style={styles.goalsInfo}>
                <Text variant="bodyLarge" style={styles.goalItem}>
                  Calories: {userProfile.goals.calories} cal/day
                </Text>
                <Text variant="bodyLarge" style={styles.goalItem}>
                  Protein: {userProfile.goals.protein}g/day
                </Text>
                <Text variant="bodyLarge" style={styles.goalItem}>
                  Carbs: {userProfile.goals.carbs}g/day
                </Text>
                <Text variant="bodyLarge" style={styles.goalItem}>
                  Fat: {userProfile.goals.fat}g/day
                </Text>
                {userProfile.goals.water && (
                  <Text variant="bodyLarge" style={styles.goalItem}>
                    Water: {userProfile.goals.water}ml/day
                  </Text>
                )}
              </View>
            ) : (
              <Text variant="bodyMedium" style={styles.emptyText}>
                No nutrition goals set
              </Text>
            )}
            <Button 
              mode="outlined" 
              onPress={goalsModal.open}
              style={styles.button}
              icon="target"
            >
              {userProfile?.goals ? 'Update Goals' : 'Set Goals'}
            </Button>
          </Card.Content>
        </Card>

        {/* Health Metrics */}
        {bmr && (
          <Card style={styles.card}>
            <Card.Content>
              <Title>Health Metrics</Title>
              <View style={styles.metricsInfo}>
                <Text variant="bodyLarge" style={styles.metricItem}>
                  BMR (Base Metabolic Rate): {bmr} cal/day
                </Text>
                {tdee && (
                  <Text variant="bodyLarge" style={styles.metricItem}>
                    TDEE (Total Daily Energy): {tdee} cal/day
                  </Text>
                )}
                <Text variant="bodySmall" style={styles.metricNote}>
                  BMR is calculated using the Mifflin-St Jeor equation
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
              onPress={() => showSuccess('LogWell is a local-only nutrition tracking app that keeps your data private and secure on your device.', 'About LogWell')}
            />
            <List.Item
              title="Export Data"
              description="Export your nutrition data"
              left={(props) => <List.Icon {...props} icon="export" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => showSuccess('Data export feature will be available soon!', 'Coming Soon')}
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
          keyboardType="numeric"
        />
        
        <TextInput
          label="Daily Carbs (g)"
          value={goalCarbs}
          onChangeText={setGoalCarbs}
          style={sharedStyles.input}
          mode="outlined"
          keyboardType="numeric"
        />
        
        <TextInput
          label="Daily Fat (g)"
          value={goalFat}
          onChangeText={setGoalFat}
          style={sharedStyles.input}
          mode="outlined"
          keyboardType="numeric"
        />
        
        <TextInput
          label="Daily Water (ml)"
          value={goalWater}
          onChangeText={setGoalWater}
          style={sharedStyles.input}
          mode="outlined"
          keyboardType="numeric"
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
        
        <TextInput
          label="Height (cm)"
          value={profileHeight}
          onChangeText={setProfileHeight}
          style={sharedStyles.input}
          mode="outlined"
          keyboardType="numeric"
        />
        
        <TextInput
          label="Weight (kg)"
          value={profileWeight}
          onChangeText={setProfileWeight}
          style={sharedStyles.input}
          mode="outlined"
          keyboardType="numeric"
        />
        
        <Text variant="titleSmall" style={sharedStyles.sectionLabel}>
          Gender
        </Text>
        <SegmentedButtons
          value={profileGender}
          onValueChange={(value) => setProfileGender(value as 'male' | 'female' | 'other')}
          buttons={[
            { value: 'male', label: 'Male' },
            { value: 'female', label: 'Female' },
            { value: 'other', label: 'Other' },
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
            { value: 'sedentary', label: 'Sedentary' },
            { value: 'lightly-active', label: 'Light' },
            { value: 'moderately-active', label: 'Moderate' },
            { value: 'very-active', label: 'Very Active' },
          ]}
          style={sharedStyles.segmentedButtons}
        />
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
  },
  profileItem: {
    marginBottom: 8,
  },
  goalsInfo: {
    marginVertical: 12,
  },
  goalItem: {
    marginBottom: 8,
  },
  metricsInfo: {
    marginVertical: 12,
  },
  metricItem: {
    marginBottom: 8,
  },
  metricNote: {
    marginTop: 8,
    opacity: 0.7,
    fontStyle: 'italic',
  },
  emptyText: {
    opacity: 0.7,
    marginVertical: 12,
  },
  button: {
    marginTop: 12,
  },



});