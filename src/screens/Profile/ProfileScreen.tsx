import React, { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, Alert } from 'react-native';
import { 
  Card, 
  Title, 
  Text, 
  Button, 
  List,
  useTheme,
  Modal,
  Portal,
  TextInput,
  SegmentedButtons,
  Divider
} from 'react-native-paper';
import { useNutritionStore } from '../../stores/nutritionStore';
import type { ProfileScreenProps } from '../../types/navigation';
import type { ActivityLevel, NutritionGoals } from '../../types/nutrition';

export default function ProfileScreen({ navigation }: ProfileScreenProps<'ProfileHome'>) {
  const theme = useTheme();
  const { 
    userProfile, 
    createUserProfile, 
    updateUserProfile, 
    updateNutritionGoals,
    initializeApp,
    storageService 
  } = useNutritionStore();
  
  const [showGoalsModal, setShowGoalsModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  
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

      setShowGoalsModal(false);
      Alert.alert('Success', 'Nutrition goals updated successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to update goals. Please try again.');
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

      setShowProfileModal(false);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to update profile. Please try again.');
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
    Alert.alert(
      'Clear All Data',
      'This will permanently delete all your food logs, foods, and profile data. This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear All Data',
          style: 'destructive',
          onPress: async () => {
            try {
              await useNutritionStore.getState().storageService.clearAllData();
              await initializeApp();
              Alert.alert('Success', 'All data has been cleared.');
            } catch (error) {
              Alert.alert('Error', 'Failed to clear data. Please try again.');
            }
          },
        },
      ]
    );
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
              onPress={() => setShowProfileModal(true)}
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
              onPress={() => setShowGoalsModal(true)}
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
              title="About LogWell"
              description="Learn more about the app"
              left={(props) => <List.Icon {...props} icon="information" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => Alert.alert('About LogWell', 'LogWell is a local-only nutrition tracking app that keeps your data private and secure on your device.')}
            />
            <List.Item
              title="Export Data"
              description="Export your nutrition data"
              left={(props) => <List.Icon {...props} icon="export" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => Alert.alert('Coming Soon', 'Data export feature will be available soon!')}
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
      <Portal>
        <Modal
          visible={showGoalsModal}
          onDismiss={() => setShowGoalsModal(false)}
          contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}
        >
          <ScrollView>
            <Title style={styles.modalTitle}>Nutrition Goals</Title>
            
            <TextInput
              label="Daily Calories"
              value={goalCalories}
              onChangeText={setGoalCalories}
              style={styles.input}
              mode="outlined"
              keyboardType="numeric"
            />
            
            <TextInput
              label="Daily Protein (g)"
              value={goalProtein}
              onChangeText={setGoalProtein}
              style={styles.input}
              mode="outlined"
              keyboardType="numeric"
            />
            
            <TextInput
              label="Daily Carbs (g)"
              value={goalCarbs}
              onChangeText={setGoalCarbs}
              style={styles.input}
              mode="outlined"
              keyboardType="numeric"
            />
            
            <TextInput
              label="Daily Fat (g)"
              value={goalFat}
              onChangeText={setGoalFat}
              style={styles.input}
              mode="outlined"
              keyboardType="numeric"
            />
            
            <TextInput
              label="Daily Water (ml)"
              value={goalWater}
              onChangeText={setGoalWater}
              style={styles.input}
              mode="outlined"
              keyboardType="numeric"
            />
            
            <View style={styles.modalActions}>
              <Button 
                mode="outlined" 
                onPress={() => setShowGoalsModal(false)}
                style={styles.modalButton}
              >
                Cancel
              </Button>
              <Button 
                mode="contained" 
                onPress={handleUpdateGoals}
                style={styles.modalButton}
              >
                Save Goals
              </Button>
            </View>
          </ScrollView>
        </Modal>
      </Portal>

      {/* Profile Modal */}
      <Portal>
        <Modal
          visible={showProfileModal}
          onDismiss={() => setShowProfileModal(false)}
          contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}
        >
          <ScrollView>
            <Title style={styles.modalTitle}>Profile Information</Title>
            
            <TextInput
              label="Name"
              value={profileName}
              onChangeText={setProfileName}
              style={styles.input}
              mode="outlined"
            />
            
            <TextInput
              label="Age"
              value={profileAge}
              onChangeText={setProfileAge}
              style={styles.input}
              mode="outlined"
              keyboardType="numeric"
            />
            
            <TextInput
              label="Height (cm)"
              value={profileHeight}
              onChangeText={setProfileHeight}
              style={styles.input}
              mode="outlined"
              keyboardType="numeric"
            />
            
            <TextInput
              label="Weight (kg)"
              value={profileWeight}
              onChangeText={setProfileWeight}
              style={styles.input}
              mode="outlined"
              keyboardType="numeric"
            />
            
            <Text variant="titleSmall" style={styles.sectionLabel}>
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
              style={styles.segmentedButtons}
            />
            
            <Text variant="titleSmall" style={styles.sectionLabel}>
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
              style={styles.segmentedButtons}
            />
            
            <View style={styles.modalActions}>
              <Button 
                mode="outlined" 
                onPress={() => setShowProfileModal(false)}
                style={styles.modalButton}
              >
                Cancel
              </Button>
              <Button 
                mode="contained" 
                onPress={handleUpdateProfile}
                style={styles.modalButton}
              >
                Save Profile
              </Button>
            </View>
          </ScrollView>
        </Modal>
      </Portal>
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
  modal: {
    margin: 20,
    padding: 20,
    borderRadius: 8,
    maxHeight: '80%',
  },
  modalTitle: {
    textAlign: 'center',
    marginBottom: 16,
  },
  input: {
    marginBottom: 12,
  },
  sectionLabel: {
    marginBottom: 8,
    marginTop: 8,
  },
  segmentedButtons: {
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
  },
  modalButton: {
    flex: 1,
  },
});