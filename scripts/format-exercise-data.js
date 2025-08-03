#!/usr/bin/env node

/**
 * Script to format and sort exercise data to avoid runtime compute
 * This script:
 * 1. Formats all exercise names to proper title case
 * 2. Sorts exercises alphabetically by name
 * 3. Saves the formatted data back to the JSON file
 */

const fs = require('fs');
const path = require('path');

// Utility function to format names to title case
function formatToTitleCase(str) {
  return str
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

// Main function to process the exercise data
function formatExerciseData() {
  const exerciseFilePath = path.join(__dirname, '../src/data/exercises/exercises.json');
  
  try {
    console.log('📖 Reading exercise data...');
    const exerciseData = JSON.parse(fs.readFileSync(exerciseFilePath, 'utf8'));
    
    console.log(`📝 Processing ${exerciseData.length} exercises...`);
    
    // Format exercise names and primary body parts
    const formattedExercises = exerciseData.map(exercise => ({
      ...exercise,
      name: formatToTitleCase(exercise.name),
      primaryBodyPart: exercise.primaryBodyPart ? formatToTitleCase(exercise.primaryBodyPart) : exercise.primaryBodyPart
    }));
    
    // Sort alphabetically by name
    console.log('🔤 Sorting exercises alphabetically...');
    formattedExercises.sort((a, b) => a.name.localeCompare(b.name));
    
    // Create backup of original file
    const backupPath = `${exerciseFilePath}.backup.${Date.now()}`;
    fs.copyFileSync(exerciseFilePath, backupPath);
    console.log(`💾 Backup created: ${backupPath}`);
    
    // Write formatted data back to file
    fs.writeFileSync(exerciseFilePath, JSON.stringify(formattedExercises, null, 2));
    
    console.log('✅ Exercise data formatting complete!');
    console.log(`   • ${exerciseData.length} exercises processed`);
    console.log(`   • Names formatted to title case`);
    console.log(`   • Exercises sorted alphabetically`);
    console.log(`   • Original backed up to: ${path.basename(backupPath)}`);
    
    // Show some examples
    console.log('\n📋 Sample formatted names:');
    formattedExercises.slice(0, 5).forEach((exercise, index) => {
      console.log(`   ${index + 1}. ${exercise.name}`);
    });
    
  } catch (error) {
    console.error('❌ Error processing exercise data:', error.message);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  formatExerciseData();
}

module.exports = { formatExerciseData, formatToTitleCase };