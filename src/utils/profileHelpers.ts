import type { UserProfile } from '../types/nutrition';

/**
 * Check if user has a complete profile (enough data to calculate TDEE)
 */
export function hasCompleteProfile(profile: UserProfile | null): boolean {
  if (!profile) return false;
  return !!(
    profile.age &&
    profile.height &&
    profile.weight &&
    profile.gender &&
    profile.activityLevel
  );
}

/**
 * Check if user has basic profile info
 */
export function hasBasicProfile(profile: UserProfile | null): boolean {
  if (!profile) return false;
  return !!(profile.name || profile.age || profile.height || profile.weight);
}

/**
 * Check if goals are personalized (not just defaults)
 */
export function areGoalsPersonalized(profile: UserProfile | null): boolean {
  if (!profile) return false;
  // Goals are personalized if they were calculated or manually set (not defaults)
  return profile.goalsSource !== 'default';
}

/**
 * Check if profile was just created with minimal data
 */
export function isMinimalProfile(profile: UserProfile | null): boolean {
  if (!profile) return false;
  // Profile is minimal if it has goals but no personalization data
  return !hasBasicProfile(profile) && !!profile.goals;
}
