/**
 * Webpack loader to transform require() calls in useFrameSize.js
 * This runs BEFORE babel-loader to transform the require() to an import
 */
module.exports = function(source) {
  // Transform: const SafeAreaListener = require('react-native-safe-area-context').SafeAreaListener;
  // To: import { SafeAreaListener } from 'react-native-safe-area-context';
  if (source.includes("require('react-native-safe-area-context')")) {
    // Remove the require line (handle both const and var, and any whitespace)
    source = source.replace(
      /(const|var)\s+SafeAreaListener\s*=\s*require\s*\(\s*['"]react-native-safe-area-context['"]\s*\)\s*\.\s*SafeAreaListener\s*;?\s*/g,
      ''
    );
    
    // Find the existing import from react-native-safe-area-context
    // Handle multiline imports - find useSafeAreaFrame and add SafeAreaListener before the closing brace
    if (source.includes('useSafeAreaFrame') && source.includes("from 'react-native-safe-area-context'")) {
      // Check if SafeAreaListener is already imported
      if (!source.includes('SafeAreaListener')) {
        // Find the pattern: useSafeAreaFrame } from 'react-native-safe-area-context'
        // and replace with: useSafeAreaFrame, SafeAreaListener } from 'react-native-safe-area-context'
        source = source.replace(
          /(useSafeAreaFrame\s*)\}(\s*from\s*['"]react-native-safe-area-context['"])/,
          '$1, SafeAreaListener }$2'
        );
      }
    } else {
      // Add new import statement - find a good place after other imports
      const lines = source.split('\n');
      let insertIndex = -1;
      
      // Find the line with useSafeAreaFrame import or similar
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes("react-native-safe-area-context")) {
          insertIndex = i + 1;
          break;
        }
      }
      
      if (insertIndex === -1) {
        // Find first import statement
        for (let i = 0; i < lines.length; i++) {
          if (lines[i].startsWith('import ')) {
            insertIndex = i + 1;
            break;
          }
        }
      }
      
      if (insertIndex > -1) {
        lines.splice(insertIndex, 0, "import { SafeAreaListener } from 'react-native-safe-area-context';");
        source = lines.join('\n');
      }
    }
  }
  
  return source;
};

